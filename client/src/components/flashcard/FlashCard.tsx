import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface FlashCardProps {
  front: string;
  back: string;
  onRating?: (rating: number) => void;
}

export function FlashCard({ front, back, onRating }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const handleRating = (rating: number) => {
    if (onRating) {
      onRating(rating);
      setFlipped(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mb-8">
      <div 
        className={`flashcard h-64 md:h-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg cursor-pointer border border-gray-200 dark:border-gray-700 relative ${flipped ? 'flipped' : ''}`}
        onClick={handleFlip}
      >
        <motion.div 
          className="front flex flex-col items-center justify-center h-full p-6 text-center"
          initial={false}
          animate={{ 
            rotateY: flipped ? 180 : 0, 
            opacity: flipped ? 0 : 1
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{front}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Click to reveal answer</p>
        </motion.div>
        <motion.div 
          className="back flex flex-col items-center justify-center h-full p-6 text-center"
          initial={{ rotateY: 180, opacity: 0 }}
          animate={{ 
            rotateY: flipped ? 0 : 180, 
            opacity: flipped ? 1 : 0
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Answer:</h3>
          <p className="text-gray-700 dark:text-gray-300">{back}</p>
        </motion.div>
      </div>

      {onRating && flipped && (
        <div className="max-w-lg mx-auto">
          <div className="flex justify-center space-x-4">
            <Button 
              variant="destructive" 
              className="flex-1" 
              onClick={() => handleRating(1)}
            >
              Again
              <span className="ml-1 text-xs">(&lt;1d)</span>
            </Button>
            <Button 
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white" 
              onClick={() => handleRating(2)}
            >
              Hard
              <span className="ml-1 text-xs">(3d)</span>
            </Button>
            <Button 
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" 
              onClick={() => handleRating(3)}
            >
              Good
              <span className="ml-1 text-xs">(7d)</span>
            </Button>
            <Button 
              className="flex-1 bg-green-500 hover:bg-green-600 text-white" 
              onClick={() => handleRating(4)}
            >
              Easy
              <span className="ml-1 text-xs">(14d)</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
