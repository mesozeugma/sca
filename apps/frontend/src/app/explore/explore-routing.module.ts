import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ExploreComponent } from './explore.component';
import { ClassExplorerComponent } from './pages/class-explorer/class-explorer.component';
import { PackageExplorerComponent } from './pages/package-explorer/package-explorer.component';

const routes: Routes = [
  { path: 'class', component: ClassExplorerComponent },
  { path: 'package', component: PackageExplorerComponent },
  { path: '', component: ExploreComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ExploreRoutingModule {}
