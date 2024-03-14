import express from 'express';
import debug from 'debug';
import { fail, ok } from '../model/result.js';
import {
  exportExcel,
  getSoftwareActivity,
  getSoftwareEcologyOverview,
} from '../service/softwareEcology.js';

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
  const path = await exportExcel(packageName);
  if (path === '') {
    res.json(fail(500, 'export error!'));
  }
  res.download(path, 'evaluation.xlsx', (err) => {
    debug.log(err);
  });
});

export default router;
