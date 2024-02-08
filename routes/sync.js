import express from 'express';

import { getMetricActivity, syncMetricActivity, syncSingleMetricActivity } from '../controllers/compass.js';
import { syncProjectHandler } from '../controllers/sync.js';
import { syncScorecardHandler } from '../controllers/scorecard.js';
import { syncOpendiggerHandler } from '../controllers/opendigger.js';
import { syncDownloadCount, syncWeekOfMonth } from '../controllers/downloadCount.js';
import {syncPackageSizeHandler} from "../controllers/packageSize.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Compass
 * /sync/compass:
 *   post:
 *     summary: get Compass metric
 *     tags: [Compass]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 example: "https://github.com/vuejs/vue"
 *               level:
 *                 type: string
 *                 example: "repo"
 *               beginDate:
 *                 type: string
 *                 example: null
 *               endDate:
 *                 type: string
 *                 example: null
 *     responses:
 *       200:
 *         description: The created data.
 */
router.route('/sync/compass').post(getMetricActivity);
/**
 * @swagger
 * tags:
 *   name: Compass
 * /sync/compassSync:
 *   post:
 *     summary: sync Compass metric
 *     tags: [Compass]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               beginDate:
 *                 type: string
 *                 example: "2023-12-25"
 *     responses:
 *       200:
 *         description: The created data.
 */
router.route('/sync/compassSync').post(syncMetricActivity);

/**
 * @swagger
 * tags:
 *   name: Compass
 * /sync/singleCompassSync:
 *   post:
 *     summary: sync single Compass metric
 *     tags: [Compass]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 example: "https://github.com/vuejs/router"
 *               beginDate:
 *                 type: string
 *                 example: "2023-12-28"
 *     responses:
 *       200:
 *         description: The created data.
 */
router.route('/sync/singleCompassSync').post(syncSingleMetricActivity);

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
 * /syncWeekOfMonth:
 *   post:
 *     summary: 获取week of month数据
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               start:
 *                 type: string
 *                 example: "2017-01-01"
 *               end:
 *                 example: "2037-12-31"
 *     responses:
 *       200:
 *         description: The created book.
 *
 */
router.route('/syncWeekOfMonth').post(syncWeekOfMonth);

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
