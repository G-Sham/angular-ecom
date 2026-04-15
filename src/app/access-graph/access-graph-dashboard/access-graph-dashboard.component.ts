import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccessGraphService } from '../access-graph.service';
import { AccessGraphNode, AccessGraphEdge, AccessGraph } from '../access-graph.types';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-access-graph-dashboard',
  templateUrl: './access-graph-dashboard.component.html',
  styleUrls: ['./access-graph-dashboard.component.css']
})
export class AccessGraphDashboardComponent implements OnInit, OnDestroy {
  nodes: AccessGraphNode[] = [];
  edges: AccessGraphEdge[] = [];
  accessGraph: AccessGraph | null = null;
  selectedNode: AccessGraphNode | null = null;
  selectedEdge: AccessGraphEdge | null = null;
  private destroy$ = new Subject<void>();

  // For table view
  displayMode: 'graph' | 'table' = 'table';
  identitiesWithPermissions: any[] = [];

  constructor(private accessGraphService: AccessGraphService) {}

  ngOnInit(): void {
    this.loadAccessGraph();
    this.accessGraphService.accessGraph$
      .pipe(takeUntil(this.destroy$))
      .subscribe(graph => {
        if (graph) {
          this.accessGraph = graph;
          this.generateVisualization();
          this.prepareTableData();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAccessGraph(): void {
    const graph = this.accessGraphService.getAccessGraph();
    if (graph) {
      this.accessGraph = graph;
      this.generateVisualization();
      this.prepareTableData();
    }
  }

  generateVisualization(): void {
    const { nodes, edges } = this.accessGraphService.generateVisualizationData();
    this.nodes = nodes;
    this.edges = edges;
  }

  prepareTableData(): void {
    if (!this.accessGraph) return;

    this.identitiesWithPermissions = this.accessGraph.identities.map(identity => {
      const permissions = this.accessGraphService.getIdentityPermissions(identity.id);
      const role = this.accessGraph!.roles.find(r => {
        const rule = this.accessGraph!.accessRules.find(
          rule => rule.identityId === identity.id && rule.roleId === r.id
        );
        return !!rule;
      });

      return {
        identity,
        role: role?.display || 'N/A',
        permissions: Array.from(permissions.entries()).map(([resource, perms]) => ({
          resource,
          permissions: perms.join(', ')
        }))
      };
    });
  }

  selectNode(node: AccessGraphNode): void {
    this.selectedNode = node;
    this.selectedEdge = null;
  }

  selectEdge(edge: AccessGraphEdge): void {
    this.selectedEdge = edge;
    this.selectedNode = null;
  }

  getNodeColor(node: AccessGraphNode): string {
    switch (node.type) {
      case 'identity':
        return '#4CAF50';
      case 'role':
        return '#2196F3';
      case 'resource':
        return '#FF9800';
      case 'permission':
        return '#9C27B0';
      default:
        return '#757575';
    }
  }

  getAccessSummary(): any {
    if (!this.accessGraph) return null;

    return {
      totalIdentities: this.accessGraph.identities.length,
      totalRoles: this.accessGraph.roles.length,
      totalResources: this.accessGraph.resources.length,
      totalAccessRules: this.accessGraph.accessRules.length
    };
  }

  exportGraph(): void {
    const jsonData = this.accessGraphService.exportAccessGraph();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonData));
    element.setAttribute('download', 'access-graph.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  getRoleColor(roleType: string): string {
    switch (roleType.toLowerCase()) {
      case 'admin':
        return '#f44336';
      case 'seller':
        return '#2196F3';
      case 'customer':
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  }

  toggleDisplayMode(mode: 'graph' | 'table'): void {
    this.displayMode = mode;
  }
}
