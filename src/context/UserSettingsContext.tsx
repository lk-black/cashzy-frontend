import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

interface UserSettings {
  theme: 'light' | 'dark';
  pin: string | null;
  categories: any[];
  budgetLimits: any[];
  recurringExpenses: any[];
  [key: string]: any;
}

interface UserSettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  theme: 'dark',
  pin: null,
  categories: [],
  budgetLimits: [],
  recurringExpenses: []
};

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const UserSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserSettings();
    } else {
      setSettings(defaultSettings);
    }
  }, [user]);

  const fetchUserSettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.settings) {
        setSettings({ ...defaultSettings, ...data.settings });
      } else {
        await saveUserSettings(defaultSettings);
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
      toast.error('Erro ao carregar configurações');
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserSettings = async (newSettings: UserSettings) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: newSettings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error;
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      if (user) {
        await saveUserSettings(updatedSettings);
        toast.success('Configurações salvas com sucesso');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const resetSettings = async () => {
    try {
      setSettings(defaultSettings);
      
      if (user) {
        await saveUserSettings(defaultSettings);
      }
      
      toast.success('Configurações redefinidas com sucesso');
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Erro ao redefinir configurações');
    }
  };

  return (
    <UserSettingsContext.Provider value={{ settings, isLoading, updateSettings, resetSettings }}>
      {children}
    </UserSettingsContext.Provider>
  );
};

export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
};