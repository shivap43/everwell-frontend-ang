import { Store } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivateChild } from "@angular/router";
import { Observable } from "rxjs";
import { AccountInfoState } from "@empowered/ngxs-store";
import { TPIRestrictionsForHQAccountsService } from "@empowered/common-services";

@Injectable({
    providedIn: "root",
})
export class TPIHQGuard implements CanActivate, CanActivateChild {
    constructor(private readonly tpiRestrictions: TPIRestrictionsForHQAccountsService, private readonly store: Store) {}
    /**
     * Decides if a TPI-restricted route can be activated based on whether the account is Aflac HQ account,
     * the required permission and on whether the feature config for TPI restrictions is enabled
     * @param route route associated with a component loaded in an outlet
     * @param state represents the state of the router at the moment
     * @returns observable of boolean that indicates if the route can be accessed
     */
    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot,
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        const mpGroupId = this.store.selectSnapshot(AccountInfoState.getGroupId);
        return route
            ? this.tpiRestrictions.canAccessTPIRestrictedModuleInHQAccount(
                (route.data && route.data.requiredTPIPermission) || "",
                (route.data && route.data.requiredConfig) || "",
                +mpGroupId,
            )
            : false;
    }

    /**
     * Decides if a child route can be activated based on whether the account is Aflac HQ account,
     * the required permission and on whether the feature config for TPI restrictions is enabled
     * @param route route associated with a component loaded in an outlet
     * @param state represents the state of the router at the moment
     * @returns observable of boolean that indicates if the route can be accessed
     */
    canActivateChild(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot,
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        const mpGroupId = this.store.selectSnapshot(AccountInfoState.getGroupId);
        return route
            ? this.tpiRestrictions.canAccessTPIRestrictedModuleInHQAccount(
                (route.data && route.data.requiredTPIPermission) || "",
                (route.data && route.data.requiredConfig) || "",
                +mpGroupId,
            )
            : false;
    }
}
