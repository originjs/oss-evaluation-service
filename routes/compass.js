import express from 'express';
const router = express.Router();
import { getMetricActivity } from '../controllers/compass.js';


router.route('/integration/compass').get(getMetricActivity);

export default router;
