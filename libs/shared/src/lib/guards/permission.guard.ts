import { Injectable } from "@angular/core";
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Observable } from "rxjs";
import { StaticUtilService } from "@empowered/ngxs-store";

export const PERMISSION_GUARD_REQUIRED = "requiredPermission";
export const PERMISSION_GUARD_ONE = "requiresOnePermission";
export const PERMISSION_GUARD_ALL = "requiresAllPermission";

/**
 * Provide the required permission (or permissions) in string form. If the user does not have the permissions
 * then the navigation gets canceled. Data must be provided to the route in order to use; one of the following
 * fields must be present:
 *     - requiredPermission - The single permission required for the endpoint
 *     - requiresOnePermission - User is required to have one of the following permissions
 *     - requiresAllPermission - User is required to have all of the follow permissions
 *
 * Only of field can be implemented
 */
@Injectable({
    providedIn: "root",
})
export class PermissionGuard implements CanActivate, CanActivateChild {
    constructor(private readonly staticService: StaticUtilService) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
        if (route && route.data && route.data[PERMISSION_GUARD_ALL]) {
            return this.staticService.hasAllPermission(route.data[PERMISSION_GUARD_ALL]);
        }
        if (route && route.data && route.data[PERMISSION_GUARD_ONE]) {
            return this.staticService.hasOnePermission(route.data[PERMISSION_GUARD_ONE]);
        }
        if (route && route.data && route.data[PERMISSION_GUARD_REQUIRED]) {
            return this.staticService.hasPermission(route.data[PERMISSION_GUARD_REQUIRED]);
        }

        // Required data not passed into the guard, fail by default
        return false;
    }

    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
        if (childRoute && childRoute.data && childRoute.data[PERMISSION_GUARD_ALL]) {
            return this.staticService.hasAllPermission(childRoute.data[PERMISSION_GUARD_ALL]);
        }
        if (childRoute && childRoute.data && childRoute.data[PERMISSION_GUARD_ONE]) {
            return this.staticService.hasOnePermission(childRoute.data[PERMISSION_GUARD_ONE]);
        }
        if (childRoute && childRoute.data && childRoute.data[PERMISSION_GUARD_REQUIRED]) {
            return this.staticService.hasPermission(childRoute.data[PERMISSION_GUARD_REQUIRED]);
        }

        // Required data not passed into the guard, fail by default
        return false;
    }
}
