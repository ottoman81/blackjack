// src/components/blackjack/GameStatus.tsx
import { View, Text, StyleSheet } from 'react-native';
import { GameStatus as StatusType } from '../../types/blackjack';

interface GameStatusProps {
  status: StatusType;
}

export default function GameStatus({ status }: GameStatusProps) {
  const getStatusMessage = () => {
    switch (status) {
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
    switch (status) {
      case 'player-win':
      case 'dealer-bust': return '#27ae60';
      case 'dealer-win':
      case 'player-bust': return '#e74c3c';
      case 'push': return '#f39c12';
      default: return '#3498db';
    }
  };

  return (
    <View style={[styles.statusContainer, { backgroundColor: getStatusColor() + '20' }]}>
      <Text style={[styles.statusText, { color: getStatusColor() }]}>
        {getStatusMessage()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});