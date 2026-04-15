import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  AccessGraph,
  AccessRule,
  AccessCheckResult,
  Identity,
  Resource,
  Role,
  IdentityType,
  ResourceType,
  Permission,
  AccessGraphNode,
  AccessGraphEdge
} from './access-graph.types';

@Injectable({
  providedIn: 'root'
})
export class AccessGraphService {
  private accessGraphSubject = new BehaviorSubject<AccessGraph | null>(null);
  public accessGraph$ = this.accessGraphSubject.asObservable();

  constructor() {
    this.initializeDefaultAccessGraph();
  }

  /**
   * Initialize the default access graph with predefined roles and resources
   */
  private initializeDefaultAccessGraph(): void {
    const graph: AccessGraph = {
      identities: [],
      resources: this.createDefaultResources(),
      roles: this.createDefaultRoles(),
      accessRules: [],
      version: '1.0.0',
      lastUpdated: new Date()
    };
    this.accessGraphSubject.next(graph);
  }

  /**
   * Create default resources for the e-commerce system
   */
  private createDefaultResources(): Resource[] {
    return [
      {
        id: 'res-products',
        name: 'Products Catalog',
        type: ResourceType.PRODUCTS,
        description: 'Browse and view products'
      },
      {
        id: 'res-cart',
        name: 'Shopping Cart',
        type: ResourceType.CART,
        description: 'Manage shopping cart'
      },
      {
        id: 'res-orders',
        name: 'Orders',
        type: ResourceType.ORDERS,
        description: 'View and manage orders'
      },
      {
        id: 'res-payments',
        name: 'Payments',
        type: ResourceType.PAYMENTS,
        description: 'Process and manage payments'
      },
      {
        id: 'res-profile',
        name: 'User Profile',
        type: ResourceType.USER_PROFILE,
        description: 'Manage user profile information'
      },
      {
        id: 'res-seller-dashboard',
        name: 'Seller Dashboard',
        type: ResourceType.SELLER_DASHBOARD,
        description: 'Seller business analytics'
      },
      {
        id: 'res-shop-settings',
        name: 'Shop Settings',
        type: ResourceType.SHOP_SETTINGS,
        description: 'Manage shop configuration'
      },
      {
        id: 'res-analytics',
        name: 'Analytics',
        type: ResourceType.ANALYTICS,
        description: 'View analytics and reports'
      },
      {
        id: 'res-admin-panel',
        name: 'Admin Panel',
        type: ResourceType.ADMIN_PANEL,
        description: 'System administration'
      },
      {
        id: 'res-users-management',
        name: 'Users Management',
        type: ResourceType.USERS_MANAGEMENT,
        description: 'Manage users and roles'
      }
    ];
  }

  /**
   * Create default roles for different user types
   */
  private createDefaultRoles(): Role[] {
    return [
      {
        id: 'role-customer',
        name: 'customer',
        display: 'Customer',
        description: 'Regular customer with basic e-commerce access',
        permissions: [Permission.READ, Permission.CREATE, Permission.UPDATE],
        resources: [
          ResourceType.PRODUCTS,
          ResourceType.CART,
          ResourceType.ORDERS,
          ResourceType.PAYMENTS,
          ResourceType.USER_PROFILE
        ],
        identityTypes: [IdentityType.CUSTOMER]
      },
      {
        id: 'role-seller',
        name: 'seller',
        display: 'Seller',
        description: 'Seller with product and shop management',
        permissions: [
          Permission.READ,
          Permission.CREATE,
          Permission.UPDATE,
          Permission.DELETE,
          Permission.MANAGE
        ],
        resources: [
          ResourceType.PRODUCTS,
          ResourceType.ORDERS,
          ResourceType.SELLER_DASHBOARD,
          ResourceType.SHOP_SETTINGS,
          ResourceType.ANALYTICS,
          ResourceType.USER_PROFILE
        ],
        identityTypes: [IdentityType.SELLER]
      },
      {
        id: 'role-admin',
        name: 'admin',
        display: 'Administrator',
        description: 'Full system access',
        permissions: [
          Permission.CREATE,
          Permission.READ,
          Permission.UPDATE,
          Permission.DELETE,
          Permission.MANAGE
        ],
        resources: [
          ResourceType.PRODUCTS,
          ResourceType.CART,
          ResourceType.ORDERS,
          ResourceType.PAYMENTS,
          ResourceType.USER_PROFILE,
          ResourceType.SELLER_DASHBOARD,
          ResourceType.SHOP_SETTINGS,
          ResourceType.ANALYTICS,
          ResourceType.ADMIN_PANEL,
          ResourceType.USERS_MANAGEMENT
        ],
        identityTypes: [IdentityType.ADMIN]
      }
    ];
  }

  /**
   * Register a new identity in the access graph
   */
  registerIdentity(identity: Identity): void {
    const graph = this.accessGraphSubject.value;
    if (graph) {
      graph.identities.push(identity);
      graph.lastUpdated = new Date();
      this.accessGraphSubject.next(graph);
    }
  }

  /**
   * Assign a role to an identity
   */
  assignRoleToIdentity(identityId: string, roleId: string): void {
    const graph = this.accessGraphSubject.value;
    if (!graph) return;

    const role = graph.roles.find(r => r.id === roleId);
    const identity = graph.identities.find(i => i.id === identityId);

    if (role && identity) {
      // Create access rules for this role
      role.resources.forEach(resourceType => {
        const resource = graph.resources.find(r => r.type === resourceType);
        if (resource) {
          const rule: AccessRule = {
            id: `rule-${identityId}-${resource.id}`,
            identityId,
            resourceId: resource.id,
            permissions: role.permissions,
            roleId,
            createdAt: new Date()
          };
          // Check if rule already exists
          if (!graph.accessRules.find(r => r.id === rule.id)) {
            graph.accessRules.push(rule);
          }
        }
      });
      graph.lastUpdated = new Date();
      this.accessGraphSubject.next(graph);
    }
  }

  /**
   * Check if an identity has access to a resource with specific permissions
   */
  checkAccess(
    identityId: string,
    resourceId: string,
    requiredPermissions: Permission[]
  ): AccessCheckResult {
    const graph = this.accessGraphSubject.value;
    if (!graph) {
      return {
        allowed: false,
        reason: 'Access graph not initialized',
        permissions: [],
        appliedRules: []
      };
    }

    const applicableRules = graph.accessRules.filter(
      rule => rule.identityId === identityId && rule.resourceId === resourceId
    );

    if (applicableRules.length === 0) {
      return {
        allowed: false,
        reason: 'No access rules found for identity and resource',
        permissions: [],
        appliedRules: []
      };
    }

    // Check if all required permissions are granted
    const grantedPermissions = new Set<Permission>();
    applicableRules.forEach(rule => {
      rule.permissions.forEach(perm => grantedPermissions.add(perm));
    });

    const hasAllPermissions = requiredPermissions.every(perm => grantedPermissions.has(perm));

    return {
      allowed: hasAllPermissions,
      reason: hasAllPermissions
        ? 'Access granted'
        : `Missing permissions: ${requiredPermissions.filter(p => !grantedPermissions.has(p)).join(', ')}`,
      permissions: Array.from(grantedPermissions),
      appliedRules: applicableRules
    };
  }

  /**
   * Get all permissions for an identity
   */
  getIdentityPermissions(identityId: string): Map<string, Permission[]> {
    const graph = this.accessGraphSubject.value;
    const permissions = new Map<string, Permission[]>();

    if (graph) {
      const rules = graph.accessRules.filter(r => r.identityId === identityId);
      rules.forEach(rule => {
        const resource = graph.resources.find(r => r.id === rule.resourceId);
        if (resource) {
          permissions.set(resource.type, rule.permissions);
        }
      });
    }

    return permissions;
  }

  /**
   * Get all identities with access to a resource
   */
  getIdentitiesWithResourceAccess(resourceId: string): Identity[] {
    const graph = this.accessGraphSubject.value;
    if (!graph) return [];

    const identityIds = graph.accessRules
      .filter(rule => rule.resourceId === resourceId)
      .map(rule => rule.identityId);

    return graph.identities.filter(i => identityIds.includes(i.id));
  }

  /**
   * Generate visualization nodes and edges for the access graph
   */
  generateVisualizationData(): { nodes: AccessGraphNode[]; edges: AccessGraphEdge[] } {
    const graph = this.accessGraphSubject.value;
    const nodes: AccessGraphNode[] = [];
    const edges: AccessGraphEdge[] = [];

    if (!graph) return { nodes, edges };

    // Add identity nodes
    graph.identities.forEach(identity => {
      nodes.push({
        id: `identity-${identity.id}`,
        label: identity.name,
        type: 'identity',
        data: identity
      });
    });

    // Add role nodes
    graph.roles.forEach(role => {
      nodes.push({
        id: `role-${role.id}`,
        label: role.display,
        type: 'role',
        data: role
      });
    });

    // Add resource nodes
    graph.resources.forEach(resource => {
      nodes.push({
        id: `resource-${resource.id}`,
        label: resource.name,
        type: 'resource',
        data: resource
      });
    });

    // Add edges for access rules
    graph.accessRules.forEach((rule, index) => {
      const identity = graph.identities.find(i => i.id === rule.identityId);
      const resource = graph.resources.find(r => r.id === rule.resourceId);
      const role = graph.roles.find(r => r.id === rule.roleId);

      if (identity && resource && role) {
        // Edge from identity to role
        edges.push({
          id: `edge-identity-role-${index}`,
          source: `identity-${identity.id}`,
          target: `role-${role.id}`,
          label: 'has role',
          type: 'assignment'
        });

        // Edge from role to resource with permissions
        edges.push({
          id: `edge-role-resource-${index}`,
          source: `role-${role.id}`,
          target: `resource-${resource.id}`,
          label: rule.permissions.join(', '),
          type: 'access',
          permissions: rule.permissions
        });
      }
    });

    return { nodes, edges };
  }

  /**
   * Export access graph as JSON
   */
  exportAccessGraph(): string {
    const graph = this.accessGraphSubject.value;
    return JSON.stringify(graph, null, 2);
  }

  /**
   * Import access graph from JSON
   */
  importAccessGraph(json: string): boolean {
    try {
      const graph: AccessGraph = JSON.parse(json);
      this.accessGraphSubject.next(graph);
      return true;
    } catch (error) {
      console.error('Failed to import access graph:', error);
      return false;
    }
  }

  /**
   * Get current access graph
   */
  getAccessGraph(): AccessGraph | null {
    return this.accessGraphSubject.value;
  }

  /**
   * Get specific role
   */
  getRole(roleId: string): Role | undefined {
    return this.accessGraphSubject.value?.roles.find(r => r.id === roleId);
  }

  /**
   * Get specific resource
   */
  getResource(resourceId: string): Resource | undefined {
    return this.accessGraphSubject.value?.resources.find(r => r.id === resourceId);
  }

  /**
   * Get specific identity
   */
  getIdentity(identityId: string): Identity | undefined {
    return this.accessGraphSubject.value?.identities.find(i => i.id === identityId);
  }
}
