// services/achievementService.ts - YENİ IMPORT YOLU
import { User, UserStats, UserAchievement } from '@/types/user';
import { UserService } from './userService';
// Dosya adını _achievementData olarak güncelledik
import { ACHIEVEMENT_DATA, getAchievementDefinition } from '@/app/src/constants/_achievementData'; 

// app/(tabs)/index.tsx'ten Card[] tipini almak için
interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
  value: number;
  id: string;
}

export interface GameResult {
  win: boolean;
  blackjack: boolean;
  doubleDown: boolean;
  betAmount: number;
  previousBalance: number;
  newBalance: number;
  playerScore: number;
  // playerCards tipini Card[] olarak güncelledik
  playerCards: Card[]; 
  initialBet: number;
}

// HATA GİDERME: UserStats tipinin eksik alanlarını geçici olarak burada tanımlıyoruz.
// Normalde bu alanların '@/types/user' içindeki UserStats tipine eklenmesi gerekir.
interface ExtendedUserStats extends UserStats {
    loseStreak: number;
    totalLosses: number;
    blackjacks: number;
    doubleDownWins: number;
}


export class AchievementService {
    
    private static hasAchievement(user: User, achievementId: string): boolean {
        return user.achievements.some(a => a.achievementId === achievementId && a.completed);
    }

    static async checkAndUpdateAchievements(deviceId: string, user: User, gameResult: GameResult) {
        
        // user.stats'ı ExtendedUserStats olarak cast ediyoruz
        const userStats = user.stats as ExtendedUserStats;
        
        // 1. İstatistik Güncelleme Verisi Hazırlanıyor
        // statsUpdate tipini Partial<ExtendedUserStats> olarak ayarlıyoruz
        const statsUpdate: Partial<ExtendedUserStats> = {
            gamesPlayed: 1,
            totalBets: gameResult.betAmount
        };
        
        let winStreakResetNeeded = false;
        
        if (gameResult.win) {
            statsUpdate.gamesWon = 1;
            statsUpdate.totalEarnings = gameResult.betAmount; 
            statsUpdate.winStreak = 1; // Seriyi 1 artır
            // Hata giderildi: loseStreak kontrolü ExtendedUserStats ile yapıldı
            statsUpdate.loseStreak = userStats.loseStreak > 0 ? -userStats.loseStreak : 0; // Lose serisini sıfırla
            
        } else {
            statsUpdate.gamesLost = 1;
            statsUpdate.totalLosses = gameResult.betAmount; // Hata giderildi: totalLosses eklendi
            statsUpdate.loseStreak = 1; // Lose serisini 1 artır
            
            // Kazanma serisini sıfırlamak için negatif değeri kullan
            if (userStats.winStreak > 0) {
                 statsUpdate.winStreak = -userStats.winStreak;
                 winStreakResetNeeded = true; // Achievement progress'i de sıfırlaması gerektiğini işaretle
            }
        }
        
        if (gameResult.blackjack) {
            statsUpdate.blackjacks = 1; // Hata giderildi: blackjacks eklendi
        }

        if (gameResult.doubleDown && gameResult.win) {
            statsUpdate.doubleDownWins = 1; // Hata giderildi: doubleDownWins eklendi
        }


        // 2. Başarım Güncelleme Verisi Hazırlanıyor
        const achievementUpdate: UserAchievement[] = [...user.achievements];
        let totalReward = 0;
        let expGained = 0;
        
        for (const def of ACHIEVEMENT_DATA) {
            
            let userAch = achievementUpdate.find(a => a.achievementId === def.id);
            if (!userAch) continue;
            if (userAch.completed) continue; 

            let newProgress = userAch.progress;
            let isCompleted = false;

            switch (def.id) {
                case 'first_win':
                    if (gameResult.win) {
                        newProgress = 1;
                        isCompleted = true;
                    }
                    break;
                case 'blackjack_master':
                    if (gameResult.blackjack) {
                        // userStats kullanıldı
                        newProgress = userStats.blackjacks + 1; // Firestore'daki artış sonrası değer
                        if (newProgress >= def.target) isCompleted = true;
                    }
                    break;
                case 'win_streak':
                    // Burası kritik: İstatistik (stats) tabanlı kontrol
                    if (winStreakResetNeeded) {
                        // Kazanma serisi bozulduysa (kayıp yaşandıysa), progress'i 0'a sıfırla
                        newProgress = 0; 
                    } else if (gameResult.win) {
                        // Kazanma durumunda, progress'i stats.winStreak'e eşitle (increment'ı hesaba kat)
                        newProgress = userStats.winStreak + 1; 
                        if (newProgress >= def.target) isCompleted = true;
                    }
                    break;
                case 'double_down_win':
                    if (gameResult.doubleDown && gameResult.win) {
                        // userStats kullanıldı
                        newProgress = userStats.doubleDownWins + 1;
                        if (newProgress >= def.target) isCompleted = true;
                    }
                    break;
                case 'perfect_21':
                    // Perfect 21 kontrolü: Tam 21, Blackjack değil ve 2'den fazla kart
                    if (gameResult.playerScore === 21 && !gameResult.blackjack && gameResult.playerCards.length > 2) {
                        // HATA DÜZELTMESİ: Parantezler eklendi
                        newProgress = (user.achievements.find(a => a.achievementId === 'perfect_21')?.progress || 0) + 1;
                        if (newProgress >= def.target) isCompleted = true;
                    }
                    break;
                case 'high_roller':
                    // High Roller kontrolü
                    if (gameResult.betAmount >= 500) {
                        newProgress = 1; 
                        isCompleted = true;
                    }
                    break;
                // ... Diğer başarımlar buraya eklenebilir ...
            }

            // Güncellemeyi kaydet
            userAch.progress = newProgress;
            userAch.completed = isCompleted;
            
            if (isCompleted) {
                totalReward += def.reward;
                expGained += 50; 
            }
        }


        // 3. Atomik Güncelleme
        // statsUpdate tipini ExtendedUserStats olarak gönderiyoruz, ancak UserService sadece UserStats alacaktır.
        // Bu, UserService'in yalnızca tanıdığı alanları kullanacağı varsayımıyla çalışacaktır.
        await UserService.updateUserDataWithTransaction(deviceId, {
            statsUpdate: statsUpdate as Partial<UserStats>, 
            achievementUpdate: achievementUpdate,
            newBalance: totalReward, // Kazanılan ödülü bakiyeye ekle
            expGained: expGained,
        });

    }
}