# Access Graph Integration Guide

## Overview

The Access Graph system provides a comprehensive role-based access control (RBAC) framework for your Angular e-commerce application. It manages three key components:
- **Identities**: Users (Customers, Sellers, Admins)
- **Roles**: Collections of permissions (Customer, Seller, Admin roles)
- **Resources**: System features that need access control (Products, Orders, Analytics, etc.)

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Access Graph                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Identities ──→ Roles ──→ Permissions ──→ Resources         │
│  (Users)        (Admin,   (Create,       (Products,         │
│                 Seller,   Read, Update,  Orders, etc.)      │
│                 Customer) Delete)                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Service Layer

- **AccessGraphService**: Core service managing the access graph state
- **AccessControlGuard**: Route guard for checking permissions
- **Access-graph.types.ts**: TypeScript interfaces and enums

---

## How It Works

### 1. Default Setup

The system initializes with three default roles:

#### Customer Role
- **Permissions**: READ, CREATE, UPDATE
- **Resources**: 
  - PRODUCTS (browse catalog)
  - CART (manage cart)
  - ORDERS (view own orders)
  - PAYMENTS (make payments)
  - USER_PROFILE (manage profile)

#### Seller Role
- **Permissions**: READ, CREATE, UPDATE, DELETE, MANAGE
- **Resources**:
  - PRODUCTS (add/edit own products)
  - ORDERS (view orders for own products)
  - SELLER_DASHBOARD (view analytics)
  - SHOP_SETTINGS (configure shop)
  - ANALYTICS (detailed reports)
  - USER_PROFILE

#### Admin Role
- **Permissions**: CREATE, READ, UPDATE, DELETE, MANAGE
- **Resources**: ALL (full system access)

---

## Integration Steps

### Step 1: Import AccessGraphModule

Already done in `app.module.ts`:
```typescript
import { AccessGraphModule } from './access-graph/access-graph.module';

@NgModule({
  imports: [
    // ... other imports
    AccessGraphModule
  ]
})
export class AppModule { }
```

### Step 2: Add Access Graph Dashboard Route

Update `app-routing.module.ts`:

```typescript
import { AccessGraphDashboardComponent } from './access-graph/access-graph-dashboard/access-graph-dashboard.component';

const routes: Routes = [
  // ... existing routes
  {
    path: 'access-graph-dashboard',
    component: AccessGraphDashboardComponent,
    // Optional: Add guard if you want to restrict admin access
  }
];
```

### Step 3: Protect Routes with Access Control

Update your routes to require specific permissions:

```typescript
import { AccessControlGuard } from './access-graph/access-control.guard';
import { ResourceType, Permission } from './access-graph/access-graph.types';

const routes: Routes = [
  {
    path: 'seller-home',
    component: SellerHomeComponent,
    canActivate: [AccessControlGuard],
    data: {
      resource: ResourceType.SELLER_DASHBOARD,
      permissions: [Permission.READ]
    }
  },
  {
    path: 'cart',
    component: CartPageComponent,
    canActivate: [AccessControlGuard],
    data: {
      resource: ResourceType.CART,
      permissions: [Permission.READ, Permission.UPDATE]
    }
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [AccessControlGuard],
    data: {
      resource: ResourceType.PAYMENTS,
      permissions: [Permission.CREATE]
    }
  }
];
```

### Step 4: Use in Components

#### Check Access Programmatically

```typescript
import { AccessGraphService } from './access-graph/access-graph.service';
import { Permission, ResourceType } from './access-graph/access-graph.types';

export class MyComponent {
  constructor(private accessGraphService: AccessGraphService) {}

  canDeleteProduct(): boolean {
    const identityId = 'identity-' + this.currentUserId;
    const result = this.accessGraphService.checkAccess(
      identityId,
      'res-products',
      [Permission.DELETE]
    );
    return result.allowed;
  }
}
```

#### Get User Permissions

```typescript
getMyPermissions(): Map<string, Permission[]> {
  const identityId = 'identity-' + this.currentUserId;
  return this.accessGraphService.getIdentityPermissions(identityId);
}
```

#### Watch Access Graph Changes

```typescript
ngOnInit() {
  this.accessGraphService.accessGraph$.subscribe(graph => {
    console.log('Access graph updated:', graph);
    // Update your UI based on access changes
  });
}
```

---

## Using the Access Graph Dashboard

Add a navigation link in your header/navigation:

```html
<a routerLink="/access-graph-dashboard" class="nav-link">
  <i class="fas fa-shield-alt"></i> Access Graph
</a>
```

The dashboard provides:
- **Graph View**: Visual representation of identities, roles, and resources
- **Table View**: Detailed table of identities and their permissions
- **Summary Stats**: Overview of system configuration
- **Export**: Download access graph as JSON

---

## Advanced Usage

### Custom Roles

Add new roles programmatically:

```typescript
const newRole: Role = {
  id: 'role-moderator',
  name: 'moderator',
  display: 'Moderator',
  description: 'Manage user content and reports',
  permissions: [Permission.READ, Permission.UPDATE, Permission.DELETE],
  resources: [ResourceType.PRODUCTS, ResourceType.ORDERS],
  identityTypes: [IdentityType.ADMIN]
};

// Add role to access graph
const graph = this.accessGraphService.getAccessGraph();
if (graph) {
  graph.roles.push(newRole);
}
```

### Custom Resources

Add new resources:

```typescript
const newResource: Resource = {
  id: 'res-inventory',
  name: 'Inventory Management',
  type: ResourceType.ANALYTICS, // or create new ResourceType
  description: 'Manage stock levels'
};

// Add to access graph
const graph = this.accessGraphService.getAccessGraph();
if (graph) {
  graph.resources.push(newResource);
}
```

### Access Conditions

Add time-based or IP-based access restrictions:

```typescript
const conditionalRule: AccessRule = {
  id: 'rule-temp-admin',
  identityId: 'identity-123',
  resourceId: 'res-admin-panel',
  permissions: [Permission.MANAGE],
  roleId: 'role-admin',
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  conditions: [
    {
      type: 'TIME_BASED',
      value: { start: '09:00', end: '17:00' },
      description: 'Business hours only'
    }
  ]
};
```

### Export and Backup

Export the entire access graph:

```typescript
export() {
  const json = this.accessGraphService.exportAccessGraph();
  // Save to file or send to server
}

import(jsonData: string) {
  const success = this.accessGraphService.importAccessGraph(jsonData);
  if (success) {
    console.log('Access graph imported successfully');
  }
}
```

---

## Integration with Existing Services

### Update UserService

```typescript
export class UserService {
  constructor(
    private http: HttpClient,
    private router: Router,
    private accessGraph: AccessGraphService
  ) {}

  userLogin(data: login) {
    this.http.get<signUp[]>(`...`)
      .subscribe((result) => {
        if (result && result.body?.length) {
          localStorage.setItem('user', JSON.stringify(result.body[0]));
          
          // Register in access graph
          const identity: Identity = {
            id: `identity-${result.body[0].id}`,
            name: result.body[0].name,
            type: IdentityType.CUSTOMER,
            email: result.body[0].email
          };
          this.accessGraph.registerIdentity(identity);
          this.accessGraph.assignRoleToIdentity(identity.id, 'role-customer');
          
          this.router.navigate(['/']);
        }
      });
  }
}
```

### Update SellerService

```typescript
export class SellerService {
  constructor(
    private http: HttpClient,
    private router: Router,
    private accessGraph: AccessGraphService
  ) {}

  userLogin(data: login) {
    this.http.get(`...`)
      .subscribe((result: any) => {
        if (result && result.body && result.body.length === 1) {
          localStorage.setItem('seller', JSON.stringify(result.body[0]));
          
          // Register in access graph
          const identity: Identity = {
            id: `identity-${result.body[0].id}`,
            name: result.body[0].name,
            type: IdentityType.SELLER,
            email: result.body[0].email
          };
          this.accessGraph.registerIdentity(identity);
          this.accessGraph.assignRoleToIdentity(identity.id, 'role-seller');
          
          this.router.navigate(['seller-home']);
        }
      });
  }
}
```

---

## Database Integration (Future Enhancement)

To persist access graph data, store it in your backend:

```typescript
// In a future backend service
export class AccessGraphBackendService {
  constructor(private http: HttpClient) {}

  saveAccessGraph(graph: AccessGraph): Observable<any> {
    return this.http.post('/api/access-graph', graph);
  }

  loadAccessGraph(): Observable<AccessGraph> {
    return this.http.get<AccessGraph>('/api/access-graph');
  }

  createAccessRule(rule: AccessRule): Observable<any> {
    return this.http.post('/api/access-graph/rules', rule);
  }

  deleteAccessRule(ruleId: string): Observable<any> {
    return this.http.delete(`/api/access-graph/rules/${ruleId}`);
  }
}
```

---

## Best Practices

1. **Always check permissions** before displaying UI elements or allowing actions
2. **Use guards on protected routes** to prevent unauthorized access
3. **Log access attempts** for audit trails (implement with backend)
4. **Regularly review access rules** and remove outdated permissions
5. **Use meaningful role names** that reflect business responsibilities
6. **Test access control thoroughly** across different user types
7. **Export and backup** access graph configuration regularly
8. **Monitor denied access** for potential security issues

---

## Troubleshooting

### Issue: "Access graph not initialized"
- Ensure AccessGraphModule is imported in AppModule
- Verify AccessGraphService is provided

### Issue: "No access rules found"
- Register the identity using `registerIdentity()`
- Assign a role using `assignRoleToIdentity()`
- Verify the resource exists in the access graph

### Issue: Route access denied
- Check that the correct ResourceType is used in route data
- Verify permissions match what the role grants
- Check localStorage for user/seller data

### Debug Access

```typescript
// Log current access graph
console.log(this.accessGraphService.getAccessGraph());

// Log access check result
const result = this.accessGraphService.checkAccess(id, resource, perms);
console.log('Access check:', result);

// Log user permissions
const perms = this.accessGraphService.getIdentityPermissions(id);
console.log('Permissions:', perms);
```

---

## Next Steps

1. Add access graph dashboard to your admin panel
2. Integrate with your backend API for persistence
3. Implement audit logging
4. Add custom roles based on your business needs
5. Consider time-based access restrictions
6. Implement access request workflows

For AWS IAM integration, see the separate [AWS IAM Integration Guide](./AWS_IAM_INTEGRATION.md).
