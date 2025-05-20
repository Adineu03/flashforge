import OpenAI from "openai";
import { InsertCard } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

class CardEngine {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY || "dummy-key"
    });
  }

  async generateCards(
    deckId: number, 
    content: string, 
    count: number = 10,
    options: { 
      includeImages?: boolean, 
      increaseDifficulty?: boolean 
    } = {}
  ): Promise<InsertCard[]> {
    try {
      // Create system prompt based on options
      let difficultyLevel = options.increaseDifficulty ? "challenging" : "balanced";
      
      // Define the system prompt
      let systemPrompt = `You are an expert educational content creator specializing in creating high-quality flashcards for learning.
Given the content provided, create ${count} flashcards with clear questions on the front and comprehensive answers on the back.
Make the flashcards ${difficultyLevel} difficulty level, focusing on the most important concepts.
The output MUST be a valid JSON object with a single key 'flashcards' containing an array of flashcard objects.
Each flashcard object MUST have exactly two keys: 'front' for the question and 'back' for the answer.`;

      // Add instruction based on difficulty
      if (options.increaseDifficulty) {
        systemPrompt += `
For increased difficulty:
- Create questions that require deeper understanding
- Use more technical terminology
- Ask about edge cases and exceptions
- Include questions that require synthesis of multiple concepts`;
      }

      // Request the completion
      const response = await this.openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Please create ${count} flashcards from the following content. Your response MUST be a JSON object with this exact structure: {"flashcards": [{"front": "question text", "back": "answer text"}, ...]}

Content to analyze:
${content}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      // Extract and parse the response
      const responseText = response.choices[0].message.content;
      if (!responseText) {
        throw new Error("No content returned from OpenAI");
      }

      console.log("OpenAI response:", responseText);

      // Parse the JSON response
      const parsedResponse = JSON.parse(responseText);
      
      // Handle different possible response structures
      let flashcards = [];
      if (parsedResponse.flashcards && Array.isArray(parsedResponse.flashcards)) {
        flashcards = parsedResponse.flashcards;
      } else if (Array.isArray(parsedResponse)) {
        flashcards = parsedResponse;
      } else {
        throw new Error("Invalid response format from OpenAI. Expected flashcards array.");
      }

      // Validate flashcards
      if (flashcards.length === 0) {
        throw new Error("No flashcards generated from OpenAI");
      }

      // Map the flashcards to the InsertCard format
      return flashcards.map((card: any) => {
        if (!card.front || !card.back) {
          throw new Error("Invalid flashcard format. Missing front or back property.");
        }
        return {
          deckId,
          front: card.front,
          back: card.back
        };
      });
    } catch (error) {
      console.error("Error generating flashcards:", error);
      throw new Error(`Failed to generate flashcards: ${error.message}`);
    }
  }
}

export const cardEngine = new CardEngine();
