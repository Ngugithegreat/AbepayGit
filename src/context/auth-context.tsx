'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import type { DerivUser, DerivAccount } from '@/lib/types';

// Simplified WebSocket API wrapper
class DerivAPI {
  private ws: WebSocket | null = null;
  private app_id: number;
  private message_callbacks: Map<number, { resolve: (value: any) => void; reject: (reason?: any) => void; }> = new Map();
  private request_id: number = 1;
  private connecting: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  public onBalanceUpdate: ((balance: number) => void) | null = null;

  constructor({ app_id }: { app_id: number }) {
    this.app_id = app_id;
  }

  private async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.connecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      this.ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.app_id}`);

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
        this.connecting = false;
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        console.log("✅ WebSocket connected");
        this.connecting = false;
        resolve();
      };

      this.ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          
          // Check for balance update
          if (data.balance && !data.req_id) {
            console.log("💰 Balance update received:", data.balance);
            // Trigger a callback for balance updates
            if (this.onBalanceUpdate) {
              this.onBalanceUpdate(parseFloat(data.balance.balance));
            }
          }
          
          // Regular request/response handling
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
          console.error("Parse error:", e);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.ws = null;
        this.connecting = false;
        this.connectionPromise = null;
      };

      this.ws.onerror = (err) => {
        clearTimeout(timeout);
        console.error('WebSocket error:', err);
        this.connecting = false;
        this.connectionPromise = null;
        reject(err);
      };
    });

    return this.connectionPromise;
  }

  public async sendRequest(request: object, timeoutMs: number = 15000): Promise<any> {
    await this.connect();
    
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Connection failed");
    }
    
    return new Promise((resolve, reject) => {
      const req_id = this.request_id++;
      
      const timeout = setTimeout(() => {
        this.message_callbacks.delete(req_id);
        reject(new Error(`Timeout after ${timeoutMs}ms`));
      }, timeoutMs);

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
      
      this.ws!.send(JSON.stringify({ ...request, req_id }));
    });
  }

  async authorize(token: string) {
    return this.sendRequest({ authorize: token });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
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

let globalAuthLock = false;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DerivUser | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<DerivAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [api, setApi] = useState<DerivAPI | null>(null);
  
  const hasInitialized = useRef(false);

  const updateBalance = useCallback((newBalance: number) => {
    if (selectedAccount) {
      setSelectedAccount(prev => prev ? { ...prev, balance: newBalance } : null);
      
      // also update the balance in the main user object to persist it
      setUser(prevUser => {
        if (!prevUser) return null;
        const newAccountList = prevUser.account_list.map(acc => 
            acc.loginid === selectedAccount.loginid ? { ...acc, balance: newBalance } : acc
        );
        const updatedUser = { ...prevUser, account_list: newAccountList };
        
        if (prevUser.loginid === selectedAccount.loginid) {
            updatedUser.balance = newBalance;
        }
        
        localStorage.setItem('deriv_user', JSON.stringify(updatedUser));
        return updatedUser;
      });
    }
  }, [selectedAccount]);

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;
    if (!appId) {
      console.error("❌ No App ID");
      setIsLoading(false);
      return;
    }
    
    console.log("🔧 Init API");
    const derivApi = new DerivAPI({ app_id: Number(appId) });
    
    // Set balance update callback
    derivApi.onBalanceUpdate = (newBalance: number) => {
      console.log("💰 Balance updated to:", newBalance);
      updateBalance(newBalance);
    };
    
    setApi(derivApi);

    return () => {
      derivApi.disconnect();
    };
  }, [updateBalance]);

  const logout = useCallback(() => {
    console.log("🚪 Logout");
    localStorage.removeItem('deriv_user');
    localStorage.removeItem('deriv_token'); // Also clear any old tokens
    setUser(null);
    setSelectedAccount(null);
    globalAuthLock = false;
  }, []);

  const verifyToken = useCallback(async (token: string): Promise<boolean> => {
    if (!api) {
      console.error("❌ No API to verify token");
      return false;
    }
    
    if (globalAuthLock) {
      console.log("⚠️ Auth blocked by lock");
      return false;
    }
    globalAuthLock = true;
    console.log("🔐 Verifying token");

    try {
      const response = await api.authorize(token);

      console.log('=== DERIV API RESPONSE ===');
      console.log('Full response:', response);
      console.log('Authorize data:', response.authorize);
      console.log('Account list:', response.authorize?.account_list);
      
      if (response.error) {
        console.error("❌ Auth failed:", response.error.message);
        return false;
      }

      const authData = response.authorize as DerivUser;

      console.log('=== USER DATA ===');
      console.log('Full user:', authData);
      console.log('Email:', authData.email);
      console.log('All accounts:', authData.account_list);

      const authorizedLoginId = authData.loginid;
      const mainAccount = authData.account_list?.find(acc => acc.loginid === authorizedLoginId);

      if (!mainAccount) {
          console.error("❌ Authorized account not found in account list. This should not happen.");
          return false;
      }

      if (mainAccount.is_virtual === 0) {
            setSelectedAccount(mainAccount);
            console.log('=== SELECTED ACCOUNT ===');
            console.log('Real account found:', mainAccount);
            console.log('Account ID:', mainAccount.loginid);
            console.log('Currency:', mainAccount.currency);
            console.log('Balance:', mainAccount.balance);
            console.log('Balance type:', typeof mainAccount.balance);
      } else {
          const realAccount = authData.account_list?.find(acc => acc.is_virtual === 0);
          if (realAccount) {
              console.warn("⚠️ User logged in with virtual account, switching to first real account:", realAccount.loginid);
              setSelectedAccount(realAccount);
              console.log('=== SELECTED ACCOUNT ===');
              console.log('Real account found:', realAccount);
              console.log('Account ID:', realAccount.loginid);
              console.log('Currency:', realAccount.currency);
              console.log('Balance:', realAccount.balance);
              console.log('Balance type:', typeof realAccount.balance);
          } else {
              console.error("❌ User logged in with a virtual account, and no real accounts were found.");
              return false;
          }
      }

      setUser(authData);
      localStorage.setItem('deriv_user', JSON.stringify(authData));
      console.log("✅ Auth success:", authData.email);

      // Subscribe to balance updates
      try {
        await api.sendRequest({
          balance: 1,
          subscribe: 1
        });
        console.log("✅ Subscribed to balance updates");
      } catch (err) {
        console.error("Failed to subscribe to balance updates:", err);
      }

      return true;

    } catch (error: any) {
      console.error("❌ Auth error:", error.message);
      return false;
    } finally {
      globalAuthLock = false;
    }
  }, [api]);

  useEffect(() => {
    if (!api || hasInitialized.current) return;
    
    hasInitialized.current = true;

    const init = async () => {
      const storedUserJSON = localStorage.getItem('deriv_user');
      const tempToken = localStorage.getItem('deriv_token');

      if (storedUserJSON) {
        console.log("📦 User object found, re-hydrating session");
        const storedUser = JSON.parse(storedUserJSON) as DerivUser;
        setUser(storedUser);

        const mainLoginId = storedUser.loginid;
        const mainAccount = storedUser.account_list?.find(acc => acc.loginid === mainLoginId);
        
        let accountToSet: DerivAccount | null = null;
        if (mainAccount && mainAccount.is_virtual === 0) {
            accountToSet = mainAccount;
        } else {
            accountToSet = storedUser.account_list?.find(acc => acc.is_virtual === 0) || null;
        }
        
        setSelectedAccount(accountToSet);
        setIsLoading(false);
      } else if (tempToken) {
        // SLOW PATH: User just came back from OAuth. We have a temporary token.
        // We need to verify it, get the user object, store it, and delete the temp token.
        console.log("📦 Temp token found, verifying session");
        const success = await verifyToken(tempToken);
        if (success) {
          localStorage.removeItem('deriv_token'); // Clean up the temp token
        } else {
          // Verification failed, clean up everything.
          logout();
        }
        setIsLoading(false);
      } else {
        // NO-SESSION PATH: User is logged out.
        console.log("ℹ️ No session, not logged in");
        setIsLoading(false);
      }
    };
    
    // Give API time to connect before we check for tokens
    setTimeout(init, 2000);
  }, [api, verifyToken, logout]);

  const value: AuthContextType = {
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
