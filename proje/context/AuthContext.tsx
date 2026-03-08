// context/AuthContext.tsx - TAM VE EKSİKSİZ REVİZYON
import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode, 
  useCallback 
} from 'react';
import { User, ChipPackage, AchievementDefinition } from '@/types/user'; // ChipPackage eklendi
import { DeviceService } from '@/services/deviceService';
import { UserService } from '@/services/userService';
// AchievementService importunu varsayıyoruz
import { AchievementService } from '@/services/achievementService'; 

// Refresh Limitleri için sabitler
const REFRESH_LIMIT = 3;
const REFRESH_COOLDOWN_MS = 60000; // 1 dakika (60000 milisaniye)

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isRegistered: boolean;
  register: (name: string) => Promise<void>;
  updateBalance: (newBalance: number) => Promise<void>;
  updateHighScore: (score: number) => Promise<void>;
  logout: () => void;
  // YENİ: Veri yenileme fonksiyonu ve durumu
  refreshUserData: (source: 'scoreboard' | 'collection') => Promise<{ success: boolean; message: string }>;
  canRefreshScoreboard: boolean;
  canRefreshCollection: boolean;
  getRemainingCooldown: (source: 'scoreboard' | 'collection') => number; // Yeni: Kalan süreyi alma
  // YENİ: Çip Satın Alma
  buyChips: (chipPackage: ChipPackage) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // YENİ: Refresh State'leri
  // Sayaçlar (Kaç kez yenileme yapıldı)
  const [scoreboardRefreshCount, setScoreboardRefreshCount] = useState(0);
  const [collectionRefreshCount, setCollectionRefreshCount] = useState(0);
  
  // Cooldown Bitiş Zamanları (Timestamp)
  const [scoreboardCooldown, setScoreboardCooldown] = useState(0); 
  const [collectionCooldown, setCollectionCooldown] = useState(0); 
  
  const getRemainingTime = (cooldownTimestamp: number): number => {
    const now = Date.now();
    return cooldownTimestamp > now ? Math.ceil((cooldownTimestamp - now) / 1000) : 0;
  };
  
  const getRemainingCooldown = useCallback((source: 'scoreboard' | 'collection'): number => {
    const cooldown = source === 'scoreboard' ? scoreboardCooldown : collectionCooldown;
    return getRemainingTime(cooldown);
  }, [scoreboardCooldown, collectionCooldown]);


  // Cooldown süresi bitince sayacı sıfırlamak için useEffect
  useEffect(() => {
    const interval = setInterval(() => {
        const now = Date.now();
        
        // Skor Tablosu için
        if (scoreboardCooldown > 0 && scoreboardCooldown <= now) {
            setScoreboardRefreshCount(0);
            setScoreboardCooldown(0);
        }
        
        // Koleksiyon için
        if (collectionCooldown > 0 && collectionCooldown <= now) {
            setCollectionRefreshCount(0);
            setCollectionCooldown(0);
        }
    }, 1000); // Her saniye kontrol et
    
    return () => clearInterval(interval);
  }, [scoreboardCooldown, collectionCooldown]);


  useEffect(() => {
    checkDeviceAndUser();
  }, []);
  
  const checkDeviceAndUser = async () => {
    try {
      setIsLoading(true);
      const deviceId = await DeviceService.getDeviceId();
      const existingUser = await UserService.getUserByDeviceId(deviceId);
      
      if (existingUser) {
        setUser(existingUser);
      }
    } catch (error) {
      console.error('❌ Başlangıç yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string) => {
    if (user) return;
    try {
      const deviceId = await DeviceService.getDeviceId();
      const newUser = await UserService.createUser(deviceId, name);
      setUser(newUser);
    } catch (error) {
      console.error('❌ Kayıt hatası:', error);
      throw error;
    }
  };

  const updateBalance = async (newBalance: number) => {
    if (!user) return;
    
    try {
      await UserService.updateUserBalance(user.deviceId, newBalance);
      setUser(prev => prev ? { ...prev, balance: newBalance } : null);
      console.log('💰 Bakiye (Çip) güncellendi:', newBalance);
    } catch (error) {
      console.error('❌ Bakiye (Çip) güncelleme hatası:', error);
      throw error;
    }
  };

  const updateHighScore = async (score: number) => {
    if (!user) return;
    
    try {
      if (score > user.highScore) {
        await UserService.updateHighScore(user.deviceId, score);
        setUser(prev => prev ? { ...prev, highScore: score } : null);
        console.log('🏆 High score güncellendi:', score);
      }
    } catch (error) {
      console.error('❌ High score güncelleme hatası:', error);
      throw error;
    }
  };
  
  // YENİ: Çip Satın Alma
  const handleBuyChips = async (chipPackage: ChipPackage) => {
      if (!user) throw new Error('Kullanıcı kayıtlı değil.');
      try {
          // Servis katmanında Firebase'e çip miktarını ekle
          await UserService.buyChips(user.deviceId, chipPackage);
          
          // UI'ı anında güncelle (Firebase'den çekmeye gerek kalmadan)
          setUser(prev => prev ? { 
            ...prev, 
            balance: prev.balance + chipPackage.chipAmount 
          } : null);
          console.log(`✅ ${chipPackage.chipAmount} çip satın alındı.`);
      } catch (error) {
          console.error('❌ Çip satın alma hatası:', error);
          throw error;
      }
  };

  // YENİ: Veri Yenileme Mekanizması
  const refreshUserData = useCallback(async (source: 'scoreboard' | 'collection') => {
    if (isLoading || !user) {
      return { success: false, message: 'Kullanıcı verisi yükleniyor.' };
    }

    const now = Date.now();
    let currentCount, currentCooldown, setCount, setCooldown;

    if (source === 'scoreboard') {
        currentCount = scoreboardRefreshCount;
        currentCooldown = scoreboardCooldown;
        setCount = setScoreboardRefreshCount;
        setCooldown = setScoreboardCooldown;
    } else { // 'collection'
        currentCount = collectionRefreshCount;
        currentCooldown = collectionCooldown;
        setCount = setCollectionRefreshCount;
        setCooldown = setCollectionCooldown;
    }
    
    // Cooldown kontrolü
    if (currentCooldown > now) {
        const remainingSeconds = Math.ceil((currentCooldown - now) / 1000);
        return { success: false, message: `Bekleme süresi: ${remainingSeconds} saniye sonra tekrar deneyebilirsiniz.` };
    }
    
    // Sayaç kontrolü
    if (currentCount >= REFRESH_LIMIT) {
        // Yeni cooldown süresini belirle
        const newCooldown = now + REFRESH_COOLDOWN_MS;
        setCooldown(newCooldown);
        // Bu noktada sayacı 1 artırmıyoruz, çünkü yenileme işlemi yapılmayacak,
        // ancak kullanıcıya limit aşıldığı bilgisi verilecek.
        const remainingSeconds = Math.ceil(REFRESH_COOLDOWN_MS / 1000);
        return { success: false, message: `Yenileme limitini (${REFRESH_LIMIT} kez) aştınız. ${remainingSeconds} saniye beklemeniz gerekiyor.` };
    }

    try {
      // YENİLEME İŞLEMİ
      const deviceId = user.deviceId;
      const refreshedUser = await UserService.getUserByDeviceId(deviceId);

      if (refreshedUser) {
        setUser(refreshedUser);
        setCount(prev => prev + 1); // Başarılı yenileme sayacını artır
        return { success: true, message: 'Veriler başarıyla yenilendi.' };
      } else {
        return { success: false, message: 'Kullanıcı verisi bulunamadı.' };
      }
    } catch (error) {
      console.error(`❌ ${source} yenileme hatası:`, error);
      return { success: false, message: 'Yenileme sırasında bir hata oluştu.' };
    }
  }, [
      user, 
      isLoading, 
      scoreboardRefreshCount, 
      scoreboardCooldown, 
      collectionRefreshCount, 
      collectionCooldown
  ]);
  
  const logout = () => {
    setUser(null);
    console.log('🚪 Kullanıcı çıkış yaptı');
  };
  
  const canRefreshScoreboard = getRemainingTime(scoreboardCooldown) === 0;
  const canRefreshCollection = getRemainingTime(collectionCooldown) === 0;

  const value: AuthContextType = {
    user,
    isLoading,
    isRegistered: !!user,
    register,
    updateBalance,
    updateHighScore,
    logout,
    refreshUserData,
    canRefreshScoreboard,
    canRefreshCollection,
    getRemainingCooldown,
    buyChips: handleBuyChips, // Yeni çip satın alma fonksiyonu
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}