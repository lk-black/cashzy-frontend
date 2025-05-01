import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export interface UserSettings {
  theme?: 'light' | 'dark';
  pin?: string | null;
  notifications?: {
    email?: boolean;
    push?: boolean;
    budgetAlerts?: boolean;
  };
  preferences?: {
    currency?: string;
    language?: string;
    dateFormat?: string;
  };
}

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setSettings({});
      setLoading(false);
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setSettings(data?.settings || {});
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!user) return;

    try {
      // Merge with existing settings
      const mergedSettings = {
        ...settings,
        ...newSettings
      };

      // Remove undefined values
      Object.keys(mergedSettings).forEach(key => {
        if (mergedSettings[key] === undefined) {
          delete mergedSettings[key];
        }
      });

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: mergedSettings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSettings(mergedSettings);
      return { success: true };
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast.error('Erro ao salvar configurações');
      throw error;
    }
  }, [user, settings]);

  const resetSettings = useCallback(async () => {
    if (!user) return;

    try {
      const defaultSettings: UserSettings = {
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          budgetAlerts: true
        },
        preferences: {
          currency: 'BRL',
          language: 'pt-BR',
          dateFormat: 'dd/MM/yyyy'
        }
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: defaultSettings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSettings(defaultSettings);
      toast.success('Configurações redefinidas com sucesso');
      return { success: true };
    } catch (error: any) {
      console.error('Error resetting settings:', error);
      toast.error('Erro ao redefinir configurações');
      throw error;
    }
  }, [user]);

  return {
    settings,
    updateSettings,
    resetSettings,
    loading
  };
}