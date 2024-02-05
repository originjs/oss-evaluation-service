import async from 'async';
import { Scorecard } from '../models/Scorecard.js';
import { ProjectTechStack } from '../models/ProjectTechStack.js';
import { ServerError, BadRequestError, DbError } from '../util/error.js';

export async function syncScorecardHandler(req, res, next) {
  try {
    // sync single project
    if (req.body.id) {
        const projectId = req.body.id;
        const project = await ProjectTechStack.findByPk(projectId);
        if (!project) {
            res.status(500).json({ error: 'can not find project!' });
            return;
        }
        const projectPath = project.html_url.substring('https://'.length);
        const result = await syncScorecard(projectId, projectPath);
        res.status(200).json(result);
    } // sync a category
    else if (req.body.category) {
        let options = req.body.category == 'all' ? {} : { where: { category: req.body.category } };
        const projects = await ProjectTechStack.findAll(options);
        // 控制并发请求5个
        async.mapLimit(projects, 5, async function (project) {
            try {
              const projectPath = project.html_url.substring('https://'.length);
              await syncScorecard(project.project_id, projectPath);
            } catch (e) {
                if (!(e instanceof ServerError)) {
                    throw e;
                }
            }
        },
        function (err, resutlst) {
          if (err) throw err;
      });    
      res.status(200).json({
          status: 'success',
          projects: projects.map(item => item.name)
      });
    }
  } catch (e) {
      res.status(500).json({ error: e.message });
  }
}

export async function syncScorecard(project_id, address, platform, org, repo) {
  let url = '';
  if (address && address.length > 0) {
    url = `https://api.securityscorecards.dev/projects/${address}`;
  } else if (platform && org && repo) {
    const platform = platform;
    const org = org;
    const repo = repo;
    url = `https://api.securityscorecards.dev/projects/${platform}/${org}/${repo}`;
  } else {
    throw new BadRequestError();
  }
  const score = await getScorecard(url);
  if (score.error) {
    throw new ServerError(score.error)
  }
  const row = {...score, project_id: project_id};
  const [data, created] = await Scorecard.findOrCreate(
      {
          where: { project_id: row.project_id },
          defaults: row
      })
  if (!created) {
      data.update(row);
  }
  return row;
}

export async function getScorecard(url) {
    const response = await fetch(url);
    if (response.ok) {
        const body = await response.json();
        return {
          repo_name: body.repo.name,
          date: body.date,
          score: body.score,
          commit: body.repo.commit
        }
    }
    return {
        error: 'Fetch scorecard failed!'
    }
}
