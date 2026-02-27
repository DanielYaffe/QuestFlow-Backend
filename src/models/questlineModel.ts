import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Questline:
 *       type: object
 *       required:
 *         - title
 *         - ownerId
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         ownerId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export interface IQuestline extends Document {
  title: string;
  description: string;
  ownerId: string;
}

const QuestlineSchema = new Schema<IQuestline>(
  {
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    ownerId:     { type: String, required: true, index: true },
  },
  { timestamps: true },
);

const QuestlineModel = mongoose.model<IQuestline>('Questline', QuestlineSchema);
export default QuestlineModel;
