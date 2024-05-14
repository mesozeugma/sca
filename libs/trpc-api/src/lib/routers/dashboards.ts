import { z } from 'zod';

import { IAuthService } from '../services/auth.service';
import { publicProcedure, router } from '../trpc';

import { BaseRouter } from './base';

export interface DashboardsGetMultiSelectInputPanels {
  codeQuantity: boolean;
  codeQuality: boolean;
}
export interface DashboardsGetMultiSelectInput {
  from: Date;
  to: Date;
  repositories: string[];
  panels: DashboardsGetMultiSelectInputPanels;
}

export interface DashboardsGetSideBySideInputPanels {
  imports: boolean;
  sonarQube: boolean;
  symbols: boolean;
}
export interface DashboardsGetSideBySideInput {
  from: Date;
  to: Date;
  repository: string;
  repository2: string;
  panels: DashboardsGetSideBySideInputPanels;
}

const GetDashboardOutput = z
  .object({
    url: z.string(),
    height: z.number().int(),
  })
  .strict();
export interface DashboardsGetDashboardOutput {
  url: string;
  height: number;
}

export interface IDashboardsController {
  getMultiSelect(
    input: DashboardsGetMultiSelectInput
  ): Promise<DashboardsGetDashboardOutput>;
  getSideBySide(
    input: DashboardsGetSideBySideInput
  ): Promise<DashboardsGetDashboardOutput>;
}

export class DashboardsRouter extends BaseRouter {
  readonly instance = router({
    getSideBySide: publicProcedure
      .input(
        z
          .object({
            from: z.string().pipe(z.coerce.date()),
            to: z.string().pipe(z.coerce.date()),
            repository: z.string(),
            repository2: z.string(),
            panels: z
              .object({
                imports: z.boolean().default(false),
                sonarQube: z.boolean().default(false),
                symbols: z.boolean().default(false),
              })
              .strict(),
          })
          .strict()
      )
      .output(GetDashboardOutput)
      .query(({ input }) => {
        return this.controller.getSideBySide(input);
      }),
    getMultiSelect: publicProcedure
      .input(
        z
          .object({
            from: z.string().pipe(z.coerce.date()),
            to: z.string().pipe(z.coerce.date()),
            repositories: z.array(z.string()).min(1),
            panels: z
              .object({
                codeQuantity: z.boolean(),
                codeQuality: z.boolean(),
              })
              .strict(),
          })
          .strict()
      )
      .output(GetDashboardOutput)
      .query(({ input }) => {
        return this.controller.getMultiSelect(input);
      }),
  });

  constructor(
    private readonly controller: IDashboardsController,
    auth: IAuthService
  ) {
    super(auth);
  }
}
