import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import { Express } from "express";
import userModel from "../models/userModel";
import commentModel from "../models/commentModel";
import postModel from "../models/postModel";
import {describe, expect, test, beforeAll, afterAll} from '@jest/globals';
import { getLogedInUser, UserData, userData1, userData2 } from "./utils";

let app: Express;
let loginUser1: UserData;
let loginUser2: UserData;
let postId: string;

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();
    await postModel.deleteMany();
    await commentModel.deleteMany();
    loginUser1 = await getLogedInUser(userData1,app);
    loginUser2 = await getLogedInUser(userData2,app);

});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

describe("Comment Tests", () => {

    test("Post Setup: Create Test Post", async () => {
        const response = await request(app)
            .post("/posts")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                text: "Post for Comments",
                image: "comment.tests",
                sender: "Test Sender",
            });
        expect(response.statusCode).toBe(201);
        postId = response.body._id;        
    });


    let commentId: string;

    test("Create Comment - Success", async () => {
        const response = await request(app)
            .post("/comments")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                postId: postId,
                content: "Test",
                sender: "bob"
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.sender).toBe(loginUser1._id);
        expect(response.body.postId).toBe(postId);
        commentId = response.body._id;
    });

    test("Create Comment - Fail (No Auth)", async () => {
        const response = await request(app).post("/comments").send({
            postId: postId,
            content: "Test",
        });
        expect(response.statusCode).toBe(401);
    });

    test("Create Comment - Fail (Post Not Found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .post("/comments")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                postId: nonExistentId,
                content: "Test",
            });
        expect(response.statusCode).toBe(404);
    });

    test("Create Comment - Fail (Invalid Post ID)", async () => {
        const response = await request(app)
            .post("/comments")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                postId: "invalid-id",
                content: "Test",
            });
        expect(response.statusCode).toBe(400);
    });


    test("Get All Comments", async () => {
        const response = await request(app).get("/comments").set("Authorization", "Bearer " + loginUser1.token);
    
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
    });

    test("Get Comment By ID - Success", async () => {
        const response = await request(app).get("/comments/" + commentId).set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(200);
        expect(response.body._id).toBe(commentId);
    });

    test("Get Comment By ID - Fail (Invalid ID)", async () => {
        const response = await request(app).get("/comments/invalid-id").set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(400);
    });


    test("Update Comment - Success", async () => {
        const response = await request(app)
            .put("/comments/" + commentId)
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                content: "Bob The builder",
            });
        expect(response.statusCode).toBe(200);
        expect(response.body.content).toBe("Bob The builder");
    });

    test("Update Comment - Fail (Not Owner)", async () => {
        const response = await request(app)
            .put("/comments/" + commentId)
            .set("Authorization", "Bearer " + loginUser2.token)
            .send({
                content: "Hacked Comment",
            });
        expect(response.statusCode).toBe(403);
    });

    test("Update Comment - Fail (Not Found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .put("/comments/" + nonExistentId)
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                content: "Fail comment",
            });
        expect(response.statusCode).toBe(404);
    });

    test("Update Comment - Fail (Invalid ID)", async () => {
        const response = await request(app)
            .put("/comments/invalid-id")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({ content: "Update" });
        expect(response.statusCode).toBe(400);
    });


    test("Delete Comment - Fail (Not Owner)", async () => {
        const response = await request(app)
            .delete("/comments/" + commentId)
            .set("Authorization", "Bearer " + loginUser2.token);
        expect(response.statusCode).toBe(403);
    });

    test("Delete Comment - Fail (Invalid ID)", async () => {
        const response = await request(app)
            .delete("/comments/invalid-id")
            .set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(400);
    });

    test("Delete Comment - Success", async () => {
        const response = await request(app)
            .delete("/comments/" + commentId)
            .set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(200);
    });

    test("Delete Comment - Fail (Not Found)", async () => {
        const response = await request(app)
            .delete("/comments/" + commentId)
            .set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(404);
    });
});

