import express from 'express';
const router = express.Router();
import { getMetricActivity } from '../controllers/compass.js';

/**
 * @swagger
 * tags:
 *   name: Compass
 *   description: 获取Compass数据
 * /compass:
 *   post:
 *     summary: 获取Compass数据
 *     tags: [Compass]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *     responses:
 *       200:
 *         description: The created book.
 *       500:
 *         description: Some server error
 *
 */
router.route('/compass').post(getMetricActivity);

export default router;
