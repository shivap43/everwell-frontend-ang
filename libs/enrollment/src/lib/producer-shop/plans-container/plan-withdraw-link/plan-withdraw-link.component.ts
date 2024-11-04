import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { PlanOffering, Enrollments } from "@empowered/constants";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { EnrollmentsActions, EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { EmpoweredModalService } from "@empowered/common-services";
import { select } from "@ngrx/store";
import { Subject } from "rxjs";
import { filter, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { VoidCoverageComponent } from "../../../benefit-summary/edit-coverage/void-coverage/void-coverage.component";
import { ProducerShopHelperService } from "../../services/producer-shop-helper/producer-shop-helper.service";

@Component({
    selector: "empowered-plan-withdraw-link",
    templateUrl: "./plan-withdraw-link.component.html",
    styleUrls: ["./plan-withdraw-link.component.scss"],
})
export class PlanWithdrawLinkComponent implements OnInit, OnDestroy {
    @Input() planOffering!: PlanOffering;

    // subject to emit once plan withdraw link clicked
    private readonly withDrawPlanLinkClicked$ = new Subject<void>();
    private readonly unsubscribe$ = new Subject<void>();

    // Gets selected memberId
    private readonly selectedMemberId$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberId));

    // Get whole enrollment set
    readonly enrollments$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollments));

    // Gets selected mpGroup
    private readonly selectedMpGroup$ = this.ngrxStore.pipe(select(AccountsSelectors.getSelectedMPGroup));

    constructor(
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly producerShopHelperService: ProducerShopHelperService,
        private readonly ngrxStore: NGRXStore,
    ) {}

    ngOnInit(): void {
        this.withDrawPlanLinkClicked$
            .pipe(
                withLatestFrom(
                    this.selectedMpGroup$,
                    this.selectedMemberId$,
                    this.producerShopHelperService.getSelectedEnrollment(this.planOffering),
                ),
                tap(([_, mpGroup, memberId, selectedEnrolledData]) => {
                    this.openPlanWithdrawalLink(mpGroup, memberId, selectedEnrolledData);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * This method opens plan withdraw coverage dialog
     * @param mpGroup: group id
     * @param memberId: member id
     * @param selectedEnrollment: Enrollment object of the selected enrolled plan
     */
    openPlanWithdrawalLink(mpGroup: number, memberId: number, selectedEnrollment: Enrollments): void {
        const dialogRef = this.empoweredModalService.openDialog(VoidCoverageComponent, {
            data: {
                planName: selectedEnrollment.plan.name,
                mpGroup,
                memberId,
                enrollId: selectedEnrollment.id,
                isShop: true,
            },
        });

        dialogRef
            .afterClosed()
            .pipe(
                filter((response: boolean) => response),
                tap(() => {
                    this.ngrxStore.dispatch(EnrollmentsActions.loadEnrollments({ mpGroup, memberId }));
                    this.ngrxStore.dispatch(EnrollmentsActions.setSelectedEnrollmentId({ enrollmentId: null }));
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * withDrawPlanLinkClicked subject gets emitted once click on plan withdraw link
     */
    withDrawPlan(): void {
        this.withDrawPlanLinkClicked$.next();
    }

    /**
     * Clean up rxjs subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
