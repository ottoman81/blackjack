// types/blackjack.ts
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type GameStatus = 'waiting' | 'player-turn' | 'dealer-turn' | 'player-bust' | 'dealer-bust' | 'player-win' | 'dealer-win' | 'push';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
  id: string;
}

export interface GameState {
  playerCards: Card[];
  dealerCards: Card[];
  playerScore: number;
  dealerScore: number;
  gameStatus: GameStatus;
  deck: Card[];
  betAmount: number;
  balance: number; // EKSİK OLAN BU
  initialBet: number;
}