// types/dailyReward.ts
export interface DailyReward {
  day: number;           // 1-7 (haftalık döngü)
  reward: number;        // Çip miktarı
  bonus?: number;        // Streak bonusu (7. gün vb.)
  icon: string;          // Emoji/icon
  label: string;         // "1. Gün", "7. Gün (BONUS)"
}

export interface UserDailyRewardState {
  lastClaimedAt: Date | null;  // Son alındığı tarih (gün başlangıcı)
  currentStreak: number;       // Kaç gün üst üste alındı (1-7)
  totalClaimed: number;        // Toplam kaç kez alındı
  claimedDays: number[];       // Bu hafta hangi günler alındı [1,2,3...]
}

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, reward: 100, icon: '🎁', label: '1. Gün' },
  { day: 2, reward: 150, icon: '🎁', label: '2. Gün' },
  { day: 3, reward: 200, icon: '🎁', label: '3. Gün' },
  { day: 4, reward: 300, icon: '🎁', label: '4. Gün' },
  { day: 5, reward: 400, icon: '🎁', label: '5. Gün' },
  { day: 6, reward: 500, icon: '🎁', label: '6. Gün' },
  { day: 7, reward: 750, bonus: 500, icon: '💎', label: '7. Gün (BONUS)' }, // Toplam 1250
];

export function getNextReward(state: UserDailyRewardState): DailyReward | null {
  if (state.currentStreak >= 7) return DAILY_REWARDS[6]; // 7. gün sabit
  return DAILY_REWARDS[state.currentStreak];
}

export function canClaimToday(state: UserDailyRewardState): boolean {
  if (!state.lastClaimedAt) return true;
  const last = new Date(state.lastClaimedAt);
  const now = new Date();
  // Aynı gün mü kontrol et (yerel saat diliminde)
  return last.getDate() !== now.getDate() || 
         last.getMonth() !== now.getMonth() || 
         last.getFullYear() !== now.getFullYear();
}

export function calculateStreak(state: UserDailyRewardState): number {
  if (!state.lastClaimedAt) return 1;
  
  const last = new Date(state.lastClaimedAt);
  const now = new Date();
  
  // Sadece gün farkı hesapla (saat/dakika önemsiz)
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    // Dün alındıysa streak devam eder (max 7)
    return Math.min(state.currentStreak + 1, 7);
  } else if (diffDays === 0) {
    // Bugün zaten alındı
    return state.currentStreak;
  } else {
    // Gün atlandı, streak kırıldı
    return 1;
  }
}