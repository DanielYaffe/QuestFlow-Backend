import { Response } from "express";
import baseController from "./baseController";
import PostModel from "../models/postModel";
import CommentModel from "../models/commentModel";
import { AuthRequest } from "../middlewares/authMiddleware";

class CommentController extends baseController {
    constructor() {
        super(CommentModel);
    }


    async delete(req: AuthRequest, res: Response) {
        const id = req.params.id;
        const userId = req.user?._id;
        try {
            const comment = await CommentModel.findById(id);
            if (!comment) {
                return res.status(404).json({ error: "Comment not found" });
            }
            if (comment.sender !== userId) {
                return res.status(403).json({ error: "Unauthorized" });
            }
            return super.delete(req, res);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async create(req: AuthRequest, res: Response) {
        const postId = req.body.postId;
        req.body.sender = req.user?._id;
        try {
            const post = await PostModel.findById(postId);
            if (!post) {
                res.status(404).json({ error: "Post not found" });
                return;
            }
            super.create(req, res);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async put(req: AuthRequest, res: Response) {
        const id = req.params.id;
        const userId = req.user?._id;
        try {
            const comment = await CommentModel.findById(id);
            if (!comment) {
                res.status(404).json({ error: "Comment not found" });
                return;
            }
            if (comment.sender !== userId) {
                res.status(403).json({ error: "Unauthorized" });
                return;
            }
            super.put(req, res);
        } catch (error) {
            this.handleError(res, error);
        }
    }

}


export default new CommentController();