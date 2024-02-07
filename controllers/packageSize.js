import { syncSinglePackageSize, getGitHubProjectPackageSize } from '../service/getPackageSizeService.js';

export async function syncPackageSize(req, res, next) {
  try {
    const result = await syncSinglePackageSize(req, res, next);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ erorr: e.message });
  }
}

export async function syncGitHubProjectPackageSize(req, res, next) {
  try {
    const result = await getGitHubProjectPackageSize(req, res, next);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ erorr: e.message });
  }
}
