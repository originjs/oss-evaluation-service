import Scorecard from '../models/Scorecard.js';
import ProjectTechStack from '../models/ProjectTechStack.js';
import { ServerError, BadRequestError } from '../util/error.js';

export async function syncScorecardHandler(req, res) {
  try {
    // sync single project
    if (req.body.id) {
      const projectId = req.body.id;
      const project = await ProjectTechStack.findByPk(projectId);
      if (!project) {
        res.status(500).json({ error: 'can not find project!' });
        return;
      }
      const projectPath = project.htmlUrl.substring('https://'.length);
      const result = await syncScorecard(projectId, projectPath);
      res.status(200).json(result);
    } else if (req.body.category) { // sync a category
      const options = req.body.category === 'all' ? {} : { where: { category: req.body.category } };
      const projects = await ProjectTechStack.findAll(options);
      let index = 0;
      const interval = 5;
      setInterval(async () => {
        const chunk = projects.slice(index, index + interval);
        for (const project of chunk) {
          const projectPath = project.htmlUrl.substring('https://'.length);
          await syncScorecard(project.projectId, projectPath);
        }
        index += interval;
      }, 5000);
      res.status(200).json({
        status: 'success',
        projects: projects.map((item) => item.name),
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function syncScorecard(projectId, address, platform, org, repo) {
  let url = '';
  if (address && address.length > 0) {
    url = `https://api.securityscorecards.dev/projects/${address}`;
  } else if (platform && org && repo) {
    url = `https://api.securityscorecards.dev/projects/${platform}/${org}/${repo}`;
  } else {
    throw new BadRequestError();
  }
  const score = await getScorecard(url);
  const row = { ...score, project_id: projectId };
  const [data, created] = await Scorecard.findOrCreate(
    {
      where: { project_id: row.project_id },
      defaults: row,
    },
  );
  if (!created) {
    data.update(row);
  }
  return row;
}

export async function getScorecard(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const body = await response.json();
      return {
        repo_name: body.repo.name,
        date: body.date,
        score: body.score,
        commit: body.repo.commit,
      };
    }
    return {};
  } catch (e) {
    throw new ServerError(e);
  }
}
