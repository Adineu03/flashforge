import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { DeckWithStats } from "@shared/schema";

interface StatsResponse {
  totalCards: number;
  masteredCards: number;
  learningCards: number;
  newCards: number;
  decks: DeckWithStats[];
}

// Helper to format date to a readable format (e.g. Today, Yesterday, or 3 days ago)
const formatDate = (dateString: string | null) => {
  if (!dateString) return "Never";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
};

export default function StatsPage() {
  const { data: stats, isLoading, error } = useQuery<StatsResponse>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-64 w-full rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-800 dark:text-red-200">
          Error loading statistics: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Statistics</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track your learning progress over time</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Learning Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <p className="text-sm font-medium text-primary dark:text-primary-400">Total Cards</p>
              <p className="mt-2 text-3xl font-bold text-primary-800 dark:text-primary-300">{stats?.totalCards || 0}</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Mastered</p>
              <p className="mt-2 text-3xl font-bold text-green-800 dark:text-green-300">{stats?.masteredCards || 0}</p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Learning</p>
              <p className="mt-2 text-3xl font-bold text-yellow-800 dark:text-yellow-300">{stats?.learningCards || 0}</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">New</p>
              <p className="mt-2 text-3xl font-bold text-red-800 dark:text-red-300">{stats?.newCards || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Daily Review Count</h3>
            <div className="h-64 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded">
              <p className="text-gray-500 dark:text-gray-400">This feature is coming soon!</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Retention Rate</h3>
            <div className="h-64 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded">
              <p className="text-gray-500 dark:text-gray-400">This feature is coming soon!</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Deck Performance</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deck Name</TableHead>
                  <TableHead>Cards</TableHead>
                  <TableHead>Mastery</TableHead>
                  <TableHead>Due Today</TableHead>
                  <TableHead>Last Studied</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.decks.map((deck) => (
                  <TableRow key={deck.id}>
                    <TableCell className="font-medium">{deck.name}</TableCell>
                    <TableCell>{deck.totalCards}</TableCell>
                    <TableCell>
                      {deck.totalCards > 0 
                        ? `${Math.round((deck.masteredCards / deck.totalCards) * 100)}%` 
                        : "0%"}
                    </TableCell>
                    <TableCell>{deck.dueToday}</TableCell>
                    <TableCell>{formatDate(deck.lastStudied)}</TableCell>
                  </TableRow>
                ))}
                {stats?.decks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">
                      No decks available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
