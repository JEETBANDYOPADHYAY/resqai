import { useState, useEffect, useCallback } from 'react';

export function useOnlineStatus() {
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatingOffline, setIsSimulatingOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSimulateOffline = useCallback(() => {
    setIsSimulatingOffline((prev) => !prev);
  }, []);

  // Effective online status: false if browser is offline OR if user is simulating offline
  const isOnline = isBrowserOnline && !isSimulatingOffline;

  return {
    isOnline,
    isBrowserOnline,
    isSimulatingOffline,
    toggleSimulateOffline,
    setSimulateOffline: setIsSimulatingOffline,
  };
}
