import { Injectable } from "@angular/core";
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from "@angular/router";
import { AccountService } from "@empowered/api";
import { UserService } from "@empowered/user";
import { Store } from "@ngxs/store";
import { combineLatest, Observable, of, Subject } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { AccountInfoState, HasPermissionToAccount, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { loadAccount } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.actions";
import { getSelectedAccount, getSelectedMPGroup } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.selectors";
import { select } from "@ngrx/store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { AccountsActions } from "@empowered/ngrx-store/ngrx-states/accounts";
/**
 * check to see if we can allow the user to see the account
 * save the permission in the store
 * @param staticService an instance of static util service
 * @param accountService an instance of account service
 * @param userService an instance of user service
 * @param route contains the information about the route
 * @param store contains the information about the store
 * @param router used to navigate the user
 * @param state get the state of the router
 * navigate to the customers page if the direct user does not have permission
 * @returns true, if the user has permission or not
 */
export function checkPermission(
    staticUtilService: StaticUtilService,
    accountService: AccountService,
    userService: UserService,
    route: ActivatedRouteSnapshot,
    store: Store,
    router: Router,
    state: RouterStateSnapshot,
    ngrxStore: NGRXStore,
): Observable<boolean> {
    const mpGroup = route.params.mpGroupId || route.params.mpGroup || route.params.prospectId;
    ngrxStore.dispatch(loadAccount({ mpGroup: mpGroup }));
    ngrxStore.dispatch(AccountsActions.setSelectedMPGroup({ mpGroup: mpGroup }));
    const account$ = ngrxStore.onAsyncValue(select(getSelectedAccount));
    return combineLatest(
        staticUtilService.hasPermission("core.account.tpi.admin.importEligible"),
        staticUtilService.hasPermission("aflac.producer.view.selfEnrollment"),
        staticUtilService.cacheConfigValue("aflac.producer.selfEnrollment.accountNumbers"),
        account$,
        userService.credential$,
        accountService.getAccountProducers(mpGroup),
    ).pipe(
        map(([tpiAdmin, selfEnrollment, accountNumbers, account$, credential, producers]) => {
            store.dispatch(
                new HasPermissionToAccount({
                    hasPermission: !(
                        (tpiAdmin &&
                            account$.thirdPartyPlatformsEnabled &&
                            "producerId" in credential &&
                            !producers.some((producer) => producer.producer.id === credential.producerId)) ||
                        (selfEnrollment && accountNumbers.split(",").includes(account$.accountNumber))
                    ),
                    groupId: mpGroup,
                }),
            );
            const portal = store.selectSnapshot(SharedState.portal);
            if (
                state.url.includes(`/${portal.toLowerCase()}/direct`) &&
                (!state.url.includes("customers") || route.params.customerId) &&
                !store.selectSnapshot(AccountInfoState.getPermissionToAccount)
            ) {
                router.navigate([`/${portal.toLowerCase()}/direct/customers/${store.selectSnapshot(AccountInfoState.getGroupId)}`]);
            }
            return true;
        }),
        catchError((error) => {
            const portal = store.selectSnapshot(SharedState.portal);
            store.dispatch(
                new HasPermissionToAccount({
                    hasPermission: false,
                    groupId: route.params.mpGroupId || route.params.mpGroup,
                }),
            );
            if (
                state.url.includes(`/${portal.toLowerCase()}/direct`) &&
                (!state.url.includes("customers") || route.params.customerId) &&
                !store.selectSnapshot(AccountInfoState.getPermissionToAccount)
            ) {
                router.navigate([`/${portal.toLowerCase()}/direct/customers/${store.selectSnapshot(AccountInfoState.getGroupId)}`]);
            }
            return of(true);
        }),
    );
}

/**
 * check if the user has permission by getting value from the store
 * navigate the user to dashboard page if no permission
 * @param router used to navigate the user
 * @param store contains the information about the store
 * @returns boolean, based on the permission of the user
 */
export function checkChildPermission(router: Router, store: Store): Observable<boolean> {
    const portal = store.selectSnapshot(SharedState.portal);
    const groupId = store.selectSnapshot(AccountInfoState.getGroupId);
    if (!store.selectSnapshot(AccountInfoState.getPermissionToAccount)) {
        router.navigate([`/${portal.toLowerCase()}/payroll/${groupId}/dashboard`]);
        return of(false);
    }
    return of(true);
}

/**
 * Check the user has permission to navigate to the account page
 * the user does not have permission then navigate to dashboard page
 */

@Injectable({
    providedIn: "root",
})
export class AccountPermissionGuard implements CanActivate, CanActivateChild {
    private readonly unsubscribe$ = new Subject<void>();
    constructor(
        private readonly staticService: StaticUtilService,
        private readonly accountService: AccountService,
        private readonly userService: UserService,
        private readonly router: Router,
        private readonly store: Store,
        private readonly ngrxStore: NGRXStore,
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
        // check if the user has permission to view the account and store the values in the store.
        return checkPermission(
            this.staticService,
            this.accountService,
            this.userService,
            route,
            this.store,
            this.router,
            state,
            this.ngrxStore,
        );
    }
    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
        // check the permission values from the store, then navigate to the dashboard page if no permission.
        return checkChildPermission(this.router, this.store);
    }
}
