import { createMMKV } from 'react-native-mmkv'

export const storage = createMMKV()

export const StorageKeys = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
};

export const setItem = (key, value) => {
  storage.set(key, typeof value === 'object' ? JSON.stringify(value) : value);
};

export const getItem = (key) => {
  const value = storage.getString(key);
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const removeItem = (key) => {
  storage.delete(key);
};

export const clearAll = () => {
  storage.clearAll();
};