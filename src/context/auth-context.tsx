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
          if (data.balance) { // This can be a response to a request or a subscription update
            console.log("💰 Balance update received:", data.balance);
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
  refreshBalance: () => Promise<void>;
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

  const refreshBalance = useCallback(async () => {
    if (!api || !selectedAccount) {
      console.log("Cannot refresh: No API or selected account");
      return;
    }
    console.log("🔄 Requesting balance refresh...");
    try {
      await api.sendRequest({ balance: 1 });
      console.log("✅ Balance refresh request sent.");
    } catch (error) {
      console.error("❌ Failed to send balance refresh request:", error);
    }
  }, [api, selectedAccount]);

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;
    if (!appId) {
      setIsLoading(false);
      return;
    }
    
    console.log("🔧 Init API");
    const derivApi = new DerivAPI({ app_id: Number(appId) });
    
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
    localStorage.removeItem('deriv_token');
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
      
      if (response.error) {
        console.error("❌ Auth failed:", response.error.message);
        logout();
        return false;
      }
      
      const authData = response.authorize as DerivUser;
      localStorage.setItem('deriv_token', token);

      console.log('=== USER DATA ===');
      console.log('Full user:', authData);
      console.log('Email:', authData.email);
      console.log('All accounts:', authData.account_list);

      const authorizedLoginId = authData.loginid;
      let localSelectedAccount: DerivAccount | null = null;
      
      const clientAccount = authData.account_list?.find(acc => acc.is_virtual === 0);

      if (clientAccount) {
          localSelectedAccount = clientAccount;
          console.log('=== SELECTED CLIENT ACCOUNT ===');
          console.log('Account ID:', localSelectedAccount.loginid);
          console.log('Currency:', localSelectedAccount.currency);
          console.log('Initial Balance:', localSelectedAccount.balance);
      } else {
          console.error("❌ No real client accounts were found.");
          logout();
          return false;
      }

      setSelectedAccount(localSelectedAccount);
      setUser(authData);
      localStorage.setItem('deriv_user', JSON.stringify(authData));
      console.log("✅ Auth success:", authData.email);

      if (localSelectedAccount && localSelectedAccount.loginid !== authorizedLoginId) {
        console.log(`🔌 Authorized as ${authorizedLoginId}, but need balance for ${localSelectedAccount.loginid}. Switching accounts...`);
        try {
          const switchResponse = await api.sendRequest({ account_switch: localSelectedAccount.loginid });
          if (switchResponse.error) {
            throw new Error(`Failed to switch to account ${localSelectedAccount.loginid}: ${switchResponse.error.message}`);
          }
          console.log(`✅ Switched to account ${localSelectedAccount.loginid} for balance updates.`);
        } catch (switchError) {
          console.error("❌ Account switch failed:", switchError);
          logout();
          return false;
        }
      }

      try {
        await api.sendRequest({
          balance: 1,
          subscribe: 1
        });
        console.log(`✅ Subscribed to balance updates for ${localSelectedAccount?.loginid}`);
      } catch (err) {
        console.error("Failed to subscribe to balance updates:", err);
      }

      return true;

    } catch (error: any) {
      console.error("❌ Auth error:", error.message);
      logout();
      return false;
    } finally {
      globalAuthLock = false;
    }
  }, [api, logout]);

  useEffect(() => {
    if (!api || hasInitialized.current) return;
    
    hasInitialized.current = true;

    const init = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('deriv_token');

      if (token) {
        console.log("📦 Token found from previous session, verifying...");
        const success = await verifyToken(token);
        if (!success) {
          console.log("⚠️ Token invalid, logging out.");
          logout();
        }
      } else {
        console.log("ℹ️ No session token found. User is likely logged out.");
      }
      setIsLoading(false);
    };
    
    setTimeout(init, 1500);
  }, [api, verifyToken, logout]);

  const value: AuthContextType = {
    isLinked: !!user && !isLoading,
    user,
    selectedAccount,
    isLoading,
    logout,
    updateBalance,
    refreshBalance,
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
