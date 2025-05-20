import { IStorage } from "./storage";
import {
  Deck, InsertDeck, Card, InsertCard,
  Review, InsertReview, DeckWithStats, CardWithDeck
} from "@shared/schema";
import DeckModel from "./models/DeckModel";
import CardModel from "./models/CardModel";
import ReviewModel from "./models/ReviewModel";
import mongoose from "mongoose";

export class MongoStorage implements IStorage {
  // Helper function to convert MongoDB ObjectId to number for client compatibility
  private objectIdToNumber(id: mongoose.Types.ObjectId): number {
    // Use the timestamp portion of ObjectId as a numeric identifier
    // This is not guaranteed to be unique if many objects are created in the same second
    // but works for our use case as a simple conversion mechanism
    return parseInt(id.toString().substring(0, 8), 16);
  }

  // Helper function to convert number to MongoDB ObjectId
  private numberToObjectId(id: number): mongoose.Types.ObjectId {
    // Create a hex representation and pad to 24 chars
    const hexId = id.toString(16).padStart(24, '0');
    return new mongoose.Types.ObjectId(hexId);
  }

  // Deck operations
  async getDecks(): Promise<Deck[]> {
    const decks = await DeckModel.find().sort({ createdAt: -1 });
    return decks.map(deck => ({
      id: this.objectIdToNumber(deck._id),
      name: deck.name,
      createdAt: deck.createdAt
    }));
  }

  async getDeck(id: number): Promise<Deck | undefined> {
    try {
      const objectId = this.numberToObjectId(id);
      const deck = await DeckModel.findById(objectId);
      if (!deck) return undefined;
      
      return {
        id: this.objectIdToNumber(deck._id),
        name: deck.name,
        createdAt: deck.createdAt
      };
    } catch (error) {
      console.error("Error getting deck:", error);
      return undefined;
    }
  }

  async createDeck(deck: InsertDeck): Promise<Deck> {
    const newDeck = await DeckModel.create({
      name: deck.name,
      createdAt: new Date()
    });
    
    return {
      id: this.objectIdToNumber(newDeck._id),
      name: newDeck.name,
      createdAt: newDeck.createdAt
    };
  }

  // Card operations
  async getCards(deckId: number): Promise<Card[]> {
    const objectId = this.numberToObjectId(deckId);
    const cards = await CardModel.find({ deckId: objectId });
    
    return cards.map(card => ({
      id: this.objectIdToNumber(card._id),
      deckId: this.objectIdToNumber(card.deckId as unknown as mongoose.Types.ObjectId),
      front: card.front,
      back: card.back,
      lastReviewed: card.lastReviewed,
      nextReview: card.nextReview,
      ease: card.ease,
      interval: card.interval,
      repetitions: card.repetitions
    }));
  }

  async getCard(id: number): Promise<Card | undefined> {
    try {
      const objectId = this.numberToObjectId(id);
      const card = await CardModel.findById(objectId);
      if (!card) return undefined;
      
      return {
        id: this.objectIdToNumber(card._id),
        deckId: this.objectIdToNumber(card.deckId as unknown as mongoose.Types.ObjectId),
        front: card.front,
        back: card.back,
        lastReviewed: card.lastReviewed,
        nextReview: card.nextReview,
        ease: card.ease,
        interval: card.interval,
        repetitions: card.repetitions
      };
    } catch (error) {
      console.error("Error getting card:", error);
      return undefined;
    }
  }

  async getDueCards(deckId: number, limit?: number): Promise<Card[]> {
    const objectId = this.numberToObjectId(deckId);
    const now = new Date();
    
    // Find cards that are due (nextReview is null or before now)
    const query = {
      deckId: objectId,
      $or: [
        { nextReview: null },
        { nextReview: { $lte: now } }
      ]
    };
    
    let cardsQuery = CardModel.find(query);
    if (limit) cardsQuery = cardsQuery.limit(limit);
    
    const cards = await cardsQuery.exec();
    
    return cards.map(card => ({
      id: this.objectIdToNumber(card._id),
      deckId: this.objectIdToNumber(card.deckId as unknown as mongoose.Types.ObjectId),
      front: card.front,
      back: card.back,
      lastReviewed: card.lastReviewed,
      nextReview: card.nextReview,
      ease: card.ease,
      interval: card.interval,
      repetitions: card.repetitions
    }));
  }

  async createCard(card: InsertCard): Promise<Card> {
    const objectId = this.numberToObjectId(card.deckId);
    
    const newCard = await CardModel.create({
      deckId: objectId,
      front: card.front,
      back: card.back,
      lastReviewed: null,
      nextReview: null,
      ease: 250,
      interval: 1,
      repetitions: 0
    });
    
    return {
      id: this.objectIdToNumber(newCard._id),
      deckId: card.deckId,
      front: newCard.front,
      back: newCard.back,
      lastReviewed: newCard.lastReviewed,
      nextReview: newCard.nextReview,
      ease: newCard.ease,
      interval: newCard.interval,
      repetitions: newCard.repetitions
    };
  }

  async updateCard(id: number, cardUpdate: Partial<Card>): Promise<Card> {
    const objectId = this.numberToObjectId(id);
    
    // Convert deckId if it's part of the update
    const updateData: any = { ...cardUpdate };
    if (updateData.deckId) {
      updateData.deckId = this.numberToObjectId(updateData.deckId);
    }
    
    const updatedCard = await CardModel.findByIdAndUpdate(
      objectId,
      { $set: updateData },
      { new: true }
    );
    
    if (!updatedCard) {
      throw new Error(`Card with id ${id} not found`);
    }
    
    return {
      id: this.objectIdToNumber(updatedCard._id),
      deckId: this.objectIdToNumber(updatedCard.deckId as unknown as mongoose.Types.ObjectId),
      front: updatedCard.front,
      back: updatedCard.back,
      lastReviewed: updatedCard.lastReviewed,
      nextReview: updatedCard.nextReview,
      ease: updatedCard.ease,
      interval: updatedCard.interval,
      repetitions: updatedCard.repetitions
    };
  }

  // Review operations
  async createReview(review: InsertReview): Promise<Review> {
    // Get the card
    const cardId = this.numberToObjectId(review.cardId);
    const card = await CardModel.findById(cardId);
    if (!card) {
      throw new Error(`Card with id ${review.cardId} not found`);
    }
    
    // Create the review
    const newReview = await ReviewModel.create({
      cardId: cardId,
      rating: review.rating,
      reviewedAt: new Date()
    });
    
    // Update the card based on the review rating
    let newInterval = card.interval;
    let newEase = card.ease;
    let newRepetitions = card.repetitions + 1;
    const now = new Date();
    
    // SuperMemo-2 algorithm
    if (review.rating === 1) { // Again
      newInterval = 1;
      newEase = Math.max(130, card.ease - 20);
      newRepetitions = 0;
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
    
    // Update the card
    await CardModel.findByIdAndUpdate(cardId, {
      lastReviewed: now,
      nextReview: nextReview,
      ease: newEase,
      interval: newInterval,
      repetitions: newRepetitions
    });
    
    return {
      id: this.objectIdToNumber(newReview._id),
      cardId: review.cardId,
      rating: newReview.rating,
      reviewedAt: newReview.reviewedAt
    };
  }

  // Stats and advanced operations
  async getDeckWithStats(id: number): Promise<DeckWithStats | undefined> {
    try {
      const objectId = this.numberToObjectId(id);
      const deck = await DeckModel.findById(objectId);
      if (!deck) return undefined;
      
      const now = new Date();
      
      // Get all cards for this deck
      const deckCards = await CardModel.find({ deckId: objectId });
      
      // Calculate stats
      const totalCards = deckCards.length;
      
      // A card is considered "mastered" if its interval is at least 7 days OR
      // if it has been reviewed with a rating of 3 or 4 at least once
      const masteredCards = deckCards.filter(card => {
        // Check if interval is at least 7 days
        if (card.interval >= 7) return true;
        
        // Check if card has been reviewed with good/easy rating
        if (card.lastReviewed && card.ease >= 250) return true;
        
        return false;
      }).length;
      
      const dueToday = deckCards.filter(card => 
        !card.nextReview || card.nextReview <= now
      ).length;
      
      // Find the last studied date
      let lastStudied: Date | null = null;
      for (const card of deckCards) {
        if (card.lastReviewed && (!lastStudied || card.lastReviewed > lastStudied)) {
          lastStudied = card.lastReviewed;
        }
      }
      
      return {
        id: this.objectIdToNumber(deck._id),
        name: deck.name,
        createdAt: deck.createdAt.toISOString(),
        totalCards,
        masteredCards,
        dueToday,
        lastStudied: lastStudied ? lastStudied.toISOString() : null
      };
    } catch (error) {
      console.error("Error getting deck with stats:", error);
      return undefined;
    }
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
    try {
      const objectId = this.numberToObjectId(id);
      const card = await CardModel.findById(objectId);
      if (!card) return undefined;
      
      const deck = await DeckModel.findById(card.deckId);
      if (!deck) return undefined;
      
      return {
        id: this.objectIdToNumber(card._id),
        deckId: this.objectIdToNumber(card.deckId as unknown as mongoose.Types.ObjectId),
        deckName: deck.name,
        front: card.front,
        back: card.back,
        lastReviewed: card.lastReviewed ? card.lastReviewed.toISOString() : null,
        nextReview: card.nextReview ? card.nextReview.toISOString() : null,
        ease: card.ease,
        interval: card.interval,
        repetitions: card.repetitions
      };
    } catch (error) {
      console.error("Error getting card with deck:", error);
      return undefined;
    }
  }
}

export const mongoStorage = new MongoStorage();