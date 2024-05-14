import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

import { AdminRouter } from './routers/admin';
import { BookmarksRouter, IBookmarksController } from './routers/bookmarks';
import { DashboardsRouter, IDashboardsController } from './routers/dashboards';
import { ExploreRouter, IExploreController } from './routers/explore';
import {
  IRepositoriesController,
  RepositoriesRouter,
} from './routers/repositories';
import { ITasksController, TasksRouter } from './routers/tasks';
import { IAuthService } from './services/auth.service';
import { router } from './trpc';

export const appRouter = (
  bookmarksController: IBookmarksController,
  dashboardsController: IDashboardsController,
  exploreController: IExploreController,
  repositoriesController: IRepositoriesController,
  tasksController: ITasksController,
  auth: IAuthService
) =>
  router({
    admin: new AdminRouter(auth).instance,
    bookmarks: new BookmarksRouter(bookmarksController, auth).instance,
    dashboards: new DashboardsRouter(dashboardsController, auth).instance,
    explore: new ExploreRouter(exploreController, auth).instance,
    repositories: new RepositoriesRouter(repositoriesController, auth).instance,
    tasks: new TasksRouter(tasksController, auth).instance,
  });

export type AppRouter = ReturnType<typeof appRouter>;
export type AppRouterInputs = inferRouterInputs<AppRouter>;
export type AppRouterOutputs = inferRouterOutputs<AppRouter>;
