import express from 'express';
import { githubTop } from '../service/trendService.js';
import Page from '../model/page.js';
import { ok } from '../model/result.js';

const router = express.Router();

/**
 * @swagger
 * /trend/{type}:
 *   get:
 *     summary: get trend
 *     parameters:
 *       - in: path
 *         required: true
 *         name: type
 *         schema:
 *            type: string
 *            enum:
 *               - "star"
 *               - "fork"
 *
 *       - in: query
 *         required: true
 *         name: pageNo
 *         description: Number of items per page
 *         schema:
 *            type: integer
 *
 *       - in: query
 *         required: true
 *         name: pageSize
 *         description: Page number
 *         schema:
 *            type: integer
 *     responses:
 *       '200':
 *         description: Successful response
 */
router.get('/:type', async (req, res) => {
  const { type } = req.params;
  const { pageNo, pageSize } = req.query;
  const page = new Page(parseInt(pageNo, 10), parseInt(pageSize, 10));
  page.format();
  res.json(ok(await githubTop(page, type)));
});

export default router;
