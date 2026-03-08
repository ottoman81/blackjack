// src/screens/BlackjackScreen.tsx
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GameState } from '@/types/blackjack';
import { BlackjackService } from '@/services/blackjackService';
import DealerArea from '@/components/blackjack/DealerArea';
import PlayerArea from '@/components/blackjack/PlayerArea';
import GameStatus from '@/components/blackjack/GameStatus';
import Controls from '@/components/blackjack/Controls';

// Header Component - HATA DÜZELTMESİ: null yerine JSX elementi
function GameHeader() {
  return (
    <View style={headerStyles.container}>
      <Text style={headerStyles.title}>♠️ Blackjack ♥️</Text>
      <Text style={headerStyles.subtitle}>21'e En Yakın Kazanır!</Text>
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

export default function BlackjackScreen() {
  const [gameState, setGameState] = useState<GameState>({
    playerCards: [],
    dealerCards: [],
    playerScore: 0,
    dealerScore: 0,
    gameStatus: 'waiting',
    deck: [],
    betAmount: 10,
    balance: 1000
  });

  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    initializeDeck();
  }, []);

  const initializeDeck = () => {
    const newDeck = BlackjackService.initializeDeck();
    setGameState(prev => ({
      ...prev,
      deck: newDeck,
      gameStatus: 'waiting'
    }));
  };

  const startGame = () => {
    if (gameState.balance < gameState.betAmount) {
      alert('Yetersiz Bakiye! Bahis için yeterli bakiyeniz yok.');
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

    // Kart dağıtımı
    setTimeout(() => {
      let currentDeck = newGameState.deck;
      let playerCards: any[] = [];
      let dealerCards: any[] = [];

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

      // Blackjack kontrolü
      if (playerScore === 21) {
        checkBlackjack(playerCards, dealerCards);
      }
    }, 100);
  };

  const checkBlackjack = (playerCards: any[], dealerCards: any[]) => {
    const playerHasBlackjack = BlackjackService.calculateScore(playerCards) === 21 && playerCards.length === 2;
    const dealerHasBlackjack = BlackjackService.calculateScore(dealerCards) === 21 && dealerCards.length === 2;

    if (playerHasBlackjack && dealerHasBlackjack) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'push',
        balance: prev.balance + prev.betAmount,
        dealerScore: BlackjackService.calculateScore(dealerCards)
      }));
    } else if (playerHasBlackjack) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'player-win',
        balance: prev.balance + Math.floor(prev.betAmount * 2.5)
      }));
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
                setGameState(prev => ({
                  ...prev,
                  gameStatus: 'dealer-bust',
                  balance: prev.balance + (prev.betAmount * 2)
                }));
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
      setGameState(prev => ({
        ...prev,
        gameStatus: 'dealer-bust',
        balance: prev.balance + (prev.betAmount * 2)
      }));
    } else if (playerScore > dealerScore) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'player-win',
        balance: prev.balance + (prev.betAmount * 2)
      }));
    } else if (playerScore < dealerScore) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'dealer-win'
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'push',
        balance: prev.balance + prev.betAmount
      }));
    }
  };

  const doubleDown = () => {
    if (gameState.gameStatus !== 'player-turn' || gameState.playerCards.length !== 2) return;
    
    if (gameState.balance < gameState.betAmount) {
      alert('Yetersiz Bakiye! Double down için yeterli bakiyeniz yok.');
      return;
    }

    setGameState(prev => ({
      ...prev,
      betAmount: prev.betAmount * 2,
      balance: prev.balance - prev.betAmount
    }));

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

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#1a1a1a', dark: '#2d2d2d' }}
      headerImage={<GameHeader />} // HATA DÜZELTİLDİ: null yerine JSX elementi
    >
      
      {/* Bakiyeler */}
      <ThemedView style={styles.balanceContainer}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Bakiye</Text>
          <Text style={styles.balanceValue}>${gameState.balance}</Text>
        </View>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Bahis</Text>
          <Text style={styles.balanceValue}>${gameState.betAmount}</Text>
        </View>
      </ThemedView>

      {/* Oyun Durumu */}
      <GameStatus status={gameState.gameStatus} />

      {/* Krupiye */}
      <DealerArea gameState={gameState} />

      {/* Oyuncu */}
      <PlayerArea gameState={gameState} />

      {/* Kontroller */}
      <Controls
        gameState={gameState}
        onStartGame={startGame}
        onHit={hit}
        onStand={stand}
        onDoubleDown={doubleDown}
        onChangeBet={changeBet}
      />

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