import { 
  Deck, InsertDeck, Card, InsertCard, 
  Review, InsertReview, DeckWithStats, CardWithDeck 
} from "@shared/schema";

export interface IStorage {
  // Deck operations
  getDecks(): Promise<Deck[]>;
  getDeck(id: string): Promise<Deck | undefined>;
  createDeck(deck: InsertDeck): Promise<Deck>;
  
  // Card operations
  getCards(deckId: string): Promise<Card[]>;
  getCard(id: string): Promise<Card | undefined>;
  getDueCards(deckId: string, limit?: number): Promise<Card[]>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: string, card: Partial<Card>): Promise<Card>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  
  // Stats and advanced operations
  getDeckWithStats(id: string): Promise<DeckWithStats | undefined>;
  getDecksWithStats(): Promise<DeckWithStats[]>;
  getCardWithDeck(id: string): Promise<CardWithDeck | undefined>;
}

export class MemStorage implements IStorage {
  private decks: Map<string, Deck>;
  private cards: Map<string, Card>;
  private reviews: Map<string, Review>;

  constructor() {
    this.decks = new Map();
    this.cards = new Map();
    this.reviews = new Map();
    
    // Add some initial data
    this.createDeck({ name: "JavaScript Fundamentals" });
    this.createDeck({ name: "Python Data Science" });
    this.createDeck({ name: "React Hooks" });
  }

  // Helper to generate a simple unique string ID (for MemStorage only)
  private generateId(): string {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Deck operations
  async getDecks(): Promise<Deck[]> {
    return Array.from(this.decks.values());
  }

  async getDeck(id: string): Promise<Deck | undefined> {
    return this.decks.get(id);
  }

  async createDeck(deck: InsertDeck): Promise<Deck> {
    const id = this.generateId();
    const now = new Date();
    const newDeck: Deck = { 
      id, 
      name: deck.name,
      createdAt: now
    };
    this.decks.set(id, newDeck);
    return newDeck;
  }

  // Card operations
  async getCards(deckId: string): Promise<Card[]> {
    return Array.from(this.cards.values()).filter(card => card.deckId === deckId);
  }

  async getCard(id: string): Promise<Card | undefined> {
    return this.cards.get(id);
  }

  async getDueCards(deckId: string, limit?: number): Promise<Card[]> {
    const now = new Date();
    const dueCards = Array.from(this.cards.values())
      .filter(card => 
        card.deckId === deckId && 
        (!card.nextReview || new Date(card.nextReview) <= now)
      )
      .sort((a, b) => {
        // Sort by never reviewed first, then by next review date
        if (!a.nextReview && !b.nextReview) return 0;
        if (!a.nextReview) return -1;
        if (!b.nextReview) return 1;
        return new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime();
      });
      
    return limit ? dueCards.slice(0, limit) : dueCards;
  }

  async createCard(card: InsertCard): Promise<Card> {
    const id = this.generateId();
    const now = new Date();
    const newCard: Card = {
      id,
      deckId: card.deckId,
      front: card.front,
      back: card.back,
      createdAt: now,
      lastReviewed: null,
      nextReview: null,
      ease: 250, // Default ease (2.5)
      interval: 1, // Default interval (1 day)
      repetitions: 0
    };
    this.cards.set(id, newCard);
    return newCard;
  }

  async updateCard(id: string, cardUpdate: Partial<Card>): Promise<Card> {
    const card = this.cards.get(id);
    if (!card) {
      throw new Error(`Card with id ${id} not found`);
    }
    
    const updatedCard = { ...card, ...cardUpdate };
    this.cards.set(id, updatedCard);
    return updatedCard;
  }

  // Review operations
  async createReview(review: InsertReview): Promise<Review> {
    const id = this.generateId();
    const now = new Date();
    const newReview: Review = {
      id,
      cardId: review.cardId,
      rating: review.rating,
      reviewedAt: now
    };
    this.reviews.set(id, newReview);
    
    // Update the card's spaced repetition data
    const card = await this.getCard(review.cardId);
    if (card) {
      let newInterval = card.interval;
      let newEase = card.ease;
      const newRepetitions = card.repetitions + 1;
      
      // Simple spaced repetition algorithm based on SuperMemo-2
      if (review.rating === 1) { // Again
        newInterval = 1;
        newEase = Math.max(130, card.ease - 20);
      } else if (review.rating === 2) { // Hard
        newInterval = Math.ceil(card.interval * 1.2);
        newEase = Math.max(130, card.ease - 15);
      } else if (review.rating === 3) { // Good
        newInterval = Math.ceil(card.interval * (card.ease / 100));
        newEase = card.ease;
      } else if (review.rating === 4) { // Easy
        newInterval = Math.ceil(card.interval * (card.ease / 100) * 1.3);
        newEase = Math.min(400, card.ease + 10);
      }
      
      // Calculate next review date
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + newInterval);
      
      await this.updateCard(card.id, {
        lastReviewed: now,
        nextReview,
        ease: newEase,
        interval: newInterval,
        repetitions: newRepetitions
      });
    }
    
    return newReview;
  }

  // Stats and advanced operations
  async getDeckWithStats(id: string): Promise<DeckWithStats | undefined> {
    const deck = await this.getDeck(id);
    if (!deck) return undefined;
    
    const deckCards = await this.getCards(id);
    const now = new Date();
    
    // Calculate stats
    const totalCards = deckCards.length;
    
    // A card is considered "mastered" if its interval is at least 14 days
    const masteredCards = deckCards.filter(card => card.interval >= 14).length;
    
    const dueToday = deckCards.filter(card => 
      !card.nextReview || new Date(card.nextReview) <= now
    ).length;
    
    // Find the last studied date
    let lastStudied: Date | null = null;
    for (const card of deckCards) {
      if (card.lastReviewed && (!lastStudied || new Date(card.lastReviewed) > lastStudied)) {
        lastStudied = new Date(card.lastReviewed);
      }
    }
    
    return {
      id: deck.id,
      name: deck.name,
      createdAt: deck.createdAt.toISOString(),
      totalCards,
      masteredCards,
      dueToday,
      lastStudied: lastStudied ? lastStudied.toISOString() : null
    };
  }

  async getDecksWithStats(): Promise<DeckWithStats[]> {
    // This implementation is less efficient for MemStorage, but matches the MongoStorage approach
    // A more efficient MemStorage implementation would iterate through cards directly.
    const allDecks = Array.from(this.decks.values());
    
    const results: DeckWithStats[] = [];
    for (const deck of allDecks) {
        // Note: For simplicity in MemStorage, calculate stats here instead of a complex aggregation
        const deckCards = Array.from(this.cards.values()).filter(card => card.deckId === deck.id);
        const now = new Date();
        
        const totalCards = deckCards.length;
        const masteredCards = deckCards.filter(card => card.interval >= 14).length;
        const dueToday = deckCards.filter(card => !card.nextReview || new Date(card.nextReview) <= now).length;
        const lastStudied = deckCards.reduce((latest: Date | null, card) => {
            if (card.lastReviewed && (!latest || new Date(card.lastReviewed) > latest)) {
                return new Date(card.lastReviewed);
            }
            return latest;
        }, null);
        
        results.push({
            id: deck.id,
            name: deck.name,
            createdAt: deck.createdAt.toISOString(),
            totalCards,
            masteredCards,
            dueToday,
            lastStudied: lastStudied ? lastStudied.toISOString() : null
        });
    }
    return results;
  }

  async getCardWithDeck(id: string): Promise<CardWithDeck | undefined> {
    const card = await this.getCard(id);
    if (!card) return undefined;
    
    const deck = await this.getDeck(card.deckId);
    if (!deck) return undefined;
    
    return {
      id: card.id,
      deckId: card.deckId,
      deckName: deck.name,
      front: card.front,
      back: card.back,
      lastReviewed: card.lastReviewed ? card.lastReviewed.toISOString() : null,
      nextReview: card.nextReview ? card.nextReview.toISOString() : null,
      ease: card.ease,
      interval: card.interval,
      repetitions: card.repetitions
    };
  }
}

// Create instance of the appropriate storage implementation
// We're using MongoStorage for persistent data with MongoDB
import { mongoStorage } from "./mongoStorage";
export const storage = mongoStorage;
