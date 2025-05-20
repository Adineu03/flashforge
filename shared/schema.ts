import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Deck model
export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDeckSchema = createInsertSchema(decks).omit({
  id: true,
  createdAt: true,
});

// Card model
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastReviewed: timestamp("last_reviewed"),
  nextReview: timestamp("next_review"),
  ease: integer("ease").default(250), // SRS ease factor (multiplier, 250 = 2.5)
  interval: integer("interval").default(1), // Days
  repetitions: integer("repetitions").default(0), // How many times card was studied
});

export const insertCardSchema = createInsertSchema(cards).omit({
  id: true,
  createdAt: true,
  lastReviewed: true,
  nextReview: true,
  ease: true,
  interval: true,
  repetitions: true,
});

// Card review model
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull(),
  rating: integer("rating").notNull(), // 1-4 rating (Again, Hard, Good, Easy)
  reviewedAt: timestamp("reviewed_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  reviewedAt: true,
});

// AI generation request schema
export const generateCardsSchema = z.object({
  deckId: z.number(),
  content: z.string().min(1, "Content is required for card generation"),
  count: z.number().int().min(1).max(30).default(10),
  includeImages: z.boolean().default(false),
  increaseDifficulty: z.boolean().default(false),
});

// Export types
export type Deck = typeof decks.$inferSelect;
export type InsertDeck = z.infer<typeof insertDeckSchema>;

export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type GenerateCardsRequest = z.infer<typeof generateCardsSchema>;

// Export additional schemas
export const cardWithDeckSchema = z.object({
  id: z.number(),
  deckId: z.number(),
  deckName: z.string(),
  front: z.string(),
  back: z.string(),
  lastReviewed: z.string().nullable(),
  nextReview: z.string().nullable(),
  ease: z.number(),
  interval: z.number(),
  repetitions: z.number(),
});

export type CardWithDeck = z.infer<typeof cardWithDeckSchema>;

export const deckWithStatsSchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.string(),
  totalCards: z.number(),
  masteredCards: z.number(),
  dueToday: z.number(),
  lastStudied: z.string().nullable(),
});

export type DeckWithStats = z.infer<typeof deckWithStatsSchema>;
