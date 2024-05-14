import async from 'async';
import debug from 'debug';
import sequelize, { Op } from 'sequelize';
import { OpenDigger, GithubProjects } from '@orginjs/oss-evaluation-data-model';
import { ServerError } from '../util/error.js';
import { getProjectByUrl } from '../util/util.js';

async function getOpenRank(projectPath, type) {
  const response = await fetch(
    `https://oss.x-lab.info/open_digger/${type}/${projectPath}/openrank.json`,
  );
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

async function getBusFactor(projectPath, type) {
  const response = await fetch(
    `https://oss.x-lab.info/open_digger/${type}/${projectPath}/bus_factor.json`,
  );
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

export async function syncSingleProjectOpendigger(project) {
  const type = project.htmlUrl.startsWith('https://gitte.com/') ? 'gitee' : 'github';
  const rank = await getOpenRank(project.fullName, type);
  const bus = await getBusFactor(project.fullName, type);
  // insert a record even if request fails
  const row = {
    openrank: rank.openrank,
    openrankDate: rank.date,
    busFactor: bus.busfactor,
    busFactorDate: bus.date,
  };
  const [data, created] = await OpenDigger.findOrCreate({
    where: { projectId: project.id },
    defaults: row,
  });
  if (!created) {
    data.update(row);
  }
  return row;
}

export async function syncAllProjectOpendigger() {
  const options = {
    attributes: ['id', 'fullName', 'htmlUrl'],
    where: {
      id: {
        [Op.notIn]: sequelize.literal(
          '(SELECT project_id from opendigger_info where updated_at >= DATE(NOW()) - INTERVAL 15 DAY)',
        ),
      },
    },
  };
  const projects = await GithubProjects.findAll(options);
  // 5 concurrent requests at the same time
  async.mapLimit(
    projects,
    5,
    async project => {
      try {
        await syncSingleProjectOpendigger(project);
      } catch (e) {
        debug.log(e);
        if (!(e instanceof ServerError)) {
          throw e;
        }
      }
    },
    err => {
      if (err) throw err;
    },
  );
}

export async function syncOpendiggerHandler(req, res) {
  const { repoUrl } = req.body;
  // sync all
  if (!repoUrl) {
    syncAllProjectOpendigger();
    res.status(200).json('ok');
  } else {
    // sync single project
    const project = await getProjectByUrl(repoUrl);
    const result = await syncSingleProjectOpendigger(project);
    res.status(200).json(result);
  }
}
