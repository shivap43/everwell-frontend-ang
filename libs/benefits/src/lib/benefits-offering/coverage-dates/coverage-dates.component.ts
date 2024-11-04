import { Component, OnInit, ViewChild, AfterContentChecked, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl, NgForm, ValidationErrors } from "@angular/forms";
import { Store } from "@ngxs/store";
import {
    BenefitsOfferingService,
    Carrier,
    CoveragePeriod,
    coverageStartFunction,
    CoverageStartDate,
    AccountService,
    AccountDetails,
} from "@empowered/api";

import {
    BenefitsOfferingState,
    CoveragePeriodPanel,
    MapPlanChoicesToPanelProducts,
    SideNavService,
    UpdateCurrentPlanYearId,
    AccountInfoState,
    SharedState,
    ExceptionBusinessService,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { DatePipe } from "@angular/common";
import { MonDialogComponent } from "@empowered/ui";
import {
    CarrierId,
    ConfigName,
    AccountImportTypes,
    PlanPanelModel,
    PanelModel,
    AppSettings,
    Exceptions,
    PlanChoice,
    PlanYearOption,
    DateFormats,
    Permission,
    DateInfo,
    PlanYearType,
    PolicyOwnershipType,
    EnrollmentPeriod,
    PlanYear,
    DateFormat,
} from "@empowered/constants";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { forkJoin, Subject, combineLatest, Observable, of, EMPTY } from "rxjs";
import { CoverageDateApprovalComponent } from "../../coverage-date-approval/coverage-date-approval.component";
import { takeUntil, filter, tap, catchError, map, switchMap, finalize } from "rxjs/operators";
import { MatSelectChange } from "@angular/material/select";
import { BenefitOfferingHelperService } from "../../benefit-offering-helper.service";
import { AccountsBusinessService, SharedService, EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

const FUTURE_MONTH_CAFE = 3;
const FUTURE_MONTH_NON_CAFE = 6;
const DAY_DIFF_AFLAC = 1;
const DAY_DIFF_NON_AFLAC = 15;
const DAY_DIFF_NON_AFLAC_ADV = 7;
const COVERAGE_START_DATE = "coverage_start_date";
const PLAN_YEAR_START_DATE = "plan_year_start_date";
const PLAN_YEAR_END_DATE = "plan_year_end_date";
const VARIABLE = "VAR";
const PRETAX = "PRETAX";
const EXPIRES_AFTER = "expiresAfter";
const EFFECTIVE_STARTING = "effectiveStarting";
const MILLISECONDS = 1000;
const SECONDS = 60;
const NO_OF_DAYS_IN_SIX_MONTHS = 180;
const HOURS_PER_DAY = 24;
// On submission navigate to Carrier Form step
const CARRIER_FORM_STEP = 5;
const ID_FIELD = "id";
const NAME = "name";
const COVERAGE_PERIOD_FORM_VAR = "coveragePeriod";
const COVERAGE_START_FUNCTION = "coverageStartFunction";
const FIRST_DATE_OF_MONTH_ONE_DAY = 1;
const THREE_MONTHS = 3;
const SIX_MONTHS = 6;
const MINUTES = 60;
const SAME_AFLAC_INDIVIDUAL_PLAN_DATE = "sameAflacIndividualPlanDate";
const COVERAGE_DATE_GROUP_ATTRIBUTE_VALUE = "4";
const EXCLUDED_CAFETERIA_START_DATE_INDEX = 1;

@Component({
    selector: "empowered-coverage-dates",
    templateUrl: "./coverage-dates.component.html",
    styleUrls: ["./coverage-dates.component.scss"],
})
export class CoverageDatesComponent implements OnInit, AfterContentChecked, OnDestroy {
    @ViewChild("createPlanYear", { static: true }) createPlanYearModal;
    @ViewChild("formDirective") private formDirective: NgForm;
    currentDate = new Date();
    planYearform: FormGroup;
    enrollmentDateGroup: FormGroup;
    coverageDateGroup: FormGroup;
    panelProducts: PanelModel[];
    planYearOptionsForm: FormGroup;
    nonAflacPlanYearOptionsForm: FormGroup;
    planYearOptions: PlanYearOption[] = [];
    samePlanYear = false;
    PRPlanChoicesToBeUpdated: PlanChoice[] = [];
    nonAflacPlanChoicesToBeUpdated: PlanChoice[] = [];
    continuousPlanChoicesToBeUpdated: PlanChoice[] = [];
    carriers: Carrier[] = [];
    coveragePeriodPRPlansPanelList: CoveragePeriodPanel[] = [];
    coveragePeriodContinuousPlansPanelList: CoveragePeriodPanel[] = [];
    coveragePeriodNonAflacPlanList: CoveragePeriodPanel[] = [];
    variableTaxStatusPlan: PlanPanelModel[] = [];
    planYearId: number;
    readonly AFLAC_DATE_UPDATE = "aflac";
    readonly NON_AFLAC_DATE_UPDATE = "non_aflac";
    readonly carrierIds = CarrierId;
    nonAflacPlanYearId: number;
    error = false;
    isCafeteriaDate = false;
    mpGroup: number;
    dialogOpen = false;
    dialogError = false;
    coverageStartDateOptions = [];
    nonAflacPlanForm: FormGroup;
    continuousPlanform: FormGroup;
    continuousPlanDatesForm: FormGroup;
    continuousPlan: FormGroup;
    nonAflacPlan: FormGroup;
    coverageDatesForm: FormGroup;
    createdPlanYearValue;
    createdNonAflacPlanYearValue: string;
    nonAflacPlanYearOptions: PlanYearOption[] = [];
    nonAflacPlanYearToPopulate: PlanYear;
    enrollmentDateGroupForNonAflac: FormGroup;
    coverageDateGroupForNonAflac: FormGroup;
    // FIX ME : Need to implement language
    fieldErrorMessage = "validationErrors";
    errorMsg;
    createPlanYearForm: FormGroup;
    coverageStartDate: string;
    samePlanYearflag = false;
    sameNonAflacPlanYearFlag = false;
    cafeteriaStartDate: string;
    cafeteriaEndDate: string;
    planYearIdToCompare = null;
    allPlanYears: PlanYear[];
    continuousPlanDatesToCompare;
    nonAflacPlanDatesToCompare: number;
    sameContinuousPlanDatesflag = false;
    sameAflacPlanYearFlag = false;
    controlToReset = "";
    planYearToPopulate: PlanYear;
    showContinuousCoverageDates = false;
    queryString = "input.ng-invalid,mat-datepicker.ng-invalid";
    languageStrings = {
        enrollmentStartDate: this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.enrollmentStartDate"),
        coverageStartDate: this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.coverageStartDate"),
        selectPlanYear: this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.selectPlanYear"),
    };
    languageStringsArray: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.benefitsOffering.planYearRestrictedPlans",
        "primary.portal.benefitsOffering.planYear",
        "primary.portal.benefitsOffering.planYearName",
        "primary.portal.benefitsOffering.enrollmentDates",
        "primary.portal.benefitsOffering.giEnrollmentDates",
        "primary.portal.benefitsOffering.coverageDates",
        "primary.portal.benefitsOffering.createNewPlanYear",
        "primary.portal.benefitsOffering.continuousPlans",
        "primary.portal.benefitsOffering.continuousPlansEnroll",
        "primary.portal.benefitsOffering.enrollmentStartDate",
        "primary.portal.benefitsOffering.coverageStartDate",
        "primary.portal.benefitsOffering.preTaxBenefit",
        "primary.portal.benefitsOffering.postTaxBenefit",
        "primary.portal.common.back",
        "primary.portal.common.next",
        "primary.portal.common.cancel",
        "primary.portal.common.save",
        "primary.portal.common.close",
        "primary.portal.common.date",
        "primary.portal.common.invalidDateFormat",
        "primary.portal.common.dateHint",
        "primary.portal.benefitsOffering.singleContinuousPlansEnroll",
        "primary.portal.benefitsOffering.singlePlanYear",
        "primary.portal.benefitsOffering.hqSubtitle1Plan",
        "primary.portal.benefitsOffering.plansSubTitlePlans",
        "primary.portal.coverage.cannotBePast",
        "primary.portal.coverage.cannotBeBeforeEnrollmentStartDate",
        "primary.portal.benefitsOffering.availability.header",
        "primary.portal.benefitsOffering.enroll",
        "primary.portal.benefitsOffering.aflacDates",
        "primary.portal.benefitsOffering.planName",
        "primary.portal.benefitsOffering.planExample",
        "primary.portal.benefitsOffering.nonPlan",
        "primary.portal.benefitsOffering.partner",
        "primary.portal.benefitsOffering.checkbox",
        "primary.portal.benefitsOffering.apply",
        "primary.portal.benefitsOffering.aflacPostTaxNote",
        "primary.portal.benefitsOffering.coverageStartRule",
        "primary.portal.benefitsOffering.earliestCoverageStart",
        "primary.portal.benefitsOffering.earliestCoverageStartInfo",
        "primary.portal.benefitsOffering.cafeteriaDatesInfo",
        "primary.portal.benefitsOffering.posttaxCoverageStartDate",
        "primary.portal.benefitsOffering.preTaxAndPostTax",
        "primary.portal.maintenanceBenefitsOffering.products.vasExceptionActive",
        "primary.portal.maintenanceBenefitsOffering.products.coverageDateOverlap",
        "primary.portal.benefitsOffering.tpi.enrollmentDates.match",
        "primary.portal.benefitsOffering.tpi.coverageDates.match",
        "primary.portal.benefitsOffering.tpi.sameIndividualDates.disableInfo",
        "primary.portal.benefitsOffering.aflac.group.dates",
        "primary.portal.coverage.notAllowedDate",
        "primary.portal.benefitsOffering.giEnrollmentDatesInfo",
    ]);
    languageSecondStringsArray: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.benefitsOffering.samePlanYear",
        "secondary.portal.benefitsOffering.setting.employeesRequired",
        "secondary.portal.benefitsOffering.coveragedates.invalidDate",
        "secondary.portal.benefitsOffering.samePlanYearContinuous",
        "secondary.portal.benefitsOffering.coveragedates.firstDateOfMonth",
        "secondary.portal.benefitsOffering.coveragedates.threeMonths",
        "secondary.portal.benefitsOffering.coveragedates.sixMonths",
        "secondary.portal.benefitsOffering.addPlanYear.badParameter.minimum.days",
        "secondary.portal.benefitsOffering.coveragedates.maxEndDate",
        "secondary.portal.benefitsOffering.coveragedates.dateBeforeEnrollmentDate",
        "secondary.portal.benefitsOffering.coveragedates.fifteenDaysAfterEnrollmentEndDate",
        "secondary.portal.benefitsOffering.coveragedates.sevenDaysAfterEnrollmentEndDate",
        "secondary.portal.benefitsOffering.coveragedates.fieldValidationError",
        "secondary.portal.benefitsOffering.duplicatePlanYear",
        "secondary.portal.benefitsOffering.coveragedates.invalidenddate",
        "secondary.portal.benefitsOffering.coveragedates.infoMessage",
        "secondary.portal.benefitsOffering.coverageDate.cannotBeBeforeStartDate",
        "secondary.portal.benefitsOffering.coveragedates.invalidStartDate",
        "secondary.portal.benefitsOffering.coveragedates.planYearNameValidation",
    ]);
    isLoading = false;
    scrollInToMonAlertFlag = false;
    minDate;
    enableCoverageEndDate = false;
    enableEndDateControl = false;
    maxCoverageStartDate: Date;
    maxCoverageEndDate: Date;
    maxLength = AppSettings.CALENDAR_MAX_LEN;
    controlEndDateName = "coverageEndDate";
    approvalModelOpen = false;
    approveReceived = false;
    alertDialogRef: MatDialogRef<MonDialogComponent>;
    isAccountDeactivated: boolean;
    multiPlanYear = false;
    multiContinuousYear = false;
    multiNonAflacYear = false;
    isVasPlan = false;
    enrollmentDifferenceInDays = DAY_DIFF_NON_AFLAC;
    enrollmentDifferenceInDaysForModal = DAY_DIFF_NON_AFLAC;
    isRole20User = false;
    dateArray: string[] = [];
    dateArrayForNonAflac: string[] = [];
    dropDownForNextMonth: number;
    dateUpdatedMessage = false;
    minimumDayErrorMessage = "";
    nonAflacMinimumDayErrorMessage = "";
    minimumDayErrorModalMessage = "";
    isCoverageDateError = false;
    isAflacGroup$: Observable<boolean> = this.accountsBusinessService.checkForCafeteriaEligibility();
    isAflacIndividualCafeteriaVasOnly = false;
    isNonAflacIndividualCafeteriaVasOnly = false;
    minDateCoverage: Date;
    minDateCoverageNonAflac: Date;
    private readonly unsubscribe$: Subject<void> = new Subject();
    exceptions: Exceptions[] = [];
    isTPPAccount = false;
    isThirdPartyCafeteriaAccount = false;
    earliestCoverageStartDateInfoMsg: string;
    isPreTaxAflac = false;
    currentAccount: AccountDetails = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
    accountImportTypes = AccountImportTypes;
    enteredDate: string;
    dateClass = this.sharedService.dateClass;
    onlyADVOrVASPlansPresent = false;
    isQ60 = false;
    isGIEnrollmentDatesOn: boolean;
    giMaxDiffDate: Date;
    giEnrollEndDateDisable: boolean;
    giMinDiffDate: Date;
    enableGIEligibleDateMessage$: Observable<boolean>;
    isVspAloneInPostTax: boolean;
    coverageStartDateOptionsForVariableTaxPlans = [];
    constructor(
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly sideNavService: SideNavService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly datepipe: DatePipe,
        private readonly matDialog: MatDialog,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly accountService: AccountService,
        private readonly accountsBusinessService: AccountsBusinessService,
        private readonly benefitsOfferingHelperService: BenefitOfferingHelperService,
        private readonly exceptionBusinessService: ExceptionBusinessService,
        private readonly sharedService: SharedService,
        private readonly staticService: StaticUtilService,
        private readonly dateService: DateService,
    ) {
        this.fetchAccountTPPStatus();
    }
    firstDateFilter = (d: Date): boolean => {
        const day = d.getDate();
        return day === 1;
    };

    /**
     * @description Angular Life cycle hook
     * initialize component for new BO
     * @memberof CoverageDatesComponent
     */
    ngOnInit(): void {
        this.sideNavService
            .updateGroupBenefitOfferingStep(COVERAGE_DATE_GROUP_ATTRIBUTE_VALUE)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
        this.benefitsOfferingService.setCoverageContiguousDates(null);
        this.store.select(SharedState.hasPermission(Permission.UPDATE_PLAN_COVERAGE_DATE)).subscribe((res) => {
            this.isRole20User = res;
        });
        this.minDate = new Date();
        this.minDateCoverage = new Date();
        this.minDateCoverageNonAflac = new Date();
        const sixMonthsFromToday = new Date();
        sixMonthsFromToday.setMonth(sixMonthsFromToday.getMonth() + SIX_MONTHS);
        sixMonthsFromToday.setDate(sixMonthsFromToday.getDate() - FIRST_DATE_OF_MONTH_ONE_DAY);
        this.maxCoverageStartDate = this.dateService.toDate(sixMonthsFromToday);
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        if (this.mpGroup) {
            this.sideNavService.stepClicked$.next(3);
            this.coverageDatesForm = this.fb.group({});
            this.planYearform = this.fb.group({
                samePlanYear: [true],
            });
            this.continuousPlanform = this.fb.group({
                sameCoveragePlanDate: [true],
            });
            this.nonAflacPlanForm = this.fb.group({
                sameCoveragePlanDate: [false],
                sameAflacIndividualPlanDate: [true],
            });
            this.continuousPlan = this.fb.group({
                enrollmentStartDate: ["", [Validators.required, this.checkContinousEnrollmentDate.bind(this)]],
                earliestCoverageStart: ["", [Validators.required, this.checkEarliestCoverageStartDate.bind(this)]],
                coverageStartFunction: ["", Validators.required],
            });
            this.nonAflacPlan = this.fb.group({
                name: ["", Validators.required],
            });
            this.continuousPlanDatesForm = this.fb.group({});
            this.continuousPlanform.addControl("continuousPlanDates", this.continuousPlan);
            this.nonAflacPlanForm.addControl("nonAflacPlanDates", this.nonAflacPlan);
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
            this.panelProducts = this.store
                .selectSnapshot(BenefitsOfferingState.getpanelProducts)
                .filter((pannel) => pannel.productChoice != null);
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
                            taxBenefitType: this.languageStringsArray["primary.portal.benefitsOffering.preTaxAndPostTax"],
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
                    if (carrierSpecificContinuousPlans.length > 1) {
                        this.multiContinuousYear = true;
                    }
                    if (carrierSpecificContinuousPlans.length !== 0) {
                        this.coveragePeriodContinuousPlansPanelList.push({
                            carrier: specificCarrier,
                            plans: carrierSpecificContinuousPlans,
                            product: productPannelItem.product,
                            taxBenefitType: this.utilService.getTaxBenefitType(carrierSpecificContinuousPlans[0].planChoice.taxStatus),
                        });
                        const continuousPlanDates = this.fb.group({
                            enrollmentStartDate: ["", [Validators.required, this.checkContinousEnrollmentDate.bind(this)]],
                            coverageStartFunction: ["", Validators.required],
                        });
                    }

                    const carrierSpecificNonAflacPlans = productPannelItem.plans.filter(
                        (plan) =>
                            plan.planChoice != null &&
                            plan.plan.carrierId === specificCarrier.id &&
                            plan.plan.carrierId !== CarrierId.AFLAC &&
                            !plan.planChoice.continuous,
                    );
                    if (carrierSpecificNonAflacPlans.length !== 0) {
                        this.coveragePeriodNonAflacPlanList.push({
                            carrier: specificCarrier,
                            plans: carrierSpecificNonAflacPlans,
                            product: productPannelItem.product,
                            taxBenefitType: this.utilService.getTaxBenefitType(carrierSpecificNonAflacPlans[0].planChoice.taxStatus),
                        });
                        this.multiPlanYear = carrierSpecificNonAflacPlans.length > 1;
                        const formControl = this.fb.control(null, Validators.required);
                        this.nonAflacPlanYearOptionsForm.addControl(productPannelItem.product.name + specificCarrier.name, formControl);
                        const planYear: PlanPanelModel = carrierSpecificNonAflacPlans.filter((plan) => plan.planChoice.planYearId).pop();
                        if (planYear) {
                            this.nonAflacPlanYearOptionsForm.controls[productPannelItem.product.name + specificCarrier.name].patchValue(
                                planYear.planChoice.planYearId,
                            );
                        }
                    }
                });
                const filteredQ60KGIPlans = this.panelProducts.filter((productPanel) => productPanel.productChoice);
                this.isQ60 = filteredQ60KGIPlans.some((productData) =>
                    productData.plans.some((planData) => planData.plan.policySeries.includes("Q60") && planData.planChoice),
                );
            });

            // will check for single VSP carrier plans among continuos plan list
            // If true then update the dropdown value to first of the month alone for continuous plans
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
                        viewValue:
                            "primary.portal.benefitsOffering.continuousPlans.ContinuousStartDate.NEXT_FIRST_OF_MONTHNEXT_FIRST_OF_MONTH",
                    },
                ];
            }
            this.onlyADVOrVASPlansPresent = !this.coveragePeriodNonAflacPlanList.some((nonAflacProduct) =>
                nonAflacProduct.plans.some((plan) => plan.plan.carrierId !== CarrierId.AFLAC_DENTAL_AND_VISION && !plan.plan.vasFunding),
            );
            if (this.coveragePeriodPRPlansPanelList.length !== 0 && this.coveragePeriodContinuousPlansPanelList.length !== 0) {
                this.continuousPlan.get("enrollmentStartDate").disable();
                this.continuousPlan.get("earliestCoverageStart").disable();
            }
            this.planYearIdToCompare = null;
            let planYearMapped = false;
            const currentPlanYearId = this.store.selectSnapshot(BenefitsOfferingState.getCurrentPlanYearId);
            this.coveragePeriodPRPlansPanelList.forEach((panelItem) => {
                const planYear = panelItem.plans.filter((plan) => plan.planChoice.planYearId).pop();
                if (planYear || currentPlanYearId) {
                    if (!this.planYearIdToCompare) {
                        planYearMapped = true;
                        this.samePlanYearflag = true;
                        this.planYearIdToCompare =
                            planYear && planYear.planChoice && planYear.planChoice.planYearId
                                ? planYear.planChoice.planYearId
                                : currentPlanYearId;
                        this.store.dispatch(new UpdateCurrentPlanYearId(this.planYearIdToCompare));
                    }
                    if (
                        planYear &&
                        planYear.planChoice &&
                        planYear.planChoice.planYearId &&
                        this.planYearIdToCompare !== planYear.planChoice.planYearId
                    ) {
                        this.samePlanYearflag = false;
                    }
                }
            });
            if (this.coveragePeriodPRPlansPanelList.length > 1) {
                this.multiPlanYear = true;
            }
            if (this.coveragePeriodPRPlansPanelList.length !== 0) {
                this.getCafeteriaPlanDates();
            }
            this.setNonAflacPlanYearFlags();
            this.getPlanYears(false);
            this.continuousPlanDatesToCompare = null;
            this.sameContinuousPlanDatesflag = true;
            this.coveragePeriodContinuousPlansPanelList.forEach((panelItem) => {
                const continousPlan: PlanPanelModel = panelItem.plans
                    .filter((plan) => plan.planChoice.enrollmentPeriod && plan.planChoice.coverageStartFunction)
                    .pop();
                if (continousPlan) {
                    if (!this.continuousPlanDatesToCompare) {
                        this.continuousPlanDatesToCompare = {
                            enrollmentStartDate: continousPlan.planChoice.enrollmentPeriod.effectiveStarting,
                            coverageStartFunction: continousPlan.planChoice.coverageStartFunction,
                        };
                        this.sameContinuousPlanDatesflag = true;
                    }
                    if (
                        this.continuousPlanDatesToCompare.enrollmentStartDate !==
                            continousPlan.planChoice.enrollmentPeriod.effectiveStarting ||
                        this.continuousPlanDatesToCompare.coverageStartFunction !== continousPlan.planChoice.coverageStartFunction
                    ) {
                        this.sameContinuousPlanDatesflag = false;
                    }
                }
            });
            if (this.coveragePeriodContinuousPlansPanelList.length > 1) {
                this.multiContinuousYear = true;
            }
            if (this.sameContinuousPlanDatesflag) {
                this.continuousPlanform.controls["sameCoveragePlanDate"].patchValue(true);
                if (this.continuousPlanDatesToCompare) {
                    this.continuousPlanform.controls["continuousPlanDates"].patchValue({
                        enrollmentStartDate: this.utilService.getCurrentTimezoneOffsetDate(
                            this.continuousPlanDatesToCompare.enrollmentStartDate,
                        ),
                        coverageStartFunction: this.continuousPlanDatesToCompare.coverageStartFunction,
                    });
                } else {
                    this.continuousPlanform.controls["continuousPlanDates"].patchValue({
                        enrollmentStartDate: this.datepipe.transform(new Date(), DateFormat.YEAR_MONTH_DAY),
                        coverageStartFunction: this.isVspAloneInPostTax
                            ? this.coverageStartDateOptions[0].value
                            : this.coverageStartDateOptions[FIRST_DATE_OF_MONTH_ONE_DAY].value,
                    });
                }
            }

            // TODO: Add business validations for dates
            this.enrollmentDateGroup = this.fb.group({
                effectiveStarting: ["", [Validators.required, this.checkDate.bind(this), this.checkEnrollmentStartDate.bind(this)]],
                expiresAfter: ["", [Validators.required, this.checkDate.bind(this), this.checkEnrollemtEndDate.bind(this)]],
                guaranteedIssueEffectiveStarting: [
                    { value: "", disabled: true },
                    [Validators.required, this.checkDate.bind(this), this.checkEnrollmentStartDate.bind(this)],
                ],
                guaranteedIssueExpiresAfter: ["", [Validators.required, this.checkDate.bind(this), this.checkGIEnrollmentDate.bind(this)]],
            });
            this.coverageDateGroup = this.fb.group({
                effectiveStarting: ["", [Validators.required, this.checkDate.bind(this), this.checkCoverageStartDate.bind(this)]],
                expiresAfter: [
                    { disabled: !this.isRole20User, value: "" },
                    [Validators.required, this.checkDate.bind(this), this.checkCoverageEndDate.bind(this)],
                ],
            });
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
            this.createPlanYearForm = this.fb.group({
                name: ["", Validators.required],
            });
            if (this.variableTaxStatusPlan.length) {
                const coverageStartFunctionChoice = this.variableTaxStatusPlan.find((plan) =>
                    Boolean(plan.planChoice && plan.planChoice.coverageStartFunction),
                );
                this.createPlanYearForm.addControl(COVERAGE_START_FUNCTION, new FormControl("", Validators.required));
                this.createPlanYearForm.controls[COVERAGE_START_FUNCTION].patchValue(
                    coverageStartFunctionChoice
                        ? coverageStartFunctionChoice.planChoice.coverageStartFunction
                        : this.coverageStartDateOptionsForVariableTaxPlans[FIRST_DATE_OF_MONTH_ONE_DAY].value,
                );
            }
            this.createPlanYearForm.addControl("coveragePeriod", this.coverageDateGroup);
            this.createPlanYearForm.addControl("enrollmentPeriod", this.enrollmentDateGroup);
            this.planYearform.addControl("createPlanYearForm", this.createPlanYearForm);
            this.planYearform.addControl("planYearOptionsForm", this.planYearOptionsForm);
            this.nonAflacPlanForm.addControl("nonAflacPlanYearOptionsForm", this.nonAflacPlanYearOptionsForm);
            this.continuousPlanform.addControl("continuousPlanDatesForm", this.continuousPlanDatesForm);
            this.coverageDatesForm.addControl("planYearform", this.planYearform);
            this.coverageDatesForm.addControl("continuousPlanform", this.continuousPlanform);
            this.coverageDatesForm.addControl("nonAflacPlanForm", this.nonAflacPlanForm);
            this.nonAflacPlan.addControl("enrollmentDateGroupForNonAflac", this.enrollmentDateGroupForNonAflac);
            this.nonAflacPlan.addControl("coverageDateGroupForNonAflac", this.coverageDateGroupForNonAflac);
        }
        this.fetchAccountStatus();
        this.checkAflacVASPlans();
        if (this.isAflacIndividualCafeteriaVasOnly || this.isNonAflacIndividualCafeteriaVasOnly) {
            this.enrollmentDifferenceInDays = DAY_DIFF_AFLAC;
            this.dropDownForNextMonth = FUTURE_MONTH_NON_CAFE;
            this.minimumDayErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.dateBeforeEnrollmentDate"];
        } else {
            this.enrollmentDifferenceInDays = DAY_DIFF_NON_AFLAC;
            this.dropDownForNextMonth = FUTURE_MONTH_CAFE;
            this.minimumDayErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.fifteenDaysAfterEnrollmentEndDate"];
        }
        if (this.onlyADVOrVASPlansPresent) {
            this.enrollmentDifferenceInDays = DAY_DIFF_NON_AFLAC_ADV;
            this.nonAflacMinimumDayErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.sevenDaysAfterEnrollmentEndDate"];
        } else {
            this.nonAflacMinimumDayErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.fifteenDaysAfterEnrollmentEndDate"];
        }
        this.populateCoverageEnddate();
        this.populateCoverageEndDateForNonAflacPlan();
        const sameAflacIndividualPlanDateControl: AbstractControl = this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate;
        if (sameAflacIndividualPlanDateControl) {
            sameAflacIndividualPlanDateControl.valueChanges
                .pipe(
                    takeUntil(this.unsubscribe$),
                    filter((selectedValue) => this.multiNonAflacYear),
                )
                .subscribe((selectedValue: boolean) => {
                    this.nonAflacPlanForm.controls.sameCoveragePlanDate.patchValue(!selectedValue);
                });
        }
        this.createPlanYearForm.controls["enrollmentPeriod"].get(EFFECTIVE_STARTING).valueChanges.subscribe((selectedValue) => {
            this.continuousPlan.get("enrollmentStartDate").patchValue(this.utilService.getCurrentTimezoneOffsetDate(selectedValue));
        });
        this.createPlanYearForm.controls[COVERAGE_PERIOD_FORM_VAR].get(EFFECTIVE_STARTING).valueChanges.subscribe((selectedValue) => {
            const earliestCoverageStartControl: AbstractControl = this.continuousPlan.controls.earliestCoverageStart;
            if (earliestCoverageStartControl) {
                earliestCoverageStartControl.patchValue(this.utilService.getCurrentTimezoneOffsetDate(selectedValue));
            }
        });
        // GI date fields should be allowed to appear based on master app status
        combineLatest([
            this.staticService.cacheConfigEnabled(ConfigName.GI_ENROLLMENT_DATES_FEATURE),
            this.benefitsOfferingHelperService.isMasterAppStatusApproved(),
        ])
            .pipe(
                tap(([giEnrollmentDatesConfigValue, masterAppStatus]) => {
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
     * This method is used to fetch account TPP status
     * This method is used to fetch third party platform requirements
     */
    fetchAccountTPPStatus(): void {
        this.earliestCoverageStartDateInfoMsg = this.languageStringsArray["primary.portal.benefitsOffering.earliestCoverageStartInfo"];
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
                            this.languageStringsArray["primary.portal.benefitsOffering.tpi.coverageDates.match"];
                    }
                }),
            )
            .subscribe();
    }
    /**
     * setNonAflacPlanYearFlags() : setting flags for non aflac plans
     * @return void
     */
    setNonAflacPlanYearFlags(): void {
        if (this.coveragePeriodNonAflacPlanList.length > 1) {
            this.multiNonAflacYear = true;
        }
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
        this.nonAflacPlanDatesToCompare = null;
        let nonAflacPlanYearMapped = false;
        if (!this.sameAflacPlanYearFlag && !this.multiNonAflacYear) {
            this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.patchValue(false);
        }
        if (!this.sameAflacPlanYearFlag && this.multiNonAflacYear) {
            this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.patchValue(false);
            this.coveragePeriodNonAflacPlanList.forEach((panelItem) => {
                const planYear = panelItem.plans.filter((plan) => plan.planChoice.planYearId).pop();
                if (planYear) {
                    if (!this.nonAflacPlanDatesToCompare) {
                        nonAflacPlanYearMapped = true;
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

        if (nonAflacPlanYearMapped && !this.sameNonAflacPlanYearFlag) {
            this.nonAflacPlanForm.controls.sameCoveragePlanDate.patchValue(false);
        }
    }

    /**
     * To get the cafeteria plan dates
     */
    getCafeteriaPlanDates(): void {
        this.showContinuousCoverageDates = true;
        combineLatest([this.accountService.getGroupAttributesByName([PLAN_YEAR_START_DATE, PLAN_YEAR_END_DATE])])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([groupAttributes]) => {
                const startDate = groupAttributes.find((attr) => attr.attribute === PLAN_YEAR_START_DATE);
                const endDate = groupAttributes.find((attr) => attr.attribute === PLAN_YEAR_END_DATE);
                this.cafeteriaStartDate = startDate.value;
                this.cafeteriaEndDate = endDate.value;
                if (!this.planYearToPopulate && this.cafeteriaStartDate && this.dateService.toDate(this.cafeteriaStartDate) >= new Date()) {
                    if (!this.isAflacIndividualCafeteriaVasOnly) {
                        this.dateArray.push(this.cafeteriaStartDate);
                        const index = this.dateArray.findIndex((dateString) => dateString === this.cafeteriaStartDate);
                        this.createPlanYearForm.get(COVERAGE_PERIOD_FORM_VAR).get(EFFECTIVE_STARTING).patchValue(this.dateArray[index]);
                    } else {
                        this.createPlanYearForm
                            .get(COVERAGE_PERIOD_FORM_VAR)
                            .get(EFFECTIVE_STARTING)
                            .patchValue(this.dateService.toDate(this.cafeteriaStartDate));
                    }
                    this.continuousPlan.get("earliestCoverageStart").patchValue(this.dateService.toDate(this.cafeteriaStartDate));
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
        this.isLoading = true;
        this.planYearOptions = [];
        this.nonAflacPlanYearOptions = [];
        this.benefitsOfferingService
            .getPlanYears(this.mpGroup, true, false)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((response: PlanYear[]) => {
                    const planYears: PlanYear[] = response.filter((planYear) => planYear.type === PlanYearType.AFLAC_INDIVIDUAL);
                    if (planYears.length) {
                        planYears.forEach((planYear) => {
                            this.planYearOptions.push({
                                value: planYear.id,
                                viewValue: planYear.name,
                                type: planYear.type,
                            });
                            this.nonAflacPlanYearOptions.push({
                                value: planYear.id,
                                viewValue: planYear.name,
                                coveragePeriod: planYear.coveragePeriod,
                                type: planYear.type,
                            });
                            this.allPlanYears = this.utilService.copy(planYears);
                            if (this.samePlanYearflag) {
                                this.planYearform.controls["samePlanYear"].patchValue(true);
                                if (this.allPlanYears) {
                                    const planYearToPopulate: PlanYear = this.allPlanYears
                                        .filter((planYearValue) => planYearValue.id === this.planYearIdToCompare)
                                        .pop();
                                    planYearToPopulate.coveragePeriod.effectiveStarting = this.datepipe.transform(
                                        this.utilService.getCurrentTimezoneOffsetDate(planYearToPopulate.coveragePeriod.effectiveStarting),
                                        DateFormats.MONTH_DAY_YEAR,
                                    );
                                    planYearToPopulate.coveragePeriod.expiresAfter = this.datepipe.transform(
                                        this.utilService.getCurrentTimezoneOffsetDate(planYearToPopulate.coveragePeriod.expiresAfter),
                                        DateFormats.MONTH_DAY_YEAR,
                                    );
                                    planYearToPopulate.enrollmentPeriod.effectiveStarting = this.datepipe.transform(
                                        this.utilService.getCurrentTimezoneOffsetDate(
                                            planYearToPopulate.enrollmentPeriod.effectiveStarting,
                                        ),
                                        DateFormats.MONTH_DAY_YEAR,
                                    );
                                    planYearToPopulate.enrollmentPeriod.expiresAfter = this.datepipe.transform(
                                        this.utilService.getCurrentTimezoneOffsetDate(planYearToPopulate.enrollmentPeriod.expiresAfter),
                                        DateFormats.MONTH_DAY_YEAR,
                                    );
                                    this.planYearId = planYearToPopulate.id;
                                    delete planYearToPopulate["id"];
                                    this.planYearToPopulate = planYearToPopulate;
                                    this.createPlanYearForm.patchValue({
                                        enrollmentPeriod: {
                                            effectiveStarting: this.dateService.toDate(
                                                planYearToPopulate.enrollmentPeriod.effectiveStarting || "",
                                            ),
                                            expiresAfter: this.dateService.toDate(planYearToPopulate.enrollmentPeriod.expiresAfter || ""),
                                            guaranteedIssueEffectiveStarting: this.dateService.toDate(
                                                !planYearToPopulate.enrollmentPeriod.guaranteedIssueEffectiveStarting &&
                                                    planYearToPopulate.enrollmentPeriod.effectiveStarting &&
                                                    (this.isQ60 || this.isGIEnrollmentDatesOn)
                                                    ? planYearToPopulate?.enrollmentPeriod?.effectiveStarting
                                                    : planYearToPopulate?.enrollmentPeriod?.guaranteedIssueEffectiveStarting || "",
                                            ),
                                            guaranteedIssueExpiresAfter: this.dateService.toDate(
                                                planYearToPopulate.enrollmentPeriod.guaranteedIssueExpiresAfter || "",
                                            ),
                                        },
                                        coveragePeriod: {
                                            effectiveStarting: this.dateService.toDate(
                                                planYearToPopulate.coveragePeriod.effectiveStarting || "",
                                            ),
                                            expiresAfter: this.dateService.toDate(planYearToPopulate.coveragePeriod.expiresAfter || ""),
                                        },
                                        name: planYearToPopulate.name,
                                    });
                                    const expiresAfterDate: Date = this.dateService.toDate(
                                        planYearToPopulate.enrollmentPeriod.expiresAfter || "",
                                    );
                                    if (
                                        !this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.value &&
                                        this.coveragePeriodNonAflacPlanList.length !== 0
                                    ) {
                                        this.checkForSameCafeteriaDates(false);
                                    } else {
                                        this.populateCoverageEnddate(expiresAfterDate);
                                    }
                                }
                                this.samePlanYearflag = false;
                            }
                            this.setNonAflacPlanDates(populateCreatedPlanYear);
                        });
                    } else if (this.currentAccount.importType === AccountImportTypes.SHARED_CASE) {
                        return this.getAflacGroupDates();
                    }
                    return of(null);
                }),
                finalize(() => (this.isLoading = false)),
            )
            .subscribe();
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
                effectiveStarting:
                    this.isNonAflacIndividualCafeteriaVasOnly || this.isVasPlan
                        ? this.dateService.toDate(
                            this.datepipe.transform(
                                this.utilService.getCurrentTimezoneOffsetDate(planYearToPopulate.coveragePeriod.effectiveStarting),
                                DateFormats.MONTH_DAY_YEAR,
                            ),
                        )
                        : this.datepipe.transform(
                            this.utilService.getCurrentTimezoneOffsetDate(planYearToPopulate.coveragePeriod.effectiveStarting),
                            DateFormats.MONTH_DAY_YEAR,
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
            this.populateCoverageEndDateForNonAflacPlan(this.dateService.toDate(planYearToPopulate.enrollmentPeriod.expiresAfter));
        }
    }

    /**
     * set plan year for individual non aflac plan
     * @returns nothing
     */
    setPlanYearForEachNonAflacPlan(): void {
        this.nonAflacPlanYearOptionsForm.controls[this.controlToReset].patchValue(this.nonAflacPlanYearId);
        this.updatePlanYearForNonAflac(
            this.coveragePeriodNonAflacPlanList.filter((plan) => plan.product.name + plan.carrier.name === this.controlToReset).pop(),
            this.nonAflacPlanYearId,
        );
    }

    /**
     * Update plan year for non aflac plans
     * @param coverageDatePRPanelItem coverage date item
     * @param planYear plan year id
     * @param control plan year control
     * @param isVas vas product or not
     */
    updatePlanYearForNonAflac(
        coverageDatePRPanelItem: CoveragePeriodPanel,
        planYear: number,
        control?: AbstractControl,
        isVas?: boolean,
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
                    planYearToPopulate.coveragePeriod.effectiveStarting,
                    planYearToPopulate.enrollmentPeriod.expiresAfter,
                ) < (this.onlyADVOrVASPlansPresent ? DAY_DIFF_NON_AFLAC_ADV : DAY_DIFF_NON_AFLAC)
            ) {
                control.setErrors({ minimumDays: true });
            }
        }
        this.validateCoverageDates();
    }

    /**
     * Update plan year for aflac plans
     * @param coverageDatePRPanelItem coverage date item
     * @param value plan year id
     */
    updatePlanYear(coverageDatePRPanelItem: CoveragePeriodPanel, value: string): void {
        this.coveragePeriodPRPlansPanelList[this.coveragePeriodPRPlansPanelList.indexOf(coverageDatePRPanelItem)].plans.forEach((plan) => {
            const planChoice: PlanChoice = {
                agentAssisted: plan.planChoice.agentAssisted,
                cafeteria: plan.planChoice.cafeteria,
                // TODO : remove hardcoding after MON-484 is implemented
                continuous: false,
                id: plan.planChoice.id,
                planId: plan.planChoice.plan.id,
                plan: plan.planChoice.plan,
                // eslint-disable-next-line radix
                planYearId: parseInt(value),
                taxStatus: plan.planChoice.taxStatus,
            };
            const duplicateChoice = this.PRPlanChoicesToBeUpdated.filter((choice) => choice.id === plan.planChoice.id).pop();
            if (duplicateChoice) {
                const duplicateChoiceIndex = this.PRPlanChoicesToBeUpdated.indexOf(duplicateChoice);
                this.PRPlanChoicesToBeUpdated.splice(duplicateChoiceIndex, 1);
            }
            this.PRPlanChoicesToBeUpdated.push(planChoice);
        });
    }

    /**
     * update the details of continuous plan
     * @returns nothing
     */
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
                            this.dateService.toDate(continuousPlanDatesValue.enrollmentStartDate),
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
     * create a plan year for aflac plans
     * @param updateChoice to check for updation
     */
    createPlanYear(updateChoice: boolean): void {
        if (this.createPlanYearForm.invalid) {
            return;
        }
        const planYear = this.constructPlanyearPayload();
        this.benefitsOfferingService
            .savePlanYear(planYear, this.mpGroup)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((resp) => {
                    const location: string = resp.headers.get("location");
                    const stringArray = location.split("/");
                    this.planYearId = Number(stringArray[stringArray.length - 1]);
                    this.store.dispatch(new UpdateCurrentPlanYearId(this.planYearId));
                    if (!this.createdPlanYearValue) {
                        this.createdPlanYearValue = this.createPlanYearForm.value;
                    }
                    if (updateChoice) {
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
            .subscribe();
    }

    /**
     * onNext : method is getting triggered when saveoffering button is clicked.
     */
    // eslint-disable-next-line complexity
    onNext(): void {
        if (
            this.coveragePeriodPRPlansPanelList.length !== 0 &&
            this.planYearform.controls.samePlanYear &&
            this.planYearform.controls.samePlanYear.value === true &&
            this.createPlanYearForm.invalid
        ) {
            return;
        }
        if (
            this.coveragePeriodPRPlansPanelList.length !== 0 &&
            this.planYearform.controls.samePlanYear &&
            this.planYearform.controls.samePlanYear.value === false &&
            this.planYearOptionsForm.invalid
        ) {
            return;
        }
        if (
            this.coveragePeriodContinuousPlansPanelList.length !== 0 &&
            this.continuousPlanform.controls.sameCoveragePlanDate.value === true &&
            this.continuousPlanform.controls["continuousPlanDates"].invalid
        ) {
            return;
        }
        if (
            this.coveragePeriodContinuousPlansPanelList.length !== 0 &&
            this.continuousPlanform.controls.sameCoveragePlanDate.value === false &&
            this.continuousPlanform.controls["continuousPlanDatesForm"].invalid
        ) {
            return;
        }
        if (
            this.coveragePeriodNonAflacPlanList.length !== 0 &&
            this.nonAflacPlanForm.controls.sameCoveragePlanDate &&
            this.nonAflacPlanForm.controls.sameCoveragePlanDate.value === true &&
            this.nonAflacPlan.invalid
        ) {
            return;
        }
        if (
            this.multiNonAflacYear &&
            this.coveragePeriodNonAflacPlanList.length !== 0 &&
            this.nonAflacPlanForm.controls.sameCoveragePlanDate &&
            this.nonAflacPlanForm.controls.sameCoveragePlanDate.value === false &&
            this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate &&
            this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.value === false &&
            this.nonAflacPlanYearOptionsForm.invalid
        ) {
            return;
        }
        if (
            !this.multiNonAflacYear &&
            this.coveragePeriodNonAflacPlanList.length !== 0 &&
            this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate &&
            this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.value === false &&
            this.nonAflacPlanYearOptionsForm.invalid
        ) {
            return;
        }
        if (this.coveragePeriodNonAflacPlanList.length && this.exceptions.length && !this.validateCoverageDates()) {
            return;
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
            return;
        }
        if (this.approvalModelOpen && !this.approveReceived) {
            this.displayDialog();
            return;
        }
        this.isLoading = true;
        if (
            this.planYearform.controls.samePlanYear &&
            this.planYearform.controls.samePlanYear.value &&
            !this.comparePreviousPlan() &&
            !(this.createdPlanYearValue && JSON.stringify(this.createPlanYearForm.value) === JSON.stringify(this.createdPlanYearValue))
        ) {
            this.createPlanYear(true);
        } else if (
            this.planYearform.controls.samePlanYear &&
            ((this.comparePreviousPlan() && !this.planYearToPopulate) || (this.comparePreviousPlan() && !this.isDateRangeSame()))
        ) {
            this.updateExistingPlanYear(true);
        } else if (this.planYearform.controls.samePlanYear) {
            this.updateAllPRPlanChoices();
        } else {
            this.updateAllPRPlanChoiceToServer();
        }
        if (this.coveragePeriodPRPlansPanelList.length === 0) {
            this.updateContinuousPlanChoices();
        }
        if (
            !this.nonAflacPlanForm.get("sameAflacIndividualPlanDate").value &&
            this.coveragePeriodPRPlansPanelList.length === 0 &&
            this.coveragePeriodContinuousPlansPanelList.length === 0 &&
            this.coveragePeriodNonAflacPlanList.length !== 0
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
            let selectedPlanYearId: number;
            const selectedPlanYearIds = [];
            for (const planYear in this.nonAflacPlanYearOptionsForm.value) {
                // eslint-disable-next-line no-prototype-builtins
                if (this.nonAflacPlanYearOptionsForm.value.hasOwnProperty(planYear)) {
                    selectedPlanYearIds.push(this.nonAflacPlanYearOptionsForm.value[planYear]);
                }
            }
            if (selectedPlanYearIds.length === 1) {
                selectedPlanYearId = selectedPlanYearIds[0];
            }
            const selectedPlanYears = this.nonAflacPlanYearOptions.filter((planYear) => selectedPlanYearIds.includes(planYear.value));
            if (selectedPlanYearIds.length > 1) {
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
                this.benefitsOfferingService
                    .updatePlanYearVasExceptions(selectedPlanYearId, this.mpGroup)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe();
            }
        }
    }

    /**
     * Method to validate the coverage dates
     * @returns { boolean } returns if coverage dates are valid or not
     */
    validateCoverageDates(): boolean {
        let isValid = true;
        let effectiveStarting: string;
        let expiresAfter: string;
        if (this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.value) {
            effectiveStarting = this.datepipe.transform(
                this.dateService.toDate(this.coverageDateGroup.controls[EFFECTIVE_STARTING].value || ""),
                DateFormats.YEAR_MONTH_DAY,
            );
            expiresAfter = this.datepipe.transform(
                this.dateService.toDate(this.coverageDateGroup.controls[EXPIRES_AFTER].value || ""),
                DateFormats.YEAR_MONTH_DAY,
            );
        } else {
            effectiveStarting = this.datepipe.transform(
                this.dateService.toDate(this.coverageDateGroupForNonAflac.controls[EFFECTIVE_STARTING].value || ""),
                DateFormats.YEAR_MONTH_DAY,
            );
            expiresAfter = this.datepipe.transform(
                this.dateService.toDate(this.coverageDateGroupForNonAflac.controls[EXPIRES_AFTER].value || ""),
                DateFormats.YEAR_MONTH_DAY,
            );
        }
        this.exceptions.forEach((exception) => {
            if (
                this.datepipe.transform(exception.validity.expiresAfter, DateFormats.YEAR_MONTH_DAY) < effectiveStarting ||
                this.datepipe.transform(exception.validity.effectiveStarting, DateFormats.YEAR_MONTH_DAY) > expiresAfter
            ) {
                exception.isValid = false;
                isValid = false;
            } else {
                exception.isValid = true;
            }
        });
        return isValid;
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
     * create a plan year for non aflac plans
     * @param updateChoice to check for updating
     */
    createNonAflacPlanYear(updateChoice: boolean): void {
        if (this.nonAflacPlan.invalid) {
            return;
        }
        const planYear = this.constructPlanyearPayloadForNonAflac();
        this.benefitsOfferingService
            .savePlanYear(planYear, this.mpGroup)
            .pipe(
                switchMap((resp) => {
                    const location: string = resp.headers.get("location");
                    const stringArray = location.split("/");
                    this.nonAflacPlanYearId = Number(stringArray[stringArray.length - 1]);
                    if (!this.createdNonAflacPlanYearValue) {
                        this.createdNonAflacPlanYearValue = this.nonAflacPlan.value;
                    }
                    if (updateChoice) {
                        this.updateAllNonAflacPlanChoices();
                    }
                    this.dialogError = false;
                    if (this.dialogOpen) {
                        this.getPlanYears(true);
                        this.closeModal();
                    }
                    if (updateChoice && this.exceptions.length) {
                        return this.benefitsOfferingService.updatePlanYearVasExceptions(this.nonAflacPlanYearId, this.mpGroup);
                    }
                    return EMPTY;
                }),
                catchError((error) => {
                    this.setErrorResponse(error);
                    return of(null);
                }),
            )
            .subscribe();
    }

    /**
     * set plan year value for non aflac plans
     * @returns planYear object for payload
     */
    constructPlanyearPayloadForNonAflac(): PlanYear {
        const enrollmentPeriod: EnrollmentPeriod = {
            effectiveStarting: this.datepipe.transform(
                this.dateService.toDate(this.enrollmentDateGroupForNonAflac.controls[EFFECTIVE_STARTING].value || ""),
                DateFormats.YEAR_MONTH_DAY,
            ),
            expiresAfter: this.datepipe.transform(
                this.dateService.toDate(this.enrollmentDateGroupForNonAflac.controls[EXPIRES_AFTER].value || ""),
                DateFormats.YEAR_MONTH_DAY,
            ),
        };
        const coveragePeriod: CoveragePeriod = {
            effectiveStarting: this.datepipe.transform(
                this.dateService.toDate(this.coverageDateGroupForNonAflac.controls[EFFECTIVE_STARTING].value || ""),
                DateFormats.YEAR_MONTH_DAY,
            ),
            expiresAfter: this.datepipe.transform(
                this.dateService.toDate(this.coverageDateGroupForNonAflac.controls[EXPIRES_AFTER].value || ""),
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
                takeUntil(this.unsubscribe$),
                filter((selectedValue) => updateChoice),
                map((resp) => {
                    this.updateAllNonAflacPlanChoices();
                }),
                switchMap((response) => {
                    if (this.exceptions.length) {
                        return this.benefitsOfferingService.updatePlanYearVasExceptions(this.nonAflacPlanYearId, this.mpGroup);
                    }
                    return EMPTY;
                }),
                catchError((errorResp) => {
                    this.setErrorResponse(errorResp);
                    return EMPTY;
                }),
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
                        // TODO : remove hardcoding after MON-484 is implemented
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
     * update all non aflac plan choices to server
     */
    updateAllNonAflacPlanChoiceToServer(): void {
        const nonAflacPlanChoicesToBeUpdatedToServer = [];
        if (this.nonAflacPlanChoicesToBeUpdated.length <= 0) {
            this.sideNavService.defaultStepPositionChanged$.next(CARRIER_FORM_STEP);
        } else {
            this.nonAflacPlanChoicesToBeUpdated.forEach((choice) => {
                nonAflacPlanChoicesToBeUpdatedToServer.push(this.benefitsOfferingService.updatePlanChoice(choice, this.mpGroup));
            });
            forkJoin(nonAflacPlanChoicesToBeUpdatedToServer)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        this.isLoading = false;
                        this.sideNavService.defaultStepPositionChanged$.next(CARRIER_FORM_STEP);
                        this.store.dispatch(new MapPlanChoicesToPanelProducts());
                    },
                    (error) => {
                        this.error = true;
                        this.isLoading = false;
                    },
                );
        }
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
     * update plan choice for continuous aflac plan
     * @returns nothing
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
            this.coveragePeriodPRPlansPanelList.forEach((panelItem) => {
                panelItem.plans.forEach((plan) => {
                    const planChoice: PlanChoice = {
                        agentAssisted: plan.planChoice.agentAssisted,
                        cafeteria: plan.planChoice.cafeteria,
                        // TODO : remove hardcoding after MON-484 is implemented
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
     * set coverage start function for both pretax and posttax aflac plans
     */
    getCoverageStartFunction(taxStatus: string): string {
        if (taxStatus.includes(VARIABLE) && this.variableTaxStatusPlan.length !== 0) {
            return this.createPlanYearForm.get(COVERAGE_START_FUNCTION).value;
        }
        return null;
    }

    /**
     * maps effective starting and coverage start function to all choices if apply same check box is selected
     * @returns nothing
     */
    updateAllContinuousPlanDates(): void {
        const continuousPlanDatesValue = this.continuousPlan.value;
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
                        effectiveStarting: this.datepipe.transform(
                            this.continuousPlan.controls["enrollmentStartDate"].value,
                            AppSettings.DATE_FORMAT,
                        ),
                    },
                    // If plan belongs to VSP PC assign 1st day of month for coverage start date
                    coverageStartFunction:
                        panel.carrier.id === CarrierId.VSP_INDIVIDUAL_VISION
                            ? coverageStartFunction.NEXT_FIRST_OF_MONTHNEXT_FIRST_OF_MONTH
                            : continuousPlanDatesValue.coverageStartFunction,
                    taxStatus: plan.planChoice.taxStatus,
                };
                this.continuousPlanChoicesToBeUpdated.push(planChoice);
            });
        });
        this.updateContinuousPlanChoicesToServer();
    }
    /**
     * This method is used to update all Plan year restricted plan choices to server
     */
    updateAllPRPlanChoiceToServer(): void {
        const PRPlanChoicesToBeUpdatedToServer = [];
        if (this.PRPlanChoicesToBeUpdated.length === 0) {
            this.updateContinuousPlanChoices();
        }
        this.PRPlanChoicesToBeUpdated.forEach((choice) => {
            PRPlanChoicesToBeUpdatedToServer.push(this.benefitsOfferingService.updatePlanChoice(choice, this.mpGroup));
        });
        forkJoin(PRPlanChoicesToBeUpdatedToServer)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    const sameAflacIndividualPlanDateControl: AbstractControl = this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate;
                    this.isLoading = false;
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
                        ((sameAflacIndividualPlanDateControl && sameAflacIndividualPlanDateControl.value) ||
                            this.coveragePeriodNonAflacPlanList.length === 0) &&
                        this.coveragePeriodContinuousPlansPanelList.length === 0
                    ) {
                        this.store.dispatch(new MapPlanChoicesToPanelProducts());
                        this.sideNavService.defaultStepPositionChanged$.next(CARRIER_FORM_STEP);
                    }
                },
                (error) => {
                    this.error = true;
                    this.isLoading = false;
                },
            );
    }
    /**
     * updates all continous plan choices to server
     * @returns nothing
     */
    updateContinuousPlanChoicesToServer(): void {
        const planChoicesToBeUpdatedToServer: Observable<void>[] = [];
        if (
            this.continuousPlanChoicesToBeUpdated.length <= 0 &&
            (this.nonAflacPlanForm.controls.sameAflacIndividualPlanDate.value || this.coveragePeriodNonAflacPlanList.length === 0)
        ) {
            this.store.dispatch(new MapPlanChoicesToPanelProducts());
            this.sideNavService.defaultStepPositionChanged$.next(CARRIER_FORM_STEP);
        } else {
            this.createGroupAttributeForContinuousPlan();
            this.continuousPlanChoicesToBeUpdated.forEach((planChoice) => {
                planChoicesToBeUpdatedToServer.push(this.benefitsOfferingService.updatePlanChoice(planChoice, this.mpGroup));
            });
            forkJoin(planChoicesToBeUpdatedToServer)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        this.isLoading = false;
                        if (this.coveragePeriodPRPlansPanelList.length === 0 && this.coveragePeriodNonAflacPlanList.length !== 0) {
                            this.updateCoverageDatesForNonAflacPlan();
                        }
                        if (
                            this.nonAflacPlanForm.get("sameAflacIndividualPlanDate").value ||
                            this.coveragePeriodNonAflacPlanList.length === 0
                        ) {
                            this.store.dispatch(new MapPlanChoicesToPanelProducts());
                            this.sideNavService.defaultStepPositionChanged$.next(CARRIER_FORM_STEP);
                        }
                    },
                    (error) => {
                        this.error = true;
                        this.isLoading = false;
                    },
                );
        }
    }

    /**
     * create group attribute for continuous plans
     */
    createGroupAttributeForContinuousPlan(): void {
        if (this.coveragePeriodPRPlansPanelList.length !== 0) {
            this.accountService
                .createGroupAttribute({
                    attribute: COVERAGE_START_DATE,
                    value: this.datepipe.transform(
                        this.continuousPlan.controls.earliestCoverageStart.value,
                        AppSettings.DATE_FORMAT_MM_DD_YYYY,
                    ),
                })
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (res) => {
                        this.isLoading = false;
                    },
                    (error) => {
                        this.error = true;
                        this.isLoading = false;
                    },
                );
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
            const reg = new RegExp(AppSettings.NumberValidationRegex);
            const inputDate = this.dateService.toDate(control.value);
            if ((!inputDate || isNaN(inputDate.getTime())) && !reg.test(control.value)) {
                return { required: true };
            }
            if (!this.dateService.isValid(inputDate) && control.value.lenght !== 0) {
                return { invalid: true };
            }
            inputDate.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);
            if (inputDate < date) {
                return { pastDate: true };
            }
            return null;
        }
        return { required: true };
    }
    // the below method validates the input date to be greater than current date and not more than 180 days from current date
    checkContinousEnrollmentDate(control: FormControl): any {
        if (control.value) {
            const date: Date = new Date();
            const inputDate: Date = this.dateService.toDate(control.value);
            if (!inputDate || isNaN(inputDate.getTime())) {
                return { required: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            if (inputDate < date) {
                return { pastDate: true };
            }
            if (
                inputDate < date ||
                (inputDate.getDate() - date.getDate()) / (MILLISECONDS * SECONDS * MINUTES * HOURS_PER_DAY) >= NO_OF_DAYS_IN_SIX_MONTHS
            ) {
                return { invalid: true };
            }
            return null;
        }
    }

    /**
     * validations for earliest coverage start date of continuous aflac plans
     * @param control Form control to take the earliest coverage start date value
     * @returns ValidationErrors
     */
    checkEarliestCoverageStartDate(control: FormControl): ValidationErrors | undefined {
        if (control.value) {
            const date: Date = new Date();
            const enrollmentStartDate: Date = this.dateService.toDate(this.continuousPlan.get("enrollmentStartDate").value || "");
            const inputDate: Date = this.dateService.toDate(control.value);
            if (!inputDate || isNaN(inputDate.getTime())) {
                return { required: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            if (inputDate < date) {
                return { pastDate: true };
            }
            if (
                inputDate < date ||
                (inputDate.getDate() - date.getDate()) / (MILLISECONDS * SECONDS * MINUTES * HOURS_PER_DAY) >= NO_OF_DAYS_IN_SIX_MONTHS
            ) {
                return { invalid: true };
            }
            if (inputDate <= enrollmentStartDate) {
                return { beforeEnrollmentStartDate: true };
            }
            return null;
        }
        return undefined;
    }

    /**
     * To validate enrollment end date should be greater than effective starting date
     * @param control Form control to take the enrollment end date value
     * @returns ValidationErrors
     */
    checkEnrollemtEndDate(control: FormControl): ValidationErrors {
        if (control.value) {
            let date = new Date();
            const inputDate = this.dateService.toDate(control.value);
            if (this.enrollmentDateGroup && this.enrollmentDateGroup.controls[EFFECTIVE_STARTING].value) {
                date = this.dateService.toDate(this.enrollmentDateGroup.controls[EFFECTIVE_STARTING].value);
                this.checkForEnrollmentDates(date, inputDate, true, false);
            }
            if (!inputDate || isNaN(inputDate.getTime())) {
                this.dateUpdatedMessage = false;
                return { requirement: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            if (inputDate < date) {
                this.dateUpdatedMessage = false;
                return { invalidEndDate: true };
            }
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            if (inputDate < currentDate) {
                this.dateUpdatedMessage = false;
                return { pastDate: true };
            }
            this.populateCoverageEnddate(this.enrollmentDateGroup.controls.expiresAfter.value);
            if (this.isCoverageDateError) {
                return { invalid: true };
            }
            if (
                this.allPlanYears &&
                this.planYearToPopulate &&
                this.createPlanYearForm.value.coveragePeriod.effectiveStarting === this.planYearToPopulate.coveragePeriod.effectiveStarting
            ) {
                this.dateUpdatedMessage = false;
            }
        }
        return null;
    }

    /**
     * To validate enrollment end date of non-aflac plans should be greater than effective starting date
     * @param control Form control to take the enrollment end date value
     * @returns ValidationErrors
     */
    checkEnrollemtEndDateForNonAflac(control: FormControl): ValidationErrors {
        if (control.value) {
            let date = new Date();
            const inputDate = this.dateService.toDate(control.value);
            if (this.enrollmentDateGroupForNonAflac && this.enrollmentDateGroupForNonAflac.controls[EFFECTIVE_STARTING].value) {
                date = this.dateService.toDate(this.enrollmentDateGroupForNonAflac.controls[EFFECTIVE_STARTING].value);
                this.checkForEnrollmentDates(date, inputDate, false, false);
            }
            if (!inputDate || isNaN(inputDate.getTime())) {
                this.dateUpdatedMessage = false;
                return { requirement: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            if (inputDate < date) {
                this.dateUpdatedMessage = false;
                return { invalidEndDate: true };
            }
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            if (inputDate < currentDate) {
                this.dateUpdatedMessage = false;
                return { pastDate: true };
            }
            this.populateCoverageEndDateForNonAflacPlan(this.enrollmentDateGroupForNonAflac.controls.expiresAfter.value);
            if (this.isCoverageDateError) {
                return { invalid: true };
            }
            if (
                this.allPlanYears &&
                this.nonAflacPlanYearToPopulate &&
                this.nonAflacPlan.value.coverageDateGroupForNonAflac.effectiveStarting ===
                    this.nonAflacPlanYearToPopulate.coveragePeriod.effectiveStarting
            ) {
                this.dateUpdatedMessage = false;
            }
        }
        return null;
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
            if (inputDate < new Date()) {
                return { pastDate: true };
            }
            if (inputDate < date) {
                return { beforeCoverageStartDate: true };
            }
            return null;
        }
    }

    /**
     * validation for coverage end date value for non aflac plan
     * @param control Form control to take the coverage end date value
     * @returns ValidationErrors
     */
    checkCoverageEndDateForNonAflac(control: FormControl): ValidationErrors | undefined {
        if (control.value) {
            let date = new Date();
            if (this.coverageDateGroupForNonAflac) {
                date = this.dateService.toDate(this.coverageDateGroupForNonAflac.controls[EFFECTIVE_STARTING].value || "");
            }
            const inputDate = this.dateService.toDate(control.value);
            if (!inputDate) {
                return { requirement: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            if (inputDate < new Date()) {
                return { pastDate: true };
            }
            if (inputDate < date) {
                return { beforeCoverageStartDate: true };
            }
            return null;
        }
        return undefined;
    }

    /**
     * validation for coverage start date
     * @param control Form control to take the coverage start date value
     * @returns CoverageStartDate
     */
    checkCoverageStartDate(control: FormControl): CoverageStartDate | undefined {
        if (control.value) {
            const date = new Date();
            let errorType = null;
            const enrollmentEnddate = this.dateService.toDate(this.enrollmentDateGroup.controls[EXPIRES_AFTER].value || "");
            const enrollmentStartDate = this.dateService.toDate(this.enrollmentDateGroup.controls[EFFECTIVE_STARTING].value || "");
            const inputStartDate = this.dateService.toDate(control.value);
            const sixMonthsFromEnrollmentStartDate = this.dateService.toDate(enrollmentStartDate);
            sixMonthsFromEnrollmentStartDate?.setMonth(sixMonthsFromEnrollmentStartDate.getMonth() + SIX_MONTHS);
            sixMonthsFromEnrollmentStartDate?.setDate(sixMonthsFromEnrollmentStartDate.getDate() - FIRST_DATE_OF_MONTH_ONE_DAY);
            this.maxCoverageStartDate = this.dateService.toDate(sixMonthsFromEnrollmentStartDate);
            if (inputStartDate > sixMonthsFromEnrollmentStartDate) {
                errorType = { shouldBe180DaysFromToday: true };
            }
            const threeMonthsFromEnrollmentStartDate = this.dateService.toDate(enrollmentStartDate);
            threeMonthsFromEnrollmentStartDate?.setMonth(threeMonthsFromEnrollmentStartDate.getMonth() + THREE_MONTHS);
            threeMonthsFromEnrollmentStartDate?.setDate(threeMonthsFromEnrollmentStartDate.getDate() - FIRST_DATE_OF_MONTH_ONE_DAY);
            this.approvalModelOpen = false;
            if (inputStartDate > threeMonthsFromEnrollmentStartDate) {
                if (!this.approveReceived) {
                    this.approvalModelOpen = true;
                } else {
                    this.approvalModelOpen = false;
                }
            }
            if (!this.isAflacIndividualCafeteriaVasOnly) {
                const fifteenDaysFromEnrollmentEndDate = this.dateService.toDate(enrollmentEnddate);
                fifteenDaysFromEnrollmentEndDate?.setDate(fifteenDaysFromEnrollmentEndDate.getDate() + DAY_DIFF_NON_AFLAC);
                this.minDateCoverage = this.dateService.toDate(fifteenDaysFromEnrollmentEndDate);
                this.enrollmentDifferenceInDays = DAY_DIFF_NON_AFLAC;
            } else {
                const oneDayFromEnrollmentEndDate = this.dateService.toDate(enrollmentEnddate);
                oneDayFromEnrollmentEndDate?.setDate(oneDayFromEnrollmentEndDate.getDate() + FIRST_DATE_OF_MONTH_ONE_DAY);
                this.minDateCoverage = this.dateService.toDate(oneDayFromEnrollmentEndDate);
                this.enrollmentDifferenceInDays = DAY_DIFF_AFLAC;
            }
            inputStartDate.setHours(0, 0, 0);
            date.setHours(0, 0, 0);
            if (inputStartDate < date) {
                errorType = { pastDate: true };
            }
            const inputCoverageStartDate = inputStartDate.getDate();
            if (DateInfo.LAST_DATES_OF_MONTH.includes(inputCoverageStartDate)) {
                this.enteredDate = this.dateService.format(inputStartDate, DateFormats.MONTH_DAY_YEAR);
                errorType = { dateNotAllowed: true };
            }
            if (
                errorType === null &&
                !this.isCoverageDateError &&
                enrollmentEnddate &&
                this.dateService.getDifferenceInDays(inputStartDate, enrollmentEnddate) < this.enrollmentDifferenceInDays
            ) {
                errorType = { minimumDays: true };
            }
            return errorType;
        }
        return undefined;
    }

    /**
     * validation for coverage start date of non aflac plan
     * @param control Form control to take the coverage start date value
     * @returns validation errors, if any, or null
     */
    checkCoverageStartDateForNonAflac(control: FormControl): null | ValidationErrors | undefined {
        if (control.value) {
            const date = new Date();
            let errorType = null;
            const enrollmentEnddate = this.dateService.toDate(this.enrollmentDateGroupForNonAflac?.controls[EXPIRES_AFTER].value || "");
            const enrollmentEffectiveStartDate = this.dateService.toDate(
                this.enrollmentDateGroupForNonAflac?.controls[EFFECTIVE_STARTING].value || "",
            );
            const inputStartDate = this.dateService.toDate(control.value);
            const sixMonthsFromEnrollmentStartDate = this.dateService.toDate(enrollmentEffectiveStartDate);
            sixMonthsFromEnrollmentStartDate?.setMonth(sixMonthsFromEnrollmentStartDate.getMonth() + SIX_MONTHS);
            sixMonthsFromEnrollmentStartDate?.setDate(sixMonthsFromEnrollmentStartDate.getDate() - FIRST_DATE_OF_MONTH_ONE_DAY);
            this.maxCoverageStartDate = this.dateService.toDate(sixMonthsFromEnrollmentStartDate);
            if (inputStartDate > sixMonthsFromEnrollmentStartDate) {
                errorType = { shouldBe180DaysFromToday: true };
            }
            const threeMonthsFromEnrollmentStartDate = this.dateService.toDate(enrollmentEffectiveStartDate);
            threeMonthsFromEnrollmentStartDate?.setMonth(threeMonthsFromEnrollmentStartDate.getMonth() + THREE_MONTHS);
            threeMonthsFromEnrollmentStartDate?.setDate(threeMonthsFromEnrollmentStartDate.getDate() - FIRST_DATE_OF_MONTH_ONE_DAY);
            this.approvalModelOpen = false;
            if (inputStartDate > threeMonthsFromEnrollmentStartDate) {
                if (!this.approveReceived) {
                    this.approvalModelOpen = true;
                } else {
                    this.approvalModelOpen = false;
                }
            }
            if (!this.isNonAflacIndividualCafeteriaVasOnly && !this.isVasPlan) {
                const fifteenDaysFromEnrollmentEndDate = this.dateService.toDate(enrollmentEnddate);
                fifteenDaysFromEnrollmentEndDate?.setDate(fifteenDaysFromEnrollmentEndDate.getDate() + DAY_DIFF_NON_AFLAC);
                this.minDateCoverageNonAflac = this.dateService.toDate(fifteenDaysFromEnrollmentEndDate);
                if (inputStartDate.getDate() !== FIRST_DATE_OF_MONTH_ONE_DAY) {
                    errorType = { shouldBeFirstDateOfMonth: true };
                }
                this.enrollmentDifferenceInDays = this.onlyADVOrVASPlansPresent ? DAY_DIFF_NON_AFLAC_ADV : DAY_DIFF_NON_AFLAC;
            } else {
                const oneDayFromEnrollmentEndDate = this.dateService.toDate(enrollmentEnddate);
                oneDayFromEnrollmentEndDate?.setDate(oneDayFromEnrollmentEndDate.getDate() + FIRST_DATE_OF_MONTH_ONE_DAY);
                this.minDateCoverageNonAflac = this.dateService.toDate(oneDayFromEnrollmentEndDate);
                this.enrollmentDifferenceInDays = DAY_DIFF_AFLAC;
            }
            inputStartDate.setHours(0, 0, 0);
            date.setHours(0, 0, 0);
            if (inputStartDate < date) {
                errorType = { pastDate: true };
            }
            if (inputStartDate.getDate() !== FIRST_DATE_OF_MONTH_ONE_DAY && !this.isNonAflacIndividualCafeteriaVasOnly && !this.isVasPlan) {
                errorType = { shouldBeFirstDateOfMonth: true };
            }
            if (
                errorType === null &&
                !this.isCoverageDateError &&
                enrollmentEnddate &&
                this.dateService.getDifferenceInDays(inputStartDate, enrollmentEnddate) <
                    (this.dialogOpen ? this.enrollmentDifferenceInDaysForModal : this.enrollmentDifferenceInDays)
            ) {
                errorType = { minimumDays: true };
            }
            return errorType;
        }
        return undefined;
    }

    /**
     * This function will be responsible for populating the end date with 1 year of ahead of start date
     * @param startDate take the start date of coverage
     * @param event Matselect change attribute passed through whenever the mat select dropdwon gets changes
     */
    populateEndDate(startDate: string, event?: MatSelectChange): void {
        if ((startDate && !event) || (event && event.source.selected && startDate)) {
            this.coverageStartDate = startDate;
            const inputStartDate = this.dateService.getOneDayLessThanYear(this.dateService.toDate(startDate));
            if (!event && this.planYearToPopulate && this.planYearToPopulate.coveragePeriod.expiresAfter) {
                this.coverageDateGroup
                    .get(EXPIRES_AFTER)
                    .patchValue(this.dateService.toDate(this.planYearToPopulate.coveragePeriod.expiresAfter));
            } else {
                this.coverageDateGroup.get(EXPIRES_AFTER).patchValue(inputStartDate);
            }
            if (this.isRole20User) {
                this.coverageDateGroup.get(EXPIRES_AFTER).enable();
            }
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

            const coverageDateGroupForNonAflacControl: FormGroup = this.nonAflacPlan.controls.coverageDateGroupForNonAflac as FormGroup;
            if (coverageDateGroupForNonAflacControl) {
                coverageDateGroupForNonAflacControl.controls.expiresAfter.patchValue(inputStartDate);
            }
            if (this.isRole20User && this.coverageDateGroupForNonAflac) {
                this.coverageDateGroupForNonAflac.controls.expiresAfter.enable();
            }
        }
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
        let isValid = true;
        if (this.coveragePeriodNonAflacPlanList.length && this.exceptions.length) {
            isValid = this.validateCoverageDates();
        }
        if (isValid) {
            this.createNonAflacPlanYear(false);
        } else {
            this.closeModal();
        }
    }
    /** This method will close the create plan year modal
     * @returns nothing
     */
    closeModal(): void {
        this.matDialog.closeAll();
        this.dialogOpen = false;
        this.dialogError = false;
        this.fieldErrorMessage = null;
        this.formDirective.resetForm();
        this.nonAflacPlanYearOptionsForm.controls[this.controlToReset].reset();
        this.nonAflacPlan.reset();
        this.populateCoverageEndDateForNonAflacPlan();
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
        this.matDialog.open(this.createPlanYearModal, { maxWidth: "696px", panelClass: "add-plan-year" });
        this.nonAflacPlanYearOptionsForm.controls[this.controlToReset].reset();
        this.dialogOpen = true;
        this.isVasPlan = isVas;
        if (isVas) {
            this.coverageDateGroupForNonAflac.controls.expiresAfter.enable();
            this.enrollmentDifferenceInDaysForModal = DAY_DIFF_AFLAC;
            this.dropDownForNextMonth = FUTURE_MONTH_NON_CAFE;
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
        if (!this.isVasPlan) {
            this.populateCoverageEndDateForNonAflacPlan();
        } else {
            const date = new Date();
            this.populateCoverageStartDateForVasOnly(date);
        }
    }
    /**
     * to open coverage date approval pop up and getting the response after close
     */
    displayDialog(): void {
        const dialogRef = this.empoweredModalService.openDialog(CoverageDateApprovalComponent);
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((approved) => {
                if (approved && approved !== null && approved !== undefined) {
                    this.approveReceived = true;
                    this.approvalModelOpen = false;
                    this.onNext();
                } else {
                    this.approveReceived = false;
                    this.approvalModelOpen = true;
                }
            });
    }
    // this will be triggered on click of back button
    onBack(): void {
        this.sideNavService.stepClicked$.next(2);
    }
    samePYCheckboxChangeTrigger(): void {
        if (this.planYearform.controls.samePlanYear && this.planYearform.controls.samePlanYear.value && this.createdPlanYearValue) {
            this.createPlanYearForm.patchValue(this.createdPlanYearValue);
        }
    }
    checkDateInput(event: any, control: AbstractControl, controlName?: string): void {
        if (event.target.value) {
            const inputDate = this.dateService.toDate(event.target.value);
            if (isNaN(inputDate.getTime())) {
                control.setErrors({ requirements: true });
            }
        }
    }
    // This method is used to check the account status
    fetchAccountStatus(): void {
        this.isAccountDeactivated = this.sideNavService.fetchAccountStatus();
    }

    /**
     * To check the plan name are same or not for updating or creating plan
     * @returns true if plan exist else false
     */
    comparePreviousPlan(): boolean {
        if (this.createPlanYearForm.value.name) {
            return this.planYearOptions.some(
                (planYear) =>
                    planYear &&
                    planYear.viewValue &&
                    this.createPlanYearForm.value.name.toLowerCase() === planYear.viewValue.toLowerCase() &&
                    planYear.type === PlanYearType.AFLAC_INDIVIDUAL,
            );
        }
        return false;
    }

    /**
     * To check the date field are altered or not for same plan
     */
    isDateRangeSame(): boolean {
        return (
            this.dateService.format(this.createPlanYearForm.value.coveragePeriod.effectiveStarting, DateFormats.MONTH_DAY_YEAR) ===
                this.planYearToPopulate.coveragePeriod.effectiveStarting &&
            this.dateService.format(this.createPlanYearForm.value.coveragePeriod.expiresAfter, DateFormats.MONTH_DAY_YEAR) ===
                this.planYearToPopulate.coveragePeriod.expiresAfter &&
            this.createPlanYearForm.value.enrollmentPeriod.effectiveStarting ===
                this.planYearToPopulate.enrollmentPeriod.effectiveStarting &&
            this.createPlanYearForm.value.enrollmentPeriod.expiresAfter === this.planYearToPopulate.enrollmentPeriod.expiresAfter
        );
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
     * API to update the existing plan with altered dates
     * @param updateChoice whether changes apply for all plans or not
     */
    updateExistingPlanYear(updateChoice: boolean): void {
        if (this.createPlanYearForm.invalid) {
            return;
        }
        const planYearPayload = this.constructPlanyearPayload();
        const planYearOptionDetails = this.planYearOptions.find(
            (planYear) => this.createPlanYearForm.value.name === planYear.viewValue && planYear.type === PlanYearType.AFLAC_INDIVIDUAL,
        );
        if (planYearOptionDetails) {
            this.planYearId = planYearOptionDetails.value;
        }
        this.benefitsOfferingService
            .updatePlanYear(planYearPayload, this.mpGroup, this.planYearId)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap(() => {
                    if (this.coveragePeriodNonAflacPlanList.length && this.exceptions.length) {
                        return this.benefitsOfferingService.updatePlanYearVasExceptions(this.planYearId, this.mpGroup);
                    }
                    return of(EMPTY);
                }),
            )
            .subscribe(
                (resp) => {
                    if (updateChoice) {
                        this.updateAllPRPlanChoices();
                    }
                },
                (errorResp) => {
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
                                    `secondary.portal.benefitsOffering.${errorResp.error.status}.${detail.code}.${detail.field}`,
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
                },
            );
    }

    /**
     * constructing payload for plan year API call
     * @returns planYear object for payload
     */
    constructPlanyearPayload(): PlanYear {
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
                this.dateService.toDate(this.coverageDateGroup.controls[EFFECTIVE_STARTING].value),
                DateFormats.YEAR_MONTH_DAY,
            ),
            expiresAfter: this.datepipe.transform(
                this.dateService.toDate(this.coverageDateGroup.controls[EXPIRES_AFTER].value),
                DateFormats.YEAR_MONTH_DAY,
            ),
        };
        return {
            coveragePeriod: coveragePeriod,
            name: this.createPlanYearForm.controls[NAME].value,
            enrollmentPeriod: enrollmentPeriod,
            type: PlanYearType.AFLAC_INDIVIDUAL,
        };
    }

    /**
     * Function will populate the dropdown of dates with 1st of month
     * @param date Based on date populate the date dropdown to have the difference of enrollment end date and coverage start date
     */
    populateCoverageEnddate(date?: Date): void {
        this.dateArray = [];
        if (this.cafeteriaStartDate && this.dateService.toDate(this.cafeteriaStartDate) >= new Date()) {
            this.dateArray.push(this.cafeteriaStartDate);
        }
        this.isCoverageDateError = false;
        let indexToPopulate = 0;
        if (!date) {
            date = new Date();
        }
        for (let index = 0; index < this.dropDownForNextMonth; index++) {
            const firstOfMonth = this.dateService.getFormattedFirstOfMonths(
                this.dateService.toDate(date),
                index + FIRST_DATE_OF_MONTH_ONE_DAY,
                DateFormats.MONTH_DAY_YEAR,
            );
            this.dateArray.push(firstOfMonth);
        }
        if (!this.isAflacIndividualCafeteriaVasOnly) {
            if (this.createPlanYearForm.controls.enrollmentPeriod.valid) {
                const enrollmentEnddate = this.dateService.toDate(this.enrollmentDateGroup.controls[EXPIRES_AFTER].value || "");
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
            const earliestDateControl: AbstractControl = this.continuousPlan.controls.earliestCoverageStart;
            if (earliestDateControl) {
                earliestDateControl.patchValue(this.dateService.toDate(this.dateArray[indexToPopulate]));
            }
            coverageStartDateControl.markAsTouched();
            this.populateEndDate(this.dateArray[indexToPopulate]);
        } else {
            this.populateCoverageStartDateForAflacCafeteria(date);
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
            !this.enrollmentDateGroup.controls.expiresAfter.value
        ) {
            date = this.dateService.toDate(this.cafeteriaStartDate);
            this.isCafeteriaDate = true;
        } else {
            date = this.enrollmentDateGroup.controls.expiresAfter.value
                ? this.dateService.toDate(this.enrollmentDateGroup.controls.expiresAfter.value)
                : date;
            this.isCafeteriaDate = false;
        }
        if (date) {
            let coverageStartDate: Date = this.dateService.toDate(date);
            if (!this.isCafeteriaDate) {
                coverageStartDate.setDate(coverageStartDate.getDate() + FIRST_DATE_OF_MONTH_ONE_DAY);
            }
            const coverageStartDateControl: AbstractControl = (this.createPlanYearForm.controls.coveragePeriod as FormGroup).controls
                .effectiveStarting;
            const getCoverageDate = coverageStartDate.getDate();
            if (DateInfo.LAST_DATES_OF_MONTH.includes(getCoverageDate)) {
                coverageStartDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            }
            coverageStartDateControl.patchValue(coverageStartDate);
            const earliestCoverageStartDateControl: AbstractControl = this.continuousPlan.controls.earliestCoverageStart;
            if (earliestCoverageStartDateControl) {
                earliestCoverageStartDateControl.patchValue(coverageStartDate);
            }
            if (this.planYearToPopulate && this.planYearToPopulate.coveragePeriod.effectiveStarting) {
                coverageStartDateControl.patchValue(this.dateService.toDate(this.planYearToPopulate.coveragePeriod.effectiveStarting));
                if (earliestCoverageStartDateControl) {
                    earliestCoverageStartDateControl.patchValue(this.planYearToPopulate.coveragePeriod.effectiveStarting);
                }
            }
        }
        this.populateEndDate(this.createPlanYearForm.get(COVERAGE_PERIOD_FORM_VAR).get(EFFECTIVE_STARTING).value);
    }

    /**
     * Function will populate the dropdown of dates with 1st of month for non aflac plans
     * @param date Based on date populate the date dropdown to have the difference of enrollment end date and coverage start date
     */
    populateCoverageEndDateForNonAflacPlan(date?: Date): void {
        this.dateArrayForNonAflac = [];
        this.isCoverageDateError = false;
        let indexToPopulate = 0;
        if (!date) {
            date = new Date();
        }
        for (let index = 0; index < this.dropDownForNextMonth; index++) {
            const firstOfMonth = this.dateService.getFormattedFirstOfMonths(
                this.dateService.toDate(date),
                index + FIRST_DATE_OF_MONTH_ONE_DAY,
                DateFormats.MONTH_DAY_YEAR,
            );
            this.dateArrayForNonAflac.push(firstOfMonth);
        }
        if (!this.isNonAflacIndividualCafeteriaVasOnly && !this.isVasPlan) {
            const nonAflacEnrollmentDateGroup: AbstractControl = this.nonAflacPlan.controls.enrollmentDateGroupForNonAflac;
            if (nonAflacEnrollmentDateGroup && nonAflacEnrollmentDateGroup.valid) {
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
            const coverageDateGroupForNonAflacControl: FormGroup = this.nonAflacPlan.controls.coverageDateGroupForNonAflac as FormGroup;
            if (coverageDateGroupForNonAflacControl) {
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
            }
            this.populateNonAflacEndDate(this.dateArrayForNonAflac[indexToPopulate]);
        } else {
            this.populateCoverageStartDateForVasOnly(date);
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
        const nonAflacCoverageDateGroup: FormGroup = this.nonAflacPlan.controls.coverageDateGroupForNonAflac as FormGroup;
        if (nonAflacCoverageDateGroup) {
            const coverageStartDateControl: AbstractControl = (this.nonAflacPlan.controls.coverageDateGroupForNonAflac as FormGroup)
                .controls.effectiveStarting;
            coverageStartDateControl.clearValidators();
            coverageStartDateControl.setValidators([
                Validators.required,
                this.checkDate.bind(this),
                this.checkCoverageStartDateForNonAflac.bind(this),
            ]);
            coverageStartDateControl.patchValue(coverageStartDate);
            if (this.nonAflacPlanYearToPopulate && this.nonAflacPlanYearToPopulate.coveragePeriod.effectiveStarting) {
                coverageStartDateControl.patchValue(
                    this.dateService.toDate(this.nonAflacPlanYearToPopulate.coveragePeriod.effectiveStarting),
                );
                this.continuousPlan.controls.earliestCoverageStart.patchValue(
                    this.nonAflacPlanYearToPopulate.coveragePeriod.effectiveStarting,
                );
            }
            this.populateNonAflacEndDate(coverageStartDateControl.value);
        }
    }

    ngAfterContentChecked(): void {
        if (document.getElementById("coverage_dates_start") && this.scrollInToMonAlertFlag) {
            this.scrollInToMonAlertFlag = false;
            window.scrollTo(0, 0);
        }
    }
    /**
     * This method will be called on selection change of coverage start dates of plan-year restricted plans
     * @param startDate is current input date-field value, used to compare with existing value
     * and sets @var dateUpdatedMessage value accordingly.
     *
     * This method contains @var dateUpdatedMessage which will set to true on change of coverage-dates drop-down
     */
    onChange(startDate: string): void {
        const inputStartDate = this.dateService.getOneDayLessThanYear(this.dateService.toDate(startDate));
        this.dateUpdatedMessage = false;
        if (
            this.createPlanYearForm.get(COVERAGE_PERIOD_FORM_VAR).get(EXPIRES_AFTER).value &&
            inputStartDate &&
            this.createPlanYearForm.get("coveragePeriod").get(EXPIRES_AFTER).value.valueOf() !== inputStartDate.valueOf()
        ) {
            this.dateUpdatedMessage = true;
        }
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
        if (!this.coveragePeriodPRPlansPanelList.length) {
            this.continuousPlan.get("earliestCoverageStart").disable();
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
     * This method will execute when we update the enrollment dates
     * This method is used to disable past dates in coverage start date date-picker by setting minimum coverage date.
     * Method is used to check condition to validate gi start date + 45 date with enrollment end date
     * @param planSpecific type of plan year to be updated
     */
    onDatesUpdated(planSpecific: string): void {
        const enrollmentDateGroupForNonAflacControl: AbstractControl = this.enrollmentDateGroupForNonAflac.controls.expiresAfter;
        if (this.isAflacIndividualCafeteriaVasOnly && enrollmentDateGroupForNonAflacControl && planSpecific === this.AFLAC_DATE_UPDATE) {
            const minDate = this.dateService.toDate(this.enrollmentDateGroup.controls[EXPIRES_AFTER].value);
            minDate.setDate(minDate.getDate() + DAY_DIFF_AFLAC);
            this.minDateCoverage = this.dateService.toDate(minDate);
        }
        if (
            (this.isNonAflacIndividualCafeteriaVasOnly || this.isVasPlan) &&
            enrollmentDateGroupForNonAflacControl &&
            planSpecific === this.NON_AFLAC_DATE_UPDATE
        ) {
            const minDate = this.dateService.toDate(enrollmentDateGroupForNonAflacControl.value);
            minDate.setDate(minDate.getDate() + DAY_DIFF_AFLAC);
            this.minDateCoverageNonAflac = minDate;
        }
        if (!this.isNonAflacIndividualCafeteriaVasOnly) {
            this.populateCoverageStartDate(planSpecific);
        }
        if (!this.isGIEnrollmentDatesOn || !this.isQ60) {
            // config indicator flag is able to toggle on / toggle off for may release.
            return;
        }
        const minEnrollmentExpDate = this.dateService.toDate(this.enrollmentDateGroup.controls[EXPIRES_AFTER].value || "");
        const giEnrollmentDateGroup: AbstractControl = this.enrollmentDateGroup.controls.guaranteedIssueEffectiveStarting;
        const guaranteedIssueStartDate = this.dateService.toDate(giEnrollmentDateGroup.value || "");
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
     * This method will populate the coverage start date drop down based on enrollment end date
     * @param planYearType the type of plan year to be updated
     */
    populateCoverageStartDate(planYearType: string): void {
        if (planYearType === this.AFLAC_DATE_UPDATE && !this.isAflacIndividualCafeteriaVasOnly) {
            // index 0 is skipped as it contains cafeteria start date and this is populated only on landing of availability dates screen
            for (let index = EXCLUDED_CAFETERIA_START_DATE_INDEX; index < this.dateArray.length; index++) {
                if (
                    this.dateService.getDifferenceInDays(
                        this.dateArray[index],
                        this.enrollmentDateGroup.controls[EXPIRES_AFTER].value || "",
                    ) > DAY_DIFF_NON_AFLAC
                ) {
                    this.createPlanYearForm.get(COVERAGE_PERIOD_FORM_VAR).get(EFFECTIVE_STARTING).patchValue(this.dateArray[index]);
                    break;
                }
            }
        } else {
            for (const date of this.dateArrayForNonAflac) {
                if (
                    this.dateService.getDifferenceInDays(
                        this.dateService.toDate(date),
                        this.dateService.toDate(this.enrollmentDateGroupForNonAflac.controls[EXPIRES_AFTER].value || ""),
                    ) > DAY_DIFF_NON_AFLAC
                ) {
                    this.coverageDateGroupForNonAflac.get(EFFECTIVE_STARTING).patchValue(date);
                    break;
                }
            }
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
            this.populateCoverageEnddate(sameDate ? this.enrollmentDateGroup.controls.expiresAfter.value : null);
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
                date = this.dateService.toDate(this.enrollmentDateGroupForNonAflac?.controls[EXPIRES_AFTER].value);
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
            if (inputDate < currentDate) {
                this.dateUpdatedMessage = false;
                return { pastDate: true };
            }
            if (inputDate > date && this.enrollmentDateGroupForNonAflac.controls[EXPIRES_AFTER].value) {
                this.dateUpdatedMessage = false;
                return { invalidStartDate: true };
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
            if (inputDate < currentDate) {
                this.dateUpdatedMessage = false;
                return { pastDate: true };
            }
            if (inputDate > date && this.enrollmentDateGroup.controls[EXPIRES_AFTER].value) {
                this.dateUpdatedMessage = false;
                return { invalidStartDate: true };
            }
            if (!this.isGIEnrollmentDatesOn || !this.isQ60) {
                // config indicator flag is able to toggle on / toggle off for may release.
                return null;
            }
            this.giMinDiffDate = this.benefitsOfferingHelperService.disableGIEnrollmentEndDate(
                control.value,
                DateInfo.GI_MIN_ENROLL_PERIOD_IN_DAYS,
            );
        }
        return null;
    }
    /**
     * Check enrollment start date and end date when either of dates is changed
     * @param startDate enrollment start date
     * @param endDate enrollment end date
     * @param isAflac check if plans are aflac
     * @param isStartDate check if start date is changed
     */
    checkForEnrollmentDates(startDate: Date, endDate: Date, isAflac: boolean, isStartDate: boolean): void {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        if (startDate < endDate && !isStartDate && startDate >= currentDate) {
            if (isAflac) {
                this.enrollmentDateGroup.controls.effectiveStarting.setErrors(null);
            } else {
                this.enrollmentDateGroupForNonAflac.controls.effectiveStarting.setErrors(null);
            }
        }
        if (startDate < endDate && isStartDate && startDate >= currentDate) {
            if (isAflac) {
                this.enrollmentDateGroup.controls.expiresAfter.setErrors(null);
            } else {
                this.enrollmentDateGroupForNonAflac.controls.expiresAfter.setErrors(null);
            }
        }
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
     * function to get aflac group plan year details and pre-populate dates for all plan years
     * @returns Observable<void>
     */
    getAflacGroupDates(): Observable<void> {
        return this.benefitsOfferingService.getPlanYears(this.mpGroup, false, false).pipe(
            takeUntil(this.unsubscribe$),
            switchMap((response: PlanYear[]) => {
                if (response.length && response[0].type === PlanYearType.AFLAC_GROUP) {
                    const aflacGroupPlanYearDetails: PlanYear = response[0];
                    if (this.coveragePeriodPRPlansPanelList.length > 0) {
                        this.createPlanYearForm.patchValue({
                            enrollmentPeriod: {
                                effectiveStarting: this.dateService.toDate(
                                    aflacGroupPlanYearDetails.enrollmentPeriod.effectiveStarting || "",
                                ),
                                expiresAfter: this.dateService.toDate(aflacGroupPlanYearDetails.enrollmentPeriod.expiresAfter || ""),
                                guaranteedIssueEffectiveStarting: this.dateService.toDate(
                                    aflacGroupPlanYearDetails.enrollmentPeriod.guaranteedIssueEffectiveStarting || "",
                                ),
                                guaranteedIssueExpiresAfter: this.dateService.toDate(
                                    aflacGroupPlanYearDetails.enrollmentPeriod.guaranteedIssueExpiresAfter || "",
                                ),
                            },
                            coveragePeriod: {
                                effectiveStarting: this.dateService.toDate(
                                    aflacGroupPlanYearDetails.coveragePeriod.effectiveStarting || "",
                                ),
                                expiresAfter: this.dateService.toDate(aflacGroupPlanYearDetails.coveragePeriod.expiresAfter || ""),
                            },
                        });
                    }
                    if (this.coveragePeriodContinuousPlansPanelList.length > 0) {
                        this.continuousPlan.patchValue({
                            enrollmentStartDate: this.dateService.toDate(
                                aflacGroupPlanYearDetails.enrollmentPeriod.effectiveStarting || "",
                            ),
                            earliestCoverageStart: this.dateService.toDate(
                                aflacGroupPlanYearDetails.coveragePeriod.effectiveStarting || "",
                            ),
                        });
                    }
                }
                return of(null);
            }),
        );
    }
    /**
     * to check duplicate plan year name and update validation
     */
    checkPlanYearName(): void {
        const nonAflacForm: AbstractControl = this.nonAflacPlanForm.get("nonAflacPlanDates").get("name");
        if (
            nonAflacForm &&
            nonAflacForm.valid &&
            this.createPlanYearForm.controls.name &&
            nonAflacForm.value === this.createPlanYearForm.controls.name.value
        ) {
            nonAflacForm.setErrors({ duplicatePlan: true });
        }
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
        const minDate = this.dateService.toDate(enrollmentStartDate.value || "");
        const giEnrollmentEndDate = this.dateService.addDays(minDate, DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS);
        this.giMinDiffDate = this.benefitsOfferingHelperService.disableGIEnrollmentEndDate(minDate, DateInfo.GI_MIN_ENROLL_PERIOD_IN_DAYS);
        this.giMaxDiffDate = this.benefitsOfferingHelperService.disableGIEnrollmentEndDate(minDate, DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS);
        this.createPlanYearForm.get("enrollmentPeriod").get(DateInfo.GI_EFFECTIVE_STARTING).patchValue(minDate);
        this.createPlanYearForm.get("enrollmentPeriod").get(DateInfo.GI_EXPIRES_AFTER).patchValue(giEnrollmentEndDate);
        if (enrollmentEndDate.value && this.dateService.checkIsAfter(giEnrollmentEndDate, enrollmentEndDate.value)) {
            this.createPlanYearForm.get("enrollmentPeriod").get(DateInfo.GI_EXPIRES_AFTER).patchValue(enrollmentEndDate.value);
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
            const guaranteedIssueStartDate = this.dateService.toDate(giEnrollmentDateGroup.value || "");
            const enrollmentDateGroup: AbstractControl = this.enrollmentDateGroup.controls.expiresAfter;
            const enrollmentExpiryDate = this.dateService.toDate(enrollmentDateGroup.value || "");
            const startDate = this.dateService.toDate(guaranteedIssueStartDate);
            const selectedDate = this.dateService.toDate(inputDate);
            const diffInDays = Math.abs(this.dateService.getDifferenceInDays(startDate, selectedDate));
            this.giMaxDiffDate = this.benefitsOfferingHelperService.disableGIEnrollmentEndDate(
                guaranteedIssueStartDate,
                DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS,
            );
            this.giEnrollEndDateDisable = this.giMaxDiffDate >= enrollmentExpiryDate || enrollmentExpiryDate < inputDate;
            const currentDate = this.dateService.toDate(this.currentDate.setHours(0, 0, 0, 0));
            if (inputDate < currentDate) {
                return { pastDate: true };
            }
            if (!this.dateService.isValid(enrollmentExpiryDate) && inputDate >= currentDate) {
                return { enterEnrollmentDate: true };
            }
            if (inputDate > enrollmentExpiryDate && diffInDays <= DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS) {
                return { greaterOEEndDate: true };
            }
            if (
                inputDate < guaranteedIssueStartDate &&
                diffInDays < DateInfo.GI_MIN_ENROLL_PERIOD_IN_DAYS &&
                guaranteedIssueStartDate > currentDate
            ) {
                return { beforeStartDate: true };
            }
            return this.benefitsOfferingHelperService.giPastDateCheck(inputDate, currentDate, diffInDays, enrollmentExpiryDate);
        }
        return null;
    }
    /**
     *@description Angular life cycle hook
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
