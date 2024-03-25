import express from 'express';
import { search } from '../service/homeService.js';
import { ok } from '../model/result.js';

const router = express.Router();

/**
 * @swagger
 * /home/search:
 *   get:
 *     summary: search
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         example: "rsbuild"
 *       - in: query
 *         name: techStack
 *         required: false
 *         example: "构建工具"
 *     responses:
 *       '200':
 *         description: Successful response
 */
router.get('/search', async (req, res) => {
  const { keyword } = req.query;
  const { techStack } = req.query;
  const data = await search(keyword, techStack);
  res.json(ok(data));
});

export default router;
