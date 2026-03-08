// types/achievements.ts
export type AchievementType = 
  | 'first_win'           // İlk kazanma
  | 'blackjack_master'    // 10 blackjack
  | 'high_roller'         // 500$ bahis
  | 'win_streak'          // 5 galibiyet üstüste
  | 'comeback_king'       // 50$'dan 1000$'a çıkmak
  | 'lucky_seven'         // 7-7-7 kartları
  | 'double_down_win'     // Double down ile kazanma
  | 'perfect_21'          // Tam 21 ile 10 kere kazanma

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  reward: number;
  icon: string;
  completed: boolean;
  progress: number;
  target: number;
  unlockedAt?: Date;
}