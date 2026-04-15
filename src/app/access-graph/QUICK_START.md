# Quick Start: Access Graph in 5 Minutes

## What is Access Graph?

Access Graph manages **who can do what on which resources** in your e-commerce app:
- **Identities**: Users (Customers, Sellers, Admins)
- **Roles**: Bundles of permissions (Customer, Seller, Admin)
- **Resources**: Features to protect (Products, Orders, Analytics)
- **Permissions**: Actions allowed (Read, Create, Update, Delete)

## Pre-configured Roles

### 🛒 Customer
- **Can**: Browse products, manage cart, place orders, view own orders
- **Cannot**: Delete products, access seller dashboard, manage other users

### 🏪 Seller
- **Can**: Add/edit products, view sales analytics, manage shop settings
- **Cannot**: Delete other sellers' products, access admin panel, manage users

### 🔐 Admin
- **Can**: Everything - full system access
- **Cannot**: Nothing (except what you explicitly deny)

---

## Using in Your Routes

### Step 1: Protect Routes
```typescript
import { AccessControlGuard } from './access-graph/access-control.guard';
import { ResourceType, Permission } from './access-graph/access-graph.types';

// In your app-routing.module.ts
const routes: Routes = [
  {
    path: 'products',
    component: HomeComponent,
    canActivate: [AccessControlGuard],
    data: { 
      resource: ResourceType.PRODUCTS,
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
    path: 'seller-home',
    component: SellerHomeComponent,
    canActivate: [AccessControlGuard],
    data: {
      resource: ResourceType.SELLER_DASHBOARD,
      permissions: [Permission.READ]
    }
  }
];
```

### Step 2: Access Graph Dashboard
Add this route to view and manage access:
```typescript
{
  path: 'access-graph-dashboard',
  component: AccessGraphDashboardComponent
}
```

Then add navigation link:
```html
<a routerLink="/access-graph-dashboard" class="nav-link">
  Access Control
</a>
```

---

## Using in Components

### Check if user can perform action
```typescript
import { AccessGraphService } from './access-graph/access-graph.service';
import { Permission } from './access-graph/access-graph.types';

export class ProductComponent {
  constructor(private accessGraph: AccessGraphService) {}

  canDeleteProduct(): boolean {
    const userId = this.getCurrentUserId();
    const result = this.accessGraph.checkAccess(
      `identity-${userId}`,
      'res-products',
      [Permission.DELETE]
    );
    return result.allowed;
  }

  // Use in template
  onProductDelete() {
    if (this.canDeleteProduct()) {
      // Delete product
    } else {
      alert('You do not have permission to delete products');
    }
  }
}
```

### Get user permissions
```typescript
showDeleteButton(): boolean {
  const userId = this.getCurrentUserId();
  const permissions = this.accessGraph.getIdentityPermissions(`identity-${userId}`);
  return permissions.has('PRODUCTS') && 
         permissions.get('PRODUCTS')?.includes(Permission.DELETE);
}
```

### Hide/Show UI based on permissions
```html
<button *ngIf="canDeleteProduct()" (click)="deleteProduct()">
  Delete
</button>

<div *ngIf="hasRole('SELLER')">
  <a routerLink="/seller-home">Seller Dashboard</a>
</div>

<div *ngIf="hasRole('ADMIN')">
  <a routerLink="/admin-panel">Admin Panel</a>
</div>
```

---

## Common Scenarios

### How does a new customer get access?
1. Customer signs up
2. System creates Identity with type CUSTOMER
3. System assigns CUSTOMER role to identity
4. Customer automatically has access to: Products, Cart, Orders, Payments, Profile

### How does a seller get promoted to admin?
```typescript
// In your admin service
promoteToAdmin(sellerId: string) {
  const graph = this.accessGraph.getAccessGraph();
  const identity = graph?.identities.find(i => i.id === `identity-${sellerId}`);
  
  if (identity) {
    identity.type = IdentityType.ADMIN;
    // Assign admin role
    this.accessGraph.assignRoleToIdentity(identity.id, 'role-admin');
  }
}
```

### How to temporarily give seller access to analytics?
```typescript
// Temporarily grant access to analytics (expires in 7 days)
const tempRule: AccessRule = {
  id: `rule-temp-analytics-${sellerId}`,
  identityId: `identity-${sellerId}`,
  resourceId: 'res-analytics',
  permissions: [Permission.READ],
  roleId: 'role-seller',
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
};
```

---

## Dashboard Features

### 📊 Table View
See all users, their roles, and exact permissions

### 📈 Graph View  
Visual network showing relationships between:
- Identities → Roles → Resources

### 📋 Summary Stats
- Total users (identities)
- Total roles configured
- Total resources protected
- Total active access rules

### 💾 Export
Download access graph as JSON for backup

---

## What to Do Next

1. ✅ Routes are auto-protected with `AccessControlGuard`
2. ✅ Dashboard is available at `/access-graph-dashboard`
3. 🔄 Update your components to show/hide based on permissions
4. 🔒 Test different user types (Customer, Seller, Admin)
5. 📊 Review dashboard to see access structure
6. 💡 Consider AWS IAM future integration (see `AWS_IAM_INTEGRATION.md`)

---

## Debugging

### Check if access is working:
```typescript
// In browser console
const graph = JSON.parse(localStorage.getItem('__accessGraph'));
console.log('Current access graph:', graph);

// Test access check
const service = ng.probe(document.querySelector('app-root')).injector.get('AccessGraphService');
service.checkAccess('identity-123', 'res-products', ['READ']);
```

### Common issues:

| Problem | Solution |
|---------|----------|
| Route always denies access | Check browser localStorage for user data |
| Dashboard shows no users | New users auto-register on first route access |
| Permissions not updating | Service notifies via accessGraph$ observable |

---

## Example: Complete Setup

### 1. Update app-routing.module.ts
```typescript
import { AccessControlGuard } from './access-graph/access-control.guard';
import { ResourceType, Permission } from './access-graph/access-graph.types';
import { AccessGraphDashboardComponent } from './access-graph/access-graph-dashboard/access-graph-dashboard.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  
  {
    path: 'products',
    component: ProductDetailsComponent,
    canActivate: [AccessControlGuard],
    data: { resource: ResourceType.PRODUCTS, permissions: [Permission.READ] }
  },
  
  {
    path: 'cart',
    component: CartPageComponent,
    canActivate: [AccessControlGuard],
    data: { resource: ResourceType.CART, permissions: [Permission.READ, Permission.UPDATE] }
  },
  
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [AccessControlGuard],
    data: { resource: ResourceType.PAYMENTS, permissions: [Permission.CREATE] }
  },
  
  {
    path: 'my-orders',
    component: MyOrdersComponent,
    canActivate: [AccessControlGuard],
    data: { resource: ResourceType.ORDERS, permissions: [Permission.READ] }
  },
  
  {
    path: 'seller-home',
    component: SellerHomeComponent,
    canActivate: [AccessControlGuard],
    data: { resource: ResourceType.SELLER_DASHBOARD, permissions: [Permission.READ] }
  },
  
  {
    path: 'access-graph-dashboard',
    component: AccessGraphDashboardComponent
  }
];
```

### 2. Test in browser
1. Sign up as customer
2. Navigate to `/products` ✅ (has READ on PRODUCTS)
3. Try to access `/seller-home` ❌ (no SELLER_DASHBOARD access)
4. Go to `/access-graph-dashboard` to see your access rights

---

## Resources

- Full guide: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- AWS integration: [AWS_IAM_INTEGRATION.md](./AWS_IAM_INTEGRATION.md)
- Type definitions: [access-graph.types.ts](./access-graph.types.ts)
- Service API: [access-graph.service.ts](./access-graph.service.ts)

---

**That's it!** Your e-commerce app now has enterprise-grade access control. 🎉
