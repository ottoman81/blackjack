// context/AuthContext.tsx
import { DeviceService } from '@/services/deviceService';
import { UserService } from '@/services/userService';
import { ChipPackage, User } from '@/types/user'; // AchievementDefinition kaldırıldı
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
// AchievementService kaldırıldı (kullanılmıyordu)

const REFRESH_LIMIT = 3;
const REFRESH_COOLDOWN_MS = 60000;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isRegistered: boolean;
  register: (name: string) => Promise<void>;
  updateBalance: (newBalance: number) => Promise<void>;
  updateHighScore: (score: number) => Promise<void>;
  logout: () => void;
  refreshUserData: (source: 'scoreboard' | 'collection') => Promise<{ success: boolean; message: string }>;
  canRefreshScoreboard: boolean;
  canRefreshCollection: boolean;
  getRemainingCooldown: (source: 'scoreboard' | 'collection') => number;
  buyChips: (chipPackage: ChipPackage) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [scoreboardRefreshCount, setScoreboardRefreshCount] = useState(0);
  const [collectionRefreshCount, setCollectionRefreshCount] = useState(0);
  const [scoreboardCooldown, setScoreboardCooldown] = useState(0); 
  const [collectionCooldown, setCollectionCooldown] = useState(0); 

  // useCallback ile memoize edildi
  const getRemainingTime = useCallback((cooldownTimestamp: number): number => {
    const now = Date.now();
    return cooldownTimestamp > now ? Math.ceil((cooldownTimestamp - now) / 1000) : 0;
  }, []);
  
  const getRemainingCooldown = useCallback((source: 'scoreboard' | 'collection'): number => {
    const cooldown = source === 'scoreboard' ? scoreboardCooldown : collectionCooldown;
    return getRemainingTime(cooldown);
  }, [scoreboardCooldown, collectionCooldown, getRemainingTime]);

  // canRefresh değerleri useMemo ile hesaplanıyor
  const canRefreshScoreboard = useMemo(() => 
    getRemainingTime(scoreboardCooldown) === 0, 
    [scoreboardCooldown, getRemainingTime]
  );
  
  const canRefreshCollection = useMemo(() => 
    getRemainingTime(collectionCooldown) === 0, 
    [collectionCooldown, getRemainingTime]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      if (scoreboardCooldown > 0 && scoreboardCooldown <= now) {
        setScoreboardRefreshCount(0); // Sayaç da sıfırlanıyor
        setScoreboardCooldown(0);
      }
      
      if (collectionCooldown > 0 && collectionCooldown <= now) {
        setCollectionRefreshCount(0); // Sayaç da sıfırlanıyor
        setCollectionCooldown(0);
      }
    }, 1000);
    
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
      if (existingUser) setUser(existingUser);
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
    } catch (error) {
      console.error('❌ Bakiye güncelleme hatası:', error);
      throw error;
    }
  };

  const updateHighScore = async (score: number) => {
    if (!user) return;
    try {
      if (score > user.highScore) {
        await UserService.updateHighScore(user.deviceId, score);
        setUser(prev => prev ? { ...prev, highScore: score } : null);
      }
    } catch (error) {
      console.error('❌ High score güncelleme hatası:', error);
      throw error;
    }
  };
  
  const handleBuyChips = async (chipPackage: ChipPackage) => {
    if (!user) throw new Error('Kullanıcı kayıtlı değil.');
    try {
      await UserService.buyChips(user.deviceId, chipPackage);
      setUser(prev => prev ? { ...prev, balance: prev.balance + chipPackage.chipAmount } : null);
    } catch (error) {
      console.error('❌ Çip satın alma hatası:', error);
      throw error;
    }
  };

  const refreshUserData = useCallback(async (source: 'scoreboard' | 'collection') => {
    if (isLoading || !user) {
      return { success: false, message: 'Kullanıcı verisi yükleniyor.' };
    }

    const now = Date.now();
    const isScoreboard = source === 'scoreboard';
    const currentCount = isScoreboard ? scoreboardRefreshCount : collectionRefreshCount;
    const currentCooldown = isScoreboard ? scoreboardCooldown : collectionCooldown;
    const setCount = isScoreboard ? setScoreboardRefreshCount : setCollectionRefreshCount;
    const setCooldown = isScoreboard ? setScoreboardCooldown : setCollectionCooldown;
    
    if (currentCooldown > now) {
      const remainingSeconds = Math.ceil((currentCooldown - now) / 1000);
      return { success: false, message: `${remainingSeconds} saniye sonra tekrar deneyebilirsiniz.` };
    }
    
    if (currentCount >= REFRESH_LIMIT) {
      const newCooldown = now + REFRESH_COOLDOWN_MS;
      setCooldown(newCooldown);
      setCount(0); // Edge case düzeltmesi: sayacı sıfırla
      const remainingSeconds = Math.ceil(REFRESH_COOLDOWN_MS / 1000);
      return { success: false, message: `Limit aşıldı. ${remainingSeconds} saniye beklemeniz gerekiyor.` };
    }

    try {
      const refreshedUser = await UserService.getUserByDeviceId(user.deviceId);
      if (refreshedUser) {
        setUser(refreshedUser);
        setCount(prev => prev + 1);
        return { success: true, message: 'Veriler başarıyla yenilendi.' };
      }
      return { success: false, message: 'Kullanıcı verisi bulunamadı.' };
    } catch (error) {
      console.error(`❌ ${source} yenileme hatası:`, error);
      return { success: false, message: 'Yenileme sırasında bir hata oluştu.' };
    }
  }, [user, isLoading, scoreboardRefreshCount, scoreboardCooldown, collectionRefreshCount, collectionCooldown]);
  
  const logout = () => {
    setUser(null);
  };

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
    buyChips: handleBuyChips,
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