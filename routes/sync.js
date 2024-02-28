import express from 'express';

import { syncProjectHandler } from '../controllers/sync.js';
import { getScorecardHandler, syncScorecardHandler } from '../controllers/scorecard.js';
import { syncOpendiggerHandler } from '../controllers/opendigger.js';
import { syncNoneScopedPackageDownloadCount, syncScopedPackageDownloadCount } from '../controllers/downloadCount.js';
import { syncPackageSizeHandler } from '../controllers/packageSize.js';
import { syncCompassActivityMetric } from '../controllers/compass.js';
import { syncStateOfJsData } from '../controllers/stateofjs.js';
import { syncStackOverFlowResultData } from '../controllers/stackoverflow.js';
import {
  observeProjectsByStar, syncProjectByStar, syncProjectByRepo, syncProjectByUserStar,
} from '../controllers/github.js';
import { bulkAddBenchmarkHandler, getPatchId, syncBenchmarkHandler } from '../controllers/benchmark.js';
import { getDelayedMessage } from '../controllers/common.js';

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
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/opendigger').post(syncOpendiggerHandler);

/**
 * @swagger
 * /sync/noneScopedPackageDownloadCount:
 *   post:
 *     summary: syncNoneScopedPackageDownloadCount
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
 *     responses:
 *       200:
 *         description: The created book.
 *
 */
router.route('/noneScopedPackageDownloadCount').post(syncNoneScopedPackageDownloadCount);

/**
 * @swagger
 * /sync/scopedPackageDownloadCount:
 *   post:
 *     summary: syncScopedPackageDownloadCount
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
 *     responses:
 *       200:
 *         description: The created book.
 *
 */
router.route('/scopedPackageDownloadCount').post(syncScopedPackageDownloadCount);

/**
 * @swagger
 * tags:
 *   name: Scorecard
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
 *               complementary:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/scorecard').post(syncScorecardHandler);

/**
 * @swagger
 * tags:
 *   name: Scorecard
 * /sync/scorecard/getScorecardTest:
 *   post:
 *     summary: 获取Scorecard单个数据
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/scorecard/getScorecardTest').post(getScorecardHandler);

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

/**
 * @swagger
 * /sync/stateofjs:
 *   post:
 *     summary: Synchronize state_of_js data
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               year:
 *                 type: string
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/stateofjs').post(syncStateOfJsData);

/**
 * @swagger
 * /sync/stackoverflow:
 *   post:
 *     summary: Synchronize stackoverflow result data
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               year:
 *                 type: string
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/stackoverflow').post(syncStackOverFlowResultData);

/**
 * @swagger
 * tags:
 *   name: Github
 * /sync/github/stars/observeprojects:
 *   post:
 *     summary: Watching front-end Github projects for a specified range of STARS
 *     tags: [Github]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: Array<number>
 *             example: [1000,1123]
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 */
router.route('/github/stars/observeprojects').post(observeProjectsByStar);

/**
 * @swagger
 * tags:
 *   name: Github
 * /sync/github/stars/projects:
 *   post:
 *     summary: Batch fetch front-end Github projects for a specified range of stats
 *     tags: [Github]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: Array<number>
 *             example: [1000,1123]
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 */
router.route('/github/stars/projects').post(syncProjectByStar);

/**
 * @swagger
 * tags:
 *   name: Github
 * /sync/github/repo/projects:
 *   post:
 *     summary: Batch fetch Github projects from specific repositories
 *     tags: [Github]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: Array<string>
 *             example: ["https://github.com/vuejs/core","https://github.com/vuejs/pinia"]
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 */
router.route('/github/repo/projects').post(syncProjectByRepo);

/**
 * @swagger
 * tags:
 *   name: Github
 * /sync/github/{userToken}/stars/projects:
 *   post:
 *     summary: Synchronize star items for specific users
 *     tags: [Github]
 *     parameters:
 *       - in: path
 *         name: userToken
 *         schema:
 *           type: string
 *           example: "ghp_xxxxxxxxxxxxxxxxxxxxxxxxx"
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 */
router.route('/github/:userToken/stars/projects').post(syncProjectByUserStar);

/**
 * @swagger
 * /sync/benchmark:
 *   post:
 *     summary: Synchronize benchmark data
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectName:
 *                 type: string
 *               benchmark:
 *                 type: string
 *               techStack:
 *                 type: string
 *               score:
 *                 type: integer
 *               content:
 *                 type: JSON
 *               patchId:
 *                 type: string
 *               platform:
 *                 type: string
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/benchmark').post(syncBenchmarkHandler);

/**
 * @swagger
 * /sync/benchmark/getPatchId:
 *   post:
 *     summary: Get data patch ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/benchmark/getPatchId').post(getPatchId);

/**
 * @swagger
 * /sync/benchmark/bulkCreate:
 *   post:
 *     summary: Synchronize benchmark data
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectName:
 *                 type: string
 *               techStack:
 *                 type: string
 *               list:
 *                 type: array
 *               platform:
 *                 type: string
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/benchmark/bulkCreate').post(bulkAddBenchmarkHandler);

/**
 * @swagger
 * /sync/benchmark/getDelayedMessage:
 *   post:
 *     summary: get data for an indicated delay
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               delay:
 *                 type: integer
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/benchmark/getDelayedMessage').post(getDelayedMessage);
export default router;
