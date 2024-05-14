export enum MetricKey {
  /**
   * A quantitative metric used to calculate the number of paths through the code.
   */
  CYCLOMATIC_COMPLEXITY = 'complexity',
  /**
   * How hard it is to understand the code's control flow.
   */
  COGNITIVE_COMPLEXITY = 'cognitive_complexity',
  /**
   * The number of duplicated blocks of lines.
   */
  DUPLICATED_BLOCKS = 'duplicated_blocks',
  /**
   * The number of files involved in duplications.
   */
  DUPLICATED_FILES = 'duplicated_files',
  /**
   * The number of lines involved in duplications.
   */
  DUPLICATED_LINES = 'duplicated_lines',
  /**
   * duplicated_lines / (lines of code) * 100
   */
  DUPLICATED_LINES_DENSITY = 'duplicated_lines_density',
  /**
   * The total count of issues in all states.
   */
  VIOLATIONS = 'violations',
  /**
   * The total count of blocker issues.
   */
  BLOCKER_VIOLATIONS = 'blocker_violations',
  /**
   * The total count of critical issues.
   */
  CRITICAL_VIOLATIONS = 'critical_violations',
  /**
   * The total count of major issues.
   */
  MAJOR_VIOLATIONS = 'major_violations',
  /**
   * The total count of minor issues.
   */
  MINOR_VIOLATIONS = 'minor_violations',
  /**
   * The total count of info issues.
   */
  INFO_VIOLATIONS = 'info_violations',
  /**
   * The total count of code smell issues.
   */
  CODE_SMELLS = 'code_smells',
  /**
   * A measure of effort to fix all code smells. The measure is stored in minutes in the database.
   */
  SQALE_INDEX = 'sqale_index',
  /**
   * The total number of bug issues.
   */
  BUGS = 'bugs',
  /**
   * The effort to fix all bug issues. The measure is stored in minutes in the DB.
   */
  RELIABILITY_REMEDIATION_EFFORT = 'reliability_remediation_effort',
  /**
   * The number of vulnerability issues.
   */
  VULNERABILITIES = 'vulnerabilities',
  /**
   * The effort to fix all vulnerability issues. The measure is stored in minutes in the DB.
   */
  SECURITY_REMEDIATION_EFFORT = 'security_remediation_effort',
  /**
   * The number of Security Hotspots
   */
  SECURITY_HOTSPOTS = 'security_hotspots',
  /**
   * The number of classes (including nested classes, interfaces, enums, and annotations).
   */
  CLASSES = 'classes',
  /**
   * The number of lines containing either comment or commented-out code.
   */
  COMMENT_LINES = 'comment_lines',
  /**
   * The comment lines density = comment lines / (lines of code + comment lines) * 100
   */
  COMMENT_LINES_DENSITY = 'comment_lines_density',
  /**
   * The number of directories.
   */
  DIRECTORIES = 'directories',
  /**
   * The number of files.
   */
  FILES = 'files',
  /**
   * The number of physical lines that contain at least one character which is neither a whitespace nor a tabulation nor part of a comment.
   */
  NCLOC = 'ncloc',
  /**
   * The non-commented lines of code distributed by language.
   *
   * Value example: "java=26485;xml=354"
   */
  NCLOC_LANGUAGE_DISTRIBUTION = 'ncloc_language_distribution',
  /**
   * The number of functions. Depending on the language, a function is defined as either a function, a method, or a paragraph.
   */
  FUNCTIONS = 'functions',
  /**
   * The number of statements.
   */
  STATEMENTS = 'statements',
}
