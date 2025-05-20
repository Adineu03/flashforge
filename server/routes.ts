import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { cardEngine } from "./services/cardEngine";
import { documentParser } from "./services/documentParser";
import { upload } from "./middleware/fileUpload";
import { 
  insertDeckSchema, 
  insertCardSchema, 
  insertReviewSchema, 
  generateCardsSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

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
      const id = parseInt(req.params.id);
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

  // Card routes
  app.get("/api/decks/:deckId/cards", async (req: Request, res: Response) => {
    try {
      const deckId = parseInt(req.params.deckId);
      const cards = await storage.getCards(deckId);
      res.json(cards);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/decks/:deckId/due-cards", async (req: Request, res: Response) => {
    try {
      const deckId = parseInt(req.params.deckId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const cards = await storage.getDueCards(deckId, limit);
      res.json(cards);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/cards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
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
      const deckIdParam = req.body.deckId;
      const countParam = req.body.count || 10;
      const includeImagesParam = req.body.includeImages === 'true';
      const increaseDifficultyParam = req.body.increaseDifficulty === 'true';
      
      // Check if deckId is valid
      const deckId = parseInt(deckIdParam);
      if (isNaN(deckId)) {
        await documentParser.cleanupFile(filePath);
        return res.status(400).json({ message: "Invalid deck ID" });
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
        parseInt(countParam),
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

  const httpServer = createServer(app);
  return httpServer;
}
