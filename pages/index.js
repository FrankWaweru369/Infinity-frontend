import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = () => {
      // Only run on client side
      if (typeof window === 'undefined') {
        setCheckingAuth(false);
        return;
      }

      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      // Quick validation
      if (!token || token === 'null' || token === 'undefined') {
        setCheckingAuth(false);
        setIsLoggedIn(false);
        return;
      }
      
      try {
        // Parse token to check expiration
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid token format');
        }
        
        const payload = JSON.parse(atob(parts[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        
        if (isExpired) {
          // Token expired, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userId');
          setCheckingAuth(false);
          setIsLoggedIn(false);
          return;
        }
        
        // Token is valid - user is logged in
        setIsLoggedIn(true);
        
        // Small delay for better UX, then redirect to dashboard
        setTimeout(() => {
          router.replace('/dashboard');
        }, 500);
        
      } catch (error) {
        console.log('Token validation error:', error.message);
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        setCheckingAuth(false);
        setIsLoggedIn(false);
      }
    };
    
    checkAuth();
    
    // Also check if we're in a PWA for different behavior
    const isPWA = typeof window !== 'undefined' && 
                  (window.matchMedia('(display-mode: standalone)').matches || 
                   window.navigator.standalone);
    
    if (isPWA) {
      console.log('PWA detected - optimizing for app experience');
    }
  }, [router]);

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-infinityBlue via-infinityPurple to-infinityPink text-white">
        <h3 className="text-5xl font-bold mb-4">INFINITY</h3>
        
        {/* Animated loading spinner */}
        <div className="my-8">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Checking your session...</p>
        </div>
        
        <p className="text-sm opacity-80 mt-4">
          Loading your Infinity experience
        </p>
      </div>
    );
  }

  // If user is logged in but still on this page (should redirect soon)
  if (isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-infinityBlue via-infinityPurple to-infinityPink text-white">
        <h3 className="text-5xl font-bold mb-4">INFINITY</h3>
        
        <div className="my-8">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Welcome back! Redirecting...</p>
        </div>
        
        <p className="text-sm opacity-80 mt-4">
          Taking you to your dashboard
        </p>
      </div>
    );
  }

  // User is not logged in - show welcome page
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-infinityBlue via-infinityPurple to-infinityPink text-white p-4">
      <h3 className="text-5xl font-bold mb-4">INFINITY</h3>
      <p className="text-lg mb-8 text-center max-w-md">
        Beyond the scroll, real connections are made.<br />
        Click register or login to continue.
      </p>

      <div className="flex space-x-4">
        <a
          href="/login"
          className="px-6 py-3 rounded-lg bg-white text-infinityBlue font-semibold hover:bg-gray-200 transition flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Login
        </a>
        <a
          href="/register"
          className="px-6 py-3 rounded-lg bg-infinityPink text-white font-semibold hover:bg-pink-500 transition flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Register
        </a>
      </div>

      {/* PWA Install Hint */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm opacity-90">
          📱 For best experience, add to home screen
        </p>
      </div>
    </div>
  );
}
