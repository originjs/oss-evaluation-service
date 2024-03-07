import express from 'express';
import {
  getSoftwareOverview, getSoftwareFunction, getPerformance, getQuality,
} from '../service/softwareDetail.js';
import Result from '../model/result.js';

const router = express.Router();

router.get('/overview/:packageName', async (req, res) => {
  const { packageName } = req.params;
  const softwareGuide = await getSoftwareOverview(packageName);
  res.json(Result.ok(softwareGuide));
});

router.get('/function/:packageName', async (req, res) => {
  const { packageName } = req.params;
  const softwareFunction = await getSoftwareFunction(packageName);
  res.json(Result.ok(softwareFunction));
});

router.get('/performance/:packageName', async (req, res) => {
  const { packageName } = req.params;
  const performance = await getPerformance(packageName);
  res.json(Result.ok(performance));
});

router.get('/quality/:packageName', async (req, res) => {
  const { packageName } = req.params;
  getQuality(packageName).then((data) => {
    res.json(Result.ok(data));
  }).catch((err) => {
    res.json(Result.fail(500, err.message));
  });
  const quality = await getQuality(packageName);
  res.json(Result.ok(quality));
});

export default router;
