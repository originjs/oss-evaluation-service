import { getProjectByUrl } from '../util/util.js';
import CozeSdk from '@orginjs/coze-sdk';

export async function syncAlternativeHandler(req, res) {
  const { repoUrl } = req.body;
  // sync all
  if (!repoUrl) {
    res.status(200).json('ok');
  } else {
    // sync single project
    const project = await getProjectByUrl(repoUrl);
    const result = await syncSingleProjectAlternative(project);
    res.status(200).json(result);
  }
}

export async function syncSingleProjectAlternative(project) {
  const cozeSdk = new CozeSdk();
  const response = await cozeSdk.chat(project.htmlUrl);
  if (response.ok) {
    const rsp = await response.json();
    const messages = rsp.messages;
    console.log(messages);
  }
}
