# Access Graph Architecture & Diagrams

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Angular E-Commerce App                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          Access Graph Module                             │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ AccessGraphService                              │   │   │
│  │  │ ├─ identities: Identity[]                       │   │   │
│  │  │ ├─ roles: Role[]                                │   │   │
│  │  │ ├─ resources: Resource[]                        │   │   │
│  │  │ ├─ accessRules: AccessRule[]                    │   │   │
│  │  │ ├─ checkAccess()                                │   │   │
│  │  │ ├─ assignRoleToIdentity()                       │   │   │
│  │  │ └─ registerIdentity()                           │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                        ⬆                                │   │
│  │                        ⬇                                │   │
│  │  ┌──────────────────────┬──────────────────────────┐   │   │
│  │  │                       │                          │   │   │
│  │  │  AccessControlGuard   │  Dashboard Component     │   │   │
│  │  │  (Route Protection)   │  (Visualization)         │   │   │
│  │  │                       │                          │   │   │
│  │  └──────────────────────┴──────────────────────────┘   │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          Application Routes (with guards)                │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ /products          → HomeComponent (READ PRODUCTS)      │   │
│  │ /cart-page         → CartComponent (READ/UPDATE CART)   │   │
│  │ /checkout          → CheckoutComponent (CREATE PAYMENTS)│   │
│  │ /seller-home       → SellerComponent (READ DASHBOARD)   │   │
│  │ /access-graph      → DashboardComponent (VIEW ACCESS)   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### User Login Flow

```
┌──────────────┐
│  User Login  │
└──────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Auth Service               │
│  (UserService /             │
│   SellerService)            │
└─────────────────────────────┘
       │
       ├─► Validate credentials
       │
       ├─► Save to localStorage
       │
       └─► Navigate to home
           
       ▼
┌─────────────────────────────┐
│  Route Navigation           │
│  /seller-home triggered     │
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  AccessControlGuard Triggered           │
├─────────────────────────────────────────┤
│  1. Get user from localStorage          │
│  2. Find / Create Identity              │
│  3. Get Resource from AccessGraph       │
│  4. Check Access Rules                  │
│  5. Verify Permissions                  │
└─────────────────────────────────────────┘
       │
       ├─YES───► Route Success ✅
       │         Component loads
       │
       └─NO───► Route Denied ❌
               Redirect to home
```

---

## Access Check Logic

```
┌──────────────────────────────────────────────────┐
│ AccessGraphService.checkAccess(                  │
│   identityId: string,                            │
│   resourceId: string,                            │
│   permissions: Permission[]                      │
│ )                                                │
└──────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│ Find All Access Rules for:                       │
│ - identityId = X                                 │
│ - resourceId = Y                                 │
└──────────────────────────────────────────────────┘
           │
           ├─ Found rules?
           │
           ├─NO───► AccessCheckResult {
           │         allowed: false,
           │         reason: "No rules found"
           │        }
           │
           └─YES──► Extract Permissions
                    │
                    ▼
                 ┌──────────────────────────────┐
                 │ Collected Permissions:       │
                 │ [READ, CREATE, UPDATE]       │
                 └──────────────────────────────┘
                    │
                    ▼
                 ┌──────────────────────────────┐
                 │ Check if required perms      │
                 │ are in collected perms       │
                 └──────────────────────────────┘
                    │
                    ├─YES───► AccessCheckResult {
                    │          allowed: true,
                    │          reason: "Access granted",
                    │          permissions: [...]
                    │         }
                    │
                    └─NO───► AccessCheckResult {
                             allowed: false,
                             reason: "Missing: DELETE",
                             permissions: [READ, CREATE]
                            }
```

---

## Roles & Permissions Matrix

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ROLE PERMISSIONS MATRIX                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ CUSTOMER ROLE:                                                           │
│ ┌─────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐ │
│ │ Resource    │ CREATE   │ READ     │ UPDATE   │ DELETE   │ MANAGE   │ │
│ ├─────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤ │
│ │ PRODUCTS    │ ❌       │ ✅       │ ❌       │ ❌       │ ❌       │ │
│ │ CART        │ ✅       │ ✅       │ ✅       │ ❌       │ ❌       │ │
│ │ ORDERS      │ ❌       │ ✅       │ ❌       │ ❌       │ ❌       │ │
│ │ PAYMENTS    │ ✅       │ ❌       │ ❌       │ ❌       │ ❌       │ │
│ │ PROFILE     │ ❌       │ ✅       │ ✅       │ ❌       │ ❌       │ │
│ └─────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘ │
│                                                                          │
│ SELLER ROLE:                                                             │
│ ┌─────────────────────┬──────────┬──────────┬──────────┬──────────┐    │
│ │ Resource            │ CREATE   │ READ     │ UPDATE   │ DELETE   │    │
│ ├─────────────────────┼──────────┼──────────┼──────────┼──────────┤    │
│ │ PRODUCTS            │ ✅       │ ✅       │ ✅       │ ✅       │    │
│ │ ORDERS              │ ❌       │ ✅       │ ❌       │ ❌       │    │
│ │ SELLER_DASHBOARD    │ ❌       │ ✅       │ ❌       │ ❌       │    │
│ │ SHOP_SETTINGS       │ ✅       │ ✅       │ ✅       │ ❌       │    │
│ │ ANALYTICS           │ ❌       │ ✅       │ ❌       │ ❌       │    │
│ └─────────────────────┴──────────┴──────────┴──────────┴──────────┘    │
│                                                                          │
│ ADMIN ROLE:                                                              │
│ ┌─────────────────────┬──────────┬──────────┬──────────┬──────────┐    │
│ │ Resource            │ CREATE   │ READ     │ UPDATE   │ DELETE   │    │
│ ├─────────────────────┼──────────┼──────────┼──────────┼──────────┤    │
│ │ ALL RESOURCES       │ ✅       │ ✅       │ ✅       │ ✅       │    │
│ └─────────────────────┴──────────┴──────────┴──────────┴──────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Component Interaction Diagram

```
┌────────────────────────────────────────────────────────────┐
│           User Interface Layer                             │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Header Component          Product Component               │
│  ├─ Login/Logout           ├─ Display Products            │
│  └─ Nav Links              ├─ Delete Button               │
│                            │  (if canDelete())            │
│           ▲                 │                              │
│           │                 │                              │
│           └─────────────────┴─────────────────┐            │
│                                               ▼            │
│                                  ┌─────────────────────┐   │
│                                  │ Permission Service   │   │
│                                  │ canDelete()          │   │
│                                  │ canRead()            │   │
│                                  │ getMyPermissions()   │   │
│                                  └─────────────────────┘   │
│                                           ▲                │
│                                           │                │
│                                           ▼                │
│                                  ┌─────────────────────┐   │
│                                  │ Access Graph Service │   │
│                                  │ checkAccess()        │   │
│                                  └─────────────────────┘   │
│                                           ▲                │
│                                           │                │
│                                           ▼                │
│                                  ┌─────────────────────┐   │
│                                  │ Access Graph Store   │   │
│                                  │ (BehaviorSubject)    │   │
│                                  │ - identities         │   │
│                                  │ - roles              │   │
│                                  │ - resources          │   │
│                                  │ - access rules       │   │
│                                  └─────────────────────┘   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Route Protection Sequence

```
USER NAVIGATES TO PROTECTED ROUTE
          │
          ▼
┌─────────────────────────────┐
│ Router checks canActivate   │
│ [AccessControlGuard]        │
└─────────────────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ Guard extracts route data   │
│ required:                   │
│ - resource: SELLER_DASHBOARD│
│ - permissions: [READ]       │
└─────────────────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ Get user from localStorage  │
└─────────────────────────────┘
          │
          ├─ User not found?
          │  └─► Redirect /user-auth ❌
          │
          ▼
┌─────────────────────────────┐
│ Find/Create Identity        │
└─────────────────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ Find Resource in Graph      │
└─────────────────────────────┘
          │
          ├─ Resource not found?
          │  └─► Deny access ❌
          │
          ▼
┌─────────────────────────────┐
│ Call checkAccess()          │
│ (identityId, resourceId,    │
│  permissions)               │
└─────────────────────────────┘
          │
          ├─ ACCESS ALLOWED?
          │  ├─ YES ─► Allow navigation ✅
          │  └─ NO ──► Redirect /home ❌
          │
          ▼
    ROUTE COMPLETE
```

---

## Identity Registration Flow

```
USER LOGS IN
    │
    ▼
localStorage has 'user' or 'seller'?
    │
    ├─ NO  ─► Return
    │
    ▼
ACCESS CONTROL GUARD TRIGGERED
    │
    ▼
Check: Is identity in access graph?
    │
    ├─ YES ─► Use existing identity
    │
    └─ NO ──► CREATE NEW IDENTITY
              │
              ├─ Extract user data
              │
              ├─ Create Identity object:
              │  {
              │    id: 'identity-' + userId,
              │    name: user.name,
              │    type: IdentityType.SELLER/CUSTOMER,
              │    email: user.email
              │  }
              │
              ├─ Register in access graph
              │
              ├─ Determine role:
              │  If 'seller' in localStorage → 'role-seller'
              │  If 'user' in localStorage   → 'role-customer'
              │
              ├─ Assign role:
              │  For each resource in role:
              │    Create access rule
              │    identityId → resourceId
              │    with permissions
              │
              └─ Identity ready for access checks
```

---

## State Management

```
┌─────────────────────────────────────────────────────┐
│  AccessGraphService State                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  accessGraphSubject (BehaviorSubject<AccessGraph>) │
│  │                                                  │
│  └─► Emits complete access graph                   │
│       when ANY change occurs                       │
│                                                     │
│  Structure:                                        │
│  {                                                 │
│    identities: [                                   │
│      {                                             │
│        id: 'identity-1',                           │
│        name: 'John',                               │
│        type: 'CUSTOMER',                           │
│        email: 'john@example.com'                   │
│      }                                             │
│    ],                                              │
│    roles: [                                        │
│      {                                             │
│        id: 'role-customer',                        │
│        name: 'customer',                           │
│        permissions: [READ, CREATE, UPDATE],        │
│        resources: [PRODUCTS, CART, ...]            │
│      }                                             │
│    ],                                              │
│    resources: [...],                               │
│    accessRules: [                                  │
│      {                                             │
│        identityId: 'identity-1',                   │
│        resourceId: 'res-products',                 │
│        permissions: [READ],                        │
│        roleId: 'role-customer'                     │
│      }                                             │
│    ]                                               │
│  }                                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Dashboard Data Visualization

```
┌──────────────────────────────────────────────────────┐
│           Access Graph Dashboard                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─ SUMMARY STATS ───────────────────────────────┐  │
│  │  Identities: 15  Roles: 3  Resources: 10  │  │
│  │  Access Rules: 45                            │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ GRAPH VIEW ──────────────────────────────────┐  │
│  │                                                │  │
│  │  ◎ John    ◎ Sarah   ◎ Mike     [Identities]  │  │
│  │   │\        │\        │\                      │  │
│  │   │ ◎ Customer ◎ Seller ◎ Admin [Roles]      │  │
│  │   │/       │/        │/                       │  │
│  │  ◎ Products ◎ Orders ◎ Dashboard [Resources]  │  │
│  │                                                │  │
│  │  ─── Legend ───                               │  │
│  │  ◎ Green: Identity                            │  │
│  │  ◎ Blue: Role                                 │  │
│  │  ◎ Orange: Resource                           │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ TABLE VIEW ──────────────────────────────────┐  │
│  │ Name     │ Type     │ Role      │ Perms      │  │
│  │ John     │ CUSTOMER │ Customer  │ R,Cr,Up    │  │
│  │ Sarah    │ SELLER   │ Seller    │ All        │  │
│  │ Mike     │ ADMIN    │ Admin     │ All        │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Integration Points

```
┌─────────────────────────────────────────────────┐
│      Your Existing Application                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │ UserService / SellerService              │ │
│  │ (Authentication)                         │ │
│  └──────────────────────┬────────────────────┘ │
│                         │                      │
│                         ▼                      │
│  ┌──────────────────────────────────────────┐ │
│  │ AccessGraphService                       │ │ ← NEW
│  │ (Authorization & Access Control)         │ │
│  └──────────────────────────────────────────┘ │
│                         │                      │
│         ┌───────────────┼───────────────┐     │
│         ▼               ▼               ▼     │
│  ┌────────┐     ┌─────────────┐  ┌──────────┐
│  │Routes  │     │Components   │  │Dashboard │
│  │(Guards)│     │(Permissions)│  │(Visuals) │
│  └────────┘     └─────────────┘  └──────────┘
│                                               │
└─────────────────────────────────────────────────┘
```

---

## Resource Types

```
┌─────────────────────────────────────────────────┐
│  RESOURCE HIERARCHY                             │
├─────────────────────────────────────────────────┤
│                                                 │
│  PUBLIC RESOURCES:                              │
│  ├─ PRODUCTS (Browse catalog)                   │
│                                                 │
│  CUSTOMER RESOURCES:                            │
│  ├─ CART (Manage shopping cart)                 │
│  ├─ ORDERS (View own orders)                    │
│  ├─ PAYMENTS (Make payments)                    │
│  ├─ USER_PROFILE (Manage profile)               │
│                                                 │
│  SELLER RESOURCES:                              │
│  ├─ PRODUCTS (Manage own products)              │
│  ├─ SELLER_DASHBOARD (View dashboard)           │
│  ├─ SHOP_SETTINGS (Configure shop)              │
│  ├─ ANALYTICS (View analytics)                  │
│                                                 │
│  ADMIN RESOURCES:                               │
│  ├─ ADMIN_PANEL (System administration)         │
│  ├─ USERS_MANAGEMENT (Manage all users)         │
│  └─ [ALL OTHER RESOURCES]                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Permission Types Explained

```
┌─────────────────────────────────────────────────┐
│  PERMISSION TYPES & MEANINGS                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  CREATE: Can create new items                   │
│  ├─ Example: Add a product                      │
│  ├─ Example: Add item to cart                   │
│  └─ Example: Place an order                     │
│                                                 │
│  READ: Can view/read items                      │
│  ├─ Example: View products                      │
│  ├─ Example: View cart contents                 │
│  └─ Example: View orders                        │
│                                                 │
│  UPDATE: Can modify existing items              │
│  ├─ Example: Edit product details               │
│  ├─ Example: Update cart quantities             │
│  └─ Example: Update profile info                │
│                                                 │
│  DELETE: Can remove items                       │
│  ├─ Example: Delete products                    │
│  ├─ Example: Remove from cart                   │
│  └─ Example: Cancel orders                      │
│                                                 │
│  MANAGE: Full administrative control            │
│  ├─ Example: Manage role assignments            │
│  ├─ Example: Configure system settings          │
│  └─ Example: Handle user management             │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
PERMISSION CHECK FAILS
        │
        ▼
┌──────────────────────────┐
│ AccessCheckResult {      │
│   allowed: false,        │
│   reason: "...",         │
│   permissions: []        │
│ }                        │
└──────────────────────────┘
        │
        ├─ In Route Guard?
        │  └─► Redirect to home (/index)
        │
        ├─ In Component?
        │  └─► Show message or hide button
        │
        └─ In Service Call?
           └─► Return error response
```

---

This comprehensive architecture document provides a complete visual overview of your Access Graph system. Use it as a reference when:
- Onboarding new developers
- Planning enhancements
- Debugging issues
- Explaining the system to stakeholders
