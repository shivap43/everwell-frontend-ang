import { Component, OnInit, ViewChild, Inject, AfterContentChecked, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl, NgForm, ValidationErrors } from "@angular/forms";
import { Store } from "@ngxs/store";
import { BenefitsOfferingService, Carrier, CoveragePeriod, coverageStartFunction, CoverageStartDate, AccountService } from "@empowered/api";

import {
    BenefitsOfferingState,
    CoveragePeriodPanel,
    MapPlanChoicesToPlans,
    MapPlanChoicesToNewPlanYearPanel,
    ExceptionBusinessService,
    StaticUtilService,
    UtilService,
    SetNewPlanYearValue,
} from "@empowered/ngxs-store";
import { DatePipe } from "@angular/common";
import { MonDialogComponent } from "@empowered/ui";
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import {
    DateFormats,
    ProductId,
    CarrierId,
    Permission,
    DateInfo,
    ConfigName,
    PlanPanelModel,
    PanelModel,
    AppSettings,
    Exceptions,
    PlanChoice,
    PlanYearOption,
    PlanYearType,
    PolicyOwnershipType,
    EnrollmentPeriod,
    PlanYear,
    ContiguousDates,
} from "@empowered/constants";
import { forkJoin, Subscription, of, Observable, Subject, combineLatest, EMPTY } from "rxjs";
import { ProductsPlansQuasiService } from "../services/products-plans-quasi.service";
import { CoverageDateApprovalComponent } from "../../../coverage-date-approval/coverage-date-approval.component";
import { MatRadioChange } from "@angular/material/radio";
import { MatSelectChange } from "@angular/material/select";
import { catchError, takeUntil, filter, tap, map, switchMap, finalize } from "rxjs/operators";
import { BenefitOfferingHelperService } from "../../../benefit-offering-helper.service";
import { HttpResponse } from "@angular/common/http";
import { DateService } from "@empowered/date";
import { AccountsBusinessService, SharedService, EmpoweredModalService } from "@empowered/common-services";

const THREE_MONTHS = 3;
const ONE_DAY_YEAR = 1;
const STEP_NUMBER_THREE = 3;
const FIFTEEN_DAYS = 15;
const SIX_MONTHS = 6;
const FUTURE_MONTH_CAFE = 3;
const FUTURE_MONTH_NON_CAFETERIA = 6;
const DAY_DIFF_AFLAC = 1;
const DAY_DIFF_NON_AFLAC = 15;
const DAY_DIFF_NON_AFLAC_ADV = 7;
const ADD_PRODUCTS_CONSTANT = "products";
const EXISTING_PY_RADIO_VALUE = "1";
const NEW_PY_RADIO_VALUE = "2";
const ID_FIELD = "id";
const NAME = "name";
const PLANS = "plans";
const UNAPPROVED_PLAN_YEAR_INDEX = 0;
const COVERAGE_PERIOD_FORM_VAR = "coveragePeriod";
const EFFECTIVE_STARTING_VAR = "effectiveStarting";
const COVERAGE_START_DATE = "coverage_start_date";
const PLAN_YEAR_START_DATE = "plan_year_start_date";
const PLAN_YEAR_END_DATE = "plan_year_end_date";
const VARIABLE = "VAR";
const PRETAX = "PRETAX";
const POST_TAX = "POSTTAX";
const EXPIRES_AFTER = "expiresAfter";
const EFFECTIVE_STARTING = "effectiveStarting";
const MILLISECONDS = 1000;
const SECONDS = 60;
const NO_OF_DAYS_IN_SIX_MONTHS = 180;
const HOURS_PER_DAY = 24;
const SINGLE_PLAN_CARRIERS = "SINGLE_PLAN_CARRIERS";
// on submission navigate to carrier form step
const CARRIER_FORM_STEP = 5;
const COVERAGE_DATES_NON_AFLAC_FORM_VAR = "coverageDateGroupForNonAflac";
const FIRST_DATE_OF_MONTH_ONE_DAY = 1;
const ONE_YEAR = 1;
const MINUTES_IN_HOUR = 60;
const MANAGE_PLAN_CHOICE = "new_plan";
const CURRENT_PLAN = "current_plan";
const IS_ELIGIBLE = "true";
const SAME_AFLAC_INDIVIDUAL_PLAN_DATE = "sameAflacIndividualPlanDate";
const CREATE_PLAN_YEAR_FORM = "2";
const EARLIEST_COVERAGE_DATE = 0;
const EXISTING_PLAN_YEAR = "1";
interface CarrierMap {
    carrier: string;
    ids: string[];
}

@Component({
    selector: "empowered-coverage-date-quasi",
    templateUrl: "./coverage-date-quasi.component.html",
    styleUrls: ["./coverage-date-quasi.component.scss"],
})
export class CoverageDateQuasiComponent implements OnInit, OnDestroy, AfterContentChecked {
    subscriptions: Subscription[] = [];
    @ViewChild("createPlanYear", { static: true }) createPlanYearModal;
    @ViewChild("formDirective") private formDirective: NgForm;
    planYearform: FormGroup;
    enrollmentDateGroup: FormGroup;
    coverageDateGroup: FormGroup;
    panelProducts: PanelModel[];
    planYearOptionsForm: FormGroup;
    nonAflacPlanYearOptionsForm: FormGroup;
    sameAflacPlanYearFlag = false;
    planYearOptions: PlanYearOption[] = [];
    samePlanYear = false;
    dropDownForNextMonth: number;
    nonAflacPlanYearMapped: boolean;
    planYearUserChoice: string;
    carrierExceptions: CarrierMap[];
    carrierMaps: CarrierMap[] = [];
    isCoverageDatesContiguous: ContiguousDates;
    PRPlanChoicesToBeUpdated: PlanChoice[] = [];
    nonAflacPlanYearOptions: PlanYearOption[] = [];
    continuousPlanChoicesToBeUpdated: PlanChoice[] = [];
    nonAflacPlanChoicesToBeUpdated: PlanChoice[] = [];
    carriers: Carrier[] = [];
    isAflacGroup$: Observable<boolean> = this.accountsBusinessService.checkForCafeteriaEligibility();
    coveragePeriodPRPlansPanelList: CoveragePeriodPanel[] = [];
    coveragePeriodContinuousPlansPanelList: CoveragePeriodPanel[] = [];
    coveragePeriodNonAflacPlanList: CoveragePeriodPanel[] = [];
    variableTaxStatusPlan: PlanPanelModel[] = [];
    planYearId: number;
    coverageStartDate: string;
    dateArrayForNonAflac: string[] = [];
    createdNonAflacPlanYearValue: string;
    nonAflacPlanYearId: number;
    nonAflacPlanDatesToCompare: number;
    error = false;
    sameNonAflacPlanYearFlag = false;
    mpGroup: number;
    isAflacIndividualCafeteriaVasOnly = false;
    isDatePickerDisabled = false;
    multiNonAflacYear = false;
    dialogOpen = false;
    dialogError = false;
    coverageStartDateOptions = [];
    continuousPlanform: FormGroup;
    continuousPlanDatesForm: FormGroup;
    nonAflacPlan: FormGroup;
    nonAflacPlanForm: FormGroup;
    enrollmentDateGroupForNonAflac: FormGroup;
    coverageDateGroupForNonAflac: FormGroup;
    continuousPlan: FormGroup;
    coverageDatesForm: FormGroup;
    createdPlanYearValue;
    fieldErrorMessage: string;
    createPlanYearForm: FormGroup;
    selectedPlanYearForm: FormGroup;
    samePlanYearflag = false;
    isContiguousDates = false;
    isContiguousDatesForNonAflac = false;
    cafeteriaStartDate: string;
    cafeteriaEndDate: string;
    planYearIdToCompare = null;
    nonAflacPlanYearToPopulate: PlanYear;
    allPlanYears: PlanYear[] = [];
    continuousPlanDatesToCompare;
    sameContinuousPlanDatesflag = false;
    controlToReset = "";
    planYearToPopulate: any;
    showContinuousCoverageStartDate = true;
    coverageDatesCompleted = true;
    approvedPlanYears: PlanYear[] = [];
    unapprovedPlanYears: PlanYear[] = [];
    earliestPlanYear: PlanYear;
    defaultPlanYear: number;
    FIRST_PLAN_YEAR_INDEX = 0;
    PLAN_YEAR_LENGTH = 1;
    planCounter = 0;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.benefitsOffering.planYear",
        "primary.portal.benefitsOffering.coverageDate.confirmMarketingApproval.title",
        "primary.portal.benefitsOffering.coverageDate.confirmMarketingApproval.content",
        "primary.portal.benefitsOffering.coverageDate.confirmMarketingApproval.approvalReceived",
        "primary.portal.benefitsOffering.enrollmentStartDate",
        "primary.portal.benefitsOffering.coverageStartDate",
        "primary.portal.benefitsOffering.selectPlanYear",
        "primary.portal.benefitsOffering.plansSubTitlePlans",
        "primary.portal.benefitsOffering.createNewPlanYear",
        "primary.portal.benefitsOffering.planYearRestrictedPlans",
        "primary.portal.benefitsOffering.continuousPlans",
        "primary.portal.benefitsOffering.planYearName",
        "primary.portal.benefitsOffering.enrollmentDates",
        "primary.portal.benefitsOffering.giEnrollmentDates",
        "primary.portal.benefitsOffering.coverageDates",
        "primary.portal.common.startDate",
        "primary.portal.common.endDate",
        "primary.portal.common.back",
        "primary.portal.common.next",
        "primary.portal.common.cancel",
        "primary.portal.common.save",
        "primary.portal.common.close",
        "primary.portal.common.invalidDateFormat",
        "primary.portal.benefitsOffering.preTaxBenefit",
        "primary.portal.benefitsOffering.postTaxBenefit",
        "primary.portal.benefitsOffering.singleContinuousPlansEnroll",
        "primary.portal.benefitsOffering.singlePlanYear",
        "primary.portal.benefitsOffering.hqSubtitle1Plan",
        "primary.portal.coverage.cannotBePast",
        "primary.portal.benefitsOffering.plansSubTitlePlans",
        "primary.portal.maintenanceOfBenefitOffering.coverageDateQuasi.useExisting",
        "primary.portal.benefitsOffering.availability.header",
        "primary.portal.benefitsOffering.nonPlan",
        "primary.portal.benefitsOffering.partner",
        "primary.portal.benefitsOffering.enroll",
        "primary.portal.benefitsOffering.checkbox",
        "primary.portal.benefitsOffering.apply",
        "primary.portal.benefitsOffering.planName",
        "primary.portal.benefitsOffering.planExample",
        "primary.portal.common.dateHint",
        "primary.portal.common.cancel",
        "primary.portal.benefitsOffering.earliestCoverageStart",
        "primary.portal.coverage.cannotBeBeforeEnrollmentStartDate",
        "primary.portal.benefitsOffering.earliestCoverageStartInfo",
        "primary.portal.benefitsOffering.preTaxAndPostTax",
        "primary.portal.benefitsOffering.posttaxCoverageStartDate",
        "primary.portal.benefitsOffering.enroll",
        "primary.portal.benefitsOffering.aflacDates",
        "primary.portal.benefitsOffering.cafeteriaDatesInfo",
        "primary.portal.benefitsOffering.aflacPostTaxNote",
        "primary.portal.benefitsOffering.coverageStartRule",
        "primary.portal.maintenanceBenefitsOffering.products.vasExceptionActive",
        "primary.portal.maintenanceBenefitsOffering.products.coverageDateOverlap",
        "primary.portal.benefitsOffering.tpi.enrollmentDates.match",
        "primary.portal.benefitsOffering.tpi.coverageDates.match",
        "primary.portal.benefitsOffering.tpi.sameIndividualDates.disableInfo",
        "primary.portal.coverage.notAllowedDate",
        "primary.portal.benefitsOffering.giEnrollmentDatesInfo",
        "primary.portal.common.requiredField",
    ]);
    isLoading = false;
    planYearChoice: boolean;
    dialog: any;
    planYearDetail: PlanYear;
    effectiveStartingTransformDate: string;
    contiguousValue: boolean;
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    effectiveDate: string;
    planYearEffectiveDate: string;
    minDate;
    coverageMinDate: Date;
    coverageMaxDate: Date;
    timezoneReplaceConstant = /\b0/g;
    approvalModelOpen = false;
    approveReceived = false;
    alertDialogRef: MatDialogRef<MonDialogComponent>;
    scrollInToMonAlertFlag = false;
    multiPlanYear = false;
    multiContinuousYear = false;
    languageSecondStringsArray: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.benefitsOffering.samePlanYear",
        "secondary.portal.benefitsOffering.setting.employeesRequired",
        "secondary.portal.benefitsOffering.coveragedates.invalidDate",
        "secondary.portal.benefitsOffering.samePlanYearContinuous",
        "secondary.portal.benefitsOffering.coveragedates.firstDateOfMonth",
        "secondary.portal.benefitsOffering.coveragedates.threeMonths",
        "secondary.portal.benefitsOffering.addPlanYear.badParameter.minimum.days",
        "secondary.portal.benefitsOffering.coveragedates.maxEndDate",
        "secondary.portal.benefitsOffering.coveragedates.dateBeforeEnrollmentDate",
        "secondary.portal.benefitsOffering.coveragedates.sixMonths",
        "secondary.portal.benefitsOffering.coveragedates.fifteenDaysAfterEnrollmentEndDate",
        "secondary.portal.benefitsOffering.coveragedates.sevenDaysAfterEnrollmentEndDate",
        "secondary.portal.benefitsOffering.coveragedates.fieldValidationError",
        "secondary.portal.benefitsOffering.duplicatePlanYear",
        "secondary.portal.benefitsOffering.coveragedates.invalidenddate",
        "secondary.portal.benefitsOffering.coveragedates.infoMessage",
        "secondary.portal.benefitsOffering.setting.employeesRequired",
        "secondary.portal.benefitsOffering.coverageDate.cannotBeBeforeStartDate",
        "secondary.portal.benefitsOffering.coveragedates.invalidStartDate",
        "secondary.portal.benefitsOffering.coveragePeriod.overlapping.plans",
        "secondary.portal.benefitsOffering.coveragePeriod.overlapping.ADVplans",
        "secondary.portal.benefitsOffering.coveragedates.endDate.overlapping",
        "secondary.portal.benefitsOffering.coveragedates.fifteenDaysValidation",
        "secondary.portal.benefitsOffering.coveragedates.planYearNameValidation",
        "secondary.portal.benefitsOffering.coveragedates.coverageDate.sixMonths",
    ]);
    readonly currentDate = new Date();
    enableCoverageEndDate = false;
    enableEndDateControl = false;
    maxCoverageStartDate: Date;
    maxCoverageEndDate: Date;
    maxLength: number = AppSettings.CALENDAR_MAX_LEN;
    controlEndDateName = "coverageEndDate";
    enrollmentDifferenceInDays = DAY_DIFF_NON_AFLAC;
    enrollmentDifferenceInDaysForModal = DAY_DIFF_NON_AFLAC;
    isRole20User = false;
    dateArray: string[] = [];
    dateUpdatedMessage = false;
    minimumDayErrorMessage = "";
    nonAflacMinimumDayErrorMessage = "";
    minimumDayErrorModalMessage = "";
    minDateCoverage: Date;
    isCoverageDateError = false;
    contiguousSelection: ContiguousDates;
    queryString = "input.ng-invalid,mat-datepicker.ng-invalid";
    existingPlanYears: PlanYear[] = [];
    radioEvent: string;
    minDateCoverageNonAflac: Date;
    isNonAflacIndividualCafeteriaVasOnly = false;
    isVasPlan = false;
    readonly COPY_NEW_PLAN_YEAR_CONSTANT = "copyNewPlanYear";
    readonly carrierIds = CarrierId;
    private readonly unsubscribe$: Subject<void> = new Subject();
    exceptions: Exceptions[] = [];
    isTPPAccount = false;
    isThirdPartyCafeteriaAccount = false;
    earliestCoverageStartDateInfoMsg: string;
    isPreTaxAflac = false;
    enteredDate: string;
    dateClass = this.sharedService.dateClass;
    onlyADVGroupPlansPresent = false;
    backClicked = true;
    isArgusProduct = false;
    isQ60 = false;
    isGIEnrollmentDatesOn: boolean;
    giEnrollEndDateDisable: boolean;
    giMinDiffDate: Date;
    giMaxDiffDate: Date;
    enableGIEligibleDateMessage$: Observable<boolean>;
    isVspAloneInPostTax: boolean;
    coverageStartDateOptionsForVariableTaxPlans = [];
    constructor(
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly quasiService: ProductsPlansQuasiService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly datepipe: DatePipe,
        private readonly matDialog: MatDialog,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly staticUtilService: StaticUtilService,
        private readonly accountService: AccountService,
        private readonly accountsBusinessService: AccountsBusinessService,
        private readonly benefitsOfferingHelperService: BenefitOfferingHelperService,
        private readonly exceptionBusinessService: ExceptionBusinessService,
        private readonly sharedService: SharedService,
        private readonly dateService: DateService,
    ) {
        this.fetchAccountTPPStatus();
    }
    /**
     * This method is used to filter the dates in the date-picker
     * @param date is each date in the date-picker
     */
    firstDateFilter(date: Date): boolean {
        const day = this.dateService.toDate(date).getDate();
        return day === 1;
    }
    /**
     * check permission and set form data
     * @returns void
     */
    ngOnInit(): void {
        this.isLoading = true;

        this.isArgusProduct =
            !!this.data.productInformation && [CarrierId.ADV, CarrierId.ARGUS].includes(this.data.productInformation.carrierId);

        this.benefitsOfferingService.setCoverageContiguousDates(null);
        // The below function is added to check whether the logged in user has permission to update-plan-year
        this.subscriptions.push(
            this.staticUtilService.hasPermission(Permission.UPDATE_PLAN_COVERAGE_DATE).subscribe((res) => {
                this.isRole20User = res;
            }),
        );
        this.minDate = new Date();
        this.coverageMinDate = new Date();
        this.coverageMaxDate = new Date();
        // The below lines are code is used to set the maxCoverageStartDate
        this.minDateCoverage = new Date();
        const threeMonthsFromToday = new Date();
        threeMonthsFromToday.setMonth(threeMonthsFromToday.getMonth() + THREE_MONTHS);
        threeMonthsFromToday.setDate(threeMonthsFromToday.getDate() - ONE_DAY_YEAR);
        this.maxCoverageStartDate = this.dateService.toDate(threeMonthsFromToday);
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.planYearChoice = this.store.selectSnapshot(BenefitsOfferingState.GetNewPlanYearChoice);
        this.planYearUserChoice = this.store.selectSnapshot(BenefitsOfferingState.GetManagePlanYearChoice);
        if (this.planYearChoice) {
            this.planYearDetail = this.store.selectSnapshot(BenefitsOfferingState.GetPlanYearDetail);
        }
        if (this.mpGroup) {
            this.quasiService.stepClicked$.next(STEP_NUMBER_THREE);
            this.coverageDatesForm = this.fb.group({});
            this.planYearform = this.fb.group({
                samePlanYear: [true],
                existingPlanYear: ["1"],
                existingPlanYearValue: [],
            });
            this.continuousPlanform = this.fb.group({
                sameCoveragePlanDate: [true],
            });
            this.continuousPlan = this.fb.group({
                enrollmentStartDate: ["", [Validators.required, this.checkContinuousEnrollmentDate.bind(this)]],
                earliestCoverageStart: ["", [Validators.required, this.checkEarliestCoverageStartDate.bind(this)]],
                coverageStartFunction: ["", Validators.required],
            });
            this.nonAflacPlanForm = this.fb.group({
                sameCoveragePlanDate: [false],
                sameAflacIndividualPlanDate: [true],
            });
            this.nonAflacPlan = this.fb.group({
                name: ["", Validators.required],
            });
            this.createPlanYearForm = this.fb.group({
                name: ["", Validators.required],
            });

            this.enrollmentDateGroup = this.fb.group({
                effectiveStarting: ["", [Validators.required, this.checkDate.bind(this), this.checkEnrollmentStartDate.bind(this)]],
                expiresAfter: ["", [Validators.required, this.checkDate.bind(this), this.checkEnrollemtEndDate.bind(this)]],
                guaranteedIssueEffectiveStarting: [{ disabled: true, value: "" }],
                guaranteedIssueExpiresAfter: ["", [Validators.required, this.checkDate.bind(this), this.checkGIEnrollmentDate.bind(this)]],
            });
            this.coverageDateGroup = this.fb.group({
                effectiveStarting: [
                    "",
                    [
                        Validators.required,
                        this.planYearChoice ? this.checkContiguousDate.bind(this) : this.checkDate.bind(this),
                        this.checkCoverageStartDate.bind(this),
                    ],
                ],
                expiresAfter: [
                    { disabled: !this.isRole20User, value: "" },
                    [Validators.required, this.checkDate.bind(this), this.checkCoverageEndDate.bind(this)],
                ],
            });
            this.continuousPlanDatesForm = this.fb.group({});
            this.continuousPlanform.addControl("continuousPlanDates", this.continuousPlan);
            this.nonAflacPlanForm.addControl("nonAflacPlanDates", this.nonAflacPlan);
            this.createPlanYearForm.addControl("coveragePeriod", this.coverageDateGroup);
            this.createPlanYearForm.addControl("enrollmentPeriod", this.enrollmentDateGroup);
            this.planYearform.addControl("createPlanYearForm", this.createPlanYearForm);
            // TODO : get options from language table
            this.coverageStartDateOptions = this.coverageStartDateOptionsForVariableTaxPlans = [
                {
                    value: coverageStartFunction.DAY_AFTER,
                    viewValue: "primary.portal.benefitsOffering.continuousPlans.ContinuousStartDate.DAY_AFTER",
                },
                {
                    value: coverageStartFunction.NEXT_FIRST_OF_MONTHNEXT_FIRST_OF_MONTH,
                    viewValue: "primary.portal.benefitsOffering.continuousPlans.ContinuousStartDate.NEXT_FIRST_OF_MONTHNEXT_FIRST_OF_MONTH",
                },
                {
                    value: coverageStartFunction.NEXT_FIRST_OR_FIFTEENTH_OF_MONTH,
                    viewValue: "primary.portal.benefitsOffering.continuousPlans.ContinuousStartDate.NEXT_FIRST_OR_FIFTEENTH_OF_MONTH",
                },
            ];
            this.planYearOptionsForm = this.fb.group({});
            this.nonAflacPlanYearOptionsForm = this.fb.group({});
            if (this.planYearChoice === null && this.data.opensFrom !== "plans") {
                this.panelProducts = this.store
                    .selectSnapshot(BenefitsOfferingState.GetUnapprovedPanel)
                    .filter((pannel) => pannel.productChoice != null);
            } else {
                this.panelProducts = this.store
                    .selectSnapshot(BenefitsOfferingState.GetNewPlanYearPanel)
                    .filter((pannel) => pannel.productChoice != null);
            }
            this.carriers = this.store.selectSnapshot(BenefitsOfferingState.getAllCarriers);
            this.panelProducts.forEach((productPannelItem) => {
                productPannelItem.carrier.forEach((specificCarrier) => {
                    const carrierSpecificPRPlans = productPannelItem.plans.filter(
                        (plan) =>
                            plan.planChoice != null &&
                            plan.plan.carrierId === specificCarrier.id &&
                            plan.plan.carrierId === CarrierId.AFLAC &&
                            ((plan.planChoice.continuous === false && plan.planChoice.taxStatus === PRETAX) ||
                                plan.plan.policyOwnershipType === PolicyOwnershipType.GROUP),
                    );
                    if (carrierSpecificPRPlans.length !== 0) {
                        this.coveragePeriodPRPlansPanelList.push({
                            carrier: specificCarrier,
                            plans: carrierSpecificPRPlans,
                            product: productPannelItem.product,
                            taxBenefitType: this.utilService.getTaxBenefitType(carrierSpecificPRPlans[0].planChoice.taxStatus),
                        });
                        this.multiPlanYear = carrierSpecificPRPlans.length > 1;
                        const formControl = this.fb.control(null, Validators.required);
                        this.planYearOptionsForm.addControl(productPannelItem.product.name + specificCarrier.name, formControl);
                        const planYear: PlanPanelModel = carrierSpecificPRPlans.filter((plan) => plan.planChoice.planYearId).pop();
                        if (planYear) {
                            this.planYearOptionsForm.controls[productPannelItem.product.name + specificCarrier.name].patchValue(
                                planYear.planChoice.planYearId,
                            );
                        }
                    }
                    const carrierSpecificVariablePlans = productPannelItem.plans.filter(
                        (plan) =>
                            plan.planChoice != null &&
                            plan.planChoice.continuous === false &&
                            plan.plan.carrierId === specificCarrier.id &&
                            plan.plan.carrierId === CarrierId.AFLAC &&
                            plan.planChoice.taxStatus.includes(VARIABLE),
                    );
                    const variableTaxStatus = carrierSpecificVariablePlans.filter((plan) => plan.planChoice.taxStatus.includes(VARIABLE));
                    if (variableTaxStatus.length) {
                        this.variableTaxStatusPlan = this.variableTaxStatusPlan.concat(variableTaxStatus);
                    }
                    if (carrierSpecificVariablePlans.length !== 0) {
                        this.coveragePeriodPRPlansPanelList.push({
                            carrier: specificCarrier,
                            plans: carrierSpecificVariablePlans,
                            product: productPannelItem.product,
                            taxBenefitType: this.languageStrings["primary.portal.benefitsOffering.preTaxAndPostTax"],
                        });
                        this.multiPlanYear = carrierSpecificVariablePlans.length > 1;
                        const formControl = this.fb.control(null, Validators.required);
                        this.planYearOptionsForm.addControl(productPannelItem.product.name + specificCarrier.name, formControl);
                        const planYear: PlanPanelModel = carrierSpecificVariablePlans.filter((plan) => plan.planChoice.planYearId).pop();
                        if (planYear) {
                            this.planYearOptionsForm.controls[productPannelItem.product.name + specificCarrier.name].patchValue(
                                planYear.planChoice.planYearId,
                            );
                        }
                    }
                    const carrierSpecificContinuousPlans = productPannelItem.plans.filter(
                        (plan) =>
                            plan.planChoice != null && plan.planChoice.continuous === true && plan.plan.carrierId === specificCarrier.id,
                    );
                    this.multiContinuousYear = carrierSpecificContinuousPlans.length > 1;
                    if (carrierSpecificContinuousPlans.length !== 0) {
                        this.coveragePeriodContinuousPlansPanelList.push({
                            carrier: specificCarrier,
                            plans: carrierSpecificContinuousPlans,
                            product: productPannelItem.product,
                            taxBenefitType: this.utilService.getTaxBenefitType(carrierSpecificContinuousPlans[0].planChoice.taxStatus),
                        });
                        const continuousPlanDates = this.fb.group({
                            enrollmentStartDate: ["", [Validators.required, this.checkContinuousEnrollmentDate.bind(this)]],
                            coverageStartFunction: ["", Validators.required],
                        });
                        this.continuousPlanDatesForm.addControl(productPannelItem.product.name + specificCarrier.name, continuousPlanDates);
                        const continuousPlan: PlanPanelModel = carrierSpecificContinuousPlans
                            .filter((plan) => plan.planChoice.enrollmentPeriod && plan.planChoice.coverageStartFunction)
                            .pop();
                        if (continuousPlan) {
                            this.continuousPlanDatesForm.controls[productPannelItem.product.name + specificCarrier.name].patchValue({
                                enrollmentStartDate: this.utilService.getCurrentTimezoneOffsetDate(
                                    continuousPlan.planChoice.enrollmentPeriod.effectiveStarting,
                                ),
                                coverageStartFunction: continuousPlan.planChoice.coverageStartFunction,
                            });
                        } else {
                            this.continuousPlanDatesForm.controls[productPannelItem.product.name + specificCarrier.name].patchValue({
                                enrollmentStartDate: this.dateService.format(new Date(), DateFormats.MONTH_DAY_YEAR),
                                coverageStartFunction: this.coverageStartDateOptions[FIRST_DATE_OF_MONTH_ONE_DAY].value,
                            });
                        }
                    }
                    const carrierSpecificNonAflacPlans = productPannelItem.plans.filter(
                        (plan) =>
                            plan.planChoice != null &&
                            plan.plan.carrierId === specificCarrier.id &&
                            plan.plan.carrierId !== CarrierId.AFLAC &&
                            !plan.planChoice.continuous,
                    );
                    if (carrierSpecificNonAflacPlans.length !== 0) {
                        const nonAflacPlanItem: CoveragePeriodPanel = {
                            carrier: specificCarrier,
                            plans: carrierSpecificNonAflacPlans,
                            product: productPannelItem.product,
                            taxBenefitType: this.utilService.getTaxBenefitType(carrierSpecificNonAflacPlans[0].planChoice.taxStatus),
                        };
                        this.coveragePeriodNonAflacPlanList.push(nonAflacPlanItem);
                        this.multiPlanYear = carrierSpecificNonAflacPlans.length > 1;
                        const formControl = this.fb.control(null, Validators.required);
                        this.nonAflacPlanYearOptionsForm.addControl(productPannelItem.product.name + specificCarrier.name, formControl);
                        const planYear: PlanPanelModel = carrierSpecificNonAflacPlans.filter((plan) => plan.planChoice.planYearId).pop();
                        if (planYear) {
                            this.nonAflacPlanYearOptionsForm.controls[productPannelItem.product.name + specificCarrier.name].patchValue(
                                planYear.planChoice.planYearId,
                            );
                            if (this.planYearUserChoice && this.planYearUserChoice !== MANAGE_PLAN_CHOICE) {
                                this.nonAflacPlanYearOptionsForm.controls[productPannelItem.product.name + specificCarrier.name].disable();
                            }
                            this.updatePlanYearForNonAflac(
                                nonAflacPlanItem,
                                planYear.planChoice.planYearId,
                                nonAflacPlanItem.product.valueAddedService,
                            );
                        }
                    }
                });
            });
            this.onlyADVGroupPlansPresent =
                this.coveragePeriodNonAflacPlanList.length &&
                !this.coveragePeriodNonAflacPlanList.some((nonAflacProduct) =>
                    nonAflacProduct.plans.some(
                        (plan) => plan.plan.carrierId !== CarrierId.AFLAC_DENTAL_AND_VISION && !plan.plan.vasFunding,
                    ),
                );
            if (this.coveragePeriodPRPlansPanelList.length !== 0 && this.coveragePeriodContinuousPlansPanelList.length !== 0) {
                this.continuousPlan.get("enrollmentStartDate").disable();
                this.continuousPlan.get("earliestCoverageStart").disable();
            }
            this.planYearIdToCompare = null;
            let planYearMapped = false;
            this.coveragePeriodPRPlansPanelList.forEach((panelItem) => {
                const planYear = panelItem.plans.filter((plan) => plan.planChoice.planYearId).pop();
                if (planYear) {
                    if (!this.planYearIdToCompare) {
                        planYearMapped = true;
                        this.samePlanYearflag = true;
                        this.planYearIdToCompare = planYear.planChoice.planYearId;
                    }
                    if (this.planYearIdToCompare !== planYear.planChoice.planYearId) {
                        this.samePlanYearflag = false;
                    }
                } else {
                    this.samePlanYearflag = false;
                }
            });
            this.multiPlanYear = this.coveragePeriodPRPlansPanelList.length > 1;
            if (this.coveragePeriodNonAflacPlanList.length > 1) {
                this.multiNonAflacYear = true;
            }
            if (this.coveragePeriodPRPlansPanelList.length !== 0) {
                this.getCafeteriaPlanDates();
            }
            this.setNonAflacPlanYearFlags();
            this.selectedPlanYearForm = this.fb.group({
                name: ["", Validators.required],
            });
            // Timeout added so getPlanYears gets called after getCafeteriaPlanDates and coverage dates get updated correctly
            const timeout = setTimeout(() => {
                this.getPlanYears(false);
                clearTimeout(timeout);
            }, 1000);
            if (this.coveragePeriodContinuousPlansPanelList.length > 1) {
                this.multiContinuousYear = true;
            }
            this.enrollmentDateGroupForNonAflac = this.fb.group({
                effectiveStarting: [
                    "",
                    [Validators.required, this.checkDate.bind(this), this.checkEnrollmentStartDateForNonAflac.bind(this)],
                ],
                expiresAfter: ["", [Validators.required, this.checkDate.bind(this), this.checkEnrollemtEndDateForNonAflac.bind(this)]],
            });
            this.coverageDateGroupForNonAflac = this.fb.group({
                effectiveStarting: [
                    "",
                    [Validators.required, this.checkDate.bind(this), this.checkCoverageStartDateForNonAflac.bind(this)],
                ],
                expiresAfter: [
                    { disabled: !this.isRole20User, value: "" },
                    [Validators.required, this.checkDate.bind(this), this.checkCoverageEndDateForNonAflac.bind(this)],
                ],
            });
            if (this.variableTaxStatusPlan.length) {
                const coverageStartFunctionChoice = this.variableTaxStatusPlan.find((plan) =>
                    Boolean(plan.planChoice && plan.planChoice.coverageStartFunction),
                );
                this.createPlanYearForm.addControl("coverageStartFunction", new FormControl("", Validators.required));
                this.createPlanYearForm.controls["coverageStartFunction"].patchValue(
                    coverageStartFunctionChoice
                        ? coverageStartFunctionChoice.planChoice.coverageStartFunction
                        : this.coverageStartDateOptionsForVariableTaxPlans[FIRST_DATE_OF_MONTH_ONE_DAY].value,
                );
            }
            this.planYearform.addControl("planYearOptionsForm", this.planYearOptionsForm);
            this.nonAflacPlanForm.addControl("nonAflacPlanYearOptionsForm", this.nonAflacPlanYearOptionsForm);
            this.continuousPlanform.addControl("continuousPlanDatesForm", this.continuousPlanDatesForm);
            this.coverageDatesForm.addControl("planYearform", this.planYearform);
            this.coverageDatesForm.addControl("continuousPlanform", this.continuousPlanform);
            this.coverageDatesForm.addControl("nonAflacPlanForm", this.nonAflacPlanForm);
            this.nonAflacPlan.addControl("enrollmentDateGroupForNonAflac", this.enrollmentDateGroupForNonAflac);
            this.nonAflacPlan.addControl("coverageDateGroupForNonAflac", this.coverageDateGroupForNonAflac);
            this.updateDropDownValueForContinuousPlan();
        }
        this.checkAflacVASPlans();
        if (this.isAflacIndividualCafeteriaVasOnly || this.isNonAflacIndividualCafeteriaVasOnly) {
            this.enrollmentDifferenceInDays = DAY_DIFF_AFLAC;
            this.dropDownForNextMonth = FUTURE_MONTH_NON_CAFETERIA;
            this.minimumDayErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.dateBeforeEnrollmentDate"];
        } else {
            this.enrollmentDifferenceInDays = DAY_DIFF_NON_AFLAC;
            this.dropDownForNextMonth = FUTURE_MONTH_CAFE;
            this.minimumDayErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.fifteenDaysAfterEnrollmentEndDate"];
        }
        if (this.onlyADVGroupPlansPresent) {
            this.enrollmentDifferenceInDays = DAY_DIFF_NON_AFLAC_ADV;
            this.nonAflacMinimumDayErrorMessage = this.minimumDayErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.sevenDaysAfterEnrollmentEndDate"];
        } else {
            this.nonAflacMinimumDayErrorMessage = this.minimumDayErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.fifteenDaysAfterEnrollmentEndDate"];
        }

        if (!this.isContiguousDates) {
            this.populateCoverageEnddate();
        }
        if (!this.isContiguousDatesForNonAflac) {
            this.populateCoverageEndDateForNonAflacPlan();
        }
        this.nonAflacPlanForm.controls["sameAflacIndividualPlanDate"].valueChanges
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((selectedValue) => this.multiNonAflacYear),
            )
            .subscribe((selectedValue: boolean) => {
                this.nonAflacPlanForm.controls.sameCoveragePlanDate.patchValue(!selectedValue);
            });
        this.createPlanYearForm.controls["enrollmentPeriod"]
            .get(EFFECTIVE_STARTING)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((selectedValue) => {
                this.continuousPlan.controls.enrollmentStartDate.patchValue(this.utilService.getCurrentTimezoneOffsetDate(selectedValue));
            });
        this.createPlanYearForm.controls[COVERAGE_PERIOD_FORM_VAR].get(EFFECTIVE_STARTING)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((selectedValue) => {
                if (!this.approvedPlanYears.length) {
                    this.continuousPlan.controls.earliestCoverageStart.patchValue(
                        this.utilService.getCurrentTimezoneOffsetDate(selectedValue),
                    );
                } else {
                    const earliestPlanYear = [...this.approvedPlanYears].sort(
                        (planYear1: PlanYear, planYear2: PlanYear) =>
                            this.dateService.toDate(planYear1.coveragePeriod.effectiveStarting).getTime() -
                            this.dateService.toDate(planYear2.coveragePeriod.effectiveStarting).getTime(),
                    )[EARLIEST_COVERAGE_DATE].coveragePeriod.effectiveStarting;
                    const earliestPlanYearDate = this.dateService.toDate(earliestPlanYear);
                    if (earliestPlanYearDate < selectedValue && earliestPlanYearDate >= this.currentDate) {
                        this.continuousPlan.controls.earliestCoverageStart.patchValue(
                            this.utilService.getCurrentTimezoneOffsetDate(earliestPlanYear),
                        );
                    } else if (selectedValue < earliestPlanYearDate && selectedValue >= this.currentDate) {
                        this.continuousPlan.controls.earliestCoverageStart.patchValue(
                            this.utilService.getCurrentTimezoneOffsetDate(selectedValue),
                        );
                    }
                }
            });
        this.getCarrierMaps();
        this.backClicked = false;
        const filteredQ60KGIPlans = this.panelProducts.filter((productPanel) => productPanel.productChoice);
        this.isQ60 = filteredQ60KGIPlans.some((productData) =>
            productData.plans.some((planData) => planData.plan.policySeries.includes("Q60") && planData.planChoice),
        );
        combineLatest([
            this.staticUtilService.cacheConfigEnabled(ConfigName.GI_ENROLLMENT_DATES_FEATURE),
            this.benefitsOfferingHelperService.isMasterAppStatusApproved(),
        ])
            .pipe(
                tap(([giEnrollmentDatesConfigValue, masterAppStatus]) => {
                    // GI date will be enable if master app status is not approved and giEnrollmentDatesConfigValue is enable
                    this.isGIEnrollmentDatesOn = giEnrollmentDatesConfigValue && !masterAppStatus;
                    if (!this.isGIEnrollmentDatesOn || !this.isQ60) {
                        this.enrollmentDateGroup.removeControl(DateInfo.GI_EFFECTIVE_STARTING);
                        this.enrollmentDateGroup.removeControl(DateInfo.GI_EXPIRES_AFTER);
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.enableGIEligibleDateMessage$ = this.benefitsOfferingHelperService.enableGIEligibleDateMessage(this.mpGroup.toString());
    }

    /**
     * prePopulatedSelectedPlanYearForm is for selected plan year for existing plan year by default pre populate data.
     */
    prePopulatedSelectedPlanYearForm(): void {
        const selectedPlanYear = this.existingPlanYears.find((planYear) => planYear.id === this.defaultPlanYear);
        this.selectedPlanYearForm.addControl("coveragePeriod", this.coverageDateGroup);
        this.selectedPlanYearForm.addControl("enrollmentPeriod", this.enrollmentDateGroup);
        this.planYearform.addControl("selectedPlanYearForm", this.selectedPlanYearForm);
        const enrollmentPeriod: EnrollmentPeriod = {
            effectiveStarting: selectedPlanYear?.enrollmentPeriod.effectiveStarting
                ? this.dateService.format(
                      this.dateService.toDate(selectedPlanYear?.enrollmentPeriod.effectiveStarting),
                      DateFormats.YEAR_MONTH_DAY,
                  )
                : null,
            expiresAfter: selectedPlanYear?.enrollmentPeriod.effectiveStarting
                ? this.dateService.format(
                      this.dateService.toDate(selectedPlanYear?.enrollmentPeriod.expiresAfter),
                      DateFormats.YEAR_MONTH_DAY,
                  )
                : null,
            guaranteedIssueEffectiveStarting: selectedPlanYear?.enrollmentPeriod.effectiveStarting
                ? this.dateService.format(
                      this.dateService.toDate(selectedPlanYear?.enrollmentPeriod.effectiveStarting),
                      DateFormats.YEAR_MONTH_DAY,
                  )
                : null,
            guaranteedIssueExpiresAfter: selectedPlanYear?.enrollmentPeriod?.guaranteedIssueExpiresAfter
                ? this.dateService.format(
                      this.dateService.toDate(selectedPlanYear?.enrollmentPeriod?.guaranteedIssueExpiresAfter),
                      DateFormats.YEAR_MONTH_DAY,
                  )
                : null,
        };
        this.selectedPlanYearForm.controls.name?.patchValue(selectedPlanYear?.name);
        this.selectedPlanYearForm.controls.enrollmentPeriod?.patchValue(enrollmentPeriod);
        // When coverage start date is selectable from a dropdown, populate it with first non-cafeteria date value from dropdown
        // This value will be first date of the next month
        if (!this.isAflacIndividualCafeteriaVasOnly) {
            const effectiveDate = this.dateArray?.find((date) => date !== this.cafeteriaStartDate);
            const coverageStartDate = effectiveDate || this.dateArray[0];
            this.coverageDateGroup.controls.effectiveStarting?.patchValue(coverageStartDate);
            this.populateEndDate(coverageStartDate);
            this.selectedPlanYearForm.controls.coveragePeriod?.patchValue(this.coverageDateGroup.value);
        } else {
            const coveragePeriod: CoveragePeriod = {
                effectiveStarting: selectedPlanYear?.coveragePeriod.effectiveStarting
                    ? this.dateService.format(
                          this.dateService.toDate(selectedPlanYear?.coveragePeriod.effectiveStarting),
                          DateFormats.YEAR_MONTH_DAY,
                      )
                    : null,
                expiresAfter: selectedPlanYear?.coveragePeriod.expiresAfter
                    ? this.dateService.format(
                          this.dateService.toDate(selectedPlanYear?.coveragePeriod.expiresAfter),
                          DateFormats.YEAR_MONTH_DAY,
                      )
                    : null,
            };
            this.selectedPlanYearForm.controls.coveragePeriod?.patchValue(coveragePeriod);
        }
        this.selectedPlanYearForm.updateValueAndValidity();
        this.selectedPlanYearForm.disable();
        this.enrollmentDateGroup.controls.guaranteedIssueExpiresAfter.enable();
        this.onStartDateUpdated();
        this.selectedPlanYearForm.controls.name.updateValueAndValidity();
    }
    /**
     * This method is used to fetch account TPP status
     */
    fetchAccountTPPStatus(): void {
        this.earliestCoverageStartDateInfoMsg = this.languageStrings["primary.portal.benefitsOffering.earliestCoverageStartInfo"];
        combineLatest([
            this.benefitsOfferingHelperService.fetchAccountTPPStatus(),
            this.benefitsOfferingHelperService.getThirdPartyPlatformRequirements(),
        ])
            .pipe(
                takeUntil(this.unsubscribe$),
                tap(([hasThirdPartyPlatforms, tppRequirement]) => {
                    this.isTPPAccount =
                        tppRequirement && tppRequirement.thirdPartyPlatformRequired
                            ? tppRequirement.thirdPartyPlatformRequired
                            : hasThirdPartyPlatforms;
                    if (this.isTPPAccount) {
                        this.earliestCoverageStartDateInfoMsg =
                            this.languageStrings["primary.portal.benefitsOffering.tpi.coverageDates.match"];
                    }
                }),
            )
            .subscribe();
    }
    /**
     * setting flags for non aflac plans
     */
    setNonAflacPlanYearFlags(): void {
        if (this.coveragePeriodNonAflacPlanList.length !== 0) {
            this.getExceptions();
            for (const panelItem of this.coveragePeriodNonAflacPlanList) {
                const planYear = panelItem.plans.filter((plan) => plan.planChoice.planYearId).pop();
                if (planYear) {
                    if (this.planYearIdToCompare === planYear.planChoice.planYearId) {
                        this.sameAflacPlanYearFlag = true;
                    } else {
                        this.sameAflacPlanYearFlag = false;
                        break;
                    }
                } else {
                    this.sameAflacPlanYearFlag = true;
                }
            }
        }
        if (this.sameAflacPlanYearFlag && this.coveragePeriodPRPlansPanelList.length === 0 && this.multiNonAflacYear) {
            this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.patchValue(false);
            this.nonAflacPlanForm.controls.sameCoveragePlanDate.patchValue(true);
        }
        if (
            this.coveragePeriodPRPlansPanelList.length === 0 &&
            this.coveragePeriodNonAflacPlanList.length === 1 &&
            !this.multiNonAflacYear
        ) {
            this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.patchValue(false);
            this.nonAflacPlanForm.controls.sameCoveragePlanDate.patchValue(false);
        }
        this.checkMultipleNonAflacPlanYear();
    }
    /**
     * set flags based on multiple non aflac plans
     */
    checkMultipleNonAflacPlanYear(): void {
        if (!this.sameAflacPlanYearFlag && !this.multiNonAflacYear) {
            this.nonAflacPlanForm.controls["sameAflacIndividualPlanDate"].patchValue(false);
        }
        this.nonAflacPlanDatesToCompare = null;
        this.nonAflacPlanYearMapped = false;
        if (!this.sameAflacPlanYearFlag && this.multiNonAflacYear) {
            this.nonAflacPlanForm.controls["sameAflacIndividualPlanDate"].patchValue(false);
            this.compareNonAflacPlanYearDates();
        }
        if (this.nonAflacPlanYearMapped && !this.sameNonAflacPlanYearFlag) {
            this.nonAflacPlanForm.controls["sameCoveragePlanDate"].patchValue(false);
        }
    }
    /**
     * compare plan year with existing non aflac plan year dates
     */
    compareNonAflacPlanYearDates(): void {
        this.coveragePeriodNonAflacPlanList.forEach((panelItem) => {
            const planYear = panelItem.plans.filter((plan) => plan.planChoice.planYearId).pop();
            if (planYear) {
                if (!this.nonAflacPlanDatesToCompare) {
                    this.nonAflacPlanYearMapped = true;
                    this.sameNonAflacPlanYearFlag = true;
                    this.nonAflacPlanDatesToCompare = planYear.planChoice.planYearId;
                }
                if (this.nonAflacPlanDatesToCompare !== planYear.planChoice.planYearId) {
                    this.sameNonAflacPlanYearFlag = false;
                }
            } else {
                this.sameNonAflacPlanYearFlag = true;
            }
        });
    }
    /**
     * To get the cafeteria plan dates
     */
    getCafeteriaPlanDates(): void {
        combineLatest([
            this.accountService.getGroupAttributesByName([PLAN_YEAR_START_DATE]),
            this.accountService.getGroupAttributesByName([PLAN_YEAR_END_DATE]),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                const startDate = response[0];
                const endDate = response[1];
                this.cafeteriaStartDate = startDate[0].value;
                this.cafeteriaEndDate = endDate[0].value;
                if (
                    !this.planYearToPopulate &&
                    this.dateService.toDate(this.cafeteriaStartDate) >= new Date() &&
                    this.data.opensFrom !== this.COPY_NEW_PLAN_YEAR_CONSTANT
                ) {
                    if (!this.isAflacIndividualCafeteriaVasOnly) {
                        this.dateArray.push(this.cafeteriaStartDate);
                        const index = this.dateArray.findIndex((dateString) => dateString === this.cafeteriaStartDate);
                        this.createPlanYearForm.get(COVERAGE_PERIOD_FORM_VAR).get(EFFECTIVE_STARTING).patchValue(this.dateArray[index]);
                    } else {
                        this.createPlanYearForm
                            .get(COVERAGE_PERIOD_FORM_VAR)
                            .get(EFFECTIVE_STARTING)
                            .patchValue(this.cafeteriaStartDate ? this.dateService.toDate(this.cafeteriaStartDate) : null);
                    }
                    if (!this.approvedPlanYears.length) {
                        this.continuousPlan
                            .get("earliestCoverageStart")
                            .patchValue(this.cafeteriaStartDate ? this.dateService.toDate(this.cafeteriaStartDate) : null);
                    }
                    this.createPlanYearForm.get(COVERAGE_PERIOD_FORM_VAR).get(EFFECTIVE_STARTING).markAsTouched();
                    this.populateEndDate(this.cafeteriaStartDate);
                }
            });
    }
    /**
     * To get all the Plan years
     * @param populateCreatedPlanYear To check created plan year
     */
    getPlanYears(populateCreatedPlanYear?: boolean): void {
        this.planYearOptions = [];
        this.nonAflacPlanYearOptions = [];
        this.isLoading = true;
        this.allPlanYears = [];
        forkJoin(
            this.benefitsOfferingService.getPlanYears(this.mpGroup, true, false),
            this.benefitsOfferingService.getPlanYears(this.mpGroup, false, false),
        )
            .pipe(
                tap(([unapprovedPlanYears, approvedPlanYears]) => {
                    this.unapprovedPlanYears = unapprovedPlanYears;
                    this.approvedPlanYears = approvedPlanYears;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((resp) => {
                resp.forEach((response: PlanYear[], index: number) => {
                    this.updateAllPlanYears(
                        this.utilService.copy(response.filter((planYear) => planYear.type === PlanYearType.AFLAC_INDIVIDUAL)),
                    );
                    response
                        .filter(
                            (planYear) =>
                                (planYear.type === PlanYearType.AFLAC_INDIVIDUAL && !this.isArgusProduct) ||
                                (!planYear.locked && this.isArgusProduct),
                        )
                        .forEach((planYear) => {
                            this.planYearOptions.push({
                                value: planYear.id,
                                viewValue: planYear.name,
                                type: PlanYearType.AFLAC_INDIVIDUAL,
                            });
                            // Checking coverage start date should be first of any month and in future for non-aflac plans.
                            if (
                                this.dateService.toDate(planYear.coveragePeriod.effectiveStarting) > new Date() &&
                                this.dateService.toDate(planYear.coveragePeriod.effectiveStarting).getDate() === 1 &&
                                ((this.data.opensFrom === this.COPY_NEW_PLAN_YEAR_CONSTANT && index === UNAPPROVED_PLAN_YEAR_INDEX) ||
                                    this.data.opensFrom !== this.COPY_NEW_PLAN_YEAR_CONSTANT)
                            ) {
                                this.addNonAflacPlanYearOption(planYear);
                            }
                            if (this.samePlanYearflag) {
                                this.planYearform.controls["samePlanYear"].patchValue(true);
                                if (this.allPlanYears) {
                                    if (this.planYearChoice) {
                                        this.contiguousDatesAddition();
                                        this.contiguousNonAflacDatesAddition(false);
                                    }
                                    this.populatePlanYear(this.utilService.copy(this.allPlanYears));
                                }
                                this.samePlanYearflag = false;
                            } else if (this.planYearChoice) {
                                this.contiguousDatesAddition();
                                this.contiguousNonAflacDatesAddition(false);
                            }
                            this.setNonAflacPlanDates(populateCreatedPlanYear);
                        });
                    if (!response.length) {
                        if (this.data.planYears.length) {
                            this.data.planYears.forEach((planYear) => {
                                this.planYearOptions.push({
                                    value: planYear.id,
                                    viewValue: planYear.name,
                                    type: PlanYearType.AFLAC_INDIVIDUAL,
                                });
                                if (
                                    this.isArgusProduct &&
                                    this.nonAflacPlanYearOptionsForm.disabled &&
                                    this.dateService.checkIsAfter(this.dateService.toDate(planYear.coveragePeriod.effectiveStarting)) &&
                                    (this.data.opensFrom !== this.COPY_NEW_PLAN_YEAR_CONSTANT || index === UNAPPROVED_PLAN_YEAR_INDEX)
                                ) {
                                    this.nonAflacPlanYearOptions.push({
                                        value: planYear.id,
                                        viewValue: planYear.name,
                                        coveragePeriod: planYear.coveragePeriod,
                                        type: PlanYearType.AFLAC_INDIVIDUAL,
                                    });
                                }
                            });
                        }
                        this.contiguousDatesAddition();
                        this.contiguousNonAflacDatesAddition(false);
                    }
                });
                if (this.data.opensFrom === ADD_PRODUCTS_CONSTANT) {
                    this.getExistingPlanYears();
                }
                if (this.coveragePeriodContinuousPlansPanelList.length) {
                    this.updateContinuousOnlyDates();
                }
                this.isLoading = false;
            });
        if (this.data.opensFrom === PLANS && !this.planYearIdToCompare && this.coveragePeriodPRPlansPanelList.length) {
            this.planYearIdToCompare = this.store.selectSnapshot(BenefitsOfferingState.getCurrentPlanYearId);
        }
        this.populatePlanYear(this.utilService.copy(this.data.planYears));
    }
    /**
     * Function to push plan years for non-aflac plans
     * @param planYear all active plan years
     */
    addNonAflacPlanYearOption(planYear: PlanYear): void {
        this.nonAflacPlanYearOptions.push({
            value: planYear.id,
            viewValue: planYear.name,
            coveragePeriod: planYear.coveragePeriod,
            type: PlanYearType.AFLAC_INDIVIDUAL,
        });
    }
    /**
     * To set plan year for non aflac plans
     * @param populateCreatedPlanYear To check created plan year
     */
    setNonAflacPlanDates(populateCreatedPlanYear: boolean): void {
        if (this.sameNonAflacPlanYearFlag) {
            this.nonAflacPlanForm.controls["sameCoveragePlanDate"].patchValue(true);
            if (this.allPlanYears) {
                this.populateNonAflacPlanYear(this.allPlanYears);
            }
            this.sameNonAflacPlanYearFlag = false;
        } else if (populateCreatedPlanYear) {
            this.setPlanYearForEachNonAflacPlan();
        }
    }
    /**
     * This method is used to filter the plan-year among the list of plan-years inputted and
     * populate plan year in input fields, if plan-year is found
     *
     * @param planYears contains the list of plan years to filter
     */
    populateNonAflacPlanYear(planYears: PlanYear[]): void {
        const planYearToPopulate: PlanYear = planYears
            .filter((planYearValue) => planYearValue.id === this.nonAflacPlanDatesToCompare)
            .pop();
        if (planYearToPopulate) {
            this.enrollmentDateGroupForNonAflac.patchValue({
                effectiveStarting: this.dateService.toDate(
                    this.datepipe.transform(
                        this.utilService.getCurrentTimezoneOffsetDate(planYearToPopulate.enrollmentPeriod.effectiveStarting),
                        DateFormats.MONTH_DAY_YEAR,
                    ),
                ),
                expiresAfter: this.dateService.toDate(
                    this.datepipe.transform(
                        this.utilService.getCurrentTimezoneOffsetDate(planYearToPopulate.enrollmentPeriod.expiresAfter),
                        DateFormats.MONTH_DAY_YEAR,
                    ),
                ),
            });
            this.coverageDateGroupForNonAflac.patchValue({
                effectiveStarting: this.dateService.toDate(
                    this.datepipe.transform(
                        this.utilService.getCurrentTimezoneOffsetDate(planYearToPopulate.coveragePeriod.effectiveStarting),
                        DateFormats.MONTH_DAY_YEAR,
                    ),
                ),
                expiresAfter: this.dateService.toDate(
                    this.datepipe.transform(
                        this.utilService.getCurrentTimezoneOffsetDate(planYearToPopulate.coveragePeriod.expiresAfter),
                        DateFormats.MONTH_DAY_YEAR,
                    ),
                ),
            });

            this.nonAflacPlan.patchValue({
                name: planYearToPopulate.name,
            });

            this.nonAflacPlanYearId = planYearToPopulate.id;
            delete planYearToPopulate[ID_FIELD];
            this.nonAflacPlanYearToPopulate = planYearToPopulate;

            if (!this.isContiguousDatesForNonAflac) {
                this.populateCoverageEndDateForNonAflacPlan(
                    planYearToPopulate.enrollmentPeriod.expiresAfter
                        ? this.dateService.toDate(planYearToPopulate.enrollmentPeriod.expiresAfter)
                        : null,
                );
            }
        }
    }
    /**
     * This method is used to filter the plan-year among the list of plan-years inputted and
     * populate plan year in input fields, if plan-year is found
     * @param planYears contains the list of plan years to filter
     */
    populatePlanYear(planYears: PlanYear[]): void {
        const planYearToPopulate = planYears.filter((planYearValue) => planYearValue.id === this.planYearIdToCompare).pop();
        if (planYearToPopulate) {
            planYearToPopulate.coveragePeriod.effectiveStarting = this.datepipe.transform(
                this.utilService.getCurrentTimezoneOffsetDate(planYearToPopulate.coveragePeriod.effectiveStarting),
                AppSettings.DATE_FORMAT_MM_DD_YYYY,
            );
            planYearToPopulate.coveragePeriod.expiresAfter = this.datepipe.transform(
                this.utilService.getCurrentTimezoneOffsetDate(planYearToPopulate.coveragePeriod.expiresAfter),
                AppSettings.DATE_FORMAT_MM_DD_YYYY,
            );
            planYearToPopulate.enrollmentPeriod.effectiveStarting = this.datepipe.transform(
                this.utilService.getCurrentTimezoneOffsetDate(planYearToPopulate.enrollmentPeriod.effectiveStarting),
                AppSettings.DATE_FORMAT_MM_DD_YYYY,
            );
            planYearToPopulate.enrollmentPeriod.expiresAfter = this.datepipe.transform(
                this.utilService.getCurrentTimezoneOffsetDate(planYearToPopulate.enrollmentPeriod.expiresAfter),
                AppSettings.DATE_FORMAT_MM_DD_YYYY,
            );
            planYearToPopulate.enrollmentPeriod.guaranteedIssueEffectiveStarting = this.dateService.format(
                this.utilService.getCurrentTimezoneOffsetDate(planYearToPopulate?.enrollmentPeriod?.guaranteedIssueEffectiveStarting),
                DateFormats.YEAR_MONTH_DAY,
            );
            planYearToPopulate.enrollmentPeriod.guaranteedIssueExpiresAfter = this.dateService.format(
                this.utilService.getCurrentTimezoneOffsetDate(planYearToPopulate?.enrollmentPeriod?.guaranteedIssueExpiresAfter),
                DateFormats.YEAR_MONTH_DAY,
            );
            this.planYearId = planYearToPopulate.id;
            delete planYearToPopulate[ID_FIELD];
            this.planYearToPopulate = planYearToPopulate;
            if (
                this.planYearUserChoice === CURRENT_PLAN ||
                this.data.opensFrom === this.COPY_NEW_PLAN_YEAR_CONSTANT ||
                this.data.opensFrom === PLANS
            ) {
                this.createPlanYearForm.patchValue({
                    enrollmentPeriod: {
                        effectiveStarting: this.dateService.toDate(planYearToPopulate.enrollmentPeriod.effectiveStarting),
                        expiresAfter: this.dateService.toDate(planYearToPopulate.enrollmentPeriod.expiresAfter),
                        guaranteedIssueEffectiveStarting: this.dateService.toDate(
                            planYearToPopulate.enrollmentPeriod.guaranteedIssueEffectiveStarting,
                        ),
                        guaranteedIssueExpiresAfter: this.dateService.toDate(
                            planYearToPopulate.enrollmentPeriod.guaranteedIssueExpiresAfter,
                        ),
                    },
                    coveragePeriod: {
                        effectiveStarting: this.dateService.toDate(planYearToPopulate.coveragePeriod.effectiveStarting),
                        expiresAfter: this.dateService.toDate(planYearToPopulate.coveragePeriod.expiresAfter),
                    },
                    name: planYearToPopulate.name,
                });
            }
            if (!this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.value && this.coveragePeriodNonAflacPlanList.length !== 0) {
                this.checkForSameCafeteriaDates(false);
            } else if (!this.isContiguousDates) {
                this.populateCoverageEnddate(this.dateService.toDate(planYearToPopulate.enrollmentPeriod.expiresAfter));
            }
            this.managePlanYearForm();
        }
    }
    /**
     * Disable plan year form based on user plan choice for manage existing plans
     */
    managePlanYearForm(): void {
        if (this.planYearUserChoice && this.planYearUserChoice !== MANAGE_PLAN_CHOICE) {
            this.createPlanYearForm.controls.name.disable();
            this.coverageDateGroup.controls.effectiveStarting.disable();
            this.coverageDateGroup.controls.expiresAfter.disable();
            this.enrollmentDateGroup.controls.effectiveStarting.disable();
            this.enrollmentDateGroup.controls.expiresAfter.disable();
            if (this.isQ60 && this.isGIEnrollmentDatesOn) {
                this.enrollmentDateGroup.controls.guaranteedIssueEffectiveStarting.disable();
                this.enrollmentDateGroup.controls.guaranteedIssueExpiresAfter.disable();
            }
            this.isDatePickerDisabled = true;
        }
    }
    /**
     * set plan year for individual non aflac plan
     * @returns nothing
     */
    setPlanYearForEachNonAflacPlan(): void {
        const nonAflacPlan = this.coveragePeriodNonAflacPlanList
            .filter((plan) => plan.product.name + plan.carrier.name === this.controlToReset)
            .pop();
        this.nonAflacPlanYearOptionsForm.controls[this.controlToReset].patchValue(this.nonAflacPlanYearId);
        this.updatePlanYearForNonAflac(nonAflacPlan, this.nonAflacPlanYearId, nonAflacPlan.product.valueAddedService);
    }
    /**
     * This method is used to check duplication of plan-year and to push unique & future plan-years
     *
     * @constant planYears is the data of plan-years which is coming from triggering point
     * @variable allPlanYears is the unApproved plan-year data which is getting collected in current component
     * @constant existingPlanYears is the set of plan-year data which contains future plan-years
     */
    getExistingPlanYears(): void {
        const existingPlanYear = this.quasiService.getExistingPlanYearValue();
        const existingPlanYearControl = this.quasiService.getExistingPlanYearControl();
        if (existingPlanYear) {
            this.planYearform.controls.existingPlanYearValue.patchValue(existingPlanYear);
            this.planYearId = existingPlanYear;
            this.defaultPlanYear = existingPlanYear;
        }
        if (existingPlanYearControl) {
            this.planYearform.controls.existingPlanYear.patchValue(existingPlanYearControl);
        }
        const planYears: PlanYear[] = this.utilService.copy(
            this.data.planYears.filter((planYear) => planYear.type === PlanYearType.AFLAC_INDIVIDUAL),
        );
        if (this.allPlanYears && this.allPlanYears.length) {
            this.allPlanYears
                .filter((planYear) => planYear.type === PlanYearType.AFLAC_INDIVIDUAL)
                .forEach((planYear) => {
                    const planYearIndex = planYears.findIndex((year) => year.id === planYear.id);
                    if (planYearIndex > -1) {
                        planYears.splice(planYearIndex, 1, planYear);
                    } else {
                        planYears.push(planYear);
                    }
                });
        }
        if (planYears && planYears.length) {
            planYears.forEach((planYear) => {
                if (
                    this.dateService.checkIsAfter(this.dateService.toDate(planYear.enrollmentPeriod.effectiveStarting)) ||
                    this.dateService.checkIsAfter(this.dateService.toDate(planYear.enrollmentPeriod.expiresAfter))
                ) {
                    this.existingPlanYears.push(planYear);
                }
            });
            if (!existingPlanYear) {
                this.defaultPlanYear =
                    this.existingPlanYears.length === this.PLAN_YEAR_LENGTH
                        ? this.existingPlanYears[this.FIRST_PLAN_YEAR_INDEX].id
                        : undefined;
            }
        }
        if (this.isGIEnrollmentDatesOn && this.isQ60 && this.defaultPlanYear) {
            this.prePopulatedSelectedPlanYearForm();
        }
    }
    formatDate(date: Date): string {
        return this.datepipe.transform(date, AppSettings.DATE_FORMAT_MM_DD_YYYY);
    }

    /**
     * logic to add contiguous dates
     */
    contiguousDatesAddition(): void {
        if (this.planYearDetail && this.planYearDetail.coveragePeriod) {
            const expiredAfterDate: Date = this.dateService.addDays(
                this.dateService.toDate(this.planYearDetail.coveragePeriod.expiresAfter),
                ONE_DAY_YEAR,
            );
            this.effectiveDate = this.formatDate(expiredAfterDate);
            this.populateCoverageEnddate(expiredAfterDate);
            this.isContiguousDates = true;
            if (
                this.createPlanYearForm.get("coveragePeriod").get("effectiveStarting").value &&
                this.data.opensFrom === this.COPY_NEW_PLAN_YEAR_CONSTANT
            ) {
                this.contiguousValue = true;
                this.createPlanYearForm.get("coveragePeriod").get("effectiveStarting").disable();
                this.planYearEffectiveDate = this.formatDate(this.createPlanYearForm.get("coveragePeriod").get("effectiveStarting").value);
            }
            if (this.coverageDateGroup.controls.effectiveStarting.value && this.data.opensFrom === this.COPY_NEW_PLAN_YEAR_CONSTANT) {
                this.contiguousValue = true;
                this.coverageDateGroup.controls.effectiveStarting.disable();
                this.planYearEffectiveDate = this.formatDate(this.coverageDateGroup.controls.effectiveStarting.value);
            } else {
                this.contiguousValue = false;
                this.coverageDateGroup.controls.effectiveStarting.enable();
            }
            this.benefitsOfferingService.setCoverageContiguousDates({
                value: this.contiguousValue,
                date: this.setCoverageContiguousDates(),
                validity: this.enrollmentDifferenceInDays,
            });
        }
    }

    /**
     * function to set contiguous date for non aflac plans
     * @param isVas check if VAS plan
     */
    contiguousNonAflacDatesAddition(isVas: boolean): void {
        if (this.planYearDetail && this.planYearDetail.coveragePeriod) {
            const expiredAfterDate: Date = this.dateService.toDate(this.planYearDetail.coveragePeriod.expiresAfter);
            this.effectiveDate = this.formatDate(expiredAfterDate);
            if (!isVas) {
                this.populateCoverageEndDateForNonAflacPlan(expiredAfterDate);
            } else {
                this.populateCoverageStartDateForVasOnly(expiredAfterDate);
            }
            this.isContiguousDatesForNonAflac = true;
            if (
                this.nonAflacPlan.get("coverageDateGroupForNonAflac").get("effectiveStarting").value &&
                this.data.opensFrom === this.COPY_NEW_PLAN_YEAR_CONSTANT
            ) {
                this.contiguousValue = true;
                this.nonAflacPlan.get("coverageDateGroupForNonAflac").get("effectiveStarting").disable();
            }
            if (
                this.coverageDateGroupForNonAflac.controls.effectiveStarting.value &&
                this.data.opensFrom === this.COPY_NEW_PLAN_YEAR_CONSTANT
            ) {
                this.contiguousValue = true;
                this.coverageDateGroupForNonAflac.controls.effectiveStarting.disable();
            } else {
                this.contiguousValue = false;
                this.coverageDateGroupForNonAflac.controls.effectiveStarting.enable();
            }
            this.benefitsOfferingService.setCoverageContiguousDates({
                value: this.contiguousValue,
                date: this.setNonAflacCoverageContiguousDates(),
                validity: this.enrollmentDifferenceInDays,
            });
        }
    }

    /**
     * set coverage contiguous dates as per selected plans
     * @return date value
     */
    setCoverageContiguousDates(): string {
        return this.isAflacIndividualCafeteriaVasOnly
            ? (this.createPlanYearForm.controls.coveragePeriod as FormGroup).controls.effectiveStarting.value
            : this.dateArray[0];
    }

    /**
     * set coverage contiguous dates for non aflac plans
     * @return date value
     */
    setNonAflacCoverageContiguousDates(): string {
        return this.isAflacIndividualCafeteriaVasOnly
            ? (this.nonAflacPlan.controls.coverageDateGroupForNonAflac as FormGroup).controls.effectiveStarting.value
            : this.dateArrayForNonAflac[0];
    }
    /**
     * This method is used to call updatePlanYearDetailsToPlans which stores plan-year restricted data
     * @param coverageDatePRPanelItems is the list of plans which has plan-years
     * @param value is current selected plan-year value
     */
    updatePlanYear(coverageDatePRPanelItems: CoveragePeriodPanel[], value: string, isPYSelectionChange: boolean): void {
        this.defaultPlanYear = +value;
        if (coverageDatePRPanelItems && coverageDatePRPanelItems.length) {
            coverageDatePRPanelItems.forEach((plan) => {
                this.updatePlanYearDetailsToPlans(plan, value);
            });
        } else if (coverageDatePRPanelItems) {
            this.updatePlanYearDetailsToPlans(coverageDatePRPanelItems[0], value);
        }
        if (this.isQ60 && this.isGIEnrollmentDatesOn && isPYSelectionChange) {
            this.prePopulatedSelectedPlanYearForm();
        }
    }
    /**
     * This method is used to arrange planChoice to be updated and stores in a variable
     * @param coverageDatePRPanelItem is the plan which has plan-year
     * @param value is currently selected plan-year value
     */
    updatePlanYearDetailsToPlans(coverageDatePRPanelItem: CoveragePeriodPanel, value: string): void {
        if (this.isGIEnrollmentDatesOn && this.isQ60) {
            this.existingPlanYears.forEach((planYear) => {
                if (planYear.id === +value) {
                    planYear.enrollmentPeriod.guaranteedIssueEffectiveStarting = this.selectedPlanYearForm.controls.enrollmentPeriod.get(
                        DateInfo.GI_EFFECTIVE_STARTING,
                    ).value;
                    planYear.enrollmentPeriod.guaranteedIssueExpiresAfter = this.selectedPlanYearForm.controls.enrollmentPeriod.get(
                        DateInfo.GI_EXPIRES_AFTER,
                    ).value;
                }
            });
        }
        const selectedPlanYear = this.existingPlanYears.filter((planYear) => planYear.id === +value).pop();
        if (this.utilService.isPastDate(selectedPlanYear.enrollmentPeriod.effectiveStarting)) {
            this.continuousPlan.controls.enrollmentStartDate.patchValue(
                selectedPlanYear.enrollmentPeriod.effectiveStarting
                    ? this.dateService.format(
                          this.dateService.toDate(selectedPlanYear.enrollmentPeriod.effectiveStarting),
                          DateFormats.YEAR_MONTH_DAY,
                      )
                    : null,
            );
        } else {
            this.continuousPlan.controls.enrollmentStartDate.patchValue(
                this.currentDate ? this.dateService.format(this.currentDate, DateFormats.YEAR_MONTH_DAY) : null,
            );
        }

        this.coveragePeriodPRPlansPanelList[this.coveragePeriodPRPlansPanelList.indexOf(coverageDatePRPanelItem)].plans.forEach((plan) => {
            const planChoice: PlanChoice = {
                agentAssisted: plan.planChoice.agentAssisted,
                cafeteria: plan.planChoice.cafeteria,
                continuous: false,
                id: plan.planChoice.id,
                planId: plan.planChoice.plan.id,
                plan: plan.planChoice.plan,
                planYearId: +value,
                taxStatus: plan.planChoice.taxStatus,
            };
            this.planYearId = +value;
            const duplicateChoice = this.PRPlanChoicesToBeUpdated.filter((choice) => choice.id === plan.planChoice.id).pop();
            if (duplicateChoice) {
                const duplicateChoiceIndex = this.PRPlanChoicesToBeUpdated.indexOf(duplicateChoice);
                this.PRPlanChoicesToBeUpdated.splice(duplicateChoiceIndex, 1);
            }
            this.PRPlanChoicesToBeUpdated.push(planChoice);
        });
    }
    updateContinuousPlanDetails(): void {
        this.continuousPlanChoicesToBeUpdated = [];
        this.coveragePeriodContinuousPlansPanelList.forEach((panel) => {
            const continuousPlanDatesValue = this.continuousPlanDatesForm.controls[panel.product.name + panel.carrier.name].value;
            panel.plans.forEach((plan) => {
                const planChoice: PlanChoice = {
                    agentAssisted: plan.planChoice.agentAssisted,
                    cafeteria: plan.planChoice.cafeteria,
                    continuous: true,
                    id: plan.planChoice.id,
                    planId: plan.planChoice.plan.id,
                    plan: plan.planChoice.plan,
                    enrollmentPeriod: {
                        effectiveStarting: this.datepipe.transform(
                            continuousPlanDatesValue.enrollmentStartDate
                                ? this.dateService.toDate(continuousPlanDatesValue.enrollmentStartDate)
                                : null,
                            DateFormats.YEAR_MONTH_DAY,
                        ),
                    },
                    coverageStartFunction: continuousPlanDatesValue.coverageStartFunction,
                    taxStatus: plan.planChoice.taxStatus,
                };
                this.continuousPlanChoicesToBeUpdated.push(planChoice);
            });
        });
        this.updateContinuousPlanChoicesToServer();
    }
    /**
     * create plan year for selected dates
     * @param updateChoice check for update plan year
     */
    createPlanYear(updateChoice: boolean): void {
        if (this.createPlanYearForm.invalid) {
            return;
        }
        const planYear = this.constructPlanYearPayload();
        this.subscriptions.push(
            this.benefitsOfferingService
                .savePlanYear(planYear, this.mpGroup)
                .pipe(
                    switchMap((resp) => {
                        const location: string = resp.headers.get("location");
                        const stringArray = location.split("/");
                        this.planYearId = Number(stringArray[stringArray.length - 1]);
                        this.planYearId = Number(stringArray[stringArray.length - 1]);
                        this.quasiService.setCreatedPlanYear(
                            this.benefitsOfferingService
                                .deletePlanYear(this.mpGroup, this.planYearId)
                                .pipe(catchError((error) => of(error))),
                        );
                        this.store.dispatch(new SetNewPlanYearValue(true));
                        if (!this.createdPlanYearValue) {
                            this.createdPlanYearValue = this.createPlanYearForm.value;
                        }
                        if (updateChoice === true) {
                            this.updateAllPRPlanChoices();
                        }
                        this.dialogError = false;
                        if (this.dialogOpen) {
                            this.getPlanYears(true);
                            this.closeModal();
                        }
                        if (
                            this.nonAflacPlanForm.get(SAME_AFLAC_INDIVIDUAL_PLAN_DATE) &&
                            this.nonAflacPlanForm.get(SAME_AFLAC_INDIVIDUAL_PLAN_DATE).value &&
                            this.coveragePeriodPRPlansPanelList.length !== 0 &&
                            this.coveragePeriodNonAflacPlanList.length !== 0 &&
                            this.exceptions.length
                        ) {
                            return this.benefitsOfferingService.updatePlanYearVasExceptions(this.planYearId, this.mpGroup);
                        }
                        return of(EMPTY);
                    }),
                    catchError((errorResp) => {
                        this.setErrorResponse(errorResp);
                        return of(null);
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * Method to create or update plan year
     */
    onNext(): void {
        this.isLoading = true;
        this.error = false;
        this.createPlanYearForm.updateValueAndValidity();
        const isFormInvalid = this.checkFormValidation();
        if (isFormInvalid) {
            this.isLoading = false;
            return;
        }
        if (this.defaultPlanYear && this.coveragePeriodPRPlansPanelList && this.coveragePeriodPRPlansPanelList.length) {
            this.updatePlanYear(this.coveragePeriodPRPlansPanelList, this.defaultPlanYear.toString(), false);
        }
        this.updateAflacPRPlans();
        this.quasiService.storePlanYearValue(this.planYearform.controls.existingPlanYearValue.value);
        this.quasiService.storePlanYearControl(this.planYearform.controls.existingPlanYear.value);
        if (!this.coveragePeriodPRPlansPanelList.length) {
            this.updateContinuousPlanChoices();
        }
        if (
            !this.nonAflacPlanForm.get("sameAflacIndividualPlanDate").value &&
            !this.coveragePeriodPRPlansPanelList.length &&
            !this.coveragePeriodContinuousPlansPanelList.length &&
            this.coveragePeriodNonAflacPlanList.length
        ) {
            this.updateCoverageDatesForNonAflacPlan();
        }
        if (
            this.exceptions.length &&
            ((!this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.value &&
                !this.nonAflacPlanForm.controls.sameCoveragePlanDate.value &&
                this.multiNonAflacYear) ||
                (!this.multiNonAflacYear && !this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.value))
        ) {
            this.updateVasExceptionForMultiplePlanYears();
        }
        this.store.dispatch(new SetNewPlanYearValue(true));
    }

    /**
     * check for update of aflac carrier plans
     */
    updateAflacPRPlans(): void {
        if (
            this.planYearform.controls.samePlanYear &&
            this.planYearform.controls.samePlanYear.value &&
            !this.comparePreviousPlan() &&
            !(this.createdPlanYearValue && JSON.stringify(this.createPlanYearForm.value) === JSON.stringify(this.createdPlanYearValue)) &&
            !this.planYearform.controls.existingPlanYearValue.value
        ) {
            this.createPlanYear(true);
        } else if (
            this.planYearform.controls.samePlanYear &&
            ((this.comparePreviousPlan() && !this.planYearToPopulate) ||
                (this.comparePreviousPlan() && !this.isDateRangeSame()) ||
                this.selectedPlanYearForm?.controls.enrollmentPeriod?.value)
        ) {
            this.updateExistingPlanYear(true);
        } else if (this.planYearform.controls.samePlanYear) {
            this.updateAllPRPlanChoices();
        } else {
            this.updateAllPRPlanChoiceToServer();
        }
    }

    /**
     * check form validations
     * @return boolean
     */
    checkFormValidation(): boolean {
        let isInvalid = this.checkForExistingPlanYearValue();
        if (this.planYearform.controls.existingPlanYearValue.value) {
            const planYear = this.allPlanYears.find((py) => py.id === this.planYearform.controls.existingPlanYearValue.value);
            if (
                this.coveragePeriodNonAflacPlanList.length &&
                !this.isAflacIndividualCafeteriaVasOnly &&
                this.dateService.getDifferenceInDays(this.coverageStartDate, planYear.enrollmentPeriod.expiresAfter) < DAY_DIFF_NON_AFLAC
            ) {
                isInvalid = true;
                this.handleSecondaryError("secondary.portal.benefitsOffering.coveragedates.fifteenDaysValidation");
            }
            return isInvalid;
        }
        if (!this.showContinuousCoverageStartDate) {
            this.continuousPlan.controls.earliestCoverageStart.setErrors(null);
        }
        if (
            (this.createPlanYearForm.valid &&
                this.benefitsOfferingHelperService.checkForPlanYearNameValidation(this.createPlanYearForm.controls[NAME].value)) ||
            (this.nonAflacPlan.valid &&
                this.benefitsOfferingHelperService.checkForPlanYearNameValidation(this.nonAflacPlan.controls[NAME].value))
        ) {
            this.error = true;
            this.fieldErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.planYearNameValidation"];
            isInvalid = true;
        }
        if (
            this.checkForAflacValidation() ||
            this.checkForNonAflacFormValidation() ||
            this.checkCopyPlanYearValidation() ||
            this.checkAflacOverlappingCoverageDates() ||
            this.checkNonAflacOverlappingCoverageDates()
        ) {
            isInvalid = true;
        } else if (this.approvalModelOpen && !this.approveReceived) {
            this.displayDialog();
            isInvalid = true;
        }
        return isInvalid;
    }
    /**
     * Check for existing plan year value
     * @returns boolean
     */
    checkForExistingPlanYearValue(): boolean {
        return (
            this.planYearform.controls.existingPlanYear.value === EXISTING_PLAN_YEAR &&
            !this.planYearform.controls.existingPlanYearValue.value &&
            this.coveragePeriodPRPlansPanelList &&
            this.coveragePeriodPRPlansPanelList.length &&
            !!this.existingPlanYears.length
        );
    }
    /**
     * checks for aflac form validation
     * @returns if aflac form is valid or not
     */
    checkForAflacValidation(): boolean {
        return (
            (this.coveragePeriodPRPlansPanelList.length !== 0 &&
                this.planYearform.controls.samePlanYear &&
                this.planYearform.controls.samePlanYear.value === true &&
                this.createPlanYearForm.invalid) ||
            (this.coveragePeriodPRPlansPanelList.length !== 0 &&
                this.planYearform.controls.samePlanYear &&
                this.planYearform.controls.samePlanYear.value === true &&
                this.createPlanYearForm.invalid &&
                !this.planYearform.controls.existingPlanYearValue) ||
            (this.coveragePeriodContinuousPlansPanelList.length !== 0 &&
                this.continuousPlanform.controls.sameCoveragePlanDate.value === true &&
                this.continuousPlan.invalid)
        );
    }
    /**
     * checks duplicate validation in case of copy plan year
     * @returns true if current plan year is duplicate of any approved plan year
     */
    checkCopyPlanYearValidation(): boolean {
        let isInvalid = false;
        if (this.data.opensFrom === this.COPY_NEW_PLAN_YEAR_CONSTANT) {
            if (this.coveragePeriodPRPlansPanelList.length !== 0 && this.getApprovedPlanYear(this.createPlanYearForm.controls.name.value)) {
                isInvalid = true;
            }
            if (
                this.coveragePeriodNonAflacPlanList.length !== 0 &&
                !(
                    this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate &&
                    this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.value
                ) &&
                this.nonAflacPlanForm.controls.sameCoveragePlanDate &&
                this.nonAflacPlanForm.controls.sameCoveragePlanDate.value &&
                this.getApprovedPlanYear(this.nonAflacPlan.controls.name.value)
            ) {
                isInvalid = true;
            }
            if (isInvalid) {
                this.handleSecondaryError("secondary.portal.benefitsOffering.duplicatePlanYear");
            }
        }
        return isInvalid;
    }
    /**
     * displays secondary error messages on screen
     * @param errorMessage error message to be displayed
     */
    handleSecondaryError(errorMessage: string): void {
        this.fieldErrorMessage = this.languageSecondStringsArray[errorMessage];
        this.error = true;
        this.isLoading = false;
    }
    /**
     * gets approved plan year data based on plan year name
     * @param planYearName  plan year name
     * @returns plan year data
     */
    getApprovedPlanYear(planYearName: string): PlanYear {
        return this.approvedPlanYears.filter((planYear) => planYear.name === planYearName).pop();
    }
    /**
     * checks for invalid aflac plans based on overlapping coverage dates
     * @returns invalid based on coverage dates
     */
    checkAflacOverlappingCoverageDates(): boolean {
        let isInvalid = false;
        if (
            this.coveragePeriodPRPlansPanelList.length !== 0 &&
            this.createPlanYearForm.valid &&
            this.planYearform.controls.samePlanYear &&
            this.planYearform.controls.samePlanYear.value &&
            this.data.opensFrom !== ADD_PRODUCTS_CONSTANT
        ) {
            const currentPlansSelected: PlanPanelModel[] = [];
            this.coveragePeriodPRPlansPanelList.forEach((panelItem) => {
                currentPlansSelected.push(...panelItem.plans);
            });
            const invalidPlans = this.getIneligiblePlans(
                this.coverageDateGroup.controls.effectiveStarting.value
                    ? this.dateService.toDate(this.coverageDateGroup.controls.effectiveStarting.value)
                    : null,
                this.coverageDateGroup.controls.expiresAfter.value
                    ? this.dateService.toDate(this.coverageDateGroup.controls.expiresAfter.value)
                    : null,
                currentPlansSelected,
                this.createPlanYearForm.controls.name.value,
            );
            isInvalid = this.handleInvalidPlans(invalidPlans);
        }
        return isInvalid;
    }
    /**
     * checks for ineligible plan choices based on coverage dates
     * @param effectiveStarting coverage effective starting
     * @param expiresAfter coverage expires after
     * @param currentPlansSelected list of currently selected plans
     * @param planYearName current plan year name
     * @returns list of ineligible plans
     */
    getIneligiblePlans(
        effectiveStarting: Date,
        expiresAfter: Date,
        currentPlansSelected: PlanPanelModel[],
        planYearName: string,
    ): PlanPanelModel[] {
        let ineligiblePlans: PlanPanelModel[] = [];
        const overlappingPlanYears: PlanYear[] = this.allPlanYears.filter(
            (planYear) =>
                planYear.name !== planYearName &&
                ((this.dateService.isBeforeOrIsEqual(effectiveStarting, planYear.coveragePeriod.effectiveStarting) &&
                    this.dateService.getIsAfterOrIsEqual(expiresAfter, planYear.coveragePeriod.effectiveStarting)) ||
                    (this.dateService.isBeforeOrIsEqual(planYear.coveragePeriod.effectiveStarting, effectiveStarting) &&
                        this.dateService.isBeforeOrIsEqual(effectiveStarting, planYear.coveragePeriod.expiresAfter))),
        );
        const overlappingPlansList: PlanChoice[] = [];
        if (overlappingPlanYears && overlappingPlanYears.length) {
            const approvedPlanChoices = this.store.selectSnapshot(BenefitsOfferingState.getPlanChoices);
            overlappingPlanYears.forEach((planYear) => {
                overlappingPlansList.push(...approvedPlanChoices.filter((planChoice) => planChoice.planYearId === planYear.id));
            });
            let carrierRestrictedPlanList: PlanChoice[] = [];
            carrierRestrictedPlanList = overlappingPlansList.filter((plan) => plan.plan.carrierId !== CarrierId.AFLAC);
            ineligiblePlans = currentPlansSelected.filter((currentPlan) => {
                // applied restriction on creating planyears with overlapping coverage dates at carrier level for argus-adv-ngl plans
                const isArgusPlan = currentPlan.plan.carrierId === CarrierId.ADV || currentPlan.plan.carrierId === CarrierId.ARGUS;
                return (
                    overlappingPlansList.some((plan) =>
                        isArgusPlan ? plan.plan.carrierId === currentPlan.plan.carrierId : plan.plan.id === currentPlan.plan.id,
                    ) && this.checkForProductEligibility(currentPlan, carrierRestrictedPlanList)
                );
            });
        }
        return ineligiblePlans;
    }

    /**
     * check for single plan restriction
     * @params currentPlan current selected plan
     * @params approvedPlans approved plans
     * @return boolean
     */
    checkForProductEligibility(currentPlan: PlanPanelModel, approvedPlans: PlanChoice[]): boolean {
        let isEligible = true;
        const singlePlansRestricted = this.carrierMaps.filter((carrier) => carrier.carrier === SINGLE_PLAN_CARRIERS)[0].ids;
        if (isEligible && ![CarrierId.ARGUS, CarrierId.ADV].includes(+currentPlan.plan.carrierId)) {
            if (currentPlan.plan.productId === ProductId.DENTAL) {
                let dentalPlans: PlanChoice[] = [];
                dentalPlans = approvedPlans.filter((plan) => plan.plan.productId === ProductId.DENTAL);
                if (
                    dentalPlans.length &&
                    dentalPlans[0].plan.carrierId === currentPlan.plan.carrierId &&
                    singlePlansRestricted.indexOf(dentalPlans[0].plan.carrierId.toString()) === -1
                ) {
                    isEligible = false;
                }
            } else if (currentPlan.plan.productId === ProductId.VISION) {
                let visionPlans: PlanChoice[] = [];
                visionPlans = approvedPlans.filter((plan) => plan.plan.productId === ProductId.VISION);
                if (
                    visionPlans.length &&
                    visionPlans[0].plan.carrierId === currentPlan.plan.carrierId &&
                    singlePlansRestricted.indexOf(visionPlans[0].plan.carrierId.toString()) === -1
                ) {
                    isEligible = false;
                }
            }
        }
        return isEligible;
    }

    /**
     * checks for invalid non aflac plans based on overlapping coverage dates
     * @returns invalid based on coverage dates
     */
    checkNonAflacOverlappingCoverageDates(): boolean {
        let isInvalid = false;
        if (this.coveragePeriodNonAflacPlanList.length !== 0 && this.data.opensFrom !== ADD_PRODUCTS_CONSTANT) {
            const currentPlansSelected: PlanPanelModel[] = [];
            this.coveragePeriodNonAflacPlanList.forEach((panelItem) => {
                currentPlansSelected.push(...panelItem.plans);
            });
            let invalidPlans: PlanPanelModel[] = [];
            if (
                this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate &&
                this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.value
            ) {
                invalidPlans = this.getIneligiblePlans(
                    this.dateService.toDate(this.coverageDateGroup.controls.effectiveStarting.value),
                    this.dateService.toDate(this.coverageDateGroup.controls.expiresAfter.value),
                    currentPlansSelected,
                    this.createPlanYearForm.controls.name.value,
                );
            } else if (
                this.nonAflacPlanForm.controls.sameCoveragePlanDate &&
                this.nonAflacPlanForm.controls.sameCoveragePlanDate.value &&
                this.nonAflacPlan.valid
            ) {
                invalidPlans = this.getIneligiblePlans(
                    this.dateService.toDate(this.coverageDateGroupForNonAflac.controls.effectiveStarting.value),
                    this.dateService.toDate(this.coverageDateGroupForNonAflac.controls.expiresAfter.value),
                    currentPlansSelected,
                    this.nonAflacPlan.controls.name.value,
                );
            } else {
                invalidPlans = this.checkMultipleNonAflacOverlappingDates(currentPlansSelected);
            }
            isInvalid = this.handleInvalidPlans(invalidPlans);
        }
        return isInvalid;
    }
    /**
     * checks invalid plans based on overlapping incase of multiple non aflac plan years
     * @param currentPlansSelected list of currently selected plans
     * @returns invalid plans
     */
    checkMultipleNonAflacOverlappingDates(currentPlansSelected: PlanPanelModel[]): PlanPanelModel[] {
        const invalidPlans: PlanPanelModel[] = [];
        this.coveragePeriodNonAflacPlanList.forEach((panelItem) => {
            const planYearId: number = +this.nonAflacPlanYearOptionsForm.controls[panelItem.product.name + panelItem.carrier.name].value;
            if (planYearId) {
                const planYearData: PlanYear = this.allPlanYears.filter((planYear) => planYear.id === planYearId).pop();
                if (planYearData) {
                    invalidPlans.push(
                        ...this.getIneligiblePlans(
                            this.dateService.toDate(planYearData.coveragePeriod.effectiveStarting),
                            this.dateService.toDate(planYearData.coveragePeriod.expiresAfter),
                            currentPlansSelected,
                            planYearData.name,
                        ),
                    );
                }
            }
        });
        return invalidPlans;
    }
    /**
     * handles invalid plans error
     * @param invalidPlans list of invalid plans
     * @returns if valid or not
     */
    handleInvalidPlans(invalidPlans: PlanPanelModel[]): boolean {
        let isInvalid = false;
        if (invalidPlans && invalidPlans.length) {
            isInvalid = true;
            this.handleSecondaryError("secondary.portal.benefitsOffering.coveragePeriod.overlapping.plans");
            if (invalidPlans.some((plan) => plan.plan.carrierId === CarrierId.ADV || plan.plan.carrierId === CarrierId.ARGUS)) {
                this.handleSecondaryError("secondary.portal.benefitsOffering.coveragePeriod.overlapping.ADVplans");
            }
        }
        return isInvalid;
    }

    /**
     * check for non aflac form validation
     */
    checkForNonAflacFormValidation(): boolean {
        return (
            (this.coveragePeriodNonAflacPlanList.length !== 0 &&
                this.nonAflacPlanForm.controls.sameCoveragePlanDate &&
                this.nonAflacPlanForm.controls.sameCoveragePlanDate.value === true &&
                this.nonAflacPlan.invalid) ||
            (this.multiNonAflacYear &&
                this.coveragePeriodNonAflacPlanList.length !== 0 &&
                this.nonAflacPlanForm.controls.sameCoveragePlanDate &&
                this.nonAflacPlanForm.controls.sameCoveragePlanDate.value === false &&
                this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate &&
                this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.value === false &&
                this.nonAflacPlanYearOptionsForm.invalid) ||
            (!this.multiNonAflacYear &&
                this.coveragePeriodNonAflacPlanList.length !== 0 &&
                this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate &&
                this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.value === false &&
                this.nonAflacPlanYearOptionsForm.invalid) ||
            this.validateExceptionCoverageDates()
        );
    }

    /**
     * Update continuous plan choices
     */
    updateContinuousPlanChoices(): void {
        this.isLoading = true;
        // Continuous plans updates
        if (this.continuousPlanform.controls.sameCoveragePlanDate.value === true) {
            this.updateAllContinuousPlanDates();
        } else {
            this.updateContinuousPlanDetails();
        }
    }
    /**
     * maps the plan year id to all plan year restricted plans if apply same plan year to all check box is selected
     * @returns nothing
     */
    updateAllPRPlanChoices(): void {
        if (this.planYearform.controls.samePlanYear && this.planYearform.controls.samePlanYear.value) {
            this.PRPlanChoicesToBeUpdated = [];
            this.coveragePeriodPRPlansPanelList.forEach((pannelItem) => {
                pannelItem.plans.forEach((plan) => {
                    const planChoice: PlanChoice = {
                        agentAssisted: plan.planChoice.agentAssisted,
                        cafeteria: plan.planChoice.cafeteria,
                        continuous: false,
                        id: plan.planChoice.id,
                        planId: plan.planChoice.plan.id,
                        plan: plan.planChoice.plan,
                        planYearId: this.planYearId,
                        coverageStartFunction: this.getCoverageStartFunction(plan.planChoice.taxStatus),
                        taxStatus: plan.planChoice.taxStatus,
                    };
                    this.PRPlanChoicesToBeUpdated.push(planChoice);
                });
            });
        }
        if (
            this.nonAflacPlanForm.get("sameAflacIndividualPlanDate").value &&
            this.coveragePeriodPRPlansPanelList.length !== 0 &&
            this.coveragePeriodNonAflacPlanList.length !== 0
        ) {
            this.coveragePeriodNonAflacPlanList.forEach((panelItem) => {
                panelItem.plans.forEach((plan) => {
                    const planChoice: PlanChoice = {
                        agentAssisted: plan.planChoice.agentAssisted,
                        cafeteria: plan.planChoice.cafeteria,
                        continuous: false,
                        id: plan.planChoice.id,
                        planId: plan.planChoice.plan.id,
                        plan: plan.planChoice.plan,
                        planYearId: this.planYearId,
                        taxStatus: plan.planChoice.taxStatus,
                    };
                    this.PRPlanChoicesToBeUpdated.push(planChoice);
                });
            });
        }
        this.updateAllPRPlanChoiceToServer();
    }
    /**
     * set coverage start function for both pretax and post tax aflac plans
     * @param taxStatus
     * @return coverage start date rule
     */
    getCoverageStartFunction(taxStatus: string): string {
        if (taxStatus.includes(VARIABLE) && this.variableTaxStatusPlan.length !== 0) {
            return this.createPlanYearForm.get("coverageStartFunction").value;
        }
        return null;
    }
    /**
     * maps effective starting and coverage start function to all choices if apply same check box is selected
     * @returns nothing
     */
    updateAllContinuousPlanDates(): void {
        this.continuousPlanChoicesToBeUpdated = [];
        this.coveragePeriodContinuousPlansPanelList.forEach((panel) => {
            panel.plans.forEach((plan) => {
                const planChoice: PlanChoice = {
                    agentAssisted: plan.planChoice.agentAssisted,
                    cafeteria: plan.planChoice.cafeteria,
                    continuous: true,
                    id: plan.planChoice.id,
                    planId: plan.planChoice.plan.id,
                    plan: plan.planChoice.plan,
                    enrollmentPeriod: {
                        effectiveStarting: this.continuousPlan.controls.enrollmentStartDate.value
                            ? this.datepipe.transform(
                                  this.dateService.toDate(this.continuousPlan.controls.enrollmentStartDate.value),
                                  AppSettings.DATE_FORMAT,
                              )
                            : null,
                    },
                    // If plan belongs to VSP PC assign 1st day of month for coverage start date
                    coverageStartFunction:
                        panel.carrier.id === CarrierId.VSP_INDIVIDUAL_VISION
                            ? coverageStartFunction.NEXT_FIRST_OF_MONTHNEXT_FIRST_OF_MONTH
                            : this.continuousPlan.controls.coverageStartFunction.value,
                    taxStatus: plan.planChoice.taxStatus,
                };
                this.continuousPlanChoicesToBeUpdated.push(planChoice);
            });
        });
        this.updateContinuousPlanChoicesToServer();
    }
    /**
     * the below method updates all Plan year restricted plan choices to server
     * @returns nothing
     */
    updateAllPRPlanChoiceToServer(): void {
        const PRPlanChoicesToBeUpdatedToServer = [];
        const updatedPlanYearPlanChoices: Observable<void>[] = [];
        this.updateContinuousPlanChoices();
        this.PRPlanChoicesToBeUpdated.forEach((choice) => {
            PRPlanChoicesToBeUpdatedToServer.push(this.benefitsOfferingService.updatePlanChoice(choice, this.mpGroup));
            const existingPlanChoice = this.quasiService.checkForApprovedPlanChoice(choice);
            if (existingPlanChoice) {
                updatedPlanYearPlanChoices.push(
                    this.benefitsOfferingService
                        .updatePlanChoice(this.quasiService.getCreatePlanChoiceObject(existingPlanChoice), this.mpGroup)
                        .pipe(catchError((error) => of(error))),
                );
            }
        });
        if (PRPlanChoicesToBeUpdatedToServer.length !== 0) {
            this.planCounter++;
        }
        forkJoin(PRPlanChoicesToBeUpdatedToServer)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((resp) => {
                    this.planCounter--;
                    this.isLoading = false;
                    this.quasiService.setPlansChoices(updatedPlanYearPlanChoices);
                    if (this.coveragePeriodContinuousPlansPanelList.length !== 0) {
                        this.updateContinuousPlanChoices();
                    }
                    if (
                        !this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.value &&
                        this.coveragePeriodNonAflacPlanList.length !== 0
                    ) {
                        this.updateCoverageDatesForNonAflacPlan();
                    }
                    if (
                        (this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.value ||
                            this.coveragePeriodNonAflacPlanList.length === 0) &&
                        this.coveragePeriodContinuousPlansPanelList.length === 0 &&
                        this.planCounter === 0
                    ) {
                        this.quasiService.defaultStepPositionChanged$.next(CARRIER_FORM_STEP);
                    }
                }),
                catchError((error) => {
                    this.error = true;
                    this.isLoading = false;
                    return of(null);
                }),
            )
            .subscribe();
        this.updateChoicesToStore(this.PRPlanChoicesToBeUpdated);
    }
    /**
     * updates all continuous plan choices to server
     */
    updateContinuousPlanChoicesToServer(): void {
        const planChoicesToBeUpdatedToServer = [];
        const updatedContinuousPlanChoices: Observable<void>[] = [];
        if (
            !this.coveragePeriodPRPlansPanelList.length &&
            this.continuousPlanChoicesToBeUpdated.length <= 0 &&
            (this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.value || this.coveragePeriodNonAflacPlanList.length === 0)
        ) {
            this.quasiService.defaultStepPositionChanged$.next(CARRIER_FORM_STEP);
        } else {
            this.createGroupAttributeForContinuousPlan();
            this.continuousPlanChoicesToBeUpdated.forEach((planChoice) => {
                planChoicesToBeUpdatedToServer.push(this.benefitsOfferingService.updatePlanChoice(planChoice, this.mpGroup));
                const existingPlanChoice = this.quasiService.checkExistingPlanChoice(planChoice);
                if (existingPlanChoice) {
                    updatedContinuousPlanChoices.push(
                        this.benefitsOfferingService
                            .updatePlanChoice(this.quasiService.getCreatePlanChoiceObject(existingPlanChoice), this.mpGroup)
                            .pipe(catchError((error) => of(error))),
                    );
                }
            });
            if (planChoicesToBeUpdatedToServer.length !== 0) {
                this.planCounter++;
            }
            forkJoin(planChoicesToBeUpdatedToServer).subscribe(
                (resp) => {
                    this.planCounter--;
                    this.isLoading = false;
                    if (this.coveragePeriodPRPlansPanelList.length === 0 && this.coveragePeriodNonAflacPlanList.length !== 0) {
                        this.updateCoverageDatesForNonAflacPlan();
                    }
                    this.quasiService.setPlansChoices(updatedContinuousPlanChoices);
                    if (
                        (this.nonAflacPlanForm.get("sameAflacIndividualPlanDate").value ||
                            this.coveragePeriodNonAflacPlanList.length === 0) &&
                        this.planCounter === 0
                    ) {
                        this.quasiService.defaultStepPositionChanged$.next(CARRIER_FORM_STEP);
                    }
                },
                (error) => {
                    this.error = true;
                    this.isLoading = false;
                },
            );
            this.updateChoicesToStore(this.continuousPlanChoicesToBeUpdated);
        }
    }
    /**
     * create group attribute for continuous plans
     */
    createGroupAttributeForContinuousPlan(): void {
        if (this.coveragePeriodPRPlansPanelList.length !== 0 || this.coveragePeriodContinuousPlansPanelList.length !== 0) {
            const selectedPlanYear = this.existingPlanYears.find((planYear) => planYear.id === this.defaultPlanYear);
            this.accountService
                .getGroupAttributesByName([COVERAGE_START_DATE], this.mpGroup)
                .pipe(
                    switchMap((resp) => {
                        if (resp?.length > 0) {
                            return of([]);
                        }
                        return this.accountService.createGroupAttribute({
                            attribute: COVERAGE_START_DATE,
                            value:
                                this.coveragePeriodContinuousPlansPanelList.length === 0 &&
                                this.planYearform.controls.existingPlanYear.value === EXISTING_PLAN_YEAR &&
                                selectedPlanYear &&
                                selectedPlanYear.coveragePeriod &&
                                selectedPlanYear.coveragePeriod.effectiveStarting
                                    ? this.datepipe.transform(selectedPlanYear.coveragePeriod.effectiveStarting, DateFormats.MONTH_DAY_YEAR)
                                    : this.datepipe.transform(
                                          this.continuousPlan.controls.earliestCoverageStart.value,
                                          DateFormats.MONTH_DAY_YEAR,
                                      ),
                        });
                    }),
                    catchError(() => {
                        this.error = true;
                        return of([]);
                    }),
                    finalize(() => {
                        this.isLoading = false;
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
    }

    /**
     *  the below method validates the input date to be greater than current date
     * @param control
     * @returns ValidationErrors
     */
    checkDate(control: FormControl): ValidationErrors {
        if (control.value && control.value.toString().trim().length > 0) {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            const reg = new RegExp(AppSettings.NumberValidationRegex);
            const inputDate = this.dateService.toDate(control.value);
            if ((!inputDate || isNaN(inputDate.getTime())) && !reg.test(control.value)) {
                return { required: true };
            }
            if (inputDate && !this.dateService.isValid(inputDate) && control.value.length !== 0) {
                return { invalid: true };
            }
            inputDate.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);
            if (this.dateService.isBefore(inputDate, date)) {
                return { pastDate: true };
            }
            return null;
        }
        return { required: true };
    }
    /**
     * validates the input date to be greater than current date and not more than 180 days from current date
     * @param control enrollment start date control
     * @returns validation errors based on logic
     */
    checkContinuousEnrollmentDate(control: FormControl): ValidationErrors | null {
        // type casted the below variables to any as i was not able to make arithmetic operations
        if (control.value) {
            const date: Date = new Date();
            const inputDate: Date = this.dateService.toDate(control.value);
            if (!inputDate) {
                return { required: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            if (this.dateService.isBefore(inputDate, date)) {
                return { pastDate: true };
            }
            if (inputDate < date || (inputDate.getDate() - date.getDate()) / (1000 * 60 * 60 * 24) >= 180) {
                return { invalid: true };
            }
            return null;
        }
        return null;
    }
    /**
     * To validate enrollment end date should be greater than effective starting date
     * @param control Form control to take the enrollment end date value
     * @returns ValidationErrors for the control
     */
    checkEnrollemtEndDate(control: FormControl): ValidationErrors {
        let errorType = null;
        if (control.value) {
            let date = new Date();
            const inputDate = this.dateService.toDate(control.value);
            if (this.enrollmentDateGroup && this.enrollmentDateGroup.controls.effectiveStarting.value) {
                date = this.dateService.toDate(this.enrollmentDateGroup.controls["effectiveStarting"].value);
                this.checkForEnrollmentDates(date, inputDate, true, false);
            }
            if (!inputDate || isNaN(inputDate.getTime())) {
                this.dateUpdatedMessage = false;
                errorType = { requirement: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            if (inputDate < date) {
                this.dateUpdatedMessage = false;
                errorType = { invalidEndDate: true };
            }
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            if (this.dateService.isBefore(inputDate, currentDate)) {
                this.dateUpdatedMessage = false;
                errorType = { pastDate: true };
            }
            if (!this.contiguousValue) {
                this.populateCoverageEnddate(this.enrollmentDateGroup.controls.expiresAfter.value);
            }
            if (this.isCoverageDateError) {
                return { invalid: true };
            }
            if (this.contiguousValue && this.validateCoverageStartDate(inputDate)) {
                errorType = { minimumDays: true };
            }
            if (
                this.allPlanYears &&
                this.planYearToPopulate &&
                this.createPlanYearForm.value.coveragePeriod.effectiveStarting === this.planYearToPopulate.coveragePeriod.effectiveStarting
            ) {
                this.dateUpdatedMessage = false;
            }
            if (this.validateEnrollmentEndDate(inputDate)) {
                errorType = { contiguous: true };
            }
        }
        return errorType;
    }
    /**
     * to  validate coverage end date should be greater than effective starting date
     * @param control coverage end date
     */
    checkCoverageEndDate(control: FormControl): any {
        if (control.value) {
            let date = new Date();
            if (this.coverageStartDate) {
                date = this.dateService.toDate(this.coverageStartDate);
            }
            const inputDate = this.dateService.toDate(control.value);
            if (!inputDate) {
                return { requirement: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            if (this.dateService.isBefore(inputDate, new Date())) {
                return { pastDate: true };
            }
            if (inputDate < date) {
                return { beforeCoverageStartDate: true };
            }
            return null;
        }
    }

    /**
     * logic to check coverage start date based on enrollment end date
     * @param control enrollment end date control
     * @returns coverage start date
     */
    checkCoverageStartDate(control: FormControl): CoverageStartDate | undefined {
        if (control.value) {
            let errorType = null;
            const enrollmentEnddate = this.enrollmentDateGroup?.controls["expiresAfter"].value || "";
            const enrollmentStartDate = this.enrollmentDateGroup.controls["effectiveStarting"].value || "";
            const inputStartDate = this.dateService.toDate(control.value);
            const sixMonthsFromEnrollmentStartDate = this.dateService.toDate(enrollmentStartDate);
            sixMonthsFromEnrollmentStartDate.setMonth(sixMonthsFromEnrollmentStartDate.getMonth() + SIX_MONTHS);
            sixMonthsFromEnrollmentStartDate.setDate(sixMonthsFromEnrollmentStartDate.getDate() - ONE_DAY_YEAR);
            this.maxCoverageStartDate = this.dateService.toDate(sixMonthsFromEnrollmentStartDate || "");
            if (inputStartDate > sixMonthsFromEnrollmentStartDate && !this.contiguousValue) {
                errorType = { shouldBe180DaysFromToday: true };
            }
            const threeMonthsFromEnrollmentStartDate = this.dateService.toDate(enrollmentStartDate);
            // The below lines of code is used to check enrollment dates and coverage dates and will set errors
            threeMonthsFromEnrollmentStartDate.setMonth(threeMonthsFromEnrollmentStartDate.getMonth() + THREE_MONTHS);
            threeMonthsFromEnrollmentStartDate.setDate(threeMonthsFromEnrollmentStartDate.getDate() - ONE_DAY_YEAR);
            this.approvalModelOpen = false;
            if (inputStartDate > threeMonthsFromEnrollmentStartDate) {
                if (!this.approveReceived) {
                    this.approvalModelOpen = true;
                } else {
                    this.approvalModelOpen = false;
                }
            }
            const enrollmentExpireDate: Date | string = this.enrollmentDateGroup.controls["expiresAfter"].value || "";
            if (!this.isAflacIndividualCafeteriaVasOnly) {
                const fifteenDaysFromEnrollmentEndDate = this.dateService.toDate(enrollmentExpireDate);
                fifteenDaysFromEnrollmentEndDate.setDate(fifteenDaysFromEnrollmentEndDate.getDate() + FIFTEEN_DAYS);
                this.coverageMinDate = this.dateService.toDate(fifteenDaysFromEnrollmentEndDate || "");
                this.enrollmentDifferenceInDays = DAY_DIFF_NON_AFLAC;
            } else {
                const oneDayFromEnrollmentEndDate = this.dateService.toDate(enrollmentExpireDate);
                oneDayFromEnrollmentEndDate.setDate(oneDayFromEnrollmentEndDate.getDate() + ONE_DAY_YEAR);
                this.coverageMinDate = this.dateService.toDate(oneDayFromEnrollmentEndDate);
                this.enrollmentDifferenceInDays = DAY_DIFF_AFLAC;
            }
            inputStartDate.setHours(0, 0, 0);
            const date = new Date();
            date.setHours(0, 0, 0);
            if (this.dateService.isBefore(inputStartDate, date) && !this.contiguousValue) {
                errorType = { pastDate: true };
            }
            const inputCoverageStartDate = this.dateService.toDate(inputStartDate).getDate();
            if (DateInfo.LAST_DATES_OF_MONTH.includes(inputCoverageStartDate)) {
                this.enteredDate = this.dateService.format(this.dateService.toDate(inputStartDate), DateFormats.MONTH_DAY_YEAR);
                errorType = { dateNotAllowed: true };
            }
            if (
                errorType === null &&
                !this.isCoverageDateError &&
                enrollmentEnddate &&
                this.dateService.getDifferenceInDays(this.dateService.toDate(inputStartDate), enrollmentEnddate) <
                    this.enrollmentDifferenceInDays &&
                !this.contiguousValue
            ) {
                errorType = { minimumDays: true };
            }
            return errorType;
        }
        return undefined;
    }

    /**
     * opens coverage date approval dialog
     */
    displayDialog(): void {
        const dialogRef = this.empoweredModalService.openDialog(CoverageDateApprovalComponent);
        this.subscriptions.push(
            dialogRef
                .afterClosed()
                .pipe(
                    map((approved) => {
                        if (approved && approved !== null && approved !== undefined) {
                            this.approveReceived = true;
                            this.approvalModelOpen = false;
                            this.onNext();
                        } else {
                            this.approveReceived = false;
                            this.approvalModelOpen = true;
                        }
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * the below method handles creating plan year form pop-up
     * @returns nothing
     */
    createNewPlanYear(): void {
        // check whether the non aflac plan dates are valid or not
        if (this.nonAflacPlan.invalid) {
            return;
        }
        if (this.benefitsOfferingHelperService.checkForPlanYearNameValidation(this.nonAflacPlan.controls[NAME].value)) {
            this.dialogError = true;
            this.fieldErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.planYearNameValidation"];
            return;
        }
        this.createNonAflacPlanYear(false);
    }
    /** This method will close the create plan year modal
     * @returns nothing
     */
    closeModal(): void {
        this.dialog.close();
        this.dialogOpen = false;
        this.isVasPlan = false;
        this.dialogError = false;
        this.fieldErrorMessage = null;
        this.formDirective.resetForm();
        this.nonAflacPlanYearOptionsForm.controls[this.controlToReset].reset();
        this.nonAflacPlan.reset();
        if (!this.isContiguousDatesForNonAflac) {
            this.populateCoverageEndDateForNonAflacPlan();
        }
    }
    /** This will open the modal to create plan year.
     *
     * @param controlName provides the particular plan
     * @param isVas check for VAS plan
     * @param carrierId id of product carrier
     */
    openModal(controlName: string, isVas: boolean, carrierId: number): void {
        this.controlToReset = controlName;
        this.nonAflacPlan.reset();
        this.dialogOpen = true;
        this.isVasPlan = isVas;
        this.dialog = this.matDialog.open(this.createPlanYearModal, { maxWidth: "700px", panelClass: "add-plan-year" });
        if (isVas) {
            this.coverageDateGroupForNonAflac.controls.expiresAfter.enable();
            this.enrollmentDifferenceInDaysForModal = DAY_DIFF_AFLAC;
            this.dropDownForNextMonth = FUTURE_MONTH_NON_CAFETERIA;
            this.minimumDayErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.dateBeforeEnrollmentDate"];
        } else {
            if (!this.isRole20User) {
                this.coverageDateGroupForNonAflac.controls.expiresAfter.disable();
            }
            this.enrollmentDifferenceInDaysForModal =
                carrierId === CarrierId.AFLAC_DENTAL_AND_VISION ? DAY_DIFF_NON_AFLAC_ADV : DAY_DIFF_NON_AFLAC;
            this.dropDownForNextMonth = FUTURE_MONTH_CAFE;
            if (carrierId === CarrierId.AFLAC_DENTAL_AND_VISION) {
                this.minimumDayErrorModalMessage =
                    this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.sevenDaysAfterEnrollmentEndDate"];
            } else {
                this.minimumDayErrorModalMessage =
                    this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.fifteenDaysAfterEnrollmentEndDate"];
            }
        }
        if (this.planYearChoice || !this.allPlanYears.length) {
            this.contiguousNonAflacDatesAddition(isVas);
        } else if (!this.isVasPlan && !this.isContiguousDatesForNonAflac) {
            this.populateCoverageEndDateForNonAflacPlan();
        } else if (!this.isContiguousDatesForNonAflac) {
            const date = new Date();
            this.populateCoverageStartDateForVasOnly(date);
        }
        this.nonAflacPlanYearOptionsForm.controls[this.controlToReset].reset();
        this.benefitsOfferingService.setCoverageContiguousDates({
            value: this.contiguousValue,
            date: this.setNonAflacCoverageContiguousDates(),
        });
    }
    /**
     * this function will be triggered on click of back button
     */
    onBack(): void {
        this.backClicked = true;
        this.quasiService.stepClicked$.next(2);
    }
    checkDateInput(event: any, control: AbstractControl, controlName?: string): void {
        if (event.target.value) {
            const inputDate = this.dateService.toDate(event.target.value);
            if (isNaN(inputDate.getTime())) {
                control.setErrors({ requirements: true });
            }
        }
    }
    checkContiguousDate(control: FormControl): any {
        if (control.value) {
            const date = this.dateService.toDate(this.planYearDetail.coveragePeriod.expiresAfter);
            const inputDate = this.dateService.toDate(control.value);
            if (!inputDate) {
                return { required: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            if (inputDate <= date) {
                return { contiguous: true };
            }
            return null;
        }
    }
    /**
     * This method will execute when we update the enrollment dates
     * Method is used to check condition to validate gi start date + 45 date with enrollment end date
     * This method is used to disable past dates in coverage start date date-picker by setting minimum coverage date
     */
    onDatesUpdated(): void {
        const minDate = this.enrollmentDateGroup.controls["expiresAfter"].value
            ? this.dateService.toDate(this.enrollmentDateGroup.controls["expiresAfter"].value)
            : null;
        const minDaysAfterEnrollmentEndDate = this.isAflacIndividualCafeteriaVasOnly ? DAY_DIFF_AFLAC : DAY_DIFF_NON_AFLAC;
        minDate.setDate(minDate.getDate() + minDaysAfterEnrollmentEndDate);
        this.coverageMinDate = minDate ? this.dateService.toDate(minDate) : null;
        if (!this.isGIEnrollmentDatesOn || !this.isQ60) {
            // config indicator flag is able to toggle on / toggle off for may release.
            return;
        }
        const minEnrollmentExpDate = this.enrollmentDateGroup.controls[EXPIRES_AFTER].value
            ? this.dateService.toDate(this.enrollmentDateGroup.controls[EXPIRES_AFTER].value)
            : null;
        const giEnrollmentDateGroup: AbstractControl = this.enrollmentDateGroup.controls.guaranteedIssueEffectiveStarting;
        const guaranteedIssueStartDate = giEnrollmentDateGroup.value ? this.dateService.toDate(giEnrollmentDateGroup.value) : null;
        const diffInDays = Math.abs(this.dateService.getDifferenceInDays(guaranteedIssueStartDate, minEnrollmentExpDate));
        this.giMaxDiffDate = this.benefitsOfferingHelperService.disableGIEnrollmentEndDate(
            guaranteedIssueStartDate,
            DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS,
        );
        this.giEnrollEndDateDisable = this.giMaxDiffDate > minEnrollmentExpDate;
        if (diffInDays <= DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS) {
            this.enrollmentDateGroup.controls.guaranteedIssueExpiresAfter.patchValue(minEnrollmentExpDate);
        }
        if (this.giMaxDiffDate < minEnrollmentExpDate) {
            this.enrollmentDateGroup.controls.guaranteedIssueExpiresAfter.patchValue(this.giMaxDiffDate);
        }
    }
    /**
     * This method will starts executing once the content is checked.
     * If there is an error, then this method will scroll to mon-alert.
     */
    ngAfterContentChecked(): void {
        if (document.getElementById("coverage_dates_start") && this.scrollInToMonAlertFlag) {
            this.scrollInToMonAlertFlag = false;
            window.scrollTo(0, 0);
        }
    }
    /**
     * This function will be responsible for populating the end date with 1 year of ahead of start date
     * @param startDate take the start date of coverage
     * @param event Matselect change attribute passed through whenever the mat select dropdwon gets changes
     */
    populateEndDate(startDate: string, event?: MatSelectChange): void {
        const expiresAfterControlName = "expiresAfter";
        if ((startDate && !event) || (event && event.source.selected && startDate)) {
            this.coverageStartDate = startDate;
            const inputStartDate = this.dateService.getOneDayLessThanYear(this.dateService.toDate(startDate));
            if (!event && this.planYearToPopulate && this.planYearToPopulate.coveragePeriod.expiresAfter) {
                this.coverageDateGroup
                    .get(expiresAfterControlName)
                    .patchValue(this.dateService.toDate(this.planYearToPopulate.coveragePeriod.expiresAfter));
            } else {
                this.coverageDateGroup.get(expiresAfterControlName).patchValue(inputStartDate);
            }
            this.coverageDateGroup.get(expiresAfterControlName).disable();
            if (this.isRole20User) {
                this.coverageDateGroup.get(expiresAfterControlName).enable();
            }
        }
    }

    /**
     * Function will populate the dropdown of dates with 1st of month
     * @param date Based on date populate the date dropdown to have the difference of enrollment end date and coverage start date
     */
    populateCoverageEnddate(date?: Date): void {
        this.dateArray = [];
        if (this.dateService.toDate(this.cafeteriaStartDate) >= new Date() && this.data.opensFrom !== this.COPY_NEW_PLAN_YEAR_CONSTANT) {
            this.dateArray.push(this.cafeteriaStartDate);
        }
        this.isCoverageDateError = false;
        let indexToPopulate = 0;
        date = date ? date : new Date();
        if (this.isContiguousDates && !this.isAflacIndividualCafeteriaVasOnly && date.getDate() === ONE_DAY_YEAR) {
            date = this.dateService.subtractDays(this.dateService.toDate(date), ONE_DAY_YEAR);
        }
        this.setAflacDateOptions(date);
        if (!this.isAflacIndividualCafeteriaVasOnly) {
            if (this.createPlanYearForm.controls.enrollmentPeriod.valid) {
                const enrollmentEnddate = this.dateService.toDate(this.enrollmentDateGroup.controls[EXPIRES_AFTER].value);
                const isCoverageDate = this.dateArray.filter((dateStr) => {
                    const dateItem = this.dateService.toDate(dateStr);
                    return this.dateService.getDifferenceInDays(dateItem, enrollmentEnddate) > FIRST_DATE_OF_MONTH_ONE_DAY;
                });
                if (isCoverageDate.length === 0) {
                    this.isCoverageDateError = true;
                    this.coverageDateGroup.get(EFFECTIVE_STARTING).setErrors({ minimumDays: false });
                    this.coverageDateGroup.updateValueAndValidity();
                }
            }
            this.dateUpdatedMessage = false;
            if (this.planYearToPopulate && this.planYearToPopulate.coveragePeriod.effectiveStarting) {
                const indexToFind = this.dateArray.findIndex(
                    (dateString) => dateString === this.planYearToPopulate.coveragePeriod.effectiveStarting,
                );
                indexToPopulate = indexToFind !== -1 ? indexToFind : 0;
            }
            const coverageStartDateControl: AbstractControl = (this.createPlanYearForm.controls.coveragePeriod as FormGroup).controls
                .effectiveStarting;
            coverageStartDateControl.clearValidators();
            coverageStartDateControl.setValidators([
                Validators.required,
                this.checkDate.bind(this),
                this.checkCoverageStartDate.bind(this),
            ]);
            coverageStartDateControl.patchValue(this.dateArray[indexToPopulate]);
            if (!this.approvedPlanYears.length) {
                this.continuousPlan.controls.earliestCoverageStart.patchValue(this.dateService.toDate(this.dateArray[indexToPopulate]));
            }
            coverageStartDateControl.markAsTouched();
            this.populateEndDate(this.dateArray[indexToPopulate]);
        } else {
            this.populateCoverageStartDateForAflacCafeteria(date);
        }
        if (this.planYearUserChoice && this.planYearUserChoice !== MANAGE_PLAN_CHOICE) {
            this.coverageDateGroup.controls.expiresAfter.disable();
        }
    }
    /**
     * set date options for aflac plans
     * @param date Based on date populated on date drop down
     */
    setAflacDateOptions(date: Date): void {
        for (let index = 0; index < this.dropDownForNextMonth; index++) {
            this.dateArray.push(
                this.dateService.getFormattedFirstOfMonths(
                    this.dateService.toDate(date),
                    index + FIRST_DATE_OF_MONTH_ONE_DAY,
                    DateFormats.MONTH_DAY_YEAR,
                ),
            );
        }
    }
    /**
     * This method is used to populate the coverage start date if the benefit offering contains Aflac Individual + Pre-tax
     * This method will fetch enrollment date and add DAY_DIFF_AFLAC days to it and sets the coverage start date
     * @param date is the date to pre-populate
     */
    populateCoverageStartDateForAflacCafeteria(date?: Date): void {
        if (
            this.cafeteriaStartDate &&
            this.dateService.toDate(this.cafeteriaStartDate) >= new Date() &&
            this.data.opensFrom !== this.COPY_NEW_PLAN_YEAR_CONSTANT &&
            !this.enrollmentDateGroup.controls.expiresAfter.value &&
            !this.isContiguousDates
        ) {
            date = this.dateService.toDate(this.cafeteriaStartDate);
        } else if (!this.isContiguousDates) {
            date = this.enrollmentDateGroup.controls.expiresAfter.value
                ? this.dateService.toDate(this.enrollmentDateGroup.controls.expiresAfter.value)
                : date;
        }
        if (date) {
            let coverageStartDate: Date;
            if (!this.isContiguousDates) {
                coverageStartDate = this.dateService.toDate(date);
                if (this.enrollmentDateGroup.controls.expiresAfter.value) {
                    coverageStartDate.setDate(coverageStartDate.getDate() + FIRST_DATE_OF_MONTH_ONE_DAY);
                }
            } else {
                coverageStartDate = this.dateService.toDate(date);
            }
            const coverageStartDateControl: AbstractControl = (this.createPlanYearForm.controls.coveragePeriod as FormGroup).controls
                .effectiveStarting;
            const getCoverageDate = coverageStartDate.getDate();
            if (DateInfo.LAST_DATES_OF_MONTH.includes(getCoverageDate)) {
                coverageStartDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            }
            if (this.planYearToPopulate && this.planYearToPopulate.coveragePeriod.effectiveStarting) {
                coverageStartDateControl.patchValue(this.dateService.toDate(this.planYearToPopulate.coveragePeriod.effectiveStarting));
                if (!this.approvedPlanYears.length) {
                    this.continuousPlan.controls.earliestCoverageStart.patchValue(this.planYearToPopulate.coveragePeriod.effectiveStarting);
                }
            } else {
                coverageStartDateControl.patchValue(coverageStartDate);
                if (!this.approvedPlanYears.length) {
                    this.continuousPlan.controls.earliestCoverageStart.patchValue(coverageStartDate);
                }
            }
            coverageStartDateControl.markAsTouched();
        }
        this.populateEndDate(this.createPlanYearForm.get(COVERAGE_PERIOD_FORM_VAR).get(EFFECTIVE_STARTING).value);
    }
    /**
     * This method is used to populate the coverage start date if the benefit offering contains Aflac Individual + Pre-tax
     * This method will fetch enrollment date and add DAY_DIFF_AFLAC days to it and sets the coverage start date
     * @param date is the date to pre-populate
     */
    populateCoverageStartDateForAflacCafeteriaVas(date: Date): void {
        const COVERAGE_START_CONTROL: AbstractControl = this.createPlanYearForm.get(COVERAGE_PERIOD_FORM_VAR).get(EFFECTIVE_STARTING_VAR);
        const coverageStartDate: Date = date ? this.dateService.toDate(date) : null;
        coverageStartDate.setDate(coverageStartDate.getDate() + DAY_DIFF_AFLAC);
        COVERAGE_START_CONTROL.patchValue(coverageStartDate);
        if (this.planYearToPopulate && this.planYearToPopulate.coveragePeriod.effectiveStarting) {
            COVERAGE_START_CONTROL.patchValue(this.dateService.toDate(this.planYearToPopulate.coveragePeriod.effectiveStarting));
        }
        this.populateEndDate(COVERAGE_START_CONTROL.value);
    }
    /**
     * This method will be called on selection change of coverage start dates of plan-year restricted plans
     * @param startDate is current input date-field value, used to compare with existing value
     * and sets @var dateUpdatedMessage value accordingly.
     *
     * This method contains @var dateUpdatedMessage which will set to true on change of coverage-dates drop-down
     */
    onChange(startDate: string): void {
        const inputStartDate = startDate ? this.dateService.getOneDayLessThanYear(this.dateService.toDate(startDate)) : null;
        this.dateUpdatedMessage = false;
        if (
            this.createPlanYearForm.get("coveragePeriod").get("expiresAfter").value &&
            inputStartDate &&
            this.createPlanYearForm.get("coveragePeriod").get("expiresAfter").value.valueOf() !== inputStartDate.valueOf()
        ) {
            this.dateUpdatedMessage = true;
        }
    }

    /**
     * This method will be called on mat-radio change for existing plan year and create new plan year
     * @param event is MatRadioChange event which is captured on change of radio button
     */
    onRadioChange(event: MatRadioChange): void {
        this.radioEvent = event.value;
        if (this.radioEvent === NEW_PY_RADIO_VALUE) {
            this.planYearform.controls.existingPlanYearValue.patchValue(null);
            this.planYearform.controls.existingPlanYear.patchValue(this.radioEvent);
            this.createPlanYearForm.reset();
            this.createPlanYearForm.enable();
            if (this.isQ60 && this.isGIEnrollmentDatesOn) {
                this.enrollmentDateGroup.controls?.guaranteedIssueEffectiveStarting?.disable();
            }
            if (this.isVspAloneInPostTax) {
                this.createPlanYearForm.controls?.coverageStartFunction?.patchValue(this.coverageStartDateOptions[0].value);
            } else {
                this.createPlanYearForm.controls?.coverageStartFunction?.patchValue(
                    this.coverageStartDateOptions[FIRST_DATE_OF_MONTH_ONE_DAY].value,
                );
            }
        } else if (this.radioEvent === EXISTING_PY_RADIO_VALUE) {
            this.defaultPlanYear =
                this.existingPlanYears.length === this.PLAN_YEAR_LENGTH ? this.existingPlanYears[this.FIRST_PLAN_YEAR_INDEX].id : undefined;
            this.prePopulatedSelectedPlanYearForm();
        }
    }
    /**
     * compare with previous plan year with current plan year
     * @returns boolean if matching with previous plan year
     */
    comparePreviousPlan(): boolean {
        let isDuplicatePlanYear = false;
        if (this.planYearform.controls.existingPlanYear.value === CREATE_PLAN_YEAR_FORM) {
            if (
                this.unapprovedPlanYears.length &&
                this.unapprovedPlanYears.some((planYear) => planYear.name === this.createPlanYearForm.controls.name.value)
            ) {
                isDuplicatePlanYear = true;
            } else if (this.approvedPlanYears.some((planYear) => this.createPlanYearForm.controls.name.value === planYear.name)) {
                isDuplicatePlanYear = false;
            }
        } else {
            isDuplicatePlanYear = this.planYearOptions.some(
                (planYear) =>
                    this.createPlanYearForm.controls.name.value === planYear.viewValue && planYear.type === PlanYearType.AFLAC_INDIVIDUAL,
            );
        }
        return isDuplicatePlanYear;
    }

    /**
     * To check the date field are altered or not for same plan
     * @returns boolean if daterange is same as matched previous planyear
     */
    isDateRangeSame(): boolean {
        return (
            this.dateService.isEqual(
                (this.createPlanYearForm.controls.coveragePeriod as FormGroup).controls.effectiveStarting.value,
                this.planYearToPopulate.coveragePeriod.effectiveStarting,
            ) &&
            this.dateService.isEqual(
                (this.createPlanYearForm.controls.coveragePeriod as FormGroup).controls.expiresAfter.value,
                this.planYearToPopulate.coveragePeriod.expiresAfter,
            ) &&
            (this.createPlanYearForm.controls.enrollmentPeriod as FormGroup).controls.effectiveStarting.value ===
                this.planYearToPopulate.enrollmentPeriod.effectiveStarting &&
            (this.createPlanYearForm.controls.enrollmentPeriod as FormGroup).controls.expiresAfter.value ===
                this.planYearToPopulate.enrollmentPeriod.expiresAfter
        );
    }

    /**
     * API to update the existing plan with altered dates
     * @param updateChoice whether changes apply for all plans or not
     */
    updateExistingPlanYear(updateChoice: boolean): void {
        if (this.createPlanYearForm.invalid && this.selectedPlanYearForm.invalid) {
            this.isLoading = false;
            return;
        }
        const planYearPayload = this.constructPlanYearPayload();
        if (!this.planYearId) {
            this.planYearId = this.planYearOptions
                .filter(
                    (planYear) =>
                        this.createPlanYearForm.controls.name.value === planYear.viewValue &&
                        planYear.type === PlanYearType.AFLAC_INDIVIDUAL,
                )
                .pop().value;
        }
        this.subscriptions.push(
            this.benefitsOfferingService
                .updatePlanYear(planYearPayload, this.mpGroup, this.planYearId)
                .pipe(
                    switchMap(() => {
                        if (this.coveragePeriodNonAflacPlanList.length && this.exceptions.length) {
                            return this.benefitsOfferingService.updatePlanYearVasExceptions(this.planYearId, this.mpGroup);
                        }
                        return of(EMPTY);
                    }),
                    tap((resp) => {
                        if (updateChoice === true) {
                            this.updateAllPRPlanChoices();
                        }
                    }),
                    catchError((errorResp) => {
                        if (this.dialogOpen) {
                            this.dialogError = true;
                        } else {
                            this.error = true;
                            this.scrollInToMonAlertFlag = true;
                        }
                        if (errorResp.status === AppSettings.API_RESP_400 && errorResp.error.code === AppSettings.BADPARAMETER) {
                            if (errorResp.error.details) {
                                for (const detail of errorResp.error["details"]) {
                                    this.fieldErrorMessage = this.language.fetchSecondaryLanguageValue(
                                        `secondary.portal.benefitsOffering.
                                    ${errorResp.error.status}.${detail.code}.${detail.field}`,
                                    );
                                }
                            } else {
                                this.fieldErrorMessage =
                                    this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.fieldValidationError"];
                            }
                        } else if (errorResp.status === AppSettings.API_RESP_409 && errorResp.error.code === AppSettings.DUPLICATE) {
                            this.fieldErrorMessage = this.languageSecondStringsArray["secondary.portal.benefitsOffering.duplicatePlanYear"];
                        } else {
                            this.fieldErrorMessage = this.language.fetchSecondaryLanguageValue(
                                `secondary.api.${errorResp.error.status}.${errorResp.error.code}`,
                            );
                        }
                        this.isLoading = false;
                        return of(null);
                    }),
                )
                .subscribe(),
        );
    }
    /**
     * constructing payload for plan year API call
     * @returns plan year details for payload
     */
    constructPlanYearPayload(): PlanYear {
        if (
            this.planYearform.controls.existingPlanYear.value === EXISTING_PLAN_YEAR &&
            this.existingPlanYears.length &&
            !this.selectedPlanYearForm?.controls.enrollmentPeriod?.value
        ) {
            const selectedPlanYear = this.existingPlanYears.find((py) => py.id === this.planYearform.controls.existingPlanYearValue.value);
            return {
                coveragePeriod: selectedPlanYear.coveragePeriod,
                name: selectedPlanYear.name,
                enrollmentPeriod: selectedPlanYear.enrollmentPeriod,
                type: selectedPlanYear.type,
            };
        }
        const enrollmentPeriod: EnrollmentPeriod = {
            effectiveStarting: this.datepipe.transform(
                this.dateService.toDate(this.enrollmentDateGroup.controls[EFFECTIVE_STARTING].value),
                DateFormats.YEAR_MONTH_DAY,
            ),
            expiresAfter: this.datepipe.transform(
                this.dateService.toDate(this.enrollmentDateGroup.controls[EXPIRES_AFTER].value),
                DateFormats.YEAR_MONTH_DAY,
            ),
            guaranteedIssueEffectiveStarting:
                this.isGIEnrollmentDatesOn && this.isQ60
                    ? this.dateService.format(
                          this.enrollmentDateGroup.controls[DateInfo.GI_EFFECTIVE_STARTING].value,
                          DateFormats.YEAR_MONTH_DAY,
                      )
                    : null,
            guaranteedIssueExpiresAfter:
                this.isGIEnrollmentDatesOn && this.isQ60
                    ? this.dateService.format(
                          this.enrollmentDateGroup.controls[DateInfo.GI_EXPIRES_AFTER].value,
                          DateFormats.YEAR_MONTH_DAY,
                      )
                    : null,
        };
        const coveragePeriod: CoveragePeriod = {
            effectiveStarting: this.datepipe.transform(
                this.dateService.toDate(this.coverageDateGroup.controls["effectiveStarting"].value),
                DateFormats.YEAR_MONTH_DAY,
            ),
            expiresAfter: this.datepipe.transform(
                this.dateService.toDate(this.coverageDateGroup.controls["expiresAfter"].value),
                DateFormats.YEAR_MONTH_DAY,
            ),
        };
        if (
            this.selectedPlanYearForm?.controls.enrollmentPeriod?.value &&
            this.planYearform.controls.existingPlanYear.value === EXISTING_PLAN_YEAR
        ) {
            return {
                coveragePeriod: coveragePeriod,
                name: this.selectedPlanYearForm.controls[NAME].value,
                enrollmentPeriod: enrollmentPeriod,
                type: PlanYearType.AFLAC_INDIVIDUAL,
            };
        }
        return {
            coveragePeriod: coveragePeriod,
            name: this.createPlanYearForm.controls[NAME].value,
            enrollmentPeriod: enrollmentPeriod,
            type: PlanYearType.AFLAC_INDIVIDUAL,
        };
    }
    /**
     * validation for coverage start date of non aflac plan
     * @param control Form control to take the coverage start date value
     * @returns CoverageStartDate
     */
    checkCoverageStartDateForNonAflac(control: FormControl): CoverageStartDate | undefined {
        if (control.value) {
            const date = new Date();
            let errorType = null;
            const enrollmentEnddate = this.dateService.toDate(this.enrollmentDateGroupForNonAflac?.controls[EXPIRES_AFTER].value || "");
            const enrollmentStartDate = this.dateService.toDate(
                this.enrollmentDateGroupForNonAflac?.controls[EFFECTIVE_STARTING].value || "",
            );
            const inputStartDate = this.dateService.toDate(control.value);
            const sixMonthsFromEnrollmentStartDate = this.dateService.toDate(enrollmentStartDate);
            sixMonthsFromEnrollmentStartDate?.setMonth(sixMonthsFromEnrollmentStartDate.getMonth() + SIX_MONTHS);
            sixMonthsFromEnrollmentStartDate?.setDate(sixMonthsFromEnrollmentStartDate.getDate() - FIRST_DATE_OF_MONTH_ONE_DAY);
            this.maxCoverageStartDate = this.dateService.toDate(sixMonthsFromEnrollmentStartDate);
            if (inputStartDate > sixMonthsFromEnrollmentStartDate && !this.contiguousValue) {
                errorType = { shouldBe180DaysFromToday: true };
            }

            this.checkApprovalForCoverageStartDelay(inputStartDate);

            if (!this.isNonAflacIndividualCafeteriaVasOnly && !this.isVasPlan) {
                const fifteenDaysFromEnrollmentEndDate = this.dateService.toDate(enrollmentEnddate);
                fifteenDaysFromEnrollmentEndDate?.setDate(fifteenDaysFromEnrollmentEndDate.getDate() + DAY_DIFF_NON_AFLAC);
                this.minDateCoverageNonAflac = this.dateService.toDate(fifteenDaysFromEnrollmentEndDate);
                this.enrollmentDifferenceInDays = this.onlyADVGroupPlansPresent ? DAY_DIFF_NON_AFLAC_ADV : DAY_DIFF_NON_AFLAC;
            } else {
                const oneDayFromEnrollmentEndDate = this.dateService.toDate(enrollmentEnddate);
                oneDayFromEnrollmentEndDate?.setDate(oneDayFromEnrollmentEndDate.getDate() + FIRST_DATE_OF_MONTH_ONE_DAY);
                this.minDateCoverageNonAflac = this.dateService.toDate(oneDayFromEnrollmentEndDate);
                this.enrollmentDifferenceInDays = DAY_DIFF_AFLAC;
            }
            inputStartDate.setHours(0, 0, 0);
            date.setHours(0, 0, 0);
            if (this.dateService.isBefore(inputStartDate, date) && !this.contiguousValue) {
                errorType = { pastDate: true };
            }
            if (inputStartDate.getDate() !== FIRST_DATE_OF_MONTH_ONE_DAY && !this.isNonAflacIndividualCafeteriaVasOnly && !this.isVasPlan) {
                errorType = { shouldBeFirstDateOfMonth: true };
            }
            if (
                errorType === null &&
                !this.isCoverageDateError &&
                enrollmentEnddate &&
                this.dateService.getDifferenceInDays(inputStartDate, this.dateService.toDate(enrollmentEnddate)) <
                    (this.dialogOpen ? this.enrollmentDifferenceInDaysForModal : this.enrollmentDifferenceInDays) &&
                !this.contiguousValue
            ) {
                errorType = { minimumDays: true };
            }
            return errorType;
        }
        return undefined;
    }

    /**
     * Check if input start date is more than three months after enrollment start date. If so,
     * check for preexisting approval. If it does not exist, open approval modal; continue, otherwise.
     *
     * @param startDate coverage start date used to compare against enrollment start date
     */
    checkApprovalForCoverageStartDelay(startDate: Date): void {
        const threeMonthsFromEnrollmentStartDate = this.dateService.toDate(
            this.enrollmentDateGroupForNonAflac.controls[EFFECTIVE_STARTING].value || "",
        );
        threeMonthsFromEnrollmentStartDate?.setMonth(threeMonthsFromEnrollmentStartDate.getMonth() + THREE_MONTHS);
        threeMonthsFromEnrollmentStartDate?.setDate(threeMonthsFromEnrollmentStartDate.getDate() - FIRST_DATE_OF_MONTH_ONE_DAY);
        this.approvalModelOpen = false;
        this.approvalModelOpen = startDate > threeMonthsFromEnrollmentStartDate && !this.approveReceived;
    }

    /**
     * To validate enrollment end date of non-aflac plans should be greater than effective starting date
     * @param control Form control to take the enrollment end date value
     * @returns ValidationErrors
     */
    checkEnrollemtEndDateForNonAflac(control: FormControl): ValidationErrors {
        let errorType = null;
        if (control.value) {
            let date = new Date();
            const inputDate = this.dateService.toDate(control.value);
            if (this.enrollmentDateGroupForNonAflac && this.enrollmentDateGroupForNonAflac.controls[EFFECTIVE_STARTING].value) {
                date = this.dateService.toDate(this.enrollmentDateGroupForNonAflac.controls[EFFECTIVE_STARTING].value);
                this.checkForEnrollmentDates(date, inputDate, false, false);
            }
            if (!inputDate || isNaN(inputDate.getTime())) {
                this.dateUpdatedMessage = false;
                errorType = { requirement: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            if (inputDate < date) {
                this.dateUpdatedMessage = false;
                errorType = { invalidEndDate: true };
            }
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            if (this.dateService.isBefore(inputDate, currentDate)) {
                this.dateUpdatedMessage = false;
                errorType = { pastDate: true };
            }
            if (!this.contiguousValue) {
                this.populateCoverageEndDateForNonAflacPlan(this.enrollmentDateGroupForNonAflac.controls.expiresAfter.value);
            }
            if (this.isCoverageDateError) {
                return { invalid: true };
            }
            if (this.contiguousValue && this.validateCoverageStartDateForNonAflac(inputDate)) {
                errorType = { minimumDays: true };
            }
            if (
                this.allPlanYears &&
                this.nonAflacPlanYearToPopulate &&
                this.nonAflacPlan.value.coverageDateGroupForNonAflac.effectiveStarting ===
                    this.nonAflacPlanYearToPopulate.coveragePeriod.effectiveStarting
            ) {
                this.dateUpdatedMessage = false;
            }
            if (this.validateEnrollmentEndDate(inputDate)) {
                errorType = { contiguous: true };
            }
        }
        return errorType;
    }
    /**
     * validation for coverage end date value for non aflac plan
     * @param control Form control to take the coverage end date value
     * @returns ValidationErrors
     */
    checkCoverageEndDateForNonAflac(control: FormControl): ValidationErrors | null {
        if (control.value) {
            let date = new Date();
            if (this.coverageDateGroupForNonAflac) {
                date = this.dateService.toDate(this.coverageDateGroupForNonAflac.controls[EFFECTIVE_STARTING].value);
            }
            const inputDate = this.dateService.toDate(control.value);
            if (!inputDate) {
                return { requirement: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            if (this.dateService.isBefore(inputDate)) {
                return { pastDate: true };
            }
            if (inputDate < date) {
                return { beforeCoverageStartDate: true };
            }
            return null;
        }
        return null;
    }
    /**
     * Function will populate the dropdown of dates with 1st of month for non aflac plans
     * @param date Based on date populate the date dropdown to have the difference of enrollment end date and coverage start date
     */
    populateCoverageEndDateForNonAflacPlan(date?: Date): void {
        this.dateArrayForNonAflac = [];
        this.isCoverageDateError = false;
        let indexToPopulate = 0;
        date = date ? date : new Date();
        this.setNonAflacDateOptions(date);
        if (!this.isNonAflacIndividualCafeteriaVasOnly && !this.isVasPlan) {
            if (this.nonAflacPlan.controls.enrollmentDateGroupForNonAflac.valid) {
                const enrollmentEnddate = this.dateService.toDate(this.enrollmentDateGroupForNonAflac.controls[EXPIRES_AFTER].value);
                const isCoverageDate = this.dateArrayForNonAflac.filter((dateStr) => {
                    const dateItem = this.dateService.toDate(dateStr);
                    return this.dateService.getDifferenceInDays(dateItem, enrollmentEnddate) > FIRST_DATE_OF_MONTH_ONE_DAY;
                });
                if (isCoverageDate.length === 0) {
                    this.isCoverageDateError = true;
                    this.coverageDateGroupForNonAflac.get(EFFECTIVE_STARTING).setErrors({ minimumDays: false });
                    this.coverageDateGroupForNonAflac.updateValueAndValidity();
                }
            }
            this.dateUpdatedMessage = false;
            if (this.nonAflacPlanYearToPopulate && this.nonAflacPlanYearToPopulate.coveragePeriod.effectiveStarting) {
                const indexToFind = this.dateArrayForNonAflac.findIndex(
                    (dateString) =>
                        dateString ===
                        this.datepipe.transform(
                            this.dateService.toDate(this.nonAflacPlanYearToPopulate.coveragePeriod.effectiveStarting),
                            DateFormats.MONTH_DAY_YEAR,
                        ),
                );
                indexToPopulate = indexToFind !== -1 ? indexToFind : 0;
            }
            const coverageStartDateControl: AbstractControl = (this.nonAflacPlan.controls.coverageDateGroupForNonAflac as FormGroup)
                .controls.effectiveStarting;
            coverageStartDateControl.clearValidators();
            coverageStartDateControl.setValidators([
                Validators.required,
                this.checkDate.bind(this),
                this.checkCoverageStartDateForNonAflac.bind(this),
            ]);
            coverageStartDateControl.patchValue(this.dateArrayForNonAflac[indexToPopulate]);
            coverageStartDateControl.markAsTouched();
            this.populateNonAflacEndDate(this.dateArrayForNonAflac[indexToPopulate]);
        } else {
            this.populateCoverageStartDateForVasOnly(date);
        }
    }
    /**
     * set date options for non aflac plans
     * @params date Based on date populated on date dropdown
     */
    setNonAflacDateOptions(date: Date): void {
        for (let index = 0; index < this.dropDownForNextMonth; index++) {
            this.dateArrayForNonAflac.push(
                this.dateService.getFormattedFirstOfMonths(this.dateService.toDate(date), index + 1, DateFormats.MONTH_DAY_YEAR),
            );
        }
    }
    /**
     * This method is used to check whether BO plans contain Aflac Individual + Pre-tax (Cafeteria) or Vas or both.
     * Based on these variables few conditions for coverage-start date will vary.
     */
    checkAflacVASPlans(): void {
        this.isAflacIndividualCafeteriaVasOnly = false;
        this.isNonAflacIndividualCafeteriaVasOnly = false;
        this.isPreTaxAflac = false;
        const noOfAflacPlans = this.coveragePeriodPRPlansPanelList.filter((plan) => plan.carrier.id === CarrierId.AFLAC).length;
        const noOfVASPlans = this.coveragePeriodNonAflacPlanList.filter((plan) => plan.product.valueAddedService).length;
        if (noOfAflacPlans + noOfVASPlans === this.coveragePeriodPRPlansPanelList.length + this.coveragePeriodNonAflacPlanList.length) {
            this.isAflacIndividualCafeteriaVasOnly = true;
            this.isNonAflacIndividualCafeteriaVasOnly = true;
            this.isPreTaxAflac = true;
        }
        this.configureTPPDates();
        if (noOfVASPlans === this.coveragePeriodNonAflacPlanList.length && !this.coveragePeriodPRPlansPanelList.length) {
            this.coverageDateGroupForNonAflac.controls.expiresAfter.enable();
        }
    }
    /**
     * This method is used to configure coverage-dates according to conditions for TPP account
     */
    configureTPPDates(): void {
        if (this.isTPPAccount && this.coveragePeriodPRPlansPanelList.length) {
            this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.patchValue(true);
            this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.disable();
            this.isThirdPartyCafeteriaAccount = true;
        }
    }
    /**
     * This function will be responsible for populating the end date of non aflac plan with 1 year of ahead of start date
     * @param startDate take the start date of coverage
     * @param event Matselect change attribute passed through whenever the mat select dropdwon gets changes
     */
    populateNonAflacEndDate(startDate: string, event?: MatSelectChange): void {
        if ((startDate && !event) || (event && event.source.selected && startDate)) {
            const inputStartDate = this.dateService.getOneDayLessThanYear(this.dateService.toDate(startDate));
            if (
                this.nonAflacPlanYearToPopulate &&
                this.nonAflacPlanYearToPopulate.coveragePeriod.expiresAfter &&
                +this.dateService.toDate(
                    this.datepipe.transform(this.utilService.getCurrentTimezoneOffsetDate(startDate), AppSettings.DATE_FORMAT),
                ) === +this.dateService.toDate(this.nonAflacPlanYearToPopulate.coveragePeriod.effectiveStarting)
            ) {
                this.coverageDateGroupForNonAflac
                    .get(EXPIRES_AFTER)
                    .patchValue(this.dateService.toDate(this.nonAflacPlanYearToPopulate.coveragePeriod.expiresAfter));
            } else {
                this.coverageDateGroupForNonAflac.get(EXPIRES_AFTER).patchValue(inputStartDate);
            }
            if (this.isRole20User) {
                this.coverageDateGroupForNonAflac.get(EXPIRES_AFTER).enable();
            }
        }
    }
    /**
     * This method is used to populate the coverage start date if the benefit offering contains only VAS products
     * This method will fetch enrollment date and add DAY_DIFF_AFLAC days to it and sets the coverage start date
     * @param date is the date to pre-populate
     */
    populateCoverageStartDateForVasOnly(date?: Date): void {
        date = this.enrollmentDateGroupForNonAflac.controls.expiresAfter.value
            ? this.dateService.toDate(this.enrollmentDateGroupForNonAflac.controls.expiresAfter.value)
            : date;
        const coverageStartDate: Date = this.dateService.toDate(date);
        coverageStartDate.setDate(coverageStartDate.getDate() + DAY_DIFF_AFLAC);
        const coverageStartDateControl: AbstractControl = (this.nonAflacPlan.controls.coverageDateGroupForNonAflac as FormGroup).controls
            .effectiveStarting;
        coverageStartDateControl.clearValidators();
        coverageStartDateControl.setValidators([
            Validators.required,
            this.checkDate.bind(this),
            this.checkCoverageStartDateForNonAflac.bind(this),
        ]);
        coverageStartDateControl.patchValue(coverageStartDate);
        coverageStartDateControl.markAsTouched();
        if (this.nonAflacPlanYearToPopulate && this.nonAflacPlanYearToPopulate.coveragePeriod.effectiveStarting) {
            coverageStartDateControl.patchValue(this.dateService.toDate(this.nonAflacPlanYearToPopulate.coveragePeriod.effectiveStarting));
            if (!this.approvedPlanYears.length) {
                this.continuousPlan.controls.earliestCoverageStart.patchValue(
                    this.nonAflacPlanYearToPopulate.coveragePeriod.effectiveStarting,
                );
            }
        }
        this.populateNonAflacEndDate(coverageStartDateControl.value);
    }
    /**
     * This method will be called on selection change of coverage start dates of non aflac plans
     * @param startDate is current input date-field value, used to compare with existing value
     * and sets @var dateUpdatedMessage value accordingly.
     *
     * This method contains @var dateUpdatedMessage which will set to true on change of coverage-dates drop-down
     */
    onChangeForNonAflac(startDate: string): void {
        const inputStartDate = this.dateService.getOneDayLessThanYear(this.dateService.toDate(startDate));
        this.dateUpdatedMessage = false;
        if (
            this.nonAflacPlan.get("coverageDateGroupForNonAflac").get(EXPIRES_AFTER).value &&
            inputStartDate &&
            this.nonAflacPlan.get("coverageDateGroupForNonAflac").get(EXPIRES_AFTER).value.valueOf() !== inputStartDate.valueOf()
        ) {
            this.dateUpdatedMessage = true;
        }
    }
    /**
     * Update plan year for non aflac plans
     * @param coverageDatePRPanelItem coverage date item
     * @param planYear plan year id
     * @param isVas vas product or not
     * @param control plan year control
     */
    updatePlanYearForNonAflac(
        coverageDatePRPanelItem: CoveragePeriodPanel,
        planYear: number,
        isVas: boolean,
        control?: AbstractControl,
    ): void {
        this.coveragePeriodNonAflacPlanList[this.coveragePeriodNonAflacPlanList.indexOf(coverageDatePRPanelItem)].plans.forEach((plan) => {
            const planChoice: PlanChoice = {
                agentAssisted: plan.planChoice.agentAssisted,
                cafeteria: plan.planChoice.cafeteria,
                continuous: false,
                id: plan.planChoice.id,
                planId: plan.planChoice.plan.id,
                plan: plan.planChoice.plan,
                planYearId: planYear,
                taxStatus: plan.planChoice.taxStatus,
            };
            const duplicateChoice = this.nonAflacPlanChoicesToBeUpdated.filter((choice) => choice.id === plan.planChoice.id).pop();
            if (duplicateChoice) {
                this.nonAflacPlanChoicesToBeUpdated.splice(this.nonAflacPlanChoicesToBeUpdated.indexOf(duplicateChoice), 1);
            }
            this.nonAflacPlanChoicesToBeUpdated.push(planChoice);
        });
        if (control && !isVas) {
            const planYearToPopulate: PlanYear = this.allPlanYears.filter((planYearValue) => planYearValue.id === planYear).pop();
            if (
                this.dateService.getDifferenceInDays(
                    this.dateService.toDate(planYearToPopulate.coveragePeriod.effectiveStarting),
                    this.dateService.toDate(planYearToPopulate.enrollmentPeriod.expiresAfter),
                ) < (this.onlyADVGroupPlansPresent ? DAY_DIFF_NON_AFLAC_ADV : DAY_DIFF_NON_AFLAC)
            ) {
                control.setErrors({ minimumDays: true });
            }
        }
    }
    /**
     * update coverage dates for non aflac plans
     */
    updateCoverageDatesForNonAflacPlan(): void {
        if (
            this.nonAflacPlanForm.controls.sameCoveragePlanDate &&
            this.nonAflacPlanForm.controls.sameCoveragePlanDate.value &&
            !this.comparePreviousNonAflacPlan() &&
            !(
                this.createdNonAflacPlanYearValue &&
                JSON.stringify(this.nonAflacPlan.value) === JSON.stringify(this.createdNonAflacPlanYearValue)
            )
        ) {
            this.createNonAflacPlanYear(true);
        } else if (
            this.nonAflacPlanForm.controls.sameCoveragePlanDate &&
            this.nonAflacPlanForm.controls.sameCoveragePlanDate.value &&
            ((this.comparePreviousNonAflacPlan() && !this.nonAflacPlanYearToPopulate) ||
                (this.comparePreviousNonAflacPlan() && !this.isDateRangeSameForNonAflac()))
        ) {
            this.updateExistingNonAflacPlanYear(true);
        } else if (this.nonAflacPlanForm.controls.sameCoveragePlanDate.value) {
            this.updateAllNonAflacPlanChoices();
        } else {
            this.updateAllNonAflacPlanChoiceToServer();
        }
    }
    /**
     * update all non aflac plan choices to server
     */
    updateAllNonAflacPlanChoiceToServer(): void {
        const nonAflacPlanChoicesToBeUpdatedToServer: Observable<void>[] = [];
        const updatedNonAflacPlanChoices: Observable<void>[] = [];
        const approvedPlanChoices: PlanChoice[] = this.utilService.copy(this.store.selectSnapshot(BenefitsOfferingState.getPlanChoices));
        if (this.nonAflacPlanChoicesToBeUpdated.length <= 0) {
            this.quasiService.defaultStepPositionChanged$.next(CARRIER_FORM_STEP);
        } else {
            this.nonAflacPlanChoicesToBeUpdated.forEach((choice) => {
                if (!approvedPlanChoices.some((plan) => plan.id === choice.id)) {
                    nonAflacPlanChoicesToBeUpdatedToServer.push(this.benefitsOfferingService.updatePlanChoice(choice, this.mpGroup));
                    const existingPlanChoice = this.quasiService.checkExistingPlanChoice(choice);
                    if (existingPlanChoice) {
                        updatedNonAflacPlanChoices.push(
                            this.benefitsOfferingService
                                .updatePlanChoice(this.quasiService.getCreatePlanChoiceObject(existingPlanChoice), this.mpGroup)
                                .pipe(catchError((error) => of(error))),
                        );
                    }
                }
            });
            if (nonAflacPlanChoicesToBeUpdatedToServer.length) {
                forkJoin(nonAflacPlanChoicesToBeUpdatedToServer)
                    .pipe(
                        takeUntil(this.unsubscribe$),
                        finalize(() => {
                            this.isLoading = false;
                        }),
                    )
                    .subscribe(
                        (resp) => {
                            this.quasiService.defaultStepPositionChanged$.next(CARRIER_FORM_STEP);
                            this.quasiService.setPlansChoices(updatedNonAflacPlanChoices);
                        },
                        (error) => {
                            this.error = true;
                        },
                    );
            } else {
                this.isLoading = false;
                this.quasiService.defaultStepPositionChanged$.next(CARRIER_FORM_STEP);
            }
            this.updateChoicesToStore(this.nonAflacPlanChoicesToBeUpdated);
        }
    }
    /**
     * updated plan choices to store
     * @param planChoicesToBeUpdated plan choices to be updated
     */
    updateChoicesToStore(planChoicesToBeUpdated: PlanChoice[]): void {
        if (planChoicesToBeUpdated.length) {
            if (this.planYearChoice === null && this.data.opensFrom !== "plans") {
                this.store.dispatch(new MapPlanChoicesToPlans(planChoicesToBeUpdated));
            } else {
                this.store.dispatch(new MapPlanChoicesToNewPlanYearPanel(planChoicesToBeUpdated));
            }
        }
    }
    /**
     * update all non aflac plan choices
     */
    updateAllNonAflacPlanChoices(): void {
        if (this.nonAflacPlanForm.controls.sameCoveragePlanDate && this.nonAflacPlanForm.controls.sameCoveragePlanDate.value) {
            this.nonAflacPlanChoicesToBeUpdated = [];
            this.coveragePeriodNonAflacPlanList.forEach((panelItem) => {
                panelItem.plans.forEach((plan) => {
                    const planChoice: PlanChoice = {
                        agentAssisted: plan.planChoice.agentAssisted,
                        cafeteria: plan.planChoice.cafeteria,
                        continuous: false,
                        id: plan.planChoice.id,
                        planId: plan.planChoice.plan.id,
                        plan: plan.planChoice.plan,
                        planYearId: this.nonAflacPlanYearId,
                        taxStatus: plan.planChoice.taxStatus,
                    };
                    this.nonAflacPlanChoicesToBeUpdated.push(planChoice);
                });
            });
        }
        this.updateAllNonAflacPlanChoiceToServer();
    }
    /**
     * update existing plan year for non aflac plans
     * @param updateChoice to check for updation
     */
    updateExistingNonAflacPlanYear(updateChoice: boolean): void {
        if (this.nonAflacPlan.invalid) {
            return;
        }
        const planYearPayload = this.constructPlanyearPayloadForNonAflac();
        if (!this.nonAflacPlanYearId) {
            this.nonAflacPlanYearId = this.nonAflacPlanYearOptions
                .filter(
                    (planYear) => this.nonAflacPlan.value.name === planYear.viewValue && planYear.type === PlanYearType.AFLAC_INDIVIDUAL,
                )
                .pop().value;
        }
        this.benefitsOfferingService
            .updatePlanYear(planYearPayload, this.mpGroup, this.nonAflacPlanYearId)
            .pipe(
                switchMap((response) => {
                    if (updateChoice) {
                        this.updateAllNonAflacPlanChoices();
                    }
                    if (this.exceptions.length) {
                        return this.benefitsOfferingService.updatePlanYearVasExceptions(this.nonAflacPlanYearId, this.mpGroup);
                    }
                    return EMPTY;
                }),
                catchError((error) => {
                    this.setErrorResponse(error);
                    return of(null);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * set the error response for invalid dates
     * @param error
     */
    setErrorResponse(error: Error): void {
        this.isLoading = false;
        const errorResp = error["error"];
        if (this.dialogOpen) {
            this.dialogError = true;
        } else {
            this.error = true;
            this.scrollInToMonAlertFlag = true;
        }
        if (errorResp.status === AppSettings.API_RESP_400 && errorResp.code === AppSettings.BADPARAMETER) {
            if (errorResp.details) {
                for (const detail of errorResp["details"]) {
                    this.fieldErrorMessage = this.language.fetchSecondaryLanguageValue(
                        `secondary.portal.benefitsOffering.${errorResp.status}.${detail.code}.${detail.field}`,
                    );
                }
            } else {
                this.fieldErrorMessage =
                    this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.fieldValidationError"];
            }
        } else if (errorResp.status === AppSettings.API_RESP_409 && errorResp.code === AppSettings.DUPLICATE) {
            this.fieldErrorMessage = this.languageSecondStringsArray["secondary.portal.benefitsOffering.duplicatePlanYear"];
        } else {
            this.fieldErrorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${errorResp.status}.${errorResp.code}`);
        }
    }
    /**
     * set plan year value for non aflac plans
     * @returns planYear object for payload
     */
    constructPlanyearPayloadForNonAflac(): PlanYear {
        const enrollmentPeriod: EnrollmentPeriod = {
            effectiveStarting: this.datepipe.transform(
                this.dateService.toDate(this.enrollmentDateGroupForNonAflac.controls[EFFECTIVE_STARTING].value),
                DateFormats.YEAR_MONTH_DAY,
            ),
            expiresAfter: this.datepipe.transform(
                this.dateService.toDate(this.enrollmentDateGroupForNonAflac.controls[EXPIRES_AFTER].value),
                DateFormats.YEAR_MONTH_DAY,
            ),
        };
        const coveragePeriod: CoveragePeriod = {
            effectiveStarting: this.datepipe.transform(
                this.dateService.toDate(this.coverageDateGroupForNonAflac.controls[EFFECTIVE_STARTING].value),
                DateFormats.YEAR_MONTH_DAY,
            ),
            expiresAfter: this.datepipe.transform(
                this.dateService.toDate(this.coverageDateGroupForNonAflac.controls[EXPIRES_AFTER].value),
                DateFormats.YEAR_MONTH_DAY,
            ),
        };
        return {
            coveragePeriod: coveragePeriod,
            name: this.nonAflacPlan.controls[NAME].value,
            enrollmentPeriod: enrollmentPeriod,
            type: PlanYearType.AFLAC_INDIVIDUAL,
        };
    }
    /**
     * compare previous non aflac plans
     * @returns a boolean which represents whether planYear is existing or not
     */
    comparePreviousNonAflacPlan(): boolean {
        if (this.nonAflacPlan.value.name) {
            return this.nonAflacPlanYearOptions.some(
                (planYear) =>
                    this.nonAflacPlan.value.name.toLowerCase() === planYear.viewValue.toLowerCase() &&
                    planYear.type === PlanYearType.AFLAC_INDIVIDUAL,
            );
        }
        return false;
    }
    /**
     * create a plan year for non aflac plans
     * @param updateChoice to check for updation
     */
    createNonAflacPlanYear(updateChoice: boolean): void {
        if (this.nonAflacPlan.invalid) {
            return;
        }
        const planYear = this.constructPlanyearPayloadForNonAflac();
        this.benefitsOfferingService
            .savePlanYear(planYear, this.mpGroup)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((resp) => {
                    const location: string = resp.headers.get("location");
                    const stringArray = location.split("/");
                    this.nonAflacPlanYearId = Number(stringArray[stringArray.length - 1]);
                    this.quasiService.setCreatedPlanYear(
                        this.benefitsOfferingService
                            .deletePlanYear(this.mpGroup, this.nonAflacPlanYearId)
                            .pipe(catchError((error) => of(error))),
                    );
                    this.store.dispatch(new SetNewPlanYearValue(true));
                    if (!this.createdNonAflacPlanYearValue) {
                        this.createdNonAflacPlanYearValue = this.nonAflacPlan.value;
                    }
                    if (updateChoice) {
                        this.updateAllNonAflacPlanChoices();
                    }
                    this.dialogError = false;
                    if (this.dialogOpen && this.data.opensFrom !== this.COPY_NEW_PLAN_YEAR_CONSTANT) {
                        this.getPlanYears(true);
                        this.closeModal();
                    }
                }),
                switchMap((resp) => {
                    const apiCalls: (Observable<PlanYear> | Observable<HttpResponse<void>>)[] = [];
                    if (this.dialogOpen && this.data.opensFrom === this.COPY_NEW_PLAN_YEAR_CONSTANT) {
                        apiCalls.push(this.benefitsOfferingService.getPlanYear(this.nonAflacPlanYearId, this.mpGroup));
                    }
                    if (updateChoice && this.exceptions.length) {
                        apiCalls.push(this.benefitsOfferingService.updatePlanYearVasExceptions(this.nonAflacPlanYearId, this.mpGroup));
                    }
                    if (apiCalls.length) {
                        return forkJoin(apiCalls);
                    }
                    return of([]);
                }),
                filter(
                    (resp) => resp && resp.length && resp[0] && this.dialogOpen && this.data.opensFrom === this.COPY_NEW_PLAN_YEAR_CONSTANT,
                ),
                catchError((errorResp) => {
                    this.setErrorResponse(errorResp);
                    return EMPTY;
                }),
                tap((response) => {
                    const resp: PlanYear = response[0];
                    this.allPlanYears.push(resp);
                    this.closeModal();
                    this.nonAflacPlanYearOptions.push({
                        value: resp.id,
                        viewValue: resp.name,
                        coveragePeriod: planYear.coveragePeriod,
                        type: PlanYearType.AFLAC_INDIVIDUAL,
                    });
                    this.setPlanYearForEachNonAflacPlan();
                }),
            )
            .subscribe();
    }
    /**
     * To check whether the date field is altered or not for the same plan of non aflac plans
     * @returns boolean
     */
    isDateRangeSameForNonAflac(): boolean {
        return (
            this.dateService.isEqual(
                this.nonAflacPlan.value.coverageDateGroupForNonAflac.effectiveStarting || "",
                this.nonAflacPlanYearToPopulate.coveragePeriod.effectiveStarting || "",
            ) &&
            this.dateService.isEqual(
                this.nonAflacPlan.value.coverageDateGroupForNonAflac.expiresAfter || "",
                this.nonAflacPlanYearToPopulate.coveragePeriod.expiresAfter || "",
            ) &&
            this.nonAflacPlan.value.enrollmentDateGroupForNonAflac.effectiveStarting ===
                this.nonAflacPlanYearToPopulate.enrollmentPeriod.effectiveStarting &&
            this.nonAflacPlan.value.enrollmentDateGroupForNonAflac.expiresAfter ===
                this.nonAflacPlanYearToPopulate.enrollmentPeriod.expiresAfter
        );
    }
    /**
     * validations for earliest coverage start date of continuous aflac plans
     * @param control Form control to take the earliest coverage start date value
     * @returns ValidationErrors
     */
    checkEarliestCoverageStartDate(control: FormControl): ValidationErrors | null {
        if (control.value) {
            const date: Date = new Date();
            const enrollmentStartDate: Date = this.dateService.toDate(this.continuousPlan.get("enrollmentStartDate").value);
            const inputDate: Date = this.dateService.toDate(control.value);
            if (!inputDate || isNaN(inputDate.getTime())) {
                return { required: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            if (this.dateService.isBefore(inputDate, date)) {
                return { pastDate: true };
            }
            if (
                inputDate < date ||
                (inputDate.getDate() - date.getDate()) / (MILLISECONDS * SECONDS * MINUTES_IN_HOUR * HOURS_PER_DAY) >=
                    NO_OF_DAYS_IN_SIX_MONTHS
            ) {
                return { invalid: true };
            }
            if (inputDate <= enrollmentStartDate) {
                return { beforeEnrollmentStartDate: true };
            }
            return null;
        }
        return null;
    }
    /**
     * set minimum coverage date value on non aflac date update
     */
    onNonAflacDatesUpdated(): void {
        if (this.isVasPlan || this.isNonAflacIndividualCafeteriaVasOnly) {
            const minDate = this.dateService.toDate(this.enrollmentDateGroupForNonAflac.controls[EXPIRES_AFTER].value);
            minDate.setDate(minDate.getDate() + DAY_DIFF_AFLAC);
            this.minDateCoverageNonAflac = this.dateService.toDate(minDate);
        } else {
            const minDate = this.dateService.toDate(this.enrollmentDateGroupForNonAflac.controls[EXPIRES_AFTER].value);
            minDate.setDate(minDate.getDate() + DAY_DIFF_NON_AFLAC);
            this.minDateCoverageNonAflac = this.dateService.toDate(minDate);
        }
    }
    /**
     * this function will push planYears to all PlanYears array
     * @param planYears are the planYears to be added to all planYears array
     */
    updateAllPlanYears(planYears: PlanYear[]): void {
        planYears.forEach((planYear) => {
            this.allPlanYears.push(planYear);
        });
    }
    /**
     * Updates continuous form values based on plan year data
     */
    updateContinuousOnlyDates(): void {
        // getting earliest plan year
        this.earliestPlanYear = this.utilService
            .copy(this.approvedPlanYears)
            .sort((planYear1, planYear2) => planYear2.id - planYear1.id)
            .pop();
        // checking if coverage dates is completed
        this.coveragePeriodContinuousPlansPanelList.forEach((panelItem) => {
            const continuousPlan: PlanPanelModel = panelItem.plans
                .filter((plan) => plan.planChoice.enrollmentPeriod && plan.planChoice.coverageStartFunction)
                .pop();
            if (!this.continuousPlanDatesToCompare && continuousPlan) {
                this.continuousPlanDatesToCompare = {
                    enrollmentStartDate: continuousPlan.planChoice.enrollmentPeriod.effectiveStarting,
                    coverageStartFunction: continuousPlan.planChoice.coverageStartFunction,
                };
            }
            if (!continuousPlan) {
                this.coverageDatesCompleted = false;
            }
        });
        // loading coverage start function
        this.continuousPlan.controls.coverageStartFunction.patchValue(
            this.coverageDatesCompleted
                ? this.continuousPlanDatesToCompare.coverageStartFunction
                : this.isVspAloneInPostTax
                ? this.coverageStartDateOptions[0].value
                : this.coverageStartDateOptions[FIRST_DATE_OF_MONTH_ONE_DAY].value,
        );
        this.hideEarliestCoverageStart();
        // for loading previous selected dates incase of first plan year
        if (
            this.coverageDatesCompleted &&
            this.continuousPlanDatesToCompare &&
            this.utilService.isPastDate(this.continuousPlanDatesToCompare.enrollmentStartDate)
        ) {
            let earlierCoverageStart: Date;
            if (this.coveragePeriodPRPlansPanelList.length) {
                if (this.earliestPlanYear) {
                    earlierCoverageStart = this.utilService.getCurrentTimezoneOffsetDate(
                        this.earliestPlanYear.coveragePeriod.effectiveStarting,
                    );
                } else {
                    const effectiveStarting = this.coverageDateGroup.controls.effectiveStarting.value;
                    earlierCoverageStart = this.utilService.getCurrentTimezoneOffsetDate(effectiveStarting);
                }
            }
            this.continuousPlan.patchValue({
                enrollmentStartDate: this.utilService.getCurrentTimezoneOffsetDate(this.continuousPlanDatesToCompare.enrollmentStartDate),
                earliestCoverageStart: earlierCoverageStart,
            });
        } else {
            // for updating value of enrollmentStartDate
            if (this.earliestPlanYear && this.utilService.isPastDate(this.earliestPlanYear.enrollmentPeriod.effectiveStarting)) {
                this.continuousPlan.controls.enrollmentStartDate.patchValue(this.earliestPlanYear.enrollmentPeriod.effectiveStarting);
            } else {
                this.continuousPlan.controls.enrollmentStartDate.patchValue(
                    this.datepipe.transform(this.currentDate, AppSettings.DATE_FORMAT),
                );
            }
            // for updating value of earliestCoverageStart
            if (this.earliestPlanYear) {
                this.continuousPlan.controls.earliestCoverageStart.patchValue(this.earliestPlanYear.coveragePeriod.effectiveStarting);
            } else {
                this.continuousPlan.controls.earliestCoverageStart.patchValue(
                    this.datepipe.transform(new Date().setDate(new Date().getDate() + 1), AppSettings.DATE_FORMAT),
                );
            }
        }
    }
    /**
     * logic for hiding earliest coverage start date
     */
    hideEarliestCoverageStart(): void {
        if (
            (this.earliestPlanYear && !this.utilService.isPastDate(this.earliestPlanYear.coveragePeriod.effectiveStarting)) ||
            !this.coveragePeriodPRPlansPanelList.length
        ) {
            this.showContinuousCoverageStartDate = false;
        }
    }
    /**
     * updates earliest Coverage start date based on enrollment start date
     * @param control enrollment start date control
     */
    updateCoverageEarlierStartDate(control: AbstractControl): void {
        if (control.valid && control.value && !this.earliestPlanYear && !this.coveragePeriodPRPlansPanelList.length) {
            this.continuousPlan.controls.earliestCoverageStart.patchValue(
                this.datepipe.transform(
                    this.dateService.toDate(control.value).setDate(this.dateService.toDate(control.value).getDate() + 1),
                    AppSettings.DATE_FORMAT,
                ),
            );
        }
    }
    /**
     * condition to set coverage date for only VAS plans
     * @param sameDate boolean value to check coverage date for non aflac plans
     */
    checkForSameCafeteriaDates(sameDate: boolean): void {
        const noOfVASPlans = this.coveragePeriodNonAflacPlanList.filter((plan) => plan.product.valueAddedService).length;
        if (noOfVASPlans !== this.coveragePeriodNonAflacPlanList.length) {
            this.isAflacIndividualCafeteriaVasOnly = !sameDate;
            if (!this.isContiguousDates) {
                this.populateCoverageEnddate(sameDate ? this.enrollmentDateGroup.controls.expiresAfter.value : null);
            } else {
                this.contiguousDatesAddition();
            }
            if (
                this.isContiguousDates &&
                this.enrollmentDateGroup.controls.expiresAfter &&
                this.validateCoverageStartDate(this.dateService.toDate(this.enrollmentDateGroup.controls.expiresAfter.value))
            ) {
                this.enrollmentDateGroup.controls.expiresAfter.setErrors({ minimumDays: true });
            }
        }
    }
    /**
     * enable coverage end date for only VAS plans
     * @param sameDate boolean value
     */
    enableCoverageDate(sameDate: boolean): void {
        if (sameDate && !this.coveragePeriodNonAflacPlanList.every((plan) => plan.product.valueAddedService) && !this.isRole20User) {
            this.coverageDateGroupForNonAflac.controls.expiresAfter.disable();
        }
    }
    /**
     * check validation for enrollment start date
     * @param control enrollment start date control for non aflac
     * @returns ValidationErrors for the control
     */
    checkEnrollmentStartDateForNonAflac(control: FormControl): ValidationErrors {
        if (control.value) {
            let date = new Date();
            const inputDate = this.dateService.toDate(control.value);
            if (this.enrollmentDateGroupForNonAflac && this.enrollmentDateGroupForNonAflac.controls[EXPIRES_AFTER].value) {
                date = this.dateService.toDate(this.enrollmentDateGroupForNonAflac.controls[EXPIRES_AFTER].value);
                this.checkForEnrollmentDates(inputDate, date, false, true);
            }
            if (!inputDate || isNaN(inputDate.getTime())) {
                this.dateUpdatedMessage = false;
                return { requirement: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            if (this.dateService.isBefore(inputDate, currentDate)) {
                this.dateUpdatedMessage = false;
                return { pastDate: true };
            }
            if (inputDate > date && this.enrollmentDateGroupForNonAflac.controls[EXPIRES_AFTER].value) {
                this.dateUpdatedMessage = false;
                return { invalidStartDate: true };
            }
            if (this.validateEnrollmentStartDate(inputDate)) {
                return { contiguous: true };
            }
        }
        return null;
    }
    /**
     * check validation for enrollment start date
     * @param control enrollment start date control for aflac
     * @returns ValidationErrors for the control
     */
    checkEnrollmentStartDate(control: FormControl): ValidationErrors {
        if (control.value) {
            let date = new Date();
            const inputDate = this.dateService.toDate(control.value);
            if (this.enrollmentDateGroup && this.enrollmentDateGroup.controls[EXPIRES_AFTER].value) {
                date = this.dateService.toDate(this.enrollmentDateGroup.controls[EXPIRES_AFTER].value);
                this.checkForEnrollmentDates(inputDate, date, true, true);
            }
            if (!inputDate || isNaN(inputDate.getTime())) {
                this.dateUpdatedMessage = false;
                return { requirement: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            if (this.dateService.isBefore(inputDate, currentDate)) {
                this.dateUpdatedMessage = false;
                return { pastDate: true };
            }
            if (inputDate > date && this.enrollmentDateGroup.controls[EXPIRES_AFTER].value) {
                this.dateUpdatedMessage = false;
                return { invalidStartDate: true };
            }
            if (this.validateEnrollmentStartDate(inputDate)) {
                return { contiguous: true };
            }
            if (this.enrollmentDateGroup.controls[DateInfo.GI_EXPIRES_AFTER]?.value) {
                this.disableGIEnrollmentMinEndDate(control.value);
            }
        }
        return null;
    }
    /**
     * disableGIEnrollmentMinEndDate function is to disable first 5 dates int enrollment end dates by checking enrollment start date.
     * @param enrollStartDate enrollment start date control for aflac
     */
    disableGIEnrollmentMinEndDate(enrollStartDate: Date): void {
        if (!this.isGIEnrollmentDatesOn || !this.isQ60) {
            // config indicator flag is able to toggle on / toggle off for may release.
            return;
        }
        this.giMinDiffDate = this.benefitsOfferingHelperService.disableGIEnrollmentEndDate(
            enrollStartDate,
            DateInfo.GI_MIN_ENROLL_PERIOD_IN_DAYS,
        );
    }
    /**
     * Check for contiguous dates
     * @param enrollmentStartDate enrollment start date value
     * @returns boolean to check for Contiguous plan
     */
    validateEnrollmentStartDate(enrollmentStartDate: Date): boolean {
        this.isCoverageDatesContiguous = this.benefitsOfferingService.getCoverageContiguousDates();
        if (this.isCoverageDatesContiguous && this.isCoverageDatesContiguous.value && this.isCoverageDatesContiguous.date) {
            const coverageStartDate: Date = this.dateService.toDate(this.isCoverageDatesContiguous.date);
            if (
                coverageStartDate <= enrollmentStartDate ||
                this.dateService.getDifferenceInDays(coverageStartDate, enrollmentStartDate) >= NO_OF_DAYS_IN_SIX_MONTHS
            ) {
                return true;
            }
        }
        return false;
    }
    /**
     * Check for contiguous dates
     * @param enrollmentEndDate enrollment end date value
     * @returns boolean to check for Contiguous plan
     */
    validateEnrollmentEndDate(enrollmentEndDate: Date): boolean {
        this.isCoverageDatesContiguous = this.benefitsOfferingService.getCoverageContiguousDates();
        if (this.isCoverageDatesContiguous && this.isCoverageDatesContiguous.value && this.isCoverageDatesContiguous.date) {
            const coverageStartDate: Date = this.dateService.toDate(this.isCoverageDatesContiguous.date);
            if (enrollmentEndDate >= coverageStartDate) {
                return true;
            }
        }
        return false;
    }
    /**
     * Check enrollment start date and end date when either of dates is changed
     * @param startDate enrollment start date
     * @param endDate enrollment end date
     * @param isAflac check if plans are aflac
     * @param isStartDate check if start date is changed
     */
    checkForEnrollmentDates(startDate: Date, endDate: Date, isAflac: boolean, isStartDate: boolean): void {
        if (startDate < endDate && !isStartDate) {
            if (
                isAflac &&
                this.enrollmentDateGroup.controls.effectiveStarting.errors &&
                !this.enrollmentDateGroup.controls.effectiveStarting.errors.contiguous
            ) {
                this.enrollmentDateGroup.controls.effectiveStarting.setErrors(null);
            } else if (
                this.enrollmentDateGroupForNonAflac &&
                this.enrollmentDateGroupForNonAflac.controls.effectiveStarting.errors &&
                !this.enrollmentDateGroupForNonAflac.controls.effectiveStarting.errors.contiguous
            ) {
                this.enrollmentDateGroupForNonAflac.controls.effectiveStarting.setErrors(null);
            }
        }
        if (startDate < endDate && isStartDate) {
            if (isAflac) {
                this.enrollmentDateGroup.controls.expiresAfter.setErrors(null);
            } else if (this.enrollmentDateGroupForNonAflac) {
                this.enrollmentDateGroupForNonAflac.controls.expiresAfter.setErrors(null);
            }
        }
    }
    /**
     * validate coverage start date for contiguous aflac plans on change of enrollment end date
     * @param enrollmentEndDate enrollment end date of aflac plans
     * @returns boolean
     */
    validateCoverageStartDate(enrollmentEndDate: Date): boolean {
        const coverageStartDate = this.dateService.toDate(this.coverageDateGroup.controls.effectiveStarting.value);
        if (
            !this.isAflacIndividualCafeteriaVasOnly &&
            this.dateService.getDifferenceInDays(coverageStartDate, enrollmentEndDate) < DAY_DIFF_NON_AFLAC
        ) {
            this.minimumDayErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.fifteenDaysAfterEnrollmentEndDate"];
            return true;
        }
        if (
            this.isAflacIndividualCafeteriaVasOnly &&
            this.dateService.getDifferenceInDays(coverageStartDate, enrollmentEndDate) < DAY_DIFF_AFLAC
        ) {
            this.minimumDayErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.dateBeforeEnrollmentDate"];
            return true;
        }
        if (
            this.isAflacIndividualCafeteriaVasOnly &&
            this.dateService.getDifferenceInDays(coverageStartDate, enrollmentEndDate) >= DAY_DIFF_AFLAC &&
            this.enrollmentDateGroup.controls.expiresAfter.errors &&
            this.enrollmentDateGroup.controls.expiresAfter.errors.minimumDays
        ) {
            this.enrollmentDateGroup.controls.expiresAfter.setErrors(null);
            return false;
        }
        return false;
    }
    /**
     * validate coverage start date for contiguous non aflac plans on change of enrollment end date
     * @param enrollmentEndDate enrollment end date of non aflac plans
     * @returns boolean
     */
    validateCoverageStartDateForNonAflac(enrollmentEndDate: Date): boolean {
        const coverageStartDate = this.dateService.toDate(this.coverageDateGroupForNonAflac.controls.effectiveStarting.value);
        // If the PY has only ADV plans, then difference should be set as 7 days between coverage start date and enrollment end date
        if (
            this.onlyADVGroupPlansPresent &&
            this.dateService.getDifferenceInDays(coverageStartDate, enrollmentEndDate) < DAY_DIFF_NON_AFLAC_ADV
        ) {
            this.minimumDayErrorMessage = this.languageSecondStringsArray[
                "secondary.portal.benefitsOffering.coveragedates.endDate.overlapping"
            ].replace("#effectivedays", `${DAY_DIFF_NON_AFLAC_ADV}`);
            return true;
        }
        if (
            !this.onlyADVGroupPlansPresent &&
            !this.isNonAflacIndividualCafeteriaVasOnly &&
            !this.isVasPlan &&
            this.dateService.getDifferenceInDays(coverageStartDate, enrollmentEndDate) < DAY_DIFF_NON_AFLAC
        ) {
            this.minimumDayErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.fifteenDaysAfterEnrollmentEndDate"];
            return true;
        }
        if (
            (this.isNonAflacIndividualCafeteriaVasOnly || this.isVasPlan) &&
            this.dateService.getDifferenceInDays(coverageStartDate, enrollmentEndDate) < DAY_DIFF_AFLAC
        ) {
            this.minimumDayErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.dateBeforeEnrollmentDate"];
            return true;
        }
        return false;
    }

    /**
     * Function to get filtered Exceptions
     * @returns void
     */
    getExceptions(): void {
        this.exceptionBusinessService
            .filterExceptions(this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((exceptions) => {
                this.exceptions = exceptions.map((exception) => ({
                    ...exception,
                    name: this.language.fetchPrimaryLanguageValue(`primary.portal.exceptions.exceptionTypes.${exception.type}`),
                }));
            });
    }

    /**
     * Function to validate coverage dates for exceptions
     * @returns boolean true if invalid coverage dates
     */
    validateExceptionCoverageDates(): boolean {
        let isInvalid = false;
        let effectiveStarting: string;
        let expiresAfter: string;
        if (this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.value) {
            effectiveStarting = this.datepipe.transform(
                this.dateService.toDate(this.createPlanYearForm.get(COVERAGE_PERIOD_FORM_VAR).get(EFFECTIVE_STARTING_VAR).value),
                DateFormats.YEAR_MONTH_DAY,
            );
            expiresAfter = this.datepipe.transform(
                this.dateService.toDate(this.createPlanYearForm.get(COVERAGE_PERIOD_FORM_VAR).get(EXPIRES_AFTER).value),
                DateFormats.YEAR_MONTH_DAY,
            );
        } else {
            if (this.coverageDateGroupForNonAflac.controls[EFFECTIVE_STARTING].value) {
                effectiveStarting = this.datepipe.transform(
                    this.dateService.toDate(this.coverageDateGroupForNonAflac.controls[EFFECTIVE_STARTING].value),
                    DateFormats.YEAR_MONTH_DAY,
                );
            }
            if (this.coverageDateGroupForNonAflac.controls[EXPIRES_AFTER].value) {
                expiresAfter = this.datepipe.transform(
                    this.dateService.toDate(this.coverageDateGroupForNonAflac.controls[EXPIRES_AFTER].value),
                    DateFormats.YEAR_MONTH_DAY,
                );
            }
        }
        if (effectiveStarting && expiresAfter) {
            this.exceptions.forEach((exception) => {
                if (
                    this.datepipe.transform(exception.validity.expiresAfter, DateFormats.YEAR_MONTH_DAY) < effectiveStarting ||
                    this.datepipe.transform(exception.validity.effectiveStarting, DateFormats.YEAR_MONTH_DAY) > expiresAfter
                ) {
                    exception.isValid = false;
                    isInvalid = true;
                } else {
                    exception.isValid = true;
                }
            });
        }
        return isInvalid;
    }

    /**
     * get carrier map value from config
     */
    getCarrierMaps(): void {
        const exceptionCarrier = this.staticUtilService.cacheConfigValue(
            "broker.plan_year_setup.plan_choices.exclude_plans_from_max_plans_per_carrier",
        );
        const carrierIdsMap = this.staticUtilService.cacheConfigValue(
            "group_benefit_offering_carrier_specific_restriction_carrier_ids_map",
        );
        combineLatest([exceptionCarrier, carrierIdsMap])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                resp.map((carrier, index) => {
                    const carriers = carrier.replace(/\s/g, "").split(";");
                    if (index === 0) {
                        this.carrierExceptions = this.generateCarrierMaps(carriers, "=");
                    } else {
                        this.carrierMaps = this.generateCarrierMaps(carriers, ":");
                    }
                });
            });
    }
    /**
     * @description generates the carriers based on the given splitString
     * @param carrierResp {string[]} response containing carrier data
     * @param splitString {string} string that is used to split the carrierResp
     * @returns CarrierMap[] the generated carrierMap
     */
    generateCarrierMaps(carrierResp: string[], splitString: string): CarrierMap[] {
        return carrierResp.map((carrier) => {
            const carrierData = carrier.split(splitString);
            const carrierIds = carrierData[1].substring(1, carrierData[1].length - 1).split(",");
            return { carrier: carrierData[0], ids: carrierIds };
        });
    }
    /**
     * Function to update vas exception for multiple plan years
     */
    updateVasExceptionForMultiplePlanYears(): void {
        let selectedPlanYearId: number;
        const selectedPlanYearIds: number[] = [];
        for (const planYear in this.nonAflacPlanYearOptionsForm.value) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.nonAflacPlanYearOptionsForm.value.hasOwnProperty(planYear)) {
                selectedPlanYearIds.push(this.nonAflacPlanYearOptionsForm.value[planYear]);
            }
        }
        if (selectedPlanYearIds.length === 1) {
            selectedPlanYearId = selectedPlanYearIds[0];
        }
        if (selectedPlanYearIds.length > 1) {
            const selectedPlanYears = this.nonAflacPlanYearOptions.filter((planYear) => selectedPlanYearIds.includes(planYear.value));
            selectedPlanYearId = selectedPlanYears.reduce((accumulator, currentValue) => {
                if (
                    this.datepipe.transform(accumulator.coveragePeriod.effectiveStarting, DateFormats.YEAR_MONTH_DAY) <
                    this.datepipe.transform(currentValue.coveragePeriod.effectiveStarting, DateFormats.YEAR_MONTH_DAY)
                ) {
                    return accumulator;
                }
                return currentValue;
            }, selectedPlanYears[0]).value;
        }
        if (selectedPlanYearId) {
            this.subscriptions.push(this.benefitsOfferingService.updatePlanYearVasExceptions(selectedPlanYearId, this.mpGroup).subscribe());
        }
    }
    /**
     * to check duplicate plan year name and update validation
     */
    checkPlanYearName(): void {
        const nonAflacForm: AbstractControl = this.nonAflacPlanForm.get("nonAflacPlanDates").get("name");
        if (
            nonAflacForm &&
            nonAflacForm.valid &&
            ((this.createPlanYearForm.controls.name && nonAflacForm.value === this.createPlanYearForm.controls.name.value) ||
                this.existingPlanYears.some((existingPlan) => existingPlan.name === nonAflacForm.value))
        ) {
            nonAflacForm.setErrors({ duplicatePlan: true });
        }
    }
    /**
     * func checkQ60KGIEnrollmentDate() The below method validates the end date with current date and start date
     * @param control
     * @returns ValidationErrors for the control
     */
    checkGIEnrollmentDate(control: FormControl): ValidationErrors {
        if (!this.isGIEnrollmentDatesOn || !this.isQ60) {
            // config indicator flag is able to toggle on / toggle off for may release.
            return null;
        }
        if (control.value) {
            const inputDate = this.dateService.toDate(control.value);
            const giEnrollmentDateGroup: AbstractControl = this.enrollmentDateGroup.controls.guaranteedIssueEffectiveStarting;
            const guaranteedIssueStartDate = this.dateService.toDate(giEnrollmentDateGroup.value);
            const enrollmentDateGroup: AbstractControl = this.enrollmentDateGroup.controls.expiresAfter;
            const enrollmentExpiryDate = this.dateService.toDate(enrollmentDateGroup.value);
            const startDate = new Date(guaranteedIssueStartDate);
            const selectedDate = this.dateService.toDate(inputDate);
            const diffInDays = Math.abs(this.dateService.getDifferenceInDays(startDate, selectedDate));
            this.giMaxDiffDate = this.benefitsOfferingHelperService.disableGIEnrollmentEndDate(
                guaranteedIssueStartDate,
                DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS,
            );
            this.giEnrollEndDateDisable = this.giMaxDiffDate >= enrollmentExpiryDate || enrollmentExpiryDate < inputDate;
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            if (this.dateService.isBefore(inputDate, currentDate)) {
                return { pastDate: true };
            }
            if (!this.dateService.isValid(enrollmentExpiryDate) && inputDate >= currentDate) {
                return { enterEnrollmentDate: true };
            }
            if (
                inputDate > enrollmentExpiryDate &&
                diffInDays < DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS &&
                guaranteedIssueStartDate >= currentDate
            ) {
                return { greaterOEEndDate: true };
            }
            if (inputDate < guaranteedIssueStartDate && diffInDays < DateInfo.GI_MIN_ENROLL_PERIOD_IN_DAYS) {
                return { beforeStartDate: true };
            }
            return this.benefitsOfferingHelperService.giPastDateCheck(inputDate, currentDate, diffInDays, enrollmentExpiryDate);
        }
        return null;
    }
    /**
     * func onStartDateUpdated() enrollment-period dateChange to update q60K GI start date.
     * check gi enrollment end date disabling the first 5 dates from gi enrollment start date.
     * @returns void
     */
    onStartDateUpdated(): void {
        if (!this.isGIEnrollmentDatesOn || !this.isQ60) {
            // config indicator flag is able to toggle on / toggle off for may release.
            return;
        }
        const enrollmentStartDate: AbstractControl = this.enrollmentDateGroup.controls.effectiveStarting;
        const enrollmentEndDate: AbstractControl = this.enrollmentDateGroup.controls.expiresAfter;
        const minDate = this.dateService.toDate(enrollmentStartDate.value);
        const giEnrollmentEndDate = this.dateService.addDays(minDate, DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS);
        this.giMinDiffDate = this.benefitsOfferingHelperService.disableGIEnrollmentEndDate(minDate, DateInfo.GI_MIN_ENROLL_PERIOD_IN_DAYS);
        this.giMaxDiffDate = this.benefitsOfferingHelperService.disableGIEnrollmentEndDate(minDate, DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS);
        this.createPlanYearForm.get("enrollmentPeriod").get(DateInfo.GI_EFFECTIVE_STARTING).patchValue(minDate);
        this.createPlanYearForm.get("enrollmentPeriod").get(DateInfo.GI_EXPIRES_AFTER).patchValue(giEnrollmentEndDate);
        if (
            enrollmentEndDate.value &&
            this.dateService.checkIsAfter(giEnrollmentEndDate, this.dateService.toDate(enrollmentEndDate.value))
        ) {
            this.createPlanYearForm.get("enrollmentPeriod").get(DateInfo.GI_EXPIRES_AFTER).patchValue(enrollmentEndDate.value);
        }
    }

    /**
     * Function will check for single VSP carrier plans among continuos plan list
     * If true then update the dropdown value to first of the month alone for continuous plans
     */
    updateDropDownValueForContinuousPlan(): void {
        if (
            this.coveragePeriodContinuousPlansPanelList.some(
                (coveragePeriodContinuousPlansPanelList) =>
                    coveragePeriodContinuousPlansPanelList.carrier.id === CarrierId.VSP_INDIVIDUAL_VISION,
            ) &&
            this.coveragePeriodContinuousPlansPanelList.length === 1
        ) {
            this.isVspAloneInPostTax = true;
            this.coverageStartDateOptions = [
                {
                    value: coverageStartFunction.NEXT_FIRST_OF_MONTHNEXT_FIRST_OF_MONTH,
                    viewValue: "primary.portal.benefitsOffering.continuousPlans.ContinuousStartDate.NEXT_FIRST_OF_MONTHNEXT_FIRST_OF_MONTH",
                },
            ];
        }
    }
    /**
     * @description Angular life cycle hook
     *
     * @memberof CoverageDateQuasiComponent
     */
    ngOnDestroy(): void {
        this.benefitsOfferingService.setCoverageContiguousDates(null);
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
