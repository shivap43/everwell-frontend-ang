import { Component, OnInit, ViewChild, Inject, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import {
    AccountDetails,
    BenefitsOfferingService,
    PartyType,
    EligiblePlans,
    CoveragePeriod,
    ReplaceAflacGroupInfo,
    CarrierFormStatus,
    CarrierFormSetupStatus,
} from "@empowered/api";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatStepper } from "@angular/material/stepper";
import { Store } from "@ngxs/store";
import { Subject, of, forkJoin } from "rxjs";
import { takeUntil, tap, switchMap, catchError, map } from "rxjs/operators";
import { FormGroup, FormBuilder, Validators, ValidationErrors, FormControl, AbstractControl } from "@angular/forms";
import { DateFormats, CarrierId, ConfigName, AflacGroupOfferingError, EnrollmentPeriod, PlanYear, AgentInfo } from "@empowered/constants";
import { DatePipe } from "@angular/common";
import { AccountInfoState, StaticUtilService } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

const ONE_DAY = 1;

interface RefreshPopUpData {
    eligiblePlans: EligiblePlans;
    aflacAgentInformation: AgentInfo[];
    isInitialOffering?: boolean;
    newAflacGroupPlanYearRequired?: boolean;
    isRenewal: boolean;
}

@Component({
    selector: "empowered-ag-refresh",
    templateUrl: "./ag-refresh.component.html",
    styleUrls: ["./ag-refresh.component.scss"],
})
export class AgRefreshComponent implements OnInit, OnDestroy {
    @ViewChild(MatStepper, { static: true }) matStepper: MatStepper;
    reviewDatesForm: FormGroup;
    enrollmentDateGroup: FormGroup;
    coverageDateGroup: FormGroup;
    currentAccount: AccountDetails;
    showSpinner: boolean;
    eligiblePlansInfo: EligiblePlans;
    aflacGroupOfferingError: string;
    contactBroker: string;
    brokerList: AgentInfo[];
    inEligiblePlans: ReplaceAflacGroupInfo[] = [];
    plansToUpdate: ReplaceAflacGroupInfo[] = [];
    clientManagerList: AgentInfo[];
    isPlanYearUpdated = false;
    agentDetails: AgentInfo;
    nonSelfServiceProducts: string[];
    stopOffering = false;
    editOfferingForm: FormGroup;
    isHardStop = false;
    oeEndDate: Date;
    agMinDaysDifference: number;
    today: Date = new Date();
    readonly NO_PLAN_YEAR = 0;
    readonly VALIDATION_SCREEN = 1;
    readonly ENROLLMENT_DATES_SCREEN = 2;
    readonly INELIGIBLE_PLANS = 3;
    readonly UPDATE_OE_DATE = 4;
    readonly REVIEW_PLANS = 5;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.aflacGroup.offeringUpdated",
        "primary.portal.aflacGroup.planYearNameUpdated",
        "primary.portal.aflacGroup.resubmitOffering",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.review",
        "primary.portal.benefitsOffering.product.responseError.409.invalidApplicationOrigin",
        "primary.portal.benefitsOffering.sellAflacGroupProductsInfo",
        "primary.portal.benefitsOffering.product.responseError.invalidWritingNumber",
        "primary.portal.common.serverTimeout",
        "primary.portal.common.next",
        "primary.portal.benefitsOffering.product.brokerSalesProfessional",
        "primary.portal.aflacGroup.offeringPartiallyUpdated",
        "primary.portal.benefitsOffering.assistanceInfo",
        "primary.portal.benefitsOffering.contactEmail",
        "primary.portal.aflacGroup.offering.updateEnrollmentDates",
        "primary.portal.benefitsOffering.enrollmentDates",
        "primary.portal.maintenanceBenefitsOffering.nonAflacCoverageDates",
        "primary.portal.common.dateHint",
        "primary.portal.aflacGroup.offering.updateEnrollmentDatesInfo",
        "primary.portal.benefitsOffering.product.contactAgent",
        "primary.portal.common.requiredField",
        "primary.portal.coverage.cannotBePast",
        "primary.portal.common.gotIt",
        "primary.portal.benefits.agOffering.invalidDate",
        "primary.portal.benefits.agOffering.cannotBeAfterEnrollmentDate",
        "primary.portal.benefits.agOffering.cannotBeAfterCoverageDate",
        "primary.portal.benefits.agOffering.cannotBeBeforeEnrollmentDate",
        "primary.portal.benefits.agOffering.mustBeFifteenDays",
        "primary.portal.benefitsOffering.coverageStartDate",
        "primary.portal.benefitsOffering.aflacOffering.coverageDateInfo",
        "primary.portal.benefitsOffering.availableRiders",
        "primary.portal.benefitsOffering.coverageDates",
        "primary.portal.maintenanceBenefitsOffering.editPlanYear.coverageEndDate",
        "primary.portal.common.date",
        "primary.portal.aflacGroup.offering.ineligiblePlans",
        "primary.portal.aflacGroup.offering.ineligiblePlansInfo",
        "primary.portal.benefitsOffering.product.contactEverwell",
        "primary.portal.benefitsOffering.invalidSitusState",
        "primary.portal.aflacGroup.offering.selfServiceWarning",
        "primary.portal.aflacGroup.offering.markProposal",
        "primary.portal.aflacGroup.offering.existingEnrollments",
        "primary.portal.aflacGroup.offering.noNewPlanYearFound",
        "primary.portal.aflacGroup.offering.saveOffering",
        "primary.portal.aflacGroup.offering.submitOffering",
        "primary.portal.aflacGroup.offering.existingEnrollments",
        "primary.portal.aflacGroup.offering.enrollmentForSomeProducts",
        "primary.portal.aflacGroup.offering.stopOfferingIneligiblePlans",
        "primary.portal.aflacGroup.offering.dateBeforeEnrollmentEndDate",
        "primary.portal.aflacGroup.offering.stopOfferingProducts",
        "primary.portal.aflacGroup.offering.createNewAgPlan",
        "primary.portal.aflacGroup.offeringNotUpdated",
        "primary.portal.aflacGroup.offering.error.coveragePastDate",
        "primary.portal.benefits.agOffering.boDaysBetweenOeAndCoverage",
    ]);
    /**
     * This method will be automatically invoked when an instance of the class is created.
     * @param data metadata for the dialog
     * @param dialogRef is dialogRef of AgRefreshComponent
     * @param language is instance of LanguageService
     * @param store is instance of Store
     * @param benefitsOfferingService is instance of BenefitsOfferingService
     * @param formBuilder is instance of FormBuilder
     * @param datePipe is instance of DatePipe
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) readonly data: RefreshPopUpData,
        private readonly dialogRef: MatDialogRef<AgRefreshComponent>,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly formBuilder: FormBuilder,
        private readonly datePipe: DatePipe,
        private readonly staticUtilService: StaticUtilService,
        private readonly dateService: DateService,
    ) {}
    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     */
    ngOnInit(): void {
        this.staticUtilService
            .cacheConfigValue(ConfigName.AG_BO_MIN_DAYS_BETWEEN_OE_AND_COVERAGE)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((minDays) => (this.agMinDaysDifference = +minDays));
        this.initializeForm();
        this.currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        this.eligiblePlansInfo = this.data.eligiblePlans;
        if (!this.data.isInitialOffering && this.data.isRenewal) {
            if (!this.data.newAflacGroupPlanYearRequired && !this.eligiblePlansInfo.aflacGroupOfferingError) {
                this.matStepper.selectedIndex = this.NO_PLAN_YEAR;
            } else if (this.eligiblePlansInfo && this.eligiblePlansInfo.aflacGroupOfferingError) {
                this.getAflacGroupPartyInfo(this.data.aflacAgentInformation);
                this.checkAflacGroupOfferingError();
            } else {
                this.dialogRef.close({
                    isPlanYearUpdated: this.isPlanYearUpdated,
                    isSubmit: false,
                    isRenewal: true,
                });
            }
        } else {
            this.refreshOffering();
        }
    }
    /**
     * This method is used to initialize aflacGroupOfferingForm formGroup
     */
    initializeForm(): void {
        this.reviewDatesForm = this.formBuilder.group({
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
        this.reviewDatesForm.addControl("enrollmentPeriod", this.enrollmentDateGroup);
        this.reviewDatesForm.addControl("coveragePeriod", this.coverageDateGroup);
        this.editOfferingForm = this.formBuilder.group({
            offeringEndDate: ["", [Validators.required, this.checkDate.bind(this)]],
        });
    }
    /**
     * The below method binds to form control and validates the input date to be greater than current date
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
            if (
                inputDate &&
                (inputDate > this.coverageDateGroup.controls.effectiveStarting.value ||
                    (this.matStepper.selectedIndex === this.UPDATE_OE_DATE && inputDate > this.oeEndDate))
            ) {
                control.setErrors({ greaterThanCoverageDate: true });
            }
        }
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
            let date: Date = new Date();
            const inputDate: Date = this.dateService.toDate(control.value);
            const currentDate: Date = new Date();
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
            if (this.checkMinDateError(isStartDate, inputDate, coverageDateControl)) {
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
     * Check if date control has min date error
     * @param isStartDate boolean value of start date
     * @param inputDate date selected
     * @param coverageDateControl coverage date value
     * @returns if error exists or not
     */
    checkMinDateError(isStartDate: boolean, inputDate: Date, coverageDateControl: AbstractControl): boolean {
        return (
            !isStartDate &&
            inputDate &&
            coverageDateControl?.value &&
            this.dateService.getDifferenceInDays(this.dateService.toDate(coverageDateControl.value), inputDate) <= this.agMinDaysDifference
        );
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
            this.dateService.getDifferenceInDays(
                this.dateService.toDate(coverageDateControl.value || ""),
                this.dateService.toDate(expiresAfterValue),
            ) > this.agMinDaysDifference &&
            endDate <= coverageDateControl.value &&
            endDate >= currentDate &&
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
     * check for validation errors
     */
    refreshOffering(): void {
        if (this.eligiblePlansInfo.aflacGroupOfferingError && this.eligiblePlansInfo.aflacGroupOfferingError.error) {
            this.getAflacGroupPartyInfo(this.data.aflacAgentInformation);
            this.checkAflacGroupOfferingError();
        } else {
            this.reviewEnrollmentDates();
        }
    }
    /**
     * Method to check for Aflac Group Offering Error and display error message
     */
    checkAflacGroupOfferingError(): void {
        this.isHardStop = true;
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
            if (this.eligiblePlansInfo.plans && this.eligiblePlansInfo.plans.length > 0 && !this.data.isInitialOffering) {
                this.isHardStop = false;
            }
        } else if (this.eligiblePlansInfo.aflacGroupOfferingError.error === AflacGroupOfferingError.PRODUCT_MISMATCH) {
            this.aflacGroupOfferingError = this.languageStrings["primary.portal.aflacGroup.offering.markProposal"];
        } else if (this.eligiblePlansInfo.aflacGroupOfferingError.error === AflacGroupOfferingError.AFLAC_API_ERROR) {
            this.aflacGroupOfferingError = this.languageStrings["primary.portal.common.serverTimeout"];
        } else if (this.eligiblePlansInfo.aflacGroupOfferingError.error === AflacGroupOfferingError.COVERAGE_PERIOD_PAST_DATE) {
            this.aflacGroupOfferingError = this.languageStrings["primary.portal.aflacGroup.offering.error.coveragePastDate"];
        }
        if (!this.isHardStop && this.data.isRenewal) {
            this.dialogRef.close({
                isPlanYearUpdated: this.isPlanYearUpdated,
                isSubmit: false,
                isRenewal: true,
            });
        }
        this.matStepper.selectedIndex = this.VALIDATION_SCREEN;
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
     * check if enrollment dates have to be reviewed
     */
    reviewEnrollmentDates(): void {
        if (this.eligiblePlansInfo.aflacGroupPlanYear) {
            this.reviewDatesForm.controls.planYearName.patchValue(this.eligiblePlansInfo.aflacGroupPlanYear.name);
            if (this.eligiblePlansInfo.aflacGroupPlanYear.coveragePeriod) {
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
                this.eligiblePlansInfo.aflacGroupPlanYear.enrollmentPeriod &&
                this.eligiblePlansInfo.aflacGroupPlanYear.enrollmentPeriod.effectiveStarting
            ) {
                this.enrollmentDateGroup.controls.effectiveStarting.patchValue(
                    this.dateService.toDate(this.eligiblePlansInfo.aflacGroupPlanYear.enrollmentPeriod.effectiveStarting || ""),
                );
                this.enrollmentDateGroup.controls.effectiveStarting.markAsTouched();
                this.enrollmentDateGroup.controls.expiresAfter.patchValue(
                    this.dateService.toDate(this.eligiblePlansInfo.aflacGroupPlanYear.enrollmentPeriod.expiresAfter || ""),
                );
                this.enrollmentDateGroup.controls.expiresAfter.markAsTouched();
            }
            this.matStepper.selectedIndex = this.ENROLLMENT_DATES_SCREEN;
        } else if (this.data.isInitialOffering) {
            this.dialogRef.close({ isPlanYearUpdated: this.isPlanYearUpdated });
        } else {
            this.checkIneligiblePlans();
        }
    }
    /**
     * check if ineligible plans exist
     */
    checkIneligiblePlans(): void {
        if (this.eligiblePlansInfo.replaceWithAflacGroup && this.eligiblePlansInfo.replaceWithAflacGroup.length > 0) {
            this.inEligiblePlans = this.eligiblePlansInfo.replaceWithAflacGroup.filter(
                (plans) => this.dateService.toDate(plans.enrollmentStartDate) > new Date(),
            );
            this.plansToUpdate = this.eligiblePlansInfo.replaceWithAflacGroup.filter(
                (plans) => plans.enrollmentStartDate === undefined || this.dateService.toDate(plans.enrollmentStartDate) <= new Date(),
            );
            if (this.inEligiblePlans.length === this.eligiblePlansInfo.replaceWithAflacGroup.length) {
                this.stopOffering = true;
                this.matStepper.selectedIndex = this.INELIGIBLE_PLANS;
            } else if (
                !this.data.isInitialOffering &&
                (this.plansToUpdate.length === this.eligiblePlansInfo.replaceWithAflacGroup.length ||
                    (this.plansToUpdate.length > 0 && this.inEligiblePlans.length > 0))
            ) {
                this.oeEndDate = this.dateService.subtractDays(
                    this.dateService.toDate(this.eligiblePlansInfo.aflacGroupPlanYear.coveragePeriod.effectiveStarting || ""),
                    ONE_DAY,
                );
                this.editOfferingForm.controls.offeringEndDate.patchValue(new Date());
                this.matStepper.selectedIndex = this.UPDATE_OE_DATE;
            } else {
                this.matStepper.selectedIndex = this.REVIEW_PLANS;
            }
        } else {
            this.matStepper.selectedIndex = this.REVIEW_PLANS;
        }
    }
    /**
     * update plan year details
     */
    updatePlanYear(): void {
        const planYear = this.constructPayLoad();
        this.isPlanYearUpdated = false;
        this.benefitsOfferingService
            .updatePlanYear(planYear, this.currentAccount.id, this.eligiblePlansInfo.aflacGroupPlanYear.id)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.isPlanYearUpdated = true;
                if (this.data.isInitialOffering) {
                    this.dialogRef.close({ isPlanYearUpdated: this.isPlanYearUpdated });
                }
            });
    }
    /**
     * create plan year object for updatePlanYear api call
     * @returns planYear object
     */
    constructPayLoad(): PlanYear {
        const enrollmentPeriod: EnrollmentPeriod = {
            effectiveStarting: this.datePipe.transform(
                this.dateService.toDate(this.enrollmentDateGroup.controls.effectiveStarting.value || ""),
                DateFormats.YEAR_MONTH_DAY,
            ),
            expiresAfter: this.datePipe.transform(
                this.dateService.toDate(this.enrollmentDateGroup.controls.expiresAfter.value || ""),
                DateFormats.YEAR_MONTH_DAY,
            ),
        };
        const coveragePeriod: CoveragePeriod = {
            effectiveStarting: this.datePipe.transform(
                this.dateService.toDate(this.coverageDateGroup.controls.effectiveStarting.value || ""),
                DateFormats.YEAR_MONTH_DAY,
            ),
            expiresAfter: this.datePipe.transform(
                this.dateService.toDate(this.coverageDateGroup.controls.expiresAfter.value || ""),
                DateFormats.YEAR_MONTH_DAY,
            ),
        };
        return {
            id: this.eligiblePlansInfo.aflacGroupPlanYear.id,
            name: this.eligiblePlansInfo.aflacGroupPlanYear.name,
            coveragePeriod: coveragePeriod,
            enrollmentPeriod: enrollmentPeriod,
            type: this.eligiblePlansInfo.aflacGroupPlanYear.type,
        };
    }
    /**
     * Displays next screen based on current step
     * @param currentStep the index of stepper
     */
    onNext(currentStep: number): void {
        if (currentStep === this.VALIDATION_SCREEN) {
            if (!this.isHardStop) {
                if (this.data.isRenewal) {
                    this.dialogRef.close({
                        isPlanYearUpdated: this.isPlanYearUpdated,
                        isSubmit: false,
                        isRenewal: true,
                    });
                } else {
                    this.reviewEnrollmentDates();
                }
            } else {
                this.dialogRef.close({
                    isPlanYearUpdated: this.isPlanYearUpdated,
                    isSubmit: false,
                    isRenewal: false,
                });
            }
        }
        if (currentStep === this.ENROLLMENT_DATES_SCREEN) {
            if (this.reviewDatesForm.valid) {
                this.isPlanYearUpdated = true;
                this.checkIneligiblePlans();
            } else {
                this.enrollmentDateGroup.controls.effectiveStarting.markAsTouched();
                this.enrollmentDateGroup.controls.expiresAfter.markAsTouched();
                return;
            }
        }
        if (currentStep === this.INELIGIBLE_PLANS) {
            this.matStepper.selectedIndex = this.REVIEW_PLANS;
        }
        if (currentStep === this.UPDATE_OE_DATE && this.editOfferingForm.valid) {
            if (this.editOfferingForm.valid) {
                this.stopOffering = true;
                this.matStepper.selectedIndex = this.REVIEW_PLANS;
            } else {
                return;
            }
        }
        if (currentStep === this.REVIEW_PLANS) {
            if (this.isPlanYearUpdated) {
                this.updatePlanYear();
            } else {
                this.dialogRef.close({
                    isPlanYearUpdated: this.isPlanYearUpdated,
                });
            }
        }
    }
    /**
     * This method is used to submit aflac group offering
     * @param isSubmit determines whether to saveOffering or submitOffering
     */
    saveOffering(isSubmit: boolean): void {
        if (this.isPlanYearUpdated) {
            this.updatePlanYear();
        }
        if (!this.data.isInitialOffering) {
            let individualOfferingEndDate = "";
            this.showSpinner = true;
            this.benefitsOfferingService
                .createApprovalRequest(this.currentAccount.id)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap((resp) => {
                        if (this.stopOffering) {
                            if (this.inEligiblePlans.length === this.eligiblePlansInfo.replaceWithAflacGroup.length) {
                                individualOfferingEndDate = this.datePipe.transform(new Date(), DateFormats.YEAR_MONTH_DAY);
                            } else {
                                individualOfferingEndDate = this.datePipe.transform(
                                    this.dateService.toDate(this.editOfferingForm.controls.offeringEndDate.value || ""),
                                    DateFormats.YEAR_MONTH_DAY,
                                );
                            }
                        }
                        return this.benefitsOfferingService.saveAflacGroupBenefitOffering(
                            individualOfferingEndDate,
                            this.currentAccount.id,
                        );
                    }),
                    switchMap((response) =>
                        forkJoin([
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
                        ),
                    ),
                    switchMap((carrierSetupStatus: CarrierFormStatus[]) => {
                        if (!carrierSetupStatus.length) {
                            return this.benefitsOfferingService.saveCarrierSetupStatus(this.currentAccount.id, CarrierId.AFLAC_GROUP, {
                                status: CarrierFormSetupStatus.INCOMPLETE,
                            });
                        }
                        return of(null);
                    }),
                    switchMap((success) => {
                        if (isSubmit) {
                            return this.benefitsOfferingService.submitApprovalRequest(this.currentAccount.id, true);
                        }
                        return of(false);
                    }),
                    tap((resp) => {
                        this.dialogRef.close({
                            isSubmit: isSubmit && resp !== false,
                            isRenewal: false,
                        });
                    }),
                )
                .subscribe(
                    () => {},
                    (error) => {
                        this.showSpinner = false;
                        this.dialogRef.close({
                            isSubmit: false,
                            isRenewal: false,
                        });
                    },
                );
        }
    }
    /**
     * This method is called when clicked on close icon
     */
    close(): void {
        this.dialogRef.close({ isPlanYearUpdated: false, isSubmit: false, isRenewal: false });
    }
    /**
     * The below method is used to reset particular error in the formControl
     * @param control is the abstract control
     * @param error is error variable
     */
    resetSpecificFormControlErrors(control: AbstractControl, error: string): void {
        const err: ValidationErrors = control.errors; // get control errors
        if (err) {
            delete err[error];
            if (!Object.keys(err).length) {
                control.setErrors(null);
            } else {
                control.setErrors(err);
            }
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
