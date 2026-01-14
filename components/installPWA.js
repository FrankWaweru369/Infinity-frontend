import { useState, useEffect } from 'react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isInstalled) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
      
      // Auto-hide after 15 seconds
      setTimeout(() => setShowButton(false), 15000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User installed Infinity PWA');
      localStorage.setItem('pwaInstalled', 'true');
    }
    
    setDeferredPrompt(null);
    setShowButton(false);
  };

  const handleDismiss = () => {
    setShowButton(false);
    localStorage.setItem('pwaDismissed', 'true');
  };

  if (!showButton) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      color: 'white',
      padding: '15px 20px',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
      zIndex: 1000,
      maxWidth: '300px',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <div style={{ fontSize: '24px' }}>📱</div>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Install Infinity App</div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Get faster access & offline mode</div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleInstall}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'white',
            color: '#8B5CF6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          Install Now
        </button>
        <button
          onClick={handleDismiss}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
}
