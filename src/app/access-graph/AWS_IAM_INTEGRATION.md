# AWS IAM Access Integration Guide

## Overview

This guide explains how to integrate AWS Identity and Access Management (IAM) with your Angular e-commerce application for enterprise-grade access control, audit logging, and compliance.

---

## When to Use AWS IAM vs Custom Access Graph

| Aspect | Custom Access Graph | AWS IAM |
|--------|-------------------|---------|
| **Scale** | Small to medium applications | Enterprise-scale systems |
| **Complexity** | Simple role-based access | Complex permission policies |
| **Users** | 100s-1000s | 1000s-100,000s |
| **Features** | Basic RBAC | RBAC + ABAC, cross-account access |
| **Audit Trail** | Application-level | AWS CloudTrail integration |
| **Cost** | No additional cost | AWS pricing model |
| **Setup Time** | Hours | Days-weeks |
| **Use Case** | Single application | Multi-service AWS infrastructure |

**Recommendation**: Start with custom access graph, migrate to AWS IAM when:
- Operating multiple AWS services
- Need detailed audit trails for compliance
- Managing 1000+ users
- Require cross-account access management

---

## AWS IAM Architecture for E-Commerce

```
┌──────────────────────────────────────────────────────────────┐
│                     AWS Account                               │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              IAM Identity Center (SSO)                   │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐     │ │
│  │  │   Customers │  │   Sellers   │  │    Admins    │     │ │
│  │  └─────────────┘  └─────────────┘  └──────────────┘     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           IAM Policies & Permission Sets                │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │ Customer Policy: Read Products, Manage Carts    │   │ │
│  │  │ Seller Policy: Manage Products & Analytics      │   │ │
│  │  │ Admin Policy: Full Access                       │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │         AWS Resources (Lambda, S3, DynamoDB, etc)       │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐    │ │
│  │  │ Lambda APIs  │  │    S3 Docs   │  │  DynamoDB  │    │ │
│  │  └──────────────┘  └──────────────┘  └────────────┘    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │             CloudTrail (Audit Logging)                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: AWS Setup Prerequisites

#### 1.1 Create AWS Account and IAM User
```bash
# Prerequisites:
# - AWS Account with admin access
# - AWS CLI installed
# - AWS credentials configured locally
# - Node.js and npm installed
```

#### 1.2 Create IAM Users/Roles for Your Roles
```bash
# Using AWS CLI

# Create roles
aws iam create-role --role-name ecommerce-customer-role \
  --assume-role-policy-document file://trust-policy.json

aws iam create-role --role-name ecommerce-seller-role \
  --assume-role-policy-document file://trust-policy.json

aws iam create-role --role-name ecommerce-admin-role \
  --assume-role-policy-document file://trust-policy.json
```

**trust-policy.json** (for web identity):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:saml-provider/YourIdentityProvider"
      },
      "Action": "sts:AssumeRoleWithSAML",
      "Condition": {
        "StringEquals": {
          "SAML:aud": "https://signin.aws.amazon.com/saml"
        }
      }
    }
  ]
}
```

### Step 2: Create IAM Policies

#### 2.1 Customer Policy
```bash
# customer-policy.json
aws iam put-role-policy --role-name ecommerce-customer-role \
  --policy-name customer-access \
  --policy-document file://customer-policy.json
```

**customer-policy.json**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::ecommerce-products",
        "arn:aws:s3:::ecommerce-products/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/Orders",
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:LeadingKeys": ["${aws:username}"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "arn:aws:lambda:us-east-1:*:function:GetCartItems"
    }
  ]
}
```

#### 2.2 Seller Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::ecommerce-products",
        "arn:aws:s3:::ecommerce-products/sellers/${aws:username}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/Products",
      "Condition": {
        "StringEquals": {
          "dynamodb:LeadingKeys": ["${aws:username}"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": [
        "arn:aws:lambda:us-east-1:*:function:GetSellerAnalytics",
        "arn:aws:lambda:us-east-1:*:function:UploadProductImage"
      ]
    }
  ]
}
```

#### 2.3 Admin Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*"
    }
  ]
}
```

### Step 3: Configure AWS SDK in Angular

#### 3.1 Install AWS SDK
```bash
npm install aws-sdk aws-amplify @aws-amplify/auth
```

#### 3.2 Create AWS Configuration File

**src/environments/aws-config.ts**:
```typescript
export const awsConfig = {
  region: 'us-east-1',
  
  Auth: {
    identityPoolId: 'us-east-1:12345678-1234-1234-1234-123456789012',
    userPoolId: 'us-east-1_1234567890',
    userPoolWebClientId: '1234567890abcdefghijklmnop',
    redirectSignIn: 'http://localhost:4200/',
    redirectSignOut: 'http://localhost:4200/',
    responseType: 'code',
    scope: ['email', 'openid', 'profile']
  },
  
  Storage: {
    bucket: 'ecommerce-user-files',
    region: 'us-east-1'
  },
  
  API: {
    endpoints: [
      {
        name: 'ecommerceAPI',
        endpoint: 'https://api.example.com',
        region: 'us-east-1'
      }
    ]
  }
};
```

#### 3.3 Create AWS IAM Service

**src/app/services/aws-iam.service.ts**:
```typescript
import { Injectable } from '@angular/core';
import { Auth } from 'aws-amplify';
import { CognitoUserSession } from 'amazon-cognito-identity-js';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AwsIamService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private credentialsSubject = new BehaviorSubject<any>(null);
  public credentials$ = this.credentialsSubject.asObservable();

  constructor() {
    this.checkUserSession();
  }

  /**
   * Check if user has active session
   */
  async checkUserSession(): Promise<void> {
    try {
      const session = await Auth.currentSession();
      const user = await Auth.currentUserInfo();
      this.currentUserSubject.next(user);
      this.credentialsSubject.next(session.getAccessToken());
    } catch (error) {
      console.log('No active session');
    }
  }

  /**
   * Initiate AWS Cognito login flow
   */
  async signIn(username: string, password: string): Promise<any> {
    try {
      const user = await Auth.signIn(username, password);
      this.currentUserSubject.next(user);
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign up new user
   */
  async signUp(username: string, password: string, email: string): Promise<any> {
    try {
      const user = await Auth.signUp({
        username,
        password,
        attributes: { email }
      });
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user credentials with STS assume role
   */
  async getCredentialsWithRole(roleArn: string): Promise<any> {
    try {
      const session = await Auth.currentSession();
      const idToken = session.getIdToken().getJwtToken();

      // Call Lambda function to assume role
      const response = await fetch('/api/assume-role', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ roleArn })
      });

      const credentials = await response.json();
      this.credentialsSubject.next(credentials);
      return credentials;
    } catch (error) {
      console.error('Failed to get credentials:', error);
      throw error;
    }
  }

  /**
   * Get user's IAM permissions
   */
  async getUserPermissions(): Promise<string[]> {
    try {
      const session = await Auth.currentSession();
      const idToken = session.getIdToken();
      
      // Decode JWT to get claims
      const claims = idToken.payload;
      return claims['cognito:groups'] || [];
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return [];
    }
  }

  /**
   * Check if user can perform action
   */
  async canPerformAction(action: string, resource: string): Promise<boolean> {
    try {
      const session = await Auth.currentSession();
      const idToken = session.getIdToken().getJwtToken();

      const response = await fetch('/api/check-permission', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ action, resource })
      });

      const result = await response.json();
      return result.allowed;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      await Auth.signOut();
      this.currentUserSubject.next(null);
      this.credentialsSubject.next(null);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Get current credentials
   */
  getCurrentCredentials(): any {
    return this.credentialsSubject.value;
  }
}
```

### Step 4: Create AWS-Based Access Guard

**src/app/access-graph/aws-access-control.guard.ts**:
```typescript
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AwsIamService } from '../services/aws-iam.service';

@Injectable({
  providedIn: 'root'
})
export class AwsAccessControlGuard implements CanActivate {
  constructor(
    private awsIamService: AwsIamService,
    private router: Router
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    try {
      const requiredPermissions = route.data['permissions'] || [];
      const requiredAction = route.data['action'];
      const requiredResource = route.data['resource'];

      if (!requiredAction || !requiredResource) {
        return true;
      }

      // Check if user has required action on resource
      const allowed = await this.awsIamService.canPerformAction(
        requiredAction,
        requiredResource
      );

      if (!allowed) {
        this.router.navigate(['/unauthorized']);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Authorization check failed:', error);
      this.router.navigate(['/unauthorized']);
      return false;
    }
  }
}
```

### Step 5: Setup Lambda for Policy Evaluation

**lambda/check-permission.js** (Node.js):
```javascript
const AWS = require('aws-sdk');
const iam = new AWS.IAM();

exports.handler = async (event) => {
  try {
    const { action, resource } = JSON.parse(event.body);
    const userId = event.requestContext.authorizer.claims.sub;

    // Get user's groups/roles from Cognito
    const userGroups = event.requestContext.authorizer.claims['cognito:groups'] || [];

    // Simulate IAM policy evaluation
    const allowed = await evaluatePolicy(userId, userGroups, action, resource);

    return {
      statusCode: 200,
      body: JSON.stringify({ allowed })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function evaluatePolicy(userId, userGroups, action, resource) {
  // Map Cognito groups to IAM roles
  const roleMap = {
    'customers': 'ecommerce-customer-role',
    'sellers': 'ecommerce-seller-role',
    'admins': 'ecommerce-admin-role'
  };

  // Get policies for user's roles
  for (const group of userGroups) {
    const role = roleMap[group];
    if (role) {
      const policies = await getPoliciesForRole(role);
      if (checkPolicies(policies, action, resource)) {
        return true;
      }
    }
  }

  return false;
}

async function getPoliciesForRole(roleName) {
  const result = await iam.listRolePolicies({ RoleName: roleName }).promise();
  return result.PolicyNames;
}

function checkPolicies(policies, action, resource) {
  // In production, parse and evaluate actual IAM policies
  // For now, simplified check
  return policies.length > 0;
}
```

### Step 6: Integrate with CloudTrail

**src/app/services/audit-logger.service.ts**:
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuditLoggerService {
  constructor(private http: HttpClient) {}

  /**
   * Log access events to CloudTrail
   */
  logAccessEvent(event: {
    userId: string;
    action: string;
    resource: string;
    result: 'ALLOWED' | 'DENIED';
    timestamp: Date;
  }): void {
    // Send to backend which logs to CloudTrail
    this.http.post('/api/audit-log', event).subscribe();
  }

  /**
   * Get audit logs
   */
  getAuditLogs(startTime: Date, endTime: Date) {
    return this.http.post('/api/audit-logs/query', {
      StartTime: startTime,
      EndTime: endTime
    });
  }
}
```

---

## Migration Path: Custom Access Graph → AWS IAM

### Phase 1: Hybrid Approach (Weeks 1-2)
- Keep custom access graph running
- Add AWS IAM parallel
- Monitor both systems
- Gradual user migration

### Phase 2: AWS-Based Enforcement (Weeks 3-4)
- Switch primary enforcement to AWS IAM
- Keep custom graph for UI/caching
- Sync between systems

### Phase 3: Full AWS Migration (Weeks 5-6)
- Deprecate custom access graph
- Full AWS IAM enforcement
- Archive legacy data

---

## AWS IAM vs Custom Access Graph Comparison

### Custom Access Graph Advantages
✅ Simple to implement  
✅ No AWS costs  
✅ Fast development  
✅ Easy to customize  
✅ Lightweight for small scales  

### AWS IAM Advantages
✅ Enterprise-grade security  
✅ Compliance ready (SOC2, ISO 27001)  
✅ Integrated audit logging  
✅ Cross-AWS account support  
✅ Scales to thousands of users  
✅ AWS service integration  
✅ Advanced MFA options  
✅ Temporary credentials  

---

## Cost Analysis

### AWS IAM Pricing
- **Cognito**: $0.015/MAU (monthly active user)
- **CloudTrail**: $2/trail + $0.10/100,000 events
- **IAM**: Free (up to 5000 users)
- **Lambda**: $0.20/1M requests

### Example Monthly Cost (10,000 users)
- Cognito: $150
- Lambda: $10 (assuming low traffic)
- CloudTrail: $2
- **Total: ~$162/month**

---

## Security Best Practices for AWS IAM

1. **Enable MFA** for all users
2. **Use temporary credentials** instead of long-term keys
3. **Implement principle of least privilege**
4. **Enable CloudTrail and CloudWatch** monitoring
5. **Rotate credentials** regularly
6. **Use VPC endpoints** for private communication
7. **Enable encryption** at rest and in transit
8. **Monitor CloudTrail logs** for suspicious activity

---

## Testing AWS IAM Integration

```typescript
// Unit test
describe('AwsIamService', () => {
  let service: AwsIamService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AwsIamService);
  });

  it('should check user permissions', async () => {
    const result = await service.canPerformAction('s3:GetObject', 'products/*');
    expect(result).toBeTrue();
  });
});

// Integration test
describe('AWS IAM Integration', () => {
  it('should deny unauthorized access', async () => {
    // Mock AWS response
    const guard = new AwsAccessControlGuard(mockAwsService, mockRouter);
    const route = { data: { action: 's3:DeleteObject', resource: 'admin/*' } };
    
    const result = await guard.canActivate(route as any, {} as any);
    expect(result).toBeFalse();
  });
});
```

---

## Troubleshooting

### Issue: "Invalid token"
- Verify Cognito user pool configuration
- Check JWT token expiration
- Refresh tokens if expired

### Issue: "Access denied despite valid role"
- Check IAM policy attachment
- Verify AssumeRole trust relationship
- Check principal in policy

### Issue: "CloudTrail not logging"
- Verify CloudTrail bucket permissions
- Check S3 bucket policy
- Enable CloudTrail logging

---

## Resources

- [AWS IAM Documentation](https://docs.aws.amazon.com/iam/)
- [AWS Cognito Developer Guide](https://docs.aws.amazon.com/cognito/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [CloudTrail User Guide](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/)

---

## Next Steps

1. Choose your path: Keep custom graph, hybrid, or full AWS migration
2. Review costs and compliance requirements
3. Set up AWS infrastructure as described
4. Test thoroughly in development environment
5. Plan gradual rollout to production
6. Monitor and optimize continuously
