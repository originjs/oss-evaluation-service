import { activeAutoScanInternalApi, createProject, createProjectInternalApi } from './projects.js';
import { deleteBranch, listProjectBranches, renameMainBranch } from './projectBranches.js';
import { getMeasures } from './measures.js';

export class SonarCloudSdk {
  constructor(token) {
    token = token || process.env.SONAR_CLOUD_TOKEN;
    this.token = token;
  }

  /**
   * {
   *  name: 'vite'
   *  newCodeDefinitionValue: 30,
   *  newCodeDefinitionType: 'days',
   *  organization: 'vitejs',
   *  visibility :'public',
   *  project: 'vite'
   * }
   * @param param
   * @return {Promise<Response>}
   */
  createProject = param => {
    return createProject(param, this.token);
  };

  createProjectInternalApi = param => {
    return createProjectInternalApi(param, this.token);
  };

  activeAutoScanInternalApi = projectKey => {
    return activeAutoScanInternalApi(projectKey, this.token);
  };

  listProjectBranches = projectKey => {
    return listProjectBranches(projectKey, this.token);
  };

  deleteBranch = async (projectKey, branchName) => {
    return deleteBranch(projectKey, branchName, this.token);
  };
  renameMainBranch = async (projectKey, newBranchName) => {
    return renameMainBranch(projectKey, newBranchName, this.token);
  };

  /**
   * {
   *   branch: 'main',
   *   component: 'vite',
   *   metricKeys: 'accepted_issues,new_technical_debt,blocker_violations,bugs,classes,code_smells
   *   ,cognitive_complexity,comment_lines,comment_lines_density,branch_coverage,new_branch_coverage,
   *   conditions_to_cover,new_conditions_to_cover,confirmed_issues,coverage,
   *   new_coverage,critical_violations,complexity,duplicated_blocks,new_duplicated_blocks,
   *   duplicated_files,duplicated_lines,duplicated_lines_density,new_duplicated_lines_density,
   *   new_duplicated_lines,effort_to_reach_maintainability_rating_a,false_positive_issues,
   *   files,functions,generated_lines,generated_ncloc,info_violations,violations,
   *   line_coverage,new_line_coverage,lines,ncloc,lines_to_cover,new_lines_to_cover,sqale_rating,
   *   new_maintainability_rating,major_violations,minor_violations,new_accepted_issues,new_blocker_violations,
   *   new_bugs,new_code_smells,new_critical_violations,new_info_violations,new_violations,new_lines,
   *   new_major_violations,new_minor_violations,new_security_hotspots,new_vulnerabilities,open_issues,
   *   projects,alert_status,reliability_rating,new_reliability_rating,reliability_remediation_effort,
   *   new_reliability_remediation_effort,reopened_issues,security_hotspots,security_hotspots_reviewed,
   *   new_security_hotspots_reviewed,security_rating,new_security_rating,security_remediation_effort,new_security_remediation_effort,
   *   security_review_rating,new_security_review_rating,skipped_tests,statements,sqale_index,sqale_debt_ratio,
   *   new_sqale_debt_ratio,uncovered_conditions,new_uncovered_conditions,uncovered_lines,new_uncovered_lines,test_execution_time,
   *   test_errors,test_failures,test_success_density,tests,vulnerabilities,wont_fix_issues'
   * }
   * @param param
   * @return {Promise<Response>}
   */
  getMeasures = async param => {
    return getMeasures(param, this.token);
  };
}
