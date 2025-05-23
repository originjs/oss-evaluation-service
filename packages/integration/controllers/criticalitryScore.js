import { sequelize } from '@orginjs/oss-evaluation-data-model';

export async function syncCriticalityScoreHandler(req, res) {
  const originalData = req.body.tableName;
  try {
    await syncCriticalityScore(originalData);
    res.status(200).send('Sync success!');
  } catch (e) {
    res.status(500).send(e);
  }
}

/**
 * Synchronize criticality score
 * @param {string} originalData name of original data table name, like 'criticality_score_20240401'
 */
async function syncCriticalityScore(originalData) {
  const tableName = originalData ? originalData : 'criticality_score_20240401';
  await sequelize.query(`INSERT INTO criticality_score(p_id, project_name, repo_url, score, collection_date)
                         SELECT p.p_id                                                AS p_id,
                                p.name                                                AS project_name,
                                p.html_url                                            AS repo_url,
                                cs.default_score                                      AS score,
                                str_to_date(left(cs.collection_date, 10), '%Y-%m-%d') AS collection_date
                         FROM ${tableName} cs
                                  join view_projects p
                                       on cs.url = p.html_url
                         ON DUPLICATE KEY UPDATE score           = cs.default_score,
                                                 collection_date = str_to_date(left(cs.collection_date, 10), '%Y-%m-%d')`);
}
