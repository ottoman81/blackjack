// services/deviceService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export class DeviceService {
  static async getDeviceId(): Promise<string> {
    try {
      const storedDeviceId = await AsyncStorage.getItem('deviceId');
      
      if (storedDeviceId) {
        
        return storedDeviceId;
      }
      
      const newDeviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('deviceId', newDeviceId);
      
      return newDeviceId;
    } catch (error) {
      console.error('Device ID alma hatası:', error);
      return `device-${Date.now()}`;
    }
  }
}