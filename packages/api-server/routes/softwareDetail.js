import express from 'express';
import {
  getSoftwareOverview, getSoftwareFunction, getPerformance, getQuality,
} from '../service/softwareDetailService.js';
import { errHandler } from './routerTool.js';

const router = express.Router();

/**
 * @swagger
 * /softwareDetail/overview/{repoName}:
 *   get:
 *     summary: getSoftwareOverview
 *     parameters:
 *       - in: path
 *         name: repoName
 *         required: true
 *         example: "vuejs/core"
 *     responses:
 *       '200':
 *         description: Successful response
 */
router.get('/overview/:repoName', (req, res) => {
  const { repoName } = req.params;
  errHandler(getSoftwareOverview(repoName), res);
});

/**
 * @swagger
 * /softwareDetail/function/{repoName}:
 *   get:
 *     summary: getSoftwareFunction
 *     parameters:
 *       - in: path
 *         name: repoName
 *         required: true
 *         example: "vuejs/vue"
 *     responses:
 *       '200':
 *         description: Successful response
 */
router.get('/function/:repoName', (req, res) => {
  const { repoName } = req.params;
  errHandler(getSoftwareFunction(repoName), res);
});

/**
 * @swagger
 * /softwareDetail/performance/{repoName}:
 *   get:
 *     summary: getPerformance
 *     parameters:
 *       - in: path
 *         name: repoName
 *         required: true
 *         example: "vuejs/core"
 *     responses:
 *       '200':
 *         description: Successful response
 */
router.get('/performance/:repoName', (req, res) => {
  const { repoName } = req.params;
  errHandler(getPerformance(repoName), res);
});

/**
 * @swagger
 * /softwareDetail/quality/{repoName}:
 *   get:
 *     summary: getQuality
 *     parameters:
 *       - in: path
 *         name: repoName
 *         required: true
 *         example: "vuejs/core"
 *     responses:
 *       '200':
 *         description: Successful response
 */
router.get('/quality/:repoName', (req, res) => {
  const { repoName } = req.params;
  errHandler(getQuality(repoName), res);
});

export default router;
