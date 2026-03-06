import { Router } from 'express';
import { generateSprite, getSprites, streamSpriteJob } from '../controllers/spriteController';

const spriteRouter = Router();

spriteRouter.get('/',                    getSprites);
spriteRouter.post('/generate',           generateSprite);
// SSE — auth handled by global middleware which accepts ?token= query param
spriteRouter.get('/jobs/:jobId/stream',  streamSpriteJob);

export default spriteRouter;
