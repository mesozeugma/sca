import { Injectable } from '@nestjs/common';
import {
  BookmarksCreateInput,
  BookmarksCreateOutput,
  BookmarksGetByIdInput,
  BookmarksGetByIdOutput,
  BookmarksListInput,
  BookmarksListOutput,
  BookmarksUpsertInput,
  IBookmarksController,
} from '@sca/trpc-api';

import { AppCommandBus } from '../../../cqrs/command-bus.service';
import { AppQueryBus } from '../../../cqrs/query-bus.service';
import {
  CreateBookmarkCommand,
  CreateBookmarkCommandHandler,
} from '../commands/create-bookmark.command';
import {
  DeleteBookmarkCommand,
  DeleteBookmarkCommandHandler,
} from '../commands/delete-bookmark.command';
import {
  UpsertBookmarkCommand,
  UpsertBookmarkCommandHandler,
} from '../commands/upsert-bookmark.command';
import {
  GetBookmarkByIdQuery,
  GetBookmarkByIdQueryHandler,
} from '../queries/get-bookmark-by-id.query';
import {
  ListBookmarksQuery,
  ListBookmarksQueryHandler,
} from '../queries/list-bookmarks.query';

@Injectable()
export class BookmarksTRPCController implements IBookmarksController {
  constructor(
    private readonly commandBus: AppCommandBus,
    private readonly queryBus: AppQueryBus
  ) {}

  async create(input: BookmarksCreateInput): Promise<BookmarksCreateOutput> {
    return {
      id: await this.commandBus.execute<CreateBookmarkCommandHandler>(
        new CreateBookmarkCommand({ entity: input })
      ),
    };
  }

  async delete(input: BookmarksGetByIdInput): Promise<void> {
    await this.commandBus.execute<DeleteBookmarkCommandHandler>(
      new DeleteBookmarkCommand(input)
    );
  }

  getById(input: BookmarksGetByIdInput): Promise<BookmarksGetByIdOutput> {
    return this.queryBus.execute<GetBookmarkByIdQueryHandler>(
      new GetBookmarkByIdQuery(input.id)
    );
  }

  async list(input: BookmarksListInput): Promise<BookmarksListOutput> {
    const queryResult = await this.queryBus.execute<ListBookmarksQueryHandler>(
      new ListBookmarksQuery(input)
    );
    return {
      items: queryResult.items,
      totalCount: queryResult.totalCount,
    };
  }

  async upsert(input: BookmarksUpsertInput): Promise<void> {
    const { id, ...entity } = input;
    await this.commandBus.execute<UpsertBookmarkCommandHandler>(
      new UpsertBookmarkCommand({ entity, id })
    );
  }
}
