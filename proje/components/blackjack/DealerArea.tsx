// src/components/blackjack/DealerArea.tsx
import { View, ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { GameState } from '../../types/blackjack';
import Card from './Card';

interface DealerAreaProps {
  gameState: GameState;
}

export default function DealerArea({ gameState }: DealerAreaProps) {
  return (
    <View style={styles.section}>
      <ThemedText type="subtitle">Krupiye: {gameState.dealerScore}</ThemedText>
      <ScrollView 
        horizontal 
        style={styles.cardsContainer}
        showsHorizontalScrollIndicator={false}
      >
        {gameState.dealerCards.map((card, index) => (
          <Card
            key={card.id}
            card={card}
            isHidden={index === 1 && gameState.gameStatus === 'player-turn'}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 25,
    paddingHorizontal: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
});