// types/user.ts - TEMEL YAPILANDIRMA
import { AchievementType } from './achievements'; 

export interface User {
  id: string;
  deviceId: string;
  name: string;
  balance: number; // KALAN
  highScore: number; // KALAN
  createdAt: Date;
  lastPlayed: Date;
  
  // Başarım verileri (KALAN)
  achievements: UserAchievement[];
  stats: UserStats;
}

export interface UserAchievement {
  achievementId: string;
  progress: number;
  completed: boolean;
  unlockedAt: Date | null; // <-- DÜZELTME BURADA YAPILMALIDIR!
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  totalBets: number;
  totalEarnings: number;
  blackjackCount: number;
  winStreak: number;
  maxWinStreak: number;
  doubleDownWins: number;
}

// Skor tablosu için tip tanımı (Scoreboard.tsx'te kullanılıyor)
export interface ScoreboardEntry {
  rank: number;
  name: string;
  highScore: number;
  id: string;
}

// Başarım tanımları (AchievementService tarafından kullanılıyor)
export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  reward: number;
  icon: string;
  target: number;
  type: AchievementType;
}

export interface ChipPackage {
  id: string;
  chipAmount: number;
  priceUSD: number; // Gerçek para birimi karşılığı (simülasyon için)
  name: string;
}
