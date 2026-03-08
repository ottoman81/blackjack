// src/components/blackjack/Card.tsx
import { View, Text, StyleSheet } from 'react-native';
import { Card as CardType } from '../../types/blackjack';
import { BlackjackService } from '../../services/blackjackService';

interface CardProps {
  card: CardType;
  isHidden?: boolean;
}

export default function Card({ card, isHidden = false }: CardProps) {
  if (isHidden) {
    return (
      <View style={styles.card}>
        <View style={styles.hiddenCard}>
          <Text style={styles.hiddenCardText}>?</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={[styles.cardRank, { color: BlackjackService.getCardColor(card.suit) }]}>
        {card.rank}
      </Text>
      <Text style={[styles.cardSuit, { color: BlackjackService.getCardColor(card.suit) }]}>
        {BlackjackService.getSuitSymbol(card.suit)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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