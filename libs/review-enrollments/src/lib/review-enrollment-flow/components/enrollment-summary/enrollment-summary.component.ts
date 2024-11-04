import { Component, OnDestroy, OnInit } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { DateService } from "@empowered/date";
import {
    BeneficiaryType,
    CarrierId,
    DateFormats,
    Enrollments,
    MemberBeneficiary,
    PaymentType,
    Product,
    SummaryTaxStatus,
    Validity,
} from "@empowered/constants";
import { Subject, forkJoin } from "rxjs";
import {
    AccountService,
    ApplicationStatusTypes,
    CoreService,
    EnrollmentService,
    EnrollmentStatusType,
    MemberEnrollmentCoverage,
    MemberEnrollmentSummary,
    MemberService,
} from "@empowered/api";
import { takeUntil, tap } from "rxjs/operators";
import { ReviewFlowService } from "../../services/review-flow.service";
import { PlanDetailsComponent } from "@empowered/ui";
import { MatDialog } from "@angular/material/dialog";
import { ApplicationStatusService } from "@empowered/ngxs-store";

const PRIMARY_PRODUCER = "PRIMARY_PRODUCER";
const TYPE = "type";
const NAME = "name";
const COVERAGE_TEXT = "coverageText";
const COVERAGE_DATE = "coverageDate";
const CARRIER = "{Carrier}";
const ENROLLMENT_OBJ = "enrollmentObj";

@Component({
    selector: "empowered-enrollment-summary",
    templateUrl: "./enrollment-summary.component.html",
    styleUrls: ["./enrollment-summary.component.scss"],
})
export class EnrollmentSummaryComponent implements OnInit, OnDestroy {
    private unsubscribe$ = new Subject<void>();
    mpGroupId: number;
    memberId: number;
    memberEnrollmentSummary: MemberEnrollmentSummary;
    charity = BeneficiaryType.CHARITY.toUpperCase();
    individual = BeneficiaryType.INDIVIDUAL.toUpperCase();
    trust = BeneficiaryType.TRUST.toUpperCase();
    estate = BeneficiaryType.ESTATE.toUpperCase();
    lapsedStatus = EnrollmentStatusType.LAPSED;
    declinedStatus = EnrollmentStatusType.DECLINED;
    pendingStatus = EnrollmentStatusType.PENDING;
    approvedStatus = EnrollmentStatusType.APPROVED;
    applicationDenied = ApplicationStatusTypes.Application_denied;
    creditCard = PaymentType.CREDITCARD;
    bankDraft = PaymentType.BANKDRAFT;
    debitCard = PaymentType.DEBITCARD;
    isSpinnerLoading = false;
    enrolledRiders: Enrollments[] = [];
    errorMessage = "";
    enrollData = {
        currentCoverageData: [],
        updatedAndNewCoverageData: [],
        payFrequencyType: "",
        costTotal: 0,
        preTaxTotal: 0,
        postTaxTotal: 0,
        agentName: "",
        agentEmail: "",
        agentPhone: "",
        latestEnrollmentDate: "",
    };
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.enrollment.summary.header",
        "primary.portal.enrollment.summary.text",
        "primary.portal.enrollment.summary.cost",
        "primary.portal.enrollment.summary.pre.tax",
        "primary.portal.enrollment.summary.post.tax",
        "primary.portal.enrollment.summary.your.agent",
        "primary.portal.enrollment.summary.elected.text",
        "primary.portal.enrollment.summary.your.current.coverage",
        "primary.portal.enrollment.summary.elected.plan",
        "primary.portal.enrollment.summary.elected.coverage.level",
        "primary.portal.enrollment.summary.elected.policy",
        "primary.portal.enrollment.summary.elected.status",
        "primary.portal.enrollment.summary.elected.benefit.amount",
        "primary.portal.enrollment.summary.elected.elimination.period",
        "primary.portal.enrollment.summary.elected.riders",
        "primary.portal.enrollment.summary.elected.beneficiaries",
        "primary.portal.enrollment.summary.elected.aflac.always.card",
        "primary.portal.enrollment.summary.elected.aflac.always.account",
        "primary.portal.enrollment.summary.elected.coverage.dates",
        "primary.portal.enrollment.summary.elected.coverage.start.date",
        "primary.portal.enrollment.summary.plan.details",
        "primary.portal.coverage.estate",
        "primary.portal.coverage.charity",
        "primary.portal.coverage.aflacalways",
        "primary.portal.applicationFlow.payments.billing",
        "primary.portal.coverage.accountNumberEnding",
        "primary.portal.coverage.cardNumberEnding",
        "primary.portal.coverage.declined",
        "primary.portal.coverage.payroll.deduction",
        "primary.portal.coverage.Pendingcustomersignature",
        "primary.portal.coverage.approved",
        "primary.portal.coverage.Ended",
        "primary.portal.coverage.Pendingcarrierapproval",
        "primary.portal.coverage.pendingadminapproval",
        "primary.portal.coverage.PendingPDAcompletion",
        "primary.portal.coverage.Pending3rdpartyapproval",
        "primary.portal.coverage.Applicationdenied",
        "primary.portal.coverage.Lapsed",
        "primary.portal.enrollment.summary.cost.text",
        "primary.portal.enrollment.summary.cost.preandposttax",
        "primary.portal.editCoverage.void",
        "primary.portal.editCoverage.withdrawn",
    ]);
    constructor(
        private readonly language: LanguageService,
        private readonly dateService: DateService,
        private readonly accountService: AccountService,
        private readonly reviewFlowService: ReviewFlowService,
        private readonly enrollmentsService: EnrollmentService,
        private readonly coreService: CoreService,
        private readonly memberService: MemberService,
        private readonly dialog: MatDialog,
        private readonly applicationStatusService: ApplicationStatusService,
    ) {}

    ngOnInit(): void {
        this.isSpinnerLoading = true;

        this.reviewFlowService.mpGroup$.pipe(takeUntil(this.unsubscribe$)).subscribe((mpGroup) => {
            this.mpGroupId = mpGroup;
        });
        this.reviewFlowService.updateMemberId$.pipe(takeUntil(this.unsubscribe$)).subscribe((memberId) => {
            this.memberId = memberId;
        });

        this.getEnrollmentSummaryData(this.memberId, this.mpGroupId);
    }

    /**
     * method getEnrollmentSummaryData to get enrollment summary data for a given member.
     * @returns void
     */
    getEnrollmentSummaryData(memberId: number, mpGroupId: number): void {
        forkJoin([
            this.enrollmentsService.getMemberEnrollmentSummary(memberId, mpGroupId),
            this.enrollmentsService.searchMemberEnrollments(memberId, mpGroupId),
            this.memberService.getMemberBeneficiaries(memberId, mpGroupId, true),
            this.accountService.getAccountProducers(this.mpGroupId?.toString()),
            this.coreService.getProducts(),
        ])
            .pipe(
                takeUntil(this.unsubscribe$),
                tap(([memberEnrollment, enrollments, beneficiaries, producers, products]) => {
                    try {
                        // Refactor current coverage
                        memberEnrollment.currentCoverage?.coverages?.forEach((element) => {
                            this.setElements(element, enrollments, products, beneficiaries);
                            this.enrollData.currentCoverageData.push(element);
                        });

                        // Refactor future coverage
                        memberEnrollment.updatedAndNewCoverage?.coverages?.forEach((element) => {
                            this.setElements(element, enrollments, products, beneficiaries);
                            this.enrollData.updatedAndNewCoverageData.push(element);
                        });

                        this.setGlobalValues(memberEnrollment, producers);
                        this.pullRiderEnrollmentData(enrollments);
                    } finally {
                        this.isSpinnerLoading = false;
                    }
                }),
            )
            .subscribe(
                () => {
                    this.isSpinnerLoading = false;
                },
                (error) => {
                    this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
                },
            );
    }

    /** *
     * setElements(element: MemberEnrollmentCoverage, products: Product[], beneficiaries: MemberBeneficiary[])
     * Update/add all attributes as required to display in enrollment summary
     * @param element enrollment coverage
     * @param enrollments List of enrollments
     * @param products list of products
     * @param beneficiaries list of beneficiaries
     */
    setElements(
        element: MemberEnrollmentCoverage,
        enrollments: Enrollments[],
        products: Product[],
        beneficiaries: MemberBeneficiary[],
    ): void {
        // Set icon path
        this.setProductIcon(element, products);

        // Replace Carrier from service
        element.carrierName = this.languageStrings["primary.portal.enrollment.summary.elected.status"].replace(
            CARRIER,
            element.carrierName,
        );

        // Set Beneficiaries
        this.setBeneficiaries(element, beneficiaries);

        // Coverage Text and Date
        element[COVERAGE_TEXT] = this.getCoverageText(element.coverageDates);
        element[COVERAGE_DATE] = this.getCoverageDate(element.coverageDates);

        // Set TaxStatus
        element.taxStatus = SummaryTaxStatus[element.taxStatus];

        // Set the enrollment Obj
        element[ENROLLMENT_OBJ] = enrollments.find((enrollment) => enrollment.plan.name === element.planName);

        // Set pending reason
        element.pendingReason = this.languageStrings[this.applicationStatusService.convert(element[ENROLLMENT_OBJ])];
    }

    /** *
     * setGlobalValues(element: MemberEnrollmentCoverage, producers: any[])
     * set all parent level attributes
     * @param memberEnrollment enrollment summary
     * @param producers list of producers
     */
    setGlobalValues(memberEnrollment: MemberEnrollmentSummary, producers: any[]): void {
        this.enrollData.payFrequencyType = memberEnrollment.payFrequencyType;
        this.enrollData.preTaxTotal = memberEnrollment.updatedAndNewCoverage.preTaxTotal;
        this.enrollData.postTaxTotal = memberEnrollment.updatedAndNewCoverage.postTaxTotal;
        this.enrollData.costTotal = this.enrollData.preTaxTotal + this.enrollData.postTaxTotal;
        const primaryProducer = producers.find((producer) => producer.role === PRIMARY_PRODUCER);
        this.enrollData.agentName = primaryProducer?.producer?.name?.firstName + " " + primaryProducer?.producer?.name?.lastName;
        this.enrollData.agentEmail = primaryProducer?.producer?.emailAddress;
        this.enrollData.agentPhone = primaryProducer?.producer?.phoneNumber;
        this.enrollData.latestEnrollmentDate = this.dateTransform(memberEnrollment.latestEnrollmentDate);
    }

    /** *
     * setProductIcon(element: MemberEnrollmentCoverage, products: Product[])
     * @param element enrollment coverage
     * @param products list of Products
     */
    setProductIcon(element: MemberEnrollmentCoverage, products: Product[]): void {
        const filteredProduct = products.find((product) => product.name === element.productName);
        if (filteredProduct && filteredProduct.iconSelectedLocation) {
            element.iconPath = filteredProduct.iconSelectedLocation;
            element.cardColorCode = filteredProduct.cardColorCode;
        }
    }

    /** *
     * setBeneficiaries(coverage: MemberEnrollmentCoverage, beneficiaries: MemberBeneficiary[])
     * @param coverage enrollment coverage
     * @param beneficiaries list of MemberBeneficiaries
     */
    setBeneficiaries(coverage: MemberEnrollmentCoverage, beneficiaries: MemberBeneficiary[]): void {
        if (coverage.beneficiaries?.length) {
            coverage.beneficiaries?.map((element) => {
                const beneficiary = beneficiaries.find((y) => y.id === element.beneficiaryId);
                element[TYPE] = beneficiary?.type;
                element[NAME] = beneficiary?.name ? beneficiary?.name : beneficiary?.trustee;
            });
        }
    }

    /** *
     * getCoverageText(validity: Validity) returns the coverage text
     * based on the expiresAfter property
     * @param validity validity for checking expiry date
     * @returns coverage text based on the check for expiry date
     */
    getCoverageText(validity: Validity): string {
        return !validity.expiresAfter
            ? this.languageStrings["primary.portal.enrollment.summary.elected.coverage.start.date"]
            : this.languageStrings["primary.portal.enrollment.summary.elected.coverage.dates"];
    }

    /** *
     * getCoverageDate(validity: Validity) returns the coverage date
     * based on the expiresAfter property
     * @param validity validity for checking expiry date
     * @returns coverage date based on the check for expiry date
     */
    getCoverageDate(validity: Validity): string {
        if (!validity.expiresAfter) {
            return this.dateTransform(validity.effectiveStarting);
        } else {
            return this.dateTransform(validity.effectiveStarting) + " - " + this.dateTransform(validity.expiresAfter);
        }
    }

    /** *
     * openPlanDetails(data: Enrollment)
     * Open the modal window for plan details
     * @param data Enrollment details
     */
    openPlanDetails(data: any): void {
        const planDetails = {
            planId: data.plan.id,
            planName: data.plan.name,
            riderIds: this.getEnrolledRiderIds(data.plan.dependentPlanIds, this.enrolledRiders),
            states: [
                {
                    abbreviation: data.state,
                },
            ],
            mpGroup: this.mpGroupId,
            carrierId: data.plan.carrier,
            productId: data.plan?.product.id,
            isCarrierOfADV: data.plan.carrier.id === CarrierId.ADV,
        };

        this.dialog.open(PlanDetailsComponent, {
            hasBackdrop: true,
            data: planDetails,
            width: "600px",
        });
    }

    /**
     * Function to return enrolled rider ids for selected plan
     * @param dependentPlanIds {number[]} array of available rider id
     * @param riderEnrollments {Enrollments[]} array of all rider's enrollments
     * @returns {number[]} array of enrolled rider's id
     */
    getEnrolledRiderIds(dependentPlanIds: number[], riderEnrollments: Enrollments[]): number[] {
        return dependentPlanIds.filter((dependenPlanId: number) =>
            // This enrolled rider consist riders belongs to all enrolled plans
            // So filtering out the selected plan's enrolled rider only
            riderEnrollments.map((enrolledRider) => enrolledRider.plan.id).includes(dependenPlanId),
        );
    }

    /**
     * @description method to set member enrollments data, separates base plan and riders enrollments
     * @param enrollments member enrollments
     */
    pullRiderEnrollmentData(enrollments: Enrollments[]): void {
        enrollments.forEach((enroll) => {
            // checks if the enrollment is not rider enrollment else stores the rider enrollment into enrolledRiders[]
            if (enroll.riderOfEnrollmentId) {
                this.enrolledRiders.push(enroll);
            }
        });
    }

    /**
     * Function to return date in "yyyy/mm/dd" format
     * @param dateValue {(Date | string)}
     * @returns date in MM/dd/yyyy format
     */
    dateTransform(dateValue: Date | string): string {
        return this.dateService.format(dateValue, DateFormats.MONTH_DAY_YEAR);
    }

    /**
     * Life cycle hook used to unsubscribe the subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
