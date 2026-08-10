import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ChunkDocument extends Document {
  documentId: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  createdAt: Date;
}

const chunkSchema = new Schema<ChunkDocument, Model<ChunkDocument>>(
  {
    documentId: { type: String, required: true, index: true },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: false,
  }
);

chunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });

export const ChunkModel = mongoose.model<ChunkDocument>('Chunk', chunkSchema);
