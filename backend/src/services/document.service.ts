import { DocumentModel } from '../models/document.model';
import { DocumentMetadata } from '../models/document.model';

export const createDocumentMetadata = async (
  file: Express.Multer.File,
): Promise<DocumentMetadata> => {
  const document = await DocumentModel.create({
    originalFilename: file.originalname,
    storedFilename: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    status: 'Pending',
  });

  return document;
};
