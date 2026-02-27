import { Request, Response } from 'express';
import BaseController from './baseController';
import QuestlineModel from '../models/questlineModel';
import QuestNodeModel from '../models/questNodeModel';
import QuestEdgeModel from '../models/questEdgeModel';
import QuestlineVariantModel, { BASE_VARIANTS } from '../models/questlineVariantModel';
import CharacterModel from '../models/characterModel';
import ChapterModel from '../models/chapterModel';
import { AuthRequest } from '../middlewares/authMiddleware';

class QuestlineController extends BaseController {
  constructor() {
    super(QuestlineModel);
  }

  // GET /questlines — only return questlines owned by the authenticated user
  async get(req: AuthRequest, res: Response) {
    const userId = req.user?._id;
    try {
      const questlines = await QuestlineModel.find({ ownerId: userId });
      res.json(questlines);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // POST /questlines — set ownerId from JWT
  async create(req: AuthRequest, res: Response) {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    req.body.ownerId = userId;
    super.create(req, res);
  }

  // PUT /questlines/:id — only owner can update
  async put(req: AuthRequest, res: Response) {
    const userId = req.user?._id;
    try {
      const questline = await QuestlineModel.findById(req.params.id);
      if (!questline) {
        res.status(404).json({ error: 'Questline not found' });
        return;
      }
      if (questline.ownerId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      super.put(req, res);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // DELETE /questlines/:id — only owner can delete (also removes all child data)
  async delete(req: AuthRequest, res: Response) {
    const userId = req.user?._id;
    try {
      const questline = await QuestlineModel.findById(req.params.id);
      if (!questline) {
        res.status(404).json({ error: 'Questline not found' });
        return;
      }
      if (questline.ownerId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      const qid = req.params.id;
      await Promise.all([
        QuestNodeModel.deleteMany({ questlineId: qid }),
        QuestEdgeModel.deleteMany({ questlineId: qid }),
        QuestlineVariantModel.deleteMany({ questlineId: qid }),
        CharacterModel.deleteMany({ questlineId: qid }),
        ChapterModel.deleteMany({ questlineId: qid }),
      ]);
      await QuestlineModel.findByIdAndDelete(qid);
      return res.json({ message: 'Questline deleted' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // GET /questlines/:id/graph — returns nodes + edges for the builder
  async getGraph(req: AuthRequest, res: Response) {
    const qid = req.params.id;
    try {
      const [nodes, edges] = await Promise.all([
        QuestNodeModel.find({ questlineId: qid }),
        QuestEdgeModel.find({ questlineId: qid }),
      ]);

      // Derive nextNodeId from highest numeric nodeId
      const numericIds = nodes.map((n) => parseInt(n.nodeId, 10)).filter((n) => !isNaN(n));
      const nextNodeId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;

      // Shape nodes into the format React Flow expects
      const shapedNodes = nodes.map((n) => ({
        id: n.nodeId,
        type: n.type,
        data: { title: n.title, body: n.body, variant: n.variant },
      }));

      // Shape edges into the format React Flow expects
      const shapedEdges = edges.map((e) => ({
        id: e.edgeId,
        source: e.source,
        target: e.target,
      }));

      res.json({ nodes: shapedNodes, edges: shapedEdges, nextNodeId });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // PUT /questlines/:id/graph — replace all nodes + edges at once (full save)
  async saveGraph(req: AuthRequest, res: Response) {
    const userId = req.user?._id;
    const qid = req.params.id;
    try {
      const questline = await QuestlineModel.findById(qid);
      if (!questline) {
        res.status(404).json({ error: 'Questline not found' });
        return;
      }
      if (questline.ownerId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const { nodes, edges } = req.body as {
        nodes: { id: string; type?: string; data: { title: string; body: string; variant?: string } }[];
        edges: { id: string; source: string; target: string }[];
      };

      // Replace existing nodes and edges
      await Promise.all([
        QuestNodeModel.deleteMany({ questlineId: qid }),
        QuestEdgeModel.deleteMany({ questlineId: qid }),
      ]);

      if (nodes?.length) {
        await QuestNodeModel.insertMany(
          nodes.map((n) => ({
            questlineId: qid,
            nodeId: n.id,
            type: n.type ?? 'questNode',
            title: n.data.title,
            body: n.data.body,
            variant: n.data.variant ?? 'story',
          })),
        );
      }

      if (edges?.length) {
        await QuestEdgeModel.insertMany(
          edges.map((e) => ({
            questlineId: qid,
            edgeId: e.id,
            source: e.source,
            target: e.target,
          })),
        );
      }

      res.json({ message: 'Graph saved' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // GET /questlines/:id/variants — base variants + custom variants for this questline
  async getVariants(req: AuthRequest, res: Response) {
    const qid = req.params.id;
    try {
      const custom = await QuestlineVariantModel.find({ questlineId: qid });
      res.json({
        base: BASE_VARIANTS,
        custom: custom.map((v) => ({ id: v._id, name: v.name, color: v.color })),
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // POST /questlines/:id/variants — add a custom variant
  async createVariant(req: AuthRequest, res: Response) {
    const userId = req.user?._id;
    const qid = req.params.id;
    try {
      const questline = await QuestlineModel.findById(qid);
      if (!questline) {
        res.status(404).json({ error: 'Questline not found' });
        return;
      }
      if (questline.ownerId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      const variant = await QuestlineVariantModel.create({ questlineId: qid, ...req.body });
      res.status(201).json(variant);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // DELETE /questlines/:id/variants/:variantId — remove a custom variant
  async deleteVariant(req: AuthRequest, res: Response) {
    const userId = req.user?._id;
    const qid = req.params.id;
    try {
      const questline = await QuestlineModel.findById(qid);
      if (!questline) {
        res.status(404).json({ error: 'Questline not found' });
        return;
      }
      if (questline.ownerId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      const deleted = await QuestlineVariantModel.findByIdAndDelete(req.params.variantId);
      if (!deleted) {
        res.status(404).json({ error: 'Variant not found' });
        return;
      }
      res.json({ message: 'Variant deleted' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // GET /questlines/:id/characters
  async getCharacters(req: AuthRequest, res: Response) {
    try {
      const characters = await CharacterModel.find({ questlineId: req.params.id });
      res.json(characters);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // POST /questlines/:id/characters
  async createCharacter(req: AuthRequest, res: Response) {
    const userId = req.user?._id;
    const qid = req.params.id;
    try {
      const questline = await QuestlineModel.findById(qid);
      if (!questline) {
        res.status(404).json({ error: 'Questline not found' });
        return;
      }
      if (questline.ownerId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      const character = await CharacterModel.create({ questlineId: qid, ...req.body });
      res.status(201).json(character);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // PUT /questlines/:id/characters/:characterId
  async updateCharacter(req: AuthRequest, res: Response) {
    const userId = req.user?._id;
    const qid = req.params.id;
    try {
      const questline = await QuestlineModel.findById(qid);
      if (!questline) {
        res.status(404).json({ error: 'Questline not found' });
        return;
      }
      if (questline.ownerId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      const updated = await CharacterModel.findByIdAndUpdate(req.params.characterId, req.body, { new: true });
      if (!updated) {
        res.status(404).json({ error: 'Character not found' });
        return;
      }
      res.json(updated);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // DELETE /questlines/:id/characters/:characterId
  async deleteCharacter(req: AuthRequest, res: Response) {
    const userId = req.user?._id;
    const qid = req.params.id;
    try {
      const questline = await QuestlineModel.findById(qid);
      if (!questline) {
        res.status(404).json({ error: 'Questline not found' });
        return;
      }
      if (questline.ownerId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      const deleted = await CharacterModel.findByIdAndDelete(req.params.characterId);
      if (!deleted) {
        res.status(404).json({ error: 'Character not found' });
        return;
      }
      res.json({ message: 'Character deleted' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // GET /questlines/:id/chapters
  async getChapters(req: AuthRequest, res: Response) {
    try {
      const chapters = await ChapterModel.find({ questlineId: req.params.id });
      res.json(chapters);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // POST /questlines/:id/chapters
  async createChapter(req: AuthRequest, res: Response) {
    const userId = req.user?._id;
    const qid = req.params.id;
    try {
      const questline = await QuestlineModel.findById(qid);
      if (!questline) {
        res.status(404).json({ error: 'Questline not found' });
        return;
      }
      if (questline.ownerId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      const chapter = await ChapterModel.create({ questlineId: qid, ...req.body });
      res.status(201).json(chapter);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // PUT /questlines/:id/chapters/:chapterId
  async updateChapter(req: AuthRequest, res: Response) {
    const userId = req.user?._id;
    const qid = req.params.id;
    try {
      const questline = await QuestlineModel.findById(qid);
      if (!questline) {
        res.status(404).json({ error: 'Questline not found' });
        return;
      }
      if (questline.ownerId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      const updated = await ChapterModel.findByIdAndUpdate(req.params.chapterId, req.body, { new: true });
      if (!updated) {
        res.status(404).json({ error: 'Chapter not found' });
        return;
      }
      res.json(updated);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // DELETE /questlines/:id/chapters/:chapterId
  async deleteChapter(req: AuthRequest, res: Response) {
    const userId = req.user?._id;
    const qid = req.params.id;
    try {
      const questline = await QuestlineModel.findById(qid);
      if (!questline) {
        res.status(404).json({ error: 'Questline not found' });
        return;
      }
      if (questline.ownerId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      const deleted = await ChapterModel.findByIdAndDelete(req.params.chapterId);
      if (!deleted) {
        res.status(404).json({ error: 'Chapter not found' });
        return;
      }
      res.json({ message: 'Chapter deleted' });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // GET /questlines/:id/quests — returns node summaries (id, title, variant)
  async getQuestSummaries(req: AuthRequest, res: Response) {
    try {
      const nodes = await QuestNodeModel.find({ questlineId: req.params.id }, { nodeId: 1, title: 1, variant: 1 });
      res.json(nodes.map((n) => ({ id: n.nodeId, title: n.title, variant: n.variant })));
    } catch (error) {
      this.handleError(res, error);
    }
  }
}

export default new QuestlineController();
