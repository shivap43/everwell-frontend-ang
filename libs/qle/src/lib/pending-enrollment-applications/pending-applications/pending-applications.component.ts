import { PendingApplicationTableModel, EnrollmentService, MemberService, PendingEnrollmentReason } from "@empowered/api";
import { Store } from "@ngxs/store";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { DatePipe, TitleCasePipe } from "@angular/common";

import { AppSettings, Enrollments, MemberProfile, MemberQualifyingEvent } from "@empowered/constants";
import { Router, ActivatedRoute } from "@angular/router";
import { PendingEnrollmentComponent } from "../../pending-enrollment/pending-enrollment.component";
import { MatDialog } from "@angular/material/dialog";
import { EditStatusPopUpComponent } from "../edit-status-pop-up/edit-status-pop-up.component";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { tap, filter, switchMap, takeUntil } from "rxjs/operators";
import { Observable, Subject } from "rxjs";
import { UserService } from "@empowered/user";
import { getPendingReasonLanguage } from "../account-pending-enrollments/account-pending-enrollments.component";
import { AccountListState, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

const UNSPECIFIED = "Unspecified";

const ADMIN_URL = "accountList";
const PRODUCER_URL = "payroll";
const ADMIN_ID_VAR = "adminId";
const DIRECT = "direct";

@Component({
    selector: "empowered-pending-applications",
    templateUrl: "./pending-applications.component.html",
    styleUrls: ["./pending-applications.component.scss"],
})
export class PendingApplicationsComponent implements OnInit, OnDestroy {
    memberInfo: any;
    enrollmentId: any;
    isLoading: boolean;
    mpGroupId: number;
    memberId: number;
    employeeData: any;
    pendingStatus: any[] = [];
    testData: any[] = [];
    displayedColumns = ["plan", "reason", "lifeEventDate", "status", "manage"];
    directDisplayColumns = ["plan", "reason", "status"];
    sampleData: any[] = [];
    mpGroup: any;
    catId: number;
    routeAfterLogin: any;
    isDirect: boolean;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.accountPendingEnrollments.pendingEnrollments",
        "primary.portal.common.back",
        "primary.portal.common.submit",
        "primary.portal.dashboard.employees",
        "primary.portal.pendingApplication.noPendingEmployee",
        "primary.portal.accountPendingEnrollments.editStatus",
        "primary.portal.accountPendingEnrollments.includeLifeEvent",
        "primary.portal.accountPendingEnrollments.viewAll",
        "primary.portal.accountPendingEnrollments.pendingEnrollmentsSmall",
        "primary.portal.pendingApplication.noPendingEmployee",
        "primary.portal.accountPendingEnrollments.plan",
        "primary.portal.accountPendingEnrollments.reason",
        "primary.portal.accountPendingEnrollments.lifeEventDate",
        "primary.portal.accountPendingEnrollments.filterStatus",
        "primary.portal.accountPendingEnrollments.manage",
        "primary.portal.enrollments.eaaRequiredStatus",
        "primary.portal.pendingApplication.noPendingCustomer",
    ]);
    error: boolean;
    errorMessage: string;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    accountPEUrl: string;
    allowCrossBorderCheck: boolean;

    constructor(
        private readonly datePipe: DatePipe,
        private readonly enrollmentsService: EnrollmentService,
        private readonly memberService: MemberService,
        private readonly store: Store,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly user: UserService,
        private readonly titleCasePipe: TitleCasePipe,
        private readonly staticUtilService: StaticUtilService,
        private readonly dateService: DateService,
    ) {}
    /**
     * This life cycle hook is called on component initialization to get pending enrollments data from back end
     * will also hold business logic to determine if it is direct or payroll flow.
     */
    ngOnInit(): void {
        this.staticUtilService
            .cacheConfigEnabled("general.feature.enable.cross_border_sales_rule")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.allowCrossBorderCheck = resp;
            });
        this.routeAfterLogin = this.store.selectSnapshot(SharedState.routeAfterLogin);
        if (this.router.url.indexOf(DIRECT) >= 0) {
            this.mpGroupId = this.route.parent.parent.parent.snapshot.params.mpGroupId;
            this.memberId = this.route.parent.parent.parent.snapshot.params.customerId;
            this.isDirect = true;
            this.displayedColumns = this.directDisplayColumns;
            this.getMemberPendingEnrollments(this.memberId);
        } else {
            this.mpGroup = this.store.selectSnapshot(AccountListState.getGroup);
            this.mpGroupId = this.mpGroup.id;
            this.memberId = this.route.parent.snapshot.parent.parent.params.memberId;
            this.getMemberPendingEnrollments(this.memberId);
            // eslint-disable-next-line max-len
            this.accountPEUrl = `${this.routeAfterLogin}/##portal##/${this.mpGroupId}/dashboard/business/pending-enrollments/view-enrollments`;
        }
    }

    /**
     *
     * This function is used to get member enrollments whose status is pending
     * @param memberId
     * @returns void
     */
    getMemberPendingEnrollments(memberId: number): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.isLoading = true;
        this.sampleData = [];
        this.testData = [];
        this.enrollmentsService
            .getBusinessEnrollmentsWithStatusPending(this.mpGroupId, memberId)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((enrollment) => {
                    const data = enrollment.filter(
                        (enroll) =>
                            (enroll.pendingReason === PendingEnrollmentReason.CARRIER_APPROVAL ||
                                enroll.pendingReason === PendingEnrollmentReason.CUSTOMER_SIGNATURE ||
                                enroll.pendingReason === PendingEnrollmentReason.PDA_COMPLETION ||
                                enroll.pendingReason === PendingEnrollmentReason.INCOMPLETE_MISSING_EAA) &&
                            !(
                                enroll.subscriberApprovalRequiredByDate &&
                                this.isPastDate(this.dateService.toDate(enroll.subscriberApprovalRequiredByDate))
                            ),
                    );
                    this.sampleData = data;
                    this.isLoading = false;
                }),
                filter((data) => this.sampleData !== undefined && this.sampleData !== null && this.sampleData.length > 0),
                switchMap((data) => {
                    this.isLoading = true;
                    return this.getMembersQualifyingEvents(this.memberId);
                }),
                tap((data) => {
                    this.setPendingValue(data);
                }),
                switchMap((res) => this.getMemberDetails(this.memberId)),
                tap((data) => {
                    this.employeeData = data.body;
                }),
            )
            .subscribe(
                (enrollment) => {
                    this.error = false;
                    this.isLoading = false;
                },
                (error: HttpErrorResponse) => {
                    this.displayDefaultError(error);
                },
            );
    }
    /**
     * this function is used to validate if the date is in past
     * @param dateToValidate input date which needs to be validate
     * @returns boolean flag based on the input date
     */
    isPastDate(dateToValidate: Date): boolean {
        const date = this.dateService.subtractDays(new Date(), 1);
        return dateToValidate <= date;
    }
    /**
     * This method is used to display default error status and error code defined error messages
     * @param error is the HttpErrorResponse
     */
    displayDefaultError(error: HttpErrorResponse): void {
        this.error = true;
        this.isLoading = false;
        if (error && error.error) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
        }
    }

    /**
     *
     * This function is used to get member QLE
     * @param memberId
     * @returns Observable<MemberQualifyingEvent[]>
     */
    getMembersQualifyingEvents(memberId: number): Observable<MemberQualifyingEvent[]> {
        return this.memberService.getMemberQualifyingEvents(memberId, this.mpGroupId);
    }

    /**
     * This function is used to set data if any qle is pending
     * @param data: Array of MemberQualifyingEvents
     * @returns void
     */
    setPendingValue(data: MemberQualifyingEvent[]): void {
        this.sampleData.forEach((data1) => {
            let pending: string;
            if (data1.pendingCategory) {
                pending = data1.pendingCategory.name;
            } else if (data1.pendingReason) {
                pending = getPendingReasonLanguage(data1.pendingReason, this.language, this.titleCasePipe, true);
            } else {
                pending = UNSPECIFIED;
            }
            if (data.length) {
                data.forEach((qle) => {
                    if (qle.id === data1.qualifyingEventId) {
                        this.arrangeTableData(pending, data1, qle);
                    } else {
                        this.arrangeTableData(pending, data1);
                    }
                });
            } else {
                this.arrangeTableData(pending, data1);
            }
        });
    }

    /**
     * This method navigates user to account-level pending enrollments screen
     */
    navigateToAccountEnrollments(): void {
        this.user.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential) => {
            this.accountPEUrl = this.accountPEUrl.replace("##portal##", ADMIN_ID_VAR in credential ? ADMIN_URL : PRODUCER_URL);
            this.router.navigate([this.accountPEUrl]);
        });
    }

    goToPendingEnrollments(element: any, event: any): void {
        let enrollments = [];
        enrollments = this.sampleData.filter((data) => data.qualifyingEventId === element.reason.id);
        const dialogRef = this.dialog.open(PendingEnrollmentComponent, {
            minWidth: "100%",
            height: "100%",
            panelClass: "approve-qle",
            data: {
                selectedVal: element.reason,
                selecteEvent: element.reason.type,
                memberEnrollment: "true",
                editLifeEvent: false,
                enrollmentData: enrollments,
                memberDetails: this.employeeData,
            },
        });

        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                if (response) {
                    this.getMemberPendingEnrollments(this.memberId);
                }
            });
    }

    openEditStatus(element: any): void {
        this.enrollmentId = element.plan.id;
        const dialogRef = this.dialog.open(EditStatusPopUpComponent, {
            maxWidth: "600px",
            panelClass: "edit-remove",
            data: {
                statusList: this.pendingStatus,
                particularStatus: element.status,
            },
        });
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((pendingEnrollId) => {
                if (pendingEnrollId) {
                    this.updatePndingStatus(element, pendingEnrollId);
                }
            });
    }
    /**
     *
     * This function is used to fetch member details
     * @param memberId
     * @returns  Observable<HttpResponse<MemberProfile>>
     */
    getMemberDetails(memberId: number): Observable<HttpResponse<MemberProfile>> {
        return this.memberService.getMember(memberId, false, this.mpGroupId.toString());
    }

    backToEmployeeList(): void {
        const url = `${this.routeAfterLogin}/payroll/${this.mpGroup.id}/employees`;
        this.router.navigate([url]);
    }
    getPendingCategory(pendingEnrollId: any): any {
        if (pendingEnrollId && pendingEnrollId.id !== -1) {
            return pendingEnrollId;
        }
        return {};
    }

    updatePndingStatus(enrollments: any, pendingEnrollId: number): void {
        const coveraeDetails = {
            enrollment: {
                coverageLevelId: enrollments.plan.coverageLevel.id,
                memberCost: enrollments.plan.memberCost,
                totalCost: enrollments.plan.totalCost,
                validity: enrollments.plan.validity,
                taxStatus: enrollments.plan.taxStatus,
                tobaccoStatus: enrollments.plan.tobaccoStatus,
                pendingCategory: this.getPendingCategory(pendingEnrollId),
            },
            reason: enrollments.reason.type.description,
            description: "",
            effectiveDate: enrollments.plan.changeEffectiveStarting,
        };
        this.enrollmentsService
            .updateCoverage(this.mpGroupId, this.memberId, this.enrollmentId, coveraeDetails)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.sampleData = [];
                this.testData = [];
                this.getMemberPendingEnrollments(this.memberId);
            });
    }

    /**
     *
     * @param pendingReason  Reason of pending enrollmet
     * @param enrollmentData Enrollment data
     * @param qle MemberQualifyingEvent
     * @returns void
     */
    arrangeTableData(pendingReason: string, enrollmentData: Enrollments, qle?: MemberQualifyingEvent): void {
        let isDisabled = true;
        if (qle) {
            isDisabled = false;
        }
        const tableSourceData: PendingApplicationTableModel = {
            plan: enrollmentData,
            product: enrollmentData,
            reason: qle ? qle : getPendingReasonLanguage(enrollmentData.pendingReason, this.language, this.titleCasePipe, false),
            lifeEventDate: qle ? this.datePipe.transform(qle.eventDate, AppSettings.DATE_FORMAT_MM_DD_YYYY) : "",
            status:
                !qle && enrollmentData.pendingReason
                    ? getPendingReasonLanguage(enrollmentData.pendingReason, this.language, this.titleCasePipe, true)
                    : pendingReason,
            disable: isDisabled,
        };
        if (this.testData.findIndex((i) => i.plan.id === enrollmentData.id) === -1) {
            this.testData.push(tableSourceData);
        }
    }
    /**
     *
     * This function is unsubscribing all the subscriptions.
     * @returns void
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
