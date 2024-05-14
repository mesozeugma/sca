import { TaskStatusType } from '@sca/models';

export class GenericTaskResult {
  constructor(
    readonly taskStatus: TaskStatusType.COMPLETED | TaskStatusType.FAILED,
    readonly stderr: string = '',
    readonly stdout: string = ''
  ) {}
}
