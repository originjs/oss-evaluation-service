import express from 'express';
import { search } from '../service/homeService.js';
import { ok } from '../model/result.js';

const router = express.Router();

/**
 * @swagger
 * /home/search/{keyword}:
 *   get:
 *     summary: search
 *     parameters:
 *       - in: path
 *         name: keyword
 *         required: true
 *         example: "vue"
 *     responses:
 *       '200':
 *         description: Successful response
 */
router.get('/search/:keyword', async (req, res) => {
  const { keyword } = req.params;
  const data = await search(keyword);
  res.json(ok(data));
});

export default router;
