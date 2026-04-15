/**
 * Access Graph Types - Define role-based access control (RBAC) data structures
 */

export enum IdentityType {
  CUSTOMER = 'CUSTOMER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN'
}

export enum ResourceType {
  PRODUCTS = 'PRODUCTS',
  CART = 'CART',
  ORDERS = 'ORDERS',
  PAYMENTS = 'PAYMENTS',
  USER_PROFILE = 'USER_PROFILE',
  SELLER_DASHBOARD = 'SELLER_DASHBOARD',
  SHOP_SETTINGS = 'SHOP_SETTINGS',
  ANALYTICS = 'ANALYTICS',
  ADMIN_PANEL = 'ADMIN_PANEL',
  USERS_MANAGEMENT = 'USERS_MANAGEMENT'
}

export enum Permission {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MANAGE = 'MANAGE'
}

/**
 * Identity: Represents a user or service identity
 */
export interface Identity {
  id: string;
  name: string;
  type: IdentityType;
  email: string;
  metadata?: Record<string, any>;
}

/**
 * Resource: Represents a system resource that needs access control
 */
export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Role: A collection of permissions assigned to identities
 */
export interface Role {
  id: string;
  name: string;
  display: string;
  description?: string;
  permissions: Permission[];
  resources: ResourceType[];
  identityTypes: IdentityType[];
}

/**
 * AccessRule: Defines access from an Identity to a Resource with specific Permissions
 */
export interface AccessRule {
  id: string;
  identityId: string;
  resourceId: string;
  permissions: Permission[];
  roleId: string;
  createdAt: Date;
  expiresAt?: Date;
  conditions?: AccessCondition[];
}

/**
 * AccessCondition: Additional constraints on access (time-based, IP-based, etc.)
 */
export interface AccessCondition {
  type: 'TIME_BASED' | 'IP_BASED' | 'LOCATION_BASED' | 'CUSTOM';
  value: any;
  description?: string;
}

/**
 * AccessGraph: The complete graph structure
 */
export interface AccessGraph {
  identities: Identity[];
  resources: Resource[];
  roles: Role[];
  accessRules: AccessRule[];
  version: string;
  lastUpdated: Date;
}

/**
 * AccessGraphNode: For visualization
 */
export interface AccessGraphNode {
  id: string;
  label: string;
  type: 'identity' | 'role' | 'permission' | 'resource';
  data: any;
  x?: number;
  y?: number;
}

/**
 * AccessGraphEdge: For visualization
 */
export interface AccessGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
  permissions?: Permission[];
}

/**
 * AccessCheckResult: Result of access validation
 */
export interface AccessCheckResult {
  allowed: boolean;
  reason: string;
  permissions: Permission[];
  appliedRules: AccessRule[];
}
