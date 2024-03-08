import express from 'express';
import {
  getSoftwareOverview, getSoftwareFunction, getPerformance, getQuality,
} from '../service/softwareDetail.js';
import { errHandler } from './routerTool.js';

const router = express.Router();

router.get('/overview/:packageName', (req, res) => {
  const { packageName } = req.params;
  errHandler(getSoftwareOverview(packageName), res);
});

router.get('/function/:packageName', (req, res) => {
  const { packageName } = req.params;
  errHandler(getSoftwareFunction(packageName), res);
});

router.get('/performance/:packageName', (req, res) => {
  const { packageName } = req.params;
  errHandler(getPerformance(packageName), res);
});

router.get('/quality/:packageName', (req, res) => {
  const { packageName } = req.params;
  errHandler(getQuality(packageName), res);
});

export default router;
