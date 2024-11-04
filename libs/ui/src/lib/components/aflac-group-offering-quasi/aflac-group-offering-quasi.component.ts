import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject } from "@angular/core";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Store } from "@ngxs/store";
import {
    AflacService,
    CoreService,
    AccountDetails,
    EligiblePlans,
    PartyType,
    BenefitsOfferingService,
    Carrier,
    CoveragePeriod,
} from "@empowered/api";
import { FormBuilder, FormGroup, Validators, ValidationErrors, FormControl, AbstractControl } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { StaticUtilService, UtilService, AccountInfoState } from "@empowered/ngxs-store";
import { Subject, of, combineLatest } from "rxjs";
import {
    DateFormats,
    CarrierId,
    ConfigName,
    ClientErrorResponseType,
    ClientErrorResponseCode,
    AccountImportTypes,
    AflacGroupOfferingError,
    TaxStatus,
    PlanYearType,
    Plan,
    Product,
    EnrollmentPeriod,
    PlanYear,
    PlanProductInfo,
    AgentInfo,
} from "@empowered/constants";
import { ConfirmIneligiblePlansComponent } from "../../business/confirm-ineligible-plans/confirm-ineligible-plans.component";
import { takeUntil, catchError, tap, switchMap, filter } from "rxjs/operators";
import { HttpErrorResponse } from "@angular/common/http";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { EmpoweredModalService } from "@empowered/common-services";
import { AgOfferingSubmitPopupComponent } from "../ag-offering-submit-popup/ag-offering-submit-popup.component";
import { DateService } from "@empowered/date";
import { AgRefreshService } from "../../services/ag-refresh.service";

const DIFF_IN_DAYS_VAR = "days";
const CARRIERS_TAB = "carriersTab";

export interface AgOfferingQuasiData {
    eligiblePlansInfo: EligiblePlans;
    opensFrom: string;
}

@Component({
    selector: "empowered-aflac-group-offering-quasi",
    templateUrl: "./aflac-group-offering-quasi.component.html",
    styleUrls: ["./aflac-group-offering-quasi.component.scss"],
})
export class AflacGroupOfferingQuasiComponent implements OnInit, OnDestroy {
    taxStatus = TaxStatus; // This assignment is to make the enum accessible inside the template
    productDisplayedColumns: string[] = ["product", "plan", "availableRiders", "taxStatus"];
    productDataSource: Plan[] = [];
    languageStrings: Record<string, string>;
    currentAccount: AccountDetails;
    showSpinner: boolean;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    aflacAgentInformation: AgentInfo[] = [];
    eligiblePlansInfo: EligiblePlans;
    aflacGroupOfferingForm: FormGroup;
    aflacGroupOfferingError: string;
    enrollmentDateGroup: FormGroup;
    coverageDateGroup: FormGroup;
    errorMessage: string;
    // M
    today: Date = new Date();
    contactBroker: string;
    brokerList: AgentInfo[];
    clientManagerList: AgentInfo[];
    agentDetails: AgentInfo;
    alertType = "danger";
    isSubmitted = false;
    agHardStopErrors: string[];
    nonSelfServiceProducts: string[];
    isHardStop = false;
    isNonSelfService = false;
    readonly RENEWAL_PLAN_OFFERING = "renewAgOffering";
    fieldErrorMessage = false;
    planYearErrorMessage: string;
    agMinDaysDifference: number;
    isRenewAgOffering: boolean;
    /**
     * This method will be automatically invoked when an instance of the class is created.
     * @param language is reference of LanguageService
     * @param store is reference of Store
     * @param aflacService is reference of AflacService
     * @param formBuilder is reference of FormBuilder
     * @param coreService is reference of CoreService
     * @param utilService is reference of UtilService
     * @param datePipe is reference of DatePipe
     * @param benefitsOfferingHelperService is reference of BenefitOfferingHelperService
     * @param empoweredModalService is reference of EmpoweredModalService
     * @param staticUtilService is reference of StaticUtilService
     * @param benefitsOfferingService is reference of BenefitsOfferingService
     */
    constructor(
        @Inject(MAT_BOTTOM_SHEET_DATA) readonly data: AgOfferingQuasiData,
        private readonly bottomSheetRef: MatBottomSheetRef<AflacGroupOfferingQuasiComponent>,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly aflacService: AflacService,
        private readonly formBuilder: FormBuilder,
        private readonly coreService: CoreService,
        private readonly utilService: UtilService,
        private readonly datePipe: DatePipe,
        private readonly staticUtilService: StaticUtilService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly agRefreshService: AgRefreshService,
        private readonly dateService: DateService,
    ) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     * used to call @method initializeForm which initializes form group
     * used to call @method fetchPrimaryLanguageStrings which fetches primary language strings
     * used to call @method fetchSecondaryLanguageStrings which fetches secondary language strings
     * used to call @method fetchAflacGroupRequiredInfo which fetches aflac group required information
     */
    ngOnInit(): void {
        this.isRenewAgOffering = this.data.opensFrom === this.RENEWAL_PLAN_OFFERING;
        this.initializeForm();
        this.fetchPrimaryLanguageStrings();
        this.fetchSecondaryLanguageStrings();
        this.fetchAflacGroupRequiredInfo();
    }
    /**
     * This method is used to initialize aflacGroupOfferingForm formGroup
     */
    initializeForm(): void {
        this.aflacGroupOfferingForm = this.formBuilder.group({
            planYearName: ["", Validators.required],
        });
        this.enrollmentDateGroup = this.formBuilder.group({
            effectiveStarting: ["", [Validators.required, this.checkDate.bind(this), this.checkEnrollmentStartDate.bind(this)]],
            expiresAfter: ["", [Validators.required, this.checkDate.bind(this), this.checkEnrollmentEndDate.bind(this)]],
        });
        this.coverageDateGroup = this.formBuilder.group({
            effectiveStarting: [{ disabled: true, value: "" }, [Validators.required]],
            expiresAfter: [{ disabled: true, value: "" }, [Validators.required]],
        });
        this.aflacGroupOfferingForm.addControl("enrollmentPeriod", this.enrollmentDateGroup);
        this.aflacGroupOfferingForm.addControl("coveragePeriod", this.coverageDateGroup);
    }
    /**
     * The below method is bound to form control and validates the input date to be greater than current date
     * @param control is formControl value
     * @returns ValidationErrors for currently called form-control
     */
    checkDate(control: FormControl): ValidationErrors {
        if (control.value && control.value.toString().trim().length > 0) {
            const inputDate: Date = this.dateService.toDate(control.value);
            if (!inputDate) {
                return { required: true };
            }
            const dateObject: Date = this.dateService.toDate(control.value);
            if (dateObject && !this.dateService.isValid(dateObject) && control.value.length !== 0) {
                return { invalid: true };
            }
            return null;
        }
        return { required: true };
    }
    /**
     * The below method is bind to form control and validates enrollment start date
     * @param control is formControl value
     * @returns ValidationErrors for form-control
     */
    checkEnrollmentStartDate(control: FormControl): ValidationErrors {
        return this.checkEnrollmentDates(control, true);
    }
    /**
     * The below method is bind to form control and validates enrollment end date
     * @param control is formControl value
     * @returns ValidationErrors for form-control
     */
    checkEnrollmentEndDate(control: FormControl): ValidationErrors {
        return this.checkEnrollmentDates(control, false);
    }
    /**
     * The below method is bind to form control and validates enrollment dates
     * @param control is formControl value
     * @param isStartDate check if start date is changed
     * @returns ValidationErrors for form-control
     */
    checkEnrollmentDates(control: FormControl, isStartDate: boolean): ValidationErrors {
        if (control.value) {
            // Z
            let date: Date = new Date();
            const inputDate: Date = this.dateService.toDate(control.value);
            const currentDate: Date = new Date();
            const effectiveStartingControl: AbstractControl = this.enrollmentDateGroup?.controls?.effectiveStarting;
            const expiresAfterControl: AbstractControl = this.enrollmentDateGroup?.controls?.expiresAfter;
            const coverageDateControl: AbstractControl = this.coverageDateGroup?.controls?.effectiveStarting;
            let controlToReset: AbstractControl = effectiveStartingControl;
            if (isStartDate) {
                controlToReset = expiresAfterControl;
            }
            if (controlToReset && controlToReset.value) {
                date = this.dateService.toDate(controlToReset.value);
                this.resetEnrollmentDateErrors(
                    isStartDate ? inputDate : date,
                    isStartDate ? date : inputDate,
                    isStartDate,
                    this.dateService.toDate(expiresAfterControl?.value),
                );
            }
            if (!inputDate || isNaN(inputDate.getTime())) {
                return { invalid: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            currentDate.setHours(0, 0, 0, 0);
            if (
                !isStartDate &&
                inputDate &&
                coverageDateControl?.value &&
                this.dateService.getDifferenceInDays(
                    this.dateService.toDate(coverageDateControl.value),
                    this.dateService.toDate(inputDate),
                ) <= this.agMinDaysDifference
            ) {
                return { minimumDays: true };
            }
            if (inputDate < date && !isStartDate) {
                return { invalidEndDate: true };
            }
            if (inputDate < currentDate) {
                return { pastDate: true };
            }
            if (inputDate > date && isStartDate && expiresAfterControl.value) {
                return { invalidStartDate: true };
            }
        }
        return null;
    }
    /**
     * Check enrollment start date and end date when either of dates is changed
     * @param startDate enrollment start date
     * @param endDate enrollment end date
     * @param isStartDate check if start date is changed
     * @param expiresAfterValue is value of enrollment end date
     */
    resetEnrollmentDateErrors(startDate: Date, endDate: Date, isStartDate: boolean, expiresAfterValue?: Date): void {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        const coverageDateControl: AbstractControl = this.coverageDateGroup.controls.effectiveStarting;
        if (
            startDate < endDate &&
            startDate >= currentDate &&
            endDate <= coverageDateControl.value &&
            endDate >= currentDate &&
            !isStartDate
        ) {
            this.enrollmentDateGroup.controls.effectiveStarting.setErrors(null);
        }
        if (
            this.dateService.isBefore(startDate, endDate) &&
            this.dateService.getIsAfterOrIsEqual(startDate, currentDate) &&
            expiresAfterValue &&
            coverageDateControl?.value &&
            this.dateService.getDifferenceInDays(
                this.dateService.toDate(coverageDateControl.value),
                this.dateService.toDate(expiresAfterValue),
            ) > this.agMinDaysDifference &&
            this.dateService.isBeforeOrIsEqual(endDate, this.dateService.toDate(coverageDateControl.value)) &&
            this.dateService.getIsAfterOrIsEqual(endDate, this.dateService.toDate(coverageDateControl.value)) &&
            isStartDate
        ) {
            this.enrollmentDateGroup.controls.expiresAfter.setErrors(null);
        }
        if (startDate.toDateString() === endDate.toDateString() && startDate >= currentDate) {
            this.resetSpecificFormControlErrors(this.enrollmentDateGroup.controls.effectiveStarting, "invalidStartDate");
            this.resetSpecificFormControlErrors(this.enrollmentDateGroup.controls.expiresAfter, "invalidEndDate");
        }
    }
    /**
     * This method is used to fetch all primary language strings from language service
     */
    fetchPrimaryLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.benefitsOffering.newAflacGroupOffering",
            "primary.portal.benefitsOffering.confirmEnrollmentDates",
            "primary.portal.benefitsOffering.invalidSitusState",
            "primary.portal.benefitsOffering.sellAflacGroupProductsInfo",
            "primary.portal.benefitsOffering.assistanceInfo",
            "primary.portal.benefitsOffering.contactEmail",
            "primary.portal.benefitsOffering.product",
            "primary.portal.benefitsOffering.planName",
            "primary.portal.benefitsOffering.availableRiders",
            "primary.portal.benefitsOffering.taxStatus",
            "primary.portal.benefitsOffering.planExample",
            "primary.portal.benefitsOffering.enrollmentDates",
            "primary.portal.maintenanceBenefitsOffering.nonAflacCoverageDates",
            "primary.portal.maintenanceBenefitsOffering.approvalsTab.submitToHQAdmin",
            "primary.portal.common.dateHint",
            "primary.portal.maintenanceBenefitsOffering.nonAflacCoverageDates",
            "primary.portal.maintenanceBenefitsOffering.editPlanYear.coverageEndDate",
            "primary.portal.benefitsOffering.coverageStartDate",
            "primary.portal.common.date",
            "primary.portal.enrollmentWizard.plan",
            "primary.portal.reviewSubmit.submitOffering",
            "primary.portal.benefitsOffering.preTax",
            "primary.portal.coverage.posttax",
            "primary.portal.benefitsOffering.prePostTax",
            "primary.portal.common.requiredField",
            "primary.portal.coverage.cannotBePast",
            "primary.portal.benefits.agOffering.invalidDate",
            "primary.portal.benefits.agOffering.cannotBeAfterEnrollmentDate",
            "primary.portal.benefits.agOffering.cannotBeBeforeEnrollmentDate",
            "primary.portal.benefits.agOffering.cannotBeAfterCoverageDate",
            "primary.portal.benefits.agOffering.mustBeFifteenDays",
            "primary.portal.benefitsOffering.product.responseError.409.invalidApplicationOrigin",
            "primary.portal.benefitsOffering.product.contactEverwell",
            "primary.portal.benefitsOffering.product.contactAgent",
            "primary.portal.benefitsOffering.product.contactSingleAgent",
            "primary.portal.benefitsOffering.product.responseError.invalidWritingNumber",
            "primary.portal.aflacGroup.offering.selfServiceWarning",
            "secondary.portal.common.serverTimedOut",
            "primary.portal.benefitsOffering.aflacOffering.coverageDateInfo",
            "primary.portal.common.next",
            "primary.portal.aflacGroup.offering.markProposal",
            "primary.portal.aflacGroupOffering.zeroState",
            "primary.portal.aflacGroupOffering.setUpNonAg.label",
            "primary.portal.aflacGroup.offering.saveOffering",
            "primary.portal.aflacGroup.offering.newPlanOnCrm",
            "primary.portal.aflacGroup.offering.newAgPlanYear",
            "primary.portal.aflacGroup.offering.error.coveragePastDate",
            "primary.portal.benefits.agOffering.boDaysBetweenOeAndCoverage",
        ]);
    }
    /**
     * This method is used to fetch all secondary language strings from language service
     */
    fetchSecondaryLanguageStrings(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*")).pipe(takeUntil(this.unsubscribe$)).subscribe();
    }
    /**
     * This method is used to fetch all the required info
     */
    fetchAflacGroupRequiredInfo(): void {
        this.showSpinner = true;
        this.currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        let serviceInfo: PlanProductInfo;
        combineLatest([
            this.aflacService.getAflacGroupPartyInformation([PartyType.CLIENT_SPECIALIST, PartyType.BROKER_SALES], this.currentAccount.id),
            this.coreService.getProducts(),
            this.coreService.getCarriers(),
            this.staticUtilService.cacheConfigValue(ConfigName.AFLAC_GROUP_HARD_STOP_ERROR),
            this.staticUtilService.cacheConfigValue(ConfigName.AG_BO_MIN_DAYS_BETWEEN_OE_AND_COVERAGE),
        ])
            .pipe(
                switchMap(([aflacAgentInformation, allProducts, allCarriers, agHardStopErrors, agMinDaysDifference]) => {
                    serviceInfo = {
                        aflacAgentInformation: aflacAgentInformation,
                        allProducts: allProducts,
                        allCarriers: allCarriers,
                        agHardStopErrors: agHardStopErrors,
                    };
                    this.agMinDaysDifference = +agMinDaysDifference;
                    if (this.data && this.data.opensFrom === this.RENEWAL_PLAN_OFFERING && this.data.eligiblePlansInfo) {
                        return of(this.data.eligiblePlansInfo);
                    }
                    return this.benefitsOfferingService.getOfferablePlans(
                        [this.currentAccount.situs.state.abbreviation],
                        this.currentAccount.id,
                        AccountImportTypes.AFLAC_GROUP,
                    );
                }),
                tap((resp) => {
                    this.agHardStopErrors = serviceInfo.agHardStopErrors.split(",");
                    this.eligiblePlansInfo = this.utilService.copy(resp);
                    if (this.eligiblePlansInfo && this.eligiblePlansInfo.plans && this.eligiblePlansInfo.plans.length) {
                        this.productDataSource = this.getAflacGroupPlans(
                            serviceInfo.allProducts,
                            serviceInfo.allCarriers,
                            this.eligiblePlansInfo.plans,
                        );
                        this.patchPlanYearInformation();
                    }
                    if (this.eligiblePlansInfo.aflacGroupOfferingError && this.eligiblePlansInfo.aflacGroupOfferingError.error) {
                        this.checkAflacGroupOfferingError();
                        this.getAflacGroupPartyInfo(serviceInfo.aflacAgentInformation);
                        this.isHardStop = this.agHardStopErrors.some(
                            (eachError) => eachError === this.eligiblePlansInfo.aflacGroupOfferingError.error,
                        );
                        if (this.eligiblePlansInfo.aflacGroupOfferingError.error === AflacGroupOfferingError.NON_SELF_SERVICE_PRODUCTS) {
                            this.isNonSelfService = !!(
                                this.eligiblePlansInfo.aflacGroupOfferingError.nonSelfServiceProducts.length &&
                                this.productDataSource.length
                            );
                        }
                    }
                    this.arrangeSharedCaseScenarios();
                    this.showSpinner = false;
                    this.changeDetectorRef.detectChanges();
                }),
                catchError((error) => {
                    this.showSpinner = false;
                    this.displayDefaultError(error);
                    this.changeDetectorRef.detectChanges();
                    return of(error);
                }),
            )
            .subscribe();
    }
    /**
     * This method is used to check whether account import type is shared case or not and then arrange data accordingly
     */
    arrangeSharedCaseScenarios(): void {
        if (
            this.eligiblePlansInfo &&
            this.eligiblePlansInfo.aflacGroupOfferingError &&
            this.eligiblePlansInfo.aflacGroupOfferingError.error &&
            this.agHardStopErrors.findIndex((eachError) => eachError === this.eligiblePlansInfo.aflacGroupOfferingError.error) === -1
        ) {
            this.alertType = "warning";
        }
    }
    /**
     * Method to check for Aflac Group Offering Error and display error message
     */
    checkAflacGroupOfferingError(): void {
        if (this.eligiblePlansInfo.aflacGroupOfferingError.error === AflacGroupOfferingError.APPLICATION_ORIGIN) {
            this.aflacGroupOfferingError =
                this.languageStrings["primary.portal.benefitsOffering.product.responseError.409.invalidApplicationOrigin"];
        } else if (this.eligiblePlansInfo.aflacGroupOfferingError.error === AflacGroupOfferingError.CARRIER_APPOINTMENT) {
            this.aflacGroupOfferingError = this.languageStrings["primary.portal.benefitsOffering.sellAflacGroupProductsInfo"];
        } else if (this.eligiblePlansInfo.aflacGroupOfferingError.error === AflacGroupOfferingError.WRITING_NUMBER) {
            this.aflacGroupOfferingError =
                this.languageStrings["primary.portal.benefitsOffering.product.responseError.invalidWritingNumber"];
        } else if (this.eligiblePlansInfo.aflacGroupOfferingError.error === AflacGroupOfferingError.SITUS_STATE_MISMATCH) {
            this.aflacGroupOfferingError = this.languageStrings["primary.portal.benefitsOffering.invalidSitusState"];
        } else if (this.eligiblePlansInfo.aflacGroupOfferingError.error === AflacGroupOfferingError.NON_SELF_SERVICE_PRODUCTS) {
            this.aflacGroupOfferingError = this.languageStrings["primary.portal.aflacGroup.offering.selfServiceWarning"];
            this.nonSelfServiceProducts = this.eligiblePlansInfo.aflacGroupOfferingError.nonSelfServiceProducts;
        } else if (this.eligiblePlansInfo.aflacGroupOfferingError.error === AflacGroupOfferingError.PRODUCT_MISMATCH) {
            this.aflacGroupOfferingError = this.languageStrings["primary.portal.aflacGroup.offering.markProposal"];
        } else if (this.eligiblePlansInfo.aflacGroupOfferingError.error === AflacGroupOfferingError.COVERAGE_PERIOD_PAST_DATE) {
            this.aflacGroupOfferingError = this.languageStrings["primary.portal.aflacGroup.offering.error.coveragePastDate"];
        } else if (this.eligiblePlansInfo.aflacGroupOfferingError.error === AflacGroupOfferingError.AFLAC_API_ERROR) {
            this.aflacGroupOfferingError = this.languageStrings["secondary.portal.common.serverTimedOut"];
        }
    }
    /**
     * This method is used to check API response and will patch value to form group
     */
    patchPlanYearInformation(): void {
        if (this.eligiblePlansInfo.aflacGroupPlanYear && this.eligiblePlansInfo.aflacGroupPlanYear.name) {
            this.aflacGroupOfferingForm.controls.planYearName.patchValue(this.eligiblePlansInfo.aflacGroupPlanYear.name);
        }
        if (this.eligiblePlansInfo.aflacGroupPlanYear && this.eligiblePlansInfo.aflacGroupPlanYear.coveragePeriod) {
            if (this.eligiblePlansInfo?.aflacGroupPlanYear?.coveragePeriod?.effectiveStarting) {
                this.coverageDateGroup.controls.effectiveStarting.patchValue(
                    this.dateService.toDate(this.eligiblePlansInfo.aflacGroupPlanYear.coveragePeriod.effectiveStarting),
                );
            }
            if (this.eligiblePlansInfo?.aflacGroupPlanYear?.coveragePeriod?.expiresAfter) {
                this.coverageDateGroup.controls.expiresAfter.patchValue(
                    this.dateService.toDate(this.eligiblePlansInfo.aflacGroupPlanYear.coveragePeriod.expiresAfter),
                );
            }
        }
        if (
            this.eligiblePlansInfo &&
            this.eligiblePlansInfo.aflacGroupOfferingError &&
            this.eligiblePlansInfo.aflacGroupOfferingError.error &&
            !(
                this.eligiblePlansInfo.aflacGroupOfferingError.nonSelfServiceProducts &&
                this.eligiblePlansInfo.aflacGroupOfferingError.nonSelfServiceProducts.length &&
                this.eligiblePlansInfo.plans &&
                this.eligiblePlansInfo.plans.length
            )
        ) {
            this.aflacGroupOfferingForm.controls.planYearName.disable();
            this.enrollmentDateGroup.controls.effectiveStarting.disable();
            this.enrollmentDateGroup.controls.expiresAfter.disable();
        }
    }
    /**
     * This method is used to display default error status and error code defined error messages
     * @param error is the HttpErrorResponse
     */
    displayDefaultError(error: HttpErrorResponse): void {
        this.showSpinner = false;
        if (error && error.error) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
        }
    }
    /**
     * This method will be called on blur of date-input after entering input
     * This method is used to check whether entered date is valid or not
     * @param event is key-board event
     * @param control is the abstract control
     */
    onBlur(event: KeyboardEvent, control: AbstractControl): void {
        const dateValue: string = (event.target as HTMLInputElement).value;
        if (control && dateValue && !Date.parse(dateValue)) {
            control.setErrors({ invalid: true });
        }
    }
    /**
     * This method will be called on input of date field
     * This method is used to check whether entered date is valid or not
     * @param event is key-board event
     * @param control is the abstract control
     */
    checkDateInput(event: KeyboardEvent, control: AbstractControl): void {
        const dateValue: string = (event.target as HTMLInputElement).value;
        if (dateValue) {
            const inputDate: Date = this.dateService.toDate(dateValue);
            if (isNaN(inputDate.getTime())) {
                control.setErrors({ invalid: true });
            }
            if (inputDate && inputDate > this.coverageDateGroup.controls.effectiveStarting.value) {
                control.setErrors({ greaterThanCoverageDate: true });
            }
        }
    }
    /**
     * Method to get Agent information to contact
     * @param aflacAgentInformation agent Information received from response
     */
    getAflacGroupPartyInfo(aflacAgentInformation: AgentInfo[]): void {
        if (aflacAgentInformation.length === 0) {
            this.contactBroker = this.languageStrings["primary.portal.benefitsOffering.product.contactEverwell"];
        } else if (aflacAgentInformation.length === 1) {
            this.agentDetails = aflacAgentInformation[0];
        } else if (aflacAgentInformation.length > 1) {
            this.brokerList = aflacAgentInformation.filter((agent) => agent.partyKey === PartyType.BROKER_SALES);
            this.clientManagerList = aflacAgentInformation.filter((agent) => agent.partyKey === PartyType.CLIENT_SPECIALIST);
            if (this.brokerList.length || this.clientManagerList.length) {
                this.contactBroker = this.languageStrings["primary.portal.benefitsOffering.product.contactAgent"];
            } else {
                this.contactBroker = this.languageStrings["primary.portal.benefitsOffering.product.contactEverwell"];
            }
        }
    }
    /**
     * The below method is used to reset particular error in the formControl
     * @param control is the abstract control
     * @param error is error variable
     */
    resetSpecificFormControlErrors(control: AbstractControl, error: string): void {
        const err: ValidationErrors = control.errors; // get control errors
        if (err) {
            delete err[error]; // delete error
            if (!Object.keys(err).length) {
                // if no errors left
                control.setErrors(null); // set control errors to null making it VALID
            } else {
                control.setErrors(err); // controls got other errors so set them back
            }
        }
    }
    /**
     * This method is used to set product, carrier and rider tooltip information to plans
     * @param allProducts contains all products information
     * @param allCarriers contains all carriers information
     * @param eligiblePlans contains all eligible plans information
     * @returns all plans related to aflac group after arranging product, carrier data
     */
    getAflacGroupPlans(allProducts: Product[], allCarriers: Carrier[], eligiblePlans: Plan[]): Plan[] {
        eligiblePlans.forEach((eachEligiblePlan) => {
            eachEligiblePlan.ridersTooltipInfo = eachEligiblePlan.riders
                .map((eachRider) => eachRider.name)
                .sort((a, b) => a.localeCompare(b))
                .join(",\n");
            eachEligiblePlan.product = this.utilService
                .copy(allProducts)
                .filter((eachProduct: Product) => eachProduct.id === eachEligiblePlan.productId)
                .pop();
            eachEligiblePlan.carrier = this.utilService
                .copy(allCarriers)
                .filter((eachCarrier: Carrier) => eachCarrier.id === eachEligiblePlan.carrierId)
                .pop();
        });
        return eligiblePlans.filter((eachPlan) => eachPlan.carrierId === CarrierId.AFLAC_GROUP);
    }
    /**
     * This method will be called on click of submit offering or save offering
     * @param isSubmit
     */
    onSaveOffering(isSubmit: boolean): void {
        this.planYearErrorMessage = "";
        if (this.aflacGroupOfferingForm.invalid) {
            return;
        }
        this.showSpinner = true;
        const planYear: PlanYear = this.constructPlanYearPayload();
        this.benefitsOfferingService
            .updatePlanYear(planYear, this.currentAccount.id, this.eligiblePlansInfo.aflacGroupPlanYear.id)
            .pipe(
                takeUntil(this.unsubscribe$),
                catchError((error) => {
                    if (error.error.status === ClientErrorResponseCode.RESP_409 && error.error.code === ClientErrorResponseType.DUPLICATE) {
                        this.fieldErrorMessage = true;
                        this.planYearErrorMessage = this.language.fetchSecondaryLanguageValue(
                            "secondary.portal.benefitsOffering.duplicatePlanYear",
                        );
                    }
                    this.showSpinner = false;
                    this.changeDetectorRef.detectChanges();
                    return of(true);
                }),
                filter((res) => res !== true),
                switchMap((res) => this.benefitsOfferingService.createApprovalRequest(this.currentAccount.id)),
                switchMap((resp) => {
                    this.showSpinner = true;
                    if (
                        this.eligiblePlansInfo &&
                        this.eligiblePlansInfo.replaceWithAflacGroup &&
                        this.eligiblePlansInfo.replaceWithAflacGroup.length
                    ) {
                        this.showSpinner = false;
                        return this.empoweredModalService
                            .openDialog(ConfirmIneligiblePlansComponent, {
                                data: {
                                    eligiblePlansInfo: this.eligiblePlansInfo,
                                    coverageStartDate: planYear.coveragePeriod.effectiveStarting,
                                },
                            })
                            .afterClosed();
                    }
                    return of(true);
                }),
                switchMap((res) => {
                    this.showSpinner = true;
                    this.changeDetectorRef.detectChanges();
                    let individualOfferingEndDate = "";
                    if (res && res.isSaveOffering) {
                        individualOfferingEndDate = res.stopOfferingDate.toString();
                    }
                    if (res === undefined) {
                        this.showSpinner = false;
                        this.changeDetectorRef.detectChanges();
                        return of(false);
                    }
                    return this.benefitsOfferingService.saveAflacGroupBenefitOffering(individualOfferingEndDate, this.currentAccount.id);
                }),
                filter((res) => res !== false),
                switchMap(() => {
                    if (this.data.opensFrom === CARRIERS_TAB) {
                        return this.agRefreshService.checkCarrierStatus();
                    }
                    return of(null);
                }),
                switchMap(() => {
                    if (isSubmit) {
                        return this.benefitsOfferingService.submitApprovalRequest(this.currentAccount.id, true);
                    }
                    return of(null);
                }),
                switchMap(() => {
                    if (isSubmit) {
                        this.showSpinner = false;
                        return this.empoweredModalService
                            .openDialog(AgOfferingSubmitPopupComponent, {
                                data: {
                                    isSharedAccount: true,
                                    isAutoApproved: true,
                                },
                            })
                            .afterClosed();
                    }
                    return of(true);
                }),
            )
            .subscribe(
                () => {
                    this.showSpinner = false;
                    this.bottomSheetRef.dismiss(true);
                },
                (error: HttpErrorResponse) => {
                    this.showSpinner = false;
                    if (error && error.error) {
                        this.errorMessage = this.agRefreshService.getDefaultErrorMessageForAg(error);
                    }
                },
            );
    }
    /**
     * This method is used to construct payload for planYear
     * @returns planYear payload object
     */
    constructPlanYearPayload(): PlanYear {
        const enrollmentPeriod: EnrollmentPeriod = {
            effectiveStarting: this.enrollmentDateGroup?.controls?.effectiveStarting?.value
                ? this.datePipe.transform(
                    this.dateService.toDate(this.enrollmentDateGroup.controls.effectiveStarting.value),
                    DateFormats.YEAR_MONTH_DAY,
                )
                : null,
            expiresAfter: this.enrollmentDateGroup?.controls?.expiresAfter?.value
                ? this.datePipe.transform(
                    this.dateService.toDate(this.enrollmentDateGroup?.controls?.expiresAfter?.value),
                    DateFormats.YEAR_MONTH_DAY,
                )
                : null,
        };
        const coveragePeriod: CoveragePeriod = {
            effectiveStarting: this.coverageDateGroup?.controls?.effectiveStarting?.value
                ? this.datePipe.transform(
                    this.dateService.toDate(this.coverageDateGroup.controls.effectiveStarting.value),
                    DateFormats.YEAR_MONTH_DAY,
                )
                : null,
            expiresAfter: this.coverageDateGroup?.controls?.expiresAfter?.value
                ? this.datePipe.transform(
                    this.dateService.toDate(this.coverageDateGroup.controls.expiresAfter.value),
                    DateFormats.YEAR_MONTH_DAY,
                )
                : null,
        };
        return {
            coveragePeriod: coveragePeriod,
            name: this.aflacGroupOfferingForm.controls.planYearName.value,
            enrollmentPeriod: enrollmentPeriod,
            type: PlanYearType.AFLAC_GROUP,
        };
    }
    /**
     * ng life cycle hook
     * This method will execute before component is destroyed
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
