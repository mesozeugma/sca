export const UNPAGINATED_SIZE_LIMIT = 1000;
export const KEYWORD_MAX_LENGTH = 2147483647;

export enum OpensearchIndex {
  ANALYSES = 'sca_analyses',
  ANALYSIS_RESULT_PRIMARY_LINE_COUNTS = 'public_sca_analysis_result_primary_line_counts',
  ANALYSIS_RESULT_REPOSITORIES = 'public_sca_analysis_result_repositories',
  ANALYSIS_RESULT_REPOSITORY_IMPORT_ERRORS = 'sca_analysis_result_repository_import_errors',
  ANALYSIS_RESULT_REPOSITORY_IMPORTS = 'public_sca_analysis_result_repository_imports',
  ANALYSIS_RESULT_SEMANTIC = 'public_sca_analysis_result_semantic',
  ANALYSIS_RESULT_SONARQUBE_ISSUES = 'public_sca_analysis_result_sonarqube_issues',
  ANALYSIS_RESULT_SONARQUBE_METRICS = 'public_sca_analysis_result_sonarqube_metrics',
  BOOKMARKS = 'sca_bookmarks',
  OD_SAVED_OBJECT_USAGES = 'sca_od_saved_object_usages',
  REPOSITORIES = 'sca_repositories',
  TASKS = 'sca_tasks',
}

export enum OpensearchSearch {
  CLASS_EXPLORE = 'class-explore',
  PACKAGE_EXPLORE = 'package-explore',
  PACKAGE_EXPLORE_INITIAL = 'package-explore-initial',
}
