// app/(tabs)/scoreboard.tsx - TAM VE EKSİKSİZ REVİZYON
import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { UserService } from '@/services/userService';
import { ScoreboardEntry } from '@/types/user';

function ScoreboardHeader() {
  return (
    <View style={headerStyles.container}>
      <Text style={headerStyles.title}>🏆 Skor Tablosu</Text>
      <Text style={headerStyles.subtitle}>En İyi Oyuncular</Text>
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

export default function ScoreboardScreen() {
  const { user, refreshUserData, canRefreshScoreboard, getRemainingCooldown } = useAuth(); // Yeni auth state ve metotları eklendi
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false); 

  // Skor tablosunu çekme fonksiyonu
  const fetchScoreboard = useCallback(async () => {
    // Burada isRefreshing'i set etmiyoruz, çünkü RefreshControl'un kendi isRefreshing state'i var
    try {
      const data = await UserService.getScoreboard(10);
      setScoreboard(data);
    } catch (error) {
      console.error('Skor tablosu yüklenirken hata:', error);
      // Hata durumunda bile eski veriyi tutmaya devam edebilir
    }
  }, []);

  // Sayfaya ilk girişte ve kullanıcı değiştiğinde yüklensin
  useEffect(() => {
    // İlk yüklemede veriyi çek
    if (!isRefreshing) {
        fetchScoreboard();
    }
  }, [fetchScoreboard]);
  
  // Çekme (Pull-to-Refresh) işlemi
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    // Limit Kontrolü
    if (!canRefreshScoreboard) {
        const remainingTime = getRemainingCooldown('scoreboard');
        setIsRefreshing(false); // UI'daki yükleniyor durumunu kapat
        Alert.alert(
            'Bekleme Süresi', 
            `Yenileme limitini aştınız. Lütfen ${remainingTime} saniye bekleyin.`, 
            [{ text: 'Tamam' }]
        );
        return;
    }
    
    // 1. AuthContext üzerinden kullanıcı verisini yenile (limit kontrolü burada yapılır)
    const result = await refreshUserData('scoreboard');
    
    if (result.success) {
        // 2. Kullanıcı verisi yenilenince, skor tablosu verisini de yenile
        await fetchScoreboard();
    } else {
        // Yenileme limitine takılınca Alert göster
        Alert.alert('Yenileme Uyarısı', result.message, [{ text: 'Tamam' }]);
    }
    
    setIsRefreshing(false); // İşlem bitince UI'daki yükleniyor durumunu kapat
  }, [canRefreshScoreboard, refreshUserData, fetchScoreboard, getRemainingCooldown]);


  const getRankStyle = (rank: number) => {
    if (rank === 1) return styles.rankGold;
    if (rank === 2) return styles.rankSilver;
    if (rank === 3) return styles.rankBronze;
    return styles.rankDefault;
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#1c2833', dark: '#1c2833' }}
      headerImage={<ScoreboardHeader />}
    >
      <ThemedView style={styles.container}>
        
        {/* Kullanıcı İstatistikleri */}
        {user && (
          <View style={styles.userStatsCard}>
            <ThemedText type="subtitle" style={styles.userStatsTitle}>Sizin İstatistikleriniz</ThemedText>
            <View style={styles.userStatRow}>
              <Text style={styles.userStat}>En Yüksek Skor:</Text>
              <Text style={styles.userStat}>{user.highScore.toLocaleString()}</Text>
            </View>
            <View style={styles.userStatRow}>
              {/* Çip olarak güncellendi */}
              <Text style={styles.userStat}>Bakiyeniz (Çip):</Text>
              <Text style={styles.userStat}>💰 {user.balance.toLocaleString()} Çip</Text>
            </View>
            <View style={styles.userStatRow}>
              <Text style={styles.userStat}>Kazanma Serisi:</Text>
              <Text style={styles.userStat}>{user.stats.maxWinStreak}</Text>
            </View>
          </View>
        )}

        <ScrollView 
            style={styles.scoreboard}
            // YENİ: Limitli Yenileme Mekanizması
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                    tintColor="#3498db"
                />
            }
        >
          <ThemedText type="subtitle" style={styles.sectionTitle}>🏆 İlk 10 Oyuncu</ThemedText>
          
          {scoreboard.length === 0 && !isRefreshing ? (
            <Text style={styles.emptyText}>Skor tablosu şu anda boş.</Text>
          ) : (
            scoreboard.map((item) => (
              <View 
                key={item.id} 
                style={[
                    styles.scoreItem, 
                    getRankStyle(item.rank), 
                    item.id === user?.deviceId && styles.currentUser
                ]}
              >
                <Text style={styles.rankText}>{item.rank}.</Text>
                <ThemedText type="defaultSemiBold" style={styles.nameText}>{item.name}</ThemedText>
                <Text style={styles.scoreText}>{item.highScore.toLocaleString()}</Text>
              </View>
            ))
          )}
          {/* ScrollView sonu için ekstra boşluk */}
          <View style={{ height: 50 }} />
        </ScrollView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    marginTop: 20,
  },
  // ... (Diğer stiller)
  currentUser: {
    backgroundColor: '#34495e',
    borderLeftColor: '#f39c12',
    borderLeftWidth: 6,
  },
  rankGold: { borderLeftColor: '#f1c40f', borderLeftWidth: 6 },
  rankSilver: { borderLeftColor: '#bdc3c7', borderLeftWidth: 6 },
  rankBronze: { borderLeftColor: '#e67e22', borderLeftWidth: 6 },
  rankDefault: { borderLeftColor: '#3498db', borderLeftWidth: 4 },
  
  userStatsCard: {
    backgroundColor: '#2c3e50',
    padding: 16,
    marginBottom: 20,
    borderRadius: 12,
  },
  userStatsTitle: {
    color: '#ecf0f1',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  userStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  userStat: {
    color: '#ecf0f1',
    fontSize: 14,
    fontWeight: '600',
  },
  scoreboard: {
    flex: 1,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    width: 30,
    textAlign: 'center',
  },
  nameText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  emptyText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
  }
});