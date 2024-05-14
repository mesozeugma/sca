import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MultiSelectVisualizationComponent } from './pages/multi-select-visualization/multi-select-visualization.component';
import { SideBySideVisualizationComponent } from './pages/side-by-side-visualization/side-by-side-visualization.component';
import { VisualizationsComponent } from './visualizations.component';

const routes: Routes = [
  { path: '', component: VisualizationsComponent },
  {
    path: 'multi-select',
    component: MultiSelectVisualizationComponent,
  },
  {
    path: 'side-by-side',
    component: SideBySideVisualizationComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VisualizationsRoutingModule {}
