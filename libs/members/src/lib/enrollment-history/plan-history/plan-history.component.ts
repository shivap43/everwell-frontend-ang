import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { EnrollmentService, AccountService, CarrierStatus, AuditEnrollment, ApplicationStatusTypes, MemberService } from "@empowered/api";
import { ActivatedRoute } from "@angular/router";
import { ApplicationStatusService } from "@empowered/ngxs-store";
import { AppSettings, EnrollmentRider } from "@empowered/constants";
import { forkJoin, Subject, Subscription } from "rxjs";
import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";
import { takeUntil } from "rxjs/operators";

enum IconStatus {
    SUCCESS = "success",
    WARNING = "warning",
    DANGER = "danger",
}

@Component({
    selector: "empowered-plan-history",
    templateUrl: "./plan-history.component.html",
    styleUrls: ["./plan-history.component.scss"],
})
export class PlanHistoryComponent implements OnInit, OnDestroy {
    @Input() enrollmentDetail: AuditEnrollment;
    mpGroup: number;
    memberId: number;
    isLoading: boolean;
    enrollmentId: number;
    enrollmentRider: EnrollmentRider[];
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    payFrequencyId: number;
    payFrequency = "";
    iconStatus: IconStatus;
    iconStatuses = IconStatus;
    employeeContribution = 0;
    memberCostPerPayPeriod = 0;
    private readonly unsubscribe$ = new Subject<void>();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.edit",
        "primary.portal.activityHistory.planDetails",
        "primary.portal.activityHistory.updateFirstLast",
        "primary.portal.activityHistory.policy",
        "primary.portal.activityHistory.policyStatus",
        "primary.portal.activityHistory.coverageDates",
        "primary.portal.activityHistory.coverageLevel",
        "primary.portal.activityHistory.employerContr",
        "primary.portal.activityHistory.employerPremium",
        "primary.portal.activityHistory.rider",
        "primary.portal.activityHistory.none",
        "primary.portal.activityHistory.taxStatus",
        "primary.portal.activityHistory.tobacoStatus",
        "primary.portal.activityHistory.benefitAmount",
        "primary.portal.activityHistory.salaryMulti",
        "primary.portal.activityHistory.updateFirstLast",
        "primary.portal.activityHistory.pendingCarrierApproval",
        "primary.portal.activityHistory.active",
        "primary.portal.activityHistory.declined",
        "primary.portal.activityHistory.cancelled",
        "primary.portal.activityHistory.lapsed",
        "primary.portal.coverage.declined",
        "primary.portal.coverage.Pendingcustomersignature",
        "primary.portal.coverage.PendingPDAcompletion",
        "primary.portal.editCoverage.void",
        "primary.portal.coverage.approved",
        "primary.portal.coverage.Pendingcarrierapproval",
        "primary.portal.coverage.pendingadminapproval",
        "primary.portal.coverage.Pending3rdpartyapproval",
        "primary.portal.coverage.Applicationdenied",
        "primary.portal.coverage.Lapsed",
        "primary.portal.coverage.Ended",
        "primary.portal.editCoverage.withdrawn",
    ]);

    constructor(
        private readonly route: ActivatedRoute,
        private readonly enrollmentsService: EnrollmentService,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly accountService: AccountService,
        private readonly memberService: MemberService,
        private readonly applicationStatusService: ApplicationStatusService,
    ) {}

    /**
     * Implements Angular OnInit Life Cycle hook
     * calling the functions to fetch pay frequency, enrollment riders and carrier status from language DB
     */
    ngOnInit(): void {
        this.isLoading = true;
        this.route.parent.parent.params.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            this.mpGroup = +params["mpGroupId"] ? +params["mpGroupId"] : +params["mpGroup"];
            this.memberId = +params["memberId"] ? +params["memberId"] : +params["customerId"];
        });
        this.enrollmentId = this.enrollmentDetail.auditedEnrollment.id;
        this.getEnrollmentRiders();
        this.getContributionAmount();
        this.getPayFrequency();
        this.enrollmentDetail = {
            ...this.enrollmentDetail,
            policyStatus: this.languageStrings[this.applicationStatusService.convert(this.enrollmentDetail.auditedEnrollment, true)],
        };
        this.getIconStatus();
    }
    /**
     * gets icon status
     */
    getIconStatus(): void {
        if (
            this.enrollmentDetail.auditedEnrollment.carrierStatus === CarrierStatus.ACTIVE ||
            this.enrollmentDetail.policyStatus === ApplicationStatusTypes.Approved
        ) {
            this.iconStatus = IconStatus.SUCCESS;
        } else if (this.enrollmentDetail.policyStatus.startsWith(ApplicationStatusTypes.Pending)) {
            this.iconStatus = IconStatus.WARNING;
        } else {
            this.iconStatus = IconStatus.DANGER;
        }
    }

    /**
     * get employee payFrequency type
     */
    getPayFrequency(): void {
        forkJoin([
            this.memberService.getMember(this.memberId, true, this.mpGroup?.toString()),
            this.accountService.getPayFrequencies(this.mpGroup?.toString()),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                ([member, payFrequencies]) => {
                    this.payFrequencyId = member.body?.workInformation?.payrollFrequencyId;
                    this.payFrequency = payFrequencies.find((x) => x.id === this.payFrequencyId)?.name;
                },
                () => {
                    this.isLoading = false;
                },
            );
    }
    /**
     * gets employee contribution amount
     */
    getContributionAmount(): void {
        this.memberCostPerPayPeriod = this.enrollmentDetail?.auditedEnrollment?.memberCostPerPayPeriod;
        this.employeeContribution = this.enrollmentDetail?.auditedEnrollment?.totalCostPerPayPeriod - this.memberCostPerPayPeriod;
    }

    getEnrollmentRiders(): void {
        this.enrollmentsService
            .getEnrollmentRiders(this.memberId, this.enrollmentId, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (data) => {
                    this.enrollmentRider = data;
                    this.isLoading = false;
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
