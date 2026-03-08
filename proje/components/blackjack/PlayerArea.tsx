// src/components/blackjack/PlayerArea.tsx
import { View, ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { GameState } from '../../types/blackjack';
import Card from './Card';

interface PlayerAreaProps {
  gameState: GameState;
}

export default function PlayerArea({ gameState }: PlayerAreaProps) {
  return (
    <View style={styles.section}>
      <ThemedText type="subtitle">Siz: {gameState.playerScore}</ThemedText>
      <ScrollView 
        horizontal 
        style={styles.cardsContainer}
        showsHorizontalScrollIndicator={false}
      >
        {gameState.playerCards.map((card) => (
          <Card key={card.id} card={card} />
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