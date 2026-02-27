import PostModel from "../models/postModel";
import baseController from "./baseController";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Response } from "express";

class PostController extends baseController {
    constructor() {
        super(PostModel);
    }

    async create(req: AuthRequest, res: Response) {
        const userId = req.user?._id;
        if (!userId) {
            return;
        }
        req.body.sender = userId;
        super.create(req, res);
    }

    async put(req: AuthRequest, res: Response) {
        const id = req.params.id;
        const userId = req.user?._id;
        try {
            const post = await PostModel.findById(id);
            if (!post) {
                res.status(404).json({ error: "Post not found" });
                return;
            }
            if (post.sender !== userId) {
                res.status(403).json({ error: "Unauthorized" });
                return;
            }
            super.put(req, res);
        } catch (error) {
            this.handleError(res, error);
        }
    }
}

export default new PostController();