
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
const testUser = {
    email: "testuser@example.com",
    password: "password123",
};
let loginUser: UserData;
let userId: string;

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();
    const user = await userModel.create(testUser);
    loginUser = await getLogedInUser(userData1,app);
    
    userId = user._id.toString();
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

describe("User Routes Tests", () => {
    test("Get All Users", async () => {
        const response = await request(app).get("/users").set("Authorization", "Bearer " + loginUser.token);
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].email).toBe(testUser.email);
    });

    test("Get User By ID - Success", async () => {
        const response = await request(app).get(`/users/${userId}`).set("Authorization", "Bearer " + loginUser.token);
        expect(response.statusCode).toBe(200);
        expect(response.body.email).toBe(testUser.email);
        expect(response.body._id).toBe(userId);
    });

    test("Get User By ID - Fail (Invalid ID)", async () => {
        const response = await request(app).get("/users/invalid-id-format").set("Authorization", "Bearer " + loginUser.token);
        expect(response.statusCode).toBe(400);
    });

    test("Get User By ID - Fail (Not Found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app).get(`/users/${nonExistentId}`).set("Authorization", "Bearer " + loginUser.token);
        expect(response.statusCode).toBe(404);
    });

    test("Delete User - Fail (Invalid ID)", async () => {
        const response = await request(app).delete("/users/invalid-id").set("Authorization", "Bearer " + loginUser.token);
        expect(response.statusCode).toBe(400);
    });

    test("Delete User - Fail (Not Found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app).delete(`/users/${nonExistentId}`).set("Authorization", "Bearer " + loginUser.token);
        expect(response.statusCode).toBe(404);
    });

    test("Delete User - Success", async () => {
        const response = await request(app).delete(`/users/${userId}`).set("Authorization", "Bearer " + loginUser.token);
        expect(response.statusCode).toBe(200);

        const check = await userModel.findById(userId);
        expect(check).toBeNull();
    });
});