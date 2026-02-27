import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     QuestEdge:
 *       type: object
 *       required:
 *         - questlineId
 *         - edgeId
 *         - source
 *         - target
 *       properties:
 *         _id:
 *           type: string
 *         questlineId:
 *           type: string
 *         edgeId:
 *           type: string
 *           description: Client-side edge id (e.g. "e9001-9002")
 *         source:
 *           type: string
 *         target:
 *           type: string
 */

export interface IQuestEdge extends Document {
  questlineId: string;
  edgeId: string;
  source: string;
  target: string;
}

const QuestEdgeSchema = new Schema<IQuestEdge>({
  questlineId: { type: String, required: true, index: true },
  edgeId:      { type: String, required: true },
  source:      { type: String, required: true },
  target:      { type: String, required: true },
});

const QuestEdgeModel = mongoose.model<IQuestEdge>('QuestEdge', QuestEdgeSchema);
export default QuestEdgeModel;
