// app/(tabs)/index.tsx
import MultiplayerScreen from '@/app/multiplayer';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { BlackjackService } from '@/services/blackjackService';
import { Card, GameState, Suit } from '@/types/blackjack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type AppScreen = 'menu' | 'solo' | 'multi';

// ─────────────────────────────────────────────
// Ana Menü
// ─────────────────────────────────────────────
function MainMenu({ user, onSelect }: { user: any; onSelect: (mode: AppScreen) => void }) {
  return (
    <View style={menuStyles.container}>
      <View style={menuStyles.header}>
        <Text style={menuStyles.title}>♠️ Blackjack ♥️</Text>
        <Text style={menuStyles.welcome}>Merhaba, {user?.name}!</Text>
        <Text style={menuStyles.balance}>Bakiye: ${user?.balance ?? 0}</Text>
      </View>

      <TouchableOpacity style={menuStyles.card} onPress={() => onSelect('solo')}>
        <Text style={menuStyles.cardIcon}>🎰</Text>
        <View style={menuStyles.cardText}>
          <Text style={menuStyles.cardTitle}>Solo Oyna</Text>
          <Text style={menuStyles.cardDesc}>Krupiyeye karşı tek başına oyna</Text>
        </View>
        <Text style={menuStyles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[menuStyles.card, { borderColor: '#9b59b6' }]} onPress={() => onSelect('multi')}>
        <Text style={menuStyles.cardIcon}>👥</Text>
        <View style={menuStyles.cardText}>
          <Text style={menuStyles.cardTitle}>Multiplayer</Text>
          <Text style={menuStyles.cardDesc}>Arkadaşlarınla oyna</Text>
        </View>
        <Text style={menuStyles.arrow}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const menuStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117', padding: 24, justifyContent: 'center' },
  header:    { alignItems: 'center', marginBottom: 40 },
  title:     { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 12 },
  welcome:   { color: '#3498db', fontSize: 18, fontWeight: 'bold' },
  balance:   { color: '#27ae60', fontSize: 16, marginTop: 4 },
  card:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161b22', borderRadius: 14, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#3498db' },
  cardIcon:  { fontSize: 32, marginRight: 16 },
  cardText:  { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardDesc:  { color: '#8b949e', fontSize: 13, marginTop: 3 },
  arrow:     { color: '#8b949e', fontSize: 26 },
});

// ─────────────────────────────────────────────
// Header Component
// ─────────────────────────────────────────────
function GameHeader({ balance, name, onBack }: { balance: number; name: string; onBack: () => void }) {
  return (
    <View style={headerStyles.container}>
      <TouchableOpacity style={headerStyles.backBtn} onPress={onBack}>
        <Text style={headerStyles.backTxt}>‹ Menü</Text>
      </TouchableOpacity>
      <Text style={headerStyles.title}>♠️ Blackjack ♥️</Text>
      <Text style={headerStyles.subtitle}>21'e En Yakın Kazanır!</Text>
      <View style={headerStyles.userInfo}>
        <Text style={headerStyles.userName}>Merhaba, {name}!</Text>
        <Text style={headerStyles.balance}>Bakiye: ${balance}</Text>
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#2c3e50', alignItems: 'center' },
  backBtn:   { position: 'absolute', left: 16, top: 20 },
  backTxt:   { color: '#3498db', fontSize: 16, fontWeight: 'bold' },
  title:     { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  subtitle:  { color: '#ecf0f1', fontSize: 16, marginTop: 5 },
  userInfo:  { marginTop: 10, alignItems: 'center' },
  userName:  { color: '#3498db', fontSize: 16, fontWeight: 'bold' },
  balance:   { color: '#27ae60', fontSize: 14, marginTop: 2 },
});

// ─────────────────────────────────────────────
// Card Component
// ─────────────────────────────────────────────
function CardComponent({ card, isHidden = false }: { card: Card; isHidden?: boolean }) {
  const getSuitSymbol = (suit: Suit): string => {
    switch (suit) {
      case 'hearts':   return '♥';
      case 'diamonds': return '♦';
      case 'clubs':    return '♣';
      case 'spades':   return '♠';
      default:         return '';
    }
  };

  const getCardColor = (suit: Suit): string =>
    suit === 'hearts' || suit === 'diamonds' ? '#e74c3c' : '#2c3e50';

  if (isHidden) {
    return (
      <View style={cardStyles.card}>
        <View style={cardStyles.hiddenCard}>
          <Text style={cardStyles.hiddenCardText}>?</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={cardStyles.card}>
      <Text style={[cardStyles.cardRank, { color: getCardColor(card.suit) }]}>{card.rank}</Text>
      <Text style={[cardStyles.cardSuit, { color: getCardColor(card.suit) }]}>{getSuitSymbol(card.suit)}</Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card:           { width: 80, height: 120, backgroundColor: '#fff', borderRadius: 8, padding: 10, justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: '#bdc3c7', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, marginRight: 8 },
  hiddenCard:     { flex: 1, backgroundColor: '#3498db', borderRadius: 6, justifyContent: 'center', alignItems: 'center', width: '100%' },
  hiddenCardText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  cardRank:       { fontSize: 18, fontWeight: 'bold', alignSelf: 'flex-start' },
  cardSuit:       { fontSize: 24, fontWeight: 'bold' },
});

// ─────────────────────────────────────────────
// Initial State Factory
// ─────────────────────────────────────────────
const createInitialState = (balance: number, betAmount = 10): GameState => ({
  playerCards: [],
  dealerCards: [],
  playerScore: 0,
  dealerScore: 0,
  gameStatus: 'waiting',
  deck: BlackjackService.initializeDeck(),
  betAmount,
  balance,
  initialBet: betAmount,
});

// ─────────────────────────────────────────────
// Solo Oyun Ekranı
// ─────────────────────────────────────────────
function SoloGame({ onBackToMenu }: { onBackToMenu: () => void }) {
  const { user, updateBalance, updateHighScore } = useAuth();

  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialState(user?.balance ?? 1000)
  );
  const [showRules, setShowRules] = useState(false);

  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  useEffect(() => {
    if (user) {
      setGameState(prev =>
        prev.gameStatus === 'waiting' ? { ...prev, balance: user.balance } : prev
      );
    }
  }, [user?.balance]);

  // ── Geri Dön (Ceza) ──────────────────────────
  const handleBack = () => {
    const current = gameStateRef.current;
    const isInGame = ['player-turn', 'dealer-turn'].includes(current.gameStatus);

    if (isInGame) {
      Alert.alert(
        '⚠️ Oyundan Çık',
        `Oyunu terk ederseniz bahsiniz olan $${current.betAmount} kaybedilecek!\n\nDevam etmek istiyor musunuz?`,
        [
          { text: 'Oyunda Kal', style: 'cancel' },
          {
            text: 'Çık ve Kaybет',
            style: 'destructive',
            onPress: async () => {
              // Bahsi düş, Firebase güncelle
              const penaltyBalance = current.balance;
              await updateBalance(penaltyBalance);
              onBackToMenu();
            },
          },
        ]
      );
    } else {
      onBackToMenu();
    }
  };

  // ── Yardımcı ─────────────────────────────────
  const getStatusMessage = (): string => {
    switch (gameState.gameStatus) {
      case 'waiting':     return 'Oyunu Başlatmak İçin "Yeni El" Butonuna Basın';
      case 'player-turn': return 'Sıra Sizde: Kart Çek veya Bekle';
      case 'dealer-turn': return 'Krupiye Oynuyor...';
      case 'player-bust': return "Bust! 21'i Aştınız";
      case 'dealer-bust': return 'Krupiye Bust! Kazandınız!';
      case 'player-win':  return 'Tebrikler! Kazandınız!';
      case 'dealer-win':  return 'Krupiye Kazandı';
      case 'push':        return 'Berabere! Paranız İade';
      default:            return '';
    }
  };

  const getStatusColor = (): string => {
    switch (gameState.gameStatus) {
      case 'player-win':
      case 'dealer-bust': return '#27ae60';
      case 'dealer-win':
      case 'player-bust': return '#e74c3c';
      case 'push':        return '#f39c12';
      default:            return '#3498db';
    }
  };

  const changeBet = (amount: number) => {
    if (gameState.gameStatus !== 'waiting') return;
    const newBet = gameState.betAmount + amount;
    if (newBet >= 10 && newBet <= gameState.balance) {
      setGameState(prev => ({ ...prev, betAmount: newBet }));
    }
  };

  const finalizeResult = useCallback((status: GameState['gameStatus'], balanceDelta: number) => {
    const current = gameStateRef.current;
    const newBalance = current.balance + balanceDelta;
    setGameState(prev => ({
      ...prev,
      gameStatus: status,
      balance: newBalance,
      dealerScore: BlackjackService.calculateScore(prev.dealerCards),
    }));
    updateBalance(newBalance);
    if (balanceDelta > 0) updateHighScore(balanceDelta);
  }, [updateBalance, updateHighScore]);

  const determineWinner = useCallback(() => {
    const current = gameStateRef.current;
    const playerScore = current.playerScore;
    const dealerScore = BlackjackService.calculateScore(current.dealerCards);
    if (dealerScore > 21)            finalizeResult('dealer-bust', current.betAmount * 2);
    else if (playerScore > dealerScore) finalizeResult('player-win', current.betAmount * 2);
    else if (playerScore < dealerScore) finalizeResult('dealer-win', 0);
    else                             finalizeResult('push', current.betAmount);
  }, [finalizeResult]);

  const dealerPlay = useCallback(() => {
    const runDealerTurn = () => {
      const current = gameStateRef.current;
      const dealerScore = BlackjackService.calculateScore(current.dealerCards);
      if (dealerScore < 17) {
        setTimeout(() => {
          const { card, newDeck } = BlackjackService.drawCard(gameStateRef.current.deck);
          if (!card) { determineWinner(); return; }
          const newDealerCards = [...gameStateRef.current.dealerCards, card];
          const newDealerScore = BlackjackService.calculateScore(newDealerCards);
          setGameState(prev => ({ ...prev, dealerCards: newDealerCards, dealerScore: newDealerScore, deck: newDeck }));
          if (newDealerScore > 21)      setTimeout(() => finalizeResult('dealer-bust', gameStateRef.current.betAmount * 2), 800);
          else if (newDealerScore >= 17) setTimeout(determineWinner, 800);
          else                          runDealerTurn();
        }, 900);
      } else {
        setTimeout(determineWinner, 800);
      }
    };
    runDealerTurn();
  }, [determineWinner, finalizeResult]);

  const checkBlackjack = useCallback((playerCards: Card[], dealerCards: Card[]) => {
    const playerBJ = BlackjackService.calculateScore(playerCards) === 21 && playerCards.length === 2;
    const dealerBJ = BlackjackService.calculateScore(dealerCards) === 21 && dealerCards.length === 2;
    const current = gameStateRef.current;
    if (playerBJ && dealerBJ) {
      finalizeResult('push', current.betAmount);
    } else if (playerBJ) {
      finalizeResult('player-win', current.betAmount + Math.floor(current.betAmount * 1.5));
    } else if (dealerBJ) {
      setGameState(prev => ({ ...prev, gameStatus: 'dealer-win', dealerScore: BlackjackService.calculateScore(dealerCards) }));
    }
  }, [finalizeResult]);

  const startGame = useCallback(() => {
    const current = gameStateRef.current;
    if (current.balance < current.betAmount) {
      Alert.alert('Yetersiz Bakiye!', 'Bahis için yeterli bakiyeniz yok.');
      return;
    }
    const balanceAfterBet = current.balance - current.betAmount;
    let deck = current.deck.length < 20 ? BlackjackService.initializeDeck() : current.deck;
    const { newDeck: d1, playerCards, dealerCards } = BlackjackService.dealInitialCards(deck);
    const playerScore = BlackjackService.calculateScore(playerCards);
    const dealerScore = BlackjackService.calculateScore([dealerCards[0]]);
    setGameState(prev => ({ ...prev, playerCards, dealerCards, playerScore, dealerScore, gameStatus: 'player-turn', deck: d1, balance: balanceAfterBet, initialBet: prev.betAmount }));
    updateBalance(balanceAfterBet);
    if (playerScore === 21 || BlackjackService.calculateScore(dealerCards) === 21) {
      setTimeout(() => checkBlackjack(playerCards, dealerCards), 300);
    }
  }, [updateBalance, checkBlackjack]);

  const hit = useCallback(() => {
    const current = gameStateRef.current;
    if (current.gameStatus !== 'player-turn') return;
    const { card, newDeck } = BlackjackService.drawCard(current.deck);
    if (!card) return;
    const newPlayerCards = [...current.playerCards, card];
    const newPlayerScore = BlackjackService.calculateScore(newPlayerCards);
    setGameState(prev => ({ ...prev, playerCards: newPlayerCards, playerScore: newPlayerScore, deck: newDeck }));
    if (newPlayerScore > 21) setTimeout(() => setGameState(prev => ({ ...prev, gameStatus: 'player-bust' })), 400);
  }, []);

  const stand = useCallback(() => {
    if (gameStateRef.current.gameStatus !== 'player-turn') return;
    setGameState(prev => ({ ...prev, gameStatus: 'dealer-turn' }));
    setTimeout(dealerPlay, 300);
  }, [dealerPlay]);

  const doubleDown = useCallback(() => {
    const current = gameStateRef.current;
    if (current.gameStatus !== 'player-turn' || current.playerCards.length !== 2) return;
    if (current.balance < current.betAmount) {
      Alert.alert('Yetersiz Bakiye!', 'Double down için yeterli bakiyeniz yok.');
      return;
    }
    const newBetAmount = current.betAmount * 2;
    const newBalance   = current.balance - current.betAmount;
    setGameState(prev => ({ ...prev, betAmount: newBetAmount, balance: newBalance }));
    updateBalance(newBalance);
    const { card, newDeck } = BlackjackService.drawCard(current.deck);
    if (!card) return;
    const newPlayerCards = [...current.playerCards, card];
    const newPlayerScore = BlackjackService.calculateScore(newPlayerCards);
    setGameState(prev => ({ ...prev, playerCards: newPlayerCards, playerScore: newPlayerScore, deck: newDeck }));
    setTimeout(() => {
      if (newPlayerScore > 21) setGameState(prev => ({ ...prev, gameStatus: 'player-bust' }));
      else { setGameState(prev => ({ ...prev, gameStatus: 'dealer-turn' })); setTimeout(dealerPlay, 300); }
    }, 500);
  }, [updateBalance, dealerPlay]);

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Kullanıcı bilgisi yükleniyor...</Text>
      </View>
    );
  }

  const isGameOver = ['player-win','dealer-win','push','player-bust','dealer-bust'].includes(gameState.gameStatus);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#1a1a1a', dark: '#2d2d2d' }}
      headerImage={<GameHeader balance={gameState.balance} name={user.name} onBack={handleBack} />}
    >
      <ThemedView style={styles.balanceContainer}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Mevcut Bakiye</Text>
          <Text style={styles.balanceValue}>${gameState.balance}</Text>
        </View>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Bahis</Text>
          <Text style={styles.balanceValue}>${gameState.betAmount}</Text>
        </View>
      </ThemedView>

      <ThemedView style={[styles.statusContainer, { backgroundColor: getStatusColor() + '20' }]}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusMessage()}</Text>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">
          Krupiye: {gameState.dealerCards.length === 0
            ? 0
            : gameState.gameStatus === 'player-turn'
              ? BlackjackService.calculateScore([gameState.dealerCards[0]])
              : BlackjackService.calculateScore(gameState.dealerCards)}
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsContainer}>
          {gameState.dealerCards.map((card, index) => (
            <CardComponent key={card.id} card={card} isHidden={index === 1 && gameState.gameStatus === 'player-turn'} />
          ))}
        </ScrollView>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Siz: {gameState.playerScore}</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsContainer}>
          {gameState.playerCards.map(card => <CardComponent key={card.id} card={card} />)}
        </ScrollView>
      </ThemedView>

      <ThemedView style={styles.controlsContainer}>
        {gameState.gameStatus === 'waiting' && (
          <View>
            <View style={styles.betControls}>
              {[-50, -10, 10, 50].map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.betButton, ((amount < 0 && gameState.betAmount + amount < 10) || (amount > 0 && gameState.betAmount + amount > gameState.balance)) && styles.disabledButton]}
                  onPress={() => changeBet(amount)}
                  disabled={(amount < 0 && gameState.betAmount + amount < 10) || (amount > 0 && gameState.betAmount + amount > gameState.balance)}
                >
                  <Text style={styles.betButtonText}>{amount > 0 ? `+${amount}` : amount}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.controlButton, styles.primaryButton]} onPress={startGame}>
              <Text style={styles.controlButtonText}>🎲 Yeni El (${gameState.betAmount})</Text>
            </TouchableOpacity>
          </View>
        )}

        {gameState.gameStatus === 'player-turn' && (
          <View style={styles.gameControls}>
            <TouchableOpacity style={[styles.controlButton, styles.successButton]} onPress={hit}>
              <Text style={styles.controlButtonText}>✅ Hit (Kart Çek)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlButton, styles.warningButton]} onPress={stand}>
              <Text style={styles.controlButtonText}>✋ Stand (Bekle)</Text>
            </TouchableOpacity>
            {gameState.playerCards.length === 2 && (
              <TouchableOpacity
                style={[styles.controlButton, styles.infoButton, gameState.balance < gameState.betAmount && styles.disabledButton]}
                onPress={doubleDown}
                disabled={gameState.balance < gameState.betAmount}
              >
                <Text style={styles.controlButtonText}>⚡ Double Down</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isGameOver && (
          <TouchableOpacity style={[styles.controlButton, styles.primaryButton]} onPress={startGame}>
            <Text style={styles.controlButtonText}>🔄 Yeni El</Text>
          </TouchableOpacity>
        )}
      </ThemedView>

      <TouchableOpacity style={styles.rulesButton} onPress={() => setShowRules(true)}>
        <Text style={styles.rulesButtonText}>📖 Blackjack Kuralları</Text>
      </TouchableOpacity>

      <Modal visible={showRules} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Blackjack Kuralları</Text>
            <ScrollView style={styles.rulesList}>
              {[
                "🎯 Amaç: 21'e en yakın sayıyı yapmak",
                '🃏 As: 1 veya 11 değerinde',
                '👑 J, Q, K: 10 değerinde',
                '✅ Hit: Ek kart çekmek',
                '✋ Stand: Kart çekmemek',
                '⚡ Double Down: Bahsi 2x yapıp 1 kart çekmek',
                "💥 Bust: 21'i aşmak (kaybetmek)",
                '🎲 Blackjack: İlk 2 kartla 21 yapmak (3:2 öder)',
                "🤵 Krupiye: 17'ye kadar çeker, 17+ durur",
              ].map((rule, i) => <Text key={i} style={styles.ruleItem}>{rule}</Text>)}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowRules(false)}>
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ParallaxScrollView>
  );
}

// ─────────────────────────────────────────────
// Ana Export — Menü + Ekran Yönetimi
// ─────────────────────────────────────────────
export default function PlayScreen() {
  const { user } = useAuth();
  const [screen, setScreen] = useState<AppScreen>('menu');

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Kullanıcı bilgisi yükleniyor...</Text>
      </View>
    );
  }

  if (screen === 'solo') {
    return <SoloGame onBackToMenu={() => setScreen('menu')} />;
  }

  if (screen === 'multi') {
    return <MultiplayerScreen onBackToMenu={() => setScreen('menu')} />;
  }

  return <MainMenu user={user} onSelect={setScreen} />;
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' },
  loadingText:      { color: '#fff', fontSize: 18 },
  balanceContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, marginHorizontal: 16, marginBottom: 16, borderRadius: 12, backgroundColor: '#ecf0f1' },
  balanceItem:      { alignItems: 'center' },
  balanceLabel:     { fontSize: 14, color: '#7f8c8d', marginBottom: 4 },
  balanceValue:     { fontSize: 24, fontWeight: 'bold', color: '#2c3e50' },
  statusContainer:  { padding: 16, marginHorizontal: 16, marginBottom: 20, borderRadius: 12, alignItems: 'center' },
  statusText:       { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  section:          { marginBottom: 25, paddingHorizontal: 16 },
  cardsContainer:   { flexDirection: 'row', marginTop: 10 },
  controlsContainer:{ paddingHorizontal: 16, marginBottom: 20 },
  betControls:      { flexDirection: 'row', gap: 8, marginBottom: 15, justifyContent: 'center' },
  betButton:        { backgroundColor: '#3498db', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  betButtonText:    { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  disabledButton:   { backgroundColor: '#bdc3c7' },
  gameControls:     { gap: 10 },
  controlButton:    { paddingVertical: 15, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center' },
  primaryButton:    { backgroundColor: '#3498db' },
  successButton:    { backgroundColor: '#27ae60' },
  warningButton:    { backgroundColor: '#f39c12' },
  infoButton:       { backgroundColor: '#9b59b6' },
  controlButtonText:{ color: '#fff', fontSize: 16, fontWeight: 'bold' },
  rulesButton:      { backgroundColor: '#95a5a6', padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 16, marginBottom: 20 },
  rulesButtonText:  { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  modalContainer:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent:     { backgroundColor: '#fff', borderRadius: 12, padding: 20, margin: 20, maxHeight: '80%', minWidth: '80%' },
  modalTitle:       { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#2c3e50' },
  rulesList:        { maxHeight: 400 },
  ruleItem:         { fontSize: 16, paddingVertical: 8, color: '#34495e', borderBottomWidth: 1, borderBottomColor: '#ecf0f1' },
  closeButton:      { backgroundColor: '#e74c3c', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  closeButtonText:  { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
