import { Component, OnInit, Inject, OnDestroy, AfterViewInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatSelectChange } from "@angular/material/select";
import { FormGroup, FormBuilder, Validators, FormControl, AbstractControl, ValidationErrors } from "@angular/forms";
import { BenefitsOfferingService, CoveragePeriod, AccountService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { BenefitOfferingHelperService } from "./../../../benefit-offering-helper.service";
import { DatePipe } from "@angular/common";
import { takeUntil, tap } from "rxjs/operators";
import { Subject, combineLatest, Observable } from "rxjs";
import {
    CarrierId,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    Permission,
    DateInfo,
    DateFormats,
    ConfigName,
    AppSettings,
    PlanYearType,
    EnrollmentPeriod,
    PlanYear,
} from "@empowered/constants";
import { DAYS } from "../../../benefits-offering/products/products.constants";
import { CoverageDateApprovalComponent } from "../../../coverage-date-approval/coverage-date-approval.component";
import { DateService } from "@empowered/date";
import { AccountsBusinessService, SharedService, EmpoweredModalService } from "@empowered/common-services";
import { StaticUtilService } from "@empowered/ngxs-store";

const ONE_DAY_YEAR = 1;
const FUTURE_MONTH_CAFE = 3;
const FUTURE_MONTH_NON_CAFETERIA = 6;
const DAY_DIFF_AFLAC = 1;
const DAY_DIFF_ADV = 7;
const DAY_DIFF_NON_AFLAC = 15;
const GI_MAX_ENROLL_PERIOD_IN_DAYS = 45;
const DAYS_VAR = "days";
const MONTHS_VAR = "month";
const DATE_VALUE = "value";
const PLAN_YEAR_START_DATE = "plan_year_start_date";
const PLAN_YEAR_END_DATE = "plan_year_end_date";
const THREE_MONTHS = 3;
const FIRST_DATE_OF_MONTH_ONE_DAY = 1;

@Component({
    selector: "empowered-edit-plan-year",
    templateUrl: "./edit-plan-year.component.html",
    styleUrls: ["./edit-plan-year.component.scss"],
})
export class EditPlanYearComponent implements OnInit, OnDestroy, AfterViewInit {
    editPlanYearForm: FormGroup;
    private unsubscribe$ = new Subject<void>();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.editPlanYear.title",
        "primary.portal.maintenanceBenefitsOffering.editPlanYear.subTitle",
        "primary.portal.maintenanceBenefitsOffering.editPlanYear.planYearName",
        "primary.portal.maintenanceBenefitsOffering.editPlanYear.enrollmentDates",
        "primary.portal.maintenanceBenefitsOffering.editPlanYear.enrollmentStartDate",
        "primary.portal.maintenanceBenefitsOffering.editPlanYear.enrollmentEndDate",
        "primary.portal.maintenanceBenefitsOffering.editPlanYear.coverageDates",
        "primary.portal.maintenanceBenefitsOffering.editPlanYear.coverageStartDate",
        "primary.portal.maintenanceBenefitsOffering.editPlanYear.coverageEndDate",
        "primary.portal.common.cancel",
        "primary.portal.common.save",
        "primary.portal.common.close",
        "primary.portal.common.dateHint",
        "primary.portal.coverage.cannotBePast",
        "primary.portal.common.requiredField",
        "primary.portal.common.invalidDateFormat",
        "primary.portal.benefitsOffering.aflacDates",
        "primary.portal.benefitsOffering.cafeteriaDatesInfo",
        "primary.portal.dashboard.unpluggedAccount.checkedOutToUnplugged",
        "primary.portal.coverage.notAllowedDate",
        "primary.portal.benefitsOffering.setting.singleCarrierValidation",
        "primary.portal.benefitsOffering.setting.multipleCarrierValidation",
        "primary.portal.common.and",
        "primary.portal.benefitsOffering.giEnrollmentDatesInfo",
    ]);
    fieldErrorMessage = "";
    errorMsg = "";
    error = false;
    fifteenDaysErrorMessage = "";
    isInvalidPCPlanYear = false;
    languageSecondStringsArray: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.benefitsOffering.setting.employeesRequired",
        "secondary.portal.benefitsOffering.coveragedates.dateBeforeEnrollmentDate",
        "secondary.portal.benefitsOffering.coveragedates.fifteenDaysAfterEnrollmentEndDate",
        "secondary.portal.benefitsOffering.coveragedates.sevenDaysAfterEnrollmentEndDate",
        "secondary.portal.benefitsOffering.coveragedates.invalidDate",
        "secondary.portal.benefitsOffering.coveragedates.maxEndDate",
        "secondary.portal.benefitsOffering.coveragedates.invalidenddate",
        "secondary.portal.benefitsOffering.coveragedates.fieldValidationError",
        "secondary.portal.benefitsOffering.coverageDate.cannotBeBeforeStartDate",
        "secondary.portal.benefitsOffering.coveragedates.invalidStartDate",
        "secondary.portal.benefitsOffering.coveragedates.planYearNameValidation",
        "secondary.portal.benefitsOffering.duplicatePlanYear",
    ]);
    minDate = new Date();
    isRole20User: boolean;
    noOfNonAflacPlans: number;
    noOfVasPlans: number;
    readonly CALENDAR_MAX_LENGTH = AppSettings.CALENDAR_MAX_LEN;
    currentDate = new Date();
    dateArray: string[] = [];
    dropDownForNextMonth: number;
    enrollmentDifferenceIndays = DAY_DIFF_NON_AFLAC;
    minimumDayErrorMessage = "";
    isDatePickerDisabled: boolean;
    cafeteriaStartDate: string;
    cafeteriaEndDate: string;
    isCarrier = false;
    isAflacGroup$: Observable<boolean> = this.accountsBusinessService.checkForCafeteriaEligibility();
    formLoaded = false;
    enteredDate: string;
    dateClass = this.sharedService.dateClass;
    coverageMinDate: Date;
    nonAflacCarrierNames: string[] = [];
    isQ60 = false;
    isGIEnrollmentDatesOn: boolean;
    giMaxDiffStartDate: Date;
    giEnrollEndDateDisable: boolean;
    giMinDiffStartDate: Date;
    approvalModelOpen = false;
    approveReceived = false;
    constructor(
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly formBuilder: FormBuilder,
        private readonly dialogRef: MatDialogRef<EditPlanYearComponent>,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly benefitsOfferingHelperService: BenefitOfferingHelperService,
        private readonly language: LanguageService,
        private readonly datepipe: DatePipe,
        private readonly staticUtilService: StaticUtilService,
        private readonly accountService: AccountService,
        private readonly accountsBusinessService: AccountsBusinessService,
        private readonly sharedService: SharedService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly dateService: DateService,
    ) {}

    /**
     * Fetch permission and set form data
     */
    ngOnInit(): void {
        // This below method is used to check permission
        this.staticUtilService
            .hasPermission(Permission.UPDATE_PLAN_COVERAGE_DATE)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.isRole20User = res;
            });
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        const DEFAULT_GI_ENROLLMENT_END_DATE = this.data.giEnrollmentDefaultEndDate;
        if (this.data.openMode === "edit") {
            this.isDatePickerDisabled = false;
            this.editPlanYearForm = this.formBuilder.group({
                name: [this.data.planYear.planYearDetails.name, [Validators.required]],
                enrollmentStartDate: [
                    this.data.planYear.planYearDetails.enrollmentPeriod.effectiveStarting
                        ? this.dateService.toDate(this.data.planYear.planYearDetails.enrollmentPeriod.effectiveStarting)
                        : "",
                    [Validators.required, this.checkEnrollmentStartDate.bind(this), this.checkDate.bind(this)],
                ],
                enrollmentEndDate: [
                    this.data.planYear.planYearDetails.enrollmentPeriod.expiresAfter
                        ? this.dateService.toDate(this.data.planYear.planYearDetails.enrollmentPeriod.expiresAfter)
                        : "",
                    [Validators.required, this.checkDate.bind(this), this.checkEnrollemtEndDate.bind(this)],
                ],
                giEnrollmentStartDate: [
                    this.data.planYear.planYearDetails.enrollmentPeriod.effectiveStarting
                        ? this.dateService.toDate(this.data.planYear.planYearDetails.enrollmentPeriod.effectiveStarting)
                        : "",
                    [Validators.required, this.checkEnrollmentStartDate.bind(this), this.checkDate.bind(this)],
                ],
                giEnrollmentEndDate: [
                    this.data.planYear.planYearDetails.enrollmentPeriod.guaranteedIssueExpiresAfter
                        ? this.dateService.toDate(this.data.planYear.planYearDetails.enrollmentPeriod.guaranteedIssueExpiresAfter)
                        : this.dateService.toDate(DEFAULT_GI_ENROLLMENT_END_DATE),
                    [Validators.required, this.checkDate.bind(this), this.checkGIEnrollmentDate.bind(this)],
                ],
                coverageStartDate: [
                    this.data.planYear.planYearDetails.coveragePeriod.effectiveStarting
                        ? this.dateService.toDate(this.data.planYear.planYearDetails.coveragePeriod.effectiveStarting)
                        : "",
                    [Validators.required, this.checkDate.bind(this), this.checkCoverageStartDate.bind(this)],
                ],
                coverageEndDate: [
                    {
                        disabled: !this.isRole20User && !this.data.plans.every((plan) => plan.plan.vasFunding),
                        value: this.data.planYear.planYearDetails.coveragePeriod.expiresAfter
                            ? this.dateService.toDate(this.data.planYear.planYearDetails.coveragePeriod.expiresAfter)
                            : "",
                    },
                    [Validators.required, this.checkDate.bind(this), this.checkCoverageEndDate.bind(this)],
                ],
            });
            if (!this.data.planYear.enrollmentEditable) {
                if (
                    this.dateService.isBefore(
                        this.dateService.toDate(this.data.planYear.planYearDetails.enrollmentPeriod.expiresAfter || ""),
                        currentDate,
                    )
                ) {
                    this.editPlanYearForm.controls.enrollmentEndDate.disable();
                    this.isDatePickerDisabled = true;
                }
                this.editPlanYearForm.controls.enrollmentStartDate.disable();
            }
            if (
                (this.isRole20User &&
                    this.dateService.isBefore(
                        this.dateService.toDate(this.data.planYear.planYearDetails.coveragePeriod.effectiveStarting || ""),
                        new Date(),
                    )) ||
                this.data.isActive
            ) {
                this.editPlanYearForm.controls.coverageStartDate.disable();
            }
            this.editPlanYearForm.controls.giEnrollmentStartDate.disable();
            this.setEnrollmentDifferenceDays();
            this.getCafeteriaPlanDates();
            this.setCarrierPlansDateValidation();
        }
        this.isQ60 = this.data.isQ60Selected;
        this.staticUtilService
            .cacheConfigEnabled(ConfigName.GI_ENROLLMENT_DATES_FEATURE)
            .pipe(
                tap((giEnrollmentDatesConfigValue) => {
                    // GI date will be enable if giEnrollmentDatesConfigValue is enable
                    this.isGIEnrollmentDatesOn = giEnrollmentDatesConfigValue;
                    const giEnrollmentEndDate = this.data.planYear.planYearDetails.enrollmentPeriod.guaranteedIssueExpiresAfter;
                    if (this.editPlanYearForm && (!this.isGIEnrollmentDatesOn || !this.isQ60)) {
                        this.editPlanYearForm.removeControl("giEnrollmentStartDate");
                        this.editPlanYearForm.removeControl("giEnrollmentEndDate");
                    }
                    // parsing the dates from string through date-fns parse function
                    const parsedExpiredDate = this.dateService.parseDate(
                        this.data.planYear.planYearDetails.enrollmentPeriod.expiresAfter,
                        DateFormats.YEAR_MONTH_DAY,
                    );
                    const parsedGIExpiredDate = this.dateService.parseDate(giEnrollmentEndDate, DateFormats.YEAR_MONTH_DAY);
                    if (
                        this.editPlanYearForm &&
                        this.editPlanYearForm.controls["giEnrollmentEndDate"] &&
                        (!giEnrollmentEndDate ||
                            (this.isGIEnrollmentDatesOn &&
                                this.isQ60 &&
                                !this.data.planYear.enrollmentEditable &&
                                (this.dateService.isBefore(parsedExpiredDate) || this.dateService.isBefore(parsedGIExpiredDate))))
                    ) {
                        this.editPlanYearForm.controls.giEnrollmentEndDate.disable();
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Set error message for pc carrier fifteen days validation
     */
    setCarrierPlansDateValidation(): void {
        const carrierIds = [];
        this.data.plans.forEach((plan) => {
            if (
                plan.plan.carrierId !== CarrierId.AFLAC &&
                plan.plan.carrierId !== CarrierId.AFLAC_GROUP &&
                !plan.plan.vasFunding &&
                !carrierIds.some((carrier) => carrier === plan.plan.carrierId)
            ) {
                carrierIds.push(plan.plan.carrierId);
                this.nonAflacCarrierNames.push(plan.plan.carrierNameOverride);
            }
        });
        if (this.nonAflacCarrierNames.length) {
            if (this.nonAflacCarrierNames.length === 1) {
                this.fifteenDaysErrorMessage = this.languageStrings[
                    "primary.portal.benefitsOffering.setting.singleCarrierValidation"
                ].replace("##carriername##", this.nonAflacCarrierNames[0]);
            } else {
                const carrierList = `${this.nonAflacCarrierNames.slice(0, -1).join(", ")} ${
                    this.languageStrings["primary.portal.common.and"]
                } ${this.nonAflacCarrierNames[this.nonAflacCarrierNames.length - 1]}`;
                // eslint-disable-next-line max-len
                this.fifteenDaysErrorMessage = `${carrierList} ${this.languageStrings["primary.portal.benefitsOffering.setting.multipleCarrierValidation"]}`;
            }
        }
    }

    /**
     * To get the cafeteria plan dates
     */
    getCafeteriaPlanDates(): void {
        const aflacPlans = this.data.plans.filter((plans) => plans.plan.carrierId === CarrierId.AFLAC);
        if (aflacPlans.length) {
            this.isCarrier = true;
        }
        if (this.isCarrier) {
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
                });
        }
    }

    /**
     * This method is used to check the plans and to set @var enrollmentDifferenceIndays
     * @returns void
     */
    setEnrollmentDifferenceDays(): void {
        this.noOfNonAflacPlans = this.data.plans.filter((plan) => plan.plan.carrierId !== CarrierId.AFLAC).length;
        this.noOfVasPlans = this.data.plans.filter((plan) => plan.plan.vasFunding).length;
        const noOfArgusPlans = this.data.plans.filter((plan) => plan.plan.carrierId === CarrierId.AFLAC_DENTAL_AND_VISION);
        if (this.noOfNonAflacPlans === 0 || this.noOfNonAflacPlans === this.noOfVasPlans) {
            this.enrollmentDifferenceIndays = DAY_DIFF_AFLAC;
            this.dropDownForNextMonth = FUTURE_MONTH_NON_CAFETERIA;
            this.minimumDayErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.dateBeforeEnrollmentDate"];
            this.populateCoverageEndDateForEditPlan(true);
        } else if (noOfArgusPlans && noOfArgusPlans.length === this.data.plans.length) {
            this.enrollmentDifferenceIndays = DAY_DIFF_ADV;
            this.dropDownForNextMonth = FUTURE_MONTH_CAFE;
            this.minimumDayErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.sevenDaysAfterEnrollmentEndDate"];
            this.populateCoverageEndDate(
                true,
                this.editPlanYearForm.controls.enrollmentEndDate.value
                    ? this.dateService.toDate(this.editPlanYearForm.controls.enrollmentEndDate.value)
                    : this.dateService.toDate(this.data.planYear.planYearDetails.enrollmentPeriod.expiresAfter || ""),
            );
        } else {
            this.enrollmentDifferenceIndays = DAY_DIFF_NON_AFLAC;
            this.dropDownForNextMonth = FUTURE_MONTH_CAFE;
            this.minimumDayErrorMessage =
                this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.fifteenDaysAfterEnrollmentEndDate"];
            this.populateCoverageEndDate(
                true,
                this.editPlanYearForm.controls.enrollmentEndDate.value
                    ? this.dateService.toDate(this.editPlanYearForm.controls.enrollmentEndDate.value)
                    : this.dateService.toDate(this.data.planYear.planYearDetails.enrollmentPeriod.expiresAfter || ""),
            );
        }
    }

    /**
     * The below method is bind to form control and validates the input date to be greater than current date
     * @param control is formControl value
     * @returns ValidationErrors for currently called form-control, if any
     */
    checkDate(control: FormControl): ValidationErrors | void {
        if (control.value && control.value.toString().trim().length > 0) {
            const date = new Date();
            const reg = new RegExp(AppSettings.NumberValidationRegex);
            const inputDate = this.dateService.toDate(control.value);
            if ((!inputDate || isNaN(inputDate.getTime())) && !reg.test(control.value)) {
                return { required: true };
            }
            const dateObject = this.dateService.toDate(control.value);
            if (dateObject && !this.dateService.isValid(dateObject) && control.value.length !== 0) {
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

    /**
     * To validate enrollment end date should be greater than effective starting date
     * @param control Form control to take the enrollment end date value
     * @returns ValidationErrors for currently called form-control
     */
    checkEnrollemtEndDate(control: FormControl): ValidationErrors | void {
        const ENROLLMENT_START_DATE_VAR = "enrollmentStartDate";
        if (control.value) {
            let date = new Date();
            const inputDate = this.dateService.toDate(control.value);
            if (this.editPlanYearForm && this.editPlanYearForm.controls[ENROLLMENT_START_DATE_VAR].value) {
                date = this.dateService.toDate(this.editPlanYearForm.controls[ENROLLMENT_START_DATE_VAR].value || "");
                this.checkForEnrollmentDates(date, inputDate, false);
            }
            if (!inputDate || isNaN(inputDate.getTime())) {
                return { requirement: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            if (inputDate < date) {
                return { invalidEndDate: true };
            }
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            if (inputDate < currentDate) {
                return { pastDate: true };
            }
            if (this.editPlanYearForm && this.editPlanYearForm.controls.enrollmentEndDate.value) {
                this.setEnrollmentDifferenceDays();
                this.isInvalidPCPlanYear = this.checkCarrierFifteenDaysValidation(control);
            }
        }
        return null;
    }

    /**
     * This method is used to validate coverage end date should be greater than effective starting date
     * @param control Form control to take the enrollment end date value
     * @returns ValidationErrors for currently called form-control
     */
    checkCoverageEndDate(control: FormControl): ValidationErrors | void {
        if (control.value) {
            let date = new Date();
            if (this.editPlanYearForm) {
                date = this.dateService.toDate(this.editPlanYearForm.controls["coverageStartDate"].value || "");
            }
            const inputDate = this.dateService.toDate(control.value);
            if (!inputDate) {
                return { requirement: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            if (inputDate < currentDate) {
                return { pastDate: true };
            }
            if (inputDate < date) {
                return { beforeCoverageStartDate: true };
            }
            return null;
        }
    }

    /**
     * This method will be called on input of date-filed
     * This method is used to check whether entered date is valid or not
     * @param event is date value
     * @param control is form control of selected date-picker
     */
    checkDateInput(event: Event, control: AbstractControl): void {
        if (event.target[DATE_VALUE]) {
            const inputDate = this.dateService.toDate(event.target[DATE_VALUE]);
            if (isNaN(inputDate.getTime())) {
                control.setErrors({ requirements: true });
            }
        }
    }

    /**
     * This method is used to validate coverage start date should be greater than
     * enrollment end date and less than coverage end date
     * This method will also check if the coverage start date is more than three months from enrollment start date
     * @param control Form control to take the enrollment end date value
     * @returns ValidationErrors for currently called form-control
     */
    checkCoverageStartDate(control: FormControl): ValidationErrors | void {
        if (control.value) {
            const date = new Date();
            let enrollmentEnddate;
            let errorType = null;
            if (this.editPlanYearForm) {
                enrollmentEnddate = this.dateService.toDate(this.editPlanYearForm.controls["enrollmentEndDate"].value);
                const oneDayFromEnrollmentEndDate = this.dateService.toDate(enrollmentEnddate);
                oneDayFromEnrollmentEndDate.setDate(oneDayFromEnrollmentEndDate.getDate() + ONE_DAY_YEAR);
                this.coverageMinDate = this.dateService.toDate(oneDayFromEnrollmentEndDate);
            }
            const inputStartDate = this.dateService.toDate(control.value);
            inputStartDate.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);
            if (inputStartDate < date) {
                errorType = { pastDate: true };
            }
            // checks if the coverage start date is 3 months more than the enrollment start date
            // if greater then it will help in opening the approval popup
            if (this.editPlanYearForm) {
                const threeMonthsFromEnrollmentStartDate = new Date(
                    this.dateService.getToDate(this.editPlanYearForm.controls["enrollmentStartDate"].value),
                );
                threeMonthsFromEnrollmentStartDate.setMonth(threeMonthsFromEnrollmentStartDate.getMonth() + THREE_MONTHS);
                threeMonthsFromEnrollmentStartDate.setDate(threeMonthsFromEnrollmentStartDate.getDate() - FIRST_DATE_OF_MONTH_ONE_DAY);
                this.approvalModelOpen = false;
                if (this.dateService.checkIsAfter(inputStartDate, threeMonthsFromEnrollmentStartDate)) {
                    if (!this.approveReceived) {
                        this.approvalModelOpen = true;
                    } else {
                        this.approvalModelOpen = false;
                    }
                }
            }
            const enteredInput = this.dateService.toDate(inputStartDate).getDate();
            if (DateInfo.LAST_DATES_OF_MONTH.includes(enteredInput)) {
                this.enteredDate = this.dateService.format(this.dateService.toDate(inputStartDate), DateFormats.MONTH_DAY_YEAR);
                errorType = { notAllowedDate: true };
            }
            if (
                errorType === null &&
                enrollmentEnddate &&
                this.dateService.getDifferenceInDays(inputStartDate, enrollmentEnddate.setHours(0, 0, 0, 0)) <
                    this.enrollmentDifferenceIndays
            ) {
                errorType = { minimumDays: true };
            }
            return errorType;
        }
    }

    closeForm(): void {
        this.dialogRef.close();
    }

    /**
     * check fifteen days validation for PC plans
     * @param control enrolment end date form control
     */
    checkCarrierFifteenDaysValidation(control: FormControl): boolean | undefined {
        if (
            this.editPlanYearForm.controls.coverageStartDate.disabled &&
            this.editPlanYearForm.controls.coverageStartDate.value &&
            this.nonAflacCarrierNames &&
            this.nonAflacCarrierNames.length
        ) {
            const inputEndDate = this.dateService.toDate(control.value || "");
            const coverageStartdate = this.dateService.toDate(this.editPlanYearForm.controls.coverageStartDate.value);
            return coverageStartdate && this.dateService.getDifferenceInDays(coverageStartdate, inputEndDate) < DAY_DIFF_NON_AFLAC;
        }
        return undefined;
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
                    this.saveForm();
                } else {
                    this.approveReceived = false;
                    this.approvalModelOpen = true;
                }
            });
    }

    /**
     * Save the form details
     * @returns void
     */
    saveForm(): void {
        if (this.editPlanYearForm.dirty && this.editPlanYearForm.valid && !this.isInvalidPCPlanYear) {
            // this will open the popup Coverage Start date - OE Start date > 90 days and do not open if the approval is received
            if (this.approvalModelOpen && !this.approveReceived) {
                this.displayDialog();
                return;
            }
            const planYear = this.constructPlanYearPayload();
            if (!this.data.planYear.planYearDetails.enrollmentPeriod.guaranteedIssueExpiresAfter) {
                delete planYear.enrollmentPeriod.guaranteedIssueEffectiveStarting;
                delete planYear.enrollmentPeriod.guaranteedIssueExpiresAfter;
            }
            if (this.benefitsOfferingHelperService.checkForPlanYearNameValidation(planYear.name)) {
                this.error = true;
                this.fieldErrorMessage =
                    this.languageSecondStringsArray["secondary.portal.benefitsOffering.coveragedates.planYearNameValidation"];
                return;
            }
            this.benefitsOfferingService
                .updatePlanYear(planYear, this.data.mpGroup, this.data.planYear.planYearDetails.id)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    () => {
                        this.benefitsOfferingService
                            .submitApprovalRequest(this.data.mpGroup, false)
                            .pipe(takeUntil(this.unsubscribe$))
                            .subscribe(
                                () => {
                                    this.dialogRef.close("save");
                                },
                                () => {
                                    this.dialogRef.close("save");
                                },
                            );
                    },
                    (errorResp) => {
                        this.error = true;
                        if (errorResp.status === AppSettings.API_RESP_400 && errorResp.error.code === AppSettings.BADPARAMETER) {
                            if (errorResp.error.details) {
                                for (const detail of errorResp.error["details"]) {
                                    this.fieldErrorMessage = this.language.fetchSecondaryLanguageValue(
                                        `secondary.portal.benefitsOffering.${errorResp.error.status}.${detail.code}.${detail.field}`,
                                    );
                                }
                            } else if (errorResp.error.message) {
                                this.fieldErrorMessage = errorResp.error.message.split("[")[0];
                            }
                        } else if (errorResp.status === AppSettings.API_RESP_409 && errorResp.error.code === AppSettings.DUPLICATE) {
                            this.fieldErrorMessage = this.languageSecondStringsArray["secondary.portal.benefitsOffering.duplicatePlanYear"];
                        } else if (
                            errorResp.status === ClientErrorResponseCode.RESP_409 &&
                            errorResp.error.code === ClientErrorResponseType.LOCKED
                        ) {
                            this.fieldErrorMessage =
                                this.languageStrings["primary.portal.dashboard.unpluggedAccount.checkedOutToUnplugged"];
                        }
                        if (!this.fieldErrorMessage) {
                            this.fieldErrorMessage = this.language.fetchSecondaryLanguageValue(
                                "secondary.api." + errorResp.error.status + "." + errorResp.error.code,
                            );
                        }
                    },
                );
        }
    }

    /**
     * This method is used to construct payload for update plan year API call
     * @returns a payload of type PlanYear
     */
    constructPlanYearPayload(): PlanYear {
        const enrollmentPeriod: EnrollmentPeriod = {
            effectiveStarting: this.datepipe.transform(
                this.dateService.toDate(this.editPlanYearForm.controls.enrollmentStartDate.value || ""),
                DateFormats.YEAR_MONTH_DAY,
            ),
            expiresAfter: this.datepipe.transform(
                this.dateService.toDate(this.editPlanYearForm.controls.enrollmentEndDate.value || ""),
                DateFormats.YEAR_MONTH_DAY,
            ),
            guaranteedIssueEffectiveStarting:
                this.isGIEnrollmentDatesOn && this.isQ60 && this.editPlanYearForm.controls.giEnrollmentStartDate.value
                    ? this.dateService.format(
                          this.dateService.toDate(this.editPlanYearForm.controls.giEnrollmentStartDate.value),
                          DateFormats.YEAR_MONTH_DAY,
                      )
                    : null,
            guaranteedIssueExpiresAfter:
                this.isGIEnrollmentDatesOn && this.isQ60 && this.editPlanYearForm.controls.giEnrollmentEndDate.value
                    ? this.dateService.format(
                          this.dateService.toDate(this.editPlanYearForm.controls.giEnrollmentEndDate.value),
                          DateFormats.YEAR_MONTH_DAY,
                      )
                    : null,
        };
        const coveragePeriod: CoveragePeriod = {
            effectiveStarting: this.datepipe.transform(
                this.dateService.toDate(this.editPlanYearForm.controls.coverageStartDate.value || ""),
                DateFormats.YEAR_MONTH_DAY,
            ),
            expiresAfter: this.datepipe.transform(
                this.dateService.toDate(this.editPlanYearForm.controls.coverageEndDate.value || ""),
                DateFormats.YEAR_MONTH_DAY,
            ),
        };
        return {
            id: this.data.planYear.planYearDetails.id,
            name: this.editPlanYearForm.controls.name.value,
            coveragePeriod: coveragePeriod,
            enrollmentPeriod: enrollmentPeriod,
            type: PlanYearType.AFLAC_INDIVIDUAL,
        };
    }

    /**
     * Function will populate the dropdown of dates with 1st of month
     * @param isEdit check for change of coverage start date
     * @param date Based on date populate the date dropdown to have the difference of enrollment end date and coverage start date
     */
    populateCoverageEndDate(isEdit: boolean, date: Date = new Date()): void {
        this.dateArray = [];
        let indexToPopulate = 0;
        const COVERAGE_START_DATE_VAR = "coverageStartDate";
        for (let index = 0; index < this.dropDownForNextMonth; index++) {
            this.dateArray.push(
                this.dateService.getFormattedFirstOfMonths(this.dateService.toDate(date), index + ONE_DAY_YEAR, DateFormats.MONTH_DAY_YEAR),
            );
        }
        if (this.editPlanYearForm) {
            const enrollmentEndDate = this.dateService.toDate(this.editPlanYearForm.controls.enrollmentEndDate.value || "");
            const isCoverageDate = this.dateArray.filter((dateStr) => {
                const dateItem = this.dateService.toDate(dateStr);
                return this.dateService.getDifferenceInDays(dateItem, enrollmentEndDate) > 1;
            });
            if (isCoverageDate.length === 0) {
                this.editPlanYearForm.get(COVERAGE_START_DATE_VAR).setErrors({ minimumDays: false });
                this.editPlanYearForm.updateValueAndValidity();
            }
        }
        if (this.data.planYear.planYearDetails && this.data.planYear.planYearDetails.coveragePeriod.effectiveStarting) {
            const indexToFind = this.dateArray.findIndex(
                (dateString) =>
                    dateString ===
                    this.datepipe.transform(
                        this.dateService.toDate(this.data.planYear.planYearDetails.coveragePeriod.effectiveStarting || ""),
                        DateFormats.MONTH_DAY_YEAR,
                    ),
            );
            indexToPopulate = indexToFind !== -1 ? indexToFind : 0;
        }
        this.editPlanYearForm.get(COVERAGE_START_DATE_VAR).patchValue(this.dateArray[indexToPopulate]);
        this.editPlanYearForm.get(COVERAGE_START_DATE_VAR).markAsTouched();
        this.populateEndDate(this.dateArray[indexToPopulate], isEdit);
    }

    /**
     * This function will be responsible for populating the end date with 1 year of ahead of start date
     * @param startDate take the start date of coverage
     * @param isEdit check for change of coverage start date
     * @param event Mat-select change attribute passed through whenever the mat select dropdown gets changes
     */
    populateEndDate(startDate: string, isEdit: boolean, event?: MatSelectChange): void {
        if (isEdit) {
            const COVERAGE_END_DATE_VAR = "coverageEndDate";
            if ((startDate && !event) || (event && event.source && event.source.selected && startDate)) {
                const inputStartDate = this.dateService.getOneDayLessThanYear(this.dateService.toDate(startDate || ""));
                this.editPlanYearForm.get(COVERAGE_END_DATE_VAR).patchValue(inputStartDate);
                this.editPlanYearForm.get(COVERAGE_END_DATE_VAR).disable();
                if (this.isRole20User) {
                    this.editPlanYearForm.get(COVERAGE_END_DATE_VAR).enable();
                }
            }
        }
    }

    /**
     * This function populates the coverage end date for edit plan
     * @param isEdit check for change of coverage start date
     * @param date to populate the coverage dates based on this value
     */
    populateCoverageEndDateForEditPlan(isEdit: boolean, date: Date = new Date()): void {
        if (this.formLoaded) {
            date = this.editPlanYearForm.controls.enrollmentEndDate.value
                ? this.dateService.toDate(this.editPlanYearForm.controls.enrollmentEndDate.value)
                : this.dateService.toDate(date);
            let coverageStartDate: Date = this.dateService.toDate(date);
            coverageStartDate.setDate(coverageStartDate.getDate() + DAY_DIFF_AFLAC);
            // if date falls under last dates of month then coverageStartDate is set to 1st of next month
            if (DateInfo.LAST_DATES_OF_MONTH.includes(coverageStartDate.getDate())) {
                coverageStartDate = this.dateService.getFirstOfNextMonth(this.dateService.toDate(coverageStartDate || ""));
            }
            const coverageStartDateControl: AbstractControl = this.editPlanYearForm.controls.coverageStartDate;
            coverageStartDateControl.patchValue(coverageStartDate);
            this.populateEndDate(this.editPlanYearForm.controls.coverageStartDate.value, isEdit);
        }
    }
    /**
     * condition to set coverage date for only VAS plans
     * @param sameDate boolean value to check coverage date for non aflac plans
     */
    checkForEnrollmentDates(startDate: Date, endDate: Date, isStartDate: boolean): void {
        if (startDate < endDate && !isStartDate) {
            this.editPlanYearForm.controls.enrollmentStartDate.setErrors(null);
        }
        if (startDate < endDate && isStartDate) {
            this.editPlanYearForm.controls.enrollmentEndDate.setErrors(null);
        }
    }
    /**
     * check validation for enrollment start date
     * @param control enrollment start date control
     * @returns ValidationErrors for the control
     */
    checkEnrollmentStartDate(control: FormControl): ValidationErrors {
        if (control.value) {
            let date = new Date();
            const inputDate = this.dateService.toDate(control.value);
            if (this.editPlanYearForm && this.editPlanYearForm.controls.enrollmentEndDate.value) {
                date = this.dateService.toDate(this.editPlanYearForm.controls.enrollmentEndDate.value);
                this.checkForEnrollmentDates(inputDate, date, true);
            }
            if (!inputDate || isNaN(inputDate.getTime())) {
                return { requirement: true };
            }
            date.setHours(0, 0, 0, 0);
            inputDate.setHours(0, 0, 0, 0);
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            if (inputDate < currentDate) {
                return { pastDate: true };
            }
            if (inputDate > date && this.editPlanYearForm && this.editPlanYearForm.controls.enrollmentEndDate.value) {
                return { invalidStartDate: true };
            }
        }
        return null;
    }
    /**
     * func checkGIEnrollmentDate() The below method validates the end date with current date and start date
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
            const enrollmentExpiryDate = this.dateService.toDate(this.editPlanYearForm?.controls?.enrollmentEndDate?.value);
            const guaranteedIssueStartDate = this.dateService.toDate(this.editPlanYearForm?.controls?.giEnrollmentStartDate?.value);
            const diffInDays = Math.abs(this.dateService.getDifferenceInDays(guaranteedIssueStartDate, inputDate));
            this.giMaxDiffStartDate = this.benefitsOfferingHelperService.disableGIEnrollmentEndDate(
                guaranteedIssueStartDate,
                GI_MAX_ENROLL_PERIOD_IN_DAYS,
            );
            this.giEnrollEndDateDisable = this.giMaxDiffStartDate >= enrollmentExpiryDate;
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            if (inputDate < currentDate) {
                return { pastDate: true };
            }
            if (!this.dateService.isValid(enrollmentExpiryDate) && inputDate >= currentDate) {
                return { enterEnrollmentDate: true };
            }
            if (inputDate > enrollmentExpiryDate && diffInDays < DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS) {
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
     * onDatesUpdated() function validates and disable of the GI enrollment end date, onchange of enrollment end date.
     */
    onDatesUpdated(): void {
        if (!this.isGIEnrollmentDatesOn || !this.isQ60) {
            // config indicator flag is able to toggle on / toggle off for may release.
            return;
        }
        const minDate = this.dateService.toDate(this.editPlanYearForm.controls.enrollmentEndDate.value);
        const guaranteedIssueStartDate = this.dateService.toDate(this.editPlanYearForm.controls.giEnrollmentStartDate.value);
        this.giMaxDiffStartDate = this.benefitsOfferingHelperService.disableGIEnrollmentEndDate(
            guaranteedIssueStartDate,
            GI_MAX_ENROLL_PERIOD_IN_DAYS,
        );
        this.giEnrollEndDateDisable = this.giMaxDiffStartDate > minDate;
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
        const oeStartDate = this.dateService.toDate(this.editPlanYearForm.controls.enrollmentStartDate.value || "");
        const oeEndDate = this.dateService.toDate(this.editPlanYearForm.controls.enrollmentEndDate.value || "");
        const giEnrollEndDate = this.dateService.addDays(this.dateService.toDate(oeStartDate), DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS);
        this.giMinDiffStartDate = this.benefitsOfferingHelperService.disableGIEnrollmentEndDate(
            oeStartDate,
            DateInfo.GI_MIN_ENROLL_PERIOD_IN_DAYS,
        );
        this.giMaxDiffStartDate = this.benefitsOfferingHelperService.disableGIEnrollmentEndDate(
            oeStartDate,
            DateInfo.GI_MAX_ENROLL_PERIOD_IN_DAYS,
        );
        this.editPlanYearForm.controls.giEnrollmentStartDate.patchValue(oeStartDate);
        this.editPlanYearForm.controls.giEnrollmentEndDate.patchValue(giEnrollEndDate);
        if (oeEndDate && this.dateService.checkIsAfter(giEnrollEndDate, oeEndDate)) {
            this.editPlanYearForm.controls.giEnrollmentEndDate.patchValue(oeEndDate);
        }
    }

    /**
     * sets form loaded as true after view initialized
     */
    ngAfterViewInit(): void {
        this.formLoaded = true;
    }
    /**
     * ng life cycle hook
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
