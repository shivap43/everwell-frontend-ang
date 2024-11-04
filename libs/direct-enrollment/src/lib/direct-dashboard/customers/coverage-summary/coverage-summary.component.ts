import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { Store } from "@ngxs/store";
import {
    BenefitsOfferingService,
    MemberService,
    EnrollmentService,
    AccountService,
    GetShoppingCart,
    CoverageChangingFields,
    ShoppingCartDisplayService,
    StaticService,
    ApplicationStatusTypes,
    AflacService,
    EnrollmentStatus,
    CoreService,
    MemberListDisplayItem,
    PendingEnrollmentReason,
    STATUS,
    SendReminderMode,
    PendingReasonForPdaCompletion,
} from "@empowered/api";
import { ConfirmAddressDialogComponent, OfferingListPopupComponent, PlanDetailsComponent, EnrollmentMethodComponent } from "@empowered/ui";
import { DatePipe } from "@angular/common";
import { UserService } from "@empowered/user";
import { forkJoin, Subscription, Subject, of, Observable, from, EMPTY } from "rxjs";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { FormGroup, FormBuilder } from "@angular/forms";
import { MatSelect } from "@angular/material/select";
import { EditCoverageComponent } from "./edit-coverage/edit-coverage.component";
import { LanguageService } from "@empowered/language";
import { takeUntil, map, switchMap, filter, tap } from "rxjs/operators";
import {
    Permission,
    SHOP_SUCCESS,
    ServerErrorResponseCode,
    PayFrequency,
    BeneficiaryType,
    AppSettings,
    EnrollmentMethod,
    Portals,
    Characteristics,
    ContactType,
    TaxStatus,
    CountryState,
    Product,
    MemberCredential,
    Enrollments,
    MemberProfile,
    Relations,
    MemberDependent,
    PaymentType,
    MemberQualifyingEvent,
    CarrierId,
} from "@empowered/constants";
import { VoidCoverageComponent } from "./edit-coverage/void-coverage/void-coverage.component";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";

import {
    EnrollmentMethodState,
    SetEnrollmentMethodSpecific,
    SetMemberIdentity,
    SetMemberInfo,
    SetDateFilterInfo,
    EnrollmentMethodModel,
    CoverageSummaryFilterInfo,
    SharedState,
    ApplicationStatusService,
    UtilService,
} from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

// Component level constants
const NY_ABBR = "NY";
interface Details {
    id: any;
}

const DATE_LENGTH = 10;

@Component({
    selector: "empowered-coverage-summary",
    templateUrl: "./coverage-summary.component.html",
    styleUrls: ["./coverage-summary.component.scss"],
})
export class CoverageSummaryComponent implements OnInit, OnDestroy {
    specificEnrollmentObj: EnrollmentMethodModel;
    visitedMpGroupStateObj: string[];
    enrollmentState: any;
    storedState: CountryState[];
    datePickerErrorMessage: any;

    @ViewChild("enrollDateFilterDropdown") enrollDateFilterDropdown: MatSelect;
    enrollEndDisplayFlag = false;
    oeFlag = false;
    continuousProductList = [];
    MemberInfo: MemberProfile;
    mpGroupId: any;
    currentQualifyingEvents: MemberQualifyingEvent[];
    getPortal: any;
    qleData: any;
    eventTypes: any;
    qleList: MemberQualifyingEvent[];
    dataSource: MemberQualifyingEvent[];
    currentDate = new Date();
    qleFlag = false;
    planYearsData = [];
    outsideOeQleFlag = false;
    planId: string;
    enrollData = {
        data: [],
        beneficiaries: [],
        enrollmentRiders: [],
        enrollmentDependents: [],
    };
    enrolledRiders: Enrollments[] = [];
    availProductsFlag = false;
    availProducts: any;
    memberDetails: any;
    checkFlag = false;
    qleCoverageEndDate: any;
    oneDay = 1000 * 60 * 60 * 24;
    oeCoverageEndDate: number;
    days: string;
    EnrollmentDialogRef: any;
    mpGroupObj: any;
    firstName: any;
    availPlanYears = [];
    maxAvailPYDate: string;
    accPayFrequencyId: number;
    payFrequency: PayFrequency;
    dependentRelations: Relations[] = [];
    pendingCustomerSignature = PendingEnrollmentReason.CUSTOMER_SIGNATURE;
    pendingCarrierApproval = PendingEnrollmentReason.CARRIER_APPROVAL;
    currentCoverage = [];
    previousCoverage = [];
    futureCoverage = [];
    isPendingEnrollment = false;
    showPrevious = false;
    buttonLabel = "Show";
    applications = false;
    memberId: number;
    nextPayrollDeductionDate: Date | string;
    isnextPayrollDeductionDate = false;
    mpGroup: string;
    accountDetails: any;
    enrollmentMethod = "FACE_TO_FACE";
    IS_VOID = "Void";
    CANCELLED = "CANCELLED";
    expandPlanOfferings = "plan.productId";
    pyFlag = "*";
    pyList = [];
    readonly FUTURE_COVERAGE = "Future coverage";
    readonly CURRENT_COVERAGE = "Current coverage";
    Permissions = Permission;
    abbreviation: any;
    products = [];
    isExpanded = false;
    payFrequencyName: string;
    isLoading = true;
    priceDisplay: string;
    priceDisplayFilters = [];
    benefitSummary = [
        {
            title: "",
            data: [],
            isHide: false,
            isPreviousEnrollment: false,
        },
    ];
    pyOutsideOE = [];
    continuousProductsFlag = false;
    planYearProductsFlag = false;
    displayAllProducts = false;
    outsideOEEnrollmentFlag = false;
    memberContact = [];
    filterOpen = false;
    // TODO - Language needs to be implemented
    dateFilters = ["Specific date", "Date range"];
    dateFilterForm: FormGroup;
    isSpecificDateSelected = false;
    isDateRangeSelected = false;
    payFrequencyObject = {
        payFrequencies: [],
        pfType: "",
        payrollsPerYear: 0,
    };
    nonDeniedCoverage = "coverage-nondenied";
    deniedCoverage = "coverage-denied";
    selectedDateFilter = "";
    memberFullName = "";
    onlyPreviousCoverage = false;
    availProductsFlagOE = false;
    outsideOeMmpFlag = false;
    oeMmpFlag = false;
    qleMmpFlag = false;
    memberCartDetails: GetShoppingCart;
    memberEnrollmentMethod = "SELF_SERVICE";
    qleOutsideOEFlag = false;
    contOutsideOEFlag = false;
    mmpInOE = false;
    zeroCartFlag = false;
    cartFlag = false;
    year: number;
    oeMaxDate: string;
    notEnrolled = [];
    qleMaxDate: string;
    isFilterApplied = false;
    zeroStateFlag = false;
    isAdmin = false;
    memberEnrollments: any[] = [];
    memberMPGroupId: number;
    minDate = null;
    maxDate = null;
    showContacts = false;
    memberContacts: any;
    contactList = [];
    selectedContactValue;
    contactForm: FormGroup;
    requestSent = false;
    isShopEnabled = true;
    configurationSubscriber: Subscription;
    unpluggedFeatureFlag: boolean;
    subscriptions: Subscription[] = [];
    emailContacts = [];
    textContacts = [];
    hasMemberContact = false;
    portal: string;
    email = "email";
    phoneNumber = "phoneNumber";
    lapsedStatus = ApplicationStatusTypes.Lapsed;
    declinedStatus = ApplicationStatusTypes.Declined;
    pendingStatus = ApplicationStatusTypes.Pending;
    voidStatus = ApplicationStatusTypes.Void;
    approvedStatus = ApplicationStatusTypes.Approved;
    applicationDenied = ApplicationStatusTypes.Application_denied;
    postTax = TaxStatus.POSTTAX;
    preTax = TaxStatus.PRETAX;
    unknownTaxStatus = TaxStatus.UNKNOWN;
    endedStatus = ApplicationStatusTypes.Ended;
    Juvenile = AppSettings.JUVENILE;
    creditCard = PaymentType.CREDITCARD;
    bankDraft = PaymentType.BANKDRAFT;
    debitCard = PaymentType.DEBITCARD;
    DECLINED_COVERAGE_LEVEL_ID = 2;
    private readonly unsubscribe$ = new Subject<void>();
    isVoidFutureCoverages: boolean[] = [];
    isVoidCurrentCoverages: boolean[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.coverage.accountending",
        "primary.portal.coverage.addlifeevent",
        "primary.portal.coverage.adjustment",
        "primary.portal.coverage.aflacalways",
        "primary.portal.coverage.anapplication",
        "primary.portal.coverage.application",
        "primary.portal.coverage.apply",
        "primary.portal.coverage.avalaibleproducts",
        "primary.portal.coverage.awaiting",
        "primary.portal.coverage.awaitingapproval",
        "primary.portal.coverage.basecost",
        "primary.portal.coverage.beneficiary",
        "primary.portal.coverage.benefitamount",
        "primary.portal.coverage.benefits",
        "primary.portal.coverage.benefitsenroll",
        "primary.portal.coverage.beneiftready",
        "primary.portal.coverage.cardnumber",
        "primary.portal.coverage.clear",
        "primary.portal.coverage.continueenroll",
        "primary.portal.coverage.continueupdate",
        "primary.portal.coverage.cost",
        "primary.portal.coverage.coveragedate",
        "primary.portal.coverage.coveragedateoeleft",
        "primary.portal.coverage.coveragedateqleleft",
        "primary.portal.planDetails.title",
        "primary.portal.coverage.coverageDates",
        "primary.portal.coverage.coveredindividuals",
        "primary.portal.coverage.currently",
        "primary.portal.coverage.current_coverage",
        "primary.portal.coverage.currrentlyavaliable",
        "primary.portal.coverage.date",
        "primary.portal.coverage.deduction",
        "primary.portal.coverage.downloadapplication",
        "primary.portal.coverage.editcoverage",
        "primary.portal.coverage.eligibleupdate",
        "primary.portal.coverage.eliminationperiod",
        "primary.portal.coverage.enddate",
        "primary.portal.coverage.enrollleft",
        "primary.portal.coverage.enrollment",
        "primary.portal.coverage.enrollpy",
        "primary.portal.coverage.filter",
        "primary.portal.coverage.filterbydate",
        "primary.portal.coverage.finish",
        "primary.portal.coverage.future_coverage",
        "primary.portal.coverage.header",
        "primary.portal.coverage.hide",
        "primary.portal.coverage.lifechange",
        "primary.portal.coverage.lifeevent",
        "primary.portal.coverage.manage",
        "primary.portal.coverage.need",
        "primary.portal.coverage.next_payroll",
        "primary.portal.coverage.notenrolled",
        "primary.portal.coverage.notenrolledbenefits",
        "primary.portal.coverage.notenrolledbenefit",
        "primary.portal.coverage.oecoverageenddate",
        "primary.portal.coverage.payroll",
        "primary.portal.coverage.plan_name",
        "primary.portal.coverage.policyno",
        "primary.portal.coverage.pretax",
        "primary.portal.coverage.previous_coverage",
        "primary.portal.coverage.pricedisplay",
        "primary.portal.coverage.productsavalaible",
        "primary.portal.coverage.product_name",
        "primary.portal.coverage.progress",
        "primary.portal.coverage.progressupdate",
        "primary.portal.coverage.qlecoverageenddate",
        "primary.portal.coverage.qleCoverageleft",
        "primary.portal.coverage.qlecoveragelifeevent",
        "primary.portal.coverage.qlemaxdate",
        "primary.portal.coverage.recentlychanges",
        "primary.portal.coverage.riders",
        "primary.portal.coverage.shop",
        "primary.portal.coverage.specialenrollment",
        "primary.portal.coverage.specificdate",
        "primary.portal.coverage.startdate",
        "primary.portal.coverage.status",
        "primary.portal.coverage.view",
        "primary.portal.coverage.viewcoverage",
        "primary.portal.coverage.welcomemsg",
        "primary.portal.coverage.youhave",
        "primary.portal.coverage.justleft",
        "primary.portal.coverage.yearcoverage",
        "primary.portal.coverage.daterange",
        "primary.portal.coverage.edit",
        "primary.portal.coverage.posttax",
        "primary.portal.coverage.taxstatus",
        "primary.portal.coverage.makecoverage",
        "primary.portal.coverage.leftenroll",
        "primary.portal.coverage.lefttomake",
        "primary.portal.coverage.carrierstatus",
        "primary.portal.editCoverage.benefitamount",
        "primary.portal.coverage.unknown",
        "primary.portal.common.addLifeEvent",
        "primary.portal.coverage.specailend",
        "primary.portal.coverage.just",
        "primary.portal.coverage.enrollin",
        "primary.portal.coverage.estate",
        "primary.portal.coverage.charity",
        "primary.portal.common.send",
        "primary.portal.coverage.sent",
        "primary.portal.coverage.notify",
        "primary.portal.coverage.signed",
        "primary.portal.common.dateHint",
        "primary.portal.coverage.justvisit",
        "primary.portal.coverage.currently.avaliable",
        "primary.portal.coverage.pageenroll",
        "primary.portal.coverage.addcontactInfo",
        "primary.portal.coverage.currently.avaliable",
        "primary.portal.coverage.justvisit",
        "primary.portal.coverage.pageenroll",
        "primary.portal.coverage.declined",
        "primary.portal.coverage.Pendingcustomersignature",
        "primary.portal.coverage.approved",
        "primary.portal.coverage.Ended",
        "primary.portal.coverage.Pendingcarrierapproval",
        "primary.portal.coverage.pendingadminapproval",
        "primary.portal.coverage.PendingPDAcompletion",
        "primary.portal.coverage.Pending3rdpartyapproval",
        "primary.portal.coverage.pendingadminapproval",
        "primary.portal.coverage.Applicationdenied",
        "primary.portal.coverage.Lapsed",
        "primary.portal.editCoverage.void",
        "primary.portal.headset.email",
        "primary.portal.headset.text",
        "primary.portal.headset.noemailaddress",
        "primary.portal.headset.nomobile",
        "primary.portal.coverage.aflacalways",
        "primary.portal.coverage.accountNumberEnding",
        "primary.portal.coverage.cardNumberEnding",
        "primary.portal.editCoverage.voidCoverage",
    ]);
    hasPrivilege$ = of(false);
    beneficiaryTypes = BeneficiaryType;
    downloadError: boolean;
    errorMessage: string;
    activeCarrierStatus = STATUS.ACTIVE;

    constructor(
        private readonly store: Store,
        private readonly memberService: MemberService,
        private readonly benefitService: BenefitsOfferingService,
        private readonly datePipe: DatePipe,
        private readonly enrollmentsService: EnrollmentService,
        private readonly userService: UserService,
        private readonly dialog: MatDialog,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly accService: AccountService,
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private EditCoverageDialogRef: MatDialogRef<EditCoverageComponent>,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly utilService: UtilService,
        private readonly staticService: StaticService,
        private readonly aflacService: AflacService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly sharedService: SharedService,
        private readonly coreService: CoreService,
        private readonly applicationStatusService: ApplicationStatusService,
        private readonly dateService: DateService,
    ) {
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: MemberCredential) => {
            if (credential.groupId) {
                this.memberMPGroupId = credential.groupId;
            }
        });
    }
    /**
     * Initializes the component.
     * Sets required configurations.
     */
    ngOnInit(): void {
        this.unpluggedFeatureFlag = false;
        this.checkForUnpluggedFeature();

        this.dateFilterForm = this.fb.group({
            priceFilter: [""],
            specificDate: [""],
            startDate: [""],
            endDate: [""],
            enrollDateFilter: [""],
            priceDisplayFilterDropdown: [""],
        });
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.portal = "/" + this.portal.toLowerCase();
        this.currentDate.setHours(0, 0, 0, 0);
        this.year = this.currentDate.getFullYear();
        this.getPortal = this.store.selectSnapshot(SharedState.portal);
        this.isAdmin = this.getPortal === "ADMIN" ? true : false;
        this.mpGroupId = this.route.parent.snapshot.params.mpGroupId;
        this.memberId = this.route.parent.snapshot.params.customerId;
        this.accService
            .getDirectAccount()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((acc) => {
                this.mpGroupObj = { state: acc.situs.state.abbreviation };
                this.getInfo();
            });
        this.hasPrivilege$ = this.utilService
            .checkDisableForRole12Functionalities(Permission.TPP_RESTRICTED_PERMISSION, this.mpGroupId.toString())
            .pipe(map(([isRestricted, accountData]) => !(isRestricted && accountData.thirdPartyPlatformsEnabled)));
        this.getFilteredData();
    }

    checkForUnpluggedFeature(): void {
        this.configurationSubscriber = this.staticService.getConfigurations(AppSettings.UNPLUGGED_CONFIG).subscribe((configs) => {
            this.unpluggedFeatureFlag = configs.length && configs[0].value.toLowerCase() === "true";
        });
        this.subscriptions.push(this.configurationSubscriber);
    }
    getInfo(): void {
        this.subscriptions.push(
            forkJoin([
                this.memberService.getMember(this.memberId, true, this.mpGroupId),
                this.memberService.getMemberContacts(this.memberId, this.mpGroupId),
            ]).subscribe((info) => {
                this.MemberInfo = info[0].body;
                this.memberContacts = info[1];
                this.accPayFrequencyId = this.MemberInfo.workInformation.payrollFrequencyId;
                this.firstName = this.MemberInfo.name.firstName;
                this.memberFullName = this.MemberInfo.name.firstName + " " + this.MemberInfo.name.lastName;
                this.getRelationshipTypes();
                this.accService.getPayFrequencies(this.mpGroupId).subscribe(
                    (res) => {
                        this.payFrequencyObject.payFrequencies = [...res];
                        this.payFrequency = res.find((frequency) => frequency.id.toString() === this.accPayFrequencyId.toString());
                        const monthlypayFrequency = res.find((ele) => ele.frequencyType === "MONTHLY");
                        this.payFrequencyObject.payrollsPerYear = monthlypayFrequency.payrollsPerYear;
                        this.payFrequencyObject.pfType = this.payFrequency.name;
                        this.payFrequencyName = this.payFrequency.name;
                    },
                    () => {},
                    () => {},
                );
                this.getCoverageData();
                this.getContactDetails();
            }),
        );
    }

    getContactDetails(): void {
        this.memberContacts.forEach((contact) => {
            if (contact.emailAddresses && contact.emailAddresses.length) {
                contact.emailAddresses.forEach((emailAddress) => {
                    this.emailContacts.push(emailAddress.email);
                });
            }
            if (contact.phoneNumbers && contact.phoneNumbers.length) {
                contact.phoneNumbers.forEach((phoneNumber) => {
                    this.textContacts.push(phoneNumber.phoneNumber);
                });
            }
        });
        this.showContact();
    }

    getRelationshipTypes(): void {
        this.subscriptions.push(
            this.accService.getDependentRelations(this.mpGroupId).subscribe((res: Relations[]) => {
                this.dependentRelations = res;
            }),
        );
    }
    /**
     * function to get product details for enrolled product
     * @return: observable<Product[]>
     */
    getProductDetails(): Observable<Product[]> {
        const productObservables$: Observable<Product>[] = [];
        this.enrollData.data.forEach((enroll) => {
            productObservables$.push(
                this.coreService.getProduct(enroll.plan.product.id).pipe(
                    tap((product) => {
                        enroll.prodDetails = Array.of(product);
                    }),
                ),
            );
        });
        return forkJoin(productObservables$);
    }
    /**
     * function to set product icons for respective products
     */
    setProductIcons(): void {
        this.enrollData.data.forEach((response) => {
            if (response.prodDetails) {
                const filteredProduct = response.prodDetails.find((res) => res.name === response.plan.product.name);
                if (filteredProduct && filteredProduct.iconSelectedLocation) {
                    response["iconPath"] = filteredProduct.iconSelectedLocation;
                }
            }
        });
    }

    /**
     * function to getCoverageData and call method to set icons.
     */
    getCoverageData(): void {
        // calling importAflacPolicies api before searchMemberEnrollments api to get the list of enrolled plans
        this.subscriptions.push(
            this.aflacService
                .importAflacPolicies(this.memberId, this.mpGroupId)
                .pipe(
                    switchMap(() =>
                        forkJoin([
                            this.enrollmentsService.searchMemberEnrollments(this.memberId, this.mpGroupId),
                            this.benefitService.getPlanYears(this.mpGroupId, true, true),
                            this.memberService.getMemberQualifyingEvents(this.memberId, this.mpGroupId),
                        ]).pipe(
                            tap(([enrollments, planYears, qualifyingEvents]) => {
                                enrollments.forEach((enroll) => {
                                    if (!enroll.riderOfEnrollmentId) {
                                        enroll.coverageDate = this.getCoverageDateText(enroll);
                                        enroll.status = this.languageStrings[this.applicationStatusService.convert(enroll)];
                                        if (enroll.status !== ApplicationStatusTypes.Void) {
                                            this.enrollData.data.push(enroll);
                                        }
                                    } else {
                                        this.enrolledRiders.push(enroll);
                                    }
                                });
                                this.availPlanYears = planYears;
                                this.currentQualifyingEvents = qualifyingEvents;
                                if (this.enrollData.data.length) {
                                    this.coverageSummary();
                                    this.displayProducts();
                                } else {
                                    this.isLoading = false;
                                }
                                this.checkZeroSummary();
                            }),
                            switchMap(() => this.getProductDetails()),
                        ),
                    ),
                )
                .subscribe(() => this.setProductIcons()),
        );
    }
    getCoverageDateText(enroll: any): any {
        enroll.coverageDate = "";
        const expireDate = this.dateService.toDate(enroll.validity.expiresAfter || "");
        expireDate.setHours(0, 0, 0, 0);
        const startDate = this.dateService.toDate(enroll.validity.effectiveStarting);
        startDate.setHours(0, 0, 0, 0);
        if (!enroll.validity.expiresAfter) {
            if (startDate <= this.currentDate) {
                enroll.coverageDate = "Began ";
            } else {
                enroll.coverageDate = "Starts ";
            }
            enroll.coverageDate += this.datePipe.transform(startDate, AppSettings.DATE_FORMAT_MM_DD_YYYY);
        } else {
            enroll.coverageDate =
                this.datePipe.transform(startDate, AppSettings.DATE_FORMAT_MM_DD_YYYY) +
                " - " +
                this.datePipe.transform(expireDate, AppSettings.DATE_FORMAT_MM_DD_YYYY);
        }
        return enroll.coverageDate;
    }
    /**
     * fetch coverage summary data
     */
    coverageSummary(): void {
        this.enrollData.data.forEach((data, i) => {
            this.subscriptions.push(
                this.enrollmentsService
                    .getEnrollmentDependents(this.memberId, data.id, this.mpGroupId)
                    // eslint-disable-next-line complexity
                    .subscribe((enrollmentDependents) => {
                        data.enrollmentRiders = [];
                        data.enrollmentDependents = enrollmentDependents;
                        data.baseCost = data.totalCost;
                        const riderEnrollments: Enrollments[] = this.enrolledRiders.filter(
                            (rider) => rider.riderOfEnrollmentId === data.id,
                        );
                        if (riderEnrollments.length) {
                            riderEnrollments.forEach((rider) => {
                                if (rider.coverageLevel.id !== this.DECLINED_COVERAGE_LEVEL_ID) {
                                    data.enrollmentRiders.push(rider);
                                }
                            });
                        }
                        data.enrollmentRiders.forEach((rider) => {
                            data.baseCost += rider.totalCost;
                            data.memberCost += rider.memberCost;
                        });
                        const dependentObservable: Observable<MemberDependent>[] = [];
                        const expireDate = this.getDateFormat(data.validity.expiresAfter);
                        const startDate = this.getDateFormat(data.validity.effectiveStarting);
                        if (
                            (data.pendingReason === PendingEnrollmentReason.CUSTOMER_SIGNATURE ||
                                data.pendingReason === PendingEnrollmentReason.PDA_COMPLETION) &&
                            data.subscriberApprovalRequiredByDate &&
                            this.utilService.isPastDate(data.subscriberApprovalRequiredByDate)
                        ) {
                            this.showContacts = true;
                        }
                        data.isAflacPlan = data.plan.carrier && data.plan.carrier.id === 1 ? true : false;
                        if (!data.validity.effectiveStarting || (expireDate && this.dateService.isBefore(expireDate, this.currentDate))) {
                            this.previousCoverage.push(data);
                        } else {
                            data.enrollmentDependents.forEach((item) => {
                                dependentObservable.push(
                                    this.memberService.getMemberDependent(this.memberId, item.dependentId, false, this.mpGroupId),
                                );
                            });
                            forkJoin(dependentObservable).subscribe((result) => {
                                data.enrollmentDependents.forEach((item, index) => {
                                    if (item.dependentId === result[index].id) {
                                        const relationship = this.dependentRelations.find(
                                            (ele) => ele.id === result[index].dependentRelationId,
                                        );
                                        item.relationType = relationship.name;
                                    }
                                });
                            });
                            if (
                                this.currentDate >= startDate &&
                                (!data.validity.expiresAfter || this.dateService.getIsAfterOrIsEqual(expireDate, this.currentDate))
                            ) {
                                this.currentCoverage.push(data);
                            } else if (this.currentDate < startDate) {
                                this.futureCoverage.push(data);
                            }
                        }
                        const totalLength = this.currentCoverage.length + this.futureCoverage.length + this.previousCoverage.length;
                        if (totalLength === this.enrollData.data.length) {
                            if (this.currentCoverage.length) {
                                this.currentCoverage.forEach((coverage, index) => {
                                    this.isVoidCurrentCoverages[index] =
                                        !coverage.feedSentDate &&
                                        !coverage.carrierStatus &&
                                        coverage.status !== this.IS_VOID &&
                                        coverage.status !== this.CANCELLED &&
                                        coverage.status !== EnrollmentStatus.ended;
                                    if (
                                        coverage.plan.characteristics &&
                                        (coverage.plan.characteristics.includes(Characteristics.AUTOENROLLABLE) ||
                                            coverage.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED) ||
                                            coverage.plan.characteristics.includes(Characteristics.DECLINE))
                                    ) {
                                        this.isVoidCurrentCoverages[index] = false;
                                    }
                                });
                                this.benefitSummary.push({
                                    title: this.languageStrings["primary.portal.coverage.current_coverage"],
                                    data: [...this.currentCoverage],
                                    isHide: false,
                                    isPreviousEnrollment: false,
                                });
                            }
                            if (this.futureCoverage.length) {
                                this.futureCoverage.forEach((coverage, index) => {
                                    this.isVoidFutureCoverages[index] =
                                        coverage.feedSentDate === undefined &&
                                        coverage.carrierStatus === undefined &&
                                        coverage.status !== this.IS_VOID &&
                                        coverage.status !== this.CANCELLED &&
                                        coverage.status !== EnrollmentStatus.ended &&
                                        !(
                                            coverage.plan.characteristics &&
                                            (coverage.plan.characteristics.includes(Characteristics.AUTOENROLLABLE) ||
                                                coverage.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED) ||
                                                coverage.plan.characteristics.includes(Characteristics.DECLINE))
                                        );
                                });
                                this.benefitSummary.push({
                                    title: this.languageStrings["primary.portal.coverage.future_coverage"],
                                    data: [...this.futureCoverage],
                                    isHide: false,
                                    isPreviousEnrollment: false,
                                });
                            }
                            if (this.previousCoverage.length) {
                                if (!this.currentCoverage.length && !this.futureCoverage.length) {
                                    this.onlyPreviousCoverage = true;
                                    this.showPrevious = true;
                                    this.buttonLabel = "Hide";
                                } else {
                                    this.onlyPreviousCoverage = false;
                                }
                                this.benefitSummary.push({
                                    title: this.languageStrings["primary.portal.coverage.previous_coverage"],
                                    data: [...this.previousCoverage],
                                    isHide: !this.onlyPreviousCoverage,
                                    isPreviousEnrollment: true,
                                });
                            }
                            this.isLoading = false;
                        }
                    }),
            );
        });
    }

    checkZeroSummary(): void {
        this.zeroStateFlag = true;
        this.checkContinuousPlan(this.products);
        this.continuousProductList.forEach((el) => {
            const index = this.pyList.indexOf(el);
            if (index >= 0) {
                this.pyList.splice(index, 1);
            }
        });
        if (this.enrollData && !this.enrollData.data.length) {
            if (this.availPlanYears && this.availPlanYears.length) {
                const availPYDates = [];
                this.availProductsFlag = true;
                this.availPlanYears.forEach((ele) => {
                    availPYDates.push(this.dateService.toDate(ele.enrollmentPeriod.expiresAfter));
                });
                this.maxAvailPYDate = this.datePipe.transform(Math.max.apply(null, availPYDates), AppSettings.DATE_FORMAT_MM_DD_YYYY);
                this.enrollEndDisplayFlag = !this.pyList.length ? false : true;
            } else {
                this.availProductsFlag = true;
                this.enrollEndDisplayFlag = !this.pyList.length ? false : true;
            }
        }
    }
    routeToShop(): void {
        const data = this.store.selectSnapshot(EnrollmentMethodState.getMemberInfo);
        this.specificEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.specificEnrollmentMethod);
        this.visitedMpGroupStateObj = this.store.selectSnapshot(EnrollmentMethodState.visitedMpGroups);
        if (data.id) {
            this.enrollmentState = this.store.selectSnapshot(EnrollmentMethodState);
            this.store.dispatch(new SetMemberIdentity(data.id));
            this.store.dispatch(new SetMemberInfo(data));
            const mpGroupstring = this.mpGroupId.toString();
            if (
                !(
                    this.specificEnrollmentObj &&
                    (this.specificEnrollmentObj.enrollmentMethod || this.specificEnrollmentObj.enrollmentState) &&
                    this.specificEnrollmentObj.mpGroup &&
                    this.specificEnrollmentObj.mpGroup === mpGroupstring &&
                    this.visitedMpGroupStateObj.indexOf(mpGroupstring) >= 0
                )
            ) {
                this.empoweredModalService.openDialog(EnrollmentMethodComponent, {
                    data: {
                        mpGroup: this.mpGroupId,
                        detail: data,
                        route: this.route,
                        stateAbbr: this.mpGroupObj.state,
                        openingFrom: "dashboard",
                    },
                });
            } else {
                const currentEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
                this.storedState = this.store.selectSnapshot(EnrollmentMethodState.getEnrollmentStateArray);
                if (
                    currentEnrollmentObj.enrollmentMethod === EnrollmentMethod.HEADSET ||
                    currentEnrollmentObj.enrollmentMethod === EnrollmentMethod.CALL_CENTER
                ) {
                    this.memberService
                        .getMemberContact(data.id, ContactType.HOME, this.mpGroupId.toString())
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((result) => {
                            if (result) {
                                if (!this.storedState.some((state) => state.abbreviation === result.body.address.state)) {
                                    this.empoweredModalService.openDialog(EnrollmentMethodComponent, {
                                        data: {
                                            mpGroup: this.mpGroupId,
                                            detail: data,
                                            route: this.route,
                                            stateAbbr: this.mpGroupObj.state,
                                            openingFrom: "dashboard",
                                        },
                                    });
                                } else {
                                    this.openConfirmAddressDialogForShop(data, currentEnrollmentObj);
                                }
                            }
                        });
                } else {
                    this.memberService
                        .getMemberContact(data.id, ContactType.HOME, this.mpGroupId.toString())
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((result) => {
                            if (result) {
                                if (
                                    (currentEnrollmentObj.enrollmentStateAbbreviation !== NY_ABBR &&
                                        result.body.address.state === NY_ABBR) ||
                                    (currentEnrollmentObj.enrollmentStateAbbreviation === NY_ABBR && result.body.address.state !== NY_ABBR)
                                ) {
                                    this.EnrollmentDialogRef = this.empoweredModalService.openDialog(EnrollmentMethodComponent, {
                                        data: {
                                            mpGroup: this.mpGroupId,
                                            detail: data,
                                            route: this.route,
                                            stateAbbr: result.body.address.state,
                                        },
                                    });
                                } else {
                                    const newEnrollmentStateAbbr = result.body.address.state;
                                    const homeState = this.storedState.find((state) => state.abbreviation === newEnrollmentStateAbbr);
                                    const newEnrollmentStateName = homeState ? homeState.name : "";
                                    this.store.dispatch(new SetMemberIdentity(data.id));
                                    this.store.dispatch(new SetMemberInfo(data));
                                    this.store.dispatch(
                                        new SetEnrollmentMethodSpecific({
                                            enrollmentMethod: currentEnrollmentObj.enrollmentMethod,
                                            enrollmentState: this.enrollmentState.currentEnrollment.enrollmentState,
                                            enrollmentCity: this.enrollmentState.currentEnrollment.enrollmentCity,
                                            headSetState: newEnrollmentStateName,
                                            headSetStateAbbreviation: newEnrollmentStateAbbr,
                                            enrollmentStateAbbreviation: this.enrollmentState.currentEnrollment.enrollmentStateAbbreviation,
                                            userType: currentEnrollmentObj.userType,
                                            memberId: currentEnrollmentObj.memberId,
                                            mpGroup: currentEnrollmentObj.mpGroup,
                                        }),
                                    );
                                    if (!this.storedState.some((state) => state.abbreviation === newEnrollmentStateAbbr)) {
                                        this.sharedService.changeProducerNotLicensedInCustomerState(true);
                                    } else {
                                        this.sharedService.changeProducerNotLicensedInCustomerState(false);
                                    }
                                    this.router.navigate(
                                        [
                                            // eslint-disable-next-line max-len
                                            `${this.portal}/direct/customers/${this.mpGroupId}/${data.id}/enrollment/quote-shop/${this.mpGroupId}/specific/${data.id}`,
                                        ],
                                        {
                                            relativeTo: this.route,
                                        },
                                    );
                                }
                            }
                        });
                }
            }
        }
    }

    /**
     * Route to pending enrollments page
     */
    managePendingEnrollment(): void {
        this.router.navigate(["../pending-applications/view-enrollments/manage"], {
            relativeTo: this.route,
        });
    }
    /**
     * opens confirm address pop up and saves enrollment data required for shop page
     * @param details - member details with member id and work employee id
     * @param currentEnrollmentObj current enrollment data
     */
    openConfirmAddressDialogForShop(details: MemberListDisplayItem, currentEnrollmentObj: EnrollmentMethodModel): void {
        const confirmAddressDialogRef = this.dialog.open(ConfirmAddressDialogComponent, {
            width: "750px",
            data: { memberId: details.id, mpGroup: this.mpGroupId, purpose: "shop" },
        });
        this.subscriptions.push(
            confirmAddressDialogRef.afterClosed().subscribe((addressResult) => {
                if (addressResult.action === SHOP_SUCCESS) {
                    this.store.dispatch(new SetMemberIdentity(details.id));
                    this.store.dispatch(new SetMemberInfo(details));
                    this.sharedService.setEnrollmentValuesForShop(addressResult, currentEnrollmentObj);
                    this.router.navigate(
                        [
                            this.portal +
                                "/direct/customers/" +
                                `${currentEnrollmentObj.mpGroup}/${details.id}` +
                                "/enrollment/quote-shop/" +
                                currentEnrollmentObj.mpGroup +
                                "/specific/" +
                                details.id,
                        ],
                        {
                            relativeTo: this.route,
                        },
                    );
                }
            }),
        );
    }

    routeToMemberShop(): void {
        this.router.navigate(["../../../../enrollment/shop"], { relativeTo: this.route });
    }
    showPreviousCoverage(): void {
        if (this.showPrevious) {
            this.showPrevious = false;
            this.buttonLabel = "Show";
        } else {
            this.showPrevious = true;
            this.buttonLabel = "Hide";
        }
    }
    viewSignedApplication(enrollmentId: number): void {
        this.isLoading = true;
        this.subscriptions.push(
            this.enrollmentsService.downloadSignedApplication(this.memberId, enrollmentId, this.mpGroupId).subscribe(
                (response: any) => {
                    const signedBlob = new Blob([response], { type: "text/html" });
                    const signedFileURL = window.URL.createObjectURL(signedBlob);
                    this.isLoading = false;
                    window.open(signedFileURL, "_blank");
                },
                (error: any) => {
                    this.isLoading = false;
                    if (error?.status === ServerErrorResponseCode.RESP_503) {
                        this.downloadError = true;
                        this.errorMessage = this.language.fetchSecondaryLanguageValue(
                            "secondary.portal.callCenter.8x8.api.common.error.message",
                        );
                    }
                },
            ),
        );
    }
    openEditCoveragePopup(enrollmentId: number): void {
        if (this.enrollData.data && this.enrollData.data.length > 0) {
            const data = this.enrollData.data.find((eData) => eData.id === enrollmentId);
            this.EditCoverageDialogRef = this.dialog.open(EditCoverageComponent, {
                minWidth: "100%",
                height: "100%",
                data: {
                    enrollData: data,
                    payFrequency: this.payFrequencyName,
                    mpGroup: +this.mpGroupId,
                    memberId: this.memberId,
                    memberEnrollments: this.memberEnrollments,
                    enrollmentState: this.mpGroupObj.state,
                    memberInfo: this.MemberInfo,
                },
            });
        }
        this.EditCoverageDialogRef.afterClosed().subscribe((data) => {
            if (data !== CoverageChangingFields.cancel) {
                this.updateEnrollmentData();
            }
        });
    }
    /**
     * This method is used to open the planDetails pop up on button click
     * @param data is the enrollment selected
     */
    openPlanDetails(data: any): void {
        const memberContactInfo = 0;
        if (this.getPortal === Portals.MEMBER) {
            this.mpGroup = this.memberDetails.groupId;
            this.abbreviation = this.memberContact[0].address.state;
        } else {
            this.mpGroup = this.mpGroupId;
            this.abbreviation = this.memberContacts[memberContactInfo].address.state;
        }
        const planDetails = {
            planId: data.plan.id,
            planName: data.name,
            states: [
                {
                    abbreviation: this.abbreviation,
                },
            ],
            mpGroup: this.mpGroup,
            carrierId: data.plan.carrier,
            productId: data.plan?.product.id,
            isCarrierOfADV: data.plan.carrier.id === CarrierId.ADV,
            situsState: this.mpGroupObj?.state,
        };
        const dialogRef = this.dialog.open(PlanDetailsComponent, {
            hasBackdrop: true,
            data: planDetails,
            width: "600px",
        });
    }
    distinct(items: any, mapper: any): any {
        if (!mapper) {
            mapper = (item) => item;
        }
        return items.map(mapper).reduce((acc, item) => {
            if (acc.indexOf(item) === -1) {
                acc.push(item);
            }
            return acc;
        }, []);
    }

    changeDateFilter(val: any): void {
        switch (val) {
            case "specificDate":
                this.isSpecificDateSelected = true;
                this.isDateRangeSelected = false;
                this.dateFilterForm.controls.startDate.setValue("");
                this.dateFilterForm.controls.endDate.setValue("");
                break;
            case "dateRange":
                this.isSpecificDateSelected = false;
                this.isDateRangeSelected = true;
                this.dateFilterForm.controls.specificDate.setValue("");
                break;
            default:
                return;
        }
    }
    /**
     * Method check for applied date filter and set filter accordingly
     */
    applyDateRangeFilter(): void {
        this.isFilterApplied = true;
        if (this.dateFilterForm.valid) {
            if (this.isSpecificDateSelected && this.dateFilterForm.controls.specificDate.value) {
                this.specificDateFilter();
            } else if (
                this.isDateRangeSelected &&
                (this.dateFilterForm.controls.startDate.value || this.dateFilterForm.controls.endDate.value)
            ) {
                this.dateRangeFilter();
            }
            this.setDateFilterInfoStore();
            this.enrollDateFilterDropdown.close();
        }
    }
    /**
     * set filter details in the store
     */
    setDateFilterInfoStore(): void {
        const dateFilterInfo: CoverageSummaryFilterInfo = {
            mpGroup: this.mpGroupId,
            specificDate: this.dateFilterForm.controls.specificDate.value,
            startDate: this.dateFilterForm.controls.startDate.value,
            endDate: this.dateFilterForm.controls.endDate.value,
        };
        this.store.dispatch(new SetDateFilterInfo(dateFilterInfo));
    }
    /**
     * resets filter
     * @param filterData filter data
     */
    resetFilter(filterData: string): void {
        if (filterData === "date") {
            this.dateFilterForm.controls.startDate.setValue("");
            this.dateFilterForm.controls.endDate.setValue("");
            this.dateFilterForm.controls.specificDate.setValue("");
            this.selectedDateFilter = "";
            this.benefitSummary = [];
            this.isDateRangeSelected = false;
            this.isSpecificDateSelected = false;
            this.setDateFilterInfoStore();
            if (this.currentCoverage.length) {
                this.benefitSummary.push({
                    title: this.languageStrings["primary.portal.coverage.current_coverage"],
                    data: [...this.currentCoverage],
                    isHide: false,
                    isPreviousEnrollment: false,
                });
            }
            if (this.futureCoverage.length) {
                this.benefitSummary.push({
                    title: this.languageStrings["primary.portal.coverage.future_coverage"],
                    data: [...this.futureCoverage],
                    isHide: false,
                    isPreviousEnrollment: false,
                });
            }
            if (this.previousCoverage.length) {
                this.benefitSummary.push({
                    title: this.languageStrings["primary.portal.coverage.previous_coverage"],
                    data: [...this.previousCoverage],
                    isHide: true,
                    isPreviousEnrollment: true,
                });
            }
            this.isFilterApplied = false;
            this.enrollDateFilterDropdown.close();
        }
    }
    specificDateFilter(): void {
        // TODO - Language needs to be implemented
        const date = this.getDateFormat(this.dateFilterForm.controls.specificDate.value);
        const filteredCurrent = [];
        let title = "";
        this.enrollData.data.forEach((data) => {
            const expireDate = this.getDateFormat(data.validity.expiresAfter);
            const startDate = this.getDateFormat(data.validity.effectiveStarting);
            if (
                this.dateService.getIsAfterOrIsEqual(date, startDate) &&
                (!data.validity.expiresAfter || this.dateService.getIsAfterOrIsEqual(expireDate, date))
            ) {
                filteredCurrent.push(data);
            }
        });
        this.selectedDateFilter = ": " + this.datePipe.transform(date, AppSettings.DATE_FORMAT_MM_DD_YYYY);
        const specificdate = this.datePipe.transform(date, AppSettings.DATE_FORMAT_MM_DD_YYYY);
        title = this.memberFullName + "'s coverage on " + specificdate;
        this.benefitSummary = [];
        this.benefitSummary.push({
            title: title,
            data: [...filteredCurrent],
            isHide: false,
            isPreviousEnrollment: false,
        });
    }
    /**
     * Method to set date range filter
     */
    dateRangeFilter(): void {
        // TODO - Language needs to be implemented
        const filteredDateRange = [];
        const startDate = this.getDateFormat(this.dateFilterForm.controls.startDate.value);
        const endDate = this.getDateFormat(this.dateFilterForm.controls.endDate.value);
        let title = "";
        if (this.dateFilterForm.controls.startDate.value && !this.dateFilterForm.controls.endDate.value) {
            this.enrollData.data.forEach((data) => {
                const coverageStartDate = this.getDateFormat(data.validity.effectiveStarting);
                if (coverageStartDate >= startDate) {
                    filteredDateRange.push(data);
                }
            });
            const date = this.datePipe.transform(startDate, AppSettings.DATE_FORMAT_MM_DD_YYYY);
            title = this.memberFullName + "'s coverage from " + date;

            this.selectedDateFilter = ": On or after " + date;
        } else if (!this.dateFilterForm.controls.startDate.value && this.dateFilterForm.controls.endDate.value) {
            this.enrollData.data.forEach((data) => {
                if (data.validity.expiresAfter || data.validity.effectiveStarting) {
                    const coverageEndDate = this.getDateFormat(data.validity.expiresAfter || data.validity.effectiveStarting);
                    if (coverageEndDate <= endDate) {
                        filteredDateRange.push(data);
                    }
                }
            });
            const date = this.datePipe.transform(endDate, AppSettings.DATE_FORMAT_MM_DD_YYYY);
            title = this.memberFullName + "'s coverage to " + date;
            this.selectedDateFilter = ": On or before " + date;
        } else if (this.dateFilterForm.controls.startDate.value && this.dateFilterForm.controls.endDate.value) {
            this.enrollData.data.forEach((data) => {
                const coverageEndDate = this.getDateFormat(data.validity.expiresAfter);
                const coverageStartDate = this.getDateFormat(data.validity.effectiveStarting);
                if (
                    this.dateService.isBeforeOrIsEqual(coverageStartDate, endDate) &&
                    (!data.validity.expiresAfter || this.dateService.getIsAfterOrIsEqual(coverageEndDate, startDate))
                ) {
                    filteredDateRange.push(data);
                }
            });
            const fromdate = this.datePipe.transform(startDate, AppSettings.DATE_FORMAT_MM_DD_YYYY);
            const todate = this.datePipe.transform(endDate, AppSettings.DATE_FORMAT_MM_DD_YYYY);
            title = this.memberFullName + "'s coverage from " + fromdate + " to " + todate;
            this.selectedDateFilter = ": " + fromdate + "-" + todate;
        }
        this.benefitSummary = [];
        this.benefitSummary.push({
            title: title,
            data: [...filteredDateRange],
            isHide: false,
            isPreviousEnrollment: false,
        });
    }

    clickOutside(): void {
        this.enrollDateFilterDropdown.close();
    }
    /**
     * Method to display availbale and continuous products in MAP/MPP
     */
    displayProducts(): void {
        this.zeroStateFlag = false;
        // Outside OE
        if (this.availPlanYears && !this.availPlanYears.length) {
            this.outsideOEEnrollmentFlag = true;
            this.enrollData.data.forEach((ele) => {
                this.products.forEach((elem) => {
                    if (ele.plan.product.id !== elem.plan.product.id) {
                        this.notEnrolled.push(elem);
                    }
                });
            });
            const cont = [];
            const py = [];
            this.notEnrolled.forEach((ele) => {
                if (ele.taxStatus === this.postTax && ele.plan.policyOwnershipType === AppSettings.INDIVIDUAL) {
                    cont.push(ele.plan);
                    this.continuousProductList = this.distinct(cont, (item) => item.product.name);
                } else {
                    py.push(ele.plan);
                    this.pyList = this.distinct(py, (item) => item.product.name);
                }
            });
            if (this.continuousProductList.length && !this.pyList.length) {
                this.continuousProductsFlag = true;
            } else if (!this.continuousProductList.length && this.pyList.length) {
                this.planYearProductsFlag = true;
            } else if (this.continuousProductList.length && this.pyList.length) {
                this.displayAllProducts = true;
            }
        } else {
            // Inside OE/OLE
            if (this.currentQualifyingEvents && this.currentQualifyingEvents.length && !this.checkFlag) {
                this.checkInQle(this.currentQualifyingEvents);
            }
            if (this.planYearsData && this.planYearsData.length && !this.checkFlag) {
                this.checkInOE(this.planYearsData);
            }
            if (!this.qleFlag && !this.oeFlag && !this.checkFlag) {
                this.outsideOeQleFlag = true;
                this.checkFlag = true;
            }
            this.availProductsFlagOE = true;
        }
    }

    checkInOE(data: any): any {
        const pyDates = [];
        data.forEach((ele) => {
            if (
                this.datePipe.transform(this.currentDate, AppSettings.DATE_FORMAT) >= ele.enrollmentPeriod.effectiveStarting &&
                this.datePipe.transform(this.currentDate, AppSettings.DATE_FORMAT) <= ele.enrollmentPeriod.expiresAfter
            ) {
                pyDates.push(this.dateService.toDate(ele.enrollmentPeriod.expiresAfter));
                this.oeMaxDate = this.datePipe.transform(Math.max.apply(null, pyDates), AppSettings.DATE_FORMAT_MM_DD_YYYY);
                const dateDiff =
                    this.dateService.toDate(this.oeMaxDate).getTime() -
                    this.dateService.toDate(this.datePipe.transform(this.currentDate, AppSettings.DATE_FORMAT)).getTime();
                this.oeCoverageEndDate = Math.floor(dateDiff / this.oneDay);
                this.days = this.oeCoverageEndDate === 1 ? "day" : "days";
                this.oeFlag = true;
                this.checkFlag = true;
            }
        });
    }
    checkInQle(data: any): any {
        // TODO - Language needs to be implemented
        const qleDates = [];
        data.forEach((ele) => {
            if (
                this.datePipe.transform(this.currentDate, AppSettings.DATE_FORMAT) <=
                    this.datePipe.transform(ele.enrollmentValidity?.expiresAfter, AppSettings.DATE_FORMAT) &&
                this.datePipe.transform(this.currentDate, AppSettings.DATE_FORMAT) >= ele.enrollmentValidity?.effectiveStarting
            ) {
                qleDates.push(
                    this.dateService.toDate(this.datePipe.transform(ele.enrollmentValidity?.expiresAfter, AppSettings.DATE_FORMAT)),
                );
                this.qleMaxDate = this.datePipe.transform(Math.max.apply(null, qleDates), AppSettings.DATE_FORMAT_MM_DD_YYYY);
                const dateDiff =
                    this.dateService.toDate(this.qleMaxDate).getTime() -
                    this.dateService.toDate(this.datePipe.transform(this.currentDate, AppSettings.DATE_FORMAT)).getTime();
                this.qleCoverageEndDate = Math.floor(dateDiff / this.oneDay);
                this.days = this.qleCoverageEndDate === 1 ? "day" : "days";
                this.qleFlag = true;
                this.checkFlag = true;
            }
        });
    }
    checkContinuousPlan(data: any): any {
        const cont = [];
        const py = [];

        data.forEach((ele) => {
            if (ele.taxStatus === this.postTax && ele.plan.policyOwnershipType === AppSettings.INDIVIDUAL) {
                cont.push(ele.plan);
                this.continuousProductList = this.distinct(cont, (item) => item.product.name);
            } else {
                py.push(ele.plan);
                this.pyList = this.distinct(py, (item) => item.product.name);
            }
        });
    }
    routeToEnrollment(): void {
        this.router.navigate([`member/enrollment/app-flow/${this.memberDetails.groupId}/${this.memberDetails.memberId}`]);
    }
    isCancelIcon(status: any): boolean {
        // TODO - API constants will be used
        if (
            status === this.declinedStatus ||
            status === this.applicationDenied ||
            status === this.endedStatus ||
            status === this.voidStatus
        ) {
            return true;
        }
        return false;
    }

    /**
     * Returns date object
     * @param date date in string format or date object
     * @returns date object
     */
    getDateFormat(date: string | Date): Date | null {
        if (date) {
            // Check for hyphenated date strings without timezone
            return typeof date === "string" && date.length === DATE_LENGTH ? this.dateService.toDate(date) : this.dateService.toDate(date);
        }
        return null;
    }
    routeToLifeEvent(): any {
        this.router.navigate(["../../../qle/life-events"], { relativeTo: this.route });
    }

    openOfferingListPopup(): void {
        const dialogData = {
            mpGroup: this.mpGroupId,
            filter: false,
            product: null,
        };
        this.dialog.open(OfferingListPopupComponent, {
            data: dialogData,
            width: "800px",
        });
    }

    updateEnrollmentData(): void {
        this.isLoading = true;
        this.currentCoverage = [];
        this.futureCoverage = [];
        this.previousCoverage = [];
        this.benefitSummary = [];
        this.enrollData = {
            data: [],
            beneficiaries: [],
            enrollmentRiders: [],
            enrollmentDependents: [],
        };
        this.getCoverageData();
    }

    showEditCoverage(enrollment: any): boolean {
        if (
            enrollment.plan.carrier.id !== 1 &&
            ((this.isAdmin && enrollment.coverageLevel.name !== AppSettings.DISPLAY_INDIVIDUAL) || !this.isAdmin) &&
            !enrollment.status.startsWith(this.pendingStatus) &&
            enrollment.status !== this.declinedStatus &&
            enrollment.status !== this.applicationDenied &&
            enrollment.status !== this.voidStatus
        ) {
            return true;
        }
        return false;
    }

    /**
     * Function to set min and max date along with its validity
     * @param date: the date that is input, which has to be validated
     */
    setMinMaxDate(date: string): void {
        if (date === "startDate") {
            if (this.dateFilterForm.controls.startDate.value) {
                const inputDate = this.dateService.toDate(this.dateFilterForm.controls.startDate.value);
                if (isNaN(inputDate.getTime())) {
                    this.dateFilterForm.controls.startDate.setErrors({ requirements: true });
                    this.minDate = null;
                    this.datePickerErrorMessage = this.language.fetchSecondaryLanguageValue(
                        "secondary.portal.benefitsOffering.coveragedates.invalidDate",
                    );
                } else if (this.maxDate && this.maxDate <= inputDate) {
                    this.dateFilterForm.controls.startDate.setErrors({ requirements: true });
                    this.dateFilterForm.controls.endDate.setErrors(null);
                    this.datePickerErrorMessage = this.language.fetchSecondaryLanguageValue(
                        "secondary.portal.benefitsOffering.startdate.validation",
                    );
                    this.minDate = null;
                } else {
                    this.dateFilterForm.controls.startDate.setErrors(null);
                    this.minDate = this.dateService.toDate(this.dateFilterForm.controls.startDate.value);
                }
            } else {
                this.minDate = null;
            }
        } else if (date === "endDate") {
            // to set error field for end date when it is before start date
            if (this.dateFilterForm.controls.endDate.value) {
                const inputDate = this.dateService.toDate(this.dateFilterForm.controls.endDate.value);
                if (this.minDate && this.minDate >= inputDate) {
                    this.dateFilterForm.controls.endDate.setErrors({ requirements: true });
                    this.dateFilterForm.controls.startDate.setErrors(null);
                    this.maxDate = null;
                } else {
                    this.dateFilterForm.controls.endDate.setErrors(null);
                    this.maxDate = this.dateService.toDate(this.dateFilterForm.controls.endDate.value);
                }
            } else {
                this.maxDate = null;
                // not to show error in the end date field when date is removed, since the field is optional
                this.dateFilterForm.controls.endDate.setErrors(null);
            }
        }
    }

    /**
     * Function to send the reminder to the customer for enrollment completion
     */
    sendToCustomer(): void {
        let requestData: SendReminderMode;
        const requestSignData = this.contactForm.value.contacts;
        this.isLoading = true;
        if (requestSignData.type === this.email) {
            requestData = { email: requestSignData.contact };
        } else {
            requestData = { phoneNumber: requestSignData.contact };
        }
        this.shoppingCartService
            .requestShoppingCartSignature(this.mpGroupId, this.memberId, requestData, PendingReasonForPdaCompletion.ENROLLMENT)
            .subscribe(
                () => {
                    this.isLoading = false;
                    this.requestSent = true;
                },
                () => {
                    this.isLoading = false;
                },
            );
    }

    showContact(): void {
        this.contactForm = this.fb.group({});
        this.contactList = [];
        let selectedValue;
        if (this.emailContacts.length) {
            this.emailContacts.forEach((contact) => {
                this.contactList.push({
                    contact: contact,
                    disableField: false,
                    type: this.email,
                });
            });
            selectedValue = this.contactList[0];
        } else {
            this.contactList.push({
                contact: this.languageStrings["primary.portal.headset.noemailaddress"],
                disableField: true,
            });
        }
        if (this.textContacts.length) {
            this.textContacts.forEach((contact) => {
                this.contactList.push({
                    contact: contact,
                    disableField: false,
                    type: this.phoneNumber,
                    formatted: this.utilService.formatPhoneNumber(contact),
                });
            });
            if (!selectedValue) {
                selectedValue = this.contactList[1];
            }
        } else {
            this.contactList.push({
                contact: this.languageStrings["primary.portal.headset.nomobile"],
                disableField: true,
            });
        }
        const savedContact = this.contactList.filter((contact) => contact.type).pop();
        if (savedContact) {
            this.hasMemberContact = true;
        }
        this.contactForm.addControl("contacts", this.fb.control(selectedValue));
    }

    addContactInfo(): void {
        const url = `${this.portal}/direct/customers/${this.mpGroupId}/${this.memberId}/memberadd/`;
        this.router.navigate([url]);
    }
    /**
     * This method opens void coverage dialog
     * once the pop up is closed navigates back to coverage summary
     * @param enrollmentId: number, enrollment id
     * @param planName: string, name of the current plan to be voided
     * @returns void
     */
    showVoidCoveragePopup(enrollmentId: number, planName: string): void {
        const dialogRef = this.empoweredModalService.openDialog(VoidCoverageComponent, {
            data: {
                planName: planName,
                mpGroup: this.mpGroupId,
                memberId: this.memberId,
                enrollId: enrollmentId,
                isCoverageSummary: true,
            },
        });
        dialogRef
            .afterClosed()
            .pipe(
                filter((resp) => resp),
                switchMap((voidCoverageData) =>
                    this.enrollmentsService.voidCoverage(this.memberId, enrollmentId, this.mpGroupId, voidCoverageData),
                ),
                switchMap(() => {
                    this.updateEnrollmentData();
                    return EMPTY;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * get the coverage summary data as per selected filter
     */
    getFilteredData(): void {
        const filterInfo = this.store.selectSnapshot(EnrollmentMethodState.getDateFilterInfo);
        if (filterInfo && (filterInfo.specificDate || filterInfo.startDate || filterInfo.endDate)) {
            this.isFilterApplied = true;
            if (filterInfo.specificDate) {
                this.isSpecificDateSelected = true;
                this.dateFilterForm.controls.specificDate.setValue(filterInfo.specificDate);
                this.specificDateFilter();
            } else if (filterInfo.startDate || filterInfo.endDate) {
                this.isDateRangeSelected = true;
                this.dateFilterForm.controls.startDate.setValue(filterInfo.startDate);
                this.dateFilterForm.controls.endDate.setValue(filterInfo.endDate);
                this.dateRangeFilter();
            }
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((element) => element.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
