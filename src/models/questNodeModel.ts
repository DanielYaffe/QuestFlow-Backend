import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     QuestNode:
 *       type: object
 *       required:
 *         - questlineId
 *         - nodeId
 *         - title
 *         - body
 *       properties:
 *         _id:
 *           type: string
 *         questlineId:
 *           type: string
 *           description: Reference to the parent Questline _id
 *         nodeId:
 *           type: string
 *           description: Client-side node id used in the graph (e.g. "9001")
 *         type:
 *           type: string
 *           default: questNode
 *         title:
 *           type: string
 *         body:
 *           type: string
 *         variant:
 *           type: string
 *           description: Either a base variant or a custom variant id from QuestlineVariant
 */

export interface IQuestNode extends Document {
  questlineId: string;
  nodeId: string;     // client-side id used in the graph
  type: string;       // always 'questNode'
  title: string;
  body: string;
  variant: string;    // base variant name OR custom variant _id (string)
}

const QuestNodeSchema = new Schema<IQuestNode>({
  questlineId: { type: String, required: true, index: true },
  nodeId:      { type: String, required: true },
  type:        { type: String, default: 'questNode' },
  title:       { type: String, required: true },
  body:        { type: String, required: true },
  variant:     { type: String, default: 'story' },
});

const QuestNodeModel = mongoose.model<IQuestNode>('QuestNode', QuestNodeSchema);
export default QuestNodeModel;
