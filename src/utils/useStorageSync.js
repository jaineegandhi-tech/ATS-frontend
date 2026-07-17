import { useState, useEffect } from 'react';

// Re-renders the component whenever shared data changes (same tab or cross-tab)
export function useStorageSync() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function onDataChange() { setTick(t => t + 1); }

    window.addEventListener('storage', onDataChange);
    window.addEventListener('hrms-data-updated', onDataChange);

    return () => {
      window.removeEventListener('storage', onDataChange);
      window.removeEventListener('hrms-data-updated', onDataChange);
    };
  }, []);

  return tick;
}
