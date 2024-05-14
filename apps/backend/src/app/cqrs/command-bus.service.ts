import { Injectable } from '@nestjs/common';
import { CommandBus, ICommandHandler } from '@nestjs/cqrs';

@Injectable()
export class AppCommandBus {
  constructor(private readonly commandBus: CommandBus) {}

  /**
   * Executes a command
   *
   * CommandHandler type must be provided otherwise expect the following typescipt error:
   * "Argument of type 'Something' is not assignable to parameter of type 'never'."
   */
  execute<CH extends ICommandHandler = never>(
    query: Parameters<CH['execute']>[0]
  ): ReturnType<CH['execute']> {
    return this.commandBus.execute(query) as ReturnType<CH['execute']>;
  }
}
