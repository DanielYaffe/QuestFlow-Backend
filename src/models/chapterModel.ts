import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Chapter:
 *       type: object
 *       required:
 *         - questlineId
 *         - title
 *       properties:
 *         _id:
 *           type: string
 *         questlineId:
 *           type: string
 *         title:
 *           type: string
 *         scenes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               title:
 *                 type: string
 */

export interface IScene {
  id: string;
  title: string;
}

export interface IChapter extends Document {
  questlineId: string;
  title: string;
  scenes: IScene[];
}

const SceneSchema = new Schema<IScene>(
  {
    id:    { type: String, required: true },
    title: { type: String, required: true },
  },
  { _id: false },
);

const ChapterSchema = new Schema<IChapter>({
  questlineId: { type: String, required: true, index: true },
  title:       { type: String, required: true },
  scenes:      { type: [SceneSchema], default: [] },
});

const ChapterModel = mongoose.model<IChapter>('Chapter', ChapterSchema);
export default ChapterModel;
