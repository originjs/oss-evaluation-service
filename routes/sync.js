import express from 'express';
import { syncOpendiggerHandler } from '../controllers/opendigger.js';
import { getMetricActivity, syncMetricActivity } from '../controllers/compass.js';
import { syncProjectHandler } from '../controllers/sync.js';
import { syncDownloadCount, syncWeekOfMonth } from '../controllers/downloadCount.js';
import { syncScorecardHandler } from '../controllers/scorecard.js';
import { syncPackageSize, syncGitHubProjectPackageSize } from '../controllers/packageSize.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Compass
 * /sync/compass:
 *   post:
 *     summary: 获取Compass数据
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
 *     summary: 集成Compass数据
 *     tags: [Compass]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *     responses:
 *       200:
 *         description: The created data.
 */
router.route('/sync/compassSync').post(syncMetricActivity);

/**
 * @swagger
 * /sync/opendigger:
 *   post:
 *     summary: 获取Opendigger数据
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
 *         description: The created data.
 */
router.route('/sync/opendigger').post(syncOpendiggerHandler);

/**
 * @swagger
 * /sync/{projecId}:
 *   post:
 *     summary: 同步单个项目数据
 *     parameters:
 *       - in: path
 *         name: projecId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/sync/:projecId').post(syncProjectHandler);

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
router.route('/syncDownloadCount').post(syncDownloadCount);

/**
 * @swagger
 * /scorecard:
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
 *       400:
 *         description: Bad Request
 *
 */
router.route('/scorecard').post(syncScorecardHandler);

/**
 * @swagger
 * /syncPackagesize:
 *   post:
 *     summary: 获取单个项目包大小数据
 *     requestBody:
 *       required: true
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
 *         description: The created data.
 */
router.route('/syncPackagesize').post(syncPackageSize);

/**
 * @swagger
 * /syncGitHubProjectPackageSize:
 *   post:
 *     summary: 获取所有Github项目包大小数据
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: The created data.
 */
router.route('/syncGitHubProjectPackageSize').post(syncGitHubProjectPackageSize);

export default router;
