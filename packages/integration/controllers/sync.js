import { syncOpendigger } from './opendigger.js';

export async function syncProjectHandler(req, res) {
  const id = req.params.projecId;
  try {
    const result = await syncOpendigger(id, req.body.path);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ erorr: e.message });
  }
}
