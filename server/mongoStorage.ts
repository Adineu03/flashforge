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
  // Deck operations
  async getDecks(): Promise<Deck[]> {
    const decks = await DeckModel.find().sort({ createdAt: -1 });
    return decks.map(deck => ({
      id: deck._id.toString(), // Use ObjectId as string
      name: deck.name,
      createdAt: deck.createdAt
    }));
  }

  async getDeck(id: string): Promise<Deck | undefined> {
    try {
      const objectId = new mongoose.Types.ObjectId(id); // Convert string ID to ObjectId
      const deck = await DeckModel.findById(objectId);
      if (!deck) return undefined;
      
      return {
        id: deck._id.toString(), // Use ObjectId as string
        name: deck.name,
        createdAt: deck.createdAt
      };
    } catch (error) {
      console.error("Error getting deck:", error);
      // Handle invalid ObjectId format specifically
      if (error instanceof mongoose.Error.CastError) {
          console.error("Invalid Deck ID format:", id);
          return undefined; // Or throw a more specific error if preferred
      }
      return undefined;
    }
  }

  async createDeck(deck: InsertDeck): Promise<Deck> {
    const newDeck = await DeckModel.create({
      name: deck.name,
      createdAt: new Date()
    });
    
    return {
      id: newDeck._id.toString(), // Use ObjectId as string
      name: newDeck.name,
      createdAt: newDeck.createdAt
    };
  }

  // Card operations
  async getCards(deckId: string): Promise<Card[]> {
    const objectId = new mongoose.Types.ObjectId(deckId);
    const cards = await CardModel.find({ deckId: objectId });
    
    return cards.map(card => ({
      id: card._id.toString(),
      deckId: card.deckId.toString(),
      front: card.front,
      back: card.back,
      createdAt: card.createdAt,
      lastReviewed: card.lastReviewed,
      nextReview: card.nextReview,
      ease: card.ease,
      interval: card.interval,
      repetitions: card.repetitions
    }));
  }

  async getCard(id: string): Promise<Card | undefined> {
    try {
      const objectId = new mongoose.Types.ObjectId(id);
      const card = await CardModel.findById(objectId);
      if (!card) return undefined;
      
      return {
        id: card._id.toString(),
        deckId: card.deckId.toString(),
        front: card.front,
        back: card.back,
        createdAt: card.createdAt,
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

  async getDueCards(deckId: string, limit?: number): Promise<Card[]> {
    const objectId = new mongoose.Types.ObjectId(deckId);
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
      id: card._id.toString(),
      deckId: card.deckId.toString(),
      front: card.front,
      back: card.back,
      createdAt: card.createdAt,
      lastReviewed: card.lastReviewed,
      nextReview: card.nextReview,
      ease: card.ease,
      interval: card.interval,
      repetitions: card.repetitions
    }));
  }

  async createCard(card: InsertCard): Promise<Card> {
    const objectId = new mongoose.Types.ObjectId(card.deckId);
    
    const newCard = await CardModel.create({
      deckId: objectId,
      front: card.front,
      back: card.back,
      createdAt: new Date(),
      lastReviewed: null,
      nextReview: null,
      ease: 250,
      interval: 1,
      repetitions: 0
    });
    
    return {
      id: newCard._id.toString(),
      deckId: card.deckId,
      front: newCard.front,
      back: newCard.back,
      createdAt: newCard.createdAt,
      lastReviewed: newCard.lastReviewed,
      nextReview: newCard.nextReview,
      ease: newCard.ease,
      interval: newCard.interval,
      repetitions: newCard.repetitions
    };
  }

  async updateCard(id: string, cardUpdate: Partial<Card>): Promise<Card> {
    const objectId = new mongoose.Types.ObjectId(id);
    
    // Convert deckId if it's part of the update
    const updateData: any = { ...cardUpdate };
    if (updateData.deckId) {
      updateData.deckId = new mongoose.Types.ObjectId(updateData.deckId);
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
      id: updatedCard._id.toString(),
      deckId: updatedCard.deckId.toString(),
      front: updatedCard.front,
      back: updatedCard.back,
      createdAt: updatedCard.createdAt,
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
    const cardId = new mongoose.Types.ObjectId(review.cardId);
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
      id: newReview._id.toString(),
      cardId: review.cardId,
      rating: newReview.rating,
      reviewedAt: newReview.reviewedAt
    };
  }

  // Stats and advanced operations
  async getDeckWithStats(id: string): Promise<DeckWithStats | undefined> {
    try {
      const objectId = new mongoose.Types.ObjectId(id); // Convert string ID to ObjectId
      // Aggregate to get deck with stats - update aggregation stages to match string IDs
      const result = await DeckModel.aggregate([
          { $match: { _id: objectId } },
          { $lookup: {
              from: 'cards',
              localField: '_id',
              foreignField: 'deckId',
              as: 'cards'
          }},
          { $addFields: { // Add this stage for debugging
              cardRepetitions: { $map: { input: '$cards', as: 'card', in: '$$card.repetitions' } }
          }},
          { $addFields: {
              totalCards: { $size: '$cards' },
              masteredCards: { $size: { $filter: { input: '$cards', as: 'card', cond: { $gte: ['$$card.repetitions', 3] } } } }, // Assuming mastered after 3 repetitions
              dueToday: { $size: { $filter: { input: '$cards', as: 'card', cond: { $lte: ['$$card.nextReview', new Date()] } } } },
              lastStudied: { $max: '$cards.lastReviewed' }
          }},
          { $project: {
              _id: 0,
              id: { $toString: '$_id' }, // Convert ObjectId to string for output
              name: 1,
              createdAt: 1,
              totalCards: 1,
              masteredCards: 1,
              dueToday: 1,
              lastStudied: 1
          }}
      ]);

      const deck = result[0];

      if (!deck) return undefined;
      
      return deck as DeckWithStats; // Cast the result to the updated type
    } catch (error) {
      console.error("Error getting deck with stats:", error);
       // Handle invalid ObjectId format specifically
      if (error instanceof mongoose.Error.CastError) {
          console.error("Invalid Deck ID format:", id);
          return undefined; // Or throw a more specific error if preferred
      }
      return undefined;
    }
  }

  async getDecksWithStats(): Promise<DeckWithStats[]> {
    const results = await DeckModel.aggregate([
        { $lookup: {
            from: 'cards',
            localField: '_id',
            foreignField: 'deckId',
            as: 'cards'
        }},
        { $addFields: { // Add this stage for debugging
            cardRepetitions: { $map: { input: '$cards', as: 'card', in: '$$card.repetitions' } }
        }},
        { $addFields: {
            totalCards: { $size: '$cards' },
            masteredCards: { $size: { $filter: { input: '$cards', as: 'card', cond: { $gte: ['$$card.repetitions', 3] } } } }, // Assuming mastered after 3 repetitions
            dueToday: { $size: { $filter: { input: '$cards', as: 'card', cond: { $lte: ['$$card.nextReview', new Date()] } } } },
            lastStudied: { $max: '$cards.lastReviewed' }
        }},
        { $project: {
            _id: 0,
            id: { $toString: '$_id' },
            name: 1,
            createdAt: 1,
            totalCards: 1,
            masteredCards: 1,
            dueToday: 1,
            lastStudied: 1
        }}
    ]);

    return results.map(result => result as DeckWithStats); // Cast results to the updated type
  }

  async getCardWithDeck(id: string): Promise<CardWithDeck | undefined> {
    try {
      const objectId = new mongoose.Types.ObjectId(id);
      const card = await CardModel.findById(objectId);
      if (!card) return undefined;
      
      const deck = await DeckModel.findById(card.deckId);
      if (!deck) return undefined;
      
      return {
        id: card._id.toString(),
        deckId: card.deckId.toString(),
        deckName: deck.name,
        front: card.front,
        back: card.back,
        createdAt: card.createdAt,
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

  // Delete deck and associated cards
  async deleteDeck(id: string): Promise<boolean> {
    try {
      const objectId = new mongoose.Types.ObjectId(id);
      // Delete associated cards first
      await CardModel.deleteMany({ deckId: objectId });
      // Then delete the deck
      const result = await DeckModel.deleteOne({ _id: objectId });
      return result.deletedCount === 1;
    } catch (error) {
      console.error("Error deleting deck:", error);
      // Handle invalid ObjectId format specifically
      if (error instanceof mongoose.Error.CastError) {
          console.error("Invalid Deck ID format for deletion:", id);
          return false; // Or throw a more specific error if preferred
      }
      throw error; // Re-throw other errors
    }
  }
}

export const mongoStorage = new MongoStorage();