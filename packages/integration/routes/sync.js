import express from 'express';
import { syncAlternativeHandler, syncClassificationHandler } from '../controllers/alternative.js';
import {
  getScorecardHandler,
  syncScorecardHandler,
  syncScorecardSpecial,
  syncSingleProjectScorecardHandler,
} from '../controllers/scorecard.js';
import { syncOpendiggerHandler } from '../controllers/opendigger.js';
import {
  syncAllProjectPackageDownloadCountHandler,
  syncSingleProjectPackageDownloadCountHandler,
} from '../controllers/downloadCount.js';
import {
  syncPackageSizeHandler,
  syncSingleProjectPackageSizeHandler,
} from '../controllers/packageSize.js';
import { syncStateOfJsData } from '../controllers/stateofjs.js';
import { syncStackOverFlowResultData } from '../controllers/stackoverflow.js';
import {
  observeProjectsByStar,
  syncProjectByStar,
  syncProjectByRepo,
  syncProjectByUserStar,
  searchAndIntegrationGithubProjects,
  syncGithubProjectsDailyHandler,
  syncGithubProjectsWeeklyHandler,
} from '../controllers/project.js';
import {
  bulkAddBenchmarkHandler,
  getPatchId,
  importBenchmarkByExcelJSONHandler,
  importBenchmarkIndexByGetHandler,
  importBenchmarkValueByGetHandler,
  importBenchmarkVersionScoreByGetHandler,
  syncBenchmarkHandler,
  updateScore,
} from '../controllers/benchmark.js';
import getDelayedMessage from '../controllers/common.js';
import syncProjectCncfDocumentScoreHandler from '../controllers/documentScore.js';
import { refreshMainPackage } from '../controllers/refreshMainPackage.js';
import {
  syncAllProjectCodeSizeHandler,
  syncProjectCodeSizeByPIdsHandler,
} from '../controllers/projectCodeSize.js';
import {
  syncAllProjectDependenciesHandler,
  syncSingleProjectDependenciesHandler,
} from '../controllers/projectDependencies.js';
import {
  syncAllProjectStargazersTrendHandler,
  syncSingleProjectStargazersTrendHandler,
} from '../controllers/projectStarGazersTrend.js';
import {
  syncSingleProjectContributorsHandler,
  syncAllProjectContributorsHandler,
} from '../controllers/projectContributors.js';
import {
  syncSingleProjectHistoryHandler,
  syncAllProjectHistoryHandler,
} from '../controllers/projectHistory.js';
import {
  syncAllProjectDependentCountHandler,
  syncSingleProjectDependentCountHandler,
} from '../controllers/projectDependentCount.js';
import syncSingleProjectAllMetadataHandler, {
  syncBatchProjectAllMetadataByPIdsHandler,
  syncBatchProjectAllMetadataByRepoUrlsHandler,
  syncBatchProjectAllMetadataHandler,
} from '../controllers/syncAllMetadata.js';
import {
  syncSingleProjectCreatorsOrgHandler,
  syncAllProjectCreatorsOrgHandler,
} from '../controllers/ossinsightCreatorsOrg.js';
import {
  syncSingleProjectCreatorsCountriesHandler,
  syncAllProjectCreatorsCountriesHandler,
} from '../controllers/ossinsightCreatorsCountry.js';
import { syncCriticalityScoreHandler } from '../controllers/criticalitryScore.js';
import {
  storeSingleProjectTrendHandler,
  storeAllProjectTrendHandler,
} from '../controllers/trendHistory.js';
import { storeTrendRankHistoryHandler } from '../controllers/trendRankHistory.js';
import { syncProjectDescriptionHandler } from '../controllers/projectDescription.js';
import {
  syncSingleProjectReleaseHandler,
  syncAllProjectReleaseHandler,
} from '../controllers/projectRelease.js';
import { syncGitcodeOrgProjectsHandler } from '../controllers/gitcodeOrg.js';
import { syncOpenHarmonyCompatibilityHandler } from '../controllers/openharmonyVersion.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: SummaryMetadata
 * /sync/syncSingleProjectAllMetadata:
 *   post:
 *     summary: Batch fetch projects from specific repositories
 *     tags: [SummaryMetadata]
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
 *               category:
 *                 type: string
 *                 example: ""
 *               subcategory:
 *                 type: string
 *                 example: ""
 *               packageName:
 *                 type: string
 *                 example: ""
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Bad Request
 */
router.route('/syncSingleProjectAllMetadata').post(syncSingleProjectAllMetadataHandler);

/**
 * @swagger
 * tags:
 *   name: SummaryMetadata
 * /sync/syncBatchProjectAllMetadata:
 *   post:
 *     summary: Batch fetch projects from specific repositories
 *     tags: [SummaryMetadata]
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
 *               category:
 *                 type: string
 *                 example: ""
 *               subcategory:
 *                 type: string
 *                 example: ""
 *               packageName:
 *                 type: string
 *                 example: ""
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Bad Request
 */
router.route('/syncBatchProjectAllMetadata').post(syncBatchProjectAllMetadataHandler);

/**
 * @swagger
 * tags:
 *   name: SummaryMetadata
 * /sync/syncBatchProjectAllMetadataByPIds:
 *   post:
 *     summary: Batch fetch projects from specific repositories
 *     tags: [SummaryMetadata]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items: string
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Bad Request
 */
router.route('/syncBatchProjectAllMetadataByPIds').post(syncBatchProjectAllMetadataByPIdsHandler);

/**
 * @swagger
 * tags:
 *   name: SummaryMetadata
 * /sync/syncBatchProjectAllMetadataByRepoUrls:
 *   post:
 *     summary: Batch fetch projects from specific repositories
 *     tags: [SummaryMetadata]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items: number
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Bad Request
 */
router
  .route('/syncBatchProjectAllMetadataByRepoUrls')
  .post(syncBatchProjectAllMetadataByRepoUrlsHandler);

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
router.route('/CNCFDocumentScore').post(syncProjectCncfDocumentScoreHandler);


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
router.route('/opendigger').post(syncOpendiggerHandler);

/**
 * @swagger
 * /sync/alternative:
 *   post:
 *     summary: Synchronize Alternative from AI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               repoUrls:
 *                 type: Array<string>
 *                 example: ["https://github.com/vuejs/vue"]
 *               pIds:
 *                 type: Array<string>
 *                 example: ["1#137078487"]
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/alternative').post(syncAlternativeHandler);

/**
 * @swagger
 * /sync/projectDescription:
 *   post:
 *     summary: Synchronize Project Description from AI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               repoUrls:
 *                 type: Array<string>
 *                 example: ["https://github.com/vuejs/vue"]
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/projectDescription').post(syncProjectDescriptionHandler);

/**
 * @swagger
 * /sync/aiClassification:
 *   post:
 *     summary: AI 自动分类
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
 *               pIds:
 *                 type: Array<string>
 *                 example: ["1#137078487"]
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/aiClassification').post(syncClassificationHandler);

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
 *               pId:
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
 * /sync/scorecard/syncSingleProjectScorecard:
 *   post:
 *     summary: 获取Scorecard单个项目数据
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
router.route('/scorecard/syncSingleProjectScorecard').post(syncSingleProjectScorecardHandler);

/**
 * @swagger
 * tags:
 *   name: Scorecard
 * /sync/scorecardSpecial:
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
router.route('/scorecardSpecial').post(syncScorecardSpecial);

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
router.route('/scorecard/getScorecardTest').post(getScorecardHandler);

/**
 * @swagger
 * tags:
 *   name: Criticality Score
 * /sync/criticalityScore/syncAllCriticalityScore:
 *   post:
 *     summary: 根据github_project同步全量criticality_score数据，输入表名
 *     tags: [Scorecard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tableName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/criticalityScore/syncAllCriticalityScore').post(syncCriticalityScoreHandler);

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
router.route('/syncSingleProjectPackageSize/:repoUrl').get(syncSingleProjectPackageSizeHandler);

/**
 * @swagger
 * /sync/refreshProjectMainPackage:
 *   get:
 *     summary: refresh main package of project
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/refreshProjectMainPackage').get(refreshMainPackage);

/**
 * @swagger
 * tags:
 *   name: stateofjs
 * /sync/stateofjs:
 *   post:
 *     summary: Synchronize state_of_js data
 *     tags: [stateofjs]
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
 * tags:
 *   name: stackoverflow
 * /sync/stackoverflow:
 *   post:
 *     summary: Synchronize stackoverflow result data
 *     tags: [stackoverflow]
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
 *     summary: Watching front-end projects for a specified range of STARS
 *     tags: [Github]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 example: javascript
 *               starRange:
 *                 type: Array<number>
 *                 example: [1000,1123]
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
 *     summary: Batch fetch front-end projects for a specified range of stats
 *     tags: [Github]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 example: javascript
 *               starRange:
 *                 type: Array<number>
 *                 example: [1000,1123]
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
 *     summary: Batch fetch projects from specific repositories,
 *             dataType can be 1 or 2, 1 means source is software for progressiveness assessment; 2 means Source is similar software recommended by AI
 *     tags: [Github]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dataType:
 *                 type: interger
 *                 example: 1
 *               repoList:
 *                 type: Array<string>
 *                 example: ["https://github.com/vuejs/core","https://github.com/vuejs/pinia"]
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
 *               displayName:
 *                 type: string
 *                 example: "vue-pinia-v3.4.11 + 2.1.7-keyed"
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
 *               envInfo:
 *                 type: string
 *                 example: "The benchmark was run on a MacBook Pro 14 (16 GB RAM, 6/10 Cores, OSX 14.9), Chrome 123.0.6312.59 (arm64)"
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/benchmark').post(syncBenchmarkHandler);

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
router.route('/benchmark/getPatchId').post(getPatchId);

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
router.route('/benchmark/bulkCreate').post(bulkAddBenchmarkHandler);

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
router.route('/benchmark/getDelayedMessage').post(getDelayedMessage);

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
router.route('/benchmark/updateScore').post(updateScore);


/**
 * @swagger
 * /sync/syncProjectCodeSize:
 *   get:
 *     summary: refresh code size of project
 *     tags: [CodeLines]
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/syncProjectCodeSize').get(syncAllProjectCodeSizeHandler);

/**
 * @swagger
 * /sync/syncProjectCodeSizeByPIds:
 *   post:
 *     summary: refresh code size of pId
 *     tags: [CodeLines]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items: string
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/syncProjectCodeSizeByPIds').post(syncProjectCodeSizeByPIdsHandler);

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
router.route('/syncAllProjectStargazersTrendHandler').post(syncAllProjectStargazersTrendHandler);

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
router.route('/syncAllProjectContributors').get(syncAllProjectContributorsHandler);

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
router.route('/syncSingleProjectContributors/:repoUrl').get(syncSingleProjectContributorsHandler);

/**
 * @swagger
 * /sync/syncAllProjectHistory:
 *   get:
 *     summary: sync project information - contributors, stars
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/syncAllProjectHistory').get(syncAllProjectHistoryHandler);

/**
 * @swagger
 * /sync/syncSingleProjectHistory/{repoUrl}:
 *   get:
 *     summary: sync project information - contributors, stars
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
router.route('/syncSingleProjectHistory/:repoUrl').get(syncSingleProjectHistoryHandler);

/**
 * @swagger
 * /sync/syncAllProjectDependentCount:
 *   get:
 *     summary: refresh dependent count of project
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/syncAllProjectDependentCount').get(syncAllProjectDependentCountHandler);

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

/**
 * @swagger
 * /sync/syncProjectDependencies:
 *   get:
 *     summary: refresh dependencies of project
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/syncProjectDependencies').get(syncAllProjectDependenciesHandler);

/**
 * @swagger
 * /sync/syncSingleProjectDependencies/{repoUrl}:
 *   get:
 *     summary: refresh dependencies of project
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
router.route('/syncSingleProjectDependencies/:repoUrl').get(syncSingleProjectDependenciesHandler);

/**
 * @swagger
 * /sync/syncSingleProjectCreatorsOrg:
 *   post:
 *     summary: syncSingleProjectCreatorsOrg
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               repoUrl:
 *                  type: string
 *                  example: 'https://github.com/vuejs/core'
 *     responses:
 *       200:
 *         description: The created book.
 *
 */
router.route('/syncSingleProjectCreatorsOrg').post(syncSingleProjectCreatorsOrgHandler);

/**
 * @swagger
 * /sync/syncAllProjectCreatorsOrg:
 *   post:
 *     summary: syncAllProjectCreatorsOrg
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
 *               minId:
 *                  type: interger
 *                  example: 12345
 *               maxId:
 *                  type: interger
 *                  example: 12346
 *     responses:
 *       200:
 *         description: The created book.
 *
 */
router.route('/syncAllProjectCreatorsOrg').post(syncAllProjectCreatorsOrgHandler);

/**
 * @swagger
 * /sync/syncSingleProjectCreatorsCountries:
 *   post:
 *     summary: syncSingleProjectCreatorsCountries
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               repoUrl:
 *                  type: string
 *                  example: 'https://github.com/vuejs/core'
 *     responses:
 *       200:
 *         description: The created book.
 *
 */
router.route('/syncSingleProjectCreatorsCountries').post(syncSingleProjectCreatorsCountriesHandler);

/**
 * @swagger
 * /sync/syncAllProjectCreatorsCountries:
 *   post:
 *     summary: syncAllProjectCreatorsCountries
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
 *               minId:
 *                  type: interger
 *                  example: 12345
 *               maxId:
 *                  type: interger
 *                  example: 12346
 *     responses:
 *       200:
 *         description: The created book.
 *
 */
router.route('/syncAllProjectCreatorsCountries').post(syncAllProjectCreatorsCountriesHandler);

/**
 * @swagger
 * /sync/github/searchAndIntegrationGithubProjects:
 *   get:
 *     summary: get projects ranks
 *     tags: [Github]
 *     parameters:
 *       - in: query
 *         name: condition
 *         schema:
 *           type: string
 *           example: 'language:java+stars:5000..10000'
 *           required: true
 *       - in: query
 *         name: count
 *         required: true
 *         schema:
 *           type: number
 *           example: 100
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/github/searchAndIntegrationGithubProjects').get(searchAndIntegrationGithubProjects);

/**
 * @swagger
 * /sync/benchmark/importBenchmarkByExcelJSON:
 *   post:
 *     tags: [Benchmark]
 *     summary: import benchmark by excel
 *     description: import from excel json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               index:
 *                 type: array
 *               benchmark:
 *                 type: array
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Bad request
 */
router.route('/benchmark/importBenchmarkByExcelJSON').post(importBenchmarkByExcelJSONHandler);

/**
 * @swagger
 * /sync/benchmark/getBenchmarkValue:
 *   get:
 *     tags: [Benchmark]
 *     summary: import benchmark by excel
 *     description: import from excel json
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Bad request
 */
router.route('/benchmark/getBenchmarkValue').get(importBenchmarkValueByGetHandler);

/**
 * @swagger
 * /sync/benchmark/getBenchmarkVersionScore:
 *   get:
 *     tags: [Benchmark]
 *     summary: import benchmark version score
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Bad request
 */
router.route('/benchmark/getBenchmarkVersionScore').get(importBenchmarkVersionScoreByGetHandler);

/**
 * @swagger
 * /sync/benchmark/getBenchmarkIndex:
 *   get:
 *     tags: [Benchmark]
 *     summary: import benchmark by excel
 *     description: import from excel json
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Bad request
 */
router.route('/benchmark/getBenchmarkIndex').get(importBenchmarkIndexByGetHandler);

/**
 * @swagger
 * /sync/storeAllProjectTrend/{date}:
 *   get:
 *     summary: store trend history of project
 *     parameters:
 *      - in: path
 *        name: date
 *        type: string
 *        required: true
 *        example: "2024-01-01"
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/storeAllProjectTrend/:date').get(storeAllProjectTrendHandler);

/**
 * @swagger
 * /sync/storeSingleProjectTrend/{date}/{repoUrl}:
 *   get:
 *     summary: store trend history of project
 *     parameters:
 *      - in: path
 *        name: date
 *        type: string
 *        required: true
 *        example: "2024-01-01"
 *      - in: path
 *        name: repoUrl
 *        type: string
 *        required: true
 *        example: "https://github.com/vuejs/router"
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/storeSingleProjectTrend/:date/:repoUrl').get(storeSingleProjectTrendHandler);

/**
 * @swagger
 * /sync/storeTrendRankHistory:
 *   get:
 *     summary: store trend rank history
 *     parameters:
 *     - in: query
 *       name: dateType
 *       schema:
 *         type: number
 *         example: 2
 *         required: true
 *     - in: query
 *       name: date
 *       schema:
 *         type: string
 *         example: '2024-09-01'
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/storeTrendRankHistory').get(storeTrendRankHistoryHandler);

/**
 * @swagger
 * /sync/syncGithubProjectsDaily:
 *   get:
 *     summary: integration of github daily trends and oss trends
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/syncGithubProjectsDaily').get(syncGithubProjectsDailyHandler);

/**
 * @swagger
 * /sync/syncGithubProjectsWeekly:
 *   get:
 *     summary: integration of github weekly trends, github monthly trends and oss collection trends
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/syncGithubProjectsWeekly').get(syncGithubProjectsWeeklyHandler);

/**
 * @swagger
 * /sync/release/syncSingleProjectRelease:
 *   post:
 *     summary: sync latest stable release for a single project
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
 *               pId:
 *                 type: string
 *                 example: "1#137078487"
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/release/syncSingleProjectRelease').post(syncSingleProjectReleaseHandler);

/**
 * @swagger
 * /sync/release/syncAllProjectRelease:
 *   post:
 *     summary: batch sync latest stable release for all projects
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: number
 *                 example: 500
 *               offset:
 *                 type: number
 *                 example: 0
 *               onlyNull:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/release/syncAllProjectRelease').post(syncAllProjectReleaseHandler);

/**
 * @swagger
 * tags:
 *   name: GitCode
 * /sync/gitcode/org/projects:
 *   post:
 *     summary: 抓取 GitCode 组织（如 OpenHarmony）下的全部仓库并入库到 gitcode_projects_t
 *     tags: [GitCode]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               org:
 *                 type: string
 *                 description: 组织 path，默认 openharmony
 *                 example: "openharmony"
 *               perPage:
 *                 type: integer
 *                 description: 每页数量，默认 100
 *                 example: 100
 *               withDetail:
 *                 type: boolean
 *                 description: 是否调用单仓详情接口补充 license/clone_url 等字段（需要 GITCODE_TOKEN）
 *                 example: false
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Bad Request
 */
router.route('/gitcode/org/projects').post(syncGitcodeOrgProjectsHandler);

/**
 * @swagger
 * tags:
 *   name: GitCode
 * /sync/gitcode/openharmony/compatibility:
 *   post:
 *     summary: 解析 OpenHarmony 仓库 tags，收集所有 >= v6.0 的 release 大版本（格式 vX.Y-release），以 JSON 数组写回 gitcode_projects_t.openharmony_version
 *     tags: [GitCode]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               repoFullName:
 *                 type: string
 *                 description: 只处理单个仓库（owner/repo），用于测试，不传则按 limit/全量
 *                 example: "openharmony/arkui_ace_engine"
 *               limit:
 *                 type: integer
 *                 description: 最多处理多少个仓库，不传为全量
 *                 example: 20
 *               includePreRelease:
 *                 type: boolean
 *                 description: 是否纳入 Beta/RC 预发布版本，默认 false（只取 -Release）
 *                 example: false
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Bad Request
 */
router.route('/gitcode/openharmony/compatibility').post(syncOpenHarmonyCompatibilityHandler);

export default router;
