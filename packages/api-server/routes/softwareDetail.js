import express from 'express';
import {
  getSoftwareOverview, getSoftwareFunction, getPerformance, getQuality,
} from '../service/softwareDetail.js';
import Result from '../model/result.js';

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

function errHandler(promise, res) {
  promise.then((data) => {
    res.json(Result.ok(data));
  }).catch(() => {
    res.json(Result.fail(500, 'server error'));
  });
}

export default router;
