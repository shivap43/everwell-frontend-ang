import { combineLatest, Observable, of } from "rxjs";
import { Injectable } from "@angular/core";
import { TPIRestrictionsForHQAccountsService } from "@empowered/common-services";
import { NGRXStore } from "@empowered/ngrx-store";
import { select } from "@ngrx/store";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { map, shareReplay, switchMap } from "rxjs/operators";
import { Permission, ProductId } from "@empowered/constants";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { ProductsSelectors } from "@empowered/ngrx-store/ngrx-states/products";

@Injectable({
    providedIn: "root",
})
export class TpiRestrictionsHelperService {
    // Get MpGroup ID
    private readonly mpGroup$ = this.ngrxStore.pipe(select(AccountsSelectors.getSelectedMPGroup));

    // Get member ID
    private readonly memberId$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberId));

    // Gets selected product Id
    private readonly selectedProductId$ = this.ngrxStore.pipe(select(ProductsSelectors.getSelectedProductId));

    canAccessTPIRestrictedModule$: Observable<boolean>;

    constructor(private readonly tpiRestrictions: TPIRestrictionsForHQAccountsService, private readonly ngrxStore: NGRXStore) {
        this.canAccessTPIRestrictedModule$ = this.mpGroup$.pipe(
            switchMap((mpGroup) => {
                if (!mpGroup) {
                    return of(false);
                }

                return this.tpiRestrictions.canAccessTPIRestrictedModuleInHQAccount(Permission.DEPENDENTS_READONLY, null, mpGroup);
            }),
            shareReplay(1),
        );
    }

    /**
     * indicates if dependent is required for Juvenile products based on HQ account permissions
     * @returns boolean indicating if dependent is required or not
     */
    isDependentRequiredForJuvenile(): Observable<boolean> {
        return combineLatest([this.selectedProductId$, this.memberId$]).pipe(
            switchMap(([selectedProductId]) => {
                if (selectedProductId === ProductId.JUVENILE_TERM_LIFE || selectedProductId === ProductId.JUVENILE_WHOLE_LIFE) {
                    return combineLatest([
                        this.canAccessTPIRestrictedModule$,
                        this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberDependents)),
                    ]).pipe(map(([canAccessAflacHQAc, dependents]) => !canAccessAflacHQAc && !dependents.length));
                }
                return of(false);
            }),
        );
    }
}
