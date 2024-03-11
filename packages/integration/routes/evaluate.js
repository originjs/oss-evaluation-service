import express from 'express';
import {
  calculateAllMetricsHandler,
  evaluateProjectHandler, getScorecardScoreHandler, evaluateScoreById, setAllMedianAndP10,
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
 * /eval/project/{org}/{name}:
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
router.route('project/:org/:name').get(evaluateProjectHandler);

/**
 * @swagger
 * tags:
 *   name: Evaluate
 * /eval/singleScore/{projectId}/{isDesc}:
 *   get:
 *     summary: Evaluate single specified project
 *     parameters:
 *      - in: path
 *        name: projectId
 *        type: string
 *      - in: path
 *        name: isDesc
 *        type: boolean
 *     tags: [Evaluate]
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/singleScore/:projectId/:isDesc').get(getScorecardScoreHandler);

/**
 * @swagger
 * tags:
 *   name: Evaluate
 * /eval/evaluateScoreById/{projectId}:
 *   get:
 *     summary: Evaluate single specified project
 *     parameters:
 *      - in: path
 *        name: projectId
 *        type: string
 *     tags: [Evaluate]
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/evaluateScoreById/:projectId').get(evaluateScoreById);

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
