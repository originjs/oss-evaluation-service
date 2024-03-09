import express from 'express';
import { ok } from '../model/result.js';
import { getSoftwareActivity, getSoftwareEcologyOverview } from '../service/softwareEcology.js';

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
router.get('/ecology/overview/:packageName', async (req, res) => {
  const { packageName } = req.params;
  const softwareEcologyOverview = await getSoftwareEcologyOverview(packageName);
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

export default router;
