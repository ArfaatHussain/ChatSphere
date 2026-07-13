import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { setUserOnline, setUserOffline } from '../services/userService';

const usePresence = (userId) => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!userId) return;

    // Mark online as soon as this hook is active (covers login + fresh app launch)
    setUserOnline(userId);

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const wasInBackground = appState.current.match(/inactive|background/);
      const isNowActive = nextAppState === 'active';
      const isGoingToBackground = nextAppState.match(/inactive|background/);

      if (wasInBackground && isNowActive) {
        setUserOnline(userId);
      } else if (isGoingToBackground) {
        setUserOffline(userId);
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [userId]);
};

export default usePresence;