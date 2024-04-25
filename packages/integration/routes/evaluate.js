import express from 'express';
import {
  calculateAllMetricsHandler,
  evaluateProjectHandler,
  evaluateBenchmark,
  setAllMedianAndP10,
} from '../controllers/evaluate.js';

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
 * /eval/project/{repoName}:
 *   get:
 *     summary: Evaluate single specified project
 *     parameters:
 *      - in: path
 *        name: repoName
 *        type: string
 *        required: true
 *        example: "vuejs/vue"
 *     tags: [Evaluate]
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/project/:repoName').get(evaluateProjectHandler);

/**
 * @swagger
 * tags:
 *   name: Evaluate
 * /eval/project/evaluateBenchmark:
 *   post:
 *     summary: Evaluate techStack performance
 *     tags: [Evaluate]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               techStack:
 *                 type: string
 *                 example: "前端框架"
 *               projectId:
 *                 type: string
 *                 example: null
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/project/evaluateBenchmark').post(evaluateBenchmark);

/**
 * @swagger
 * tags:
 *   name: Evaluate
 * /eval/setAllMedianAndP10:
 *   get:
 *     summary: Evaluate single specified project
 *     tags: [Evaluate]
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/setAllMedianAndP10').get(setAllMedianAndP10);

export default router;
