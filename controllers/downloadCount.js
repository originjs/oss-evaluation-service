import { getDownloadCount } from "../service/downloadCountsService.js";

export async function syncDownloadCount(req, res) {
   await getDownloadCount(req);
    res.status(200).json("ok");
}

