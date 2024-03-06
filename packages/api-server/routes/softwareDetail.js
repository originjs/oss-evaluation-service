import express from 'express';
import { getSoftwareOverview } from '../service/softwareDetail.js';
import Result from '../model/result.js';

const router = express.Router();

/**
 * software guide
 */
router.get('/guide/:packageName', async (req, res) => {
  const { packageName } = req.params;
  const softwareGuide = await getSoftwareOverview(packageName);
  res.json(Result.ok(softwareGuide));
});

export default router;
