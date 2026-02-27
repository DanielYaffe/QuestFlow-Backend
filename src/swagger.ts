import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/config';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'assignment 2 API ',
            version: '1.0.0',
            description: 'API for managing Users, Posts, and Comments with authentication',
            contact: {
                name: 'Shoval King & Daniel',
            },
        },
        servers: [
            {
                url: `http://localhost:${config.PORT || 3000}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        _id: { type: 'string', example: '697a92d4725f95ca20e1300c' },
                        email: { type: 'string', example: 'shovalking@gmail.com' },
                        password: { type: 'string', example: '123456' },
                        refreshTokens: { type: 'array', items: { type: 'string' } },
                    },
                },
                Post: {
                    type: 'object',
                    required: ['title', 'content', 'sender'],
                    properties: {
                        _id: { type: 'string', example: '697a65f59de97b4c60af618d' },
                        text: { type: 'string', example: 'safdsafd First Post' },
                        image: { type: 'string', example: 'shoval.jpg' },
                        sender: { type: 'string', example: '697a65f59de97b4c60af618d' },
                    },
                },
                Comment: {
                    type: 'object',
                    required: ['postId', 'message', 'sender'],
                    properties: {
                        _id: { type: 'string', example: '697a9cd91b8ac38b2cde5352' },
                        postId: { type: 'string', example: '697a65f59de97b4c60af618d60d0fe4f5311236168a109cb' },
                        content: { type: 'string', example: 'Shoval post! :)' },
                        sender: { type: 'string', example: '697a92d4725f95ca20e1300c' },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };