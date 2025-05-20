import mongoose, { Schema, Document } from 'mongoose';

export interface ICard extends Document {
  deckId: mongoose.Types.ObjectId;
  front: string;
  back: string;
  createdAt: Date;
  lastReviewed: Date | null;
  nextReview: Date | null;
  ease: number;
  interval: number;
  repetitions: number;
}

const CardSchema: Schema = new Schema({
  deckId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Deck',
    required: true 
  },
  front: { 
    type: String, 
    required: true 
  },
  back: { 
    type: String, 
    required: true 
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastReviewed: { 
    type: Date, 
    default: null 
  },
  nextReview: { 
    type: Date, 
    default: null 
  },
  ease: { 
    type: Number, 
    default: 250 
  },
  interval: { 
    type: Number, 
    default: 1 
  },
  repetitions: { 
    type: Number, 
    default: 0 
  }
});

export default mongoose.model<ICard>('Card', CardSchema);