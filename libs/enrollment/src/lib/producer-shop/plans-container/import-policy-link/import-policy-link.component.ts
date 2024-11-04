import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { EnrollmentsActions } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { ProductsSelectors } from "@empowered/ngrx-store/ngrx-states/products";
import { SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";
import { ImportPolicyModalComponent } from "@empowered/ui";
import { select } from "@ngrx/store";
import { Subject } from "rxjs";
import { filter, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { EmpoweredModalService } from "@empowered/common-services";

@Component({
    selector: "empowered-import-policy-link",
    templateUrl: "./import-policy-link.component.html",
    styleUrls: ["./import-policy-link.component.scss"],
})
export class ImportPolicyLinkComponent implements OnInit, OnDestroy {
    @Input() productName!: string;
    readonly stateAbbreviation$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberEnrollmentStateAbbreviation));
    readonly enrollmentMethod$ = this.ngrxStore.pipe(select(SharedSelectors.getSelectedEnrollmentMethod));
    // subject to emit once plan importPolicy link clicked
    private readonly importPolicyLinkClicked$ = new Subject<void>();
    private readonly unsubscribe$ = new Subject<void>();
    // Gets selected memberId
    private readonly selectedMemberId$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberId));
    // Gets selected product id
    readonly selectedProductId$ = this.ngrxStore.pipe(select(ProductsSelectors.getSelectedProductId));

    // Gets selected mpGroup
    private readonly selectedMpGroup$ = this.ngrxStore.pipe(select(AccountsSelectors.getSelectedMPGroup));
    constructor(private readonly empoweredModalService: EmpoweredModalService, private readonly ngrxStore: NGRXStore) {}

    ngOnInit(): void {
        this.importPolicyLinkClicked$
            .pipe(
                withLatestFrom(
                    this.selectedMpGroup$,
                    this.selectedMemberId$,
                    this.selectedProductId$,
                    this.stateAbbreviation$,
                    this.enrollmentMethod$,
                ),
                tap(([_, mpGroup, memberId, productId, stateAbbreviation, enrollmentMethod]) => {
                    this.openImportPolicyModal(mpGroup, memberId, productId, stateAbbreviation, enrollmentMethod);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * This method opens import policy dialog
     * @param mpGroup: group id
     * @param memberId: member id
     * @param productId: product id
     * @param enrollmentStateAbbreviation enrollment state
     * @param enrollmentType: Enrollment type selected
     */
    openImportPolicyModal(
        mpGroup: number,
        memberId: number,
        productId: number,
        enrollmentStateAbbreviation: string,
        enrollmentType: string,
    ): void {
        this.empoweredModalService
            .openDialog(ImportPolicyModalComponent, {
                data: {
                    mpGroup,
                    memberId,
                    productId,
                    productName: this.productName,
                    enrollmentType,
                    enrollmentStateAbbreviation,
                },
            })
            .afterClosed()
            .pipe(
                filter((response: boolean) => response),
                tap(() => {
                    // dispatch action for enrollment set to bring up import policy
                    this.ngrxStore.dispatch(EnrollmentsActions.loadEnrollments({ mpGroup, memberId }));
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * importPolicyLinkClicked subject gets emitted once click on import policy link
     */
    importPolicy(): void {
        this.importPolicyLinkClicked$.next();
    }

    /**
     * Clean up rxjs subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
