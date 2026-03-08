// services/userService.ts - unlockedAt null/Date uyumluluğu düzeltildi
import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp,
  increment 
} from 'firebase/firestore';
import { User, UserStats, UserAchievement, ScoreboardEntry,ChipPackage } from '@/types/user'; 

export class UserService {
  
  static async getUserByDeviceId(deviceId: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', deviceId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data() as any;
        const transformedUser: User = {
            ...userData,
            createdAt: userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : new Date(userData.createdAt.seconds * 1000),
            lastPlayed: userData.lastPlayed instanceof Timestamp ? userData.lastPlayed.toDate() : new Date(userData.lastPlayed.seconds * 1000),
            achievements: userData.achievements.map((a: any) => ({
              ...a,
              // DÜZELTME: unlockedAt'ın null olabileceği kontrolü eklendi.
              unlockedAt: a.unlockedAt ? (a.unlockedAt instanceof Timestamp ? a.unlockedAt.toDate() : new Date(a.unlockedAt.seconds * 1000)) : null,
            })),
        };
        return transformedUser;
      }
      return null;
    } catch (error) {
      console.error('Kullanıcı getirme hatası:', error);
      return null;
    }
  }

  static async createUser(deviceId: string, name: string): Promise<User> {
    
    // DÜZELTME: Yeni başarımlar unlockedAt: null ile başlatıldı.
    const initialAchievements: UserAchievement[] = [
      { achievementId: 'first_win', unlockedAt: null, progress: 0, completed: false },
      { achievementId: 'blackjack_master', unlockedAt: null, progress: 0, completed: false },
      { achievementId: 'win_streak', unlockedAt: null, progress: 0, completed: false },
    ];
    
    const newUser: User = {
      id: deviceId,
      deviceId: deviceId,
      name: name,
      balance: 1000, 
      highScore: 0,
      createdAt: new Date(),
      lastPlayed: new Date(),
      
      achievements: initialAchievements,
      stats: {
        gamesPlayed: 0, gamesWon: 0, gamesLost: 0, totalBets: 0, totalEarnings: 0,
        blackjackCount: 0, winStreak: 0, maxWinStreak: 0, doubleDownWins: 0,
      },
    };

    try {
      const userRef = doc(db, 'users', deviceId);
      await setDoc(userRef, newUser); 
      return newUser;
    } catch (error) {
      console.error('Kullanıcı oluşturma hatası:', error);
      throw error;
    }
  }
  
  static async updateUserBalance(deviceId: string, newBalance: number): Promise<void> {
    try {
      const userRef = doc(db, 'users', deviceId);
      await updateDoc(userRef, {
        balance: newBalance, 
        lastPlayed: new Date(),
      });
    } catch (error) {
      console.error('Bakiye (Çip) güncelleme hatası:', error);
      throw error;
    }
  }  
  
  static async buyChips(deviceId: string, chipPackage: ChipPackage): Promise<void> {
    try {
        const userRef = doc(db, 'users', deviceId);
        await updateDoc(userRef, {
            balance: increment(chipPackage.chipAmount),
            lastPlayed: new Date(),
        });
        console.log(`${deviceId} kullanıcısı ${chipPackage.chipAmount} çip satın aldı.`);
    } catch (error) {
        console.error('Çip satın alma hatası:', error);
        throw error;
    }
  }
  
  static async updateHighScore(deviceId: string, score: number): Promise<void> {
    try {
      const userRef = doc(db, 'users', deviceId);
      await updateDoc(userRef, {
        highScore: score,
        lastPlayed: new Date(),
      });
    } catch (error) {
      console.error('High score güncelleme hatası:', error);
      throw error;
    }
  }
  
  static async updateUserDataWithTransaction(
    deviceId: string, 
    updateData: {
        statsUpdate: Partial<UserStats>;
        achievementUpdate: UserAchievement[];
        newBalance: number;
        expGained: number;
    }
  ): Promise<void> {
    try {
        const userRef = doc(db, 'users', deviceId);
        
        const updatePayload: { [key: string]: any } = { 
            balance: updateData.newBalance, 
            achievements: updateData.achievementUpdate, 
            lastPlayed: new Date(),
        };

        (Object.keys(updateData.statsUpdate) as Array<keyof UserStats>).forEach(key => {
            const value = updateData.statsUpdate[key];
            if (typeof value === 'number') {
                updatePayload[`stats.${key}`] = increment(value); 
            }
        });
        
        await updateDoc(userRef, updatePayload);
        
    } catch (error) {
        console.error('Atomik kullanıcı verisi güncelleme hatası:', error);
        throw error;
    }
  }
  
  static async updateStats(deviceId: string, statsUpdate: Partial<UserStats>): Promise<void> {
    try {
      const userRef = doc(db, 'users', deviceId);
      const updatePayload: { [key: string]: any } = { lastPlayed: new Date() };
      
      (Object.keys(statsUpdate) as Array<keyof UserStats>).forEach(key => {
          const value = statsUpdate[key];
          if (typeof value === 'number') {
              updatePayload[`stats.${key}`] = increment(value); 
          }
      });
      
      await updateDoc(userRef, updatePayload);
    } catch (error) {
      console.error('İstatistik güncelleme hatası:', error);
      throw error;
    }
  }

  static async getScoreboard(limitCount: number = 10): Promise<ScoreboardEntry[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('highScore', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);
      
      const scoreboard: ScoreboardEntry[] = []; 
      let rank = 1;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as User;
        scoreboard.push({
          rank: rank++,
          name: data.name,
          highScore: data.highScore,
          id: data.deviceId,
        });
      });
      return scoreboard;
    } catch (error) {
      console.error('Skor tablosu getirme hatası:', error);
      return [];
    }
  }
}