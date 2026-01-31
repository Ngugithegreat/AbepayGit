'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { DerivUser, DerivAccount } from '@/lib/types';

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
  const [api, setApi] = useState<any | null>(null);

  // Initialize the Deriv API WebSocket connection
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

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
    localStorage.removeItem('deriv_token');
    setToken(null);
    setUser(null);
    setSelectedAccount(null);
  }, []);

  const verifyToken = useCallback(async (authToken: string): Promise<boolean> => {
    if (!api) {
        setIsLoading(false);
        return false;
    }
    
    try {
        setIsLoading(true);
        const authorizeResponse = await api.authorize(authToken);

        if (!authorizeResponse) {
          logout();
          return false;
        }

        const { authorize, error } = authorizeResponse;

        if (error) {
            logout();
            return false;
        }

        const fullUser = authorize as DerivUser;
        const realAccount = fullUser.account_list.find((acc: DerivAccount) => acc.is_virtual === 0);

        if (realAccount) {
            setUser(fullUser);
            setSelectedAccount(realAccount);
            setToken(authToken);
            localStorage.setItem('deriv_token', authToken);
            return true;
        } else {
            logout();
            return false;
        }
    } catch (e: any) {
        logout();
        return false;
    } finally {
        setIsLoading(false);
    }
  }, [api, logout]);
  
  useEffect(() => {
    if (typeof window === 'undefined' || !api) {
        return;
    }
      
    const checkStoredToken = async () => {
        if (user) {
            setIsLoading(false);
            return;
        }
      
        const storedToken = localStorage.getItem('deriv_token');
        
        if (storedToken) {
          const isValid = await verifyToken(storedToken);
          
          if (!isValid) {
            localStorage.removeItem('deriv_token');
          }
        } else {
          setIsLoading(false);
        }
    };
    
    checkStoredToken();
  }, [api]);
  
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
    isLinked: !!user && !isLoading,
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
