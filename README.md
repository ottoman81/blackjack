# Blackjack - React Native / Expo

Çok oyunculu (multiplayer) ve tek oyunculu Blackjack oyunu. Expo + React Native + Firebase (Firestore, Auth) ile geliştirildi.

## 🎮 Özellikler

- **Tek Oyunculu Mod**: Yapay zeka krupiye karşı oynayın
- **Çok Oyunculu Mod**: Gerçek zamanlı Firestore ile arkadaşlarınızla oynayın (oda kodu ile)
- **Firebase Authentication**: E-posta/şifre ile kayıt ve giriş
- **Profil & İstatistikler**: Kazanma/kaybetme oranı, en yüksek bakiye, oynanan el sayısı
- **Günlük Ödül Sistemi**: Her gün giriş yaparak chip kazanın
- **Başarımlar**: Kilitlenebilir rozetler (ilk kazanç, blackjack, seri kazançlar vb.)
- **Liderlik Tablosu**: Global sıralama
- **Ses Efektleri**: Kart dağıtma, kazanma, kaybetma sesleri
- **Tema Desteği**: Açık/Koyu mod

## 🛠 Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | Expo SDK 51 / React Native 0.74 |
| Navigasyon | Expo Router (file-based) |
| State | React Context + useReducer |
| Backend | Firebase Auth + Firestore |
| Depolama | AsyncStorage (offline persistence) |
| UI | StyleSheet + LinearGradient + BlurView |
| Ses | expo-av |
| Dil | TypeScript (strict mode) |

## 📁 Proje Yapısı

```
proje/
├── app/                    # Expo Router sayfaları
│   ├── (auth)/            # Giriş/Kayıt ekranları
│   ├── (game)/            # Oyun ekranları (blackjack, multiplayer)
│   ├── (profile)/         # Profil, istatistikler, başarımlar
│   └── _layout.tsx        # Root layout
├── components/            # Yeniden kullanılabilir bileşenler
│   ├── ui/                # Temel UI (Button, Card, Modal, vb.)
│   └── game/              # Oyun özel bileşenler (Card, Chip, vb.)
├── contexts/              # React Context providers
│   ├── AuthContext.tsx    # Kullanıcı oturumu, profil, günlük ödül
│   └── SoundContext.tsx   # Ses yönetimi
├── services/              # İş mantığı & Firebase
│   ├── blackjackService.ts    # Kart mantığı, skor, deste
│   ├── multiplayerService.ts  # Çok oyunculu oda mantığı
│   ├── userService.ts         # Kullanıcı CRUD, istatistikler
│   └── achievementService.ts  # Başarımlar
├── hooks/                 # Custom hooks
│   ├── useGameState.ts    # Oyun state machine
│   └── useMultiplayer.ts  # Multiplayer dinleyicileri
├── utils/                 # Yardımcı fonksiyonlar
│   ├── constants.ts       # Sabitler (kart değerleri, oyun kuralları)
│   └── helpers.ts         # Formatlama, validasyon
├── types/                 # TypeScript tipleri
│   ├── game.ts            # Oyun state tipleri
│   ├── user.ts            # Kullanıcı/profil tipleri
│   └── multiplayer.ts     # Oda/oyuncu tipleri
├── assets/                # Görseller, sesler, fontlar
└── lib/
    └── firebase.ts        # Firebase yapılandırması
```

## 🚀 Kurulum

### Önkoşullar
- Node.js 18+
- npm / yarn / pnpm
- Expo CLI: `npm install -g @expo/cli`
- Firebase projesi (Auth + Firestore etkin)

### Adımlar

```bash
# 1. Repoyu klonlayın
git clone https://github.com/ottoman81/blackjack.git
cd blackjack/proje

# 2. Bağımlılıkları yükleyin
npm install

# 3. Firebase yapılandırması
# lib/firebase.ts dosyasını kendi Firebase config'inizle güncelleyin
# Veya .env dosyası oluşturun (expo-constants ile)

# 4. Firestore güvenlik kurallarını deploy edin
# firebase deploy --only firestore:rules

# 5. Uygulamayı başlatın
npx expo start
```

### Firebase Güvenlik Kuralları (Örnek)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Kullanıcı profilleri - sadece sahibi oku/yazabilir
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Çok oyunculu odalar - oda üyeleri oku/yazabilir
    match /rooms/{roomId} {
      allow read, write: if request.auth != null 
        && request.auth.uid in resource.data.players;
      allow create: if request.auth != null;
    }
    
    // Liderlik tablosu - herkes okuyabilir, sistem yazar
    match /leaderboard/{entryId} {
      allow read: if true;
      allow write: if false; // Sadece Cloud Functions yazabilir
    }
  }
}
```

## 🎯 Oyun Kuralları

- **Standart 6 Deste** (312 kart) - otomatik karıştırma
- **Blackjack (As + 10 değerli)**: 3:2 ödeme
- **Dealer 17'de durur** (Soft 17 dahil)
- **Double Down**: İlk 2 kartta, bahis 2x, 1 kart çekip stand
- **Split**: Eş değerli çift kartta (henüz uygulanmadı)
- **Sigorta**: Dealer As gösterdiğinde (henüz uygulanmadı)

## 📱 Ekran Görüntüleri

| Ana Menü | Tek Oyunculu | Çok Oyunculu | Profil |
|----------|--------------|--------------|--------|
| ![menu](assets/screenshots/menu.png) | ![single](assets/screenshots/single.png) | ![multi](assets/screenshots/multi.png) | ![profile](assets/screenshots/profile.png) |

## 🔧 Geliştirme

### Yararlı Komutlar

```bash
# TypeScript tip kontrolü
npx tsc --noEmit

# Lint
npx eslint . --ext .ts,.tsx

# Testler (henüz eklenmedi)
npm test

# Production build (EAS)
eas build --platform all
```

### Environment Variables

`.env` dosyası oluşturun (`.gitignore`'da):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

`lib/firebase.ts` içinde `expo-constants` ile okunur.

## 📋 Yapılacaklar / Bilinen Sorunlar

- [ ] **Split** mekanizması eklenecek
- [ ] **Sigorta (Insurance)** seçeneği
- [ ] **Multiplayer'da Double Down** butonu ve mantığı (şu an sadece Hit/Stand)
- [ ] **Oda kodu benzersizlik kontrolü** (multiplayerService.ts:24-28)
- [ ] **AuthContext cooldown interval memory leak** düzeltmesi
- [ ] **Firebase config** environment variable'a taşınacak
- [ ] **Test coverage** eklenecek (Jest + React Native Testing Library)
- [ ] **EAS Build** yapılandırması
- [ ] **iOS/Android store** dağıtım hazırlığı

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

MIT License - detaylar için `LICENSE` dosyasına bakın.

## 🙏 Teşekkürler

- [Expo](https://expo.dev) - Harçsız React Native geliştirme
- [Firebase](https://firebase.google.com) - Backend altyapısı
- [React Native Community](https://github.com/react-native-community) - Kütüphaneler
- Kart görselleri: [Kenney.nl](https://kenney.nl/assets/playing-cards)

---

**Geliştirici**: [Mehmet Batuhan Demir](https://github.com/ottoman81)  
**Son Güncelleme**: Ekim 2026