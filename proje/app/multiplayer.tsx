// app/multiplayer.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, Share, ActivityIndicator, Modal
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { MultiplayerService } from '@/services/multiplayerService';
import { BlackjackService } from '@/services/blackjackService';
import { MultiplayerRoom, MultiplayerMode, MultiplayerPlayer } from '@/types/multiplayer';
import { Card, Suit } from '@/types/blackjack';

// ─────────────────────────────────────────────
// Kart Bileşeni
// ─────────────────────────────────────────────
function CardComp({ card, isHidden = false }: { card: Card; isHidden?: boolean }) {
  const symbol = (s: Suit) => ({ hearts:'♥', diamonds:'♦', clubs:'♣', spades:'♠' }[s] ?? '');
  const color  = (s: Suit) => s === 'hearts' || s === 'diamonds' ? '#e74c3c' : '#1a1a2e';

  if (isHidden) {
    return (
      <View style={cStyles.card}>
        <View style={cStyles.hidden}><Text style={cStyles.hiddenTxt}>?</Text></View>
      </View>
    );
  }
  return (
    <View style={cStyles.card}>
      <Text style={[cStyles.rank, { color: color(card.suit) }]}>{card.rank}</Text>
      <Text style={[cStyles.suit, { color: color(card.suit) }]}>{symbol(card.suit)}</Text>
    </View>
  );
}
const cStyles = StyleSheet.create({
  card:      { width:70, height:105, backgroundColor:'#fff', borderRadius:8, padding:8, justifyContent:'space-between', alignItems:'center', borderWidth:1.5, borderColor:'#ddd', marginRight:6, elevation:3 },
  hidden:    { flex:1, backgroundColor:'#3498db', borderRadius:6, width:'100%', justifyContent:'center', alignItems:'center' },
  hiddenTxt: { color:'#fff', fontSize:22, fontWeight:'bold' },
  rank:      { fontSize:16, fontWeight:'bold', alignSelf:'flex-start' },
  suit:      { fontSize:22 },
});

// ─────────────────────────────────────────────
// Oyuncu Kartları Paneli
// ─────────────────────────────────────────────
function PlayerPanel({ player, isCurrentTurn, isMe }: {
  player: MultiplayerPlayer;
  isCurrentTurn: boolean;
  isMe: boolean;
}) {
  const statusColor = () => {
    if (player.status === 'bust')      return '#e74c3c';
    if (player.status === 'blackjack') return '#f39c12';
    if (player.status === 'stand')     return '#95a5a6';
    return '#27ae60';
  };

  return (
    <View style={[pStyles.container, isCurrentTurn && pStyles.activeTurn]}>
      <View style={pStyles.header}>
        <Text style={pStyles.name}>{player.name} {isMe ? '(Sen)' : ''}</Text>
        <View style={[pStyles.statusBadge, { backgroundColor: statusColor() }]}>
          <Text style={pStyles.statusText}>{player.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={pStyles.score}>Skor: {player.score}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={pStyles.cards}>
        {player.cards.map(c => <CardComp key={c.id} card={c} />)}
      </ScrollView>
    </View>
  );
}
const pStyles = StyleSheet.create({
  container:   { backgroundColor:'#1e2a3a', borderRadius:12, padding:14, marginBottom:12, borderWidth:2, borderColor:'transparent' },
  activeTurn:  { borderColor:'#f39c12' },
  header:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:6 },
  name:        { color:'#ecf0f1', fontSize:16, fontWeight:'bold' },
  statusBadge: { paddingHorizontal:10, paddingVertical:3, borderRadius:12 },
  statusText:  { color:'#fff', fontSize:11, fontWeight:'bold' },
  score:       { color:'#3498db', fontSize:14, marginBottom:8 },
  cards:       { flexDirection:'row' },
});

// ─────────────────────────────────────────────
// Ana Multiplayer Ekranı
// ─────────────────────────────────────────────
type Screen = 'modeSelect' | 'lobby' | 'game' | 'result';

export default function MultiplayerScreen({ onBackToMenu }: { onBackToMenu: () => void }) {
  const { user, updateBalance } = useAuth();
  const [screen, setScreen]     = useState<Screen>('modeSelect');
  const [mode, setMode]         = useState<MultiplayerMode>('1v1');
  const [room, setRoom]         = useState<MultiplayerRoom | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [betAmount, setBetAmount] = useState(10);
  const [loading, setLoading]   = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Oda değişikliklerini dinle
  useEffect(() => {
    if (!room) return;
    const unsub = MultiplayerService.listenRoom(room.roomId, updatedRoom => {
      setRoom(updatedRoom);
      if (updatedRoom.status === 'playing' && screen === 'lobby') setScreen('game');
      if (updatedRoom.status === 'finished') setScreen('result');
    });
    return () => unsub();
  }, [room?.roomId]);

  // ── Oda Oluştur ─────────────────────────────
  const createRoom = async (selectedMode: MultiplayerMode) => {
    if (!user) return;
    setLoading(true);
    try {
      const newRoom = await MultiplayerService.createRoom(
        user.deviceId, user.name, user.balance, selectedMode, betAmount
      );
      setMode(selectedMode);
      setRoom(newRoom);
      setScreen('lobby');
    } catch (e) {
      Alert.alert('Hata', 'Oda oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  // ── Koda Göre Katıl ──────────────────────────
  const joinRoom = async () => {
    if (!user || joinCode.length !== 4) {
      Alert.alert('Hata', '4 haneli oda kodunu gir.');
      return;
    }
    setLoading(true);
    try {
      const joined = await MultiplayerService.joinByCode(
        joinCode, user.deviceId, user.name, user.balance, betAmount
      );
      if (!joined) {
        Alert.alert('Hata', 'Oda bulunamadı veya dolu.');
        return;
      }
      setRoom(joined);
      setMode(joined.mode);
      setScreen('lobby');
      setShowJoinModal(false);
    } catch (e) {
      Alert.alert('Hata', 'Odaya katılınamadı.');
    } finally {
      setLoading(false);
    }
  };

  // ── Hazır ────────────────────────────────────
  const setReady = async () => {
    if (!room || !user) return;
    await MultiplayerService.setReady(room.roomId, user.deviceId);
  };

  // ── Oyunu Başlat (Host) ──────────────────────
  const startGame = async () => {
    if (!room || !user) return;
    const players = Object.values(room.players);
    const allReady = players.every(p => p.isReady);
    if (!allReady) {
      Alert.alert('Bekle', 'Tüm oyuncular hazır olmalı.');
      return;
    }
    if (players.length < 2) {
      Alert.alert('Bekle', 'En az 2 oyuncu gerekli.');
      return;
    }
    setLoading(true);
    try {
      await MultiplayerService.startGame(room);
    } finally {
      setLoading(false);
    }
  };

  // ── Hit ──────────────────────────────────────
  const hit = async () => {
    if (!room || !user) return;
    await MultiplayerService.hit(room, user.deviceId);
  };

  // ── Stand ────────────────────────────────────
  const stand = async () => {
    if (!room || !user) return;
    await MultiplayerService.stand(room, user.deviceId);
  };

  // ── Link Paylaş ──────────────────────────────
  const shareInvite = async () => {
    if (!room) return;
    await Share.share({
      message: `Blackjack oynamaya davet edildiniz!\nOda Kodu: ${room.roomCode}\nLink: ${room.inviteLink}`,
    });
  };

  // ── Ayrıl ────────────────────────────────────
  const leaveRoom = async () => {
    if (!room || !user) return;
    await MultiplayerService.leaveRoom(room.roomId, user.deviceId);
    setRoom(null);
    onBackToMenu();
  };

  if (!user) return null;

  // ─────────────────────────────────────────────
  // EKRAN: Mod Seçimi
  // ─────────────────────────────────────────────
  if (screen === 'modeSelect') {
    return (
      <ScrollView style={s.bg} contentContainerStyle={s.center}>
        <Text style={s.title}>♠️ Multiplayer ♥️</Text>
        <Text style={s.subtitle}>Mod Seç</Text>

        {/* Bahis */}
        <View style={s.betRow}>
          <Text style={s.label}>Bahis: ${betAmount}</Text>
          <View style={s.betBtns}>
            {[-50,-10,10,50].map(v => (
              <TouchableOpacity
                key={v}
                style={[s.betBtn, betAmount + v < 10 || betAmount + v > user.balance ? s.disabled : null]}
                onPress={() => setBetAmount(prev => Math.max(10, Math.min(user.balance, prev + v)))}
              >
                <Text style={s.betBtnTxt}>{v > 0 ? `+${v}` : v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mod Kartları */}
        {([
          { mode: '1v1',       icon: '⚔️',  title: '1v1',              desc: '21\'e yakın olan kazanır' },
          { mode: '2v-dealer', icon: '🤵',  title: '2 Oyuncu vs Dealer', desc: 'Krupiyeyi geç, yüksek skor kazan' },
          { mode: 'room',      icon: '🏠',  title: 'Oda Kur',           desc: 'Arkadaşını davet et' },
        ] as { mode: MultiplayerMode; icon: string; title: string; desc: string }[]).map(item => (
          <TouchableOpacity
            key={item.mode}
            style={s.modeCard}
            onPress={() => createRoom(item.mode)}
          >
            <Text style={s.modeIcon}>{item.icon}</Text>
            <View style={s.modeText}>
              <Text style={s.modeTitle}>{item.title}</Text>
              <Text style={s.modeDesc}>{item.desc}</Text>
            </View>
            <Text style={s.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Koda Katıl */}
        <TouchableOpacity style={[s.modeCard, { borderColor: '#3498db' }]} onPress={() => setShowJoinModal(true)}>
          <Text style={s.modeIcon}>🔑</Text>
          <View style={s.modeText}>
            <Text style={s.modeTitle}>Koda Katıl</Text>
            <Text style={s.modeDesc}>4 haneli oda kodu ile katıl</Text>
          </View>
          <Text style={s.arrow}>›</Text>
        </TouchableOpacity>

        {/* Kod Giriş Modal */}
        <Modal visible={showJoinModal} transparent animationType="fade">
          <View style={s.modalBg}>
            <View style={s.modalBox}>
              <Text style={s.modalTitle}>Oda Kodunu Gir</Text>
              <TextInput
                style={s.codeInput}
                value={joinCode}
                onChangeText={setJoinCode}
                placeholder="0000"
                placeholderTextColor="#888"
                keyboardType="numeric"
                maxLength={4}
              />
              <TouchableOpacity style={s.joinBtn} onPress={joinRoom}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.joinBtnTxt}>Katıl</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                <Text style={s.cancelTxt}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {loading && <ActivityIndicator color="#3498db" style={{ marginTop: 20 }} />}
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────
  // EKRAN: Lobi
  // ─────────────────────────────────────────────
  if (screen === 'lobby' && room) {
    const players = Object.values(room.players);
    const isHost = room.hostId === user.deviceId;
    const myPlayer = room.players[user.deviceId];

    return (
      <ScrollView style={s.bg} contentContainerStyle={s.center}>
        <Text style={s.title}>🎮 Lobi</Text>

        <View style={s.codeBox}>
          <Text style={s.codeLabel}>Oda Kodu</Text>
          <Text style={s.codeValue}>{room.roomCode}</Text>
        </View>

        <TouchableOpacity style={s.shareBtn} onPress={shareInvite}>
          <Text style={s.shareBtnTxt}>🔗 Davet Linki Paylaş</Text>
        </TouchableOpacity>

        <Text style={s.sectionTitle}>Oyuncular ({players.length}/{room.maxPlayers})</Text>
        {players.map(p => (
          <View key={p.userId} style={s.playerRow}>
            <Text style={s.playerName}>{p.name} {p.userId === user.deviceId ? '(Sen)' : ''}</Text>
            <View style={[s.readyBadge, { backgroundColor: p.isReady ? '#27ae60' : '#e74c3c' }]}>
              <Text style={s.readyTxt}>{p.isReady ? 'Hazır' : 'Bekliyor'}</Text>
            </View>
          </View>
        ))}

        <View style={s.lobbyBtns}>
          {!myPlayer?.isReady && (
            <TouchableOpacity style={s.readyBtn} onPress={setReady}>
              <Text style={s.readyBtnTxt}>✅ Hazırım</Text>
            </TouchableOpacity>
          )}
          {isHost && (
            <TouchableOpacity style={s.startBtn} onPress={startGame}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.startBtnTxt}>🎲 Oyunu Başlat</Text>
              }
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.leaveBtn} onPress={leaveRoom}>
            <Text style={s.leaveBtnTxt}>🚪 Çık</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────
  // EKRAN: Oyun
  // ─────────────────────────────────────────────
  if (screen === 'game' && room) {
    const players = Object.values(room.players);
    const myPlayer = room.players[user.deviceId];
    const isMyTurn = room.currentTurn === user.deviceId || room.mode === '2v-dealer';
    const canAct = isMyTurn && myPlayer?.status === 'playing';

    return (
      <ScrollView style={s.bg} contentContainerStyle={{ padding: 16 }}>
        <Text style={s.title}>♠️ Multiplayer ♥️</Text>

        {/* Krupiye (2v-dealer modunda) */}
        {room.mode === '2v-dealer' && (
          <View style={s.dealerBox}>
            <Text style={s.dealerTitle}>
              Krupiye: {room.status === 'finished'
                ? BlackjackService.calculateScore(room.dealerCards)
                : room.dealerCards.length > 0
                  ? BlackjackService.calculateScore([room.dealerCards[0]])
                  : 0}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection:'row' }}>
              {room.dealerCards.map((c, i) => (
                <CardComp key={c.id} card={c} isHidden={i === 1 && room.status !== 'finished'} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Oyuncular */}
        {players.map(p => (
          <PlayerPanel
            key={p.userId}
            player={p}
            isCurrentTurn={room.currentTurn === p.userId}
            isMe={p.userId === user.deviceId}
          />
        ))}

        {/* 1v1: Sıra göstergesi */}
        {room.mode === '1v1' && (
          <View style={s.turnIndicator}>
            <Text style={s.turnTxt}>
              {isMyTurn ? '🟢 Senin Sıran' : '⏳ Rakip Oynuyor'}
            </Text>
          </View>
        )}

        {/* Aksiyon Butonları */}
        {canAct && (
          <View style={s.actionRow}>
            <TouchableOpacity style={s.hitBtn} onPress={hit}>
              <Text style={s.actionTxt}>✅ Hit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.standBtn} onPress={stand}>
              <Text style={s.actionTxt}>✋ Stand</Text>
            </TouchableOpacity>
          </View>
        )}

        {!canAct && myPlayer?.status === 'playing' && (
          <View style={s.waitBox}>
            <Text style={s.waitTxt}>⏳ Rakip oynuyor...</Text>
          </View>
        )}
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────
  // EKRAN: Sonuç
  // ─────────────────────────────────────────────
  if (screen === 'result' && room) {
    const players = Object.values(room.players);
    const winner = room.winner;
    const isWinner = winner === user.deviceId;
    const isDraw = winner === 'draw';

    return (
      <ScrollView style={s.bg} contentContainerStyle={s.center}>
        <Text style={s.resultEmoji}>
          {isDraw ? '🤝' : isWinner ? '🏆' : '😔'}
        </Text>
        <Text style={s.resultTitle}>
          {isDraw ? 'Berabere!' : isWinner ? 'Kazandın!' : 'Kaybettin!'}
        </Text>

        {players.map(p => (
          <View key={p.userId} style={s.resultRow}>
            <Text style={s.resultName}>{p.name}</Text>
            <Text style={s.resultScore}>Skor: {p.score}</Text>
            <Text style={s.resultBalance}>Bakiye: ${p.balance}</Text>
          </View>
        ))}

        {room.mode === '2v-dealer' && (
          <View style={s.dealerResult}>
            <Text style={s.dealerResultTxt}>
              Krupiye Skoru: {BlackjackService.calculateScore(room.dealerCards)}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={s.playAgainBtn}
          onPress={() => { setRoom(null); onBackToMenu(); }}
        >
          <Text style={s.playAgainTxt}>🔄 Tekrar Oyna</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return null;
}

// ─────────────────────────────────────────────
// Stiller
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  bg:           { flex:1, backgroundColor:'#0d1117' },
  center:       { alignItems:'center', padding:20 },
  title:        { color:'#fff', fontSize:26, fontWeight:'bold', marginBottom:6 },
  subtitle:     { color:'#8b949e', fontSize:16, marginBottom:20 },
  label:        { color:'#ecf0f1', fontSize:15, marginBottom:8 },
  betRow:       { width:'100%', marginBottom:20 },
  betBtns:      { flexDirection:'row', gap:8 },
  betBtn:       { backgroundColor:'#238636', paddingHorizontal:14, paddingVertical:8, borderRadius:8 },
  betBtnTxt:    { color:'#fff', fontWeight:'bold' },
  disabled:     { backgroundColor:'#3d444d' },
  modeCard:     { width:'100%', flexDirection:'row', alignItems:'center', backgroundColor:'#161b22', borderRadius:12, padding:16, marginBottom:12, borderWidth:1, borderColor:'#30363d' },
  modeIcon:     { fontSize:28, marginRight:14 },
  modeText:     { flex:1 },
  modeTitle:    { color:'#fff', fontSize:16, fontWeight:'bold' },
  modeDesc:     { color:'#8b949e', fontSize:13, marginTop:2 },
  arrow:        { color:'#8b949e', fontSize:22 },
  modalBg:      { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'center', alignItems:'center' },
  modalBox:     { backgroundColor:'#161b22', borderRadius:16, padding:24, width:'80%', alignItems:'center' },
  modalTitle:   { color:'#fff', fontSize:18, fontWeight:'bold', marginBottom:16 },
  codeInput:    { backgroundColor:'#0d1117', color:'#fff', fontSize:32, textAlign:'center', borderRadius:10, padding:14, width:'100%', marginBottom:16, letterSpacing:12, borderWidth:1, borderColor:'#30363d' },
  joinBtn:      { backgroundColor:'#238636', paddingVertical:12, paddingHorizontal:30, borderRadius:10, marginBottom:10 },
  joinBtnTxt:   { color:'#fff', fontSize:16, fontWeight:'bold' },
  cancelTxt:    { color:'#8b949e', fontSize:14 },
  codeBox:      { backgroundColor:'#161b22', borderRadius:12, padding:20, alignItems:'center', marginBottom:16, borderWidth:1, borderColor:'#30363d', width:'100%' },
  codeLabel:    { color:'#8b949e', fontSize:13, marginBottom:4 },
  codeValue:    { color:'#58a6ff', fontSize:40, fontWeight:'bold', letterSpacing:10 },
  shareBtn:     { backgroundColor:'#1f6feb', borderRadius:10, paddingVertical:12, paddingHorizontal:24, marginBottom:20 },
  shareBtnTxt:  { color:'#fff', fontSize:15, fontWeight:'bold' },
  sectionTitle: { color:'#8b949e', fontSize:14, alignSelf:'flex-start', marginBottom:8 },
  playerRow:    { width:'100%', flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'#161b22', borderRadius:10, padding:14, marginBottom:8 },
  playerName:   { color:'#ecf0f1', fontSize:15 },
  readyBadge:   { paddingHorizontal:10, paddingVertical:4, borderRadius:10 },
  readyTxt:     { color:'#fff', fontSize:12, fontWeight:'bold' },
  lobbyBtns:    { width:'100%', gap:10, marginTop:10 },
  readyBtn:     { backgroundColor:'#238636', borderRadius:10, padding:14, alignItems:'center' },
  readyBtnTxt:  { color:'#fff', fontSize:15, fontWeight:'bold' },
  startBtn:     { backgroundColor:'#3498db', borderRadius:10, padding:14, alignItems:'center' },
  startBtnTxt:  { color:'#fff', fontSize:15, fontWeight:'bold' },
  leaveBtn:     { backgroundColor:'#da3633', borderRadius:10, padding:14, alignItems:'center' },
  leaveBtnTxt:  { color:'#fff', fontSize:15, fontWeight:'bold' },
  dealerBox:    { backgroundColor:'#1e2a3a', borderRadius:12, padding:14, marginBottom:14 },
  dealerTitle:  { color:'#ecf0f1', fontSize:16, fontWeight:'bold', marginBottom:8 },
  turnIndicator:{ backgroundColor:'#1e2a3a', borderRadius:10, padding:12, alignItems:'center', marginBottom:12, width:'100%' },
  turnTxt:      { color:'#ecf0f1', fontSize:15, fontWeight:'bold' },
  actionRow:    { flexDirection:'row', gap:12, marginTop:8 },
  hitBtn:       { flex:1, backgroundColor:'#238636', borderRadius:10, padding:16, alignItems:'center' },
  standBtn:     { flex:1, backgroundColor:'#f39c12', borderRadius:10, padding:16, alignItems:'center' },
  actionTxt:    { color:'#fff', fontSize:16, fontWeight:'bold' },
  waitBox:      { backgroundColor:'#1e2a3a', borderRadius:10, padding:14, alignItems:'center', marginTop:8, width:'100%' },
  waitTxt:      { color:'#8b949e', fontSize:14 },
  resultEmoji:  { fontSize:64, marginBottom:10 },
  resultTitle:  { color:'#fff', fontSize:28, fontWeight:'bold', marginBottom:20 },
  resultRow:    { width:'100%', backgroundColor:'#161b22', borderRadius:10, padding:14, marginBottom:8, gap:4 },
  resultName:   { color:'#ecf0f1', fontSize:16, fontWeight:'bold' },
  resultScore:  { color:'#8b949e', fontSize:14 },
  resultBalance:{ color:'#27ae60', fontSize:14 },
  dealerResult: { backgroundColor:'#1e2a3a', borderRadius:10, padding:12, marginBottom:16, width:'100%' },
  dealerResultTxt:{ color:'#ecf0f1', fontSize:14, textAlign:'center' },
  playAgainBtn: { backgroundColor:'#3498db', borderRadius:10, paddingVertical:14, paddingHorizontal:30, marginTop:10 },
  playAgainTxt: { color:'#fff', fontSize:16, fontWeight:'bold' },
});
