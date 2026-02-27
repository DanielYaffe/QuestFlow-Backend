import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     QuestlineVariant:
 *       type: object
 *       required:
 *         - questlineId
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *         questlineId:
 *           type: string
 *           description: Reference to the parent Questline _id
 *         name:
 *           type: string
 *           description: Display name for the variant (e.g. "boss", "puzzle")
 *         color:
 *           type: string
 *           description: Optional hex color for UI display
 */

export const BASE_VARIANTS = ['story', 'combat', 'dialogue', 'treasure'] as const;

export interface IQuestlineVariant extends Document {
  questlineId: string;
  name: string;
  color: string;
}

const QuestlineVariantSchema = new Schema<IQuestlineVariant>({
  questlineId: { type: String, required: true, index: true },
  name:        { type: String, required: true },
  color:       { type: String, default: '#6366f1' },
});

const QuestlineVariantModel = mongoose.model<IQuestlineVariant>('QuestlineVariant', QuestlineVariantSchema);
export default QuestlineVariantModel;
