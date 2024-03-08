import express from 'express';
import { githubTop } from '../service/trendService.js';
import Page from '../model/page.js';
import { errHandler } from './routerTool.js';

const router = express.Router();

router.get('/:type', async (req, res) => {
  const { type } = req.params;
  const { pageNo, pageSize } = req.query;
  const page = new Page(parseInt(pageNo, 10), parseInt(pageSize, 10));
  page.format();
  errHandler(githubTop(page, type), res);
});

export default router;
