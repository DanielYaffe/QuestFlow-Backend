import UserModel from "../models/userModel";
import BaseController from "./baseController";

class UserController extends BaseController {
    constructor() {
        super(UserModel);
    }
}

export default new UserController();