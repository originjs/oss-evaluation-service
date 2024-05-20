import fs from 'fs';
import { exec } from 'node:child_process';
import util from 'node:util';
import {
  ScorecardComplem,
  ProjectTechStack,
  Scorecard,
  sequelize,
  GithubProjects,
} from '@orginjs/oss-evaluation-data-model';
import { ServerError, BadRequestError } from '../util/error.js';

export async function syncScorecardHandler(req, res) {
  try {
    // sync single project
    if (req.body.id) {
      const projectId = req.body.id;
      const project = await GithubProjects.findByPk(projectId);
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
        console.log('Starting complementary mode. Only integrate data of "is_latest = 0"');
        projects = await ScorecardComplem.findAll(options);
      } else {
        if (req.body.category === 'all') {
          console.log('Starting full integration mode. Integrate all data from scratch!');
          await Scorecard.update({ isLatest: false }, { where: {} });
        }
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
    console.log('Scorecard integration ends without error!');
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function syncScorecardSpecial(req, res) {
  try {
    let jobList = [];
    const [projectList,] = await sequelize.query(`SELECT * FROM github_projects WHERE integrated_state = 2
    AND id NOT IN (SELECT DISTINCT project_id FROM scorecard_info)`); //GithubProjects.findAll({ where: { integratedState: 2 } });
    for (const project of projectList) {
      const projectPath = project.html_url.substring('https://'.length);
      const projectId = project.id;
      try {
        await syncScorecard(projectId, projectPath);
        jobList.push(`Success for ${project.html_url}`);
      } catch (e) {
        console.log(e);
        jobList.push(`Failure for ${project.html_url}`);
      }
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
      console.log(`Start integrating project from ${project.htmlUrl}`);
      const projectPath = project.htmlUrl.substring('https://'.length);
      await syncScorecard(project.projectId, projectPath).catch(e => {
        console.log(`Integration Failed! Failure from project ${e.message}`);
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
    url = address;
  } else if (platform && org && repo) {
    url = `${platform}/${org}/${repo}`;
  } else {
    throw new BadRequestError();
  }
  let score;
  try {
    score = await getScorecard(url);
  } catch (e) {
    console.error(e);
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
    const apiUrl = `https://api.securityscorecards.dev/projects/${url}`;
    const response = await fetch(apiUrl);
    let body;
    if (response.ok) {
      console.log(`Fetching data of project ${url} online...`);
      body = await response.json();
    } else {
      console.log(`Fetching data of project ${url} failed! Running scorecard locally...`);
      let buffer;
      const execPromise = util.promisify(exec);
      await execPromise(`"scorecard-windows-amd64.exe" --repo=${url} --format=json`, {
        env: { GITHUB_AUTH_TOKEN: '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' },
      })
        .then(value => {
          buffer = value.stdout;
        })
        .catch(error => {
          buffer = error.stdout;
          console.error(error);
        });
      body = JSON.parse(buffer);
    }
    const { checks } = body;
    const scoreMap = {};
    for (const item of checks) {
      let name = item.name;
      // 将名字转为驼峰
      if (name.includes('-')) {
        const firstWord = name.indexOf('-');
        name = name.replaceAll('-', '');
        name = name.replace(
          name.substring(0, firstWord),
          name.substring(0, firstWord).toLowerCase(),
        );
      } else {
        name = name.toLowerCase();
      }
      scoreMap[name] = item.score;
    }
    return {
      repoName: body.repo.name,
      collectionDate: body.date,
      score: body.score,
      commit: body.repo.commit,
      ...scoreMap,
      isLatest: true,
    };
  } catch (e) {
    throw new ServerError(e);
  }
}

export async function getScorecardHandler(req, res) {
  const { url } = req.body;
  try {
    const result = await getScorecard(url);
    res.status(200).send(result);
  } catch (e) {
    res.status(500).send(e.toString());
  }
}
