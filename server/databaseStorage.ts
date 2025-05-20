import { 
  Deck, InsertDeck, Card, InsertCard, 
  Review, InsertReview, DeckWithStats, CardWithDeck,
  decks, cards, reviews
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, lte, desc, sql } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Deck operations
  async getDecks(): Promise<Deck[]> {
    return await db.select().from(decks);
  }

  async getDeck(id: number): Promise<Deck | undefined> {
    const result = await db.select().from(decks).where(eq(decks.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createDeck(deck: InsertDeck): Promise<Deck> {
    const result = await db.insert(decks).values(deck).returning();
    return result[0];
  }

  // Card operations
  async getCards(deckId: number): Promise<Card[]> {
    return await db.select().from(cards).where(eq(cards.deckId, deckId));
  }

  async getCard(id: number): Promise<Card | undefined> {
    const result = await db.select().from(cards).where(eq(cards.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getDueCards(deckId: number, limit?: number): Promise<Card[]> {
    const now = new Date();
    
    // Get cards that are due (next review date is in the past or null)
    const query = db.select()
      .from(cards)
      .where(
        and(
          eq(cards.deckId, deckId),
          or(
            sql`${cards.nextReview} IS NULL`,
            sql`${cards.nextReview} <= ${now}`
          )
        )
      )
      .orderBy(
        // First order by null nextReview (new cards first)
        // Then by nextReview date (earliest due first)
        sql`CASE WHEN ${cards.nextReview} IS NULL THEN 0 ELSE 1 END`,
        cards.nextReview
      );
    
    if (limit) {
      query.limit(limit);
    }
    
    return await query;
  }

  async createCard(card: InsertCard): Promise<Card> {
    const result = await db.insert(cards).values({
      ...card,
      ease: 250,
      interval: 1,
      repetitions: 0
    }).returning();
    return result[0];
  }

  async updateCard(id: number, cardUpdate: Partial<Card>): Promise<Card> {
    const result = await db.update(cards)
      .set(cardUpdate)
      .where(eq(cards.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Card with id ${id} not found`);
    }
    
    return result[0];
  }

  // Review operations
  async createReview(review: InsertReview): Promise<Review> {
    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // 1. Insert the review
      const [newReview] = await tx.insert(reviews)
        .values(review)
        .returning();

      // 2. Get the card to update
      const [card] = await tx.select()
        .from(cards)
        .where(eq(cards.id, review.cardId));
      
      if (!card) {
        throw new Error(`Card with id ${review.cardId} not found`);
      }

      // 3. Update the card based on the review
      let newInterval = card.interval || 1;
      let newEase = card.ease || 250;
      const newRepetitions = (card.repetitions || 0) + 1;
      const now = new Date();

      // SuperMemo-2 algorithm
      if (review.rating === 1) { // Again
        newInterval = 1;
        newEase = Math.max(130, (card.ease || 250) - 20);
      } else if (review.rating === 2) { // Hard
        newInterval = Math.ceil((card.interval || 1) * 1.2);
        newEase = Math.max(130, (card.ease || 250) - 15);
      } else if (review.rating === 3) { // Good
        newInterval = Math.ceil((card.interval || 1) * ((card.ease || 250) / 100));
        newEase = card.ease || 250;
      } else if (review.rating === 4) { // Easy
        newInterval = Math.ceil((card.interval || 1) * ((card.ease || 250) / 100) * 1.3);
        newEase = Math.min(400, (card.ease || 250) + 10);
      }

      // Calculate next review date
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + newInterval);

      // Update the card
      await tx.update(cards)
        .set({
          lastReviewed: now,
          nextReview,
          ease: newEase,
          interval: newInterval,
          repetitions: newRepetitions
        })
        .where(eq(cards.id, card.id));

      return newReview;
    });
  }

  // Stats and advanced operations
  async getDeckWithStats(id: number): Promise<DeckWithStats | undefined> {
    const deckResult = await db.select().from(decks).where(eq(decks.id, id));
    if (deckResult.length === 0) return undefined;
    
    const deck = deckResult[0];
    const now = new Date();
    
    // Get all cards for this deck
    const deckCards = await db.select().from(cards).where(eq(cards.deckId, id));
    
    // Calculate stats
    const totalCards = deckCards.length;
    
    // A card is considered "mastered" if its interval is at least 7 days OR
    // if it has been reviewed with a rating of 3 or 4 at least once
    const masteredCards = deckCards.filter(card => {
      // Check if interval is at least 7 days
      if ((card.interval || 0) >= 7) return true;
      
      // Check if card has been reviewed with good/easy rating
      if (card.lastReviewed && (card.ease || 0) >= 250) return true;
      
      return false;
    }).length;
    
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
    const allDecks = await this.getDecks();
    const result: DeckWithStats[] = [];
    
    for (const deck of allDecks) {
      const deckWithStats = await this.getDeckWithStats(deck.id);
      if (deckWithStats) {
        result.push(deckWithStats);
      }
    }
    
    return result;
  }

  async getCardWithDeck(id: number): Promise<CardWithDeck | undefined> {
    const cardResult = await db.select().from(cards).where(eq(cards.id, id));
    if (cardResult.length === 0) return undefined;
    
    const card = cardResult[0];
    const deckResult = await db.select().from(decks).where(eq(decks.id, card.deckId));
    if (deckResult.length === 0) return undefined;
    
    const deck = deckResult[0];
    
    return {
      id: card.id,
      deckId: card.deckId,
      deckName: deck.name,
      front: card.front,
      back: card.back,
      lastReviewed: card.lastReviewed ? card.lastReviewed.toISOString() : null,
      nextReview: card.nextReview ? card.nextReview.toISOString() : null,
      ease: card.ease || 250,
      interval: card.interval || 1,
      repetitions: card.repetitions || 0
    };
  }
}