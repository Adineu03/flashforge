import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { InsertCard } from "@shared/schema";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

class CardEngine {
  private model: ChatOpenAI;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: OPENAI_MODEL,
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
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
      // Create difficulty level based on options
      let difficultyLevel = options.increaseDifficulty ? "challenging" : "balanced";
      
      // Define the prompt template with formatting
      const basePromptTemplate = `You are an expert educational content creator specializing in creating high-quality flashcards for learning.
Given the content provided, create {count} flashcards with clear questions on the front and comprehensive answers on the back.
Make the flashcards {difficulty} difficulty level, focusing on the most important concepts.

{difficulty_instructions}

Content to analyze:
{content}

Return a valid JSON array of flashcard objects. Each flashcard object must have exactly two properties:
- "front": The question or prompt on the front of the card
- "back": The comprehensive answer on the back of the card`;

      // Add instruction based on difficulty
      let difficultyInstructions = "";
      if (options.increaseDifficulty) {
        difficultyInstructions = `For increased difficulty:
- Create questions that require deeper understanding
- Use more technical terminology
- Ask about edge cases and exceptions
- Include questions that require synthesis of multiple concepts`;
      }

      // Create the prompt template
      const promptTemplate = PromptTemplate.fromTemplate(basePromptTemplate);
      
      // Define the expected output schema using Zod
      const outputSchema = z.array(
        z.object({
          front: z.string().describe("The question on the front of the flashcard"),
          back: z.string().describe("The answer on the back of the flashcard")
        })
      );

      // Create a structured output parser
      const parser = StructuredOutputParser.fromZodSchema(outputSchema);
      
      // Create the chain
      const chain = RunnableSequence.from([
        promptTemplate,
        this.model,
        parser
      ]);

      // Execute the chain
      const result = await chain.invoke({
        count: count.toString(),
        difficulty: difficultyLevel,
        difficulty_instructions: difficultyInstructions,
        content: content
      });

      console.log("LangChain response:", JSON.stringify(result, null, 2));
      
      // Validate flashcards
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error("No flashcards generated");
      }

      // Map the flashcards to the InsertCard format
      return result.map((card: any) => {
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
      throw new Error(`Failed to generate flashcards: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const cardEngine = new CardEngine();
