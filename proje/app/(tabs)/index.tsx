// app/(tabs)/index.tsx - TAM VE EKSİKSİZ REVİZYON
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  Alert,
  TextInput // Bahis miktarını input ile yönetmek için
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { AchievementService, GameResult } from '@/services/achievementService';
import { BlackjackService } from '@/services/blackjackService';

// Bileşen importları
import DealerArea from '@/components/blackjack/DealerArea';
import PlayerArea from '@/components/blackjack/PlayerArea';
import Controls from '@/components/blackjack/Controls';
import GameStatus from '@/components/blackjack/GameStatus';

// Tipler
type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
  id: string;
}

// GameState interface'ine initialBet eklendi
interface GameState {
  playerCards: Card[];
  dealerCards: Card[];
  playerScore: number;
  dealerScore: number;
  gameStatus: 'waiting' | 'player-turn' | 'dealer-turn' | 'player-bust' | 'dealer-bust' | 'player-win' | 'dealer-win' | 'push';
  deck: Card[];
  betAmount: number;
  balance: number;
  initialBet: number; // ZORUNLU ALAN
}

// Header Component
function GameHeader({ balance, name, onExit }: { balance: number; name: string; onExit: () => void }) {
  return (
    <View style={headerStyles.container}>
      <Text style={headerStyles.title}>♠️ Blackjack ♥️</Text>
      <Text style={headerStyles.subtitle}>21'e En Yakın Kazanır!</Text>
      <View style={headerStyles.userInfo}>
        <Text style={headerStyles.userName}>Merhaba, {name}!</Text>
        <Text style={headerStyles.balance}>Bakiye: 💰 {balance.toLocaleString()} Çip</Text>
      </View>
      
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#2c3e50',
    alignItems: 'center',
    paddingTop: 50,
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
  userInfo: {
    marginTop: 10,
    alignItems: 'center',
  },
  userName: {
    color: '#ecf0f1',
    fontSize: 16,
  },
  balance: {
    color: '#2ecc71',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  exitButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#e74c3c',
    zIndex: 10,
  },
  exitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

const INITIAL_BET = 50; // Minimum/Başlangıç bahis değeri olarak kabul edildi.
const GAME_END_DELAY = 5000; // 5 saniye bekleme süresi

export default function BlackjackScreen() {
  const { user, updateBalance, updateHighScore, logout } = useAuth();
  const router = useRouter();
  
  const [gameState, setGameState] = useState<GameState>({
    playerCards: [],
    dealerCards: [],
    playerScore: 0,
    dealerScore: 0,
    gameStatus: 'waiting',
    deck: BlackjackService.initializeDeck(),
    betAmount: INITIAL_BET,
    balance: user?.balance || 1000,
    initialBet: INITIAL_BET, // Hata düzeltildi: initialBet eklendi
  });
  
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Kullanıcı değiştiğinde bakiyeyi güncelle
  useEffect(() => {
    if (user) {
      setGameState(prev => ({
        ...prev,
        balance: user.balance,
      }));
    }
  }, [user]);
  
  // Çıkış işlemi
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  // Kart Çekme İşlemi
  const drawCard = useCallback((currentDeck: Card[], receiver: 'player' | 'dealer'): { deck: Card[]; card: Card } => {
    if (currentDeck.length === 0) {
      Alert.alert('Hata', 'Deste boş! Yeni deste karıştırılıyor.');
      const newDeck = BlackjackService.initializeDeck();
      const [card, ...remainingDeck] = newDeck;
      return { deck: remainingDeck, card };
    }
    const [card, ...deck] = currentDeck;
    return { deck, card };
  }, []);

  // Skoru ve GameStatus'ü Güncelleme
  const updateScoresAndStatus = useCallback((currentState: GameState, isDealerTurn = false): GameState => {
    const playerScore = BlackjackService.calculateScore(currentState.playerCards);
    const dealerScore = BlackjackService.calculateScore(currentState.dealerCards);
    let newStatus: GameState['gameStatus'] = currentState.gameStatus;

    // Sadece oyun sırasında statü kontrolü yap
    if (currentState.gameStatus !== 'waiting') {
        if (!isDealerTurn) {
            if (playerScore > 21) {
                newStatus = 'player-bust';
            } else if (playerScore === 21 && currentState.playerCards.length === 2) {
                newStatus = 'dealer-turn'; // Blackjack
            }
        } else {
            if (dealerScore > 21) {
                newStatus = 'dealer-bust';
            } else if (dealerScore >= 17) {
                if (playerScore > dealerScore || (playerScore <= 21 && dealerScore > 21)) {
                    newStatus = 'player-win';
                } else if (dealerScore > playerScore) {
                    newStatus = 'dealer-win';
                } else {
                    newStatus = 'push';
                }
            }
        }
    }
    
    return { 
      ...currentState, 
      playerScore, 
      dealerScore, 
      gameStatus: newStatus 
    };
  }, []);

  // Game Over işlemleri
  const handleGameEnd = useCallback(async (finalState: GameState, isDoubleDown: boolean) => {
    if (!user) return;

    let balanceChange = 0;
    let win = false;
    let blackjack = false;
    
    // Kazanma/Kaybetme durumu belirleme
    if (finalState.gameStatus === 'player-win' || finalState.gameStatus === 'dealer-bust') {
      balanceChange = finalState.betAmount * 2;
      win = true;
      if (finalState.playerScore === 21 && finalState.playerCards.length === 2) {
        balanceChange = Math.floor(finalState.betAmount * 2.5); // Blackjack 3:2 öder
        blackjack = true;
      }
    } else if (finalState.gameStatus === 'player-bust' || finalState.gameStatus === 'dealer-win') {
      balanceChange = 0;
      win = false;
    } else if (finalState.gameStatus === 'push') {
      balanceChange = finalState.betAmount; // Bahis iade edilir
      win = false;
    }
    
    const newBalance = finalState.balance - finalState.initialBet + balanceChange; // Başlangıç bahsini düşüp sonra kazancı ekle
    
    // AuthContext'teki balance'ı güncelle
    await updateBalance(newBalance);
    
    // High Score ve Başarımları güncelle
    await updateHighScore(newBalance);
    
    // GameResult objesi (achievementService için)
    const gameResult: GameResult = {
      win,
      blackjack,
      doubleDown: isDoubleDown,
      betAmount: finalState.initialBet, // Başarımlar için başlangıç bahsi
      previousBalance: finalState.balance,
      newBalance: newBalance,
      playerScore: finalState.playerScore,
      playerCards: finalState.playerCards, 
      initialBet: finalState.initialBet, 
    };

    await AchievementService.checkAndUpdateAchievements(user.deviceId, user, gameResult);
    
    // GECİKME MANTIK: Kullanıcının sonucu görmesi için 5 saniye bekle
    await new Promise(resolve => setTimeout(resolve, GAME_END_DELAY));

    // OYUNU SIFIRLAMA: Bahis değerini sıfırla ve oyunu bekleme moduna al.
    setGameState(prev => ({
      ...prev,
      playerCards: [],
      dealerCards: [],
      playerScore: 0,
      dealerScore: 0,
      gameStatus: 'waiting', // Durumu 'waiting' olarak sıfırla
      betAmount: INITIAL_BET, // Bahsi başlangıç/minimum değere sıfırla
      initialBet: INITIAL_BET, // Hata düzeltildi: initialBet sıfırlamaya eklendi
    }));

  }, [user, updateBalance, updateHighScore]);

  // Krupiye Oynama Mantığı
  const dealerPlay = useCallback(async (state: GameState, isDoubleDown: boolean) => {
    let currentState = state;
    
    // Krupiyenin ilk kartını aç
    currentState = updateScoresAndStatus(currentState, true);
    setGameState(currentState); // UI'ı güncelle

    // Krupiye 17'den az olduğu sürece kart çeker
    while (currentState.dealerScore < 17 && currentState.gameStatus === 'dealer-turn') {
      await new Promise(resolve => setTimeout(resolve, 500));
      const { deck: newDeck, card } = drawCard(currentState.deck, 'dealer');
      
      currentState = {
        ...currentState,
        dealerCards: [...currentState.dealerCards, card],
        deck: newDeck,
      };
      
      currentState = updateScoresAndStatus(currentState, true);
      setGameState(currentState);
      
      if (currentState.gameStatus !== 'dealer-turn') {
        break;
      }
    }
    
    // Oyun bitiş durumunu belirle
    currentState = updateScoresAndStatus(currentState, true);
    setGameState(currentState);
    
    // handleGameEnd'i çağır
    if (currentState.gameStatus !== 'player-turn' && currentState.gameStatus !== 'dealer-turn') {
      handleGameEnd(currentState, isDoubleDown);
    }
  }, [drawCard, updateScoresAndStatus, handleGameEnd]);

  // OYUN KONTROL METOTLARI
  const handleStartGame = () => {
    if (!user) return;

    // Bahis değerini input'tan al ve kontrol et
    const currentBet = gameState.betAmount;

    if (currentBet < INITIAL_BET) {
      Alert.alert('Hata', `Minimum bahis ${INITIAL_BET} Çip olmalıdır.`);
      return;
    }

    if (currentBet > user.balance) {
      Alert.alert('Hata', 'Yetersiz bakiye! Lütfen daha düşük bahis yapın.');
      return;
    }

    // Yeni deste hazırla
    let deck = BlackjackService.initializeDeck();
    
    // Kartları dağıt
    const { deck: deck1, card: pCard1 } = drawCard(deck, 'player');
    const { deck: deck2, card: dCard1 } = drawCard(deck1, 'dealer');
    const { deck: deck3, card: pCard2 } = drawCard(deck2, 'player');
    const { deck: finalDeck, card: dCard2 } = drawCard(deck3, 'dealer');

    const newState: GameState = {
      playerCards: [pCard1, pCard2],
      dealerCards: [dCard1, dCard2],
      gameStatus: 'player-turn',
      deck: finalDeck,
      betAmount: currentBet, 
      balance: user.balance,
      playerScore: 0,
      dealerScore: 0,
      initialBet: currentBet, // initialBet, oyunun başlangıç bahsi
    };
    
    // Skoru ilk kez hesapla ve statüyü belirle
    const updatedState = updateScoresAndStatus(newState);
    setGameState(updatedState);
    
    // Eğer oyuncu Blackjack yaptıysa, direk krupiye turuna geç
    if (updatedState.gameStatus !== 'player-turn') {
      dealerPlay(updatedState, false);
    }
  };
  
  const handleHit = () => {
    if (gameState.gameStatus !== 'player-turn') return;
    
    const { deck: newDeck, card } = drawCard(gameState.deck, 'player');
    
    const newState: GameState = {
      ...gameState,
      playerCards: [...gameState.playerCards, card],
      deck: newDeck,
    };
    
    const updatedState = updateScoresAndStatus(newState);
    setGameState(updatedState);
    
    // Eğer bust veya 21 olduysa, oyun bitişini kontrol et
    if (updatedState.gameStatus !== 'player-turn') {
      if (updatedState.gameStatus === 'player-bust') {
        handleGameEnd(updatedState, false);
      } else {
        dealerPlay(updatedState, false);
      }
    }
  };
  
  const handleStand = () => {
    if (gameState.gameStatus !== 'player-turn') return;
    
    setGameState(prev => ({ ...prev, gameStatus: 'dealer-turn' }));
    dealerPlay({ ...gameState, gameStatus: 'dealer-turn' }, false);
  };

  const handleDoubleDown = () => {
    if (gameState.gameStatus !== 'player-turn') return;

    if (gameState.betAmount * 2 > gameState.balance) {
      Alert.alert('Hata', 'Double Down için yetersiz bakiye.');
      return;
    }

    // Bahis miktarını ikiye katla
    const doubledBetAmount = gameState.betAmount * 2;
    
    // Tek bir kart çek
    const { deck: newDeck, card } = drawCard(gameState.deck, 'player');
    
    const newState: GameState = {
      ...gameState,
      playerCards: [...gameState.playerCards, card],
      deck: newDeck,
      betAmount: doubledBetAmount,
    };

    // Skoru güncelle ve stand yap
    const updatedState = updateScoresAndStatus(newState);
    setGameState(updatedState);
    
    // Eğer bust olmadıysa, direk krupiye turuna geç
    if (updatedState.gameStatus !== 'player-bust') {
      setGameState(prev => ({ ...prev, gameStatus: 'dealer-turn' }));
      dealerPlay({ ...updatedState, gameStatus: 'dealer-turn' }, true); 
    } else {
      handleGameEnd(updatedState, true);
    }
  };
  
  // Bahis miktarını TextInput ile doğrudan değiştirme
  const handleBetInputChange = (text: string) => {
    if (gameState.gameStatus !== 'waiting') return;
    
    let newBet = parseInt(text) || 0;
    
    if (newBet < INITIAL_BET) {
        newBet = INITIAL_BET;
    } else if (newBet > user!.balance) {
        newBet = user!.balance;
    }

    setGameState(prev => ({ ...prev, betAmount: newBet }));
  };


  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
        <Text style={{ color: '#fff' }}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#1c2833', dark: '#1c2833' }}
      headerImage={
        <GameHeader 
          balance={user.balance} 
          name={user.name} 
          onExit={handleLogout}
        />
      }
    >
      <ThemedView style={styles.container}>
        <ScrollView style={styles.gameArea}>
          
          <GameStatus status={gameState.gameStatus} />
          
          {/* Krupiye Alanı */}
          {gameState.playerCards.length > 0 && <DealerArea gameState={gameState} />}
          
          {/* Oyuncu Alanı */}
          {gameState.playerCards.length > 0 && <PlayerArea gameState={gameState} />}
          
          {/* Bahis Girişi Alanı */}
          {gameState.gameStatus === 'waiting' && (
             <View style={styles.betInputContainer}>
                <Text style={styles.betInputLabel}>Bahis Miktarı:</Text>
                
                {/* YENİ: Sadece TextInput bırakıldı, butonlar kaldırıldı */}
                <TextInput
                    style={styles.betInput}
                    keyboardType="numeric"
                    value={String(gameState.betAmount)}
                    onChangeText={handleBetInputChange}
                    onBlur={() => handleBetInputChange(String(gameState.betAmount))} // Odak kalkınca temizleme/kontrol
                    placeholder="Bahis"
                    placeholderTextColor="#ccc"
                />
            </View>
          )}

          {/* Oyun Kontrolleri */}
          <Controls
            gameState={gameState}
            onStartGame={handleStartGame}
            onHit={handleHit}
            onStand={handleStand}
            onDoubleDown={handleDoubleDown}
            // onChangeBet kaldırıldı çünkü artık TextInput kullanılıyor
          />

          {/* Kurallar Butonu */}
          <TouchableOpacity style={styles.rulesButton} onPress={() => setShowRulesModal(true)}>
            <Text style={styles.rulesButtonText}>Blackjack Kuralları</Text>
          </TouchableOpacity>
          
          {/* Kurallar Modalı */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={showRulesModal}
            onRequestClose={() => setShowRulesModal(false)}
          >
            <View style={styles.modalContainer}>
              <ThemedView style={styles.modalContent}>
                <ThemedText type="title" style={styles.modalTitle}>Blackjack Kuralları</ThemedText>
                <ScrollView style={{ maxHeight: 400, marginVertical: 15 }}>
                  <Text style={styles.rulesText}>
                    - Amaç, 21'i geçmeden krupiyeden daha yüksek bir puana ulaşmaktır.
                  </Text>
                  <Text style={styles.rulesText}>
                    - Kart değerleri: 2-10 normal değerinde, Vale, Kız, Papaz 10, As 1 veya 11 değerindedir.
                  </Text>
                  <Text style={styles.rulesText}>
                    - **Blackjack (21)**: İlk iki kartınızla 21 yapmaktır. Genellikle 3'e 2 öder.
                  </Text>
                  <Text style={styles.rulesText}>
                    - **Hit (Kart Çek)**: Yeni bir kart istemek.
                  </Text>
                  <Text style={styles.rulesText}>
                    - **Stand (Bekle)**: Mevcut kartlarınızla kalmak ve sırayı krupiyeye vermek.
                  </Text>
                  <Text style={styles.rulesText}>
                    - **Double Down (İkiye Katla)**: Bahsi ikiye katlamak ve sadece tek bir kart daha çekmek.
                  </Text>
                  <Text style={styles.rulesText}>
                    - **Krupiye Kuralı**: Krupiye 16 veya altında kart çekmeye devam eder ve 17 veya üstünde durur.
                  </Text>
                  <Text style={styles.rulesText}>
                    - **Bust**: 21'i geçmek, otomatik kayıp demektir.
                  </Text>
                </ScrollView>
                <TouchableOpacity 
                  style={[styles.controlButton, styles.primaryButton]} 
                  onPress={() => setShowRulesModal(false)}
                >
                  <Text style={styles.controlButtonText}>Kapat</Text>
                </TouchableOpacity>
              </ThemedView>
            </View>
          </Modal>

        </ScrollView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  gameArea: {
    flex: 1,
    paddingTop: 20,
  },
  // Bahis Giriş Alanı
  betInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 20,
    backgroundColor: '#34495e',
    borderRadius: 10,
    marginHorizontal: 16,
  },
  betInputLabel: {
    color: '#ecf0f1',
    fontSize: 16,
    marginRight: 10,
    fontWeight: 'bold',
  },
  betInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderColor: '#3498db',
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    textAlign: 'center',
    minWidth: 80,
    color: '#000',
    marginHorizontal: 5,
  },
  // KULLANIM DIŞI: betButton stilleri kaldırıldı
  controlButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  successButton: {
    backgroundColor: '#2ecc71',
  },
  warningButton: {
    backgroundColor: '#f39c12',
  },
  infoButton: {
    backgroundColor: '#9b59b6',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rulesButton: {
    backgroundColor: '#95a5a6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  rulesButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: '#2c3e50',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    minWidth: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    marginBottom: 10,
  },
  rulesText: {
    color: '#ecf0f1',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  }
});