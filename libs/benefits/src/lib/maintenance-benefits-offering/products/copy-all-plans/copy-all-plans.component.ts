import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { FormGroup, FormBuilder, Validators, FormControl, AbstractControl, ValidationErrors } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatSelectChange } from "@angular/material/select";
import { ActivatedRoute } from "@angular/router";
import { BenefitsOfferingService, CoveragePeriod, AccountCarrier, CarrierSetupStatus, CarrierFormSetupStatus } from "@empowered/api";
import { DatePipe } from "@angular/common";
import { NgxMaskPipe } from "ngx-mask";
import { forkJoin, Subject, combineLatest, Observable, of } from "rxjs";
import { Store } from "@ngxs/store";
import { BenefitOfferingHelperService } from "./../../../benefit-offering-helper.service";
import { ProductsPlansQuasiService } from "../../products-plans-quasi";

import {
    BenefitsOfferingState,
    GetCarrierSetupStatuses,
    SaveCarrierSetupStatus,
    SetCarrierForms,
    StaticUtilService,
} from "@empowered/ngxs-store";
import {
    DateFormats,
    CarrierId,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    ConfigName,
    AppSettings,
    PlanChoice,
    PlanYearType,
    EnrollmentPeriod,
    PlanYear,
} from "@empowered/constants";
import { takeUntil, tap, switchMap, map, mergeMap, concatMap, catchError } from "rxjs/operators";
import { DateInfo } from "@empowered/constants";
import { HttpResponse } from "@angular/common/http";
import { DateService } from "@empowered/date";

// eslint-disable-next-line @typescript-eslint/naming-convention
enum planYearSelection {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    existingPlanYear = "EXISTING_PLAN_YEAR",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    newPlanYear = "NEW_PLAN_YEAR",
}
const ZERO_LENGTH = 0;
const DAY_DIFF_NON_AFLAC = 15;
const DAY_DIFF_AFLAC = 1;

@Component({
    selector: "empowered-copy-all-plans",
    templateUrl: "./copy-all-plans.component.html",
    styleUrls: ["./copy-all-plans.component.scss"],
})
export class CopyAllPlansComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.cancel",
        "primary.portal.common.copyPlans",
        "primary.portal.maintenanceBenefitsOffering.copyAllPlans.title",
        "primary.portal.maintenanceBenefitsOffering.copyAllPlans.subTitle",
        "primary.portal.common.selectOption",
        "primary.portal.maintenanceBenefitsOffering.copyAllPlans.existingPlan",
        "primary.portal.maintenanceBenefitsOffering.copyAllPlans.newPlan",
        "primary.portal.maintenanceBenefitsOffering.copyAllPlans.copyFrom",
        "primary.portal.maintenanceBenefitsOffering.copyAllPlans.copyTo",
        "primary.portal.maintenanceBenefitsOffering.copyAllPlans.planYearName",
        "primary.portal.maintenanceBenefitsOffering.copyAllPlans.enrollmentDates",
        "primary.portal.maintenanceBenefitsOffering.copyAllPlans.coverageDates",
        "primary.portal.maintenanceBenefitsOffering.copyAllPlans.selectPlanYear",
        "primary.portal.common.close",
        "primary.portal.copyAllPlans.enrollmentStartDate",
        "primary.portal.copyAllPlans.enrollmentEndDate",
        "primary.portal.copyAllPlans.coverageStartDate",
        "primary.portal.copyAllPlans.coverageEndDate",
        "primary.portal.benefitsOffering.cannotBeBeforeStartDate",
        "primary.portal.benefitsOffering.planYearName.required",
        "primary.portal.enrollment.cannotBePast",
        "primary.portal.benefitsOffering.cannotBeBeforeEnrollmentDate",
        "primary.portal.coverage.cannotBePast",
        "primary.portal.benefits.agOffering.invalidDate",
        "primary.portal.benefits.agOffering.cannotBeAfterEnrollmentDate",
        "primary.portal.benefits.agOffering.cannotBeAfterCoverageDate",
        "primary.portal.benefits.agOffering.mustBeFifteenDays",
        "primary.portal.common.requiredField",
        "primary.portal.common.selectionRequired",
        "primary.portal.benefits.agOffering.cannotBeBeforeEnrollmentDate",
        "primary.portal.benefits.copyAllPlans.beforeCoverageStartDate",
        "primary.portal.coverage.notAllowedDate",
        "primary.portal.benefitsOffering.giEnrollmentDatesInfo",
        "primary.portal.common.dateHint",
    ]);
    copyAllPlansForm: FormGroup;
    createPlanYearForm: FormGroup;
    enrollmentDateGroup: FormGroup;
    coverageDateGroup: FormGroup;
    planYearOptions = [];
    planYearId: number;
    fieldErrorMessage = "";
    errorMsg = "";
    error = false;
    planYears: PlanYear[];
    planYearNameToDisplay = "";
    existingPlanYearDisableFlag = false;
    planYearselection = planYearSelection;
    showCreateNewPlanYearFlag = false;
    selectPlanYearOption: FormControl;
    coverageDateToDisplay = "";
    planYearAvailableTooltip: string;
    planYearNotAvailableTooltip: string;
    selectedPlanYearOption: string;
    allPlanYearIds = new Set<number>();
    latestPlanYearId: number;
    loader = false;
    overlappingPlanYear = this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.coveragePeriod.overlapping.plans");
    invalidPlans: PlanChoice[] = [];
    today: Date = new Date();
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    carrierIds = CarrierId;
    minDaysDifference: number;
    enteredDate: string;
    coverageMinDate: Date;
    isCoverageStartDateDisabled: boolean;
    isQ60 = false;
    isGIEnrollmentDatesOn: boolean;
    giMaxDiffDate: Date;
    giEnrollEndDateDisable: boolean;
    giMinDiffDate: Date;
    enableGIEligibleDateMessage$: Observable<boolean>;
    mpGroup: number;
    constructor(
        private readonly fb: FormBuilder,
        @Inject(MAT_DIALOG_DATA) readonly data: { route: ActivatedRoute; mpGroup: number; productDetail: any },
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly benefitsOfferingHelperService: BenefitOfferingHelperService,
        private readonly datepipe: DatePipe,
        private readonly maskPipe: NgxMaskPipe,
        private readonly dialog: MatDialogRef<CopyAllPlansComponent>,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly productsPlansQuasiService: ProductsPlansQuasiService,
        private readonly staticUtilService: StaticUtilService,
        private readonly dateService: DateService,
    ) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     * used to call @method createFormFields
     * used to call @method executeServiceCalls()
     */
    ngOnInit(): void {
        this.createFormFields();
        this.executeServiceCalls();
        this.minDaysDifference = this.data.productDetail.carrierId === this.carrierIds.AFLAC ? DAY_DIFF_AFLAC : DAY_DIFF_NON_AFLAC;
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.enableGIEligibleDateMessage$ = this.benefitsOfferingHelperService.enableGIEligibleDateMessage(this.mpGroup.toString());
    }

    /**
     * function is used to dispatch secondary language strings and to get planYears
     */
    executeServiceCalls(): void {
        this.loader = true;
        this.store
            .dispatch(new LoadSecondaryLandingLanguage("secondary.portal.*"))
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((res) => this.getPlanYears()),
            )
            .subscribe(() => {
                this.loader = false;
            });
        const panelModel = this.store
            .selectSnapshot(BenefitsOfferingState.getpanelProducts)
            .filter((pannel) => pannel.productChoice != null);
        if (panelModel?.length) {
            panelModel.forEach((productData) => {
                this.isQ60 = productData.plans.some((planData) => planData.plan.policySeries.includes("Q60"));
                if (this.isQ60) {
                    return;
                }
            });
        }
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
    }

    /**
     * This method is used to initialize formGroup
     */
    createFormFields(): void {
        this.copyAllPlansForm = this.fb.group({
            planYearOptions: ["", Validators.required],
        });
        this.enrollmentDateGroup = this.fb.group({
            effectiveStarting: ["", [Validators.required, this.checkDate.bind(this), this.checkEnrollmentStartDate.bind(this)]],
            expiresAfter: ["", [Validators.required, this.checkDate.bind(this), this.checkEnrollmentEndDate.bind(this)]],
            guaranteedIssueEffectiveStarting: [
                { disabled: true, value: "" },
                [Validators.required, this.checkDate.bind(this), this.checkEnrollmentStartDate.bind(this)],
            ],
            guaranteedIssueExpiresAfter: ["", [Validators.required, this.checkDate.bind(this), this.checkGIEnrollmentDate.bind(this)]],
        });
        this.coverageDateGroup = this.fb.group({
            effectiveStarting: ["", [Validators.required, this.checkDate.bind(this), this.checkCoverageStartDate.bind(this)]],
            expiresAfter: ["", [Validators.required, this.checkDate.bind(this), this.checkCoverageEndDate.bind(this)]],
        });
        this.createPlanYearForm = this.fb.group({
            name: ["", Validators.required],
        });
        this.createPlanYearForm.addControl("coveragePeriod", this.coverageDateGroup);
        this.createPlanYearForm.addControl("enrollmentPeriod", this.enrollmentDateGroup);
    }
    /**
     * This method is used to get approved and unapproved planYears
     * @returns observable of approved and unapproved planYears
     */
    getPlanYears(): Observable<[PlanYear[], PlanYear[]]> {
        return combineLatest([
            this.benefitsOfferingService.getPlanYears(this.data.mpGroup, true, false),
            this.benefitsOfferingService.getPlanYears(this.data.mpGroup, false, false),
        ]).pipe(
            tap(([unapprovedPlanYears, approvedPlanYears]) => {
                this.planYears = unapprovedPlanYears;
                this.planYears.push(...approvedPlanYears);
                this.mapData();
            }),
        );
    }
    /**
     * The below method is bind to form control and validates enrollment start date
     * @param control is formControl value
     * @returns ValidationErrors for form-control
     */
    checkEnrollmentStartDate(control: FormControl): ValidationErrors {
        this.disableGIEnrollmentMinEndDate(this.dateService.toDate(control.value));
        return this.checkEnrollmentDates(control, true, false);
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
     * The below method is bound to form control and validates enrollment dates
     * @param control is formControl value
     * @param isStartDate check if start date is changed
     * @param isCoverageEndDate check if the method call is for coverage end date
     * @returns ValidationErrors for form-control
     */
    checkEnrollmentDates(control: FormControl, isStartDate: boolean, isCoverageEndDate: boolean): ValidationErrors {
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
            date = this.resetControlValue(controlToReset, date, isStartDate, inputDate, expiresAfterControl);
            if (!inputDate || isNaN(inputDate.getTime())) {
                return { invalid: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            currentDate.setHours(0, 0, 0, 0);
            if (
                !isCoverageEndDate &&
                !isStartDate &&
                inputDate &&
                coverageDateControl &&
                coverageDateControl.value &&
                this.dateService.getDifferenceInDays(
                    this.dateService.toDate(coverageDateControl.value),
                    this.dateService.toDate(inputDate),
                ) < this.minDaysDifference
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
            const diffInDays = Math.abs(this.dateService.getDifferenceInDays(guaranteedIssueStartDate, inputDate));
            this.giMaxDiffDate = this.benefitsOfferingHelperService.disableGIEnrollmentEndDate(
                guaranteedIssueStartDate,
                DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS,
            );
            this.giEnrollEndDateDisable = this.giMaxDiffDate >= enrollmentExpiryDate;
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            if (inputDate < currentDate) {
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
     * Method to check if controls values should be reset
     * @param controlToReset controlToReset
     * @param date date
     * @param isStartDate check if start date is changed
     * @param inputDate entered Date
     * @param expiresAfterControl enrollment end date control
     * @returns date
     */
    resetControlValue(
        controlToReset: AbstractControl,
        date: Date,
        isStartDate: boolean,
        inputDate: Date,
        expiresAfterControl: AbstractControl,
    ): Date {
        if (controlToReset && controlToReset.value) {
            date = this.dateService.toDate(controlToReset.value);
            this.resetEnrollmentDateErrors(
                isStartDate ? inputDate : date,
                isStartDate ? date : inputDate,
                isStartDate,
                this.dateService.toDate(expiresAfterControl.value),
            );
        }
        return date;
    }

    /**
     * Method to set min date for coverage start date on change of enrollment end date
     */
    setCoverageMinDate(): void {
        if (!this.isCoverageStartDateDisabled) {
            const minDate = this.dateService.toDate(this.enrollmentDateGroup.controls.expiresAfter.value || "");
            minDate.setDate(minDate.getDate() + this.minDaysDifference);
            const notAllowedDates = minDate?.getDate();
            const dateObject = DateInfo.LAST_DATES_OF_MONTH.includes(notAllowedDates)
                ? this.dateService.getFirstOfNextMonth(minDate)
                : minDate;
            this.coverageMinDate = dateObject;
            this.coverageDateGroup.controls.effectiveStarting.patchValue(this.coverageMinDate);
            this.populateEndDate(minDate);
        }
        if (!this.isGIEnrollmentDatesOn || !this.isQ60) {
            // config indicator flag is able to toggle on / toggle off for may release.
            return;
        }
        const enrollExpDate = this.dateService.toDate(this.enrollmentDateGroup.controls.expiresAfter.value);
        const giEnrollmentDateGroup: AbstractControl = this.enrollmentDateGroup.controls.guaranteedIssueEffectiveStarting;
        const guaranteedIssueStartDate = this.dateService.toDate(giEnrollmentDateGroup.value);
        const diffInDays = Math.abs(this.dateService.getDifferenceInDays(guaranteedIssueStartDate, enrollExpDate));
        this.giMaxDiffDate = this.benefitsOfferingHelperService.disableGIEnrollmentEndDate(
            guaranteedIssueStartDate,
            DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS,
        );
        this.giEnrollEndDateDisable = this.giMaxDiffDate > enrollExpDate;
        if (diffInDays <= DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS) {
            this.enrollmentDateGroup.controls.guaranteedIssueExpiresAfter.patchValue(enrollExpDate);
        }
        if (this.giMaxDiffDate < enrollExpDate) {
            this.enrollmentDateGroup.controls.guaranteedIssueExpiresAfter.patchValue(this.giMaxDiffDate);
        }
    }

    /**
     * The below method is bind to form control and validates enrollment end date
     * @param control is formControl value
     * @returns ValidationErrors for form-control
     */
    checkEnrollmentEndDate(control: FormControl): ValidationErrors {
        return this.checkEnrollmentDates(control, false, false);
    }

    /**
     * The below method is bind to form control and validates coverage end date
     * @param control is formControl value
     * @returns ValidationErrors for form-control
     */
    checkCoverageEndDate(control: FormControl): ValidationErrors {
        let coverageDateControl: Date;
        if (control.value) {
            if (this.coverageDateGroup.controls.effectiveStarting.value) {
                coverageDateControl = this.dateService.toDate(this.coverageDateGroup.controls.effectiveStarting.value);
                coverageDateControl.setHours(0, 0, 0, 0);
            }
            const inputDate: Date = this.dateService.toDate(control.value);
            inputDate.setHours(0, 0, 0, 0);
            if (this.dateService.isBefore(inputDate)) {
                return { pastDate: true };
            }
            if (inputDate && coverageDateControl && inputDate < coverageDateControl) {
                return { invalidEndDate: true };
            }
        }
        return this.checkEnrollmentDates(control, false, true);
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
            coverageDateControl.value &&
            this.dateService.getDifferenceInDays(
                this.dateService.toDate(coverageDateControl.value),
                this.dateService.toDate(expiresAfterValue),
            ) > this.minDaysDifference &&
            endDate <= coverageDateControl.value &&
            endDate >= currentDate &&
            isStartDate
        ) {
            this.enrollmentDateGroup.controls.expiresAfter.setErrors(null);
        }
    }

    /**
     * the below method validates the input date to be greater than current date
     * @param control is formControl value
     * @returns ValidationErrors for form-control
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
     * This method is used to create a plan year
     */
    createPlanYear(): void {
        this.loader = true;
        const enrollmentPeriod: EnrollmentPeriod = {
            effectiveStarting: this.datepipe.transform(
                this.dateService.toDate(this.enrollmentDateGroup.controls[DateInfo.EFFECTIVE_STARTING].value || ""),
                DateFormats.YEAR_MONTH_DAY,
            ),
            expiresAfter: this.datepipe.transform(
                this.dateService.toDate(this.enrollmentDateGroup.controls[DateInfo.EXPIRES_AFTER].value || ""),
                DateFormats.YEAR_MONTH_DAY,
            ),
            guaranteedIssueEffectiveStarting:
                this.isGIEnrollmentDatesOn && this.isQ60
                    ? this.dateService.format(
                          this.dateService.toDate(this.enrollmentDateGroup.controls[DateInfo.GI_EFFECTIVE_STARTING].value || ""),
                          DateFormats.YEAR_MONTH_DAY,
                      )
                    : null,
            guaranteedIssueExpiresAfter:
                this.isGIEnrollmentDatesOn && this.isQ60
                    ? this.dateService.format(
                          this.dateService.toDate(this.enrollmentDateGroup.controls[DateInfo.GI_EXPIRES_AFTER].value || ""),
                          DateFormats.YEAR_MONTH_DAY,
                      )
                    : null,
        };
        const coveragePeriod: CoveragePeriod = {
            effectiveStarting: this.datepipe.transform(
                this.dateService.toDate(this.coverageDateGroup.controls[DateInfo.EFFECTIVE_STARTING].value || ""),
                DateFormats.YEAR_MONTH_DAY,
            ),
            expiresAfter: this.datepipe.transform(
                this.dateService.toDate(this.coverageDateGroup.controls[DateInfo.EXPIRES_AFTER].value || ""),
                DateFormats.YEAR_MONTH_DAY,
            ),
        };
        const planYear: PlanYear = {
            coveragePeriod: coveragePeriod,
            name: this.createPlanYearForm.controls["name"].value,
            enrollmentPeriod: enrollmentPeriod,
            type: PlanYearType.AFLAC_INDIVIDUAL,
        };
        if (this.benefitsOfferingHelperService.checkForPlanYearNameValidation(planYear.name)) {
            this.error = true;
            this.loader = false;
            this.errorMsg = this.language.fetchSecondaryLanguageValue(
                "secondary.portal.benefitsOffering.coveragedates.planYearNameValidation",
            );
            return;
        }
        this.benefitsOfferingService.savePlanYear(planYear, this.data.mpGroup).subscribe(
            (resp) => {
                this.loader = false;
                const location: string = resp.headers.get("location");
                const stringArray = location.split("/");
                this.planYearId = Number(stringArray[stringArray.length - 1]);
                this.updatePlanChoicesToServer(this.mapPlanYearToPlans(this.planYearId));
            },
            (errorResp) => {
                this.error = true;
                this.loader = false;
                if (errorResp.status === ClientErrorResponseCode.RESP_400) {
                    if (errorResp.error.code === ClientErrorResponseType.BAD_PARAMETER) {
                        this.errorMsg = this.language.fetchSecondaryLanguageValue(
                            "secondary.portal.benefitsOffering.addPlanYear.badParameter",
                        );
                        if (errorResp.error.details) {
                            const fieldErrors: string[] = errorResp.error.details.map((detail) => detail.message);
                            this.fieldErrorMessage = fieldErrors.join(", ");
                        }
                    } else {
                        this.fieldErrorMessage = this.language.fetchSecondaryLanguageValue(
                            "secondary.portal.benefitsOffering.coveragedates.fieldValidationError",
                        );
                    }
                } else if (
                    errorResp.status === ClientErrorResponseCode.RESP_409 &&
                    errorResp.error.code === ClientErrorResponseType.DUPLICATE
                ) {
                    this.errorMsg = this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.duplicatePlanYear");
                } else {
                    this.errorMsg = this.language.fetchSecondaryLanguageValue(
                        "secondary.portal.benefitsOffering.coveragedates.fieldValidationError",
                    );
                }
            },
        );
    }
    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, "09/09/0000");
    }
    filterPlanYear(id: number, coverageStartDate?: Date): PlanYear[] {
        let planYears;
        if (coverageStartDate) {
            planYears = this.planYears.filter((planYear) =>
                this.dateService.checkIsAfter(
                    this.dateService.toDate(planYear.coveragePeriod.effectiveStarting),
                    this.dateService.toDate(coverageStartDate),
                ),
            );
        } else if (id) {
            planYears = this.planYears.filter((planYear) => planYear.id === id);
        }
        if (planYears) {
            return planYears;
        }
        return [];
    }
    /**
     * fetch the recent plan year details and set form data
     * @returns void
     */
    mapData(): void {
        this.data.productDetail.plans.forEach((plan) => {
            this.allPlanYearIds.add(plan.planYear.id);
        });
        const planYearIds: number[] = Array.from(this.allPlanYearIds);
        this.latestPlanYearId = Math.max(...planYearIds);
        const planDetails = this.data.productDetail.plans.filter((plan) => plan.planYear.id === this.latestPlanYearId);
        const coverageStartDate = this.dateService.addDays(
            this.dateService.toDate(planDetails[0].planYear.coveragePeriod.expiresAfter || ""),
            1,
        );
        const notAllowedDates = this.dateService.toDate(coverageStartDate).getDate();
        const dateObject = DateInfo.LAST_DATES_OF_MONTH.includes(notAllowedDates)
            ? this.dateService.getFirstOfNextMonth(coverageStartDate)
            : coverageStartDate;
        this.coverageDateToDisplay = this.dateService.format(dateObject, DateFormats.MONTH_DAY_YEAR);
        this.planYearNameToDisplay = planDetails[0].planYear.name;
        const planYearsToDisplay = this.filterPlanYear(
            null,
            this.dateService.toDate(planDetails[0].planYear.coveragePeriod.effectiveStarting),
        );
        const planYearFilter = planYearsToDisplay.filter(
            (planYear) =>
                this.dateService.toDate(planYear.coveragePeriod.effectiveStarting) >
                    this.dateService.toDate(planDetails[0].planYear.coveragePeriod.expiresAfter) &&
                (this.data.productDetail.carrierId === this.carrierIds.AFLAC ||
                    this.dateService.getDifferenceInDays(
                        this.dateService.toDate(planYear.coveragePeriod.effectiveStarting),
                        this.dateService.toDate(planYear.enrollmentPeriod.expiresAfter),
                    ) >= DAY_DIFF_NON_AFLAC),
        );
        if (planYearsToDisplay && planYearsToDisplay.length > 0 && planYearFilter && planYearFilter.length > 0) {
            planYearFilter.forEach((planYearToDisplay) => {
                this.planYearOptions.push({
                    value: planYearToDisplay.id,
                    viewValue: planYearToDisplay.name,
                });
            });
        } else {
            this.existingPlanYearDisableFlag = true;
            this.copyAllPlansForm.controls.planYearOptions.setValue(planYearSelection.newPlanYear);
            this.planYearOptionsSelectionChange();
        }
        if (this.dateService.checkIsAfter(this.dateService.toDate(planDetails[0].planYear.coveragePeriod.expiresAfter), new Date())) {
            this.isCoverageStartDateDisabled = true;
            this.patchCoverageStartDateValueAndDisable(planDetails[0].planYear.coveragePeriod.expiresAfter);
        } else {
            this.coverageMinDate = new Date();
        }
    }
    /**
     * Map plans as per selected planYearId
     * @param planYearId selected planYearId
     * @returns mapped plans list
     */
    mapPlanYearToPlans(planYearId: number): PlanChoice[] {
        const mappedPlans: PlanChoice[] = [];
        let copyToPlanList: PlanChoice[] = [];
        if (this.selectedPlanYearOption === planYearSelection.existingPlanYear) {
            const allPlanChoices: PlanChoice[] = this.store
                .selectSnapshot(BenefitsOfferingState.getPlanChoices)
                .concat(this.store.selectSnapshot(BenefitsOfferingState.getUnapprovedPlanChoices));
            copyToPlanList = allPlanChoices.filter((planChoice) => planChoice.planYearId === planYearId);
        }
        this.data.productDetail.plans.forEach((planObject) => {
            let copyToPlanChoice: PlanChoice[] = [];
            if (this.selectedPlanYearOption === planYearSelection.existingPlanYear) {
                copyToPlanChoice = copyToPlanList.filter((planChoice) => planChoice.plan.id === planObject.plan.plan.id);
            }
            if (copyToPlanChoice.length === ZERO_LENGTH && planObject.planYear.id === this.latestPlanYearId) {
                mappedPlans.push({
                    id: null,
                    planId: planObject.plan.plan.id,
                    taxStatus: planObject.plan.taxStatus,
                    cafeteria: planObject.plan.cafeteria,
                    agentAssisted: planObject.plan.agentAssisted,
                    planYearId: planYearId,
                });
            }
        });
        return mappedPlans;
    }

    /**
     * On click on copy plans this method is used to make createPlanChoice API call
     * This will make calls to get the benefit offering carriers
     * Save the carrier setup status as INCOMPLETE and fetch the updated statuses and forms.
     * Once the carriers API calls are done then submitApproval request call is made and the popup is closed
     * @returns void
     */
    updatePlanChoicesToServer(planChoices: PlanChoice[]): void {
        const apiCalls$ = [];
        planChoices.forEach((planChoice) => {
            apiCalls$.push(this.benefitsOfferingService.createPlanChoice(planChoice, this.data.mpGroup));
        });
        forkJoin(apiCalls$)
            .pipe(
                switchMap(() => this.benefitsOfferingService.getBenefitOfferingCarriers(true)),
                map((carriers) => (carriers.length ? this.getCarrierIds(carriers) : [])),
                mergeMap((resp) => this.store.dispatch(new GetCarrierSetupStatuses(resp, true))),
                mergeMap(() => this.updateAndFetchStatus()),
                switchMap(() => this.benefitsOfferingService.submitApprovalRequest(this.data.mpGroup, false)),
                catchError(() => of(null)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(() => {
                this.dialog.close("save");
            });
    }

    /**
     * Save the carrier setup status as INCOMPLETE and fetch the updated statuses and forms.
     *
     *  @returns Observable<HttpResponse<void>[]>
     */
    updateAndFetchStatus(): Observable<HttpResponse<void>[]> {
        return this.saveCarrierSetupStatus().pipe(
            mergeMap(() => this.benefitsOfferingService.getBenefitOfferingCarriers(true)),
            map((carriers) => (carriers.length ? this.getCarrierIds(carriers) : [])),
            concatMap((resp) => this.store.dispatch(new GetCarrierSetupStatuses(resp, true))),
            mergeMap(() => this.store.dispatch(new SetCarrierForms(true, true))),
        );
    }

    /**
     * Extracts the carrier ids from the Account Carriers response
     *
     * @param carriers
     * @returns carrierids
     */
    getCarrierIds(carriers: AccountCarrier[]): number[] {
        return carriers.map((carrier) => carrier.id);
    }

    /**
     * Save carrier Setup status as Incomplete for all, if carrier setup statuses are not present
     */
    saveCarrierSetupStatus(): Observable<HttpResponse<void>[]> {
        const carrierIds: number[] = this.store.selectSnapshot(BenefitsOfferingState.getPlanCarriers);
        return forkJoin(
            carrierIds.map((carrier) => {
                const statusPayload: CarrierSetupStatus = {
                    status: CarrierFormSetupStatus.INCOMPLETE,
                };
                return this.store.dispatch(new SaveCarrierSetupStatus(statusPayload, carrier, true)).pipe(catchError(() => of(null)));
            }),
        );
    }
    /**
     * close copy plans dialog and reset value
     */
    cancel(): void {
        this.invalidPlans = [];
        this.dialog.close();
    }
    /**
     * Validating duplicate plans then create new plan year
     */
    onSubmit(): void {
        let planYearDetails: PlanYear;
        if (this.copyAllPlansForm.invalid) {
            return;
        }
        const selectPlanYearOptionCtrl: FormControl = this.copyAllPlansForm.controls["selectPlanYearOption"] as FormControl;
        if (this.selectedPlanYearOption === planYearSelection.existingPlanYear) {
            planYearDetails = this.planYears.find((planYear) => planYear.id === selectPlanYearOptionCtrl.value);
        }
        const coverageEffectiveStarting =
            this.selectedPlanYearOption === planYearSelection.newPlanYear
                ? this.coverageDateGroup.controls[DateInfo.EFFECTIVE_STARTING].value
                : planYearDetails.coveragePeriod.effectiveStarting;
        const coverageExpiresAfter =
            this.selectedPlanYearOption === planYearSelection.newPlanYear
                ? this.coverageDateGroup.controls[DateInfo.EXPIRES_AFTER].value
                : planYearDetails.coveragePeriod.expiresAfter;
        this.invalidPlans = this.productsPlansQuasiService.getIneligiblePlans(
            this.dateService.toDate(coverageEffectiveStarting || ""),
            this.dateService.toDate(coverageExpiresAfter || ""),
            this.data.productDetail.plans,
            this.planYears,
        );
        if (this.invalidPlans.length === ZERO_LENGTH) {
            if (this.selectedPlanYearOption === planYearSelection.newPlanYear) {
                this.createPlanYear();
            } else if (this.selectedPlanYearOption === planYearSelection.existingPlanYear) {
                this.updatePlanChoicesToServer(this.mapPlanYearToPlans(selectPlanYearOptionCtrl.value));
            }
        }
    }
    /**
     * Function used to set the coverage start date and disable the input field
     * @param endDate: Plan year coverage end date
     */
    patchCoverageStartDateValueAndDisable(endDate: Date): void {
        const notAllowedDates = this.dateService.toDate(endDate || "").getDate() + 1;
        const dateObject = DateInfo.LAST_DATES_OF_MONTH.includes(notAllowedDates)
            ? this.dateService.getFirstOfNextMonth(this.dateService.toDate(endDate))
            : this.dateService.addDays(this.dateService.toDate(endDate), 1);
        const dateValue = this.datepipe.transform(dateObject, DateFormats.MONTH_DAY_YEAR);
        this.coverageDateGroup.controls[DateInfo.EFFECTIVE_STARTING].patchValue(dateObject);
        this.planYearAvailableTooltip = "Only plan years that start coverage on " + dateValue + " are available";
        this.planYearNotAvailableTooltip = "No existing plan years start coverage on " + dateValue;
        this.coverageDateGroup.controls[DateInfo.EFFECTIVE_STARTING].disable();
    }
    /**
     * radio button change event for planYear options
     */
    planYearOptionsSelectionChange(): void {
        this.invalidPlans = [];
        this.selectedPlanYearOption = this.copyAllPlansForm.controls["planYearOptions"].value;
        if (this.selectedPlanYearOption === planYearSelection.newPlanYear) {
            this.copyAllPlansForm.removeControl("selectPlanYearOption");
            this.copyAllPlansForm.addControl("createNewPlanYear", this.createPlanYearForm);
            this.showCreateNewPlanYearFlag = true;
        } else if (this.selectedPlanYearOption === planYearSelection.existingPlanYear) {
            this.copyAllPlansForm.removeControl("createNewPlanYear");
            this.showCreateNewPlanYearFlag = false;
            this.copyAllPlansForm.addControl("selectPlanYearOption", this.fb.control("", Validators.required));
        }
    }
    getProductDetails(): string {
        return `${this.data.productDetail.productName} | ${this.data.productDetail.carrierName}`;
    }

    /**
     * Method to validate coverage start date should be greater than
     * enrollment end date and less than coverage end date
     * @param control Form control to take the enrollment end date value
     * @returns ValidationErrors for coverage start date form-control
     */
    checkCoverageStartDate(control: FormControl): ValidationErrors | void {
        if (control.value && !this.isCoverageStartDateDisabled) {
            const date = new Date();
            let enrollmentEndDate;
            let errorType = null;
            if (this.copyAllPlansForm) {
                enrollmentEndDate = this.dateService.toDate(this.enrollmentDateGroup.controls.expiresAfter.value || "");
                const oneDayFromEnrollmentEndDate = this.dateService.toDate(enrollmentEndDate || "");
                oneDayFromEnrollmentEndDate.setDate(oneDayFromEnrollmentEndDate.getDate() + this.minDaysDifference);
                this.coverageMinDate = this.dateService.toDate(oneDayFromEnrollmentEndDate);
            }
            const inputStartDate = this.dateService.toDate(control.value);
            inputStartDate.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);
            if (inputStartDate < date) {
                errorType = { pastDate: true };
            }
            const enteredInput = inputStartDate.getDate();
            if (DateInfo.LAST_DATES_OF_MONTH.includes(enteredInput)) {
                this.enteredDate = this.dateService.format(inputStartDate, DateFormats.MONTH_DAY_YEAR);
                errorType = { notAllowedDate: true };
            }
            if (
                errorType === null &&
                enrollmentEndDate &&
                this.dateService.getDifferenceInDays(this.dateService.toDate(inputStartDate), this.dateService.toDate(enrollmentEndDate)) <
                    this.minDaysDifference
            ) {
                errorType = { minimumDays: true };
            }
            return errorType;
        }
    }
    /**
     * This function will be responsible for populating the end date with 1 year of ahead of start date
     * @param startDate coverage start date
     * @param event Mat-select change attribute passed through whenever the mat select dropdown gets changes
     */
    populateEndDate(startDate: string | Date, event?: MatSelectChange): void {
        if (((startDate && !event) || (event && event.source && event.source.selected && startDate)) && !this.isCoverageStartDateDisabled) {
            const inputStartDate = this.dateService.getOneDayLessThanYear(this.dateService.toDate(startDate || ""));
            this.coverageDateGroup.controls.expiresAfter.patchValue(inputStartDate);
        }
    }
    /**
     * func onStartDateUpdated() enrollment-period dateChange to update q60K GI start date.
     * to disable gi min and max end date based on the start date.
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
        if (enrollmentEndDate.value && this.dateService.checkIsAfter(giEnrollmentEndDate, enrollmentEndDate.value)) {
            this.createPlanYearForm.get("enrollmentPeriod").get(DateInfo.GI_EXPIRES_AFTER).patchValue(enrollmentEndDate.value);
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
