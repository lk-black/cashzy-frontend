import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { useUserSettings } from './context/UserSettingsContext';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import MainApp from './components/MainApp';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const { user, isLoading: authLoading } = useAuth();
  const { settings } = useUserSettings();

  useEffect(() => {
    // Apply theme from settings
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  if (authLoading) {
    return <LoadingScreen />;
  }

  // Regular user mode
  if (!user) {
    return (
      <>
        <Toaster position="top-right" />
        <AuthForm onSuccess={() => {}} />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <MainApp />
    </>
  );
}

export default App;