# Access Graph Implementation for Angular E-Commerce

## 🎯 Overview

Your Angular e-commerce application now has an **enterprise-grade Role-Based Access Control (RBAC) system** with visual access graph dashboards. This system manages who can do what on which resources.

---

## ✅ What's Been Implemented

### 1. **Core Access Graph System**
- **Service**: `AccessGraphService` - Manages the entire access graph state
- **Guard**: `AccessControlGuard` - Protects routes based on permissions
- **Types**: Comprehensive TypeScript interfaces for type safety
- **Module**: `AccessGraphModule` - Feature module for easy integration

### 2. **Pre-configured Access Rules**

#### 👤 Customer Role
Access to:
- 📦 Products (Read)
- 🛒 Cart (Read, Create, Update)
- 📋 Orders (Read own orders)
- 💳 Payments (Create)
- 👤 User Profile (Read, Update)

#### 🏪 Seller Role
Access to:
- 📦 Products (Full CRUD support)
- 📊 Seller Dashboard (Read)
- 🏢 Shop Settings (Manage)
- 📈 Analytics (Read, Manage)
- 📋 Orders (Read related orders)
- 👤 User Profile

#### 🔐 Admin Role
- ✨ Full system access to all resources
- All permissions available

### 3. **Access Graph Dashboard**
Navigate to `/access-graph-dashboard` to see:
- **Graph View**: Visual network of identities, roles, and resources
- **Table View**: Detailed access matrix
- **Summary Stats**: Quick overview of the system
- **Export**: Download access graph configuration as JSON

### 4. **Documentation**
- `QUICK_START.md` - Get started in 5 minutes
- `INTEGRATION_GUIDE.md` - Complete integration reference
- `AWS_IAM_INTEGRATION.md` - AWS IAM setup for enterprise deployments

---

## 🚀 Quick Start

### View Your Access Graph
```bash
# The app is already integrated, just navigate to:
# http://localhost:4200/access-graph-dashboard
```

### Protect a Route
```typescript
import { AccessControlGuard } from './access-graph/access-control.guard';
import { ResourceType, Permission } from './access-graph/access-graph.types';

// In app-routing.module.ts
{
  path: 'seller-home',
  component: SellerHomeComponent,
  canActivate: [AccessControlGuard],
  data: {
    resource: ResourceType.SELLER_DASHBOARD,
    permissions: [Permission.READ]
  }
}
```

### Check Permissions in Component
```typescript
import { AccessGraphService } from './access-graph/access-graph.service';
import { Permission } from './access-graph/access-graph.types';

export class MyComponent {
  constructor(private acg: AccessGraphService) {}

  canDelete(): boolean {
    const result = this.acg.checkAccess(
      'identity-' + userId,
      'res-products',
      [Permission.DELETE]
    );
    return result.allowed;
  }
}
```

---

## 📁 File Structure

```
src/app/access-graph/
│
├── 📄 access-graph.types.ts           (Data types & interfaces)
├── 📄 access-graph.service.ts         (Core service)
├── 📄 access-control.guard.ts         (Route guard)
├── 📄 access-graph.module.ts          (Feature module)
│
├── 📁 access-graph-dashboard/
│   ├── access-graph-dashboard.component.ts
│   ├── access-graph-dashboard.component.html
│   └── access-graph-dashboard.component.css
│
├── 📖 QUICK_START.md                  (5-minute guide)
├── 📖 INTEGRATION_GUIDE.md            (Full reference)
└── 📖 AWS_IAM_INTEGRATION.md          (AWS setup guide)
```

---

## 🔄 How It Works

### Auto-Registration Flow

```
User Signs Up
    ↓
User Logs In
    ↓
AccessControlGuard triggers
    ↓
Check: Is user in access graph?
    ├─ NO → Register user as Identity + Assign Role
    └─ YES → Proceed
    ↓
Check: Does identity have required permissions?
    ├─ YES → Grant access ✅
    └─ NO → Deny access & redirect ❌
```

### Access Check Flow

```
Route requires: SELLER_DASHBOARD + READ permission
    ↓
Guard:
  1. Get current user from localStorage
  2. Find identity in access graph
  3. Find all access rules for identity + resource
  4. Check if permissions are granted
    ↓
Result:
  ✅ All required permissions found → Access granted
  ❌ Missing permissions → Access denied
```

---

## 🎨 Using the Dashboard

### Table View
Shows all identities with their:
- Name & Email
- Type (Customer, Seller, Admin)
- Current Role
- Resource permissions

### Graph View
Visual network showing:
- Green nodes = Identities (users)
- Blue nodes = Roles
- Orange nodes = Resources
- Lines = Connections showing access flow

### Statistics
- Total Identities registered
- Total Roles configured
- Total Resources protected
- Total Access Rules active

---

## 🔧 Customization

### Add New Resource
```typescript
const newResource: Resource = {
  id: 'res-reviews',
  name: 'Product Reviews',
  type: ResourceType.PRODUCTS, // Can create new ResourceType
  description: 'Manage product reviews'
};

const graph = this.accessGraphService.getAccessGraph();
if (graph) {
  graph.resources.push(newResource);
}
```

### Add New Role
```typescript
const moderatorRole: Role = {
  id: 'role-moderator',
  name: 'moderator',
  display: 'Moderator',
  permissions: [Permission.READ, Permission.UPDATE, Permission.DELETE],
  resources: [ResourceType.PRODUCTS, ResourceType.USERS_MANAGEMENT],
  identityTypes: [IdentityType.ADMIN]
};
```

### Grant Temporary Access
```typescript
const rule: AccessRule = {
  id: `rule-${userId}-${resourceId}`,
  identityId,
  resourceId,
  permissions: [Permission.READ],
  roleId: 'role-seller',
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  conditions: [{
    type: 'TIME_BASED',
    value: { start: '09:00', end: '17:00' }
  }]
};
```

---

## 🧪 Testing

### Test Different User Types

```bash
# Customer Account
Email: customer@example.com
Password: pass123
Expected: Can access /cart, /my-orders, /checkout
          Cannot access /seller-home, /admin-panel

# Seller Account
Email: seller@example.com
Password: pass123
Expected: Can access /seller-home, /seller-add-product
          Cannot access /admin-panel, /users-management

# Admin Account
Email: admin@example.com
Password: pass123
Expected: Full access to all routes
```

### Check Permissions in Browser Console

```javascript
// Get the service
const ng = window['ng'];
const acgService = ng.probe(document.querySelector('app-root')).injector.get('AccessGraphService');

// View entire access graph
console.log('Access Graph:', acgService.getAccessGraph());

// Check specific access
const result = acgService.checkAccess('identity-1', 'res-products', ['READ']);
console.log('Can read products:', result.allowed, result.reason);

// View all identities
const graph = acgService.getAccessGraph();
console.log('All users:', graph.identities);
```

---

## 🔐 Security Notes

### Current Implementation
- ✅ Client-side access control (for UX)
- ✅ Route guards prevent unauthorized navigation
- ✅ Component checks show/hide features
- ⚠️ Stored in localStorage (vulnerable to XSS)

### For Production
- 🔒 **Backend Validation**: Always validate permissions on backend
- 🔒 **JWT Tokens**: Use secure JWT tokens with roles/permissions
- 🔒 **HTTPS Only**: Ensure secure transport
- 🔒 **Audit Logging**: Log all access attempts
- 🔒 **Consider AWS IAM**: For enterprise-scale security

See `AWS_IAM_INTEGRATION.md` for enterprise setup.

---

## 📚 Documentation

### Quick References
- **Getting Started**: See `QUICK_START.md` (5 minutes)
- **Full Integration**: See `INTEGRATION_GUIDE.md` (comprehensive)
- **Enterprise Setup**: See `AWS_IAM_INTEGRATION.md` (AWS IAM integration)

### Key Concepts

| Term | Meaning |
|------|---------|
| **Identity** | A user in your system |
| **Role** | A collection of permissions (e.g., "Seller") |
| **Resource** | Something to protect (e.g., "Products") |
| **Permission** | An action allowed (CREATE, READ, UPDATE, DELETE) |
| **Access Rule** | Grants identity specific permissions on a resource |
| **Access Graph** | Complete mapping of identities → roles → resources |

---

## 🚦 Common Tasks

### Allow user to access a resource
```typescript
// 1. Register identity
const identity: Identity = {
  id: 'identity-123',
  name: 'John Doe',
  type: IdentityType.SELLER,
  email: 'john@example.com'
};
this.accessGraphService.registerIdentity(identity);

// 2. Assign role
this.accessGraphService.assignRoleToIdentity(identity.id, 'role-seller');
```

### Deny specific access
```typescript
// Remove the access rule
const graph = this.accessGraphService.getAccessGraph();
graph.accessRules = graph.accessRules.filter(
  r => !(r.identityId === 'identity-123' && r.resourceId === 'res-admin-panel')
);
```

### Check current user access
```typescript
// In any component
const userId = JSON.parse(localStorage.getItem('user'))?.id;
const permissions = this.accessGraphService.getIdentityPermissions(`identity-${userId}`);
console.log('My permissions:', permissions);
```

### Export configuration
```html
<!-- In access-graph-dashboard -->
<button (click)="exportGraph()">Download Access Graph</button>
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Routes always deny access | Check localStorage has'user' or 'seller' data |
| Dashboard shows no users | Sign in first; users auto-register on login |
| Permissions not updating | Service uses BehaviorSubject; subscribe to accessGraph$ |
| Guard not working | Verify `AccessControlGuard` is in canActivate |
| Import errors | Ensure `AccessGraphModule` is in `app.module.ts` |

---

## 🎯 Next Steps

### Immediate (📅 Today)
1. ✅ Explore `/access-graph-dashboard`
2. ✅ Test with different user types
3. ✅ Review dashboard structure

### Short Term (📅 This Week)
1. 🔄 Update protected routes with `AccessControlGuard`
2. 🔄 Add permission checks in your components
3. 🔄 Test access scenarios

### Medium Term (📅 This Month)
1. 📊 Integrate with backend APIs
2. 📊 Add persistent storage (database)
3. 📊 Implement audit logging

### Long Term (📅 for Enterprise)
1. ☁️ Consider AWS IAM migration (see guide)
2. ☁️ Add advanced features (time-based access, IP restrictions)
3. ☁️ Implement compliance reporting

---

## 📞 Support

### For Issues
1. Check `QUICK_START.md` for common scenarios
2. Review `INTEGRATION_GUIDE.md` for integration patterns
3. Check browser console for errors
4. Review localStorage for user data

### For AWS Integration
See `AWS_IAM_INTEGRATION.md` for:
- AWS IAM setup
- Cognito configuration
- CloudTrail logging
- Cost analysis

---

## 📊 Key Metrics

Your system now controls access to:
- ✅ 10 Resources (Products, Cart, Orders, etc.)
- ✅ 3 Roles (Customer, Seller, Admin)
- ✅ 5 Permission Types (CREATE, READ, UPDATE, DELETE, MANAGE)
- ✅ Unlimited users can be registered

---

## 🎉 You're All Set!

Your Angular e-commerce application now has:
- ✅ Role-based access control
- ✅ Visual access graph dashboard
- ✅ Route protection with guards
- ✅ Permission checking in components
- ✅ Export/import capabilities
- ✅ Enterprise-ready foundation

**Next**: Navigate to `/access-graph-dashboard` to see it in action! 🚀
