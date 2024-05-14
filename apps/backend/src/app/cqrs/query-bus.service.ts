import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryBus } from '@nestjs/cqrs';

@Injectable()
export class AppQueryBus {
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * Executes a query
   *
   * QueryHandler type must be provided otherwise expect the following typescipt error:
   * "Argument of type 'Something' is not assignable to parameter of type 'never'."
   */
  execute<QH extends IQueryHandler = never>(
    query: Parameters<QH['execute']>[0]
  ): ReturnType<QH['execute']> {
    return this.queryBus.execute(query) as ReturnType<QH['execute']>;
  }
}
