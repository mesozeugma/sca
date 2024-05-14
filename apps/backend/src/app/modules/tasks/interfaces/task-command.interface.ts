export interface TaskCommand {
  /**
   * Human-readable message that includes the important properties of this task instance
   */
  getDescription(): string;
}
