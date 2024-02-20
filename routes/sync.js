import express from 'express';

import { syncProjectHandler } from '../controllers/sync.js';
import { syncScorecardHandler } from '../controllers/scorecard.js';
import { syncOpendiggerHandler } from '../controllers/opendigger.js';
import { syncDownloadCount } from '../controllers/downloadCount.js';
import { syncPackageSizeHandler } from '../controllers/packageSize.js';
import { syncCompassActivityMetric } from '../controllers/compass.js';

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
 *               incremental:
 *                 type: bool
 *                 example: false
 *               startIndex:
 *                 type: int
 *                 example: 0
 *               sliceNumber:
 *                 type: int
 *                 example: 500
 *     responses:
 *       200:
 *         description: Compass activity metric synchronized
 */
router.route('/compass').post(syncCompassActivityMetric);

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
 * /sync/downloadCount:
 *   post:
 *     summary: syncDownloadCount
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 example: "2024-01-01"
 *               endDate:
 *                 type: string
 *                 example: "2024-02-17"
 *               startId:
 *                 type: int
 *                 example: 1
 *               endId:
 *                 type: int
 *                 example: 100
 *               isUpdate:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: The created book.
 *
 */
router.route('/downloadCount').post(syncDownloadCount);

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
