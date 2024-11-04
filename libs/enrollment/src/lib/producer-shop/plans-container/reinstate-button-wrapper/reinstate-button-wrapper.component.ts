import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { PlanOfferingWithCartAndEnrollment, ProducerCredential, PlanOffering, EnrollmentRider, Enrollments } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { AuthSelectors } from "@empowered/ngrx-store/ngrx-states/auth";
import { EnrollmentsActions, EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";
import { select } from "@ngrx/store";
import { EMPTY, Observable, Subject } from "rxjs";
import { map, startWith, switchMap, take, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { ReinstateDialogComponent } from "../../../application-flow-steps/reinstate-dialog/reinstate-dialog.component";

@Component({
    selector: "empowered-reinstate-button-wrapper",
    templateUrl: "./reinstate-button-wrapper.component.html",
    styleUrls: ["./reinstate-button-wrapper.component.scss"],
})
export class ReinstateButtonWrapperComponent implements OnInit, OnDestroy {
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;
    private readonly reinstate$ = new Subject<void>();
    private readonly unsubscriber$ = new Subject<void>();
    // Gets member id
    readonly memberId$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberId));
    // Gets mpGroup
    readonly mpGroup$ = this.ngrxStore.pipe(select(AccountsSelectors.getSelectedMPGroup));
    // Gets selected CountryState and city details
    private readonly selectedCountryStateAndCity$ = this.ngrxStore.onAsyncValue(
        select(MembersSelectors.getSelectedMemberEnrollmentCountryStateAndCity),
    );
    // Gets selected enrollment method
    private readonly selectedEnrollmentMethod$ = this.ngrxStore.pipe(select(SharedSelectors.getSelectedEnrollmentMethod));
    // Gets group admin ID
    private readonly assistingAdminId$ = this.ngrxStore
        .onAsyncValue(select(AuthSelectors.selectUserCredential))
        .pipe(map((credential) => (credential ? credential.adminId || (credential as ProducerCredential).producerId : null)));

    // Get PlanOfferingRiders using PlanOffering input bind
    private planOfferingRiders$!: Observable<PlanOffering[]>;
    // Get the enrolled riders
    enrolledRiders$!: Observable<EnrollmentRider[]>;

    // Get whole enrollment set
    private readonly enrollments$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollments));

    constructor(private readonly ngrxStore: NGRXStore, private readonly dialog: MatDialog) {}

    /**
     * reinstate subscription logic on initialization
     */
    ngOnInit(): void {
        // Get PlanOfferingRiders
        this.planOfferingRiders$ = this.ngrxStore.onAsyncValue(
            select(PlanOfferingsSelectors.getPlanOfferingRiders(this.planPanel.planOffering.id)),
        );

        this.enrolledRiders$ = this.ngrxStore
            .onAsyncValue(select(EnrollmentsSelectors.getEnrollmentRiders(this.planPanel.enrollment?.id)))
            .pipe(startWith([]));

        this.reinstate$
            .pipe(
                withLatestFrom(this.memberId$, this.mpGroup$, this.selectedCountryStateAndCity$, this.selectedEnrollmentMethod$),
                withLatestFrom(this.assistingAdminId$, this.planOfferingRiders$, this.enrolledRiders$),
                switchMap(
                    ([
                        [, memberId, mpGroup, selectedStateAndCity, selectedEnrollmentMethod],
                        assistingAdminId,
                        planOfferingRiders,
                        enrolledRiders,
                    ]) => {
                        const enrollment = { ...this.planPanel.enrollment };
                        // Incase if enrollment plan offering id is not matching with the current panel plan offering id
                        enrollment.planOfferingId = this.planPanel.planOffering.id;
                        // map rider enrollments for this enrollment based on current plan offering rider data
                        // Incase if rider enrollment plan offering id is not matching with current rider plan offering id
                        if (enrolledRiders?.length && planOfferingRiders?.length) {
                            enrollment.riders = enrolledRiders.map((rider) => {
                                const riderOfferingData = planOfferingRiders.find((riderData) => riderData.plan.id === rider.plan.id);
                                // If rider plan offering data exists append the plan offering id
                                return { ...rider, ...(riderOfferingData && { planOfferingId: riderOfferingData.id }) };
                            });
                        } else {
                            enrollment.riders = [];
                        }
                        const reinstateData = {
                            planId: this.planPanel.enrollment.plan.id,
                            memberId: memberId,
                            mpGroup: mpGroup,
                            state: selectedStateAndCity.countryState.abbreviation,
                            enrollmentMethod: selectedEnrollmentMethod,
                            planOfferingId: this.planPanel.enrollment.planOfferingId,
                            // TODO - Checked and only assistingAdminId is being used in dialog.
                            // Have to check and change this from out of shop rewrite scope
                            // from application flow, member portal, old and new shop pages
                            cartData: {
                                assistingAdminId,
                            },
                            policyData: enrollment,
                        };

                        return this.dialog
                            .open(ReinstateDialogComponent, {
                                hasBackdrop: true,
                                data: reinstateData,
                                width: "100%",
                                height: "100%",
                            })
                            .afterClosed()
                            .pipe(
                                switchMap((reinstateResponse) =>
                                    // If reinstate is completed updated enrollment to panel else nothing
                                    reinstateResponse?.completed ? this.updateEnrollmentToPanel(mpGroup, memberId) : EMPTY,
                                ),
                            );
                    },
                ),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();
    }

    /**
     * Updates newly reinstated enrollment to plan panel
     * @param mpGroup {number} mpGroup
     * @param memberId {number} memberId
     * @returns Observable of enrollments
     */
    updateEnrollmentToPanel(mpGroup: number, memberId: number): Observable<Enrollments[]> {
        // Dispatch action to load updated enrollment list
        this.ngrxStore.dispatch(EnrollmentsActions.loadEnrollments({ mpGroup, memberId }));
        return this.enrollments$.pipe(
            tap((enrollments) => {
                const reinstatedEnrollment = enrollments.find(
                    (enrollmentData) => enrollmentData.planOfferingId === this.planPanel.planOffering.id,
                );
                // Set the reinstated enrollment id as the selected enrollment id
                if (reinstatedEnrollment) {
                    this.ngrxStore.dispatch(EnrollmentsActions.setSelectedEnrollmentId({ enrollmentId: reinstatedEnrollment.id }));
                }
            }),
            take(1),
        );
    }

    /**
     * Triggers reinstate logic
     */
    reinstate(): void {
        this.reinstate$.next();
    }

    /**
     * Clean up rxjs subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
}
