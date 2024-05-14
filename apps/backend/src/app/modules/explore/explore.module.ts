import { Module } from '@nestjs/common';

import { AppCqrsModule } from '../../cqrs/cqrs.module';
import { OpensearchModule } from '../opensearch/opensearch.module';

import { ExploreTRPCController } from './controllers/explore.trpc';
import { ExploreClassQueryHandler } from './queries/explore-class.query';
import { ExplorePackageQueryHandler } from './queries/explore-package.query';

const QueryHandlers = [
  ExploreClassQueryHandler,
  ExplorePackageQueryHandler,
] as const;

@Module({
  exports: [ExploreTRPCController],
  imports: [AppCqrsModule, OpensearchModule],
  providers: [...QueryHandlers, ExploreTRPCController],
})
export class ExploreModule {}
