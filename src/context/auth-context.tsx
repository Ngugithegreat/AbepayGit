'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { DerivUser, DerivAccount } from '@/lib/types';

// A more robust WebSocket wrapper for Deriv API
class DerivAPI {
  private ws: WebSocket | null = null;
  private app_id: number;
  private message_callbacks: Map<number, { resolve: (value: any) => void; reject: (reason?: any) => void; }> = new Map();
  private request_id: number = 1;
  private connection_promise: Promise<void> | null = null;

  constructor({ app_id }: { app_id: number }) {
    this.app_id = app_id;
  }

  private connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (this.connection_promise) return this.connection_promise;
    }
    
    this.connection_promise = new Promise((resolve, reject) => {
        this.ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.app_id}`);

        this.ws.onopen = () => {
            console.log("Deriv WebSocket connected.");
            resolve();
        };

        this.ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data.req_id && this.message_callbacks.has(data.req_id)) {
              const callback = this.message_callbacks.get(data.req_id);
              callback?.resolve(data);
              this.message_callbacks.delete(data.req_id);
            }
          } catch(e) {
            console.error("Failed to parse WebSocket message:", e)
          }
        };

        this.ws.onclose = () => {
          console.log('Deriv WebSocket disconnected');
          this.ws = null;
          this.connection_promise = null;
          // Reject any pending requests
          this.message_callbacks.forEach((callback) => {
            callback.reject(new Error("WebSocket disconnected."));
          });
          this.message_callbacks.clear();
        };

        this.ws.onerror = (err) => {
          console.error('Deriv WebSocket error:', err);
          this.ws = null;
          this.connection_promise = null;
          reject(err);
        };
    });
    return this.connection_promise;
  }

  public async sendRequest(request: object): Promise<any> {
    await this.connect();
    
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket connection failed or not open.");
    }
      
    return new Promise((resolve, reject) => {
      const req_id = this.request_id++;

      // Timeout to prevent requests from hanging forever
      const timeout = setTimeout(() => {
        this.message_callbacks.delete(req_id);
        reject(new Error(`Deriv API request timed out after 10 seconds.`));
      }, 10000);

      this.message_callbacks.set(req_id, {
          resolve: (response) => {
              clearTimeout(timeout);
              resolve(response);
          },
          reject: (error) => {
              clearTimeout(timeout);
              reject(error);
          }
      });
      
      this.ws.send(JSON.stringify({ ...request, req_id }));
    });
  }

  async authorize(token: string) {
    return this.sendRequest({ authorize: token });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}


interface AuthContextType {
  isLinked: boolean;
  user: DerivUser | null;
  selectedAccount: DerivAccount | null;
  isLoading: boolean;
  login: (token: string) => Promise<boolean>;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<DerivUser | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<DerivAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [api, setApi] = useState<DerivAPI | null>(null);

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;
    if (!appId) {
        console.error("Deriv App ID is not configured.");
        setIsLoading(false);
        return;
    }
    
    const derivApi = new DerivAPI({ app_id: Number(appId) });
    setApi(derivApi);

    return () => {
      derivApi.disconnect();
    };
  }, []);

  const logout = useCallback(() => {
    console.log("Logging out and clearing session.");
    localStorage.removeItem('deriv_token');
    setToken(null);
    setUser(null);
    setSelectedAccount(null);
  }, []);

  const verifyToken = useCallback(async (authToken: string): Promise<boolean> => {
    if (!api) {
        console.error("API not initialized yet.");
        return false;
    }
    setIsLoading(true);
    
    try {
        console.log("Verifying token with Deriv...");
        const authorizeResponse = await api.authorize(authToken);
        const { authorize, error } = authorizeResponse;

        if (error) {
            console.error("Deriv API authorization failed:", error.message);
            logout();
            return false;
        }

        const fullUser = authorize as DerivUser;
        const realAccount = fullUser.account_list.find((acc: DerivAccount) => acc.is_virtual === 0);

        if (realAccount) {
            console.log("Verification successful. User:", fullUser.email);
            
            setUser(fullUser);
            setSelectedAccount(realAccount);
            setToken(authToken);
            
            // We already have the token, this confirms it's valid
            localStorage.setItem('deriv_token', authToken);
            
            return true;
        } else {
            console.error("No real Deriv account found for this user.");
            logout();
            return false;
        }

    } catch (e) {
        console.error("An unexpected error occurred during token verification:", e);
        logout();
        return false;
    } finally {
        setIsLoading(false);
    }
  }, [api, logout]);
  
  useEffect(() => {
    const checkStoredToken = async () => {
        const storedToken = localStorage.getItem('deriv_token');
        
        if (storedToken && api) {
          console.log('📦 Found stored token, verifying...');
          const isValid = await verifyToken(storedToken);
          
          if (!isValid) {
            console.log('❌ Stored token invalid, clearing...');
            logout();
          }
        } else {
          console.log('ℹ️ No stored token found, setting isLoading to false.');
          setIsLoading(false);
        }
      };

      if (api) {
        checkStoredToken();
      }
  }, [api, verifyToken, logout]);
  
  const login = useCallback(async (authToken: string): Promise<boolean> => {
    return await verifyToken(authToken);
  }, [verifyToken]);

  const updateBalance = (newBalance: number) => {
    if (selectedAccount) {
        setSelectedAccount(prev => prev ? { ...prev, balance: newBalance } : null);
        if (user && user.loginid === selectedAccount.loginid) {
            setUser(prev => prev ? { ...prev, balance: newBalance } : null);
        }
    }
  }

  const value = {
    isLinked: !!token && !isLoading,
    user,
    selectedAccount,
    isLoading,
    login,
    logout,
    updateBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
