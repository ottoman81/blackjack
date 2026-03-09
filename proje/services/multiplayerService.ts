// services/multiplayerService.ts
import { db } from '@/lib/firebase';
import { Card } from '@/types/blackjack';
import { MultiplayerMode, MultiplayerPlayer, MultiplayerRoom } from '@/types/multiplayer';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  Unsubscribe,
  updateDoc,
  where
} from 'firebase/firestore';
import { BlackjackService } from './blackjackService';

const ROOMS_COLLECTION = 'rooms';
const BASE_URL = 'https://blackjack.app'; // Kendi domain'inle değiştir

export class MultiplayerService {

  // ── Oda Kodu Üret ────────────────────────────
  static generateRoomCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // ── Benzersiz Oda Kodu — direkt random
  static async getUniqueRoomCode(): Promise<string> {
    return this.generateRoomCode();
  }

  // ── Oda Oluştur ──────────────────────────────
  static async createRoom(
    hostId: string,
    hostName: string,
    hostBalance: number,
    mode: MultiplayerMode,
    betAmount: number
  ): Promise<MultiplayerRoom> {
    const roomId = doc(collection(db, ROOMS_COLLECTION)).id;
    const roomCode = await this.getUniqueRoomCode();
    const inviteLink = `${BASE_URL}/join/${roomCode}`;

    const hostPlayer: MultiplayerPlayer = {
      userId: hostId,
      name: hostName,
      cards: [],
      score: 0,
      status: 'waiting',
      betAmount,
      balance: hostBalance,
      isReady: false,
    };

    const room: MultiplayerRoom = {
      roomId,
      roomCode,
      inviteLink,
      mode,
      status: 'waiting',
      players: { [hostId]: hostPlayer },
      deck: BlackjackService.initializeDeck(),
      dealerCards: [],
      dealerScore: 0,
      currentTurn: null,
      winner: null,
      hostId,
      createdAt: Date.now(),
      maxPlayers: mode === '2v-dealer' ? 2 : 2,
    };

    await setDoc(doc(db, ROOMS_COLLECTION, roomId), room);
    return room;
  }

  // ── Oda Kodu ile Katıl ───────────────────────
  static async joinByCode(
    roomCode: string,
    userId: string,
    userName: string,
    userBalance: number,
    betAmount: number
  ): Promise<MultiplayerRoom | null> {
    const q = query(
      collection(db, ROOMS_COLLECTION),
      where('roomCode', '==', roomCode),
      where('status', '==', 'waiting')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const roomDoc = snap.docs[0];
    const room = roomDoc.data() as MultiplayerRoom;

    if (Object.keys(room.players).length >= room.maxPlayers) return null;

    const newPlayer: MultiplayerPlayer = {
      userId,
      name: userName,
      cards: [],
      score: 0,
      status: 'waiting',
      betAmount,
      balance: userBalance,
      isReady: false,
    };

    await updateDoc(doc(db, ROOMS_COLLECTION, room.roomId), {
      [`players.${userId}`]: newPlayer,
    });

    return { ...room, players: { ...room.players, [userId]: newPlayer } };
  }

  // ── Hazır İşaretle ───────────────────────────
  static async setReady(roomId: string, userId: string): Promise<void> {
    await updateDoc(doc(db, ROOMS_COLLECTION, roomId), {
      [`players.${userId}.isReady`]: true,
    });
  }

  // ── Oyunu Başlat (Host) ──────────────────────
  static async startGame(room: MultiplayerRoom): Promise<void> {
    const playerIds = Object.keys(room.players);
    let deck = room.deck.length < 30
      ? BlackjackService.initializeDeck()
      : [...room.deck];

    // Her oyuncuya 2 kart dağıt
    const updatedPlayers = { ...room.players };
    for (const playerId of playerIds) {
      const draw1 = BlackjackService.drawCard(deck);
      deck = draw1.newDeck;
      const draw2 = BlackjackService.drawCard(deck);
      deck = draw2.newDeck;

      const cards = [draw1.card, draw2.card];
      updatedPlayers[playerId] = {
        ...updatedPlayers[playerId],
        cards,
        score: BlackjackService.calculateScore(cards),
        status: 'playing',
      };
    }

    // Krupiyeye 2 kart (2v-dealer modunda)
    let dealerCards: Card[] = [];
    if (room.mode === '2v-dealer') {
      const d1 = BlackjackService.drawCard(deck);
      deck = d1.newDeck;
      const d2 = BlackjackService.drawCard(deck);
      deck = d2.newDeck;
      dealerCards = [d1.card, d2.card];
    }

    await updateDoc(doc(db, ROOMS_COLLECTION, room.roomId), {
      status: 'playing',
      players: updatedPlayers,
      deck,
      dealerCards,
      currentTurn: playerIds[0], // İlk oyuncu başlar
    });
  }

  // ── Kart Çek (Hit) ────────────────────────────
  static async hit(room: MultiplayerRoom, userId: string): Promise<void> {
    const player = room.players[userId];
    if (!player || player.status !== 'playing') return;

    const { card, newDeck } = BlackjackService.drawCard(room.deck);
    const newCards = [...player.cards, card];
    const newScore = BlackjackService.calculateScore(newCards);
    const newStatus = newScore > 21 ? 'bust' : 'playing';

    await updateDoc(doc(db, ROOMS_COLLECTION, room.roomId), {
      [`players.${userId}.cards`]: newCards,
      [`players.${userId}.score`]: newScore,
      [`players.${userId}.status`]: newStatus,
      deck: newDeck,
    });

    // 1v1 modunda bust olunca sırayı geç
    if (room.mode === '1v1' && newStatus === 'bust') {
      await this.nextTurn(room, userId);
    }
  }

  // ── Bekle (Stand) ────────────────────────────
  static async stand(room: MultiplayerRoom, userId: string): Promise<void> {
    await updateDoc(doc(db, ROOMS_COLLECTION, room.roomId), {
      [`players.${userId}.status`]: 'stand',
    });

    if (room.mode === '1v1') {
      await this.nextTurn(room, userId);
    } else {
      // 2v-dealer: tüm oyuncular stand/bust olunca krupiye oynar
      await this.checkAllPlayersFinished(room, userId);
    }
  }

  // ── Sıra Geçiş (1v1) ─────────────────────────
  static async nextTurn(room: MultiplayerRoom, currentUserId: string): Promise<void> {
    const playerIds = Object.keys(room.players);
    const currentIndex = playerIds.indexOf(currentUserId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    const nextId = playerIds[nextIndex];
    const nextPlayer = room.players[nextId];

    // Eğer sonraki oyuncu zaten bitmişse oyunu sonlandır
    if (nextPlayer.status === 'stand' || nextPlayer.status === 'bust') {
      await this.finishGame(room);
    } else {
      await updateDoc(doc(db, ROOMS_COLLECTION, room.roomId), {
        currentTurn: nextId,
      });
    }
  }

  // ── Tüm Oyuncular Bitti mi? (2v-dealer) ──────
  static async checkAllPlayersFinished(room: MultiplayerRoom, lastUserId: string): Promise<void> {
    // Güncel room'u Firestore'dan çek
    const roomSnap = await getDoc(doc(db, ROOMS_COLLECTION, room.roomId));
    const updatedRoom = roomSnap.data() as MultiplayerRoom;

    const allFinished = Object.values(updatedRoom.players).every(
      p => p.status === 'stand' || p.status === 'bust'
    );

    if (allFinished) {
      await this.dealerPlayAndFinish(updatedRoom);
    }
  }

  // ── Krupiye Oynuyor (2v-dealer) ──────────────
  static async dealerPlayAndFinish(room: MultiplayerRoom): Promise<void> {
    let deck = [...room.deck];
    let dealerCards = [...room.dealerCards];
    let dealerScore = BlackjackService.calculateScore(dealerCards);

    while (dealerScore < 17) {
      const { card, newDeck } = BlackjackService.drawCard(deck);
      deck = newDeck;
      dealerCards.push(card);
      dealerScore = BlackjackService.calculateScore(dealerCards);
    }

    await updateDoc(doc(db, ROOMS_COLLECTION, room.roomId), {
      dealerCards,
      dealerScore,
      deck,
    });

    await this.finishGame({ ...room, dealerCards, dealerScore, deck });
  }

  // ── Oyunu Bitir & Kazananı Belirle ────────────
  static async finishGame(room: MultiplayerRoom): Promise<void> {
    const roomSnap = await getDoc(doc(db, ROOMS_COLLECTION, room.roomId));
    const updatedRoom = roomSnap.data() as MultiplayerRoom;

    const players = updatedRoom.players;
    const playerIds = Object.keys(players);

    let winnerId: string | 'draw' | null = null;

    if (updatedRoom.mode === '1v1') {
      // 1v1: 21'e yakın olan kazanır
      winnerId = this.determine1v1Winner(players, playerIds);
    } else {
      // 2v-dealer: dealer'ı geçen kazanır, ikisi geçerse yüksek skor
      winnerId = this.determine2vDealerWinner(players, playerIds, updatedRoom.dealerScore);
    }

    // Bakiyeleri güncelle
    const updatedPlayers = { ...players };
    for (const pid of playerIds) {
      const player = players[pid];
      let balanceDelta = 0;

      if (winnerId === 'draw') {
        balanceDelta = player.betAmount; // İade
      } else if (winnerId === pid) {
        balanceDelta = player.betAmount * 2; // Kazandı
      }
      // Kaybedince delta 0 (bahis zaten düşülmüştü)

      updatedPlayers[pid] = {
        ...player,
        balance: player.balance + balanceDelta,
      };
    }

    await updateDoc(doc(db, ROOMS_COLLECTION, updatedRoom.roomId), {
      status: 'finished',
      winner: winnerId,
      players: updatedPlayers,
    });
  }

  // ── Kazanan Belirleme: 1v1 ────────────────────
  static determine1v1Winner(
    players: { [id: string]: MultiplayerPlayer },
    playerIds: string[]
  ): string | 'draw' {
    const scores = playerIds.map(id => ({
      id,
      score: players[id].status === 'bust' ? 0 : players[id].score,
    }));

    const maxScore = Math.max(...scores.map(s => s.score));
    const winners = scores.filter(s => s.score === maxScore);

    if (winners.length > 1) return 'draw';
    return winners[0].id;
  }

  // ── Kazanan Belirleme: 2v-dealer ──────────────
  static determine2vDealerWinner(
    players: { [id: string]: MultiplayerPlayer },
    playerIds: string[],
    dealerScore: number
  ): string | 'draw' {
    const dealerBust = dealerScore > 21;

    const eligible = playerIds.filter(id => {
      const p = players[id];
      if (p.status === 'bust') return false;
      if (!dealerBust && p.score <= dealerScore) return false;
      return true;
    });

    if (eligible.length === 0) return null as any; // Krupiye kazandı
    if (eligible.length === 1) return eligible[0];

    // İkisi de dealer'ı geçtiyse yüksek skor kazanır
    const scores = eligible.map(id => ({ id, score: players[id].score }));
    const maxScore = Math.max(...scores.map(s => s.score));
    const winners = scores.filter(s => s.score === maxScore);

    if (winners.length > 1) return 'draw';
    return winners[0].id;
  }

  // ── Odayı Dinle (Realtime) ────────────────────
  static listenRoom(
    roomId: string,
    callback: (room: MultiplayerRoom) => void
  ): Unsubscribe {
    return onSnapshot(doc(db, ROOMS_COLLECTION, roomId), snap => {
      if (snap.exists()) {
        callback(snap.data() as MultiplayerRoom);
      }
    });
  }

  // ── Odadan Ayrıl ─────────────────────────────
  static async leaveRoom(roomId: string, userId: string): Promise<void> {
    const roomSnap = await getDoc(doc(db, ROOMS_COLLECTION, roomId));
    if (!roomSnap.exists()) return;
    const room = roomSnap.data() as MultiplayerRoom;

    const updatedPlayers = { ...room.players };
    delete updatedPlayers[userId];

    if (Object.keys(updatedPlayers).length === 0) {
      await updateDoc(doc(db, ROOMS_COLLECTION, roomId), { status: 'finished' });
    } else {
      await updateDoc(doc(db, ROOMS_COLLECTION, roomId), {
        players: updatedPlayers,
        hostId: room.hostId === userId ? Object.keys(updatedPlayers)[0] : room.hostId,
      });
    }
  }
}