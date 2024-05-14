import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { MaterialModule } from '../material/material.module';

import { MultiSelectVisualizationComponent } from './pages/multi-select-visualization/multi-select-visualization.component';
import { SideBySideVisualizationComponent } from './pages/side-by-side-visualization/side-by-side-visualization.component';
import { SafePipe } from './pipes/safe.pipe';
import { VisualizationsRoutingModule } from './visualizations-routing.module';
import { VisualizationsComponent } from './visualizations.component';

@NgModule({
  declarations: [
    VisualizationsComponent,
    MultiSelectVisualizationComponent,
    SideBySideVisualizationComponent,
    SafePipe,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    VisualizationsRoutingModule,
  ],
})
export class VisualizationsModule {}
