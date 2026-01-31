'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import type { DerivUser, DerivAccount } from '@/lib/types';

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
          console.log("✅ Deriv WebSocket connected.");
          resolve();
        };
        this.ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data.req_id && this.message_callbacks.has(data.req_id)) {
              const callback = this.message_callbacks.get(data.req_id);
              if (data.error) {
                callback?.reject(data.error);
              } else {
                callback?.resolve(data);
              }
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
          this.message_callbacks.forEach((cb) => cb.reject(new Error("WebSocket disconnected.")));
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

  public async sendRequest(request: object, timeoutMs: number = 10000): Promise<any> {
    await this.connect();
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) throw new Error("WebSocket connection failed.");
    
    return new Promise((resolve, reject) => {
      const req_id = this.request_id++;
      const timeout = setTimeout(() => {
        this.message_callbacks.delete(req_id);
        reject(new Error(`Deriv API request timed out after ${timeoutMs / 1000} seconds.`));
      }, timeoutMs);

      this.message_callbacks.set(req_id, {
          resolve: (response) => { clearTimeout(timeout); resolve(response); },
          reject: (error) => { clearTimeout(timeout); reject(error); }
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
  logout: () => void;
  updateBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DerivUser | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<DerivAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // CRITICAL: Prevent multiple simultaneous verifications
  const isVerifying = useRef(false);
  const [api, setApi] = useState<DerivAPI | null>(null);

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;
    if (!appId) {
        console.error("❌ Deriv App ID is not configured.");
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
    console.log("🚪 Logging out and clearing session.");
    localStorage.removeItem('deriv_token');
    setUser(null);
    setSelectedAccount(null);
    isVerifying.current = false;
  }, []);
  
  // On initial load, check for a token in local storage
  useEffect(() => {
    // Don't run if the API isn't ready yet.
    if (!api) return;

    // This ref is a lock to prevent this effect from running multiple times
    // during development due to React's Strict Mode.
    if (isVerifying.current) {
        console.log("⚠️ Already verifying, skipping initial check...");
        return
    };

    const verifyToken = async (authToken: string): Promise<boolean> => {
        isVerifying.current = true;
        setIsLoading(true);

        try {
            console.log("🔐 Verifying token with Deriv...");
            const { authorize, error } = await api.authorize(authToken);

            if (error) {
                console.error("❌ Deriv API authorization failed:", error.message);
                logout();
                return false;
            }

            const fullUser = authorize as DerivUser;
            const realAccount = fullUser.account_list.find((acc: DerivAccount) => acc.is_virtual === 0);

            if (realAccount) {
                console.log("✅ Verification successful. User:", fullUser.email);
                setUser(fullUser);
                setSelectedAccount(realAccount);
                return true;
            } else {
                console.error("❌ No real Deriv account found for this user.");
                logout();
                return false;
            }
        } catch (e) {
            console.error("❌ Unexpected error during token verification:", e);
            logout();
            return false;
        } finally {
            isVerifying.current = false;
            setIsLoading(false);
        }
    };
    
    const checkStoredToken = async () => {
      // If a user object already exists, we are authenticated.
      if (user) {
        setIsLoading(false);
        return;
      }
    
      const storedToken = localStorage.getItem('deriv_token');
      if (storedToken) {
        await verifyToken(storedToken);
      } else {
        // If there's no token, we are done loading.
        setIsLoading(false);
      }
    };
    
    checkStoredToken();
  }, [api, logout, user]);
  
  const updateBalance = (newBalance: number) => {
    if (selectedAccount) {
      setSelectedAccount(prev => prev ? { ...prev, balance: newBalance } : null);
    }
  }

  const value = {
    isLinked: !!user && !isLoading,
    user,
    selectedAccount,
    isLoading,
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
