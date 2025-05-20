# FlashForge - AI-Powered Flashcard Creation System

FlashForge is an AI-powered flashcard creation system that uses LangChain and OpenAI to automatically generate study cards from provided content. The application allows users to create decks of flashcards, review them with a spaced repetition system, and track their learning progress through a stats dashboard.

## Features

- Create flashcard decks for various subjects
- Generate flashcards automatically using AI from:
  - Text input
  - Document uploads (.txt, .docx, .pdf, .pptx)
- Review flashcards using spaced repetition
- Track learning progress with detailed statistics
- Persistent storage using PostgreSQL database

## Tech Stack

- **Frontend**: React, TailwindCSS, Shadcn UI components
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **AI**: LangChain + OpenAI GPT-4o 
- **Package Manager**: npm

## Prerequisites

- Node.js (v18+)
- MongoDB (local or MongoDB Atlas)
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/flashforge.git
cd flashforge
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following content:
```
MONGODB_URI=mongodb://localhost:27017/flashforge
OPENAI_API_KEY=your_openai_api_key
```

4. Start MongoDB:
   - If using local MongoDB, make sure your MongoDB service is running
   - If using MongoDB Atlas, ensure you have the correct connection string with username and password

5. Start the application:
```bash
npm run dev
```

The application will be available at http://localhost:5000

## Project Structure

- `/client`: Frontend React application
  - `/src/components`: UI components
  - `/src/pages`: Page components
  - `/src/hooks`: Custom React hooks
  - `/src/lib`: Utility functions
- `/server`: Backend Node.js/Express API
  - `/services`: Business logic
  - `/middleware`: Express middleware
- `/shared`: Code shared between client and server
  - `/schema.ts`: Database schema and types

## API Endpoints

- `GET /api/decks`: Get all decks
- `GET /api/decks/:id`: Get a specific deck
- `POST /api/decks`: Create a new deck
- `GET /api/decks/:deckId/cards`: Get all cards in a deck
- `GET /api/decks/:deckId/due-cards`: Get cards due for review
- `POST /api/cards`: Create a new card
- `POST /api/reviews`: Submit a review for a card
- `POST /api/generate-cards`: Generate cards using AI
- `POST /api/upload-document`: Upload a document for processing
