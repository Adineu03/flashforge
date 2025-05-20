import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { cardEngine } from "./services/cardEngine";
import { documentParser } from "./services/simpleDocumentParser";
import { upload } from "./middleware/fileUpload";
import { 
  insertDeckSchema, 
  insertCardSchema, 
  insertReviewSchema, 
  generateCardsSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import mongoose from "mongoose";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware
  const handleError = (err: any, res: Response) => {
    console.error("API Error:", err);
    
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: fromZodError(err).message
      });
    }
    
    return res.status(500).json({
      message: err.message || "Internal server error"
    });
  };

  // Card routes
  app.get("/api/decks/:deckId/cards", async (req: Request, res: Response) => {
    try {
      console.log("Reached /api/decks/:deckId/cards route handler.");
      console.log("Deck ID received in /api/decks/:deckId/cards:", req.params.deckId);
      const deckId = req.params.deckId;
      const cards = await storage.getCards(deckId);
      res.json(cards);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/decks/:deckId/due-cards", async (req: Request, res: Response) => {
    try {
      const deckId = req.params.deckId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const cards = await storage.getDueCards(deckId, limit);
      res.json(cards);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Deck routes
  app.get("/api/decks", async (req: Request, res: Response) => {
    try {
      const decks = await storage.getDecksWithStats();
      res.json(decks);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/decks/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const deck = await storage.getDeckWithStats(id);
      
      if (!deck) {
        return res.status(404).json({ message: "Deck not found" });
      }
      
      res.json(deck);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/decks", async (req: Request, res: Response) => {
    try {
      const deckData = insertDeckSchema.parse(req.body);
      const deck = await storage.createDeck(deckData);
      res.status(201).json(deck);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/cards/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const card = await storage.getCardWithDeck(id);
      
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      
      res.json(card);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/cards", async (req: Request, res: Response) => {
    try {
      const cardData = insertCardSchema.parse(req.body);
      const card = await storage.createCard(cardData);
      res.status(201).json(card);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Review routes
  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(reviewData);
      
      // Get the updated card
      const card = await storage.getCardWithDeck(reviewData.cardId);
      
      res.status(201).json({
        review,
        card
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  // AI Card Generation route
  app.post("/api/generate-cards", async (req: Request, res: Response) => {
    try {
      const generateParams = generateCardsSchema.parse(req.body);
      
      // Add console.log to debug
      console.log("Generating cards with deck ID:", generateParams.deckId);

      // --- Start Debugging Block ---
      console.log("Attempting to find deck with ID before getDeck:", generateParams.deckId);
      try {
          const testDeck = await storage.getDeck(generateParams.deckId);
          if (testDeck) {
              console.log("Successfully found deck before getDeck call in generate-cards:", testDeck.id, testDeck.name);
          } else {
              console.log("Did NOT find deck before getDeck call in generate-cards with ID:", generateParams.deckId);
          }
          const allDecks = await storage.getDecks();
          console.log("All decks after attempt to find specific deck:", allDecks.map(d => ({id: d.id, name: d.name})));
      } catch (debugError) {
          console.error("Error during pre-getDeck debugging in generate-cards:", debugError);
      }
      // --- End Debugging Block ---

      // Check if deck exists
      const deck = await storage.getDeck(generateParams.deckId);
      if (!deck) {
        return res.status(404).json({ message: "Deck not found" });
      }
      
      // Generate cards with AI
      const cardData = await cardEngine.generateCards(
        generateParams.deckId,
        generateParams.content,
        generateParams.count,
        {
          includeImages: generateParams.includeImages,
          increaseDifficulty: generateParams.increaseDifficulty
        }
      );
      
      // Save generated cards
      const savedCards = [];
      for (const card of cardData) {
        const savedCard = await storage.createCard(card);
        savedCards.push(savedCard);
      }
      
      res.status(201).json({
        success: true,
        count: savedCards.length,
        cards: savedCards
      });
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Document Upload Route for Card Generation
  app.post("/api/upload-document", upload.single('document'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const filePath = req.file.path;
      const deckIdParam = req.body.deckId as string;
      const countParam = req.body.count || 10;
      const includeImagesParam = req.body.includeImages === 'true';
      const increaseDifficultyParam = req.body.increaseDifficulty === 'true';
      
      // Check if deckId is valid ObjectId string
      const deckId = deckIdParam;
      if (!mongoose.Types.ObjectId.isValid(deckId)) {
        await documentParser.cleanupFile(filePath);
        return res.status(400).json({ message: "Invalid deck ID format" });
      }
      
      // Check if deck exists
      const deck = await storage.getDeck(deckId);
      if (!deck) {
        await documentParser.cleanupFile(filePath);
        return res.status(404).json({ message: "Deck not found" });
      }
      
      // Parse document and extract content
      const content = await documentParser.parseDocument(filePath);
      
      // Delete the temp file after extracting content
      await documentParser.cleanupFile(filePath);
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "No content could be extracted from the document" });
      }
      
      // Generate cards with AI using the extracted content
      const cardData = await cardEngine.generateCards(
        deckId,
        content,
        parseInt(countParam as string),
        {
          includeImages: includeImagesParam,
          increaseDifficulty: increaseDifficultyParam
        }
      );
      
      // Save generated cards
      const savedCards = [];
      for (const card of cardData) {
        const savedCard = await storage.createCard(card);
        savedCards.push(savedCard);
      }
      
      res.status(201).json({
        success: true,
        count: savedCards.length,
        cards: savedCards,
        fileName: req.file.originalname
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Stats routes
  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      const decks = await storage.getDecksWithStats();
      
      // Calculate total stats
      const totalCards = decks.reduce((sum, deck) => sum + deck.totalCards, 0);
      const masteredCards = decks.reduce((sum, deck) => sum + deck.masteredCards, 0);
      const dueCards = decks.reduce((sum, deck) => sum + deck.dueToday, 0);
      const newCards = totalCards - masteredCards - dueCards;
      
      res.json({
        totalCards,
        masteredCards,
        learningCards: dueCards,
        newCards,
        decks
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  // DELETE route to delete a deck by ID
  app.delete("/api/decks/:deckId", async (req: Request, res: Response) => {
    try {
      const deckId = req.params.deckId;
      console.log(`Attempting to delete deck with ID: ${deckId}`);
      // Optional: Add validation for deckId format here if needed, though deleteDeck handles CastError

      const success = await storage.deleteDeck(deckId);

      if (success) {
        console.log(`Successfully deleted deck with ID: ${deckId}`);
        res.status(200).json({ message: "Deck deleted successfully" });
      } else {
        console.warn(`Deck with ID ${deckId} not found for deletion or deletion failed.`);
        // It might be more accurate to check if it existed before attempting deletion for a true 404
        // For simplicity, returning 404 if deleteCount is not 1 (not found or not deleted)
        res.status(404).json({ message: "Deck not found or could not be deleted" });
      }
    } catch (err) {
      console.error("Error in DELETE /api/decks/:deckId route:", err);
      handleError(err, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
