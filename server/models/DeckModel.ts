import mongoose, { Schema, Document } from 'mongoose';

export interface IDeck extends Document {
  name: string;
  createdAt: Date;
}

const DeckSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model<IDeck>('Deck', DeckSchema);