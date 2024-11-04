import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { FormControl, FormGroup, Validators, FormBuilder, AbstractControl, ValidatorFn } from "@angular/forms";
import { Store } from "@ngxs/store";
import {
    DocumentApiService,
    MemberService,
    EnrollmentService,
    StaticService,
    QLEProductsOption,
    AccountList,
    BenefitsOfferingService,
    NewHireRule,
    AflacService,
    Actions,
    AccountService,
    MemberQLETypes,
    Attribute,
    AccountDetails,
} from "@empowered/api";

import {
    QleState,
    AccountListState,
    AccountInfoState,
    EnrollmentMethodState,
    SharedState,
    StaticUtilService,
    DualPlanYearService,
} from "@empowered/ngxs-store";
import { DatePipe } from "@angular/common";
import { Subscription, forkJoin, Subject, of, combineLatest, Observable } from "rxjs";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { HttpEventType, HttpResponse } from "@angular/common/http";
import { NgxMaskPipe } from "ngx-mask";
import { takeUntil, switchMap, catchError, finalize, tap } from "rxjs/operators";
import { Router } from "@angular/router";
import {
    DateFormats,
    ClientErrorResponseCode,
    FileUploadMessage,
    CarrierId,
    DateInfo,
    ConfigName,
    AccountImportTypes,
    AppSettings,
    Portals,
    PlanChoice,
    Characteristics,
    PlanYearType,
    Plan,
    MemberProfile,
    StatusType,
    QualifyingEventType,
    PlanYear,
    FileDetails,
    Percentages,
    ServerErrorResponseCode,
    ApiResponseData,
    DateFormat,
    Document,
} from "@empowered/constants";
import { MatSelectChange } from "@angular/material/select";
import { DateService } from "@empowered/date";
import { SharedService, FileUploadService } from "@empowered/common-services";

const PARSE_INT = 10;
const FIRST_OF_MONTH = 1;
const PRODUCT_COVERAGE_ERROR = "productcoverageerrors";
const HQ_FUNDED = "HQ";
const ONE_MONTH = 1;
const DAYS = "##days##";
const BIRTH_ADOPTION_ID_TWO = 2;
const BIRTH_ADOPTION_ID = 59;
const TRUE = "true";
const FALSE = "false";

interface PlanYearIds {
    planYearId: number;
    productId: number;
}
interface CoverageEffectiveDate {
    productId: number;
    effectiveDate: Date | string;
}

@Component({
    selector: "empowered-add-new-qle",
    templateUrl: "./add-new-qle.component.html",
    styleUrls: ["./add-new-qle.component.scss"],
})
export class AddNewQleComponent implements OnInit, OnDestroy {
    acceptableFormats = ".pdf,.jpeg,.doc,.docx,.txt,.xls,.xlsm,.xlsx,.xml";
    eventTypes: QualifyingEventType[];
    form: FormGroup;
    createQLEForm: FormGroup;
    minDate: string;
    maxDate: string;
    today = new Date();
    files: any[] = [];
    isFileAvailable: boolean;
    isFileSelected = false;

    errorMessage: string;
    incorrectObj = { incorrect: true };

    uploadSuccessStatus: string[] = [];
    uploadErrorStatus: string[] = [];
    subscription: Subscription;
    documentsId: number[] = [];
    isFileUploaded = false;
    fileUploadPercentage = 0;
    isUploadingStarted = false;
    hasError: boolean[] = [];
    isSucess: boolean[] = [];
    modeProgress = "determinate";
    mpGroupId: number;
    isProgressBarEnabled: boolean;
    fileExtension: string;
    modifiedName: string;
    fileError = false;
    deleteDocuments: number[] = [];
    isFileViewable = true;
    currentDate = new Date();
    enrollStartDateFlag = false;
    enrollEndDateFlag = false;
    productsOption = QLEProductsOption;
    productsListDisplay = false;
    productListData: any;
    productsData = [];
    specificCoverageDates = [];
    allProductsCoverageFlag = false;
    specificProductsCoverageFlag = false;
    specificProductDateSelected: any;
    toCheck: number;
    productsList = [];
    eventSpan: number;
    enrollmentEndDate: Date | string;
    eventEndDate = new Date();
    allProductDateSelected: Date | string;
    getEventdate: Date;
    MemberInfo: any;
    typeId: any;
    enrollData = [];
    adminNotes: any;
    memberNotes: string;
    QLEBody: unknown;
    routeAfterLogin: string;
    member = false;
    error = false;
    startCoverageDateAfter: number;
    CoverageError: string;
    errorMsg: string;
    allProductsCoverageError: string;
    getConfigName = "member.qle.coverage_start_date.restricted_days_after_event_date_window";
    coverageConfigName = "member.qle.coverage_start_date.allowed_coverage_start_window";
    getConfigForQLEMaxDays = "member.qle.notNewHireLE.coverage_start_date.allowed_coverage_start_window";
    coverageDateDifference: number;
    productListCoverageDate = "Coverage Start";
    selectedProductOption = "all_products";
    dateFormat = "yyyy-MM-dd";
    dateFormatForMinMaxDate = "MM/dd/yyyy";
    qleStatus = "PENDING";
    enrollEndDateError: string;
    enrollStartDateError: string;
    coverageControl: FormControl;
    equalEvents = [];
    zeroConstant = 0;
    memberEvents: any;
    reqDocument: string;
    productName: any[];
    enrollStartDateFlagBeforeCurrent = false;
    enrollEndDateFlagAfter = false;
    ernollEndErrorDate: string;
    startDateString = new Date();
    invalidFileExtension: boolean;
    getPortal: string;
    stepPosition = false;
    errorResp = false;
    languageStrings = {
        ariaCancel: this.language.fetchPrimaryLanguageValue("primary.portal.common.cancel"),
        ariaNext: this.language.fetchPrimaryLanguageValue("primary.portal.common.next"),
        ariaBack: this.language.fetchPrimaryLanguageValue("primary.portal.common.back"),
        select: this.language.fetchPrimaryLanguageValue("primary.portal.common.placeholderSelect"),
        eventDate: this.language.fetchPrimaryLanguageValue("primary.portal.qle.addNewQle.eventDate"),
        enrollStart: this.language.fetchPrimaryLanguageValue("primary.portal.qle.addNewQle.enrollStart"),
        enrollEnd: this.language.fetchPrimaryLanguageValue("primary.portal.qle.addNewQle.enrollEnd"),
        coverageStart: this.language.fetchPrimaryLanguageValue("primary.portal.qle.addNewQle.coverageStart"),
        selectOption: this.language.fetchPrimaryLanguageValue("primary.portal.qle.addNewQle.selectOption"),
        ariaInfo: this.language.fetchPrimaryLanguageValue("primary.portal.qle.addNewQle.ariaInfo"),
        notes: this.language.fetchPrimaryLanguageValue("primary.portal.qle.addNewQle.notes"),
        optionalText: this.language.fetchPrimaryLanguageValue("primary.portal.common.optional"),
        step1Title: this.language.fetchPrimaryLanguageValue("primary.portal.qle.addNewQle.step1Title"),
        step2Title: this.language.fetchPrimaryLanguageValue("primary.portal.qle.addNewQle.step2Title"),
        addLifeEvent: this.language.fetchPrimaryLanguageValue("primary.portal.common.addLifeEvent"),
    };
    endDateString = new Date();
    eventTypeFlag = false;
    isAflacProduct: boolean;
    enrollmentMethod = "FACE_TO_FACE";
    expandPlanOfferings = "plan.productId";
    mpGroupObj: AccountList;
    nonAflacProducts: Plan[] = [];
    aflacPlans: PlanChoice[] = [];
    nonAflacPlans: PlanChoice[] = [];
    planChoices: PlanChoice[] = [];
    isLoading = true;
    matchEventDate: string;
    aflacProducts: Plan[] = [];
    initialPlanOfferingDate: Date | string;
    planYears: PlanYear[] = [];
    subscriptions: Subscription[] = [];
    planYearIds: PlanYearIds[] = [];
    isformVisible = false;
    specificCoverageEffectiveDates: CoverageEffectiveDate[] = [];
    specifiCoverageDateErrors: string[] = [];
    NEW_HIRE = "NEW_HIRE";
    aflacCarrierId = 1;
    private unsubscribe$ = new Subject<void>();
    isNewHire = false;
    hireDateInfo: string;
    name: string;
    isAllSelected = true;
    daysConsideredNewHire: number;
    aflacPlansPYDate: Date | string;
    languageString: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.qle.addNewQle.dateValidationMsg.dataPast",
        "primary.portal.qle.addNewQle.dateValidationMsg.dateFuture",
        "primary.portal.qle.addNewQle.hireDate",
        "primary.portal.qle.addNewQle.hireDateInfo",
        "primary.portal.qle.addNewQle.useSameCoverage",
        "primary.portal.qle.addNewQle.coverageNonAflac",
        "primary.portal.qle.addNewQle.step2SubTitle",
        "primary.portal.qle.addNewQle.dateCannotBeBeforeHireDate",
        "primary.portal.qle.addNewQle.dateCantBeMoreInFuture",
        "primary.portal.qle.addNewQle.dateMustBeAfterEventDate",
        "primary.portal.qle.addNewQle.eventType",
        "primary.portal.qle.addNewQle.eventDate",
        "primary.portal.member.qle.validationErrorCannotBePast",
        "primary.portal.member.qle.dateCannotBeBefore",
        "primary.portal.member.qle.validationErrorMustBeAfterPlanOfferingEffectiveDate",
        "primary.portal.qle.addNewQle.nextDayDate",
        "primary.portal.census.manualEntry.newHire",
        "primary.portal.census.manualEntry.accountProfile",
        "primary.portal.member.qle.dateCannotBeAfter",
        "primary.portal.member.qle.dateCannotBeAfterMaxDays",
        "primary.portal.qle.addNewQle.badParameterPlanDates",
        "primary.portal.members.document.addUpdate.virusDetectedError",
        "primary.portal.qle.addNewQle.downloadDocument.error",
        "primary.portal.coverage.notAllowedDate",
        "primary.portal.qle.addNewHireQle.mustBeFirstOfMonth",
        "primary.portal.members.document.addUpdate.virusDetected.fieldMessage",
    ]);
    updateMemberInfo: MemberProfile;
    newHireRules: NewHireRule[];
    enrollmentWindow: number;
    coverageStartReference: string;
    daysAfterCoverageStartRef: number;
    coverageStart: string;
    daysBeforeStart = 1;
    CREATE_QLE = "CREATE_QLE";
    nonAflacProductCoverageStartDate: Date | string;
    enrollmentWindowLengthText = "enrollment_window_length";
    coverageStartReferenceText = "coverage_start_reference";
    daysAfterCoverageStartReferenceText = "days_after_coverage_start_reference";
    coverageStartText = "coverage_start";
    isAflac = false;
    todayDate = new Date();
    aflacPlanYearIds: number[];
    nonAflacPlanYearIds: number[];
    expand = "planId,productId";
    EVENT_DATE = "EVENT_DATE";
    NEXT_FIRST_OF_MONTH = "NEXT_FIRST_OF_MONTH";
    isProducer = false;
    qleMaxDays: number;
    maxEventDate: Date | string = new Date();
    daysAdded = 0;
    minEventDate = new Date();
    disableAllProducts = false;
    readonly specificProducts = "specific_products";
    nonAflacPYDate = new Date();
    dateClass = this.sharedService.dateClass;
    firstDateOfMonth = 1;
    // flag to check qle is added or not
    isQleAdded = true;
    pyCoverageDate: Date | string;
    groupAttributeCoverageDate: Date | string;
    qleMaxDate: Date;
    qleMinDate: Date;
    canAllowShopMaxDays: boolean;
    multipartFileUploadConfig = false;
    maxFileSizeAllowed: number;

    constructor(
        private readonly dialogRef: MatDialogRef<AddNewQleComponent>,
        private readonly store: Store,
        private readonly datePipe: DatePipe,
        private readonly fb: FormBuilder,
        private readonly memberService: MemberService,
        private readonly enrollmentsService: EnrollmentService,
        private readonly documentService: DocumentApiService,
        private readonly language: LanguageService,
        private readonly staticService: StaticService,
        private readonly maskPipe: NgxMaskPipe,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly aflacService: AflacService,
        private readonly accountService: AccountService,
        private readonly router: Router,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly staticUtilService: StaticUtilService,
        private readonly sharedService: SharedService,
        private readonly dateService: DateService,
        private readonly fileUploadService: FileUploadService,
    ) {
        this.eventTypes = this.store.selectSnapshot(QleState.eventTypes);
    }

    closeForm(): void {
        this.dialogRef.close();
        this.memberService.updateQLEList(false);
    }

    /**
     * ngOnInit lifecycle hook
     * Initialize store with the products, plan years and loads new hire rules needed to add QLE
     */
    ngOnInit(): void {
        this.getConfigurations();
        this.routeAfterLogin = this.store.selectSnapshot(SharedState.routeAfterLogin);
        this.storeInitialization();
        this.eventTypes = this.eventTypes.filter((d) => d.description !== MemberQLETypes.BY_REQUEST);
        if (this.getPortal === AppSettings.PORTAL_PRODUCER) {
            this.isProducer = true;
        }
        this.createQLEForm.controls.enrollStartDate.setValue(this.currentDate);
        this.createQLEForm.controls.productsOptionSelected.setValue(this.selectedProductOption);
        this.serviceCalls();
        this.variableDeclarations();
        this.getNewHireRules();
        this.productsList.push({ id: 0, name: this.productListCoverageDate });
        this.getAccDetails();
        this.today.setHours(0, 0, 0, 0);
        this.accountService
            .getGroupAttributesByName(["coverage_start_date"], this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([coverageStartDate]) => {
                this.groupAttributeCoverageDate =
                    coverageStartDate && this.dateService.checkIsAfter(this.dateService.toDate(coverageStartDate.value))
                        ? this.datePipe.transform(coverageStartDate.value, DateFormats.YEAR_MONTH_DAY)
                        : this.todayDate;
            });
    }

    /**
     * Function call to get configs from the database
     */
    getConfigurations(): void {
        combineLatest([
            this.staticUtilService.cacheConfigs([
                this.getConfigForQLEMaxDays,
                ConfigName.ALLOW_USER_TO_SHOP_MORE_THAN_120_DAYS,
                ConfigName.MAX_UPLOAD_FILE_SIZE,
            ]),
            this.staticUtilService.fetchConfigs(
                [
                    this.getConfigName,
                    ConfigName.COV_DATE_MUST_MATCH_EVENT_DATE,
                    ConfigName.DAYS_CONSIDERED_AS_NEW_HIRE,
                    this.coverageConfigName,
                ],
                this.mpGroupId,
            ),
            this.staticUtilService.cacheConfigEnabled(ConfigName.ALLOW_MULTIPART_FILE_UPLOAD),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                ([
                    [qleMaxDays, canAllowShopMaxDays, maxFileSize],
                    [startCoverageDateAfter, matchEventDate, daysConsideredNewHire, coverageDateDifference],
                    isMultipartFileUploadEnabled,
                ]) => {
                    this.multipartFileUploadConfig = isMultipartFileUploadEnabled;
                    this.maxFileSizeAllowed = +maxFileSize.value;
                    this.qleMaxDays = parseInt(qleMaxDays.value, PARSE_INT);
                    this.canAllowShopMaxDays = this.staticUtilService.isConfigEnabled(canAllowShopMaxDays);
                    this.startCoverageDateAfter = +startCoverageDateAfter.value;
                    this.matchEventDate = matchEventDate.value;
                    this.daysConsideredNewHire = +daysConsideredNewHire.value;
                    this.coverageDateDifference = +coverageDateDifference.value;
                },
            );
    }

    getAccDetails(): void {
        this.accountService
            .getAccount(this.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                if (response.partnerId === AppSettings.AFLAC_PARTNER_ID) {
                    this.isAflac = true;
                }
                this.getPlanChoices();
            });
    }
    /**
     * Method to get plan choices for specific member
     */
    getPlanChoices(): void {
        this.benefitOfferingService
            .getPlanChoices(false, false, this.mpGroupId, this.expand)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((plans) => {
                this.planChoices = plans.filter((plan) => !plan.plan.characteristics.includes(Characteristics.DECLINE) && !plan.plan.rider);
                this.planChoices.forEach((plan) => {
                    if (
                        plan.planYearId &&
                        !this.planYearIds.some((py) => py.planYearId === plan.planYearId && py.productId === plan.plan.product.id)
                    ) {
                        this.planYearIds.push({ planYearId: plan.planYearId, productId: plan.plan.product.id });
                    }
                });
                this.setAflacNonAflacProducts();
                this.setAllProducts();
                if (this.planYearIds.length) {
                    this.getPlanYears();
                } else {
                    this.isLoading = false;
                }
            });
    }
    /**
     * Method to get plan years for available products
     */
    getPlanYears(): void {
        const distinctPyIds = Array.from(new Set(this.planYearIds.map((py) => py.planYearId)));
        const planYearsObservable = distinctPyIds.map((pyId) => this.benefitOfferingService.getPlanYear(pyId, this.mpGroupId, false));
        forkJoin(planYearsObservable)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((planYears) => {
                this.planYears = [...planYears];
                this.aflacPlanYearIds = [
                    ...new Set(this.aflacPlans.filter((plan) => plan.planYearId !== undefined).map((plan) => plan.planYearId)),
                ];
                this.nonAflacPlanYearIds = [
                    ...new Set(this.nonAflacPlans.filter((plan) => plan.planYearId !== undefined).map((plan) => plan.planYearId)),
                ];
                this.nonAflacProductCoverageStartDate = this.datePipe.transform(
                    this.dateService.addDays(this.todayDate, 1),
                    this.dateFormatForMinMaxDate,
                );

                if (this.nonAflacPlans && this.nonAflacPlans.some((product) => product.plan.carrierId === CarrierId.AFLAC_GROUP)) {
                    const nextFirstOfMonthDate = new Date(this.today.getFullYear(), this.today.getMonth() + ONE_MONTH, FIRST_OF_MONTH);
                    this.nonAflacProductCoverageStartDate = this.datePipe.transform(nextFirstOfMonthDate, this.dateFormatForMinMaxDate);
                }
                planYears.forEach((planYear) => {
                    if (
                        this.nonAflacPlanYearIds.some((py) => py === planYear.id) &&
                        (!this.nonAflacProductCoverageStartDate ||
                            this.dateService.toDate(planYear.coveragePeriod.effectiveStarting) >
                                this.dateService.toDate(this.nonAflacProductCoverageStartDate))
                    ) {
                        this.nonAflacProductCoverageStartDate = this.datePipe.transform(
                            planYear.coveragePeriod.effectiveStarting,
                            this.dateFormatForMinMaxDate,
                        );
                    }
                });
                this.nonAflacPYDate = this.dateService.toDate(this.nonAflacProductCoverageStartDate);
                if (this.canAllowShopMaxDays) {
                    this.qleMaxDays = Math.max(
                        this.qleMaxDays,
                        planYears
                            .filter(
                                (planYear) =>
                                    planYear.type === PlanYearType.AFLAC_INDIVIDUAL &&
                                    this.dateService.checkIsAfter(this.dateService.toDate(planYear.coveragePeriod.expiresAfter)),
                            )
                            .reduce(
                                (enrollmentCoveragePeriodDiff, planYear) =>
                                    Math.max(
                                        enrollmentCoveragePeriodDiff,
                                        this.dateService.getDifferenceInDays(
                                            this.dateService.toDate(planYear.coveragePeriod.effectiveStarting),
                                            this.dateService.toDate(planYear.enrollmentPeriod.effectiveStarting),
                                        ),
                                    ),
                                0,
                            ),
                    );
                }
                this.isLoading = false;
            });
    }

    /**
     * Get data from store and sets form and required validations.
     * @returns void
     */
    storeInitialization(): void {
        this.getPortal = this.store.selectSnapshot(SharedState.portal);
        this.eventTypes = this.store.selectSnapshot(QleState.eventTypes);
        this.mpGroupId = +this.store.selectSnapshot(AccountInfoState.getMpGroupId);
        this.mpGroupObj = this.store.selectSnapshot(AccountListState.getGroup);
        this.MemberInfo = this.store.selectSnapshot(EnrollmentMethodState.getMemberInfo);
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.qle.*"));
        this.form = this.fb.group(
            {
                eventType: ["", [Validators.required, this.validateEventType.bind(this)]],
                eventDate: ["", [Validators.required, this.validateMinDate.bind(this), this.validateMaxDate.bind(this)]],
                notes: [""],
                employeeComment: [""],
            },
            { updateOn: "submit" },
        );
        this.createQLEForm = this.fb.group(
            {
                enrollStartDate: ["", [Validators.required, this.validateEnrollStartDate.bind(this)]],
                enrollEndDate: ["", [Validators.required, this.validateEnrollEndDate.bind(this)]],
                productsOptionSelected: [""],
                coverage: ["", [Validators.required, this.getAllProductsDate()]],
            },
            { updateOn: "submit" },
        );
        this.isformVisible = true;
    }

    serviceCalls(): void {
        this.enrollmentsService
            .getEnrollments(this.MemberInfo.id, this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.enrollData = this.distinct(res, (item) => item.plan.productId);
            });

        this.memberService
            .getMemberQualifyingEvents(this.MemberInfo.id, this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((mem) => {
                this.memberEvents = mem;
                this.checkExistingEvent();
            });
        this.memberService
            .getMember(this.MemberInfo.id, true, this.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((memberDetails) => {
                this.MemberInfo = memberDetails.body;
                if (this.MemberInfo) {
                    this.name = `${this.MemberInfo.name.firstName} ${this.MemberInfo.name.lastName}`;
                    this.hireDateInfo = this.language
                        .fetchPrimaryLanguageValue("primary.portal.qle.addNewQle.hireDateInfo")
                        .replace("##name##", this.name);
                }
            });
    }
    /**
     * Method to set aflac products and non-aflac products
     */
    setAflacNonAflacProducts(): void {
        this.aflacPlans = [];
        this.nonAflacProducts = [];
        this.productsData = [];
        this.nonAflacPlans = [];
        this.planChoices.forEach((plan) => {
            if (plan.plan.carrierId === this.aflacCarrierId) {
                this.aflacPlans.push(plan);
            } else {
                this.nonAflacPlans.push(plan);
            }
        });
        this.aflacPlans.forEach((plan) => {
            if (!this.productsData.find((product) => product.product.id === plan.plan.product.id)) {
                this.productsData.push(plan.plan);
            }
        });
        this.aflacProducts = [...this.productsData];
        this.nonAflacPlans.forEach((plan) => {
            if (
                !this.productsData.find((product) => product.product.id === plan.plan.product.id) &&
                !this.nonAflacProducts.find((product) => product.product.id === plan.plan.product.id)
            ) {
                this.nonAflacProducts.push(plan.plan);
            }
        });
    }
    /**
     * Method to set coverage date for VAS products
     * @param plan : To check HQ funded or Employer funded
     * @param coverageDate : coverage date to compare
     * @returns calculated date
     */
    setCoverageDateForVASProducts(plan: Plan, coverageDate: Date): string {
        this.today.setHours(0, 0, 0, 0);
        let date = this.datePipe.transform(new Date(this.today.getFullYear(), this.today.getMonth() + 1, 1), this.dateFormatForMinMaxDate);
        if (plan.vasFunding === HQ_FUNDED && this.isNewHire) {
            if (coverageDate > this.today && coverageDate.getDate() === 1) {
                date = this.datePipe.transform(coverageDate, this.dateFormatForMinMaxDate);
            } else {
                date = this.datePipe.transform(
                    new Date(coverageDate.getFullYear(), coverageDate.getMonth() + 1, 1),
                    this.dateFormatForMinMaxDate,
                );
            }
        }
        return this.dateService.checkIsAfter(this.dateService.toDate(date), coverageDate)
            ? date
            : this.datePipe.transform(coverageDate, this.dateFormatForMinMaxDate);
    }
    /**
     * Method to set all products
     */
    setAllProducts(): void {
        this.productsData = [];
        this.planChoices.forEach((planChoice) => {
            if (!this.productsData.find((product) => product.product.id === planChoice.plan.product.id)) {
                this.productsData.push(planChoice.plan);
            }
        });
    }
    variableDeclarations(): void {
        this.enrollStartDateFlag = false;
        this.productsListDisplay = false;
        this.documentsId = [];
        this.uploadErrorStatus = [];
        this.uploadSuccessStatus = [];
        this.hasError = [];
        this.isSucess = [];
        this.deleteDocuments = [];
        this.hireDateInfo = this.language
            .fetchPrimaryLanguageValue("primary.portal.qle.addNewQle.hireDateInfo")
            .replace("##name##", this.name);
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

    // Step 1
    checkExistingEvent(): void {
        let equalEventsLength = this.zeroConstant;
        this.eventTypes.forEach((specificEventType) => {
            this.memberEvents.forEach((existingEvent) => {
                if (specificEventType.id === existingEvent.type.id) {
                    this.equalEvents[equalEventsLength] = existingEvent.type.id;
                    equalEventsLength++;
                }
            });
        });
    }
    validateEventType(control: FormControl): any {
        this.equalEvents.forEach((element) => {
            this.memberEvents.forEach((ele) => {
                if (
                    control.value.id === ele.type.id &&
                    this.datePipe.transform(this.currentDate, this.dateFormat) <
                        this.datePipe.transform(ele.enrollmentValidity?.expiresAfter, this.dateFormat)
                ) {
                    this.eventTypeFlag = true;
                    return;
                }
            });
        });
        return this.eventTypeFlag === true ? { incorrect: true } : null;
    }
    getEventTypeError(): string {
        return this.form.get("eventType").hasError("incorrect") ? "primary.portal.qle.addNewQle.eventTypeError" : "";
    }
    /**
     * Method to set data in step 2 based on event type selected
     * @param event : Event of QLE types dropdown
     */
    changeInEvent(event: MatSelectChange): void {
        this.isNewHire = false;
        const eventType = this.eventTypes.find((type) => type.id === event.value.id);
        if (eventType) {
            this.typeId = event.value.id;
            this.eventSpan = eventType.daysToReport;
            const tempDate: Date = this.dateService.toDate(this.today);
            this.form.controls.eventDate.reset();
            if (this.form.controls.eventDate.value) {
                this.form.controls.eventDate.setErrors(null);
                this.form.controls.eventDate.clearValidators();
            }
            if (this.productsListDisplay) {
                this.productsData.forEach((el) => {
                    if (this.createQLEForm.controls[el.product.name]) {
                        this.createQLEForm.removeControl(el.product.name);
                    }
                });
            }
            this.productsListDisplay = false;
            this.productsList = [{ id: 0, name: this.productListCoverageDate }];
            this.createQLEForm.controls.productsOptionSelected.setValue(this.isNewHire ? true : this.selectedProductOption);
            if (event.value.code === this.NEW_HIRE) {
                tempDate.setDate(tempDate.getDate() - (this.daysAdded - 1));
                const maxHireDate = this.dateService.toDate(this.today);
                maxHireDate.setDate(maxHireDate.getDate() + (this.daysAdded - 1));
                this.maxDate = this.datePipe.transform(maxHireDate, this.dateFormatForMinMaxDate);
                this.minDate = this.datePipe.transform(tempDate, this.dateFormatForMinMaxDate);
                this.isNewHire = true;
                this.isAllSelected = true;
                this.setAflacNonAflacProducts();
            } else {
                tempDate.setDate(tempDate.getDate() - this.eventSpan);
                this.minDate = this.datePipe.transform(tempDate, this.dateFormatForMinMaxDate);
                this.setAllProducts();
                this.createQLEForm.controls.productsOptionSelected.setValue(this.selectedProductOption);
                this.maxDate = this.datePipe.transform(this.today, this.dateFormatForMinMaxDate);
                this.requiredDocument(this.typeId);
            }
            this.minEventDate = this.dateService.toDate(this.minDate);
            this.maxEventDate = this.dateService.toDate(this.maxDate);
            this.form.controls.eventDate.updateValueAndValidity();
        }
        this.eventTypeFlag = false;
    }
    /**
     * Function to construct info message based on document text
     * @param id type
     */
    requiredDocument(id: number): void {
        let tempDocument = "";
        switch (id) {
            case BIRTH_ADOPTION_ID_TWO:
            case BIRTH_ADOPTION_ID:
                tempDocument = "primary.portal.qle.addNewQle.BirthAdoption";
                break;
            case 4:
                tempDocument = "primary.portal.qle.addNewQle.dependentEligibility";
                break;
            case 7:
                tempDocument = "primary.portal.qle.addNewQle.deathOfDependent";
                break;
            case 5:
                tempDocument = "primary.portal.qle.addNewQle.dependentMedicare";
                break;
            case 8:
                tempDocument = "primary.portal.qle.addNewQle.divorce";
                break;
            case 12:
                tempDocument = "primary.portal.qle.addNewQle.employeeEligibleMedicare";
                break;
            case 60:
                tempDocument = "primary.portal.qle.addNewQle.gainEligibility";
                break;
            case 63:
                tempDocument = "primary.portal.qle.addNewQle.lossOfEligibility";
                break;
            default:
                tempDocument = "primary.portal.qle.addNewQle.none";
        }
        this.reqDocument = this.language.fetchPrimaryLanguageValue(tempDocument);
    }
    validateMinDate(control: FormControl): any {
        const date = this.datePipe.transform(control.value, this.dateFormatForMinMaxDate);
        return this.dateService.toDate(date) < this.dateService.toDate(this.minDate) ? { requirements: true } : null;
    }
    validateMaxDate(control: FormControl): any {
        const date = this.datePipe.transform(control.value, this.dateFormatForMinMaxDate);

        return this.dateService.toDate(date) > this.dateService.toDate(this.maxDate) ? { requirementDate: true } : null;
    }
    getDateError(): string {
        if (this.isNewHire) {
            return this.form.get("eventDate").hasError("requirementDate") || this.form.get("eventDate").hasError("requirements")
                ? this.languageString["primary.portal.qle.addNewQle.dateValidationMsg.dataPast"]
                      .replace("#mindate", this.minDate)
                      .replace("#maxdate", this.maxDate)
                : "";
        }
        return this.form.get("eventDate").hasError("requirementDate")
            ? this.languageString["primary.portal.qle.addNewQle.dateValidationMsg.dateFuture"]
            : "";
    }
    /**
     * Method to set the enrollment end date when event date is touched.
     * @param value : user selected event date value
     */
    setEnrollEndDate(value: string): void {
        this.getEventdate = this.dateService.toDate(value);
        this.eventEndDate = this.dateService.toDate(value);
        if (this.eventSpan) {
            this.eventEndDate.setDate(this.eventEndDate.getDate() + this.eventSpan);
            this.ernollEndErrorDate = this.datePipe.transform(this.eventEndDate, this.dateFormatForMinMaxDate);
            if (this.isNewHire) {
                const enrollmentStartDate = this.dateService.toDate(value);
                const enrollmentStart =
                    enrollmentStartDate < this.dateService.toDate(this.today) ? this.dateService.toDate(this.today) : enrollmentStartDate;
                const enrollEndDate = this.dateService.toDate(enrollmentStart);
                enrollEndDate.setDate(enrollEndDate.getDate() + (this.enrollmentWindow - 1));
                this.startDateString = enrollmentStart;
                this.endDateString = enrollEndDate;
                this.createQLEForm.controls.enrollStartDate.setValue(enrollmentStart);
                this.createQLEForm.controls.enrollEndDate.setValue(enrollEndDate);
            } else {
                this.enrollmentEndDate = new Date();
                this.enrollmentEndDate.setDate(this.enrollmentEndDate.getDate() + this.eventSpan);
                this.createQLEForm.controls.enrollStartDate.setValue(this.currentDate);
                this.createQLEForm.controls.enrollEndDate.setValue(this.enrollmentEndDate);
                this.startDateString = this.currentDate;
                this.endDateString = this.enrollmentEndDate;
            }
            this.setCoverageStartDate(this.createQLEForm.controls.productsOptionSelected.value, this.getEventdate);
        }
    }
    /**
     * Method to set coverage date
     * @param selectedOption : Selected option of all products/specific products
     * @param eventDate : Event date of qle
     */
    setCoverageStartDate(selectedOption: string | boolean, eventDate: Date): void {
        let coverageDate: Date | string;
        const enrollmentStartDate: Date | string = this.dateService.toDate(this.createQLEForm.controls.enrollStartDate.value);
        enrollmentStartDate.setDate(enrollmentStartDate.getDate());
        let date: Date | string;
        if (!this.isAflac) {
            if (this.matchEventDate.toLowerCase() === TRUE) {
                coverageDate = eventDate;
            } else if (this.startCoverageDateAfter !== this.zeroConstant) {
                coverageDate = this.dateService.addDays(
                    this.dateService.toDate(this.form.controls.eventDate.value || ""),
                    this.startCoverageDateAfter,
                );
            }
        }
        if (this.isNewHire) {
            date = this.getCoverageDateForNewHire(eventDate, enrollmentStartDate);
        } else {
            date =
                this.dateService.toDate(this.todayDate) > this.dateService.toDate(this.createQLEForm.controls.enrollStartDate.value)
                    ? this.dateService.toDate(this.todayDate)
                    : this.dateService.toDate(enrollmentStartDate);
        }
        if (selectedOption === this.selectedProductOption || selectedOption === true) {
            this.setCoverageDateForAllProducts(date, coverageDate);
        } else {
            this.setCoverageDateForSpecificProducts(date, coverageDate);
        }
        this.filterProductsBasedOnPY();
    }
    /**
     * Method to filter products based on PY
     */
    filterProductsBasedOnPY(): void {
        if (this.productsListDisplay) {
            this.specificCoverageEffectiveDates.forEach((specific) => {
                this.filterProducts(specific.productId, specific.effectiveDate, false);
            });
            if (this.isNewHire && this.nonAflacProducts.length) {
                this.nonAflacPlans.forEach((plan) => {
                    this.filterProducts(plan.plan.product.id, this.nonAflacProductCoverageStartDate, true, plan.plan.product.name);
                });
            }
        }
    }
    /**
     * Method to filter products from product list
     * @param productId - product id to be removed
     * @param effectiveDate - effective date to checked
     * @param nonAflac - true if it is nonaflac plan else false
     * @param productName - name of the product
     */
    filterProducts(productId: number, effectiveDate: Date | string, nonAflac: boolean, productName?: string): void {
        const planYearIds = this.planYearIds.filter((py) => py.productId === productId).map((py) => py.planYearId);
        if (planYearIds && planYearIds.length) {
            const planYears = this.planYears.filter((py) => planYearIds.includes(py.id));
            const planYearsEndDate = planYears
                .map((py) => py.coveragePeriod.expiresAfter)
                .sort()
                .reverse();
            effectiveDate = this.datePipe.transform(effectiveDate, DateFormats.YEAR_MONTH_DAY);
            if (this.dateService.checkIsAfter(this.dateService.toDate(effectiveDate), this.dateService.toDate(planYearsEndDate[0]))) {
                if (nonAflac) {
                    const index = this.nonAflacProducts.findIndex((productList) => productList.product.name === productName);
                    if (index > -1) {
                        this.nonAflacProducts.splice(index, 1);
                    }
                } else {
                    const productData = this.productsData.find((product) => product.product.id === productId);
                    if (productData) {
                        const index = this.productsList.findIndex((product) => product.name === productData.product.name);
                        if (index > -1) {
                            this.createQLEForm.removeControl(productData.product.name);
                            this.productsList.splice(index, 1);
                        }
                    }
                    const productDataIndex = this.productsData.findIndex((product) => product.product.id === productId);
                    if (productDataIndex > -1) {
                        this.productsData.splice(productDataIndex, 1);
                    }
                    const specificProductIndex = this.specificCoverageDates.findIndex((specific) => specific.productId === productId);
                    if (specificProductIndex > -1) {
                        this.specificCoverageDates.splice(specificProductIndex, 1);
                    }
                    const aflacProductIndex = this.aflacProducts.findIndex((aflacProduct) => aflacProduct.product.id === productId);
                    if (aflacProductIndex > -1) {
                        this.aflacProducts.splice(aflacProductIndex, 1);
                    }
                }
            }
        }
    }
    /**
     * Method to get coverage date for new hire
     * @param eventDate Life event date
     * @param enrollmentStartDate Enrollment start date
     * @returns coverage start date
     */
    getCoverageDateForNewHire(eventDate: Date, enrollmentStartDate: Date): Date {
        let coverageStartDate: Date;
        const coverageRefDate: Date =
            this.coverageStartReference === this.EVENT_DATE ? eventDate : this.dateService.toDate(enrollmentStartDate);
        if (this.daysAfterCoverageStartRef !== this.zeroConstant) {
            coverageStartDate = this.dateService.toDate(
                coverageRefDate.setDate(coverageRefDate.getDate() + this.daysAfterCoverageStartRef),
            );
        } else {
            coverageStartDate = coverageRefDate;
        }
        if (this.coverageStart === this.NEXT_FIRST_OF_MONTH) {
            coverageStartDate = new Date(coverageStartDate.getFullYear(), coverageStartDate.getMonth() + 1, 1);
            if (this.dateService.isBeforeOrIsEqual(coverageStartDate)) {
                coverageStartDate = new Date(this.today.getFullYear(), this.today.getMonth() + ONE_MONTH, FIRST_OF_MONTH);
            }
        }
        this.setToFirstOfMonth(coverageStartDate);
        return coverageStartDate;
    }
    /**
     * Method to set coverage date for all products
     * @param date - Pre calculated date
     * @param coverageDate - Calculated coverage date
     */
    setCoverageDateForAllProducts(date: Date | string, coverageDate: Date | string): void {
        if (!this.isAflac && coverageDate && !this.isNewHire) {
            date = coverageDate;
        } else {
            const hasOngoingPlanYear = this.planYears.some(
                (planYear) =>
                    this.dateService.isBeforeOrIsEqual(planYear.coveragePeriod.effectiveStarting) &&
                    this.dateService.getIsAfterOrIsEqual(planYear.coveragePeriod.expiresAfter),
            );
            let pyDate: Date | string;
            const planYearsBasedOnNewHire: PlanYear[] = this.isNewHire
                ? this.planYears.filter((py) => this.aflacPlanYearIds.find((id) => id === py.id))
                : this.planYears;
            if (
                planYearsBasedOnNewHire.length &&
                planYearsBasedOnNewHire.some(
                    (py) => this.dateService.checkIsAfter(py.coveragePeriod.effectiveStarting, this.today) && !hasOngoingPlanYear,
                )
            ) {
                const planYears = planYearsBasedOnNewHire.map((plan) => plan.coveragePeriod.effectiveStarting).sort();
                pyDate = planYears.find((effectiveStarting) => this.dateService.checkIsAfter(effectiveStarting, this.today));
                if ((this.dateService.checkIsAfter(pyDate), date)) {
                    date = this.dateService.toDate(pyDate);
                }
            }
            date = this.getCoverageDate(date);
            date = this.setToFirstOfMonth(this.dateService.toDate(date));
            this.initialPlanOfferingDate =
                pyDate && this.dateService.toDate(pyDate) ? this.dateService.toDate(pyDate) : this.dateService.toDate(this.todayDate);
        }
        this.createQLEForm.controls.coverage.setValue(date);
    }

    /**
     * Method to get coverage date based on enrollment start date
     * @param date : Date to be compared with enrollment start date
     */
    getCoverageDate(date: string | Date): string | Date {
        const enrollmentStartDate: Date | string = this.dateService.toDate(this.createQLEForm.controls.enrollStartDate.value);
        enrollmentStartDate.setDate(enrollmentStartDate.getDate());
        if (date < enrollmentStartDate) {
            date = enrollmentStartDate;
        }
        return date;
    }
    /**
     * Method to set coverage date for specific product
     * @param date : Date to be checked against PY date
     * @param coverageDate : Coverage date to be considered if product's group is non aflac
     */
    setCoverageDateForSpecificProducts(date: Date | string, coverageDate: Date | string): void {
        this.specificCoverageEffectiveDates = [];
        let eventDate = date;
        this.productsData.forEach((product) => {
            let pyDate: Date | string = this.getPYDate(product.product.id);
            if (!this.isAflac && coverageDate && !this.isNewHire) {
                eventDate = coverageDate;
            } else {
                if (this.dateService.toDate(pyDate) >= date) {
                    eventDate = this.dateService.toDate(pyDate);
                }
                if (
                    product.vasFunding === HQ_FUNDED ||
                    product.characteristics.includes(Characteristics.AUTOENROLLABLE) ||
                    (product.carrierId !== CarrierId.AFLAC && product.carrierId !== CarrierId.AFLAC_GROUP)
                ) {
                    eventDate = this.setCoverageDateForVASProducts(product, this.dateService.toDate(eventDate));
                }
                eventDate = this.dateService.toDate(eventDate);
                eventDate.setHours(0, 0, 0, 0);
                eventDate = this.getCoverageDate(eventDate);
                eventDate = this.setToFirstOfMonth(this.dateService.toDate(eventDate));
                this.specificCoverageEffectiveDates.push({
                    effectiveDate: this.dateService.toDate(eventDate),
                    productId: product.product.id,
                });
            }
            if (product.carrierId === CarrierId.AFLAC_GROUP) {
                const nextFirstOfMonthDate = new Date(this.today.getFullYear(), this.today.getMonth() + ONE_MONTH, FIRST_OF_MONTH);
                pyDate = this.dateService.toDate(pyDate);
                if (pyDate > this.dateService.toDate(this.today) && pyDate.getDate() !== 1) {
                    pyDate = new Date(pyDate.getFullYear(), pyDate.getMonth() + ONE_MONTH, FIRST_OF_MONTH);
                }
                eventDate =
                    this.dateService.toDate(pyDate) >= nextFirstOfMonthDate ? this.dateService.toDate(pyDate) : nextFirstOfMonthDate;
            }
            if (this.createQLEForm.controls[product.product.name]) {
                this.createQLEForm.controls[product.product.name].setValue(eventDate);
                if (product.carrierId === CarrierId.AFLAC_GROUP) {
                    this.createQLEForm.controls[product.product.name].disable();
                }
            }
        });
        const uniqueArray = Array.from(
            new Set(
                this.specificCoverageEffectiveDates.map((coverage) =>
                    this.datePipe.transform(coverage.effectiveDate, DateFormats.MONTH_DAY_YEAR),
                ),
            ),
        );

        if (this.isNewHire) {
            const vasPlans = this.nonAflacProducts.filter(
                (plan) =>
                    plan.vasFunding === HQ_FUNDED ||
                    plan.characteristics.includes(Characteristics.AUTOENROLLABLE) ||
                    (plan.carrierId !== CarrierId.AFLAC && plan.carrierId !== CarrierId.AFLAC_GROUP),
            );
            if (vasPlans.length) {
                this.nonAflacProductCoverageStartDate = this.datePipe.transform(this.nonAflacPYDate, this.dateFormatForMinMaxDate);
                let dateForNewHire = date;
                vasPlans.forEach((plan) => {
                    const planYearDate: Date | string = this.getPYDate(plan.product.id);
                    if (this.dateService.toDate(planYearDate) >= date) {
                        dateForNewHire = this.dateService.toDate(planYearDate);
                    }
                    dateForNewHire = this.getCoverageDate(dateForNewHire);
                    const vasProductsCoverageDate = this.setCoverageDateForVASProducts(plan, this.dateService.toDate(dateForNewHire));
                    this.nonAflacProductCoverageStartDate =
                        this.dateService.toDate(this.nonAflacProductCoverageStartDate) > this.dateService.toDate(vasProductsCoverageDate)
                            ? this.nonAflacProductCoverageStartDate
                            : vasProductsCoverageDate;
                });
            }
        }
        const currentAccount: AccountDetails = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        this.disableAllProducts =
            uniqueArray.length !== 1 ||
            currentAccount.importType === AccountImportTypes.AFLAC_GROUP ||
            currentAccount.importType === AccountImportTypes.SHARED_CASE;
    }
    /**
     * Method to get Plan year date
     * If the product exists in current plan year then that takes precedence over future plan year
     * @param productId - Product Id for which plan year date to be set
     * @returns coverage start date set for the product
     */
    getPYDate(productId: number): string | Date {
        this.pyCoverageDate = "";
        const pyIds: PlanYearIds[] = this.planYearIds.filter((py) => py.productId === productId);
        const planYears: PlanYear[] = this.planYears.filter((py) => pyIds.find((id) => id.planYearId === py.id));
        let pyDate: Date | string;
        const existsInCurrentPlanYear =
            planYears.length &&
            planYears.some(
                (py) =>
                    this.dateService.isBeforeOrIsEqual(py.coveragePeriod.effectiveStarting) &&
                    this.dateService.checkIsAfter(py.coveragePeriod.expiresAfter),
            );
        if (
            planYears.length &&
            planYears.some((py) => this.dateService.checkIsAfter(py.coveragePeriod.effectiveStarting)) &&
            !existsInCurrentPlanYear
        ) {
            pyDate = planYears
                .map((plan) => this.dateService.toDate(plan.coveragePeriod.effectiveStarting))
                .sort()
                .find((effectiveStarting) => this.dateService.checkIsAfter(effectiveStarting));
            this.pyCoverageDate = pyDate;
        }
        const planYearDate = pyDate ? this.dateService.toDate(pyDate) : "";
        const today = new Date();
        if (planYearDate && planYearDate > today) {
            pyDate = planYearDate;
        } else if (this.pyCoverageDate) {
            pyDate = this.pyCoverageDate;
        } else if (existsInCurrentPlanYear) {
            pyDate = today;
        } else {
            pyDate = this.dateService.toDate(this.groupAttributeCoverageDate);
        }
        return pyDate;
    }
    /**
     * Function used to get the plan Year end date
     * @param productId : product id
     * @returns Plan Year end date
     */
    getPYEndDate(productId: number): string | Date {
        const pyIds: PlanYearIds[] = this.planYearIds.filter((py) => py.productId === productId);
        const planYears: PlanYear[] = this.planYears.filter((py) => pyIds.find((id) => id.planYearId === py.id));
        let pyEndDate: Date | string;
        if (
            planYears.length &&
            planYears.some((py) => this.dateService.toDate(py.coveragePeriod.expiresAfter) > this.dateService.toDate(this.today))
        ) {
            pyEndDate = planYears
                .map((plan) => this.dateService.toDate(plan.coveragePeriod.expiresAfter))
                .sort()
                .find((expiresAfter) => this.dateService.toDate(expiresAfter) > this.dateService.toDate(this.today));
        }
        return pyEndDate;
    }

    /**
     * This function is used to view and download the document
     * @param event selected document value
     */
    viewFile(event: any): void {
        const fileName = event.name;
        const fileType = fileName.split(".").pop();
        this.documentService
            .downloadDocument(event.documentId, this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    switch (fileType) {
                        case "pdf": {
                            const pdfBlob = new Blob([response], { type: "application/pdf" });

                            /*
                        source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                        msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                        Typescript won't know this is a thing, so we have to use Type Assertion
                        */
                            if ((window.navigator as any).msSaveOrOpenBlob) {
                                (window.navigator as any).msSaveOrOpenBlob(pdfBlob, fileName);
                            } else {
                                const fileurl = URL.createObjectURL(pdfBlob);
                                window.open(fileurl, "_blank");
                            }
                            break;
                        }
                        default: {
                            const blob = new Blob([response], {
                                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            });

                            /*
                        source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                        msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                        Typescript won't know this is a thing, so we have to use Type Assertion
                        */
                            if ((window.navigator as any).msSaveOrOpenBlob) {
                                (window.navigator as any).msSaveOrOpenBlob(blob);
                            } else {
                                const anchor = document.createElement("a");
                                anchor.download = fileName;
                                const fileURLBlob = URL.createObjectURL(blob);
                                anchor.href = fileURLBlob;
                                document.body.appendChild(anchor);
                                anchor.click();
                            }
                        }
                    }
                },
                (error) => {
                    if (error && error.status) {
                        this.errorResp = true;
                        this.errorMessage = this.languageString["primary.portal.qle.addNewQle.downloadDocument.error"];
                    }
                },
            );
    }
    /**
     * @description Method to validate document
     * @param event has the document uploaded by user
     * @returns void
     */
    validateFileAndUpload(event: File): void {
        const name = event.name;
        this.fileExtension = event.name.split(".").pop();
        const notAllowedFormats = ["bat", "exe", "dll", "sh", "bmp", "avi", "mov", "gif", "ini", "jpg", "sys", "wav", "mp3"];
        this.invalidFileExtension = false;
        notAllowedFormats.forEach((extension) => {
            if (extension === this.fileExtension) {
                this.invalidFileExtension = true;
            }
        });
        this.invalidFileExtension = !this.acceptableFormats.includes(this.fileExtension);
        if (name.length > 24) {
            const first16 = name.substring(0, 15);
            const last8 = name.substring(event.name.length - 8, event.name.length);
            this.modifiedName = first16 + "..." + last8;
        } else {
            this.modifiedName = name;
        }
        const file: FileDetails = {
            name: event.name,
            modifiedName: this.modifiedName,
            lastModified: event.lastModified,
            size: event.size,
            type: event.type,
            slice: event.slice,
            documentId: null,
        };
        this.files.push(file);
        if (this.invalidFileExtension) {
            this.setDataForError();
            this.uploadErrorStatus.push("secondary.portal.qle.pendingEnrollment.fileFormat.error");
        } else if (file.size > this.maxFileSizeAllowed) {
            this.setDataForError();
            this.uploadErrorStatus.push("secondary.portal.qle.pendingEnrollment.maxFileSize.error");
        } else {
            this.fileError = true;
            this.isFileSelected = true;
            this.isFileUploaded = false;
            this.isFileAvailable = true;
            this.isUploadingStarted = true;
            this.isProgressBarEnabled = true;
            this.modeProgress = "determine";
            this.fileUploadPercentage = 0;
            this.uploadFile(event, file);
        }
    }

    /**
     * @description method to set data when error occurs
     * @returns void
     */
    setDataForError(): void {
        this.hasError.push(true);
        this.isSucess.push(false);
        this.fileError = true;
        this.uploadSuccessStatus.push("");
        this.isProgressBarEnabled = true;
        this.isFileSelected = true;
        this.isFileAvailable = true;
    }

    /**
     * @description method to upload document to aws s3 using presigned url
     * @param document document for uploading
     * @param file contains details about the file
     * @returns void
     */
    uploadFile(document: File, file: FileDetails): void {
        if (this.multipartFileUploadConfig) {
            this.subscription = this.processFile(document, file).pipe(takeUntil(this.unsubscribe$)).subscribe();
        } else {
            this.subscription = this.fileUploadService
                .upload(document)
                .pipe(
                    switchMap(() => this.processFile(document, file)),
                    catchError(() => {
                        this.isSucess.push(false);
                        this.hasError.push(true);
                        this.uploadErrorStatus.push("secondary.portal.shared.monUpload.genericError");
                        this.uploadSuccessStatus.push("");
                        return of(null);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
    }

    /**
     * @description method to process the uploaded document
     * @param document document uploaded
     * @param file contains details about the file
     * @returns Observable<void>
     */
    processFile(document: File, file: FileDetails): Observable<void | Document> {
        return this.documentService.uploadDocument(document, this.multipartFileUploadConfig, this.mpGroupId).pipe(
            switchMap((events) => {
                if (events.type === HttpEventType.UploadProgress) {
                    this.fileUploadPercentage = Math.round((Percentages.FILE_UPLOAD_MAX_PERCENTAGE * events.loaded) / events.total);
                    if (this.fileUploadPercentage === Percentages.FILE_UPLOAD_MAX_PERCENTAGE) {
                        this.modeProgress = "indeterminate";
                    }
                }
                if (events instanceof HttpResponse) {
                    const documentId = parseInt(events.headers.get(ApiResponseData.RESP_HEADER_LOCATION).split("/")[5], 10);
                    this.isFileUploaded = true;
                    return this.documentService.getDocument(documentId, this.mpGroupId.toString()).pipe(
                        tap((resp) => {
                            file.status = resp.status;
                            this.fileUploadSuccess(file, documentId);
                        }),
                    );
                }
                return of(null);
            }),
            catchError((error) => {
                this.isFileUploaded = false;
                this.isUploadingStarted = false;
                this.hasError.push(true);
                this.isSucess.push(false);
                this.documentsId.push(0);
                this.isProgressBarEnabled = false;
                this.fileError = true;
                this.uploadSuccessStatus.push("");
                let fileError = "";
                if (error.status === ClientErrorResponseCode.RESP_413) {
                    fileError = "secondary.portal.qle.pendingEnrollment.maxFileSize.error";
                } else if (error.status === ClientErrorResponseCode.RESP_415) {
                    fileError = "secondary.portal.qle.pendingEnrollment.fileFormat.error";
                } else if (error.status === ClientErrorResponseCode.RESP_400) {
                    if (
                        error.error.details?.length &&
                        error.error.details[0].field ===
                            this.languageString["primary.portal.members.document.addUpdate.virusDetected.fieldMessage"]
                    ) {
                        fileError = "primary.portal.members.document.addUpdate.virusDetectedError";
                    } else {
                        fileError = "secondary.portal.qle.pendingEnrollment.fileRequired.error";
                    }
                } else if (error.status === ServerErrorResponseCode.RESP_504) {
                    fileError = "secondary.portal.qle.pendingEnrollment.timeout.error";
                } else {
                    fileError = "secondary.portal.qle.pendingEnrollment.unknown.error";
                }
                this.uploadErrorStatus.push(fileError);
                return of(null);
            }),
        );
    }

    /**
     * called to set the flags when file upload is successful
     * @param file: FileDetails, the uploaded document details
     * @param documentId: number, document id
     * @returns void
     */
    fileUploadSuccess(file: FileDetails, documentId?: number): void {
        if (file.status === FileUploadMessage.VIRUS_SCAN_FAILED) {
            this.isSucess.push(false);
            this.hasError.push(true);
            this.uploadErrorStatus.push("primary.portal.members.document.addUpdate.virusDetectedError");
            this.uploadSuccessStatus.push("");
            this.isFileAvailable = true;
            this.isFileUploaded = true;
        } else {
            this.errorResp = false;
            this.documentsId.push(documentId);
            this.uploadErrorStatus.push("");
            this.uploadSuccessStatus.push(this.datePipe.transform(new Date(), DateFormat.DATE_TIME));
            this.isSucess.push(true);
            this.hasError.push(false);
        }
        this.files.forEach((doc) => {
            if (doc === file) {
                doc.documentId = documentId;
            }
        });
        this.isUploadingStarted = false;
        this.isProgressBarEnabled = false;
    }
    /**
     * This function is used to delete document on click of cancel
     * @param index document index
     */
    cancelFileUpload(index: number): void {
        const document = this.files.find((file, i) => i === index);
        this.uploadSuccessStatus.splice(index, 1, "");
        this.uploadErrorStatus.splice(index, 1, "");
        if (!this.isFileUploaded && !this.fileError) {
            this.isUploadingStarted = false;
            this.subscription.unsubscribe();
        } else if (this.isFileUploaded && document) {
            this.documentService.deleteDocument(document.documentId, this.mpGroupId).subscribe();
        }
        this.files.splice(index, 1, null);
        const otherThanNull = this.files.some(function (element: any): boolean {
            return element !== null;
        });
        if (!otherThanNull) {
            this.files = [];
            this.uploadErrorStatus = [];
            this.uploadSuccessStatus = [];
            this.hasError = [];
            this.isSucess = [];
        }
    }
    /**
     * Method to change the step while creating qle
     * @param option : Defines which step needs to be displayed
     */
    changeStep(option: string): void {
        if (this.isNewHire) {
            this.form.controls.eventDate.markAsTouched();
        }
        if (option === "first" && this.form.valid && !this.errorResp) {
            this.productSelected(this.isNewHire ? false : this.specificProducts);
            if (!this.disableAllProducts) {
                this.productSelected(this.isNewHire ? true : this.selectedProductOption);
            }
            this.stepPosition = true;
        } else {
            this.stepPosition = false;
        }
    }
    // Step 2
    /**
     * Method to validate enrollment start date
     * @param control : form control of enrollment start date
     * @returns an object indicating whether the enrollment start date is valid
     */
    validateEnrollStartDate(control: any): any {
        if (control.value === null) {
            return this.incorrectObj;
        }
        if (control.value) {
            this.startDateString = this.dateService.toDate(control.value);
            this.startDateString.setHours(0, 0, 0, 0);
            this.endDateString = this.dateService.toDate(this.endDateString);
            this.endDateString.setHours(0, 0, 0, 0);
            if (this.isNewHire) {
                if (this.checkEnrollmentWindow()) {
                    this.enrollStartDateFlag = true;
                    this.enrollStartDateFlagBeforeCurrent = false;
                    this.enrollStartDateError = `Enrollment window should be ${this.enrollmentWindow} days`;
                    return this.incorrectObj;
                }
                this.enrollEndDateFlag = false;
                this.enrollEndDateFlagAfter = false;
                this.createQLEForm.controls.enrollEndDate.setErrors(null);
            } else if (this.dateService.toDate(this.startDateString) < this.dateService.toDate(this.today)) {
                this.enrollStartDateFlag = false;
                this.enrollStartDateFlagBeforeCurrent = true;
                return this.incorrectObj;
            }
            if (this.dateService.toDate(this.startDateString) > this.dateService.toDate(this.endDateString)) {
                this.enrollStartDateFlag = true;
                this.enrollStartDateFlagBeforeCurrent = false;

                this.enrollStartDateError = this.language.fetchPrimaryLanguageValue("primary.portal.qle.addNewQle.enrollStartDate");
                return this.incorrectObj;
            }
        }
        this.enrollStartDateFlag = false;
        this.enrollStartDateFlagBeforeCurrent = false;
    }
    /**
     * to validate enrollment end date
     * @param control : form control of enrollmentEndDate date-picker
     * @return an object indicating whether the enrollment end date is valid
     */
    validateEnrollEndDate(control: any): any {
        if (control.value === null) {
            return this.incorrectObj;
        }
        if (control.value) {
            this.startDateString = this.dateService.toDate(this.startDateString);
            this.startDateString.setHours(0, 0, 0, 0);
            this.endDateString = this.dateService.toDate(control.value);
            this.endDateString.setHours(0, 0, 0, 0);
            if (this.isNewHire) {
                if (this.checkEnrollmentWindow()) {
                    this.enrollEndDateFlag = true;
                    this.enrollEndDateFlagAfter = false;
                    this.enrollEndDateError = `Enrollment window should be ${this.enrollmentWindow} days`;
                    return this.incorrectObj;
                }
                this.enrollEndDateFlag = false;
                this.enrollEndDateFlagAfter = false;
                this.createQLEForm.controls.enrollEndDate.setErrors(null);
            } else if (control.value > this.enrollmentEndDate) {
                this.enrollEndDateFlagAfter = true;
                this.enrollEndDateFlag = false;
                return this.incorrectObj;
            }
            if (this.endDateString < this.startDateString) {
                this.enrollEndDateFlag = true;
                this.enrollEndDateFlagAfter = false;
                this.enrollEndDateError = this.language.fetchPrimaryLanguageValue("primary.portal.qle.addNewQle.enrollEndDate");
                return this.incorrectObj;
            }
        }
        this.enrollEndDateFlag = false;
        this.enrollEndDateFlagAfter = false;
    }
    checkEnrollmentWindow(): boolean {
        const enrollmentStartDate = this.dateService.toDate(this.createQLEForm.controls.enrollStartDate.value);
        const enrollmentEndDate = this.dateService.toDate(this.createQLEForm.controls.enrollEndDate.value);
        const days = this.dateDiff(enrollmentStartDate, enrollmentEndDate);
        return days > this.enrollmentWindow;
    }

    dateDiff(startDate: Date, endDate: Date): number {
        return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    /**
     * Method to set coverage dates based on aflac/non-aflac option selected
     * @param value : Value of the All Products/ Specific Products
     */
    productSelected(value: string | boolean): void {
        this.productsList = [];
        if (value === this.selectedProductOption || value === true) {
            this.createQLEForm.controls.coverage.setValidators([Validators.required, this.getAllProductsDate()]);
            this.createQLEForm.controls.coverage.updateValueAndValidity();
            if (this.productsListDisplay) {
                this.productsData.forEach((el) => {
                    this.createQLEForm.removeControl(el.product.name);
                });
            }
            this.productsListDisplay = false;
            this.productsList.push({ id: 0, name: this.productListCoverageDate });
            this.setCoverageStartDate(value, this.dateService.toDate(this.form.controls.eventDate.value));
        } else {
            this.productsListDisplay = true;
            if (!this.isNewHire) {
                this.productsData = Array.from(new Set(this.productsData.concat(this.nonAflacProducts)));
            } else {
                this.productsData = this.productsData.filter(
                    (product) => !this.nonAflacProducts.some((nonAflacProduct) => nonAflacProduct.product.id === product.product.id),
                );
            }
            this.productsData.forEach((el) => {
                this.coverageControl = this.fb.control("");
                this.createQLEForm.addControl(el.product.name, this.coverageControl);
                this.createQLEForm.get(el.product.name).setValidators([Validators.required, this.getSpecificProductDate(el.product.id)]);
                this.createQLEForm.get(el.product.name).updateValueAndValidity();
                this.productsList.push({ id: el.product.id, name: el.product.name });
            });
            this.createQLEForm.controls.coverage.clearValidators();
            this.createQLEForm.controls.coverage.updateValueAndValidity();
            this.createQLEForm.controls.coverage.markAsUntouched();
            this.setCoverageStartDate(value, this.dateService.toDate(this.form.controls.eventDate.value));
        }
        this.createQLEForm.controls.productsOptionSelected.setValue(value);
    }
    /**
     * Function used to set the error message when new hire option is selected and selected date is other than 1
     * @param selectedDate: The date that has been selected
     * @returns error message
     */
    setErrorMessageForFirstOfNextMonth(selectedDate: Date): string {
        if (this.coverageStart === this.NEXT_FIRST_OF_MONTH && this.isNewHire && selectedDate.getDate() !== this.firstDateOfMonth) {
            return this.languageString["primary.portal.qle.addNewHireQle.mustBeFirstOfMonth"];
        }
        return null;
    }
    /**
     * used to check if given date is first date of the latest upcoming month and return the date if true
     * @param givenDate: Given Date
     * @returns the given date in number format if the given date is the first date of the latest upcoming month
     */
    enableFirstOfMonth = (givenDate: Date): number => {
        const date = new Date(givenDate || "").getDate();
        return date === this.firstDateOfMonth && this.dateService.checkIsAfter(new Date(givenDate), this.dateService.toDate(this.today))
            ? date
            : undefined;
    };
    /**
     * Function used to enable only dates in between minEventDate and maxEventDate
     * @param givenDate: Given Date
     * @returns true if date is in between minEventDate and maxEventDate else false
     */
    applyDateRange = (givenDate: Date): boolean => {
        const date = new Date(givenDate || "");
        return (
            this.dateService.getIsAfterOrIsEqual(date, this.dateService.toDate(this.minEventDate)) &&
            this.dateService.isBeforeOrIsEqual(date, this.dateService.toDate(this.maxEventDate))
        );
    };
    /**
     * Function used to get the initial date for all the products and does the coverage date validation to set the error messages
     * @returns validation error
     */
    getAllProductsDate(): ValidatorFn {
        return (c: AbstractControl): { [key: string]: boolean } | null => {
            this.allProductsCoverageFlag = false;
            if (!this.isLoading && c.value) {
                this.allProductDateSelected = this.dateService.toDate(c.value);
                this.allProductDateSelected.setHours(0, 0, 0, 0);
                const eventDate = this.dateService.toDate(this.getEventdate);
                eventDate.setHours(0, 0, 0, 0);
                const enrollmentStartDate = this.dateService.toDate(this.createQLEForm.controls.enrollStartDate.value);
                enrollmentStartDate.setHours(0, 0, 0, 0);
                enrollmentStartDate.setDate(enrollmentStartDate.getDate());
                this.allProductsCoverageFlag = true;
                let errorMsg = "";
                errorMsg = this.setErrorMessageForFirstOfNextMonth(this.allProductDateSelected);
                if (errorMsg) {
                    this.allProductsCoverageError = errorMsg;
                    return this.incorrectObj;
                }
                let dateToBeChecked: Date | string =
                    this.dateService.toDate(this.initialPlanOfferingDate) > this.dateService.toDate(enrollmentStartDate)
                        ? this.dateService.toDate(this.initialPlanOfferingDate)
                        : this.dateService.toDate(enrollmentStartDate);
                let pyDate: Date | string;
                let pyEndDate: Date | string;
                const currentDate: Date = this.dateService.toDate(this.today);
                const planYearsBasedOnNewHire: PlanYear[] = this.isNewHire
                    ? this.planYears.filter(
                          (py) =>
                              this.aflacPlanYearIds.find((id) => id === py.id) &&
                              this.dateService.toDate(py.coveragePeriod.effectiveStarting) <= currentDate &&
                              this.dateService.toDate(py.coveragePeriod.expiresAfter) >= currentDate,
                      )
                    : this.planYears;
                if (planYearsBasedOnNewHire.length) {
                    const planYears = planYearsBasedOnNewHire.map((plan) => plan.coveragePeriod.effectiveStarting).sort();
                    const planYearsEndDate = planYearsBasedOnNewHire
                        .map((plan) => plan.coveragePeriod.expiresAfter)
                        .sort()
                        .reverse();
                    pyDate = planYears.find((effectiveStarting) => this.dateService.toDate(effectiveStarting) <= currentDate);
                    pyEndDate = planYearsEndDate.find((expiresAfter) => this.dateService.toDate(expiresAfter) >= currentDate);
                }
                if (this.dateService.toDate(pyDate) > dateToBeChecked) {
                    dateToBeChecked = this.dateService.toDate(pyDate);
                }
                dateToBeChecked.setHours(0, 0, 0, 0);
                if (this.isAflac) {
                    errorMsg = this.coverageDateValidationForAflac(this.allProductDateSelected, eventDate, dateToBeChecked, pyEndDate);
                } else {
                    errorMsg = this.coverageDateValidationForNonAflac(this.allProductDateSelected, eventDate);
                }
                if (errorMsg) {
                    this.allProductsCoverageError = errorMsg;
                    return this.incorrectObj;
                }
                this.allProductsCoverageFlag = false;
            }
            return null;
        };
    }
    /**
     * Method to validate specific product coverage date and check the particular product has plan year
     * Does the coverage date validation for each product to set the error messages
     * @param id: product id
     * @returns validation error
     */
    getSpecificProductDate(id: number): ValidatorFn {
        this.specifiCoverageDateErrors = [];
        return (c: AbstractControl): { [key: string]: boolean } | null => {
            this.specificProductsCoverageFlag = false;
            if (c.value) {
                this.specificProductDateSelected = this.dateService.toDate(c.value);
                const eventDate = this.dateService.toDate(this.datePipe.transform(this.getEventdate, this.dateFormat));
                eventDate.setHours(0, 0, 0, 0);
                const formGroup = c.parent.controls;
                const controlName = Object.keys(formGroup).find((name) => c === formGroup[name]) || null;
                const productId = this.productsData.find((data) => data.product.name === controlName).product.id;
                const coverage = this.specificCoverageEffectiveDates.find((date) => date.productId === productId);
                const specificDate = this.dateService.toDate(coverage.effectiveDate);
                const enrollmentStartDate: Date = this.dateService.toDate(this.createQLEForm.controls.enrollStartDate.value);
                enrollmentStartDate.setDate(enrollmentStartDate.getDate());
                this.specificProductsCoverageFlag = true;
                let errorMsg = "";
                errorMsg = this.setErrorMessageForFirstOfNextMonth(this.specificProductDateSelected);
                if (errorMsg) {
                    this.specifiCoverageDateErrors[controlName] = errorMsg;
                    return this.incorrectObj;
                }
                let dateToBeChecked: Date =
                    this.dateService.toDate(specificDate) > this.dateService.toDate(enrollmentStartDate)
                        ? this.dateService.toDate(specificDate)
                        : this.dateService.toDate(enrollmentStartDate);
                if (this.dateService.toDate(this.getPYDate(productId)) > dateToBeChecked) {
                    dateToBeChecked = this.dateService.toDate(this.getPYDate(productId));
                }
                dateToBeChecked.setHours(0, 0, 0, 0);
                this.productsList = this.productsList.map((product) => {
                    if (product.id === id) {
                        product.qleMaxDate = this.dateService.addDays(new Date(), this.qleMaxDays);
                        product.qleMinDate = this.dateService.toDate(dateToBeChecked);
                    }
                    return product;
                });
                if (this.isAflac) {
                    errorMsg = this.coverageDateValidationForAflac(
                        this.specificProductDateSelected,
                        eventDate,
                        dateToBeChecked,
                        this.getPYEndDate(productId),
                    );
                } else {
                    errorMsg = this.coverageDateValidationForNonAflac(this.specificProductDateSelected, eventDate);
                }
                if (errorMsg) {
                    this.specifiCoverageDateErrors[controlName] = errorMsg;
                    return this.incorrectObj;
                }
                this.specificProductsCoverageFlag = false;
                this.setSpecificCoverageDate(id);
                return null;
            }
            return null;
        };
    }
    /**
     * Method to set specific coverage date
     * @param id : product id to set coverage date
     */
    setSpecificCoverageDate(id: number): void {
        const index: number = this.specificCoverageDates.findIndex((item) => item.productId === id);
        if (index < 0) {
            this.specificCoverageDates.push({
                productId: id,
                date: this.datePipe.transform(this.specificProductDateSelected, AppSettings.DATE_FORMAT_YYYY_MM_DD),
            });
        } else {
            this.specificCoverageDates.splice(index, 1);
            this.specificCoverageDates.push({
                productId: id,
                date: this.datePipe.transform(this.specificProductDateSelected, AppSettings.DATE_FORMAT_YYYY_MM_DD),
            });
        }
        this.specificCoverageDates.sort((a, b) => (a.productId > b.productId ? 1 : -1));
    }
    /**
     * Method to validate coverage date for aflac partner
     * @param enteredCoverageDate: Entered coverage date
     * @param eventDate: QLE event date
     * @param dateToBeChecked: Date needs to be checked
     * @param pyEndDate: Plan Year end date
     * @returns Error message
     */
    coverageDateValidationForAflac(
        enteredCoverageDate: Date | string,
        eventDate: Date,
        dateToBeChecked: Date,
        pyEndDate?: string | Date,
    ): string {
        let errorMsg: string;
        const notAllowedCoverageDates = this.dateService.toDate(enteredCoverageDate).getDate();
        const enrollmentStartDate: Date = this.dateService.toDate(this.createQLEForm.controls.enrollStartDate.value);
        this.qleMaxDate = this.dateService.addDays(new Date(), this.qleMaxDays);
        this.qleMinDate = this.dateService.toDate(dateToBeChecked);
        enrollmentStartDate.setHours(0, 0, 0, 0);
        enrollmentStartDate.setDate(enrollmentStartDate.getDate() + 1);
        if (
            this.dateService.toDate(enteredCoverageDate) < this.dateService.toDate(dateToBeChecked) &&
            this.dateService.toDate(dateToBeChecked) > this.dateService.toDate(enrollmentStartDate)
        ) {
            errorMsg = this.isNewHire
                ? this.languageString["primary.portal.member.qle.validationErrorMustBeAfterPlanOfferingEffectiveDate"].replace(
                      "##effectiveDate##",
                      this.datePipe.transform(this.dateService.toDate(dateToBeChecked), AppSettings.DATE_FORMAT_MM_DD_YYYY),
                  )
                : this.languageString["primary.portal.member.qle.dateCannotBeBefore"].replace(
                      "#days",
                      this.datePipe.transform(this.dateService.toDate(dateToBeChecked), AppSettings.DATE_FORMAT_MM_DD_YYYY),
                  );
        } else if (this.dateService.toDate(enteredCoverageDate) < this.dateService.toDate(dateToBeChecked)) {
            errorMsg = this.languageString["primary.portal.qle.addNewQle.nextDayDate"];
        } else if (
            this.dateService.toDate(enteredCoverageDate) < this.dateService.toDate(eventDate) &&
            this.dateService.toDate(eventDate) < this.dateService.toDate(this.today)
        ) {
            errorMsg = this.isNewHire
                ? this.languageString["primary.portal.qle.addNewQle.dateCannotBeBeforeHireDate"]
                : this.languageString["primary.portal.member.qle.validationErrorCannotBePast"];
        } else if (this.dateService.toDate(enteredCoverageDate) > this.qleMaxDate) {
            errorMsg = this.languageString["primary.portal.qle.addNewQle.dateCantBeMoreInFuture"].replace(DAYS, String(this.qleMaxDays));
        } else if (this.isNewHire && this.daysAfterCoverageStartRef !== this.zeroConstant) {
            const daysAfterCoverageDate: Date = this.dateService.toDate(eventDate.getDate() + this.daysAfterCoverageStartRef);
            const newHireNotAllowedDate = this.dateService.toDate(enteredCoverageDate).getDate();
            daysAfterCoverageDate.setHours(0, 0, 0, 0);
            if (this.dateService.toDate(enteredCoverageDate) < this.dateService.toDate(daysAfterCoverageDate)) {
                errorMsg = this.languageString["primary.portal.qle.addNewQle.dateMustBeAfterEventDate"].replace(
                    "##days##",
                    String(this.daysAfterCoverageStartRef),
                );
            }
            if (DateInfo.LAST_DATES_OF_MONTH.includes(newHireNotAllowedDate)) {
                errorMsg = this.languageString["primary.portal.coverage.notAllowedDate"].replace(
                    "##enteredDate##",
                    this.dateService.format(this.dateService.toDate(enteredCoverageDate), DateFormats.MONTH_DAY_YEAR),
                );
            }
        } else if (DateInfo.LAST_DATES_OF_MONTH.includes(notAllowedCoverageDates)) {
            errorMsg = this.languageString["primary.portal.coverage.notAllowedDate"].replace(
                "##enteredDate##",
                this.dateService.format(this.dateService.toDate(enteredCoverageDate), DateFormats.MONTH_DAY_YEAR),
            );
        }
        return errorMsg;
    }
    /**
     * Method to validate coverage date for non-aflac partner
     * @param enteredCoverageDate Entered coverage date
     * @param eventDate Life event date
     * @returns Error message string
     */
    coverageDateValidationForNonAflac(enteredCoverageDate: Date, eventDate: Date): string {
        let errorMsg: string;
        const notAllowedCoverageDates = enteredCoverageDate.getDate();
        if (
            !this.dateService.isEqual(this.dateService.toDate(enteredCoverageDate), this.dateService.toDate(eventDate)) &&
            this.matchEventDate.toLowerCase() === TRUE
        ) {
            errorMsg = this.language.fetchPrimaryLanguageValue("primary.portal.member.qle.validationErrorMustMatchEventDate");
        } else if (this.matchEventDate.toLowerCase() === FALSE) {
            if (
                this.startCoverageDateAfter === this.zeroConstant &&
                this.dateService.toDate(enteredCoverageDate) < this.dateService.toDate(eventDate)
            ) {
                errorMsg = this.language.fetchPrimaryLanguageValue("primary.portal.member.qle.validationErrorMustBeAfterEventDate");
            } else if (this.startCoverageDateAfter !== this.zeroConstant) {
                const startCoverageDateAfterDate: Date = new Date();
                startCoverageDateAfterDate.setDate(this.getEventdate.getDate() + this.startCoverageDateAfter);
                startCoverageDateAfterDate.setHours(0, 0, 0, 0);
                if (this.dateService.toDate(enteredCoverageDate) < this.dateService.toDate(startCoverageDateAfterDate)) {
                    errorMsg = this.language
                        .fetchPrimaryLanguageValue("primary.portal.qle.addNewQle.coverageStartRequirements")
                        .replace("#days", this.startCoverageDateAfter.toString());
                }
            } else if (DateInfo.LAST_DATES_OF_MONTH.includes(notAllowedCoverageDates)) {
                errorMsg = this.languageString["primary.portal.coverage.notAllowedDate"].replace(
                    "##enteredDate##",
                    this.dateService.format(this.dateService.toDate(enteredCoverageDate), DateFormats.MONTH_DAY_YEAR),
                );
            }
        }
        return errorMsg;
    }

    /**
     * Method to add QLE
     */
    addQLE(): void {
        if (this.files.length) {
            this.files = this.files.filter((file) => file && file.status !== FileUploadMessage.VIRUS_SCAN_FAILED);
        }
        if (
            (this.isNewHire && this.createQLEForm.controls.productsOptionSelected.value) ||
            (!this.isNewHire && this.createQLEForm.controls.productsOptionSelected.value === this.selectedProductOption)
        ) {
            this.createQLEForm.controls.coverage.updateValueAndValidity();
        } else {
            this.productsList.forEach((product) => {
                this.createQLEForm.controls[product.name].updateValueAndValidity();
            });
        }
        if (this.createQLEForm.invalid) {
            return;
        }
        if (
            (this.isNewHire && this.createQLEForm.controls.productsOptionSelected.value) ||
            (!this.isNewHire && this.createQLEForm.controls.productsOptionSelected.value === this.selectedProductOption)
        ) {
            this.specificCoverageDates = [];
            const products = this.isNewHire ? this.aflacProducts : this.productsData;
            products.forEach((el) => {
                this.specificCoverageDates.push({
                    productId: el.product.id,
                    date: this.datePipe.transform(this.allProductDateSelected, AppSettings.DATE_FORMAT_YYYY_MM_DD),
                });
            });
        }
        if (this.isNewHire && this.nonAflacProducts.length) {
            this.specificCoverageDates = this.specificCoverageDates.filter(
                (specific) => !this.nonAflacProducts.some((nonAflac) => nonAflac.product.id === specific.productId),
            );
        }
        if (this.getPortal !== Portals.MEMBER) {
            const documentIds = this.files.map((doc) => doc.documentId);
            this.QLEBody = {
                typeId: this.typeId,
                eventDate: this.datePipe.transform(this.dateService.toDate(this.form.controls.eventDate.value), this.dateFormat),
                enrollmentValidity: {
                    effectiveStarting: this.datePipe.transform(this.startDateString, AppSettings.DATE_FORMAT_YYYY_MM_DD),
                    expiresAfter: this.datePipe.transform(this.endDateString, AppSettings.DATE_FORMAT_YYYY_MM_DD),
                },
                coverageStartDates: this.specificCoverageDates,
                adminComment: this.form.controls.notes.value,
                memberComment: this.form.controls.employeeComment.value,
                status: StatusType.APPROVED,
                documentIds: documentIds,
            };
        }

        if (this.isQleAdded) {
            this.isQleAdded = false;
            this.memberService
                .createMemberQualifyingEvent(this.MemberInfo.id, this.mpGroupId, this.QLEBody)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap(() => {
                        this.dialogRef.close();
                        this.memberService.updateQLEList(true);
                        return this.dualPlanYearService.dualPlanYear(this.MemberInfo.id, this.mpGroupId);
                    }),
                    catchError((error) => {
                        this.error = true;
                        if (
                            error.status === ClientErrorResponseCode.RESP_400 &&
                            error.headers.get(PRODUCT_COVERAGE_ERROR) &&
                            error.headers.get(PRODUCT_COVERAGE_ERROR).length
                        ) {
                            this.errorMessage = this.language.fetchPrimaryLanguageValue(
                                "primary.portal.qle.addNewQle.badParameterPlanDates",
                            );
                        } else if (error.status === ClientErrorResponseCode.RESP_400) {
                            this.errorMessage = this.language.fetchPrimaryLanguageValue("primary.portal.qle.addNewQle.badParameter");
                        } else if (error.status === ClientErrorResponseCode.RESP_409) {
                            this.errorMessage = this.language.fetchPrimaryLanguageValue("primary.portal.qle.addNewQle.duplicate");
                        }
                        return of(error);
                    }),
                    finalize(() => {
                        this.isQleAdded = true;
                    }),
                )
                .subscribe();
        }
    }

    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, "00/00/0000");
    }
    /**
     * Method to get new hire rules for an employee
     */
    getNewHireRules(): void {
        this.aflacService
            .getNewHireRules()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((rules) => {
                this.newHireRules = [...rules];
                this.newHireRules.forEach((rule) => {
                    if (rule.type === this.NEW_HIRE) {
                        rule.actions.forEach((action) => {
                            if (action.code === this.CREATE_QLE) {
                                this.checkNewHireRules(action);
                            }
                        });
                        rule.conditions.forEach((condition) => {
                            if (condition.code === "EVENT_DATE") {
                                const dayAddedAttribute: Attribute = condition.attributes.find(
                                    (attribute) => attribute.name === "days_added",
                                );
                                this.daysAdded = dayAddedAttribute ? +dayAddedAttribute.value : 0;
                            }
                        });
                    }
                });
            });
    }
    checkNewHireRules(action: Actions): void {
        action.attributes.forEach((attribute) => {
            if (attribute.name === this.enrollmentWindowLengthText) {
                this.enrollmentWindow = +attribute.value;
            } else if (attribute.name === this.coverageStartReferenceText) {
                this.coverageStartReference = attribute.value;
            } else if (attribute.name === this.daysAfterCoverageStartReferenceText) {
                this.daysAfterCoverageStartRef = +attribute.value;
            } else if (attribute.name === this.coverageStartText) {
                this.coverageStart = attribute.value;
            }
        });
    }
    /**
     * Redirects to Rules
     * @return Returns void
     */
    goToRules(): void {
        this.dialogRef.close();
        this.router.navigate([`${this.routeAfterLogin}/payroll/${this.mpGroupId}/dashboard/profile/rules`]);
    }
    /**
     * Function used to set the the first date of the next month if the entered date falls under last dates of the month(29, 30, 31)
     * @param coverageStartDate: Coverage Start Date
     * @returns coverage date which is set to first of the month
     */
    setToFirstOfMonth(coverageStartDate: Date): Date {
        let coverageDate: Date;
        const notAllowedDates = coverageStartDate.getDate();
        if (DateInfo.LAST_DATES_OF_MONTH.includes(notAllowedDates)) {
            coverageDate = new Date(coverageStartDate.getFullYear(), coverageStartDate.getMonth() + 1, 1);
        } else {
            coverageDate = coverageStartDate;
        }
        return coverageDate;
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
