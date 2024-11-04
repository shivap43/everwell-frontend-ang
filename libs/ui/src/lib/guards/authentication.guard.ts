import { Store } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateChild, Router, RouterStateSnapshot, UrlTree, CanActivate } from "@angular/router";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { UserService } from "@empowered/user";
import { SetPermissions } from "@empowered/ngxs-store";

@Injectable({
    providedIn: "root",
})
export class AuthenticationGuard implements CanActivate, CanActivateChild {
    redirectRoute: UrlTree = this.router.parseUrl("/not-authorized");

    constructor(private user: UserService, private router: Router, private store: Store) {}

    canActivate(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
        return this.checkAuthentication(state);
    }

    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
        return this.checkAuthentication(state);
    }

    /**
     * This method authenticates the user and gets the URL
     * @param state has the state of the router
     * @returns observable of type boolean or URLTree
     */
    checkAuthentication(state: RouterStateSnapshot): Observable<boolean | UrlTree> {
        this.store.dispatch(new SetPermissions());
        const portal = state.url.match("admin|member|producer").shift();

        if (portal) {
            this.redirectRoute = this.router.parseUrl(`/${portal}/login`);
            this.redirectRoute.queryParams = {
                returnUrl: state.url,
            };
        }
        let retValue;
        const credential = JSON.parse(sessionStorage.getItem("user"));
        if (credential && Object.keys(credential).length && !this.comparePortals(credential, portal)) {
            retValue = this.redirectRoute;
        } else if (credential && credential.memberId && portal === "member" && credential.isPendingEnrollments) {
            retValue = this.router.parseUrl(`/${portal}/review-enrollment`);
            retValue.queryParams = { memberId: credential.memberId, groupId: credential.groupId };
        } else {
            retValue = this.user.isAuthenticated$.pipe(map((val) => (val ? true : this.redirectRoute)));
        }

        return retValue;
    }
    comparePortals(credential: any, currentPortal: string): boolean {
        let returnFlag = false;
        if ("producerId" in credential && currentPortal === "producer") {
            returnFlag = true;
        } else if ("adminId" in credential && !("memberId" in credential) && currentPortal === "admin") {
            returnFlag = true;
        } else if ("adminId" in credential && "memberId" in credential && currentPortal !== "producer") {
            returnFlag = true;
        } else if ("memberId" in credential && currentPortal === "member") {
            returnFlag = true;
        }
        return returnFlag;
    }
}
