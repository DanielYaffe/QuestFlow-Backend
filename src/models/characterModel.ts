import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Character:
 *       type: object
 *       required:
 *         - questlineId
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *         questlineId:
 *           type: string
 *         name:
 *           type: string
 *         appearance:
 *           type: string
 *         background:
 *           type: string
 *         imageUrl:
 *           type: string
 *         questIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Node ids (client-side) this character appears in
 */

export interface ICharacter extends Document {
  questlineId: string;
  name: string;
  appearance: string;
  background: string;
  imageUrl: string;
  questIds: string[];
}

const CharacterSchema = new Schema<ICharacter>({
  questlineId: { type: String, required: true, index: true },
  name:        { type: String, required: true },
  appearance:  { type: String, default: '' },
  background:  { type: String, default: '' },
  imageUrl:    { type: String, default: '' },
  questIds:    { type: [String], default: [] },
});

const CharacterModel = mongoose.model<ICharacter>('Character', CharacterSchema);
export default CharacterModel;
