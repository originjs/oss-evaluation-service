import express from 'express';
import Result from '../model/result.js';
import { getSoftwareMaturity } from '../service/softwareEcology.js';

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
  res.json(Result.ok(softwareMaturity));
});

export default router;
