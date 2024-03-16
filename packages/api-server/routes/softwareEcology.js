import express from 'express';
import { ok } from '../model/result.js';
import {
  exportBenchmarkExcel,
  exportScoreExcel,
  getSoftwareActivity,
  getSoftwareEcologyOverview,
} from '../service/softwareEcology.js';
import dayjs from 'dayjs';
import { appendSheet } from '../util/excel.js';

const router = express.Router();

/**
 * @swagger
 * /ecology/overview/{packageName}:
 *   get:
 *     summary: getSoftwareEcologyOverview
 *     parameters:
 *       - in: path
 *         name: packageName
 *         required: true
 *         example: "vuejs/vue"
 *     responses:
 *       '200':
 *         description: Successful response
 */
router.get('/ecology/overview/:repoName', async (req, res) => {
  const { repoName } = req.params;
  const softwareEcologyOverview = await getSoftwareEcologyOverview(repoName);
  res.json(ok(softwareEcologyOverview));
});

/**
 * @swagger
 * /ecology/activity/{packageName}:
 *   get:
 *     summary: getSoftwareActivity
 *     parameters:
 *       - in: path
 *         name: packageName
 *         required: true
 *         example: "vuejs/vue"
 *     responses:
 *       '200':
 *         description: Successful response
 */
router.get('/ecology/activity/:packageName', async (req, res) => {
  const { packageName } = req.params;
  const softwareActivity = await getSoftwareActivity(packageName);
  res.json(ok(softwareActivity));
});

/**
 * @swagger
 * /ecology/export/{repoName}:
 *   post:
 *     summary: export
 *     parameters:
 *       - in: path
 *         name: repoName
 *         required: true
 *         example: "vuejs/vue"
 *     requestBody:
 *       required: false
 *     responses:
 *       '200':
 *         description: Successful response
 */
router.post('/ecology/export/:repoName', async (req, res) => {
  const { repoName } = req.params;
  const scoreExcel = await exportScoreExcel(repoName);
  const benchmarkExcel = await exportBenchmarkExcel(repoName);
  let exportBuffer;

  if (!scoreExcel) {
    throw new Error(`no data for export excel,repo name :${repoName}`);
  }
  if (benchmarkExcel) {
    //   merge scoreExcel and benchmarkExcel into one excel
    exportBuffer = appendSheet(scoreExcel, benchmarkExcel);
  }
  res.setHeader('Content-disposition', 'attachment; filename=' + dayjs() + '.xlsx');
  res.setHeader(
    'Content-type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.write(exportBuffer, 'binary');
  res.end(null, 'binary');
});

export default router;
