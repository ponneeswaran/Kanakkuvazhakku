
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Expense, Budget, Category, UserContext, UserProfile, ChatMessage, Income, IncomeCategory, IncomeStatus, LocalBackup } from '../types';
import { t } from '../utils/translations';
import { encryptData, decryptData } from '../utils/security';
import { sendBackupEmail, sendExportEmail } from '../services/emailService';

export type Theme = 'light' | 'dark';

interface DataContextType {
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
  restoreExpense: (expense: Expense) => void;
  addIncome: (income: Omit<Income, 'id' | 'createdAt' | 'status'>) => void;
  deleteIncome: (id: string) => void;
  restoreIncome: (income: Income) => void;
  markIncomeReceived: (id: string) => void;
  setBudget: (category: Category, limit: number) => void;
  getBudget: (category: Category) => number;
  currency: string;
  setCurrency: (symbol: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  setProfilePicture: (image: string) => void;
  userProfile: UserProfile | null;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  loginIdentifier: string;
  login: (identifier: string, password?: string) => Promise<boolean>;
  startSignup: (identifier: string) => boolean;
  completeOnboarding: (details: Partial<UserProfile>) => void;
  logout: () => void;
  checkUserExists: (identifier: string) => boolean;
  resetPassword: (identifier: string, newPassword: string) => boolean;
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  authError: string;
  chatHistory: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  backupData: (customKey?: string) => Promise<void>;
  exportData: () => Promise<void>;
  importData: (file: File, customKey?: string) => Promise<boolean>;
  restoreUserFromBackup: (file: File | string, customKey?: string) => Promise<boolean>;
  isSyncAuthRequired: boolean;
  completeSyncAuth: () => void;
  cancelSyncAuth: () => void;
  registerBiometric: () => Promise<boolean>;
  verifyBiometricLogin: (identifier: string) => Promise<boolean>;
  checkBiometricAvailability: (identifier: string) => boolean;
  isBiometricSupported: boolean;
  updateProfileState: (profile: UserProfile) => void;
  getLocalBackups: () => LocalBackup[];
  deleteLocalBackup: (id: string) => void;
  loadDemoData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY_EXPENSES = 'kanakku_expenses';
const STORAGE_KEY_INCOMES = 'kanakku_incomes';
const STORAGE_KEY_BUDGETS = 'kanakku_budgets';
const STORAGE_KEY_THEME = 'kanakku_theme';
const STORAGE_KEY_AUTH = 'kanakku_is_authenticated';
// Identity and Profile Storage
const STORAGE_KEY_IDENTITY_MAP = 'kanakku_identity_map'; // Maps identifier -> userId
const STORAGE_KEY_PROFILES_ENCRYPTED = 'kanakku_profiles_encrypted'; // Maps userId -> Encrypted UserProfile
const STORAGE_KEY_CURRENT_USER_ID = 'kanakku_current_user_id';
const STORAGE_KEY_LOCAL_BACKUPS = 'kanakku_local_backups';

// Default budgets removed for new users as requested
const DEFAULT_BUDGETS: Budget[] = [];

// Helper to get local YYYY-MM-DD to avoid UTC timezone issues
const getLocalToday = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to calculate next recurring date safely
const getNextDate = (dateStr: string, recurrence: string): string => {
    // Create date from string parts to avoid UTC shifting
    const parts = dateStr.split('-');
    const year = parseInt(parts[0]);
    const monthIndex = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    
    const d = new Date(year, monthIndex, day);
    
    if (recurrence === 'Monthly') {
        d.setMonth(d.getMonth() + 1);
        // Handle month end overflow (e.g. Jan 31 -> Feb 28/29)
        if (d.getDate() !== day) {
             d.setDate(0); // Set to last day of previous month
        }
    } else if (recurrence === 'Yearly') {
        d.setFullYear(d.getFullYear() + 1);
    }
    
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dt}`;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [theme, setThemeState] = useState<Theme>('light');
  
  // Auth & Profile State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(false);
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState('');
  
  // Chat History State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Sync Auth State
  const [isSyncAuthRequired, setIsSyncAuthRequired] = useState<boolean>(false);

  // Biometric State
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  // Derived State (for compatibility)
  const currency = userProfile?.currency || '₹';
  const userName = userProfile?.name || '';
  const language = userProfile?.language || 'en';

  // Load data on mount
  useEffect(() => {
    const storedExpenses = localStorage.getItem(STORAGE_KEY_EXPENSES);
    const storedIncomes = localStorage.getItem(STORAGE_KEY_INCOMES);
    const storedBudgets = localStorage.getItem(STORAGE_KEY_BUDGETS);
    const storedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    // Use sessionStorage for Auth so it clears when app/tab is closed
    const storedAuth = sessionStorage.getItem(STORAGE_KEY_AUTH);
    const storedCurrentUserId = localStorage.getItem(STORAGE_KEY_CURRENT_USER_ID);

    if (storedExpenses) {
      setExpenses(JSON.parse(storedExpenses));
    } else {
      setExpenses([]);
    }

    if (storedIncomes) {
      let parsedIncomes: Income[] = JSON.parse(storedIncomes);
      const today = getLocalToday();
      let hasChanges = false;
      
      parsedIncomes = parsedIncomes.map(inc => {
        // Fix 1: Mark overdue if expected and date is past
        if (inc.status === 'Expected' && inc.date < today) {
           hasChanges = true;
           return { ...inc, status: 'Overdue' };
        }
        // Fix 2: Self-heal incorrect 'Overdue' status for future dates
        if (inc.status === 'Overdue' && inc.date >= today) {
           hasChanges = true;
           return { ...inc, status: 'Expected' };
        }
        return inc;
      });

      setIncomes(parsedIncomes);
      if(hasChanges) {
          localStorage.setItem(STORAGE_KEY_INCOMES, JSON.stringify(parsedIncomes));
      }
    } else {
      setIncomes([]);
    }

    if (storedBudgets) {
      setBudgets(JSON.parse(storedBudgets));
    } else {
      setBudgets(DEFAULT_BUDGETS);
    }

    if (storedTheme) {
      setThemeState(storedTheme as Theme);
    }

    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      
      // Try to restore user profile
      if (storedCurrentUserId) {
        const encryptedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES_ENCRYPTED);
        if (encryptedProfiles) {
            const profiles = decryptData(encryptedProfiles) || {};
            const profile = profiles[storedCurrentUserId];
            if (profile) {
                setUserProfile(profile);
                setIsOnboardingComplete(true);
            } else {
                // Auth is true, but profile missing/incomplete -> Onboarding
                setIsOnboardingComplete(false); 
            }
        } else {
            setIsOnboardingComplete(false);
        }
      } else {
        // Auth is true, but no user ID -> Onboarding (e.g. fresh signup initiated)
        setIsOnboardingComplete(false);
      }
    }

    // Check Biometric Support
    if (window.PublicKeyCredential && 
        window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
            window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(available => {
                setIsBiometricSupported(available);
            });
    }
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INCOMES, JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
  }, [budgets]);

  // Apply theme to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }, [theme]);

  const addExpense = (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const restoreExpense = (expense: Expense) => {
    setExpenses(prev => [...prev, expense]);
  };

  // Income Methods
  const addIncome = (income: Omit<Income, 'id' | 'createdAt' | 'status'>) => {
      const today = getLocalToday();
      
      // Determine if the user is entering a past income (Received) or future (Expected)
      const isPast = income.date <= today;

      // 1. Create the primary entry based on user input
      const mainStatus: IncomeStatus = isPast ? 'Received' : 'Expected';
      const mainEntry: Income = {
          ...income,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          status: mainStatus
      };

      const newEntries = [mainEntry];

      // 2. Intelligence: If user enters a PAST income that is RECURRING,
      //    we should immediately generate the NEXT upcoming income entry.
      //    This solves the issue where entering "Last Month's Salary" doesn't show "This Month's Salary" as upcoming.
      if (isPast && income.recurrence !== 'None') {
          const nextDateStr = getNextDate(income.date, income.recurrence);
          
          // Determine status of next entry (Overdue if date is strictly before today)
          const nextStatus: IncomeStatus = nextDateStr < today ? 'Overdue' : 'Expected';

          const nextEntry: Income = {
              ...income,
              id: crypto.randomUUID(),
              createdAt: Date.now() + 1, // Ensure it appears "after" the main entry in default sorts
              date: nextDateStr,
              status: nextStatus
          };
          newEntries.push(nextEntry);
      }

      setIncomes(prev => [...newEntries, ...prev]);
  };

  const deleteIncome = (id: string) => {
      setIncomes(prev => prev.filter(i => i.id !== id));
  };

  const restoreIncome = (income: Income) => {
      setIncomes(prev => [...prev, income]);
  };

  const markIncomeReceived = (id: string) => {
      setIncomes(prev => {
          const income = prev.find(i => i.id === id);
          if (!income) return prev;

          const today = getLocalToday();

          // 1. Mark current as Received
          // Note: We update the date to "Today" to reflect actual cash flow, 
          // but we use the ORIGINAL date for calculating the next recurrence interval to avoid drift.
          const originalDateStr = income.date;
          const updatedIncome = { 
              ...income, 
              status: 'Received' as IncomeStatus, 
              date: today
          }; 
          
          const others = prev.filter(i => i.id !== id);
          
          let nextIncome: Income | null = null;

          // 2. Generate Next Recurrence if needed
          if (income.recurrence !== 'None') {
              const nextDateStr = getNextDate(originalDateStr, income.recurrence);

              nextIncome = {
                  ...income,
                  id: crypto.randomUUID(),
                  date: nextDateStr,
                  // Correctly set status based on strict comparison with today
                  status: nextDateStr < today ? 'Overdue' : 'Expected',
                  createdAt: Date.now() + 1 // Ensure it's treated as newer
              };
          }

          if (nextIncome) {
              return [nextIncome, updatedIncome, ...others];
          }
          return [updatedIncome, ...others];
      });
  };

  const setBudget = (category: Category, limit: number) => {
    setBudgets(prev => {
      const filtered = prev.filter(b => b.category !== category);
      return [...filtered, { category, limit }];
    });
  };

  const getBudget = (category: Category) => {
    return budgets.find(b => b.category === category)?.limit || 0;
  };

  const updateProfileState = (profile: UserProfile) => {
    setUserProfile(profile);
    // Update Persistent Storage with Encryption
    const encryptedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES_ENCRYPTED);
    const profiles = encryptedProfiles ? decryptData(encryptedProfiles) : {};
    profiles[profile.id] = profile;
    localStorage.setItem(STORAGE_KEY_PROFILES_ENCRYPTED, encryptData(profiles));
  };

  const setUserName = (name: string) => {
    if (userProfile) {
      updateProfileState({ ...userProfile, name });
    }
  };

  const setProfilePicture = (image: string) => {
    if (userProfile) {
      updateProfileState({ ...userProfile, profilePicture: image });
    }
  }

  const setCurrency = (symbol: string) => {
    if (userProfile) {
      updateProfileState({ ...userProfile, currency: symbol });
    }
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const setLanguage = (lang: string) => {
    if (userProfile) {
      updateProfileState({ ...userProfile, language: lang });
    }
  }

  const login = async (identifier: string, password?: string): Promise<boolean> => {
    setAuthError('');
    const identityMap = JSON.parse(localStorage.getItem(STORAGE_KEY_IDENTITY_MAP) || '{}');
    const existingUserId = identityMap[identifier];
    
    setLoginIdentifier(identifier);

    if (existingUserId) {
      const encryptedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES_ENCRYPTED);
      if (encryptedProfiles) {
          const profiles = decryptData(encryptedProfiles);
          const profile = profiles[existingUserId] as UserProfile;
          
          if (profile) {
              // Password Check
              if (profile.password === password) {
                  setUserProfile(profile);
                  setIsOnboardingComplete(true);
                  setIsAuthenticated(true);
                  sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
                  localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, existingUserId);
                  return true;
              } else {
                  setAuthError('Invalid credentials');
                  return false;
              }
          }
      }
    }

    // User not found
    setAuthError('User not found');
    return false;
  };

  const startSignup = (identifier: string): boolean => {
      setAuthError('');
      const identityMap = JSON.parse(localStorage.getItem(STORAGE_KEY_IDENTITY_MAP) || '{}');
      if (identityMap[identifier]) {
          // User already exists
          return false; 
      }
      
      setLoginIdentifier(identifier);
      setUserProfile(null);
      // Important: Order matters. Set Onboarding false first, then Auth true.
      // Also persist Auth=true to storage so refresh doesn't kick user out.
      setIsOnboardingComplete(false); 
      setIsAuthenticated(true); 
      sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER_ID); // Ensure no user ID is set yet
      return true;
  }

  const completeOnboarding = (details: Partial<UserProfile>) => {
    const newUserId = crypto.randomUUID();
    
    const newProfile: UserProfile = {
      id: newUserId,
      name: details.name || 'User',
      email: details.email || '',
      mobile: details.mobile || '',
      language: details.language || 'en',
      currency: details.currency || '₹',
      password: details.password || ''
    };

    // Save Profile Encrypted
    const encryptedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES_ENCRYPTED);
    const profiles = encryptedProfiles ? decryptData(encryptedProfiles) : {};
    profiles[newUserId] = newProfile;
    localStorage.setItem(STORAGE_KEY_PROFILES_ENCRYPTED, encryptData(profiles));

    // Link Identifiers
    const identityMap = JSON.parse(localStorage.getItem(STORAGE_KEY_IDENTITY_MAP) || '{}');
    if (newProfile.mobile) identityMap[newProfile.mobile] = newUserId;
    if (newProfile.email) identityMap[newProfile.email] = newUserId;
    
    // Link current login identifier if not handled
    if (loginIdentifier && !identityMap[loginIdentifier]) {
        identityMap[loginIdentifier] = newUserId;
    }

    localStorage.setItem(STORAGE_KEY_IDENTITY_MAP, JSON.stringify(identityMap));
    localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, newUserId);

    setUserProfile(newProfile);
    setIsAuthenticated(true);
    sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
    setIsOnboardingComplete(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsOnboardingComplete(false);
    setUserProfile(null);
    sessionStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER_ID);
    setChatHistory([]); // Clear chat history on logout
  };

  const checkUserExists = (identifier: string): boolean => {
    const identityMap = JSON.parse(localStorage.getItem(STORAGE_KEY_IDENTITY_MAP) || '{}');
    return !!identityMap[identifier];
  };

  const resetPassword = (identifier: string, newPassword: string): boolean => {
    const identityMap = JSON.parse(localStorage.getItem(STORAGE_KEY_IDENTITY_MAP) || '{}');
    const userId = identityMap[identifier];
    if (!userId) return false;

    const encryptedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES_ENCRYPTED);
    if (!encryptedProfiles) return false;

    const profiles = decryptData(encryptedProfiles);
    if (!profiles || !profiles[userId]) return false;

    profiles[userId].password = newPassword;
    localStorage.setItem(STORAGE_KEY_PROFILES_ENCRYPTED, encryptData(profiles));
    return true;
  };

  const addChatMessage = (message: ChatMessage) => {
    setChatHistory(prev => [...prev, message]);
  };

  // --- Biometric Authentication ---
  
  const checkBiometricAvailability = (identifier: string): boolean => {
      const identityMap = JSON.parse(localStorage.getItem(STORAGE_KEY_IDENTITY_MAP) || '{}');
      const userId = identityMap[identifier];
      if (!userId) return false;

      const encryptedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES_ENCRYPTED);
      if (!encryptedProfiles) return false;

      const profiles = decryptData(encryptedProfiles);
      const profile = profiles[userId] as UserProfile;
      
      return !!(profile && profile.biometricEnabled && profile.biometricCredentialId);
  }

  const registerBiometric = async (): Promise<boolean> => {
      if (!userProfile) return false;
      try {
          // Generate challenge
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          
          const credential = await navigator.credentials.create({
              publicKey: {
                  challenge,
                  rp: { name: "Kanakkuvazhakku" },
                  user: {
                      id: new TextEncoder().encode(userProfile.id),
                      name: userProfile.email || userProfile.mobile,
                      displayName: userProfile.name
                  },
                  pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
                  authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
                  timeout: 60000,
                  attestation: "none"
              }
          }) as PublicKeyCredential;

          if (credential) {
              // Store rawId as base64
              const rawId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
              const updatedProfile = { ...userProfile, biometricEnabled: true, biometricCredentialId: rawId };
              updateProfileState(updatedProfile);
              return true;
          }
      } catch (e) {
          console.error("Biometric registration failed:", e);
      }
      return false;
  };

  const verifyBiometricLogin = async (identifier: string): Promise<boolean> => {
       const identityMap = JSON.parse(localStorage.getItem(STORAGE_KEY_IDENTITY_MAP) || '{}');
       const userId = identityMap[identifier];
       if (!userId) return false;
       
       const encryptedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES_ENCRYPTED);
       if (!encryptedProfiles) return false;
       const profiles = decryptData(encryptedProfiles);
       const profile = profiles[userId] as UserProfile;

       if (!profile || !profile.biometricEnabled || !profile.biometricCredentialId) return false;

       try {
           const challenge = new Uint8Array(32);
           window.crypto.getRandomValues(challenge);

           // Convert base64 credential ID back to BufferSource
           const binaryString = atob(profile.biometricCredentialId);
           const len = binaryString.length;
           const bytes = new Uint8Array(len);
           for (let i = 0; i < len; i++) {
               bytes[i] = binaryString.charCodeAt(i);
           }

           const assertion = await navigator.credentials.get({
               publicKey: {
                   challenge,
                   rpId: window.location.hostname,
                   allowCredentials: [{
                       type: "public-key",
                       id: bytes,
                       transports: ["internal"]
                   }],
                   userVerification: "required"
               }
           });

           if (assertion) {
               // In a real app, verify signature on server.
               // Here we assume success if browser verification passes.
               setUserProfile(profile);
               setIsAuthenticated(true);
               sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
               localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, userId);
               setIsOnboardingComplete(true);
               return true;
           }
       } catch (e) {
           console.error("Biometric verification failed:", e);
       }
       return false;
  };

  // --- Backup & Restore ---

  const getLocalBackups = (): LocalBackup[] => {
      const stored = localStorage.getItem(STORAGE_KEY_LOCAL_BACKUPS);
      return stored ? JSON.parse(stored) : [];
  }

  const saveLocalBackup = (encryptedContent: string) => {
      if (!userProfile) return;
      
      const newBackup: LocalBackup = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          userName: userProfile.name,
          content: encryptedContent,
          size: encryptedContent.length // approximate size
      };

      const backups = getLocalBackups();
      // Keep only last 5 backups
      const updatedBackups = [newBackup, ...backups].slice(0, 5);
      localStorage.setItem(STORAGE_KEY_LOCAL_BACKUPS, JSON.stringify(updatedBackups));
  }

  const deleteLocalBackup = (id: string) => {
      const backups = getLocalBackups();
      const updated = backups.filter(b => b.id !== id);
      localStorage.setItem(STORAGE_KEY_LOCAL_BACKUPS, JSON.stringify(updated));
  }

  const backupData = async (customKey?: string) => {
      if (!userProfile) return;

      const backupObj = {
          metadata: {
              userId: userProfile.id,
              email: userProfile.email,
              version: '1.0',
              timestamp: Date.now()
          },
          userProfile: userProfile,
          data: {
              expenses,
              incomes,
              budgets
          }
      };
      
      const encrypted = encryptData(backupObj, customKey);
      
      // Save locally first
      saveLocalBackup(encrypted);
      
      // Then offer to share/download
      const email = userProfile.email || 'user@example.com';
      await sendBackupEmail(email, encrypted);
  };

  const importData = async (file: File, customKey?: string): Promise<boolean> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
              const content = e.target?.result as string;
              if (content) {
                  const data = decryptData(content.trim(), customKey);
                  if (data) {
                      // Validate if it has minimal structure
                      if (data.userProfile && data.data) {
                          // Restore data
                          setExpenses(data.data.expenses || []);
                          setIncomes(data.data.incomes || []);
                          setBudgets(data.data.budgets || []);
                          
                          // Merge/Update User Profile (except ID to prevent overwriting identity entirely, but typically backup restore implies full restore)
                          // For safety in this demo, we assume the user intends to replace data.
                          // If IDs match, it's fine. If different, we might be overwriting current user session data.
                          if (userProfile && data.userProfile.id === userProfile.id) {
                              updateProfileState(data.userProfile);
                          }
                          resolve(true);
                      } else {
                          reject(new Error('INVALID_FORMAT'));
                      }
                  } else {
                      // Decryption failed (or returned null)
                      reject(new Error('DECRYPTION_FAILED'));
                  }
              }
          };
          reader.readAsText(file);
      });
  };

  const restoreUserFromBackup = async (fileOrContent: File | string, customKey?: string): Promise<boolean> => {
      // Helper to process decrypted data
      const processData = (data: any) => {
          if (data && data.userProfile && data.data) {
              // 1. Restore Profile to Storage
              const profile = data.userProfile;
              const encryptedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES_ENCRYPTED);
              const profiles = encryptedProfiles ? decryptData(encryptedProfiles) : {};
              profiles[profile.id] = profile;
              localStorage.setItem(STORAGE_KEY_PROFILES_ENCRYPTED, encryptData(profiles));

              // 2. Update Identity Map
              const identityMap = JSON.parse(localStorage.getItem(STORAGE_KEY_IDENTITY_MAP) || '{}');
              if (profile.mobile) identityMap[profile.mobile] = profile.id;
              if (profile.email) identityMap[profile.email] = profile.id;
              localStorage.setItem(STORAGE_KEY_IDENTITY_MAP, JSON.stringify(identityMap));

              // 3. Login User
              localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, profile.id);
              setUserProfile(profile);
              setIsAuthenticated(true);
              setIsOnboardingComplete(true);
              sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');

              // 4. Restore Data
              setExpenses(data.data.expenses || []);
              setIncomes(data.data.incomes || []);
              setBudgets(data.data.budgets || []);
              return true;
          }
          return false;
      };

      if (typeof fileOrContent === 'string') {
          // It's content string (e.g. from local backup)
          const data = decryptData(fileOrContent, customKey);
          if (!data) throw new Error('DECRYPTION_FAILED');
          return processData(data);
      } else {
          // It's a file
          return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                  const content = e.target?.result as string;
                  if (content) {
                      const data = decryptData(content.trim(), customKey);
                      if (data) {
                          const success = processData(data);
                          if(success) resolve(true);
                          else reject(new Error('INVALID_FORMAT'));
                      } else {
                          reject(new Error('DECRYPTION_FAILED'));
                      }
                  }
              };
              reader.readAsText(fileOrContent);
          });
      }
  };

  const exportData = async () => {
      const header = "Date,Type,Category,Description,Amount,Method\n";
      const expRows = expenses.map(e => 
          `${e.date},Expense,${e.category},"${e.description}",${e.amount},${e.paymentMethod}`
      ).join("\n");
      
      const incRows = incomes.map(i => 
          `${i.date},Income,${i.category},"${i.source}",${i.amount},${i.recurrence}`
      ).join("\n");

      const csv = header + expRows + "\n" + incRows;
      const email = userProfile?.email || 'user@example.com';
      
      await sendExportEmail(email, csv);
  };
  
  // Dummy implementation for demo data loading (as per interface)
  const loadDemoData = () => {
      // In a real app this would be imported from utils/demoData
      // For now, we keep it empty or simple since the file was removed in previous steps.
      console.log("Demo data loading triggered (placeholder)");
  }

  // Sync Auth Dummy Implementations
  const completeSyncAuth = () => setIsSyncAuthRequired(false);
  const cancelSyncAuth = () => setIsSyncAuthRequired(false);

  // Expose context
  const value: DataContextType = {
    expenses,
    incomes,
    budgets,
    addExpense,
    deleteExpense,
    restoreExpense,
    addIncome,
    deleteIncome,
    restoreIncome,
    markIncomeReceived,
    setBudget,
    getBudget,
    currency,
    setCurrency,
    userName,
    setUserName,
    userProfile,
    setProfilePicture,
    theme,
    setTheme,
    isAuthenticated,
    isOnboardingComplete,
    loginIdentifier,
    login,
    startSignup,
    completeOnboarding,
    logout,
    checkUserExists,
    resetPassword,
    language,
    setLanguage,
    t: (key) => t(language, key),
    authError,
    chatHistory,
    addChatMessage,
    backupData,
    exportData,
    importData,
    restoreUserFromBackup,
    isSyncAuthRequired,
    completeSyncAuth,
    cancelSyncAuth,
    registerBiometric,
    verifyBiometricLogin,
    checkBiometricAvailability,
    isBiometricSupported,
    updateProfileState,
    getLocalBackups,
    deleteLocalBackup,
    loadDemoData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
