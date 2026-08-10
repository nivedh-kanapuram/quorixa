import mongoose, { Document, Model, Schema } from 'mongoose';

export type DocumentStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed';

export interface DocumentMetadata extends Document {
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  status: DocumentStatus;
  title?: string;
  text?: string;
  pageCount?: number;
  metadata?: Record<string, unknown>;
  processingError?: string;
  processedAt?: Date;
}

const documentSchema = new Schema<DocumentMetadata, Model<DocumentMetadata>>(
  {
    originalFilename: { type: String, required: true },
    storedFilename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Failed'],
      default: 'Pending',
      required: true,
    },
    text: { type: String, default: '' },
    title: { type: String },
    pageCount: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    processingError: { type: String, default: '' },
    processedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const DocumentModel = mongoose.model<DocumentMetadata>(
  'Document',
  documentSchema
);
