// app/(tabs)/collection.tsx - TAM VE EKSİKSİZ REVİZYON
import { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  RefreshControl, 
} from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { AchievementDefinition } from '@/types/user'; 
import ChipStore from '@/components/ChipStore'; // ChipStore bileşenini varsayıyoruz

// Simülasyon: Başarımların sabit listesi
const ALL_ACHIEVEMENTS: AchievementDefinition[] = [
    { id: 'first_win', title: 'İlk Zafer', description: 'Bir el kazan', reward: 50, icon: '⭐', target: 1, type: 'first_win' },
    { id: 'blackjack_master', title: 'Blackjack Uzmanı', description: 'Toplam 10 Blackjack yap', reward: 500, icon: '♠️', target: 10, type: 'blackjack_master' },
    { id: 'win_streak', title: 'Seri Katil', description: '5 el üst üste kazan', reward: 300, icon: '🔥', target: 5, type: 'win_streak' },
];

function AchievementsTab() {
  const { user, refreshUserData, canRefreshCollection, getRemainingCooldown } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Çekme (Pull-to-Refresh) işlemi
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    if (!canRefreshCollection) {
        const remainingTime = getRemainingCooldown('collection');
        setIsRefreshing(false);
        Alert.alert(
            'Bekleme Süresi', 
            `Yenileme limitini aştınız. Lütfen ${remainingTime} saniye bekleyin.`, 
            [{ text: 'Tamam' }]
        );
        return;
    }
    
    const result = await refreshUserData('collection');
    setIsRefreshing(false);
    
    if (!result.success) {
        Alert.alert('Yenileme Uyarısı', result.message, [{ text: 'Tamam' }]);
    }
  }, [refreshUserData, canRefreshCollection, getRemainingCooldown]);
  
  const displayAchievements = useMemo(() => {
    if (!user) return { completed: [], inProgress: [] };
    
    return ALL_ACHIEVEMENTS.map(def => {
        const userAch = user.achievements.find(a => a.achievementId === def.id);
        const progress = userAch?.progress ?? 0;
        const completed = userAch?.completed ?? false;
        
        return {
            ...def,
            progress: progress,
            completed: completed,
            target: def.target, 
        };
    }).reduce((acc, ach) => {
        const key = ach.completed ? 'completed' : 'inProgress';
        (acc[key] = acc[key] || []).push(ach);
        return acc;
    }, { completed: [] as any[], inProgress: [] as any[] });
  }, [user]);


  if (!user) {
    return <Text style={styles.loadingText}>Kullanıcı verileri yükleniyor...</Text>;
  }

  return (
    <ScrollView 
        style={styles.tabContentScroll}
        // YENİ: Limitli Yenileme Mekanizması
        refreshControl={
            <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor="#3498db"
            />
        }
    >
      
      {displayAchievements.inProgress?.length > 0 && (
        <ThemedText type="subtitle" style={styles.tabSectionTitle}>🏃‍♀️ Devam Eden Başarımlar</ThemedText>
      )}
      {displayAchievements.inProgress?.map((ach) => (
        <View key={ach.id} style={styles.achievementCard}>
          <Text style={styles.achievementIcon}>{ach.icon}</Text>
          <View style={styles.achievementInfo}>
            <ThemedText type="defaultSemiBold">{ach.title}</ThemedText>
            <Text style={styles.achievementDescription}>{ach.description}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(ach.progress / ach.target) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{ach.progress} / {ach.target} tamamlandı</Text>
          </View>
          <View style={styles.rewardContainer}>
            {/* Ödül Çip olarak güncellendi */}
            <Text style={styles.rewardText}>+{ach.reward} Çip</Text>
          </View>
        </View>
      ))}

      {displayAchievements.completed?.length > 0 && (
        <ThemedText type="subtitle" style={styles.tabSectionTitle}>🏆 Tamamlananlar</ThemedText>
      )}
      {displayAchievements.completed?.map((ach) => (
        <View key={ach.id} style={[styles.achievementCard, styles.completedAchievement]}>
          <Text style={styles.achievementIcon}>🎉</Text>
          <View style={styles.achievementInfo}>
            <ThemedText type="defaultSemiBold" style={{ textDecorationLine: 'line-through', color: '#7f8c8d' }}>{ach.title}</ThemedText>
            <Text style={[styles.achievementDescription, { color: '#7f8c8d' }]}>Ödül alındı.</Text>
          </View>
          <View style={styles.rewardContainer}>
            <Text style={styles.completedText}>✅</Text>
          </View>
        </View>
      ))}
      
      {/* ScrollView sonu için ekstra boşluk */}
      <View style={{ height: 100 }} /> 
    </ScrollView>
  );
}


function ChipStoreTab() {
  const { buyChips } = useAuth();
  
  return (
    <View style={styles.tabContent}>
        <ThemedText type="subtitle" style={styles.tabSectionTitle}>💰 Çip Mağazası</ThemedText>
        {/* ChipStore bileşeni burada kullanılacak */}
        <ChipStore buyChips={buyChips} />
    </View>
  );
}


function CollectionHeader() {
  return (
    <View style={headerStyles.container}>
      <Text style={headerStyles.title}>🎮 Koleksiyon</Text>
      <Text style={headerStyles.subtitle}>Başarımlar ve Mağaza</Text>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#2c3e50',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#ecf0f1',
    fontSize: 16,
    marginTop: 5,
  },
});

export default function CollectionScreen() {
  const { user } = useAuth();
  // Skinler yerine 'store' (mağaza) sekmesi eklendi
  const [activeTab, setActiveTab] = useState<'achievements' | 'store'>('achievements'); 

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#1c2833', dark: '#1c2833' }}
      headerImage={<CollectionHeader />}
    >
      <ThemedView style={styles.container}>
        {/* TAB BUTONLARI */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'achievements' && styles.activeTabButton]}
            onPress={() => setActiveTab('achievements')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'achievements' && styles.activeTabButtonText]}>Başarımlar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'store' && styles.activeTabButton]}
            onPress={() => setActiveTab('store')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'store' && styles.activeTabButtonText]}>Çip Mağazası</Text>
          </TouchableOpacity>
        </View>

        {/* İÇERİK */}
        {activeTab === 'achievements' ? <AchievementsTab /> : <ChipStoreTab />}
        
        {/* Kullanıcı Bakiyesi Bilgisi */}
        {user && (
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceText}>Bakiyeniz: 💰 {user.balance.toLocaleString()} Çip</Text>
          </View>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#1a1a1a', 
    borderBottomWidth: 1,
    borderBottomColor: '#34495e',
  },
  tabButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  activeTabButton: {
    backgroundColor: '#3498db',
  },
  tabButtonText: {
    color: '#ecf0f1',
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    flex: 1,
  },
  tabContentScroll: { 
    flex: 1,
    paddingHorizontal: 10,
  },
  tabSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ecf0f1',
    marginTop: 15,
    marginBottom: 10,
  },
  // Achievement Stilleri
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#2c3e50',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    alignItems: 'center',
  },
  completedAchievement: {
    opacity: 0.7,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
    textAlign: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#bdc3c7',
    marginTop: 2,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#34495e',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  rewardContainer: {
    alignItems: 'center',
    marginLeft: 15,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71', // Çip için yeşil
    textAlign: 'right', 
  },
  completedText: {
    fontSize: 20,
    marginTop: 5,
  },
  loadingText: {
    textAlign: 'center',
    color: '#ecf0f1',
    marginTop: 50,
  },
  balanceInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2c3e50',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#34495e',
    alignItems: 'center',
  },
  balanceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});