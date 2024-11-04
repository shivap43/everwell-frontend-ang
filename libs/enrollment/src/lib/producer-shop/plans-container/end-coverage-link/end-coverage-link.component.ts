import { BenefitOfferingUtilService } from "@empowered/ui";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { TaxStatus, PlanOffering, Admin, CarrierId } from "@empowered/constants";
import { select } from "@ngrx/store";
import { combineLatest, iif, Observable, of, Subject } from "rxjs";
import { map, switchMap, take, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { EndCoverageComponent } from "../../../benefit-summary/end-coverage/end-coverage.component";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { AccountsActions, AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { MatDialogRef } from "@angular/material/dialog";
import { EndCoverageModalInput, EnrolledDetailData } from "./end-coverage-link.model";
import { ProducerShopHelperService } from "../../services/producer-shop-helper/producer-shop-helper.service";
import { BenefitSummaryService, EmpoweredModalService } from "@empowered/common-services";

@Component({
    selector: "empowered-end-coverage-link",
    templateUrl: "./end-coverage-link.component.html",
    styleUrls: ["./end-coverage-link.component.scss"],
})
export class EndCoverageLinkComponent implements OnInit, OnDestroy {
    @Input() planOffering!: PlanOffering;

    // Get whole enrollment set
    readonly enrollments$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollments));

    // Gets selected memberId
    private readonly selectedMemberId$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberId));

    // Gets selected mpGroup
    private readonly selectedMpGroup$ = this.ngrxStore.pipe(select(AccountsSelectors.getSelectedMPGroup));

    // Gets MemberDetail data
    private readonly memberDetail$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberProfile));

    readonly PRETAX = TaxStatus.PRETAX;

    // Account has admin set up or not
    readonly hasAccountAdmin$ = this.ngrxStore
        .onAsyncValue(select(AccountsSelectors.getSelectedAccountAdmins))
        .pipe(map((accountAdmin) => Boolean(accountAdmin.length)));

    private readonly clicked$ = new Subject<void>();

    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly ngrxStore: NGRXStore,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly benefitSummaryService: BenefitSummaryService,
        private readonly producerShopHelperService: ProducerShopHelperService,
        private readonly benefitOfferingUtilService: BenefitOfferingUtilService,
    ) {}

    ngOnInit(): void {
        this.clicked$
            .pipe(
                withLatestFrom(
                    this.selectedMpGroup$,
                    this.selectedMemberId$,
                    this.producerShopHelperService.getSelectedEnrollment(this.planOffering),
                    this.memberDetail$,
                    this.hasAccountAdmin$,
                ),
                tap(([_, mpGroup, memberId, selectedEnrolledData, memberDetail, hasAccountAdmin]) => {
                    this.openEndCoveragePopup(
                        {
                            mpGroup,
                            memberId,
                            selectedEnrolledData,
                            memberDetail,
                        },
                        hasAccountAdmin,
                    );
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Function to open the pop up to proceed with ending the coverage feature
     * @param enrolledDetailData data object for enrolled plan
     * @param hasAccountAdmin if group has admin added
     */
    openEndCoveragePopup(enrolledDetailData: EnrolledDetailData, hasAccountAdmin: boolean): void {
        // If admin is not added to group for pre tax plan , admin popup appears before ending the coverage
        if (!hasAccountAdmin && enrolledDetailData.selectedEnrolledData.taxStatus === TaxStatus.PRETAX) {
            // This flag will ensure that add admin pop up appearing while ending the coverage,
            // so the verbiage can be set accordingly on model
            this.benefitSummaryService.setEndCoverageFlag(true);
            this.openAddAdminPopup(enrolledDetailData);
        } else {
            // popup to appear in order to end the coverage
            this.empoweredModalService.openDialog(EndCoverageComponent, {
                data: this.getEndCoverageModalInput(enrolledDetailData),
            });
        }
    }

    /**
     * Function to open the pop up to get the admin added manually if plan is pretax and admin doesn't exist for group
     * @param enrolledDetailData Detailed object required for opening the popup
     */
    openAddAdminPopup(enrolledDetailData: EnrolledDetailData): void {
        combineLatest([
            this.benefitOfferingUtilService.addAdminPopUp(),
            this.ngrxStore.onAsyncValue(select(AccountsSelectors.getSelectedAccountAdmins)),
        ])
            .pipe(
                take(1),
                map(([status, adminList]) => ({
                    status,
                    adminList,
                })),
                switchMap((data) =>
                    iif(
                        () => data.status !== null && data.status !== undefined && data.status !== "false",
                        of(data.status).pipe(
                            // if user wants to add admin, open addAdminManually popup
                            switchMap(() => this.addAdmin(data.status, data.adminList, enrolledDetailData)),
                        ),
                        of(data.status).pipe(tap(() => of(null))),
                    ),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * This method is called to fire the post call for adding the admin to the current group
     * @param choice: choice of admin addition
     * @param adminList: list of admin if exist any
     * @param enrolledDetailData: enrollment information needed for end coverage request
     * @returns Observable<string | boolean | MatDialogRef<EndCoverageComponent>>, returns status (string | boolean)
     */
    addAdmin(
        choice: string,
        adminList: Admin[],
        enrolledDetailData: EnrolledDetailData,
    ): Observable<string | boolean | MatDialogRef<EndCoverageComponent>> {
        return this.benefitOfferingUtilService.addAdmin(adminList, choice).pipe(
            tap((status) => {
                // from addAdmin API, if status is true then opens end coverage popup
                if (status === true) {
                    this.openEndCoveragePopupAfterAdminAddition(enrolledDetailData);
                }
            }),
            takeUntil(this.unsubscribe$),
        );
    }

    /** *
     * Used to open EndCoverageComponent dialog modal
     *
     * @param enrolledDetailData: enrollment information needed for end coverage request
     * @returns MatDialogRef<EndCoverageComponent>, returns a MatDialogRef<EndCoverageComponent>
     */
    openEndCoveragePopupAfterAdminAddition(enrolledDetailData: EnrolledDetailData): MatDialogRef<EndCoverageComponent> {
        // Dispatching action for get admin after adding the admin to the group
        this.ngrxStore.dispatch(
            AccountsActions.loadAccountAdmins({
                mpGroup: enrolledDetailData.mpGroup,
            }),
        );

        return this.empoweredModalService.openDialog(EndCoverageComponent, {
            data: this.getEndCoverageModalInput(enrolledDetailData),
        });
    }

    /**
     * Returns data needed to populate the EndCoverageComponent dialog modal
     *
     * @param enrolledDetailData: enrollment information needed for end coverage request
     * @returns {EndCoverageModalInput} populated data modal for End coverage request
     */
    getEndCoverageModalInput(enrolledDetailData: EnrolledDetailData): EndCoverageModalInput {
        return {
            memberId: enrolledDetailData.memberId,
            mpGroup: enrolledDetailData.mpGroup,
            enrollmentId: enrolledDetailData.selectedEnrolledData.id,
            enrollmentTaxStatus: enrolledDetailData.selectedEnrolledData.taxStatus,
            coverageStartDate: enrolledDetailData.selectedEnrolledData.validity.effectiveStarting,
            expiresAfter: enrolledDetailData.selectedEnrolledData.validity.expiresAfter,
            planName: enrolledDetailData.selectedEnrolledData.plan.name,
            employeeName: `${enrolledDetailData.memberDetail.name.firstName} ${enrolledDetailData.memberDetail.name.lastName}`,
            isShop: true,
            isArgus: enrolledDetailData.selectedEnrolledData.plan?.carrier?.id === CarrierId.ADV,
        };
    }

    handleClick(): void {
        this.clicked$.next();
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
