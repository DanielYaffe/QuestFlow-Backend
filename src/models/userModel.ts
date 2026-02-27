import mongoose, { Document, Schema } from 'mongoose';



export interface IUser extends Document {
  email: string;
  password: string;
  refreshTokens: string[];
}

const userSchema = new Schema<IUser>({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    refreshTokens: {
        type: [String],
        default: [],
    },
});

const UserModel = mongoose.model<IUser>('User', userSchema);

export default UserModel;