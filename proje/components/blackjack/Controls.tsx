// src/components/blackjack/Controls.tsx
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { GameState } from '../../types/blackjack'; // GameState'in doğru yoldan import edildiğini varsayıyoruz

interface ControlsProps {
  gameState: GameState;
  onStartGame: () => void;
  onHit: () => void;
  onStand: () => void;
  onDoubleDown: () => void;
  // onChangeBet kaldırıldı
}

export default function Controls({ 
  gameState, 
  onStartGame, 
  onHit, 
  onStand, 
  onDoubleDown, 
  // onChangeBet parametresi kaldırıldı
}: ControlsProps) {
    
  // Double Down için gerekli bakiye kontrolü
  const canDoubleDown = gameState.balance >= gameState.initialBet * 2;
    
  // Bahis artırma/azaltma kontrol butonları kaldırıldı
    
  // 'Yeni El' butonu, oyun bittiyse veya bekleniyorsa görünmeli
  const showNewGame = 
    gameState.gameStatus === 'waiting' ||
    gameState.gameStatus === 'player-win' || 
    gameState.gameStatus === 'dealer-win' || 
    gameState.gameStatus === 'push' ||
    gameState.gameStatus === 'player-bust' ||
    gameState.gameStatus === 'dealer-bust';

  // Oyun devam ediyorsa (oyuncu kart çekebilir)
  const isPlayerTurn = gameState.gameStatus === 'player-turn';

  return (
    <View style={styles.controlsContainer}>
      
      {/* ------------------------------------- */}
      {/* OYUN BAŞLATMA / YENİ EL KONTROLLERİ */}
      {/* ------------------------------------- */}
      {showNewGame ? (
        <View style={styles.newGameControls}>
          <TouchableOpacity 
            style={[styles.controlButton, styles.primaryButton]} 
            onPress={onStartGame}
            disabled={gameState.betAmount < gameState.initialBet} // Minimum bahis kontrolü
          >
            <Text style={styles.controlButtonText}>
              {gameState.gameStatus === 'waiting' ? 'Oyuna Başla' : 'Yeni El Başlat'} 
              {gameState.gameStatus === 'waiting' ? ` (${gameState.betAmount} Çip)` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ------------------------------------- */
        /* OYUNCU TURU KONTROLLERİ (HIT/STAND/DOUBLE) */
        /* ------------------------------------- */
        <View style={styles.gameControls}>
          
          {/* HIT */}
          <TouchableOpacity 
            style={[styles.controlButton, styles.successButton]} 
            onPress={onHit}
            disabled={!isPlayerTurn}
          >
            <Text style={styles.controlButtonText}>Hit (Kart Çek)</Text>
          </TouchableOpacity>

          {/* STAND */}
          <TouchableOpacity 
            style={[styles.controlButton, styles.warningButton]} 
            onPress={onStand}
            disabled={!isPlayerTurn}
          >
            <Text style={styles.controlButtonText}>Stand (Bekle)</Text>
          </TouchableOpacity>

          {/* DOUBLE DOWN */}
          {gameState.playerCards.length === 2 && ( // Sadece ilk iki kart dağıtıldığında
            <TouchableOpacity 
              style={[styles.controlButton, styles.infoButton, !canDoubleDown && styles.disabledButton]} 
              onPress={onDoubleDown}
              disabled={!canDoubleDown || !isPlayerTurn}
            >
              <Text style={styles.controlButtonText}>
                {`Double Down (Bahsi İkiye Katla)`}
              </Text>
            </TouchableOpacity>
          )}

        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  controlsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  // Eski betControls ve betButton stilleri kaldırıldı
  newGameControls: {
    paddingTop: 10,
  },
  gameControls: {
    gap: 10,
    paddingTop: 10,
  },
  controlButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3498db', // Mavi
  },
  successButton: {
    backgroundColor: '#2ecc71', // Yeşil
  },
  warningButton: {
    backgroundColor: '#f39c12', // Turuncu
  },
  infoButton: {
    backgroundColor: '#9b59b6', // Mor
  },
  disabledButton: {
    opacity: 0.5,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});