import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessGraphDashboardComponent } from './access-graph-dashboard/access-graph-dashboard.component';
import { AccessGraphService } from './access-graph.service';
import { AccessControlGuard } from './access-control.guard';

@NgModule({
  declarations: [
    AccessGraphDashboardComponent
  ],
  imports: [
    CommonModule
  ],
  providers: [
    AccessGraphService,
    AccessControlGuard
  ],
  exports: [
    AccessGraphDashboardComponent
  ]
})
export class AccessGraphModule { }
