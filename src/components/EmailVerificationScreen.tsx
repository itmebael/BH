import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface EmailVerificationScreenProps {
  token?: string;
  onVerificationSuccess: () => void;
  onBack: () => void;
}

export default function EmailVerificationScreen({ 
  token, 
  onVerificationSuccess, 
  onBack 
}: EmailVerificationScreenProps) {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [manualToken, setManualToken] = useState('');

  useEffect(() => {
    // Extract token from various URL locations
    let extractedToken: string | null = null;
    
    // 1. Check hash fragments with params (Supabase default: #access_token=...&type=...)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      extractedToken = hashParams.get('access_token') || hashParams.get('token');
      const hashType = hashParams.get('type');
      
      // If hash has type=signup, use the token
      if (extractedToken && (hashType === 'signup' || hashType === 'email')) {
        handleVerification(extractedToken);
        return;
      }
      
      // If hash is just a token (no params, looks like JWT)
      if (!extractedToken && window.location.hash.length > 20 && window.location.hash.includes('.')) {
        extractedToken = window.location.hash.substring(1);
      }
    }
    
    // 2. Check URL search params (?token=... or ?access_token=...)
    if (!extractedToken) {
      const urlParams = new URLSearchParams(window.location.search);
      extractedToken = urlParams.get('token') || urlParams.get('access_token');
      const searchType = urlParams.get('type');
      
      if (extractedToken && (searchType === 'signup' || searchType === 'email')) {
        handleVerification(extractedToken);
        return;
      }
    }
    
    // 3. Check if pathname is a token (when link href is the token: /eyJhbGci...)
    if (!extractedToken && window.location.pathname !== '/' && window.location.pathname.length > 20) {
      const pathParts = window.location.pathname.split('/').filter(p => p);
      const potentialToken = pathParts[pathParts.length - 1];
      // JWT tokens contain dots and are long
      if (potentialToken && potentialToken.includes('.') && potentialToken.length > 50) {
        extractedToken = potentialToken;
      }
    }
    
    // 4. Use prop token if provided
    if (!extractedToken && token) {
      extractedToken = token;
    }
    
    // Auto-verify if we have a JWT-like token (long, contains dots)
    if (extractedToken && extractedToken.length > 50 && extractedToken.includes('.')) {
      handleVerification(extractedToken);
    }
  }, [token]);

  const handleVerification = async (verificationToken: string) => {
    if (!verificationToken) {
      setError('No verification token provided');
      return;
    }

    // Clean the token (remove any URL parts if it's a full URL)
    let cleanToken = verificationToken.trim();
    
    // If token looks like a URL, extract just the token part
    if (cleanToken.startsWith('http://') || cleanToken.startsWith('https://')) {
      try {
        const url = new URL(cleanToken);
        // Try to get token from hash, path, or search params
        const hashParams = new URLSearchParams(url.hash.substring(1));
        cleanToken = hashParams.get('access_token') || hashParams.get('token') || 
                     url.searchParams.get('token') || 
                     url.searchParams.get('access_token') ||
                     url.pathname.split('/').pop() ||
                     cleanToken;
      } catch (e) {
        // If URL parsing fails, use token as-is
      }
    }

    setVerifying(true);
    setError(null);

    try {
      // Method 1: Try verifyOtp (for OTP tokens)
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: cleanToken,
        type: 'signup'
      });

      if (!verifyError && verifyData?.user) {
        // Verification successful via OTP
        const user = verifyData.user;
        const userMetadata = user.user_metadata || {};
        const role = userMetadata.role || 'client';
        const fullName = userMetadata.full_name || '';

        // Insert into app_users if not exists
        const { error: insertError } = await supabase.from('app_users').insert({
          user_id: user.id,
          email: user.email,
          full_name: fullName,
          role
        }).select().single();

        // Ignore duplicate key errors (user already exists)
        if (insertError && insertError.code !== '23505') {
          console.warn('Failed to create app_users entry:', insertError);
        }

        setSuccess(true);
        setTimeout(() => {
          onVerificationSuccess();
        }, 2000);
        return;
      }

      // Method 2: Try setSession (for JWT access tokens)
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: cleanToken,
        refresh_token: ''
      });

      if (!sessionError && sessionData?.user) {
        // Verification successful via session
        const user = sessionData.user;
        const userMetadata = user.user_metadata || {};
        const role = userMetadata.role || 'client';
        const fullName = userMetadata.full_name || '';

        // Insert into app_users if not exists
        const { error: insertError } = await supabase.from('app_users').insert({
          user_id: user.id,
          email: user.email,
          full_name: fullName,
          role
        }).select().single();

        // Ignore duplicate key errors (user already exists)
        if (insertError && insertError.code !== '23505') {
          console.warn('Failed to create app_users entry:', insertError);
        }

        setSuccess(true);
        setTimeout(() => {
          onVerificationSuccess();
        }, 2000);
        return;
      }

      // If both methods failed, throw error
      throw new Error(sessionError?.message || verifyError?.message || 'Invalid or expired verification token');
      
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify email. The token may be invalid or expired. Please check your email and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) {
      setError('Please enter a verification token');
      return;
    }
    handleVerification(manualToken.trim());
  };

  if (success) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center relative">
        <div className="mb-8 flex justify-center">
          <div className="w-32 h-32 bg-green-100 rounded-2xl flex items-center justify-center">
            <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Email Verified!</h1>
        <p className="text-gray-600 mb-6">Your account has been successfully verified. Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 text-center relative">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
      >
        ←
      </button>

      {/* Illustration */}
      <div className="mb-8 flex justify-center">
        <div className="w-32 h-32 bg-blue-100 rounded-2xl flex items-center justify-center overflow-hidden">
          <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        Verify Your Email
      </h1>
      <p className="text-gray-600 mb-8">
        Please verify your email address to complete your registration
      </p>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      {/* Manual Token Entry */}
      <form onSubmit={handleManualTokenSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
            Enter Verification Token
          </label>
          <input
            type="text"
            placeholder="Paste your verification token here"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            disabled={verifying}
          />
          <p className="text-xs text-gray-500 mt-2 text-left">
            Check your email for the verification token and paste it above
          </p>
        </div>

        <button
          type="submit"
          disabled={verifying || !manualToken.trim()}
          className="w-full bg-blue-600 text-white text-lg font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-60"
        >
          {verifying ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      {/* Instructions */}
      <div className="text-left bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-blue-900 mb-2">How to verify:</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Check your email inbox for the confirmation email</li>
          <li>Click the confirmation link in the email, or</li>
          <li>Copy the verification token from the email</li>
          <li>Paste it in the field above and click "Verify Email"</li>
        </ol>
      </div>

      {/* Resend Email */}
      <div className="text-center">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-700 text-sm"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}

