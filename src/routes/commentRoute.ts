import express from "express";
import commentController from "../controllers/commentController";

const commentRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: The Comments managing API
 */

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Returns the list of all the comments
 *     tags: [Comments]
 *     responses:
 *       200:
 *         description: The list of the comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
commentRouter.get("/", commentController.get.bind(commentController));

/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     summary: Get the comment by id
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment id
 *     responses:
 *       200:
 *         description: The comment description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: The comment was not found
 */
commentRouter.post("/", commentController.create.bind(commentController));
/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - content
 *               - sender
 *             properties:
 *               postId:
 *                 type: string
 *               content:
 *                 type: string
 *               sender:
 *                 type: string
 *     responses:
 *       201:
 *         description: The comment was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
commentRouter.get("/:id", commentController.getById.bind(commentController));
/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Update the comment by id
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: The comment was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not the owner)
 *       404:
 *         description: The comment was not found
 */
commentRouter.put("/:id", commentController.put.bind(commentController));

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Remove the comment by id
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment id
 *     responses:
 *       200:
 *         description: The comment was deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not the owner)
 *       404:
 *         description: The comment was not found
 */
commentRouter.delete("/:id", commentController.delete.bind(commentController));

export default commentRouter;
