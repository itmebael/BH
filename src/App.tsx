import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import WelcomeScreen from './components/WelcomeScreen';
import RoleSelectionScreen from './components/RoleSelectionScreen';
import LoginScreen from './components/LoginScreen';
import CreateAccountScreen from './components/CreateAccountScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import EmailVerificationScreen from './components/EmailVerificationScreen';
import ClientDashboard from './components/ClientDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import AdminDashboard from './components/AdminDashboard';

type Screen = 'welcome' | 'roleSelection' | 'login' | 'createAccount' | 'resetPassword' | 'emailVerification' | 'clientDashboard' | 'ownerDashboard' | 'adminDashboard';
type UserType = 'client' | 'owner' | 'admin' | null;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [selectedUserType, setSelectedUserType] = useState<UserType>(null);

  // Check for email verification token in URL on mount
  useEffect(() => {
    let detectedToken: string | null = null;
    
    // Check hash fragments (Supabase uses these for tokens)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      detectedToken = hashParams.get('access_token') || hashParams.get('token');
      const hashType = hashParams.get('type');
      
      if (detectedToken && (hashType === 'signup' || hashType === 'email')) {
        setCurrentScreen('emailVerification');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      // Check if hash itself is a token (when link href is the token)
      if (!detectedToken && window.location.hash.length > 50 && window.location.hash.includes('.')) {
        detectedToken = window.location.hash.substring(1);
      }
    }
    
    // Check URL search params
    if (!detectedToken) {
      const urlParams = new URLSearchParams(window.location.search);
      detectedToken = urlParams.get('token') || urlParams.get('access_token');
      const searchType = urlParams.get('type');
      
      if (detectedToken && (searchType === 'signup' || searchType === 'email')) {
        setCurrentScreen('emailVerification');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
    }
    
    // Check if pathname is a token (when link href is the token: /eyJhbGci...)
    if (!detectedToken && window.location.pathname !== '/' && window.location.pathname.length > 50) {
      const pathParts = window.location.pathname.split('/').filter(p => p);
      const potentialToken = pathParts[pathParts.length - 1];
      // JWT tokens contain dots and are long
      if (potentialToken && potentialToken.includes('.') && potentialToken.length > 50) {
        setCurrentScreen('emailVerification');
        window.history.replaceState({}, document.title, '/');
        return;
      }
    }
    
    // If we detected a JWT-like token anywhere, show verification screen
    if (detectedToken && detectedToken.length > 50 && detectedToken.includes('.')) {
      setCurrentScreen('emailVerification');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // No longer needed - we handle everything through the step-by-step flow

  const handleStart = () => {
    setCurrentScreen('roleSelection');
  };

  const handleRoleSelection = (userType: UserType) => {
    setSelectedUserType(userType);
    setCurrentScreen('login');
  };

  const handleCreateAccount = () => {
    setCurrentScreen('createAccount');
  };

  const handleBackToLogin = () => {
    setCurrentScreen('login');
  };

  const handleLoginSuccess = () => {
    // Navigate to appropriate dashboard based on user type
    const override = typeof window !== 'undefined' ? window.localStorage.getItem('loginAs') : null;
    if (override === 'admin') {
      try { window.localStorage.removeItem('loginAs'); } catch {}
      setCurrentScreen('adminDashboard');
      return;
    }
    switch (selectedUserType) {
      case 'client':
        setCurrentScreen('clientDashboard');
        break;
      case 'owner':
        setCurrentScreen('ownerDashboard');
        break;
      case 'admin':
        setCurrentScreen('adminDashboard');
        break;
      default:
        setCurrentScreen('clientDashboard');
    }
  };

  const handleRegistrationSuccess = () => {
    // After registration, always go to login
    setCurrentScreen('login');
  };

  const handleBackToWelcome = () => {
    setCurrentScreen('welcome');
    setSelectedUserType(null);
  };

  const handleResetPassword = () => {
    setCurrentScreen('resetPassword');
  };

  const handleResetSuccess = () => {
    setCurrentScreen('login');
  };

  const handleVerificationSuccess = () => {
    setCurrentScreen('login');
  };


  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onStart={handleStart} />;
      case 'roleSelection':
        return <RoleSelectionScreen onRoleSelect={handleRoleSelection} onBack={handleBackToWelcome} />;
      case 'login':
        return (
          <LoginScreen
            userType={selectedUserType}
            onCreateAccount={handleCreateAccount}
            onLoginSuccess={handleLoginSuccess}
            onResetPassword={handleResetPassword}
            onBack={handleBackToWelcome}
          />
        );
      case 'createAccount':
        return (
          <CreateAccountScreen
            userType={selectedUserType}
            onBackToLogin={handleBackToLogin}
            onRegistrationSuccess={handleRegistrationSuccess}
            onBack={handleBackToWelcome}
          />
        );
        case 'resetPassword':
        return (
          <ResetPasswordScreen
            userType={selectedUserType}
            onBack={handleBackToLogin}
            onSuccess={handleResetSuccess}
          />
        );
        case 'emailVerification':
        return (
          <EmailVerificationScreen
            token={new URLSearchParams(window.location.search).get('token') || undefined}
            onVerificationSuccess={handleVerificationSuccess}
            onBack={handleBackToLogin}
          />
        );
        case 'clientDashboard':
        return <ClientDashboard onBack={handleBackToWelcome} />;
      case 'ownerDashboard':
        return <OwnerDashboard onBack={handleBackToWelcome} />;
      case 'adminDashboard':
        return <AdminDashboard onBack={handleBackToWelcome} />;
      default:
        return <WelcomeScreen onStart={handleStart} />;
    }
  };

  const isDashboard = currentScreen === 'clientDashboard' || currentScreen === 'ownerDashboard' || currentScreen === 'adminDashboard';

  return (
    <div className={isDashboard ? 'min-h-screen overflow-x-hidden relative' : 'min-h-screen flex justify-center items-center p-4 relative'}>
      <div className={isDashboard ? 'w-full relative z-10' : 'w-full max-w-md relative z-10'}>
        {renderScreen()}
      </div>
    </div>
  );
}


