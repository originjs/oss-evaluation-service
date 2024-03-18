import fs from 'fs';
import { ScorecardComplem, ProjectTechStack, Scorecard } from '@orginjs/oss-evaluation-data-model';
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
    } else if (req.body.category) {
      // sync a category
      const options = req.body.category === 'all' ? {} : { where: { category: req.body.category } };
      let projects;
      if (req.body.complementary) {
        projects = await ScorecardComplem.findAll(options);
      } else {
        projects = await ProjectTechStack.findAll(options);
      }
      let retryList = fetchData(projects);
      let retryChance = 0;
      // Retry for less than 3 times
      while (retryChance < 3) {
        retryChance += 1;
        retryList = fetchData(retryList);
      }
      fs.writeFileSync('errorList.txt', JSON.stringify(retryList));
      res.status(200).json({
        status: 'success',
        projects: projects.map(item => item.name),
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function fetchData(projects) {
  let index = 0;
  const interval = 5;
  const retryList = [];
  setInterval(async () => {
    const chunk = projects.slice(index, index + interval);
    for (const project of chunk) {
      const projectPath = project.htmlUrl.substring('https://'.length);
      await syncScorecard(project.projectId, projectPath).catch(e => {
        retryList.push(e.message);
      });
    }
    index += interval;
  }, 5000);
  return retryList;
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
  let score;
  try {
    score = await getScorecard(url);
  } catch (e) {
    throw ServerError({
      projectId,
      address,
      platform,
      org,
      repo,
    });
  }
  const row = { ...score, projectId };
  const [data, created] = await Scorecard.findOrCreate({
    where: { projectId: row.projectId },
    defaults: row,
  });
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
      const { checks } = body;
      const scoreMap = {};
      for (const item of checks) {
        const name = item.name.toLowerCase().replace('-', '_');
        scoreMap[name] = item.score;
      }
      return {
        repo_name: body.repo.name,
        collection_date: body.date,
        score: body.score,
        commit: body.repo.commit,
        ...scoreMap,
      };
    }
    return {};
  } catch (e) {
    throw new ServerError(e);
  }
}

export async function getScorecardHandler(req, res) {
  const { url } = req.body;
  try {
    const result = await getScorecard(`https://api.securityscorecards.dev/projects/${url}`);
    res.status(200).send(result);
  } catch (e) {
    res.status(500).send(e.toString());
  }
}
