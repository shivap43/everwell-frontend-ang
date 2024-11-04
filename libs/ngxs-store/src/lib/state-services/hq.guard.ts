import { Store } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Observable, combineLatest, of } from "rxjs";
import { map, catchError, first } from "rxjs/operators";
import { AccountService } from "@empowered/api";
import { AppSettings } from "@empowered/constants";
import { AccountInfoState } from "../dashboard/dashboard.state";
import { StaticUtilService } from "./static-util.service";
const MEMBER = "member";
const IS_HQ_ACCOUNT = "is_hq_account";
const REQUIRED_HQ_PERMISSION = "requiredHQPermission";

/**
 * check to see if we can allow access to path based on HQ account
 * if no permission is provided, then the route is not accessible for an HQ account
 * @param staticService an instance of static util service
 * @param accountService an instance of account service
 * @param requiredHQPermission required hq permission name for access (optional)
 * @param isMember a boolean of whether in MMP (optional)
 * @param groupId id of the group (optional)
 * @returns an observable of boolean of whether the route should be activated
 */
export function checkIfAbleToAccessModuleInHQAccount(
    staticUtilService: StaticUtilService,
    accountService: AccountService,
    requiredHQPermission?: string,
    isMember?: boolean,
    groupId?: number,
): Observable<boolean> {
    return combineLatest(
        // if "blank" permission is passed, then this means the access is controlled only by whether
        // the account is an HQ account
        staticUtilService.hasPermission(requiredHQPermission || ""),
        accountService.getGroupAttributesByName([IS_HQ_ACCOUNT], groupId).pipe(first()),
    ).pipe(
        map(
            ([haveRequiredHqPermission, isHqAccountAttributes]) =>
                isMember ||
                haveRequiredHqPermission ||
                isHqAccountAttributes.length === 0 ||
                isHqAccountAttributes[0].value.toLowerCase() !== AppSettings.TRUE.toLowerCase(),
        ),
        catchError(() => of(false)),
    );
}

/**
 * Provide the required permission in a string. If the user has the permission, then the navigation continues.
 * If no permission is provided, then the route is not accessible for a HQ account
 * Data must be provided to the route in order to use; required data
 *   -requiredHqPermission: required hq permission for access we want to apply to the route (optional)
 */
@Injectable({
    providedIn: "root",
})
export class HQGuard implements CanActivate, CanActivateChild {
    constructor(
        private readonly staticUtilService: StaticUtilService,
        private readonly accountService: AccountService,
        private readonly store: Store,
    ) {}

    /**
     * check to see if a route can be activated based on hq and permission settings
     * @param route the route that this guard is placed upon
     * @param state router state
     * @returns if the route doesn't exist, then return false; otherwise, return an observable of
     *          the boolean indicating whether we can access the route based on HQ account attribute and user permission
     *          (note: if no permission is provided, then the route is not accessible for a HQ account)
     */
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
        if (route) {
            const mpGroupId = this.store.selectSnapshot(AccountInfoState.getGroupId);
            const isMember = state.url ? state.url.toLocaleLowerCase().includes(MEMBER) : false;
            return checkIfAbleToAccessModuleInHQAccount(
                this.staticUtilService,
                this.accountService,
                // if "blank" permission is passed, then this means the access is controlled only by whether
                // the account is an HQ account
                route.data && route.data[REQUIRED_HQ_PERMISSION] ? route.data[REQUIRED_HQ_PERMISSION] : "",
                isMember,
                +mpGroupId,
            );
        }
        // Required data not passed into the guard, fail by default
        return false;
    }

    /**
     * check to see if a child route can be activated based on hq and permission settings
     * @param childRoute the route that this guard is placed upon
     * @param state router state
     * @returns if the child route doesn't exist, then return false; otherwise, return an observable of
     *          the boolean indicating whether we can access the route based on HQ account attribute and user permission
     *          (note: if no permission is provided, then the route is not accessible for a HQ account)
     */
    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
        if (childRoute) {
            const mpGroupId = this.store.selectSnapshot(AccountInfoState.getGroupId);
            const isMember = state.url ? state.url.toLocaleLowerCase().includes(MEMBER) : false;
            return checkIfAbleToAccessModuleInHQAccount(
                this.staticUtilService,
                this.accountService,
                childRoute.data && childRoute.data[REQUIRED_HQ_PERMISSION]
                    ? childRoute.data[REQUIRED_HQ_PERMISSION]
                    : // if "blank" permission is passed, then this means the access is controlled only by whether
                // the account is an HQ account
                    "",
                isMember,
                +mpGroupId,
            );
        }
        // Required data not passed into the guard, fail by default
        return false;
    }
}
