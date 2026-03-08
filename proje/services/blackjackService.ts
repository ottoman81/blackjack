// services/blackjackService.ts - REVİZE EDİLMİŞ
import { Card, Suit, Rank } from '../types/blackjack';

export class BlackjackService {
  /**
   * 6 desteden oluşan standart bir Blackjack destesi oluşturur ve karıştırır.
   */
  static initializeDeck(): Card[] {
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    // Kart değerleri: 2-10 normal, J/Q/K 10, A 11 (hesaplamada esneklik için 11 tutulur)
    const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const newDeck: Card[] = [];

    // 6 Deste (Standart casino kuralı)
    for (let deckCount = 0; deckCount < 6; deckCount++) {
      for (const suit of suits) {
        for (const rank of ranks) {
          const value = this.getCardValue(rank);
          // Her kartın benzersiz bir ID'si olmalı
          const id = `${suit}-${rank}-${deckCount}-${Math.random().toString(36).substr(2, 9)}`;
          newDeck.push({ suit, rank, value, id });
        }
      }
    }

    return this.shuffleDeck(newDeck);
  }

  /**
   * Kartın başlangıç sayı değerini verir. (As için 11)
   */
  static getCardValue(rank: Rank): number {
    const values: { [key in Rank]: number } = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 10, 'Q': 10, 'K': 10, 'A': 11
    };
    return values[rank];
  }

  /**
   * Desteyi Fisher-Yates algoritması ile karıştırır.
   */
  static shuffleDeck(cardDeck: Card[]): Card[] {
    const newDeck = [...cardDeck];
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  }
  
  // ✅ EKSİK METOT: dealInitialCards eklendi
  /**
   * Oyuncuya ve Krupiye'ye ilk ikişer kartı dağıtır.
   */
  static dealInitialCards(deck: Card[]): { newDeck: Card[], playerCards: Card[], dealerCards: Card[] } {
      let newDeck = [...deck];
      const playerCards: Card[] = [];
      const dealerCards: Card[] = [];

      // İlk kartları sırayla dağıt
      for (let i = 0; i < 2; i++) {
          // Oyuncu
          const drawPlayer = this.drawCard(newDeck);
          playerCards.push(drawPlayer.card);
          newDeck = drawPlayer.newDeck;
          
          // Krupiye
          const drawDealer = this.drawCard(newDeck);
          dealerCards.push(drawDealer.card);
          newDeck = drawDealer.newDeck;
      }

      return { newDeck, playerCards, dealerCards };
  }

  // ✅ EKSİK METOT: drawCard eklendi
  /**
   * Desteden en üstteki kartı çeker.
   */
  static drawCard(deck: Card[]): { newDeck: Card[], card: Card } {
      if (deck.length === 0) {
          // Deste biterse oyunda kalanı simüle etmek veya hata fırlatmak gerekir.
          // Basit bir çözüm olarak yeniden karıştırılmış yeni bir deste oluşturulabilir.
          console.warn("Deck ran out of cards. Initializing a new shuffled deck.");
          let newDeck = this.initializeDeck();
          return this.drawCard(newDeck);
      }
      const card = deck[0];
      const newDeck = deck.slice(1);
      return { newDeck, card };
  }


  /**
   * Kart listesinin Blackjack puanını hesaplar (Aslar için esnek 1/11).
   */
  static calculateScore(cards: Card[]): number {
    let score = 0;
    let aces = 0;

    cards.forEach(card => {
      if (card.rank === 'A') {
        aces++;
        score += 11; // Başlangıçta As'ı 11 olarak say
      } else {
        score += card.value;
      }
    });

    // Toplam 21'i aştıysa, Asları (11 olanları) 1 olarak değiştir
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }

    return score;
  }

  /**
   * Kart rengine göre HEX kodu döndürür. (Card.tsx için yardımcı)
   */
  static getCardColor(suit: Suit): string {
    return suit === 'hearts' || suit === 'diamonds' ? '#e74c3c' : '#2c3e50';
  }

  /**
   * Kart tipine göre sembol döndürür. (Card.tsx için yardımcı)
   */
  static getSuitSymbol(suit: Suit): string {
    switch (suit) {
      case 'hearts': return '♥️';
      case 'diamonds': return '♦️';
      case 'clubs': return '♣️';
      case 'spades': return '♠️';
      default: return '';
    }
  }
}