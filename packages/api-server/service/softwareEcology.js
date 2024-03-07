import sequelize from '@orginjs/oss-evaluation-data-model/util/database.js';

/**
 * getSoftwareMaturity
 *
 * @param packageName packageName
 * @returns {Promise<{firstCommit, license: *, star: *, language: *}>}
 */
// eslint-disable-next-line import/prefer-default-export
export async function getSoftwareMaturity(packageName) {
  const sql = `
        select name, full_name, stargazers_count, forks_count, bus_factor
        from github_projects project
         inner join opendigger_info digeer on project.id = digeer.project_id
        where full_name = :packageName
  `;
  const softwareMaturity = await sequelize.query(
    sql,
    {
      replacements: { packageName },
      type: sequelize.QueryTypes.SELECT,
    },
  );
  if (softwareMaturity.length === 0) {
    return {};
  }
  return {
    name: softwareMaturity[0].name,
    full_name: softwareMaturity[0].full_name,
    stargazers_count: softwareMaturity[0].stargazers_count,
    forks_count: softwareMaturity[0].forks_count,
    bus_factor: softwareMaturity[0].bus_factor,
  };
}
