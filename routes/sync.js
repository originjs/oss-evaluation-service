import express from 'express';
const router = express.Router();
import { syncOpendiggerHandler } from '../controllers/opendigger.js';
import { getMetricActivity } from '../controllers/compass.js';
import { syncProjectHandler } from '../controllers/sync.js';
import { syncDownloadCount} from '../controllers/downloadCount.js';

/**
 * @swagger
 * tags:
 *   name: Compass
 *   description: 获取Compass数据
 * /sync/compass:
 *   post:
 *     summary: 获取Compass数据
 *     tags: [Compass]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *     responses:
 *       200:
 *         description: The created data.
 *       500:
 *         description: Some server error
 *
 */
router.route('/sync/compass').post(getMetricActivity);

/**
 * @swagger
 * /sync/opendigger:
 *   post:
 *     summary: 获取Opendigger数据
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: The created data.
 */
router.route('/sync/opendigger').post(syncOpendiggerHandler);

/**
 * @swagger
 * /sync/{projecId}:
 *   post:
 *     summary: 同步单个项目数据
 *     parameters:
 *       - in: path
 *         name: projecId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: success.
 */
router.route('/sync/:projecId').post(syncProjectHandler);

/**
 * @swagger
 * /syncDownloadCount:
 *   post:
 *     summary: 获取downloadCount数据
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               start:
 *                 type: string
 *               end:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: The created book.
 *
 */
router.route('/syncDownloadCount').post(syncDownloadCount);

export default router;
