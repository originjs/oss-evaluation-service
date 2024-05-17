import express from 'express';

import { getScorecardHandler, syncScorecardHandler } from '../controllers/scorecard.js';
import { syncOpendiggerHandler } from '../controllers/opendigger.js';
import {
  syncAllProjectPackageDownloadCountHandler,
  syncSingleProjectPackageDownloadCountHandler,
} from '../controllers/downloadCount.js';
import {
  syncPackageSizeHandler,
  syncSingleProjectPackageSizeHandler,
} from '../controllers/packageSize.js';
import { syncProjectCompassMetricHandler } from '../controllers/compass.js';
import { syncStateOfJsData } from '../controllers/stateofjs.js';
import { syncStackOverFlowResultData } from '../controllers/stackoverflow.js';
import {
  observeProjectsByStar,
  syncProjectByStar,
  syncProjectByRepo,
  syncProjectByUserStar,
} from '../controllers/github.js';
import {
  bulkAddBenchmarkHandler,
  getPatchId,
  syncBenchmarkHandler,
  updateScore,
} from '../controllers/benchmark.js';
import getDelayedMessage from '../controllers/common.js';
import syncProjectCncfDocumentScoreHandler from '../controllers/documentScore.js';
import { refreshMainPackage } from '../controllers/refreshMainPackage.js';
import {
  collectSonarCloudData,
  createGitlabProject,
  createSonarProjectFromGitlab,
  updateDefaultBranchAfterImport,
  updateSonarCloudDefaultBranch,
  uploadSonarCiConfigToGitlab,
} from '../controllers/sonarCloud.js';
import syncSingleProjectCodeSizeHandler, {
  syncAllProjectCodeSizeHandler,
} from '../controllers/projectCodeSize.js';
import {
  syncAllProjectStargazersTrendHandler,
  syncSingleProjectStargazersTrendHandler,
} from '../controllers/projectStarGazersTrend.js';
import {
  syncSingleProjectContributorsHandler,
  syncAllProjectContributorsHandler,
} from '../controllers/projectContributors.js';
import {
  syncSingleProjectDependentCountHandler,
  syncAllProjectDependentCountHandler,
} from '../controllers/projectDependents.js';

const router = express.Router();

/**
 * @swagger
 * /sync/CNCFDocumentScore:
 *   post:
 *     summary: Synchronize CNCF Document Score(checks Readme, Changelog, Contributing, and Website)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               repoUrl:
 *                 type: string
 *                 example: ""
 *               startIndex:
 *                 type: int
 *                 example: 0
 *   responses:
 *       200:
 *         description: Compass activity metric synchronized
 */
router.route('/CNCFDocumentScore')
  .post(syncProjectCncfDocumentScoreHandler);

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
 *                 description: Passing a project URL like 'https://github.com/vuejs/router' indicates integration of
 *                              a single project compass metric; otherwise, it represents full-scale compass activity
 *                              metric integration.
 *                 example: ""
 *               beginDate:
 *                 type: string
 *                 description: begin date
 *                 example: "2023-12-25"
 *               startIndex:
 *                 type: int
 *                 example: 0
 *     responses:
 *       200:
 *         description: Compass activity metric synchronized
 */
router.route('/compass')
  .post(syncProjectCompassMetricHandler);

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
 *               repoUrl:
 *                 type: string
 *                 example: "https://github.com/vuejs/vue"
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/opendigger')
  .post(syncOpendiggerHandler);

/**
 * @swagger
 * /sync/syncAllProjectPackageDownloadCountHandler:
 *   post:
 *     summary: syncAllProjectPackageDownloadCountHandler
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
 *     responses:
 *       200:
 *         description: The created book.
 *
 */
router
  .route('/syncAllProjectPackageDownloadCountHandler')
  .post(syncAllProjectPackageDownloadCountHandler);

/**
 * @swagger
 * /sync/syncSingleProjectPackageDownloadCountHandler:
 *   post:
 *     summary: syncSingleProjectPackageDownloadCountHandler
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
 *               repoUrl:
 *                 type: string
 *                 example: "https://github.com/vuejs/core"
 *     responses:
 *       200:
 *         description: The created book.
 *
 */
router
  .route('/syncSingleProjectPackageDownloadCountHandler')
  .post(syncSingleProjectPackageDownloadCountHandler);

/**
 * @swagger
 * tags:
 *   name: Scorecard
 * /sync/scorecard:
 *   post:
 *     summary: 获取Scorecard数据
 *     tags: [Scorecard]
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
router.route('/scorecard')
  .post(syncScorecardHandler);

/**
 * @swagger
 * tags:
 *   name: Scorecard
 * /sync/scorecard/getScorecardTest:
 *   post:
 *     summary: 获取Scorecard单个数据
 *     tags: [Scorecard]
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
router.route('/scorecard/getScorecardTest')
  .post(getScorecardHandler);

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
router.route('/packagesize')
  .post(syncPackageSizeHandler);

/**
 * @swagger
 * /sync/syncSingleProjectPackageSize/{repoUrl}:
 *   get:
 *     summary: refresh package size of project
 *     parameters:
 *      - in: path
 *        name: repoUrl
 *        type: string
 *        required: true
 *        example: https://github.com/vuejs/core
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/syncSingleProjectPackageSize/:repoUrl')
  .get(syncSingleProjectPackageSizeHandler);

/**
 * @swagger
 * /sync/refreshProjectMainPackage:
 *   get:
 *     summary: refresh main package of project
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/refreshProjectMainPackage')
  .get(refreshMainPackage);

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
router.route('/stateofjs')
  .post(syncStateOfJsData);

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
router.route('/stackoverflow')
  .post(syncStackOverFlowResultData);

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
router.route('/github/stars/observeprojects')
  .post(observeProjectsByStar);

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
router.route('/github/stars/projects')
  .post(syncProjectByStar);

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
router.route('/github/repo/projects')
  .post(syncProjectByRepo);

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
router.route('/github/:userToken/stars/projects')
  .post(syncProjectByUserStar);

/**
 * @swagger
 * tags:
 *   name: Benchmark
 * /sync/benchmark:
 *   post:
 *     summary: Synchronize benchmark data
 *     tags: [Benchmark]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectName:
 *                 type: string
 *                 example: "vue"
 *               benchmark:
 *                 type: string
 *                 example: "speed"
 *               techStack:
 *                 type: string
 *                 example: "frontend"
 *               rawValue:
 *                 type: float
 *                 example: 1.9
 *               content:
 *                 type: json
 *                 example: {"speed": 0.6, "swap rows": 0.7}
 *               patchId:
 *                 type: string
 *                 example: "20240302142057596203"
 *               platform:
 *                 type: string
 *                 example: "windows"
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/benchmark')
  .post(syncBenchmarkHandler);

/**
 * @swagger
 * tags:
 *   name: Benchmark
 * /sync/benchmark/getPatchId:
 *   post:
 *     summary: Get data patch ID
 *     tags: [Benchmark]
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
router.route('/benchmark/getPatchId')
  .post(getPatchId);

/**
 * @swagger
 * tags:
 *   name: Benchmark
 * components:
 *  schemas:
 *    BenchmarkContent:
 *      type: object
 *      properties:
 *        benchmark:
 *          type: string
 *          example: "speed"
 *        content:
 *          type: json
 *          example: {"speed": 0.6, "swap column": 0.7}
 * /sync/benchmark/bulkCreate:
 *   post:
 *     summary: Synchronize benchmark data
 *     tags: [Benchmark]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectName:
 *                 type: string
 *                 example: "vue"
 *               techStack:
 *                 type: string
 *                 example: "frontend"
 *               patchId:
 *                 type: string
 *                 example: "20240302142057596203"
 *               list:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/BenchmarkContent'
 *               platform:
 *                 type: string
 *                 example: "windows"
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/benchmark/bulkCreate')
  .post(bulkAddBenchmarkHandler);

/**
 * @swagger
 * tags:
 *   name: Benchmark
 * /sync/benchmark/getDelayedMessage:
 *   post:
 *     summary: get data for an indicated delay
 *     tags: [Benchmark]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               delay:
 *                 type: integer
 *                 example: 3000
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/benchmark/getDelayedMessage')
  .post(getDelayedMessage);

/**
 * @swagger
 * tags:
 *   name: Benchmark
 * /sync/benchmark/updateScore:
 *   post:
 *     summary: get data for an indicated delay
 *     tags: [Benchmark]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               benchmark:
 *                 type: string
 *                 example: "speed"
 *               patchId:
 *                 type: array
 *                 items: string
 *                 example: ["20240302142057596203"]
 *               isDesc:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/benchmark/updateScore')
  .post(updateScore);

/**
 * @swagger
 * /sync/sonarCloud/collect:
 *   get:
 *     summary: collect sonarCloud data
 *     tags: [Sonar]
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/sonarCloud/collect')
  .get(await collectSonarCloudData);

/**
 * @swagger
 * /sync/gitlab/importProjectFromUrl:
 *  post:
 *     summary: import Github projects for github
 *     tags: [Gitlab]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *       example: [48296,298375]
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/gitlab/importProjectFromUrl')
  .post(await createGitlabProject);

/**
 * @swagger
 * /sync/gitlab/updateDefaultBranchAfterImport:
 *   get:
 *     summary: update gitlab default branch
 *     tags: [Gitlab]
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/gitlab/updateDefaultBranchAfterImport')
  .get(await updateDefaultBranchAfterImport);

/**
 * @swagger
 * /sync/sonarCloud/createSonarProjectFromGitlab:
 *   get:
 *     summary: create project data
 *     tags: [Sonar]
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/sonarCloud/createSonarProjectFromGitlab')
  .get(await createSonarProjectFromGitlab);

/**
 * @swagger
 * tags:
 *   name: gitlab
 * /sync/gitlab/addSonarCheckPipeline:
 *   get:
 *     summary: add sonar pipeline
 *     tags: [Gitlab]
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/gitlab/addSonarCheckPipeline')
  .get(await uploadSonarCiConfigToGitlab);

/**
 * @swagger
 * tags:
 *   name: sonarCloud
 * /sync/sonarCloud/updateDefaultBranch:
 *   get:
 *     summary: update default branch
 *     tags: [Sonar]
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/sonarCloud/updateDefaultBranch')
  .get(await updateSonarCloudDefaultBranch);

/**
 * @swagger
 * /sync/syncProjectCodeSize:
 *   get:
 *     summary: refresh code size of project
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/syncProjectCodeSize')
  .get(syncAllProjectCodeSizeHandler);

/**
 * @swagger
 * /sync/syncSingleProjectCodeSize/{repoUrl}:
 *   get:
 *     summary: refresh code size of project
 *     parameters:
 *      - in: path
 *        name: repoUrl
 *        type: string
 *        required: true
 *        example: https://github.com/vuejs/core
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/syncSingleProjectCodeSize/:repoUrl')
  .get(syncSingleProjectCodeSizeHandler);

/**
 * @swagger
 * /sync/syncAllProjectStargazersTrendHandler:
 *   post:
 *     summary: syncAllProjectStargazersTrendHandler
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                  type: string
 *                  example: '1024-04-01'
 *     responses:
 *       200:
 *         description: The created book.
 *
 */
router.route('/syncAllProjectStargazersTrendHandler')
  .post(syncAllProjectStargazersTrendHandler);

/**
 * @swagger
 * /sync/syncSingleProjectStargazersTrendHandler:
 *   post:
 *     summary: syncSingleProjectStargazersTrendHandler
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                  type: string
 *                  example: '1024-04-01'
 *               repoUrl:
 *                  type: string
 *                  example: 'https://github.com/vuejs/core'
 *     responses:
 *       200:
 *         description: The created book.
 *
 */
router
  .route('/syncSingleProjectStargazersTrendHandler')
  .post(syncSingleProjectStargazersTrendHandler);

/**
 * @swagger
 * /sync/syncAllProjectContributors:
 *   get:
 *     summary: refresh contributors of project
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/syncAllProjectContributors')
  .get(syncAllProjectContributorsHandler);

/**
 * @swagger
 * /sync/syncSingleProjectContributors/{repoUrl}:
 *   get:
 *     summary: refresh contributors of project
 *     parameters:
 *      - in: path
 *        name: repoUrl
 *        type: string
 *        required: true
 *        example: https://github.com/vuejs/router
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/syncSingleProjectContributors/:repoUrl')
  .get(syncSingleProjectContributorsHandler);

/**
 * @swagger
 * /sync/syncAllProjectDependentCount:
 *   get:
 *     summary: refresh dependent count of project
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/syncAllProjectDependentCount')
  .get(syncAllProjectDependentCountHandler);

/**
 * @swagger
 * /sync/syncSingleProjectDependentCount/{repoUrl}:
 *   get:
 *     summary: refresh dependent count of project
 *     parameters:
 *      - in: path
 *        name: repoUrl
 *        type: string
 *        required: true
 *        example: https://github.com/vuejs/router
 *     responses:
 *       200:
 *         description: success.
 */
router
  .route('/syncSingleProjectDependentCount/:repoUrl')
  .get(syncSingleProjectDependentCountHandler);

export default router;
