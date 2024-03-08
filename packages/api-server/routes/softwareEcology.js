import express from 'express';
import { ok } from '../model/result.js';
import { getSoftwareCompassActivity, getSoftwareMaturity } from '../service/softwareEcology.js';

const router = express.Router();

/**
 * @swagger
 * /ecology/maturity/{packageName}:
 *   get:
 *     summary: getSoftwareMaturity
 *     parameters:
 *       - in: path
 *         name: packageName
 *         required: true
 *         example: "vuejs/vue"
 *     responses:
 *       '200':
 *         description: Successful response
 */
router.get('/ecology/maturity/:packageName', async (req, res) => {
  const { packageName } = req.params;
  const softwareMaturity = await getSoftwareMaturity(packageName);
  res.json(ok(softwareMaturity));
});

/**
 * @swagger
 * /ecology/compassActivity/{packageName}:
 *   get:
 *     summary: getSoftwareCompassActivity
 *     parameters:
 *       - in: path
 *         name: packageName
 *         required: true
 *         example: "vuejs/vue"
 *     responses:
 *       '200':
 *         description: Successful response
 */
router.get('/ecology/compassActivity/:packageName', async (req, res) => {
  const { packageName } = req.params;
  const softwareCompassActivity = await getSoftwareCompassActivity(packageName);
  res.json(ok(softwareCompassActivity));
});

export default router;
