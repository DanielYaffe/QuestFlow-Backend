import dotenv from 'dotenv';

dotenv.config();

export const config: IConfig = {
    DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/matala1',
    PORT: parseInt(process.env.PORT || '5000'),
    JWT_SECRET: process.env.JWT_SECRET  || 'secret',
    JWT_EXPIRES_IN: parseInt(process.env.JWT_EXPIRES_IN  || '36000'),
    REFRESH_TOKEN_EXPIRES_IN: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN  || '36000')
}
interface IConfig {
    DATABASE_URL: string;
    PORT: number;
    JWT_SECRET: string
    JWT_EXPIRES_IN: number
    REFRESH_TOKEN_EXPIRES_IN: number

}