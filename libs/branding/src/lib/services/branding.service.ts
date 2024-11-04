import { Injectable } from "@angular/core";
import { Store } from "@ngxs/store";
import { Observable, combineLatest, defer, of, iif, merge } from "rxjs";
import { filter, switchMap, shareReplay, map, tap, distinctUntilChanged } from "rxjs/operators";
import { MPGroupAccountService, SharedService, PortalType } from "@empowered/common-services";
import {
    StaticUtilService,
    DereferencedBrandingModel,
    BrandingState,
    BrandingDomainType,
    ColorControlService,
    GetBranding,
} from "@empowered/ngxs-store";
const CONFIG_BRANDING_ENABLED = "general.branding.enabled";
const PORTAL_PRODUCER = "producer";
const PORTAL_PUBLIC = "public";
/**
 * Branding Service is use to provide type of branding
 * @param authenticatedPortal$ is Observable of type PortalType used to get type of portal
 */
@Injectable({
    providedIn: "root",
})
export class BrandingService {
    authenticatedPortal$: Observable<PortalType> = this.shared.userPortal$.pipe(
        filter((userPortal) => userPortal.type !== PORTAL_PUBLIC),
        map((portal) => portal.type as PortalType),
        shareReplay(1),
    );

    constructor(
        private readonly store: Store,
        private readonly mpGroup: MPGroupAccountService,
        private readonly staticUtil: StaticUtilService,
        private readonly shared: SharedService,
        private readonly colorControl: ColorControlService,
    ) {}

    /**
     * customBrandingColor$ is used to get active branding color
     * @returns Observable of type string and return branding hex color
     */
    get customBrandingColor$(): Observable<string> {
        return this.customBrandingObservable$.pipe(
            switchMap((branding) =>
                iif(
                    () => Boolean(branding),
                    defer(() =>
                        this.customBrandingObservable$.pipe(map((brandings) => `#${this.colorControl.accountBrandingToHex(brandings)}`)),
                    ),
                    defer(() => of(undefined)),
                ),
            ),
            shareReplay(1),
        );
    }

    /**
     * customBrandingObservable$ is used to get customBranding
     * @returns Observable of type DereferencedBrandingModel
     */
    get customBrandingObservable$(): Observable<DereferencedBrandingModel> {
        return combineLatest([
            this.mpGroup.mpGroupAccount$,
            this.staticUtil.cacheConfigEnabled(CONFIG_BRANDING_ENABLED),
            this.authenticatedPortal$,
        ]).pipe(
            filter(([, isEnabled]) => isEnabled),
            switchMap(([account, , portal]) =>
                // Favor the brokerage branding unless it doesn't exist
                this.store.select(BrandingState.getLatestBranding(BrandingDomainType.BROKERAGE, undefined, true)).pipe(
                    switchMap((brokerageBranding) => {
                        if (brokerageBranding) {
                            return of(brokerageBranding);
                        }
                        if (account) {
                            // If there is an account with branding, show it
                            return this.store.select(BrandingState.getLatestBranding(BrandingDomainType.ACCOUNT, account.id, true));
                        }
                        // Otherwise, no branding for you
                        return of(undefined);
                    }),
                ),
            ),
            shareReplay(1),
        );
    }
    /**
     * groupBrandingRefresh$ is used to update the displayed branding
     * @returns an observable watching for dispatches from the store
     */
    get groupBrandingRefresh$(): Observable<number | PortalType> {
        return this.authenticatedPortal$.pipe(
            distinctUntilChanged(),
            switchMap((portal) =>
                defer(() => {
                    // Whenever there is a group in scope, dispatch a request for their branding
                    const account$: Observable<number> = this.mpGroup.mpGroupAccount$.pipe(
                        filter((account) => Boolean(account)),
                        map((account) => account.id),
                        distinctUntilChanged(),
                        tap((accountId) => this.store.dispatch(new GetBranding(BrandingDomainType.ACCOUNT, accountId))),
                    );
                    // monitor both the current group in context and the brokerage
                    return merge(
                        account$,
                        of(portal).pipe(tap((unusedVar) => this.store.dispatch(new GetBranding(BrandingDomainType.BROKERAGE, undefined)))),
                    );
                }),
            ),
        );
    }
}
