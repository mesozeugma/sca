import { Module } from '@nestjs/common';

import { AppCqrsModule } from '../../cqrs/cqrs.module';
import { OpensearchModule } from '../opensearch/opensearch.module';

import { CreateBookmarkCommandHandler } from './commands/create-bookmark.command';
import { DeleteBookmarkCommandHandler } from './commands/delete-bookmark.command';
import { UpsertBookmarkCommandHandler } from './commands/upsert-bookmark.command';
import { BookmarksTRPCController } from './controllers/bookmarks.trpc';
import { GetBookmarkByIdQueryHandler } from './queries/get-bookmark-by-id.query';
import { ListBookmarksQueryHandler } from './queries/list-bookmarks.query';

const CommandHandlers = [
  CreateBookmarkCommandHandler,
  DeleteBookmarkCommandHandler,
  UpsertBookmarkCommandHandler,
] as const;

const QueryHandlers = [
  GetBookmarkByIdQueryHandler,
  ListBookmarksQueryHandler,
] as const;

@Module({
  exports: [BookmarksTRPCController],
  imports: [AppCqrsModule, OpensearchModule],
  providers: [...CommandHandlers, ...QueryHandlers, BookmarksTRPCController],
})
export class BookmarksModule {}
