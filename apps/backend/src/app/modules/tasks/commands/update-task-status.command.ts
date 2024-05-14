import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TaskStatusType } from '@sca/models';
import { z } from 'zod';

import { AppQueryBus } from '../../../cqrs/query-bus.service';
import { OpensearchClient } from '../../opensearch/client';
import { OpensearchIndex } from '../../opensearch/consts';
import { TaskEntitySchema } from '../entities/task.entity';
import {
  GetTaskByIdQuery,
  GetTaskByIdQueryHandler,
} from '../queries/get-task-by-id.query';

const UpdateTaskStatusCommandParamsSchema = z.object({
  taskId: z.string(),
  status: z.nativeEnum(TaskStatusType),
  stderr: z.string().optional(),
  stdout: z.string().optional(),
});

export class UpdateTaskStatusCommand {
  params: z.output<typeof UpdateTaskStatusCommandParamsSchema>;

  constructor(params: z.input<typeof UpdateTaskStatusCommandParamsSchema>) {
    this.params = UpdateTaskStatusCommandParamsSchema.parse(params);
  }
}

@CommandHandler(UpdateTaskStatusCommand)
export class UpdateTaskStatusCommandHandler
  implements ICommandHandler<UpdateTaskStatusCommand>
{
  private readonly statusTypeOrder: TaskStatusType[] = [
    TaskStatusType.WAITING_FOR_APPROVAL,
    TaskStatusType.APPROVED,
    TaskStatusType.IN_PROGRESS,
    TaskStatusType.COMPLETED,
    TaskStatusType.FAILED,
  ];

  constructor(
    private readonly queryBus: AppQueryBus,
    private readonly opensearch: OpensearchClient
  ) {}

  async execute({ params }: UpdateTaskStatusCommand): Promise<void> {
    const { id, ...task } =
      await this.queryBus.execute<GetTaskByIdQueryHandler>(
        new GetTaskByIdQuery(params.taskId)
      );

    if (
      this.statusTypeOrder.indexOf(task.status.type) >
      this.statusTypeOrder.indexOf(params.status)
    ) {
      throw new BadRequestException();
    }

    const entity: z.input<typeof TaskEntitySchema> = {
      ...task,
      status: { type: params.status, updatedAt: new Date().toISOString() },
      log: {
        stderr: params.stderr !== undefined ? params.stderr : task.log.stderr,
        stdout: params.stdout !== undefined ? params.stdout : task.log.stdout,
      },
    };
    await this.opensearch.upsertDocument(
      OpensearchIndex.TASKS,
      id,
      TaskEntitySchema.parse(entity)
    );
  }
}
