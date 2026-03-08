// app/blackjack.tsx - YENİ İÇERİK
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { GameState, Card, Suit, Rank } from '@/types/blackjack';

// Header Component
function GameHeader({ balance, name }: { balance: number; name: string }) {
  return (
    <View style={headerStyles.container}>
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
  userInfo: {
    marginTop: 10,
    alignItems: 'center',
  },
  userName: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: 'bold',
  },
  balance: {
    color: '#27ae60',
    fontSize: 14,
    marginTop: 2,
  },
});

// Card Component
function CardComponent({ card, isHidden = false }: { card: Card; isHidden?: boolean }) {
  const getSuitSymbol = (suit: Suit): string => {
    switch(suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  const getCardColor = (suit: Suit): string => {
    return suit === 'hearts' || suit === 'diamonds' ? '#e74c3c' : '#2c3e50';
  };

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
      <Text style={[cardStyles.cardRank, { color: getCardColor(card.suit) }]}>
        {card.rank}
      </Text>
      <Text style={[cardStyles.cardSuit, { color: getCardColor(card.suit) }]}>
        {getSuitSymbol(card.suit)}
      </Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    width: 80,
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#bdc3c7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  hiddenCard: {
    flex: 1,
    backgroundColor: '#3498db',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  hiddenCardText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardRank: {
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  cardSuit: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

// Service Functions
class BlackjackService {
  static initializeDeck(): Card[] {
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const newDeck: Card[] = [];

    for (let deckCount = 0; deckCount < 6; deckCount++) {
      for (const suit of suits) {
        for (const rank of ranks) {
          const value = this.getCardValue(rank);
          const id = `${suit}-${rank}-${deckCount}-${Math.random().toString(36).substr(2, 9)}`;
          newDeck.push({ suit, rank, value, id });
        }
      }
    }

    return this.shuffleDeck(newDeck);
  }

  static getCardValue(rank: Rank): number {
    const values = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 10, 'Q': 10, 'K': 10, 'A': 11
    };
    return values[rank];
  }

  static shuffleDeck(cardDeck: Card[]): Card[] {
    const newDeck = [...cardDeck];
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  }

  static calculateScore(cards: Card[]): number {
    let score = 0;
    let aces = 0;

    cards.forEach(card => {
      if (card.rank === 'A') {
        aces++;
        score += 11;
      } else {
        score += card.value;
      }
    });

    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }

    return score;
  }

  static dealCard(deck: Card[]): { card: Card | null; newDeck: Card[] } {
    if (deck.length === 0) {
      return { card: null, newDeck: deck };
    }
    
    const newDeck = [...deck];
    const card = newDeck.pop()!;
    
    return { card, newDeck };
  }
}

// Main Component
export default function BlackjackScreen() {
  const { user, updateBalance, updateHighScore } = useAuth();
  const [gameState, setGameState] = useState<GameState>({
    playerCards: [],
    dealerCards: [],
    playerScore: 0,
    dealerScore: 0,
    gameStatus: 'waiting',
    deck: [],
    betAmount: 10,
    balance: user?.balance || 1000
  });

  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    initializeDeck();
  }, []);

  // Kullanıcı değiştiğinde balance'i güncelle
  useEffect(() => {
    if (user) {
      setGameState(prev => ({
        ...prev,
        balance: user.balance
      }));
    }
  }, [user]);

  const initializeDeck = () => {
    const newDeck = BlackjackService.initializeDeck();
    setGameState(prev => ({
      ...prev,
      deck: newDeck,
      gameStatus: 'waiting'
    }));
  };

  const getStatusMessage = () => {
    switch (gameState.gameStatus) {
      case 'waiting': return 'Oyunu Başlatmak İçin "Yeni El" Butonuna Basın';
      case 'player-turn': return 'Sıra Sizde: Kart Çek veya Bekle';
      case 'dealer-turn': return 'Krupiye Oynuyor...';
      case 'player-bust': return 'Bust! 21\'i Aştınız';
      case 'dealer-bust': return 'Krupiye Bust! Kazandınız!';
      case 'player-win': return 'Tebrikler! Kazandınız!';
      case 'dealer-win': return 'Krupiye Kazandı';
      case 'push': return 'Berabere! Paranız İade';
      default: return '';
    }
  };

  const getStatusColor = () => {
    switch (gameState.gameStatus) {
      case 'player-win':
      case 'dealer-bust': return '#27ae60';
      case 'dealer-win':
      case 'player-bust': return '#e74c3c';
      case 'push': return '#f39c12';
      default: return '#3498db';
    }
  };

  const startGame = () => {
    if (gameState.balance < gameState.betAmount) {
      Alert.alert('Yetersiz Bakiye!', 'Bahis için yeterli bakiyeniz yok.');
      return;
    }

    const newGameState: GameState = {
      ...gameState,
      playerCards: [],
      dealerCards: [],
      playerScore: 0,
      dealerScore: 0,
      gameStatus: 'player-turn',
      balance: gameState.balance - gameState.betAmount
    };

    setGameState(newGameState);

    // Firebase'de bakiyeyi güncelle
    updateBalance(newGameState.balance);

    setTimeout(() => {
      let currentDeck = newGameState.deck;
      let playerCards: Card[] = [];
      let dealerCards: Card[] = [];

      // Oyuncuya 2 kart
      const playerCard1 = BlackjackService.dealCard(currentDeck);
      if (playerCard1.card) {
        playerCards.push(playerCard1.card);
        currentDeck = playerCard1.newDeck;
      }

      const playerCard2 = BlackjackService.dealCard(currentDeck);
      if (playerCard2.card) {
        playerCards.push(playerCard2.card);
        currentDeck = playerCard2.newDeck;
      }

      const playerScore = BlackjackService.calculateScore(playerCards);

      // Krupiyeye 2 kart
      const dealerCard1 = BlackjackService.dealCard(currentDeck);
      if (dealerCard1.card) {
        dealerCards.push(dealerCard1.card);
        currentDeck = dealerCard1.newDeck;
      }

      const dealerCard2 = BlackjackService.dealCard(currentDeck);
      if (dealerCard2.card) {
        dealerCards.push(dealerCard2.card);
        currentDeck = dealerCard2.newDeck;
      }

      const dealerScore = BlackjackService.calculateScore([dealerCards[0]]);

      setGameState(prev => ({
        ...prev,
        playerCards,
        dealerCards,
        playerScore,
        dealerScore,
        deck: currentDeck
      }));

      if (playerScore === 21) {
        checkBlackjack(playerCards, dealerCards);
      }
    }, 100);
  };

  const checkBlackjack = (playerCards: Card[], dealerCards: Card[]) => {
    const playerHasBlackjack = BlackjackService.calculateScore(playerCards) === 21 && playerCards.length === 2;
    const dealerHasBlackjack = BlackjackService.calculateScore(dealerCards) === 21 && dealerCards.length === 2;

    if (playerHasBlackjack && dealerHasBlackjack) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'push',
        balance: prev.balance + prev.betAmount,
        dealerScore: BlackjackService.calculateScore(dealerCards)
      }));
      updateBalance(gameState.balance + gameState.betAmount);
    } else if (playerHasBlackjack) {
      const winnings = Math.floor(gameState.betAmount * 2.5);
      setGameState(prev => ({
        ...prev,
        gameStatus: 'player-win',
        balance: prev.balance + winnings
      }));
      updateBalance(gameState.balance + winnings);
      updateHighScore(winnings);
    } else if (dealerHasBlackjack) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'dealer-win',
        dealerScore: BlackjackService.calculateScore(dealerCards)
      }));
    }
  };

  const hit = () => {
    if (gameState.gameStatus !== 'player-turn') return;

    const { card, newDeck } = BlackjackService.dealCard(gameState.deck);
    if (card) {
      const newPlayerCards = [...gameState.playerCards, card];
      const newPlayerScore = BlackjackService.calculateScore(newPlayerCards);

      setGameState(prev => ({
        ...prev,
        playerCards: newPlayerCards,
        playerScore: newPlayerScore,
        deck: newDeck
      }));

      if (newPlayerScore > 21) {
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            gameStatus: 'player-bust'
          }));
        }, 500);
      }
    } else {
      initializeDeck();
    }
  };

  const stand = () => {
    if (gameState.gameStatus !== 'player-turn') return;

    setGameState(prev => ({
      ...prev,
      gameStatus: 'dealer-turn'
    }));

    dealerPlay();
  };

  const dealerPlay = () => {
    let currentDealerCards = [...gameState.dealerCards];
    let currentDeck = [...gameState.deck];
    let currentDealerScore = BlackjackService.calculateScore(currentDealerCards);

    const dealerTurn = () => {
      if (currentDealerScore < 17) {
        setTimeout(() => {
          const { card, newDeck } = BlackjackService.dealCard(currentDeck);
          if (card) {
            currentDealerCards.push(card);
            currentDeck = newDeck;
            currentDealerScore = BlackjackService.calculateScore(currentDealerCards);

            setGameState(prev => ({
              ...prev,
              dealerCards: currentDealerCards,
              dealerScore: currentDealerScore,
              deck: currentDeck
            }));

            if (currentDealerScore > 21) {
              setTimeout(() => {
                const newBalance = gameState.balance + (gameState.betAmount * 2);
                setGameState(prev => ({
                  ...prev,
                  gameStatus: 'dealer-bust',
                  balance: newBalance
                }));
                updateBalance(newBalance);
                updateHighScore(gameState.betAmount * 2);
              }, 1000);
            } else if (currentDealerScore >= 17) {
              setTimeout(() => {
                determineWinner();
              }, 1000);
            } else {
              dealerTurn();
            }
          }
        }, 1000);
      } else {
        setTimeout(() => {
          determineWinner();
        }, 1000);
      }
    };

    dealerTurn();
  };

  const determineWinner = () => {
    const playerScore = gameState.playerScore;
    const dealerScore = BlackjackService.calculateScore(gameState.dealerCards);

    if (dealerScore > 21) {
      const newBalance = gameState.balance + (gameState.betAmount * 2);
      setGameState(prev => ({
        ...prev,
        gameStatus: 'dealer-bust',
        balance: newBalance
      }));
      updateBalance(newBalance);
      updateHighScore(gameState.betAmount * 2);
    } else if (playerScore > dealerScore) {
      const newBalance = gameState.balance + (gameState.betAmount * 2);
      setGameState(prev => ({
        ...prev,
        gameStatus: 'player-win',
        balance: newBalance
      }));
      updateBalance(newBalance);
      updateHighScore(gameState.betAmount * 2);
    } else if (playerScore < dealerScore) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'dealer-win'
      }));
    } else {
      const newBalance = gameState.balance + gameState.betAmount;
      setGameState(prev => ({
        ...prev,
        gameStatus: 'push',
        balance: newBalance
      }));
      updateBalance(newBalance);
    }
  };

  const doubleDown = () => {
    if (gameState.gameStatus !== 'player-turn' || gameState.playerCards.length !== 2) return;
    
    if (gameState.balance < gameState.betAmount) {
      Alert.alert('Yetersiz Bakiye!', 'Double down için yeterli bakiyeniz yok.');
      return;
    }

    const newBetAmount = gameState.betAmount * 2;
    const newBalance = gameState.balance - gameState.betAmount;

    setGameState(prev => ({
      ...prev,
      betAmount: newBetAmount,
      balance: newBalance
    }));

    updateBalance(newBalance);

    setTimeout(() => {
      hit();
      setTimeout(() => {
        if (gameState.playerScore <= 21) {
          stand();
        }
      }, 500);
    }, 300);
  };

  const changeBet = (amount: number) => {
    if (gameState.gameStatus !== 'waiting') return;
    
    const newBet = gameState.betAmount + amount;
    if (newBet >= 10 && newBet <= gameState.balance) {
      setGameState(prev => ({
        ...prev,
        betAmount: newBet
      }));
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Kullanıcı bilgisi yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#1a1a1a', dark: '#2d2d2d' }}
      headerImage={<GameHeader balance={gameState.balance} name={user.name} />}
    >
      
      {/* Bakiyeler */}
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

      {/* Oyun Durumu */}
      <ThemedView style={[styles.statusContainer, { backgroundColor: getStatusColor() + '20' }]}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusMessage()}
        </Text>
      </ThemedView>

      {/* Krupiye */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Krupiye: {gameState.dealerScore}</ThemedText>
        <ScrollView 
          horizontal 
          style={styles.cardsContainer}
          showsHorizontalScrollIndicator={false}
        >
          {gameState.dealerCards.map((card, index) => (
            <CardComponent
              key={card.id}
              card={card}
              isHidden={index === 1 && gameState.gameStatus === 'player-turn'}
            />
          ))}
        </ScrollView>
      </ThemedView>

      {/* Oyuncu */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Siz: {gameState.playerScore}</ThemedText>
        <ScrollView 
          horizontal 
          style={styles.cardsContainer}
          showsHorizontalScrollIndicator={false}
        >
          {gameState.playerCards.map((card) => (
            <CardComponent key={card.id} card={card} />
          ))}
        </ScrollView>
      </ThemedView>

      {/* Kontroller */}
      <ThemedView style={styles.controlsContainer}>
        {gameState.gameStatus === 'waiting' ? (
          <View>
            <View style={styles.betControls}>
              <TouchableOpacity 
                style={styles.betButton} 
                onPress={() => changeBet(-10)}
                disabled={gameState.betAmount <= 10}
              >
                <Text style={styles.betButtonText}>-10</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.betButton} 
                onPress={() => changeBet(10)}
                disabled={gameState.betAmount >= gameState.balance}
              >
                <Text style={styles.betButtonText}>+10</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.betButton} 
                onPress={() => changeBet(50)}
                disabled={gameState.betAmount + 50 > gameState.balance}
              >
                <Text style={styles.betButtonText}>+50</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.primaryButton]} 
              onPress={startGame}
            >
              <Text style={styles.controlButtonText}>🎲 Yeni El (${gameState.betAmount})</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.gameControls}>
            {gameState.gameStatus === 'player-turn' && (
              <>
                <TouchableOpacity 
                  style={[styles.controlButton, styles.successButton]} 
                  onPress={hit}
                >
                  <Text style={styles.controlButtonText}>✅ Hit (Kart Çek)</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.controlButton, styles.warningButton]} 
                  onPress={stand}
                >
                  <Text style={styles.controlButtonText}>✋ Stand (Bekle)</Text>
                </TouchableOpacity>
                
                {gameState.playerCards.length === 2 && (
                  <TouchableOpacity 
                    style={[styles.controlButton, styles.infoButton]} 
                    onPress={doubleDown}
                    disabled={gameState.balance < gameState.betAmount}
                  >
                    <Text style={styles.controlButtonText}>⚡ Double Down</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            
            {(gameState.gameStatus === 'player-win' || 
              gameState.gameStatus === 'dealer-win' || 
              gameState.gameStatus === 'push' ||
              gameState.gameStatus === 'player-bust' ||
              gameState.gameStatus === 'dealer-bust') && (
              <TouchableOpacity 
                style={[styles.controlButton, styles.primaryButton]} 
                onPress={startGame}
              >
                <Text style={styles.controlButtonText}>🔄 Yeni El</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ThemedView>

      {/* Kurallar Butonu */}
      <TouchableOpacity 
        style={styles.rulesButton}
        onPress={() => setShowRules(true)}
      >
        <Text style={styles.rulesButtonText}>📖 Blackjack Kuralları</Text>
      </TouchableOpacity>

      {/* Kurallar Modal */}
      <Modal visible={showRules} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Blackjack Kuralları</Text>
            <ScrollView style={styles.rulesList}>
              <Text style={styles.ruleItem}>🎯 Amaç: 21'e en yakın sayıyı yapmak</Text>
              <Text style={styles.ruleItem}>🃏 As: 1 veya 11 değerinde</Text>
              <Text style={styles.ruleItem}>👑 J, Q, K: 10 değerinde</Text>
              <Text style={styles.ruleItem}>✅ Hit: Ek kart çekmek</Text>
              <Text style={styles.ruleItem}>✋ Stand: Kart çekmemek</Text>
              <Text style={styles.ruleItem}>⚡ Double Down: Bahsi 2x yapıp 1 kart çekmek</Text>
              <Text style={styles.ruleItem}>💥 Bust: 21'i aşmak (kaybetmek)</Text>
              <Text style={styles.ruleItem}>🎲 Blackjack: İlk 2 kartla 21 yapmak (3:2 öder)</Text>
              <Text style={styles.ruleItem}>🤵 Krupiye: 17'ye kadar çeker, 17+ durur</Text>
            </ScrollView>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowRules(false)}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#ecf0f1',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  controlsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  betControls: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
    justifyContent: 'center',
  },
  betButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  betButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  gameControls: {
    gap: 10,
  },
  controlButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  successButton: {
    backgroundColor: '#27ae60',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    marginBottom: 15,
    color: '#2c3e50',
  },
  rulesList: {
    maxHeight: 400,
  },
  ruleItem: {
    fontSize: 16,
    paddingVertical: 8,
    color: '#34495e',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});