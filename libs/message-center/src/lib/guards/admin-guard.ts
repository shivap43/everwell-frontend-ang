import { ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivate, UrlTree } from "@angular/router";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { UserService } from "@empowered/user";
import { map } from "rxjs/operators";
import { PortalType } from "@empowered/constants";

@Injectable({
    providedIn: "root",
})
export class AdminGuard implements CanActivate {
    constructor(private readonly user: UserService, private readonly router: Router) {}

    /**
     * Checks to see if the user is an admin or not. Only admins are allowed.
     * @param childRoute the route
     * @param state the state of the router
     * @returns If the user is allowed to navigate or not.
     */
    canActivate(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
        return this.user.portal$.pipe(
            map(portal => portal.toUpperCase() === PortalType.ADMIN),
            map(val => (val ? true : this.router.parseUrl(state.url.replace(/settings/, ""))))
        );
    }
}
