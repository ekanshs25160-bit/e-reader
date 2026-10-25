import { useState, useEffect, useCallback } from 'react';
import { settingsStore } from '@/utils/db';

export function useUserProfile() {
  const [userName, setUserNameState] = useState('Reader');
  const [userAvatar, setUserAvatarState] = useState(null);

  useEffect(() => {
    let active = true;

    try {
      const savedName = localStorage.getItem('flyleaf-user-name');
      if (savedName) {
        setUserNameState(savedName.trim() || 'Reader');
      }
      const savedAvatar = localStorage.getItem('flyleaf-user-avatar');
      if (savedAvatar) {
        setUserAvatarState(savedAvatar);
      }
    } catch {}

    if (settingsStore) {
      settingsStore.getItem('user_profile').then((profile) => {
        if (!active || !profile) return;
        if (profile.name) {
          setUserNameState(profile.name.trim() || 'Reader');
          try {
            localStorage.setItem('flyleaf-user-name', profile.name.trim());
          } catch {}
        }
        if (profile.avatar !== undefined) {
          setUserAvatarState(profile.avatar);
          try {
            if (profile.avatar) {
              localStorage.setItem('flyleaf-user-avatar', profile.avatar);
            } else {
              localStorage.removeItem('flyleaf-user-avatar');
            }
          } catch {}
        }
      }).catch(() => {});
    }

    return () => {
      active = false;
    };
  }, []);

  const setUserName = useCallback((name) => {
    const trimmed = (name || '').trim() || 'Reader';
    setUserNameState(trimmed);
    try {
      localStorage.setItem('flyleaf-user-name', trimmed);
    } catch {}
    if (settingsStore) {
      settingsStore.getItem('user_profile').then((cur) => {
        settingsStore.setItem('user_profile', { ...(cur || {}), name: trimmed });
      }).catch(() => {});
    }
  }, []);

  const setUserAvatar = useCallback((dataUrlOrNull) => {
    setUserAvatarState(dataUrlOrNull);
    try {
      if (dataUrlOrNull) {
        localStorage.setItem('flyleaf-user-avatar', dataUrlOrNull);
      } else {
        localStorage.removeItem('flyleaf-user-avatar');
      }
    } catch {}
    if (settingsStore) {
      settingsStore.getItem('user_profile').then((cur) => {
        settingsStore.setItem('user_profile', { ...(cur || {}), avatar: dataUrlOrNull });
      }).catch(() => {});
    }
  }, []);

  const resetProfile = useCallback(() => {
    setUserNameState('Reader');
    setUserAvatarState(null);
    try {
      localStorage.removeItem('flyleaf-user-name');
      localStorage.removeItem('flyleaf-user-avatar');
    } catch {}
  }, []);

  return {
    userName,
    setUserName,
    userAvatar,
    setUserAvatar,
    resetProfile,
  };
}
