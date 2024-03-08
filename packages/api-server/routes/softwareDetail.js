import express from 'express';
import {
  getSoftwareOverview, getSoftwareFunction, getPerformance, getQuality,
} from '../service/softwareDetailService.js';
import { errHandler } from './routerTool.js';

const router = express.Router();

router.get('/overview/:repoName', (req, res) => {
  const { repoName } = req.params;
  errHandler(getSoftwareOverview(repoName), res);
});

router.get('/function/:repoName', (req, res) => {
  const { repoName } = req.params;
  errHandler(getSoftwareFunction(repoName), res);
});

router.get('/performance/:repoName', (req, res) => {
  const { repoName } = req.params;
  errHandler(getPerformance(repoName), res);
});

router.get('/quality/:repoName', (req, res) => {
  const { repoName } = req.params;
  errHandler(getQuality(repoName), res);
});

export default router;
