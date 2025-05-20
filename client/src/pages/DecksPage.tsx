import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DeckCard } from "@/components/flashcard/DeckCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DeckWithStats } from "@shared/schema";

export default function DecksPage() {
  const { data: decks, isLoading, error } = useQuery<DeckWithStats[]>({
    queryKey: ["/api/decks"],
  });

  // Grid of deck skeletons for loading state
  const DeckSkeletons = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-5">
            <div className="flex items-center">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="ml-5 w-0 flex-1">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="mt-4">
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-16 mt-1" />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Flashcard Decks</h2>
        <Link href="/create">
          <Button className="inline-flex items-center">
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Deck
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <DeckSkeletons />
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-800 dark:text-red-200">
          Error loading decks: {(error as Error).message}
        </div>
      ) : decks && decks.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No flashcard decks yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first deck to get started</p>
          <Link href="/create">
            <Button>
              Create Your First Deck
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
