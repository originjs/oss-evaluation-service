import express from 'express';

import { syncProjectHandler } from '../controllers/sync.js';
import { syncScorecardHandler } from '../controllers/scorecard.js';
import { syncOpendiggerHandler } from '../controllers/opendigger.js';
import { syncDownloadCount, syncWeekOfMonth } from '../controllers/downloadCount.js';
import { syncPackageSizeHandler } from '../controllers/packageSize.js';
import syncMetricActivity from '../controllers/compass.js';

const router = express.Router();

/**
 * @swagger
 * /sync/compass:
 *   post:
 *     summary: Synchronize Compass activity metric
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               repoUrl:
 *                 type: string
 *                 description: Passing a project URL like 'https://github.com/vuejs/router' indicates integration of a single project compass metric; otherwise, it represents full-scale compass activity metric integration.
 *                 example: ""
 *               beginDate:
 *                 type: string
 *                 description: begin date
 *                 example: "2023-12-25"
 *     responses:
 *       200:
 *         description: The created data.
 */
router.route('/compass').post(syncMetricActivity);

/**
 * @swagger
 * /sync/opendigger:
 *   post:
 *     summary: Synchronize Opendigger
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/opendigger').post(syncOpendiggerHandler);

/**
 * @swagger
 * /syncDownloadCount:
 *   post:
 *     summary: 获取downloadCount数据
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 example: "2017-01-01"
 *               projectId:
 *                 type: int
 *                 example: 1
 *     responses:
 *       200:
 *         description: The created book.
 *
 */
router.route('/npmdownloads').post(syncDownloadCount);

/**
 * @swagger
 * /sync/scorecard:
 *   post:
 *     summary: 获取Scorecard数据
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/scorecard').post(syncScorecardHandler);

/**
 * @swagger
 * /sync/packagesize:
 *   post:
 *     summary: Synchronize npm package size
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               version:
 *                 type: string
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/packagesize').post(syncPackageSizeHandler);

/**
 * @swagger
 * /sync/project/{projecId}:
 *   post:
 *     summary: Synchronize a single project
 *     parameters:
 *       - in: path
 *         name: projecId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/project/:projecId').post(syncProjectHandler);

export default router;
