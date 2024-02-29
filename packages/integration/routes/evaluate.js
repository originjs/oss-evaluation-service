import express from 'express';
import { calculateAllMetricsHandler, evaluateProjectHandler } from '../controllers/evaluate.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Evaluate
 * /eval/all:
 *   post:
 *     summary: Evaluate all projects
 *     tags: [Evaluate]
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/all').post(calculateAllMetricsHandler);

/**
 * @swagger
 * tags:
 *   name: Evaluate
 * /eval/{org}/{name}:
 *   get:
 *     summary: Evaluate single specified project
 *     parameters:
 *      - in: path
 *        name: org
 *        type: string
 *      - in: path
 *        name: name
 *        type: string
 *     tags: [Evaluate]
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/:org/:name').get(evaluateProjectHandler);

export default router;
