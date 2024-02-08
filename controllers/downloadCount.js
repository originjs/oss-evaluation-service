import { getDownloadCount } from '../service/downloadCountsService.js';
import { geneWeekOfMonth } from '../service/weekOfMonthService.js';

export async function syncDownloadCount(req, res) {
  await getDownloadCount(req);
  res.status(200).json('ok');
}

export async function syncWeekOfMonth(req, res) {
  const firstDate = req.body.start;
  const secondDate = req.body.end;
  await geneWeekOfMonth(firstDate, secondDate);
  res.status(200).json('ok');
}
