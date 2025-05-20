import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FlashCard } from "@/components/flashcard/FlashCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

import type { Card, DeckWithStats } from "@shared/schema";

export default function ReviewPage() {
  const [match, params] = useRoute("/review/:deckId");
  const deckId = match ? parseInt(params.deckId) : null;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [completedSession, setCompletedSession] = useState(false);

  // Fetch deck info if deckId is provided
  const { 
    data: deck,
    isLoading: isDeckLoading,
    error: deckError
  } = useQuery<DeckWithStats>({
    queryKey: deckId ? [`/api/decks/${deckId}`] : null,
    enabled: !!deckId,
  });

  // Fetch cards due for review
  const { 
    data: dueCards,
    isLoading: isCardsLoading,
    error: cardsError,
    refetch: refetchDueCards
  } = useQuery<Card[]>({
    queryKey: deckId ? [`/api/decks/${deckId}/due-cards`] : ["/api/decks/due-cards"],
  });

  // Handle card review submission
  const submitReviewMutation = useMutation({
    mutationFn: async ({ cardId, rating }: { cardId: number; rating: number }) => {
      const response = await apiRequest("POST", "/api/reviews", { cardId, rating });
      return response.json();
    },
    onSuccess: () => {
      // Go to next card
      setCurrentCardIndex(prev => prev + 1);
      
      // Invalidate queries to update card status
      if (deckId) {
        queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}/due-cards`] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/decks/due-cards"] });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error saving review",
        description: error.message,
      });
    },
  });

  // Check if session is completed when current card index changes
  useEffect(() => {
    if (dueCards && currentCardIndex >= dueCards.length && dueCards.length > 0) {
      setCompletedSession(true);
    }
  }, [currentCardIndex, dueCards]);

  // Handle rating click
  const handleCardRating = (rating: number) => {
    if (dueCards && currentCardIndex < dueCards.length) {
      const card = dueCards[currentCardIndex];
      submitReviewMutation.mutate({ cardId: card.id, rating });
    }
  };

  // Start a new session with the same deck
  const handleRestartSession = () => {
    setCurrentCardIndex(0);
    setCompletedSession(false);
    refetchDueCards();
  };

  // Loading state
  if (isDeckLoading || isCardsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Skeleton className="h-10 w-24 mr-2" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>

        <div className="max-w-lg mx-auto mb-8">
          <Skeleton className="h-64 md:h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Error state
  if (deckError || cardsError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {(deckError as Error)?.message || (cardsError as Error)?.message || "An error occurred loading review data"}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/">
            <Button>Return to Decks</Button>
          </Link>
        </div>
      </div>
    );
  }

  // No cards due for review
  if (dueCards && dueCards.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No cards due for review!
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {deck ? `All cards in "${deck.name}" are up to date` : "You're all caught up with your reviews"}
          </p>
          <Link href="/">
            <Button>Back to Decks</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Session completed
  if (completedSession) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Session complete! You've reviewed all {dueCards?.length} cards.
          </AlertDescription>
        </Alert>
        
        <div className="flex space-x-4 justify-center">
          <Button onClick={handleRestartSession}>
            Restart Session
          </Button>
          <Link href="/">
            <Button variant="outline">
              Back to Decks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Review session in progress
  const currentCard = dueCards ? dueCards[currentCardIndex] : null;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Review Flashcards</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {deck ? deck.name : "All Decks"} • {dueCards?.length} cards due
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link href="/">
            <Button variant="outline" className="mr-2">
              End Session
            </Button>
          </Link>
          {deck && (
            <Button variant="default">
              Edit Deck
            </Button>
          )}
        </div>
      </div>

      <div className="review-progress mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Session Progress</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentCardIndex + 1}/{dueCards?.length} Cards
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-primary h-2.5 rounded-full" 
            style={{ width: `${(currentCardIndex / (dueCards?.length || 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      {currentCard && (
        <FlashCard 
          front={currentCard.front}
          back={currentCard.back}
          onRating={handleCardRating}
        />
      )}
    </div>
  );
}
