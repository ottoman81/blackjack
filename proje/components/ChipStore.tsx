// components/ChipStore.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  ScrollView 
} from 'react-native';
// Bu importların types/user.ts ve constants/chipStore.ts dosyalarınızdan geldiğini varsayıyoruz.
import { ChipPackage } from '@/types/user'; 
import { CHIP_PACKAGES } from '@/constants/chipStore'; 

// AuthContext'ten gelecek olan buyChips fonksiyonunun tip tanımı
interface ChipStoreProps {
  buyChips: (pkg: ChipPackage) => Promise<void>;
}

/**
 * Kullanıcıların oyun çip paketlerini satın alabileceği mağaza bileşeni.
 */
export default function ChipStore({ buyChips }: ChipStoreProps) {
  const [isBuying, setIsBuying] = useState(false);
  const [buyingPackageId, setBuyingPackageId] = useState<string | null>(null);

  const handleBuy = async (pkg: ChipPackage) => {
    // Aynı anda sadece bir satın alma işlemi yapılsın
    if (isBuying) return;

    setIsBuying(true);
    setBuyingPackageId(pkg.id);

    try {
      // Satın alma işlemini simüle eden fonksiyonu çağır
      await buyChips(pkg);
      
      Alert.alert(
        '🎉 Başarılı!', 
        `${pkg.chipAmount} çip başarıyla bakiyenize eklendi. İyi oyunlar!`
      );
    } catch (e) {
      console.error('Çip satın alma hatası:', e);
      Alert.alert(
        '❌ Hata', 
        'Satın alma işlemi başarısız oldu. Lütfen tekrar deneyin.'
      );
    } finally {
      setIsBuying(false);
      setBuyingPackageId(null);
    }
  };

  return (
    <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
    >
      {CHIP_PACKAGES.map(pkg => (
        <TouchableOpacity 
          key={pkg.id} 
          style={styles.packageCard} 
          onPress={() => handleBuy(pkg)}
          disabled={isBuying} // Satın alma işlemi sürerken diğer butonları devre dışı bırak
        >
          <View style={styles.chipInfo}>
            <Text style={styles.chipAmount}>{pkg.chipAmount.toLocaleString()} ÇİP</Text>
            <Text style={styles.packageName}>{pkg.name}</Text>
          </View>
          
          <View style={styles.priceSection}>
            {isBuying && buyingPackageId === pkg.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.priceText}>{pkg.priceUSD.toFixed(2)} $</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    paddingBottom: 50, // Tab bar için boşluk
  },
  packageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2c3e50', // Koyu tema ile uyumlu arka plan
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  chipInfo: {
    flex: 1,
  },
  chipAmount: {
    color: '#2ecc71', // Yeşil renk çip için
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  packageName: {
    color: '#bdc3c7',
    fontSize: 14,
  },
  priceSection: {
    width: 80, // Fiyat kısmı için sabit bir genişlik
    alignItems: 'flex-end',
  },
  priceText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});