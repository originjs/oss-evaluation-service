import async from 'async';
import OpenDigger from '../models/OpenDigger.js';
import ProjectTechStack from '../models/ProjectTechStack.js';
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

export async function syncOpendigger(projecId, projectPath) {
  const rank = await getOpenRank(projectPath);
  if (rank.error) {
    throw new ServerError(rank.error);
  }
  const bus = await getBusFactor(projectPath);
  if (bus.error) {
    throw new ServerError(bus.error);
  }
  const row = {
    openrank: rank.openrank,
    openrank_date: rank.date,
    bus_factor: bus.busfactor,
    bus_factor_date: bus.date,
  };
  const [data, created] = await OpenDigger.findOrCreate(
    {
      where: { project_id: projecId },
      defaults: row,
    },
  );
  if (!created) {
    data.update(row);
  }
  return row;
}

export async function syncOpendiggerHandler(req, res) {
  try {
    // sync single project
    if (req.body.id) {
      const projectId = req.body.id;
      const project = await ProjectTechStack.findByPk(projectId);
      if (!project) {
        res.status(500).json({ error: 'can not find project!' });
        return;
      }
      const projectPath = project.html_url.substring('https://github.com/'.length);
      const result = await syncOpendigger(projectId, projectPath);
      res.status(200).json(result);
    } else if (req.body.category) { // sync a category
      const options = req.body.category === 'all' ? {} : { where: { category: req.body.category } };
      const projects = await ProjectTechStack.findAll(options);
      // 控制并发请求5个
      async.mapLimit(
        projects,
        5,
        async (project) => {
          try {
            const projectPath = project.html_url.substring('https://github.com/'.length);
            await syncOpendigger(project.project_id, projectPath);
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
        projects: projects.map((item) => item.name),
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
