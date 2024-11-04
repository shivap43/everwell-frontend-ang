import { Component, OnInit, OnDestroy } from "@angular/core";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import {
    BenefitsOfferingService,
    AflacService,
    PartyType,
    EligiblePlans,
    AccountDetails,
    CoreService,
    CoveragePeriod,
    AccountService,
    CarrierFormStatus,
    CarrierFormSetupStatus,
    Carrier,
} from "@empowered/api";
import { Store } from "@ngxs/store";
import { EmpoweredModalService } from "@empowered/common-services";
import { Subject, combineLatest, of, Observable, forkJoin } from "rxjs";
import { takeUntil, tap, catchError, switchMap, filter, map } from "rxjs/operators";
import { FormGroup, FormBuilder, Validators, FormControl, ValidationErrors, AbstractControl } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import {
    DateFormats,
    CarrierId,
    ConfigName,
    AccountImportTypes,
    AflacGroupOfferingError,
    TaxStatus,
    PlanYearType,
    Plan,
    Product,
    EnrollmentPeriod,
    PlanYear,
    AgentInfo,
} from "@empowered/constants";
import { DatePipe } from "@angular/common";
import { BenefitOfferingHelperService } from "../benefit-offering-helper.service";
import { Router, ActivatedRoute } from "@angular/router";
import { AgAiOfferingSetupAlertComponent } from "./ag-ai-offering-setup-alert/ag-ai-offering-setup-alert.component";
import { AccountInfoState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";
import { AgRefreshService, AgOfferingSubmitPopupComponent } from "@empowered/ui";

const DIFF_IN_DAYS_VAR = "days";
const IBO_GROUP_ATTRIBUTE_NAME = "aflac_group_benefit_offering";
const TRUE = "true";
const FALSE = "false";

@Component({
    selector: "empowered-aflac-group-offering",
    templateUrl: "./aflac-group-offering.component.html",
    styleUrls: ["./aflac-group-offering.component.scss"],
})
export class AflacGroupOfferingComponent implements OnInit, OnDestroy {
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
    today: Date = new Date();
    contactBroker: string;
    brokerList: AgentInfo[];
    clientManagerList: AgentInfo[];
    agentDetails: AgentInfo;
    alertType = "danger";
    disableSubmitOffering: boolean;
    isAccountSharedCase = false;
    isSubmitted = false;
    agHardStopErrors: string[];
    nonSelfServiceProducts: string[];
    isHardStop = false;
    isNonSelfService = false;
    groupAttributeId: number;
    agMinDaysDifference: number;
    agMaxDaysDifference: number;
    /**
     * This method will be automatically invoked when an instance of the class is created.
     * @param language is instance of LanguageService
     * @param benefitsOfferingService is instance of BenefitsOfferingService
     * @param store is instance of Store
     * @param aflacService is instance of AflacService
     * @param formBuilder is instance of FormBuilder
     * @param coreService is instance of CoreService
     * @param utilService is instance of UtilService
     * @param datePipe is instance of DatePipe
     * @param benefitsOfferingHelperService is instance of BenefitOfferingHelperService
     * @param router is instance of Router
     * @param activatedRoute is instance of ActivatedRoute
     * @param empoweredModalService is instance of EmpoweredModalService
     * @param staticUtilService is instance of StaticUtilService
     * @param agRefreshService is reference of AgRefreshService
     */
    constructor(
        private readonly language: LanguageService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly store: Store,
        private readonly aflacService: AflacService,
        private readonly formBuilder: FormBuilder,
        private readonly coreService: CoreService,
        private readonly utilService: UtilService,
        private readonly datePipe: DatePipe,
        private readonly benefitsOfferingHelperService: BenefitOfferingHelperService,
        private readonly router: Router,
        private readonly activatedRoute: ActivatedRoute,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly accountService: AccountService,
        private readonly staticUtilService: StaticUtilService,
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
     * The below method is bind to form control and validates the input date to be greater than current date
     * @param control is formControl value
     * @returns ValidationErrors for currently called form-control
     */
    checkDate(control: FormControl): ValidationErrors {
        if (control.value && control.value.toString().trim().length > 0) {
            const inputDate: Date = this.dateService.toDate(control.value);
            if (!inputDate) {
                return { required: true };
            }
            if (inputDate && !this.dateService.isValid(inputDate) && control.value.length !== 0) {
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
     * The below method is bound to form control and validates enrollment dates
     * @param control is formControl value
     * @param isStartDate check if start date is changed
     * @returns ValidationErrors for form-control
     */
    checkEnrollmentDates(control: FormControl, isStartDate: boolean): ValidationErrors {
        if (control.value) {
            let date = new Date();
            const inputDate: Date = this.dateService.toDate(control.value);
            const currentDate = new Date();
            const effectiveStartingControl: AbstractControl = this.enrollmentDateGroup.controls.effectiveStarting;
            const expiresAfterControl: AbstractControl = this.enrollmentDateGroup.controls.expiresAfter;
            const coverageDateControl: AbstractControl = this.coverageDateGroup.controls.effectiveStarting;
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
                    this.dateService.toDate(expiresAfterControl.value),
                );
            }
            if (!inputDate || isNaN(inputDate.getTime())) {
                return { invalid: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            currentDate.setHours(0, 0, 0, 0);
            if (!isStartDate && coverageDateControl && coverageDateControl.value) {
                const minMaxError = this.getMinMaxDateError(coverageDateControl, inputDate);
                if (minMaxError !== null) {
                    return minMaxError;
                }
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
     * Function to check if ag coverage date difference has min or max error
     * @param coverageDateControl coverage date value
     * @param inputDate date selected
     * @returns validation error
     */
    getMinMaxDateError(coverageDateControl: AbstractControl, inputDate: Date): ValidationErrors {
        if (this.getAGDifferenceInDays(coverageDateControl, inputDate) <= this.agMinDaysDifference) {
            return { minimumDays: true };
        }
        if (this.getAGDifferenceInDays(coverageDateControl, inputDate) > this.agMaxDaysDifference) {
            return { maximumDays: true };
        }
        return null;
    }

    /**
     * Calculate difference between coverage date and input date
     * @param coverageDateControl coverage date form control
     * @param inputDate Input date value
     * @returns difference in days
     */
    getAGDifferenceInDays(coverageDateControl: AbstractControl, inputDate: Date): number {
        return this.dateService.getDifferenceInDays(this.dateService.toDate(coverageDateControl.value), inputDate);
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
            startDate < endDate &&
            startDate >= currentDate &&
            expiresAfterValue &&
            this.getAGDifferenceInDays(coverageDateControl, expiresAfterValue) > this.agMinDaysDifference &&
            expiresAfterValue &&
            this.getAGDifferenceInDays(coverageDateControl, expiresAfterValue) <= this.agMaxDaysDifference &&
            endDate <= coverageDateControl.value &&
            endDate >= currentDate &&
            isStartDate
        ) {
            this.enrollmentDateGroup.controls.expiresAfter.setErrors(null);
        }
        if (startDate.toDateString() === endDate.toDateString() && startDate >= currentDate) {
            this.benefitsOfferingHelperService.resetSpecificFormControlErrors(
                this.enrollmentDateGroup.controls.effectiveStarting,
                "invalidStartDate",
            );
            this.benefitsOfferingHelperService.resetSpecificFormControlErrors(
                this.enrollmentDateGroup.controls.expiresAfter,
                "invalidEndDate",
            );
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
            "secondary.portal.benefitsOffering.product.responseError.409.invalidApplicationOrigin",
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
            "primary.portal.common.dateHint",
            "primary.portal.maintenanceBenefitsOffering.nonAflacCoverageDates",
            "primary.portal.maintenanceBenefitsOffering.editPlanYear.coverageEndDate",
            "primary.portal.benefitsOffering.coverageStartDate",
            "primary.portal.common.date",
            "primary.portal.benefitsOffering.Plan",
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
            "primary.portal.aflacGroup.offering.aflac.api.error",
            "primary.portal.benefitsOffering.aflacOffering.coverageDateInfo",
            "primary.portal.common.next",
            "primary.portal.aflacGroup.offering.markProposal",
            "primary.portal.aflacGroupOffering.zeroState",
            "primary.portal.aflacGroupOffering.setUpNonAg.label",
            "primary.portal.benefitsOffering.product.brokerSalesProfessional",
            "primary.portal.benefitsOffering.product.clientManager",
            "primary.portal.aflacGroup.offering.error.coveragePastDate",
            "primary.portal.benefits.agOffering.boDaysBetweenOeAndCoverage",
            "primary.portal.benefits.agOffering.maxDaysBetweenOeAndCoverage",
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
        this.accountService
            .getGroupAttributesByName([IBO_GROUP_ATTRIBUTE_NAME])
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((resp) => {
                    if (resp.length === 0) {
                        return this.accountService.createGroupAttribute({
                            attribute: IBO_GROUP_ATTRIBUTE_NAME,
                            value: FALSE,
                        });
                    } else if (resp.length) {
                        this.groupAttributeId = resp[0].id;
                        if (resp[0].value === TRUE) {
                            this.navigateToBO(TRUE);
                            return of(null);
                        }
                    }
                    return of(true);
                }),

                switchMap((res) =>
                    combineLatest([
                        this.benefitsOfferingService.getOfferablePlans(
                            [this.currentAccount.situs.state.abbreviation],
                            this.currentAccount.id,
                            AccountImportTypes.AFLAC_GROUP,
                        ),
                        this.aflacService.getAflacGroupPartyInformation(
                            [PartyType.CLIENT_SPECIALIST, PartyType.BROKER_SALES],
                            this.currentAccount.id,
                        ),
                        this.coreService.getProducts(),
                        this.coreService.getCarriers(),
                        this.staticUtilService.cacheConfigValue(
                            "general.aflac_groups.benefit_offering.aflac_group_offering_error.hard_stop.values",
                        ),
                        this.staticUtilService.cacheConfigValue(ConfigName.AG_BO_MIN_DAYS_BETWEEN_OE_AND_COVERAGE),
                        this.staticUtilService.cacheConfigValue(ConfigName.AG_BO_MAX_DAYS_BETWEEN_OE_AND_COVERAGE),
                    ]),
                ),
                tap(
                    ([
                        eligiblePlans,
                        aflacAgentInformation,
                        allProducts,
                        allCarriers,
                        agHardStopErrors,
                        agMinDaysDifference,
                        agMaxDaysDifference,
                    ]: [EligiblePlans, AgentInfo[], Product[], Carrier[], string, string, string]) => {
                        this.agHardStopErrors = agHardStopErrors.split(",");
                        this.eligiblePlansInfo = this.utilService.copy(eligiblePlans);
                        this.agMinDaysDifference = +agMinDaysDifference;
                        this.agMaxDaysDifference = +agMaxDaysDifference;
                        if (this.eligiblePlansInfo && this.eligiblePlansInfo.plans && this.eligiblePlansInfo.plans.length) {
                            this.productDataSource = this.benefitsOfferingHelperService.getAflacGroupPlans(
                                allProducts,
                                allCarriers,
                                this.eligiblePlansInfo.plans,
                            );
                            this.patchPlanYearInformation();
                        }
                        if (
                            this.eligiblePlansInfo &&
                            this.eligiblePlansInfo.aflacGroupOfferingError &&
                            this.eligiblePlansInfo.aflacGroupOfferingError.error
                        ) {
                            this.disableSubmitOffering = true;
                            this.checkAflacGroupOfferingError();
                            this.getAflacGroupPartyInfo(aflacAgentInformation);
                            this.isHardStop = this.agHardStopErrors.some(
                                (eachError) => eachError === this.eligiblePlansInfo.aflacGroupOfferingError.error,
                            );
                            if (
                                this.eligiblePlansInfo.aflacGroupOfferingError.error === AflacGroupOfferingError.NON_SELF_SERVICE_PRODUCTS
                            ) {
                                this.isNonSelfService = !!(
                                    this.eligiblePlansInfo.aflacGroupOfferingError.nonSelfServiceProducts.length &&
                                    (!(this.currentAccount.importType === AccountImportTypes.AFLAC_GROUP) || this.productDataSource.length)
                                );
                            }
                        }
                        this.arrangeSharedCaseScenarios();
                        this.showSpinner = false;
                    },
                ),
                catchError((error) => {
                    this.showSpinner = false;
                    this.displayDefaultError(error);
                    return of(error);
                }),
            )
            .subscribe();
    }
    /**
     * This method is used to check whether account import type is shared case or not and then arrange data accordingly
     */
    arrangeSharedCaseScenarios(): void {
        if (this.currentAccount && this.currentAccount.importType === AccountImportTypes.SHARED_CASE) {
            this.isAccountSharedCase = true;
        }
        if ((this.isHardStop && this.isAccountSharedCase) || this.isNonSelfService) {
            this.alertType = "warning";
            this.disableSubmitOffering = false;
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
        } else if (this.eligiblePlansInfo.aflacGroupOfferingError.error === AflacGroupOfferingError.AFLAC_API_ERROR) {
            this.aflacGroupOfferingError = this.languageStrings["primary.portal.aflacGroup.offering.aflac.api.error"];
        } else if (this.eligiblePlansInfo.aflacGroupOfferingError.error === AflacGroupOfferingError.COVERAGE_PERIOD_PAST_DATE) {
            this.aflacGroupOfferingError = this.languageStrings["primary.portal.aflacGroup.offering.error.coveragePastDate"];
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
            if (this.eligiblePlansInfo.aflacGroupPlanYear.coveragePeriod.effectiveStarting) {
                this.coverageDateGroup.controls.effectiveStarting.patchValue(
                    this.dateService.toDate(this.eligiblePlansInfo.aflacGroupPlanYear.coveragePeriod.effectiveStarting || ""),
                );
            }
            if (this.eligiblePlansInfo.aflacGroupPlanYear.coveragePeriod.expiresAfter) {
                this.coverageDateGroup.controls.expiresAfter.patchValue(
                    this.dateService.toDate(this.eligiblePlansInfo.aflacGroupPlanYear.coveragePeriod.expiresAfter || ""),
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
        this.isSubmitted = false;
        if (error && error.error) {
            this.errorMessage = this.agRefreshService.getDefaultErrorMessageForAg(error);
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
     * This method will be called on input of date-filed
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
     * This method will call on click of submit offering
     */
    onSubmitOffering(): void {
        let submitAg = false;
        if (this.aflacGroupOfferingForm.invalid) {
            return;
        }
        if (this.isAccountSharedCase) {
            this.empoweredModalService
                .openDialog(AgAiOfferingSetupAlertComponent)
                .afterClosed()
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap((response) => {
                        if (response === null || response === undefined) {
                            return of(null);
                        }
                        if (response) {
                            submitAg = true;
                            return this.saveAGOffering(true);
                        }
                        return this.saveAGOffering();
                    }),
                )
                .subscribe(
                    () => {
                        if (submitAg) {
                            this.navigateToMBO();
                        }
                    },
                    (error) => this.displayDefaultError(error),
                );
        } else {
            this.saveAGOffering(true)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    () => {
                        this.navigateToMBO();
                    },
                    (error) => this.displayDefaultError(error),
                );
        }
    }

    /**
     * Method to navigate to MBO screen
     */
    navigateToMBO(): void {
        this.showSpinner = true;
        this.router.navigate(["../maintenance-offering"], {
            queryParams: { initial: true },
            relativeTo: this.activatedRoute,
        });
    }

    /**
     * This method is used to save aflac group offering
     * @param saveAGOnly determines whether to saveAGOffering and navigate to MBO or savePlanYear and navigate to AI flow
     * @returns observable of void to follow the series of api calls after saving the offering
     */
    saveAGOffering(saveAGOnly: boolean = false): Observable<void> {
        this.isSubmitted = true;
        this.showSpinner = true;
        const planYear: PlanYear = this.constructPlanYearPayload();
        return this.benefitsOfferingService
            .updatePlanYear(planYear, this.currentAccount.id, this.eligiblePlansInfo.aflacGroupPlanYear.id)
            .pipe(
                switchMap((res) => this.benefitsOfferingService.createApprovalRequest(this.currentAccount.id)),
                switchMap((res) => {
                    if (saveAGOnly) {
                        return this.benefitsOfferingService.saveAflacGroupBenefitOffering("", this.currentAccount.id);
                    }
                    return of(null);
                }),
                switchMap((response) => {
                    if (saveAGOnly) {
                        return forkJoin([
                            this.benefitsOfferingService.getCarrierSetupStatuses(this.currentAccount.id, CarrierId.AFLAC_GROUP, true),
                            this.benefitsOfferingService.getCarrierSetupStatuses(this.currentAccount.id, CarrierId.AFLAC_GROUP, false),
                        ]).pipe(
                            catchError((err) => of([])),
                            map(([unapprovedCarrierSetupStatus, approvedCarrierSetupStatus]) => {
                                const carrierSetupStatus: CarrierFormStatus[] = [];
                                carrierSetupStatus.push(...unapprovedCarrierSetupStatus);
                                carrierSetupStatus.push(...approvedCarrierSetupStatus);
                                return carrierSetupStatus;
                            }),
                        );
                    }
                    return of([]);
                }),
                switchMap((carrierSetupStatus: CarrierFormStatus[]) => {
                    if (!carrierSetupStatus.length && saveAGOnly) {
                        return this.benefitsOfferingService.saveCarrierSetupStatus(this.currentAccount.id, CarrierId.AFLAC_GROUP, {
                            status: CarrierFormSetupStatus.INCOMPLETE,
                        });
                    }
                    return of(null);
                }),
                switchMap((res) => {
                    if (saveAGOnly) {
                        return this.benefitsOfferingService.submitApprovalRequest(this.currentAccount.id, true);
                    }
                    return of(null);
                }),
                switchMap((success) => {
                    if (saveAGOnly) {
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
                    this.navigateToBO(TRUE);
                    return of(null);
                }),
            );
    }
    /**
     * This method is used to construct payload for planYear
     * @returns planYear payload object
     */
    constructPlanYearPayload(): PlanYear {
        const enrollmentPeriod: EnrollmentPeriod = {
            effectiveStarting: this.enrollmentDateGroup.controls.effectiveStarting.value
                ? this.datePipe.transform(
                      this.dateService.toDate(this.enrollmentDateGroup.controls.effectiveStarting.value),
                      DateFormats.YEAR_MONTH_DAY,
                  )
                : null,
            expiresAfter: this.enrollmentDateGroup.controls.expiresAfter.value
                ? this.datePipe.transform(
                      this.dateService.toDate(this.enrollmentDateGroup.controls.expiresAfter.value),
                      DateFormats.YEAR_MONTH_DAY,
                  )
                : null,
        };
        const coveragePeriod: CoveragePeriod = {
            effectiveStarting: this.coverageDateGroup.controls.effectiveStarting.value
                ? this.datePipe.transform(
                      this.dateService.toDate(this.coverageDateGroup.controls.effectiveStarting.value),
                      DateFormats.YEAR_MONTH_DAY,
                  )
                : null,
            expiresAfter: this.coverageDateGroup.controls.expiresAfter.value
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
     * This method is used to navigate user to AI benefits offering
     * @param attributeValue {string} value to set attribute
     */
    navigateToBO(attributeValue: string): void {
        this.showSpinner = true;
        const groupAttribute = {
            id: this.groupAttributeId,
            attribute: IBO_GROUP_ATTRIBUTE_NAME,
            value: attributeValue,
        };
        if (!this.groupAttributeId) {
            this.accountService
                .getGroupAttributesByName([IBO_GROUP_ATTRIBUTE_NAME])
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap((resp) => {
                        this.groupAttributeId = resp[0].id;
                        return this.accountService.updateGroupAttribute(this.groupAttributeId, {
                            id: this.groupAttributeId,
                            attribute: IBO_GROUP_ATTRIBUTE_NAME,
                            value: attributeValue,
                        });
                    }),
                )
                .subscribe((res) => {
                    this.router.navigate(["../offering"], {
                        relativeTo: this.activatedRoute,
                    });
                });
        } else {
            this.accountService.updateGroupAttribute(this.groupAttributeId, groupAttribute).subscribe(() => {
                this.router.navigate(["../offering"], {
                    relativeTo: this.activatedRoute,
                });
            });
        }
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
