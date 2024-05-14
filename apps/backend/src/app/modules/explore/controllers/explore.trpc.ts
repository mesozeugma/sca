import { Injectable } from '@nestjs/common';
import {
  ExploreClassInput,
  ExploreClassOutput,
  ExplorePackageInput,
  ExplorePackageOutput,
  IExploreController,
} from '@sca/trpc-api';

import { AppQueryBus } from '../../../cqrs/query-bus.service';
import {
  ExploreClassQuery,
  ExploreClassQueryHandler,
} from '../queries/explore-class.query';
import {
  ExplorePackageQuery,
  ExplorePackageQueryHandler,
} from '../queries/explore-package.query';

@Injectable()
export class ExploreTRPCController implements IExploreController {
  constructor(private readonly queryBus: AppQueryBus) {}

  async class(input: ExploreClassInput): Promise<ExploreClassOutput> {
    const { items, totalCount } =
      await this.queryBus.execute<ExploreClassQueryHandler>(
        new ExploreClassQuery(input)
      );
    return {
      items,
      totalCount,
    };
  }

  async package(input: ExplorePackageInput): Promise<ExplorePackageOutput> {
    const { items, totalCount } =
      await this.queryBus.execute<ExplorePackageQueryHandler>(
        new ExplorePackageQuery(input)
      );
    return {
      items,
      totalCount,
    };
  }
}
