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
    loginUser1 = await getLogedInUser(userData1,app);
    loginUser2 = await getLogedInUser(userData2,app);
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

describe("Post Tests", () => {

    let postId: string;

    test("Create Post - Success", async () => {
        const response = await request(app)
            .post("/posts")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                text: "Post for tests",
                image: "post.tests",
                sender: "Test Sender",
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.sender).toBe(loginUser1._id);
        postId = response.body._id;
    });

    test("Create Post - Fail (No Auth)", async () => {
        const response = await request(app).post("/posts").send({
            image: "Test Post",
            text: "Test text",
        });
        expect(response.statusCode).toBe(401);
    });

    test("Create Post - Fail (Validation Error)", async () => {
        const response = await request(app)
            .post("/posts")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                // Missing image and text
            });
        expect(response.statusCode).toBe(400);
    });


    test("Get All Posts", async () => {
        const response = await request(app).get("/posts").set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
    });

    test("Get Post By ID - Success", async () => {
        const response = await request(app).get("/posts/" + postId).set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(200);
    });

    test("Get Post By ID - Fail (Not Found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app).get("/posts/" + nonExistentId).set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(404);
    });

    test("Get Post By ID - Fail (Invalid ID Format)", async () => {
        const response = await request(app).get("/posts/invalid-id-123").set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(400); 
    });


    test("Update Post - Success", async () => {
        const response = await request(app)
            .put("/posts/" + postId)
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                image: "Updated image",
                text: "Updated text",
            });
        expect(response.statusCode).toBe(200);
        expect(response.body.image).toBe("Updated image");
    });

    test("Update Post - Fail (Not Owner)", async () => {
        const response = await request(app)
            .put("/posts/" + postId)
            .set("Authorization", "Bearer " + loginUser2.token)
            .send({
                image: "non owner image",
                text: "non owner text",
            });
        expect(response.statusCode).toBe(403);
    });

    test("Update Post - Fail (Not Found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .put("/posts/" + nonExistentId)
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                image: "Updated image",
            });
        expect(response.statusCode).toBe(404);
    });

    test("Update Post - Fail (Invalid ID Format)", async () => {
        const response = await request(app)
            .put("/posts/invalid-id")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({ image: "Updated image" });
        expect(response.statusCode).toBe(400);
    });
});