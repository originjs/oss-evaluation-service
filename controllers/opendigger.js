import async from 'async';
import debug from 'debug';
import sequelize, { Op } from 'sequelize';
import OpenDigger from '../models/OpenDigger.js';
import GithubProjects from '../models/GithubProjects.js';
import { ServerError } from '../util/error.js';

export async function getOpenRank(projectPath) {
  const response = await fetch(`https://oss.x-lab.info/open_digger/github/${projectPath}/openrank.json`);
  if (response.ok) {
    const body = await response.json();
    let year = new Date().getFullYear();
    for (let i = 0; i < 5; i += 1, year -= 1) {
      if (body[year]) {
        return {
          date: year,
          openrank: body[year],
        };
      }
    }
    return { error: `fetch openrank.json failed: no data ${year}` };
  }
  return { error: `fetch openrank.json failed: ${response.statusText}` };
}

export async function getBusFactor(projectPath) {
  const response = await fetch(`https://oss.x-lab.info/open_digger/github/${projectPath}/bus_factor.json`);
  if (response.ok) {
    const body = await response.json();
    let year = new Date().getFullYear();
    for (let i = 0; i < 5; i += 1, year -= 1) {
      if (body[year]) {
        return {
          date: year,
          busfactor: body[year],
        };
      }
    }
    return { error: `fetch openrank.json failed: no data ${year}` };
  }
  return { error: `fetch openrank.json failed: ${response.statusText}` };
}

export async function syncOpendigger(projectId, projectPath) {
  debug.log('syncOpendigger', projectId, projectPath);
  const rank = await getOpenRank(projectPath);
  const bus = await getBusFactor(projectPath);
  // insert a record even if request fails
  const row = {
    openrank: rank.openrank,
    openrankDate: rank.date,
    busFactor: bus.busfactor,
    busFactorDate: bus.date,
  };
  const [data, created] = await OpenDigger.findOrCreate(
    {
      where: { projectId },
      defaults: row,
    },
  );
  if (!created) {
    data.update(row);
  }
  return row;
}

export async function syncOpendiggerHandler(req, res) {
  // sync single project
  if (req.body.id) {
    const projectId = req.body.id;
    const project = await GithubProjects.findByPk(projectId);
    if (!project) {
      res.status(500).json({ error: 'can not find project!' });
      return;
    }
    const result = await syncOpendigger(projectId, project.fullName);
    res.status(200).json(result);
  } else { // sync all
    const options = {
      attributes: ['id', 'htmlUrl'],
      where: {
        id: {
          [Op.notIn]:
            sequelize.literal('(SELECT project_id from opendigger_info where updated_at >= DATE(NOW()) - INTERVAL 30 DAY)'),
        },
      },
    };
    const projects = await GithubProjects.findAll(options);
    // 5 concurrent requests at the same time
    async.mapLimit(
      projects,
      5,
      async (project) => {
        try {
          await syncOpendigger(project.id, project.fullName);
        } catch (e) {
          if (!(e instanceof ServerError)) {
            throw e;
          }
        }
      },
      (err) => {
        if (err) throw err;
      },
    );
    res.status(200).json({
      status: 'success',
      projects: projects.length,
    });
  }
}
