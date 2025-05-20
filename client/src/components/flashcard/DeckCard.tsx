import { Link } from "wouter";
import type { DeckWithStats } from "@shared/schema";

interface DeckCardProps {
  deck: DeckWithStats;
}

export function DeckCard({ deck }: DeckCardProps) {
  const masteryPercentage = deck.totalCards > 0 
    ? Math.round((deck.masteredCards / deck.totalCards) * 100) 
    : 0;
  
  // Helper to format the created date to "X days ago"
  const formatCreatedDate = (dateString: string) => {
    const createdDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900 rounded-md p-3">
            <svg className="h-6 w-6 text-primary dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{deck.name}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {deck.totalCards} cards • Created {formatCreatedDate(deck.createdAt)}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="bg-gray-200 dark:bg-gray-700 w-full h-2 rounded-full overflow-hidden">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${masteryPercentage}%` }}
            ></div>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{masteryPercentage}% Mastered</p>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
        <Link 
          to={`/review/${deck.id}`} 
          className="text-sm font-medium text-primary hover:text-primary-focus dark:text-primary-400 dark:hover:text-primary-300"
        >
          Review Deck
        </Link>
        <button 
          type="button" 
          className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
