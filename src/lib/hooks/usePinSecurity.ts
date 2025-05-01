import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

interface PinSettings {
  pin: string | null;
  attempts: number;
  lockoutUntil: string | null;
}

export function usePinSecurity() {
  const { user } = useAuth();
  const [pin, setPin] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false); // Changed initial state to false
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPinSettings();
    } else {
      resetState();
    }
  }, [user]);

  // Auto-lock after inactivity
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      if (pin) {
        inactivityTimer = setTimeout(lockApp, 5 * 60 * 1000); // 5 minutes
      }
    };

    // Add event listeners for user activity
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    // Start timer only if PIN is set
    if (pin) {
      resetTimer();
    }

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [pin]);

  const resetState = () => {
    setPin(null);
    setIsLocked(false);
    setAttempts(0);
    setLockoutUntil(null);
    setLoading(false);
  };

  const loadPinSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: userData, error: userDataError } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', user.id)
        .eq('type', 'pin_security')
        .maybeSingle();

      if (userDataError) {
        console.error('Error loading PIN settings:', userDataError);
        throw userDataError;
      }

      // If found in user_data, use that
      if (userData?.data) {
        const settings = userData.data as PinSettings;
        setPin(settings.pin);
        setAttempts(settings.attempts);
        setLockoutUntil(settings.lockoutUntil);
        setIsLocked(!!settings.pin); // Only lock if PIN exists
        return;
      }

      // If not found, check legacy user_settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error loading legacy settings:', settingsError);
        throw settingsError;
      }

      // If found in legacy settings, migrate to user_data
      if (settingsData?.settings?.pin_security) {
        const settings = settingsData.settings.pin_security as PinSettings;
        await savePinSettings(settings);
        setPin(settings.pin);
        setAttempts(settings.attempts);
        setLockoutUntil(settings.lockoutUntil);
        setIsLocked(!!settings.pin); // Only lock if PIN exists
        return;
      }

      // If not found anywhere, initialize with defaults
      const defaultSettings: PinSettings = {
        pin: null,
        attempts: 0,
        lockoutUntil: null
      };

      await savePinSettings(defaultSettings);
      setPin(null);
      setAttempts(0);
      setLockoutUntil(null);
      setIsLocked(false);

    } catch (error: any) {
      console.error('Error loading PIN settings:', error);
      toast.error('Erro ao carregar configurações do PIN');
      resetState();
    } finally {
      setLoading(false);
    }
  };

  const savePinSettings = async (settings: PinSettings) => {
    if (!user) return;

    try {
      const { data: existingData, error: checkError } = await supabase
        .from('user_data')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'pin_security')
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingData?.id) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('user_data')
          .update({
            data: settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('user_data')
          .insert({
            user_id: user.id,
            type: 'pin_security',
            data: settings
          });

        if (insertError) throw insertError;
      }

      // Update local state
      setPin(settings.pin);
      setAttempts(settings.attempts);
      setLockoutUntil(settings.lockoutUntil);
      setIsLocked(!!settings.pin); // Only lock if PIN exists

    } catch (error: any) {
      console.error('Error saving PIN settings:', error);
      throw new Error('Erro ao salvar configurações do PIN');
    }
  };

  const setSecurityPin = async (newPin: string | null) => {
    try {
      // Validate PIN format if setting a new one
      if (newPin !== null) {
        if (!/^\d{4}$/.test(newPin)) {
          throw new Error('O PIN deve ter 4 dígitos');
        }
      }

      const settings: PinSettings = {
        pin: newPin,
        attempts: 0,
        lockoutUntil: null
      };

      await savePinSettings(settings);
      toast.success(newPin ? 'PIN configurado com sucesso' : 'PIN removido com sucesso');

    } catch (error: any) {
      console.error('Error setting PIN:', error);
      toast.error(error.message || 'Erro ao configurar PIN');
      throw error;
    }
  };

  const verifyPin = async (enteredPin: string): Promise<boolean> => {
    if (!pin) return true;

    // Check lockout
    if (lockoutUntil) {
      const lockoutTime = new Date(lockoutUntil).getTime();
      const now = new Date().getTime();
      
      if (now < lockoutTime) {
        const remainingMinutes = Math.ceil((lockoutTime - now) / 60000);
        toast.error(`Tente novamente em ${remainingMinutes} minutos`);
        return false;
      }
      
      // Reset lockout if expired
      await savePinSettings({
        pin,
        attempts: 0,
        lockoutUntil: null
      });
    }

    // Verify PIN
    if (enteredPin === pin) {
      await savePinSettings({
        pin,
        attempts: 0,
        lockoutUntil: null
      });
      setIsLocked(false);
      return true;
    }

    // Handle failed attempt
    const newAttempts = attempts + 1;
    let newLockoutUntil = null;

    if (newAttempts >= 3) {
      newLockoutUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      toast.error('Muitas tentativas. Tente novamente em 5 minutos.');
    } else {
      toast.error(`PIN incorreto. ${3 - newAttempts} tentativas restantes.`);
    }

    await savePinSettings({
      pin,
      attempts: newAttempts,
      lockoutUntil: newLockoutUntil
    });

    return false;
  };

  const lockApp = () => {
    if (pin) {
      setIsLocked(true);
    }
  };

  return {
    pin,
    isLocked,
    loading,
    setSecurityPin,
    verifyPin,
    lockApp,
    hasLockout: !!lockoutUntil,
    remainingAttempts: 3 - attempts
  };
}