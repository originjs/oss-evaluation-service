import express from 'express';
import {
  getSoftwareOverview,
  getSoftwareFunction,
  getPerformance,
  getQuality,
  getSoftwareInfo,
} from '../service/softwareDetailService.js';
import { ok } from '../model/result.js';

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
router.get('/overview/:repoName', async (req, res) => {
  const { repoName } = req.params;
  res.json(ok(await getSoftwareOverview(repoName)));
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
router.get('/function/:repoName', async (req, res) => {
  const { repoName } = req.params;
  res.json(ok(await getSoftwareFunction(repoName)));
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
 *         example: "web-infra-dev/rspack"
 *     responses:
 *       '200':
 *         description: Successful response
 */
router.get('/performance/:repoName', async (req, res) => {
  const { repoName } = req.params;
  res.json(ok(await getPerformance(repoName)));
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
router.get('/quality/:repoName', async (req, res) => {
  const { repoName } = req.params;
  res.json(ok(await getQuality(repoName)));
});

/**
 * @swagger
 * /softwareDetail/softwareInfo/{repoName}:
 *   get:
 *     summary: getSoftwareInfo
 *     parameters:
 *       - in: path
 *         name: repoName
 *         required: true
 *         example: "vuejs/core"
 *     responses:
 *       '200':
 *         description: Successful response
 */
router.get('/softwareInfo/:repoName', async (req, res) => {
  const { repoName } = req.params;
  res.json(ok(await getSoftwareInfo(repoName)));
});

export default router;
