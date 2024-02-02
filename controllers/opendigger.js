import { OpenDigger } from '../models/OpenDigger.js';

export async function syncOpendigger(req, res, next) {
    const id = req.body.id
    const path = req.body.path;
    const rank = await getOpenRank(path);
    const bus = await getBusFactor(path);
    if (rank.erorr || bus.erorr) {
        res.status(200).json({ erorr: rank.erorr + bus.erorr });
        return;
    }
    const row = {
        openrank: rank.openrank,
        openrank_date: rank.date,
        bus_factor: bus.busfactor,
        bus_factor_date: bus.date
    };
    const [data, created] = await OpenDigger.findOrCreate(
        {
            where: { project_id: id },
            defaults: row
        })
    if (!created) {
        data.update(row);
    }
    res.status(200).json(row);
}

export async function getOpenRank(projectPath) {
    const response = await fetch(`https://oss.x-lab.info/open_digger/github/${projectPath}/openrank.json`);
    if (response.ok) {
        const body = await response.json();
        let year = new Date().getFullYear();
        for (let i = 0; i < 5; i++, year--) {
            if (body[year]) {
                return {
                    date: year,
                    openrank: body[year]
                };
            }
        }
    }
    return {
        erorr: 'fetch openrank.json failed'
    }
}

export async function getBusFactor(projectPath) {
    const response = await fetch(`https://oss.x-lab.info/open_digger/github/${projectPath}/bus_factor.json`);
    if (response.ok) {
        const body = await response.json();
        let year = new Date().getFullYear();
        for (let i = 0; i < 5; i++, year--) {
            if (body[year]) {
                return {
                    date: year,
                    busfactor: body[year]
                };
            }
        }
    }
    return {
        erorr: 'fetch bus_factor.json failed'
    }
}