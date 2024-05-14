import { INestApplication, Injectable, Logger } from '@nestjs/common';
import { TRPCContext, appRouter } from '@sca/trpc-api';
import { createExpressMiddleware } from '@trpc/server/adapters/express';

import { AuthService } from './modules/auth/auth.service';
import { BookmarksTRPCController } from './modules/bookmarks/controllers/bookmarks.trpc';
import { ExploreTRPCController } from './modules/explore/controllers/explore.trpc';
import { DashboardsTRPCController } from './modules/opensearch-dashboards/controllers/dashboards.trpc';
import { RepositoriesTRPCController } from './modules/repositories/controllers/repositories.trpc';
import { TasksTRPCController } from './modules/tasks/controllers/tasks.trpc';

@Injectable()
export class AppTRPCController {
  private readonly logger = new Logger(AppTRPCController.name);

  constructor(
    private readonly bookmarksTRPCController: BookmarksTRPCController,
    private readonly dashboardsTRPCController: DashboardsTRPCController,
    private readonly exploreTRPCController: ExploreTRPCController,
    private readonly repositoriesTRPCController: RepositoriesTRPCController,
    private readonly tasksTRPCController: TasksTRPCController,
    private readonly authService: AuthService
  ) {}

  init(app: INestApplication) {
    app.use(
      '/trpc',
      createExpressMiddleware({
        router: appRouter(
          this.bookmarksTRPCController,
          this.dashboardsTRPCController,
          this.exploreTRPCController,
          this.repositoriesTRPCController,
          this.tasksTRPCController,
          this.authService
        ),
        createContext: TRPCContext,
        onError: ({ error }) => {
          this.logger.error(
            'Error encountered during TRPC request',
            error.stack
          );
        },
      })
    );
  }
}
