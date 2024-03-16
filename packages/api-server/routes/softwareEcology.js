import express from 'express';
import { fail, ok } from '../model/result.js';
import {
  exportExcel,
  getSoftwareActivity,
  getSoftwareEcologyOverview,
} from '../service/softwareEcology.js';
import dayjs from 'dayjs';

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
 * /ecology/export/{packageName}:
 *   post:
 *     summary: export
 *     parameters:
 *       - in: path
 *         name: packageName
 *         required: true
 *         example: "vuejs/vue"
 *     requestBody:
 *       required: false
 *     responses:
 *       '200':
 *         description: Successful response
 */
router.post('/ecology/export/:packageName', async (req, res) => {
  const { packageName } = req.params;
  const buffer = await exportExcel(packageName);
  if (buffer === null) {
    res.json(fail(500, 'export error!'));
  }
  res.setHeader('Content-disposition', 'attachment; filename=' + dayjs() + '.xlsx');
  res.setHeader(
    'Content-type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.write(buffer, 'binary');
  res.end(null, 'binary');
});

export default router;
