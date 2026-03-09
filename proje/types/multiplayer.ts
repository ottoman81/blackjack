// types/multiplayer.ts
import { Card } from './blackjack';

export type MultiplayerMode = '2v-dealer' | '1v1' | 'room';
export type RoomStatus = 'waiting' | 'playing' | 'finished';
export type PlayerStatus = 'waiting' | 'playing' | 'stand' | 'bust' | 'blackjack';

export interface MultiplayerPlayer {
  userId: string;
  name: string;
  cards: Card[];
  score: number;
  status: PlayerStatus;
  betAmount: number;
  balance: number;
  isReady: boolean;
}

export interface MultiplayerRoom {
  roomId: string;
  roomCode: string;        // 4 haneli kod
  inviteLink: string;
  mode: MultiplayerMode;
  status: RoomStatus;
  players: { [userId: string]: MultiplayerPlayer };
  deck: Card[];
  dealerCards: Card[];
  dealerScore: number;
  currentTurn: string | null;  // 1v1 için sıra
  winner: string | 'draw' | null;
  hostId: string;
  createdAt: number;
  maxPlayers: number;
}
