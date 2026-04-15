import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  CanDeactivate
} from '@angular/router';
import { Observable } from 'rxjs';
import { AccessGraphService } from './access-graph.service';
import { Permission, ResourceType } from './access-graph.types';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AccessControlGuard implements CanActivate {
  constructor(
    private accessGraphService: AccessGraphService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Get required resource and permissions from route data
    const requiredResource: ResourceType = route.data['resource'];
    const requiredPermissions: Permission[] = route.data['permissions'] || [];

    if (!requiredResource) {
      // No resource requirement, allow access
      return true;
    }

    // Get current logged-in user from localStorage
    const userStr = localStorage.getItem('user');
    const sellerStr = localStorage.getItem('seller');
    const currentUser = userStr ? JSON.parse(userStr) : sellerStr ? JSON.parse(sellerStr) : null;

    if (!currentUser) {
      this.router.navigate(['/user-auth']);
      return false;
    }

    // Get the resource from access graph
    const accessGraph = this.accessGraphService.getAccessGraph();
    if (!accessGraph) {
      console.error('Access graph not initialized');
      return false;
    }

    const resource = accessGraph.resources.find(r => r.type === requiredResource);
    if (!resource) {
      console.error(`Resource not found: ${requiredResource}`);
      return false;
    }

    // Check if identity is registered in access graph
    let identity = accessGraph.identities.find(i => i.email === currentUser.email);
    if (!identity) {
      // Auto-register new identity
      const identityType = userStr ? 'CUSTOMER' : 'SELLER';
      identity = {
        id: `identity-${currentUser.id}`,
        name: currentUser.name,
        type: identityType as any,
        email: currentUser.email
      };
      this.accessGraphService.registerIdentity(identity);

      // Auto-assign appropriate role
      const roleId = userStr ? 'role-customer' : 'role-seller';
      this.accessGraphService.assignRoleToIdentity(identity.id, roleId);
    }

    // Check access
    const accessResult = this.accessGraphService.checkAccess(
      identity.id,
      resource.id,
      requiredPermissions.length > 0 ? requiredPermissions : [Permission.READ]
    );

    if (!accessResult.allowed) {
      console.warn(`Access denied: ${accessResult.reason}`);
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}
