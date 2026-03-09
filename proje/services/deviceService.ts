// services/deviceService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'deviceId';

export class DeviceService {
  static async getDeviceId(): Promise<string> {
    try {
      // Web'de localStorage kullan
      if (Platform.OS === 'web') {
        const stored = localStorage.getItem(DEVICE_ID_KEY);
        if (stored) return stored;
        const newId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(DEVICE_ID_KEY, newId);
        return newId;
      }

      // Native'de AsyncStorage kullan
      const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (stored) return stored;
      const newId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
      return newId;
    } catch (error) {
      console.error('Device ID alma hatası:', error);
      return `device-fallback-${Date.now()}`;
    }
  }
}