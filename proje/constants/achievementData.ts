// src/constants/achievementData.ts - REVİZE EDİLMİŞ (HATA VEREN TİP ÇIKARILDI)
export default {};
import { AchievementDefinition } from '@/types/user';

/**
 * Tüm başarımların statik tanım verileri.
 */
export const ACHIEVEMENT_DATA: AchievementDefinition[] = [
    { 
        id: 'first_win', 
        title: 'İlk Zafer', 
        description: 'İlk elini kazan.', 
        reward: 50, 
        icon: '🏆', 
        target: 1, 
        type: 'first_win' 
    },
    { 
        id: 'blackjack_master', 
        title: '21 Ustası', 
        description: 'Toplamda 10 kez Blackjack yap.', 
        reward: 200, 
        icon: '♠️', 
        target: 10, 
        type: 'blackjack_master' 
    },
    { 
        id: 'win_streak', 
        title: 'Seri Katil', 
        description: '5 el üst üste kazan.', 
        reward: 500, 
        icon: '🔥', 
        target: 5, 
        type: 'win_streak' 
    },
    { 
        id: 'double_down_win', 
        title: 'Çift Etki', 
        description: 'Double Down yaparak 5 el kazan.', 
        reward: 150, 
        icon: '⬆️', 
        target: 5, 
        type: 'double_down_win' 
    },
    { 
        id: 'perfect_21', 
        title: 'Mükemmel 21', 
        description: 'Tam 21 puanla 10 el kazan (Blackjack hariç).', 
        reward: 250, 
        icon: '✨', 
        target: 10, 
        type: 'perfect_21' 
    },
    { 
        id: 'high_roller', 
        title: 'Büyük Bahisçi', 
        description: 'Tek bir elde 500$ ve üzeri bahis yap.', 
        reward: 300, 
        icon: '💎', 
        target: 1, 
        type: 'high_roller' 
    },
    { 
        id: 'lucky_seven', 
        title: 'Şanslı Yediler', 
        description: 'Elinde üç adet 7 kartı bulundur.', 
        reward: 777, 
        icon: '🍀', 
        target: 1, 
        type: 'lucky_seven' 
    },
    /* // HATA ÇÖZÜMÜ: Bu başarımın 'level_10' tipi, AchievementType union'ında tanımlı değildir.
    // Lütfen types/user.ts dosyasını güncelleyene kadar yorum satırında bırakın.
    { 
        id: 'level_10', 
        title: 'Tecrübeli', 
        description: '10. seviyeye ulaş.', 
        reward: 500, 
        icon: '🎖️', 
        target: 10, 
        type: 'level_10' 
    },
    */
];

export function getAchievementDefinition(id: string) {
    return ACHIEVEMENT_DATA.find(a => a.id === id);
}