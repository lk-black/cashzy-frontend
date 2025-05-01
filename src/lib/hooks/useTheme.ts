import { useState, useEffect } from 'react';
import { useSettings } from './useSettings';

export function useTheme() {
  const { settings, updateSettings } = useSettings();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    // Sync with settings when they load
    if (settings.theme) {
      setIsDark(settings.theme === 'dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Update settings when theme changes
    updateSettings({ theme: isDark ? 'dark' : 'light' }).catch(console.error);
  }, [isDark, updateSettings]);

  return { isDark, setIsDark };
}