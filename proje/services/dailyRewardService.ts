// services/dailyRewardService.ts
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { UserDailyRewardState, DAILY_REWARDS, canClaimToday, calculateStreak, getNextReward } from '@/types/dailyReward';
import { UserService } from './userService';

const DAILY_REWARD_COLLECTION = 'dailyRewards';

export class DailyRewardService {
  
  /**
   * Kullanıcının günlük ödül durumunu getir
   */
  static async getDailyRewardState(deviceId: string): Promise<UserDailyRewardState> {
    try {
      const docRef = doc(db, DAILY_REWARD_COLLECTION, deviceId);
      const snap = await getDoc(docRef);
      
      if (snap.exists()) {
        const data = snap.data();
        return {
          lastClaimedAt: data.lastClaimedAt instanceof Timestamp ? data.lastClaimedAt.toDate() : data.lastClaimedAt ? new Date(data.lastClaimedAt) : null,
          currentStreak: data.currentStreak || 0,
          totalClaimed: data.totalClaimed || 0,
          claimedDays: data.claimedDays || [],
        };
      }
      
      // Yeni kullanıcı - varsayılan durum
      return {
        lastClaimedAt: null,
        currentStreak: 0,
        totalClaimed: 0,
        claimedDays: [],
      };
    } catch (error) {
      console.error('Günlük ödül durumu getirme hatası:', error);
      return {
        lastClaimedAt: null,
        currentStreak: 0,
        totalClaimed: 0,
        claimedDays: [],
      };
    }
  }
  
  /**
   * Günlük ödülü al - atomik işlem
   * Returns: { success: boolean, reward: number, newStreak: number, bonus?: number }
   */
  static async claimDailyReward(deviceId: string): Promise<{ 
    success: boolean; 
    reward: number; 
    newStreak: number; 
    bonus?: number;
    error?: string;
  }> {
    try {
      // 1. Mevcut durumu al
      const state = await this.getDailyRewardState(deviceId);
      
      // 2. Bugün alınıp alınmadığını kontrol et
      if (!canClaimToday(state)) {
        return { 
          success: false, 
          reward: 0, 
          newStreak: state.currentStreak,
          error: 'Bugün zaten günlük ödülünüzü aldınız!' 
        };
      }
      
      // 3. Yeni streak hesapla
      const newStreak = calculateStreak(state);
      
      // 4. Ödülü belirle
      const nextReward = getNextReward({ ...state, currentStreak: newStreak - 1 });
      if (!nextReward) {
        return { success: false, reward: 0, newStreak: 0, error: 'Ödül bulunamadı' };
      }
      
      const baseReward = nextReward.reward;
      const bonus = nextReward.bonus || 0;
      const totalReward = baseReward + bonus;
      
      // 5. Yeni claimedDays dizisi
      const newClaimedDays = [...state.claimedDays];
      if (!newClaimedDays.includes(newStreak)) {
        newClaimedDays.push(newStreak);
      }
      
      // 6. Atomik güncelleme - Firestore transaction yerine batch kullan
      const now = new Date();
      const dailyRef = doc(db, DAILY_REWARD_COLLECTION, deviceId);
      
      await setDoc(dailyRef, {
        lastClaimedAt: Timestamp.fromDate(now),
        currentStreak: newStreak,
        totalClaimed: increment(1),
        claimedDays: newClaimedDays,
      }, { merge: true });
      
      // 7. Kullanıcı bakiyesini güncelle
      const user = await UserService.getUserByDeviceId(deviceId);
      if (user) {
        await UserService.updateUserBalance(deviceId, user.balance + totalReward);
      }
      
      return {
        success: true,
        reward: totalReward,
        newStreak,
        bonus: bonus > 0 ? bonus : undefined,
      };
      
    } catch (error) {
      console.error('Günlük ödül alma hatası:', error);
      return { 
        success: false, 
        reward: 0, 
        newStreak: 0, 
        error: 'Ödül alınırken hata oluştu' 
      };
    }
  }
  
  /**
   * Kalan süreyi hesapla (ms cinsinden)
   */
  static getTimeUntilNextClaim(lastClaimedAt: Date | null): number {
    if (!lastClaimedAt) return 0;
    
    const last = new Date(lastClaimedAt);
    const tomorrow = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    const now = new Date();
    
    return Math.max(0, tomorrow.getTime() - now.getTime());
  }
  
  /**
   * Formatlı süre string'i döndür
   */
  static formatTimeRemaining(ms: number): string {
    if (ms <= 0) return 'Şimdi alabilirsiniz';
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 0) return `${hours}s ${minutes}d`;
    if (minutes > 0) return `${minutes}d ${seconds}s`;
    return `${seconds}s`;
  }
}