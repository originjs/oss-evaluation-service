import express from 'express';
import {
  syncProjectEvaluationHandler,
  evaluateBenchmarkHandler,
  setAllMedianAndP10,
  storeAllEvaluationHistoryHandler,
} from '../controllers/evaluate.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Evaluate
 * /eval:
 *   post:
 *     summary: Evaluate specified project or all projects
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               repoUrl:
 *                 type: string
 *                 example: "https://github.com/vuejs/vue"
 *     tags: [Evaluate]
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/').post(syncProjectEvaluationHandler);

/**
 * @swagger
 * tags:
 *   name: Evaluate
 * /eval/benchmark:
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
router.route('/benchmark').post(evaluateBenchmarkHandler);

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

/**
 * @swagger
 * tags:
 *   name: Evaluate
 * /eval/storeAllEvaluationHistroy:
 *   get:
 *     summary: Store current evaluation score for all projects
 *     tags: [Evaluate]
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/storeAllEvaluationHistroy').get(storeAllEvaluationHistoryHandler);

export default router;
