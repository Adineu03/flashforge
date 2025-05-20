import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  cardId: mongoose.Types.ObjectId;
  rating: number;
  reviewedAt: Date;
}

const ReviewSchema: Schema = new Schema({
  cardId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Card',
    required: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 4 
  },
  reviewedAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model<IReview>('Review', ReviewSchema);