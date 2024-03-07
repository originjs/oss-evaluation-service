/* eslint-disable no-console */
import * as mysql from 'mysql2/promise';
import * as yaml from 'js-yaml';
import * as fs from 'fs';

function generateSvg(text, path) {
  const newText = text.length > 8 ? `${text.substring(0, 5)}...` : text;
  const baseSize = 180;
  const emSize = 2 / newText.length;
  const fontSize = emSize < 1 ? emSize * baseSize : baseSize;
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg"
  width="200" height="200" viewBox="-100 -100 200 200">
    <rect x="-100" y="-100" width="200" height="200" fill="rgba(0,0,0,0)"/>
    <text x="0" y="0" font-size="${fontSize}" fill="#4d97db" text-anchor="middle" dominant-baseline="central">${newText}</text>
</svg>`;
  fs.writeFileSync(path, svgContent);
}

function parseSoftware(results, subcategory) {
  for (const result of results) {
    if (subcategory.items.find((it) => it.name === result.name)) {
      console.warn('Find duplicate: ', result.name);
      continue;
    }
    const item = {};
    item.item = null;
    item.name = result.name;
    item.homepage_url = result.html_url;
    item.repo_url = result.html_url;
    item.logo = result.logo;
    item.description = result.description;
    if (!item.logo) {
      item.logo = `${result.id}_.svg`;
      generateSvg(item.name, `./logos/${item.logo}`);
    }
    subcategory.items.push(item);
  }
}

async function updateData() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const data = { landscape: [] };
  let count = 0;
  const configGroup = yaml.load(fs.readFileSync('./group.yml'));
  for (const group of configGroup.groups) {
    const category = {
      category: null,
      name: group.name,
      subcategories: [],
    };
    for (const categoryName of group.subcategories) {
      const [rows] = await connection.query(`SELECT p.* FROM github_projects AS p LEFT JOIN project_tech_stack AS t ON p.id = t.project_id 
      WHERE t.category = '${categoryName}' AND t.archived IS NULL ORDER BY stargazers_count DESC LIMIT 30`);
      count += rows.length;
      const subcategory = {
        subcategory: null,
        name: categoryName,
        items: [],
      };
      category.subcategories.push(subcategory);
      parseSoftware(rows, subcategory);
    }
    data.landscape.push(category);
  }
  connection.end();
  fs.writeFileSync('./data.yml', yaml.dump(data, {
    styles: { '!!null': 'empty' },
  }));
  console.log(`----------Update data.yml ${count}------------`);
}

updateData();
