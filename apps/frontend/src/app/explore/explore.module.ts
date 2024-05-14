import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { MaterialModule } from '../material/material.module';

import { ExploreRoutingModule } from './explore-routing.module';
import { ExploreComponent } from './explore.component';
import { ClassExplorerComponent } from './pages/class-explorer/class-explorer.component';
import { PackageExplorerComponent } from './pages/package-explorer/package-explorer.component';

@NgModule({
  declarations: [
    ExploreComponent,
    PackageExplorerComponent,
    ClassExplorerComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    ExploreRoutingModule,
  ],
})
export class ExploreModule {}
