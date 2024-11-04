import { DatePipe } from "@angular/common";
import { Component, Inject, OnDestroy, OnInit, HostListener, ViewChild, ElementRef } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Configuration, MemberService, SalaryType, HideReadOnlyElementSetting } from "@empowered/api";
import { Select } from "@ngxs/store";
import { Observable, Subscription, Subject, combineLatest } from "rxjs";
import { LanguageService } from "@empowered/language";
import { takeUntil } from "rxjs/operators";
import { ClientErrorResponseCode, DateFormats, ConfigName, AppSettings, Salary } from "@empowered/constants";
import { Member, MemberInfoState, SharedState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

const MAX_ALLOWED_START_DATE_FROM_TODAY = 90;
export interface PresentFutureDates {
    effectiveStarting?: Date;
    expiresAfter?: Date;
    id?: number;
}
export interface DialogData {
    salary: number;
    title: string;
    fieldType: string;
    editRowData: Salary;
    allSalaries: Salary[];
    type: "ACTUAL" | "BENEFIT";
    action: string;
}

export interface InterfaceHourly {
    type: string;
    value: any;
}

const DIGITS_AFTER_DECIMAL_POINT = 2;

@Component({
    selector: "empowered-work-salary-popup",
    templateUrl: "./work-salary-popup.component.html",
    styleUrls: ["./work-salary-popup.component.scss"],
    providers: [DatePipe],
})
export class WorkSalaryPopupComponent implements OnInit, OnDestroy {
    @ViewChild("endDate") endDate: ElementRef;
    state: Member;
    memberId: number;
    mpGroupId: string;
    createSalarySubscriber: Subscription;
    updateSalarySubscriber: Subscription;
    regExSubscriber: Subscription;
    @Select(MemberInfoState) memberState$: Observable<Member>;
    configurations: Configuration[];

    salaryPopUpForm: FormGroup;
    selectedType: string;
    hireDate: string | Date;
    annualFieldFlag = false;
    hourlyFieldFlag = false;
    maskingFlag = false;
    salaryBody: Salary;
    salaryPopUpControls: any;
    addConstant = "Add";
    editConstant = "Edit";
    REQUIRED = "required";
    HIDDEN = "hidden";
    READONLY = "readonly";
    annualSalaryMin: number;
    annualSalaryMax: number;
    hoursPerYearMin = 520;
    hoursPerYearMax = 5148;
    differenceInDaysWhenEndDateIsLessThenStartDate: string;
    endDateLessThenStartDate = false;
    datesAreSame = false;
    isLoading = false;
    languageStrings = {
        actualSalary: this.language.fetchPrimaryLanguageValue("primary.portal.members.workLabel.actualSalary"),
        addSalary: this.language.fetchPrimaryLanguageValue("primary.portal.members.workLabel.addSalary"),
        addBenefitSalary: this.language.fetchPrimaryLanguageValue("primary.portal.members.workLabel.addBenefitSalary"),
        select: this.language.fetchPrimaryLanguageValue("primary.portal.common.select"),
    };

    hideFieldElementSetting: HideReadOnlyElementSetting = {
        type: true,
        annualSalary: true,
        hourlyWage: true,
        hoursPerYear: true,
        effectiveStarting: true,
        expiresAfter: true,
    };

    readOnlyFieldElementSetting: HideReadOnlyElementSetting = {
        type: false,
        annualSalary: false,
        hourlyWage: false,
        hoursPerYear: false,
        effectiveStarting: false,
        expiresAfter: false,
    };
    EFFECTIVE_STARTING_DATE = "effectiveStarting";
    EXPIRES_AFTER = "expiresAfter";
    ERROR = "error";
    BADPARAMETER = "badParameter";
    DETAILS = "details";
    FIELD = "field";
    showErrorMessage: boolean;
    errorMessageArray = [];
    errorMessage: string;
    isSalaryOutOfRange: boolean;
    hoursPerYear: number;

    ANNUAL = "ANNUAL";
    HOURLY = "HOURLY";
    actualSalary = "ACTUAL";
    benefitSalary = "BENEFIT";
    notificationOngoingOverlap: boolean;
    newDateToBeUpdated: string;
    updatedMessage: string;
    requiredFields = [];
    actualSalArr = [];
    benefitSalArr = [];
    langStrings = {};
    salaryIsOverlappingActualErrorMessage: string;
    salaryIsOverlappingActualFlag: boolean;
    salaryIsOverlappingBenefitErrorMessage: string;
    salaryIsOverlappingBenefitFlag: boolean;
    isDateInvalid = false;
    validationRegex: any;
    @Select(SharedState.regex) regex$: Observable<any>;
    SALARY_ACTION_EDIT = "edit";
    hoursPerWeekMinConfig: number;
    hoursPerWeekMaxConfig: number;
    weeksPerYearMinConfig: number;
    weeksPerYearMaxConfig: number;
    hourlyRateMinConfig: number;
    hourlyRateMaxConfig: number;
    HOURS_PER_WEEK_MIN_CONFIG_KEY = "general.data.hours_per_week.min";
    HOURS_PER_WEEK_MAX_CONFIG_KEY = "general.data.hours_per_week.max";
    hoursPerWeekMoreThanMaxErrorMsg: string;
    hoursPerWeekMoreThanMinErrorMsg: string;
    hourlyRateMoreThanMinErrorMsg: string;
    hourlyRateMoreThanMaxErrorMsg: string;
    weeksPerYearMoreThanMinErrorMsg: string;
    weeksPerYearMoreThanMaxErrorMsg: string;
    youngerEmployeeHoursPerYearErr: string;
    youngerEmployeeHoursPerYearErrFlag: boolean;
    maxDate: string;
    isMaxDate: boolean;
    todaysDate = new Date();
    private readonly unsubscribe$ = new Subject<void>();
    private secondaryLanguageStrings: Record<string, string>;
    readonly ELIGIBLE_EMPLOYEE_AGE = 18;
    readonly TOTAL_HRS_FOR_YOUNGER_EMP = 1508;
    readonly PRECISION_POINT_LENGTH = 2;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly dialogRef: MatDialogRef<WorkSalaryPopupComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        private readonly memberService: MemberService,
        private readonly datePipe: DatePipe,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        private readonly staticUtilService: StaticUtilService,
        private readonly dateService: DateService,
    ) {}

    getLanguageStrings(): void {
        this.langStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.members.workLabel.amount",
            "primary.portal.members.workLabel.amountPerHour",
            "primary.portal.members.workLabel.hoursPerYear",
            "primary.portal.members.workLabel.startDate",
            "primary.portal.members.workLabel.endDate",
            "primary.portal.common.close",
            "primary.portal.quickQuote.hourlyrate",
            "primary.portal.members.workLabel.hoursPerWeek",
            "primary.portal.common.weeksperyear",
            "primary.portal.members.workLabel.compensation",
            "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.invalidFutureDate",
        ]);
    }
    ngOnInit(): void {
        this.fetchSecondaryLanguages();
        this.getAnnualSalaryConfigValue();
        this.regExSubscriber = this.regex$.subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });
        this.notificationOngoingOverlap = false;
        this.newDateToBeUpdated = "";
        this.maxDate = this.datePipe.transform(this.todaysDate, DateFormats.YEAR_MONTH_DAY);
        this.initializeWorkForm();
        this.getStateManagement();
        this.getLanguageStrings();
        this.setSalaryArrays();
        this.isDateInvalid = true;
        this.salaryPopUpForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => {
            this.updateSalaryTypeSelection();
        });
        this.getHoursPerWeekConfiguration();
        this.getWeeksPerYearConfiguration();
        this.getHourlyRateConfiguration();
        this.calculateHourlyCompensation();
    }

    setSalaryArrays(): void {
        this.actualSalArr = [];
        this.benefitSalArr = [];
        for (const salType of this.data.allSalaries) {
            if (salType.type === this.actualSalary) {
                this.actualSalArr.push(salType);
            } else if (salType.type === this.benefitSalary) {
                this.benefitSalArr.push(salType);
            }
        }
    }

    getStateManagement(): void {
        this.memberState$.pipe(takeUntil(this.unsubscribe$)).subscribe((state: Member) => {
            this.state = { ...state };
        });
        this.configurations = this.state.configurations;
        this.memberId = this.state.activeMemberId;
        this.mpGroupId = this.state.mpGroupId;
        this.hireDate = this.state.memberInfo.workInformation.hireDate;
        if (this.configurations && this.state.configurations.payload && this.salaryPopUpForm) {
            this.settingValidations(this.salaryPopUpForm);
        }
    }

    /**
     *This function is used to initialize salary-popup form
     * @returns void
     */
    initializeWorkForm(): void {
        const salaryHours = isNaN(this.data.salary) ? 0 : this.data.salary;
        if (this.data.editRowData === undefined) {
            this.salaryPopUpForm = this.formBuilder.group({
                salaryData: this.formBuilder.group(
                    {
                        type: [""],
                        annualSalary: [
                            "",
                            [
                                Validators.min(this.annualSalaryMin),
                                Validators.max(this.annualSalaryMax),
                                Validators.pattern(this.validationRegex.ANNUAL_SALARY),
                            ],
                        ],
                        hourlyRate: [""],
                        hoursPerWeek: [salaryHours],
                        weekPerYear: [{ value: "", disabled: true }],
                        compensationHourly: [{ value: "", disabled: true }],
                        effectiveStarting: ["", { updateOn: "change" }],
                        expiresAfter: [""],
                    },
                    { updateOn: "blur" },
                ),
            });
        } else {
            this.data.editRowData.annualSalary = this.data.editRowData.annualSalary
                ? parseFloat(this.data.editRowData.annualSalary).toFixed(this.PRECISION_POINT_LENGTH).toString()
                : "";
            this.data.editRowData.hourlyWage = this.data.editRowData.hourlyWage
                ? parseFloat(this.data.editRowData.hourlyWage).toFixed(this.PRECISION_POINT_LENGTH).toString()
                : "";
            this.salaryPopUpForm = this.formBuilder.group({
                salaryData: this.formBuilder.group(
                    {
                        type: [this.data.editRowData.type],
                        annualSalary: [
                            this.data.editRowData.annualSalary,
                            [Validators.min(this.annualSalaryMin), Validators.max(this.annualSalaryMax)],
                        ],
                        hourlyRate: [this.data.editRowData.hourlyWage],
                        hoursPerWeek: [salaryHours],
                        weekPerYear: [{ value: "", disabled: true }],
                        compensationHourly: [{ value: this.data.editRowData.annualSalary, disabled: true }],
                        effectiveStarting: [this.data.editRowData.validity.effectiveStarting, { updateOn: "change" }],
                        expiresAfter: [this.data.editRowData.validity.expiresAfter],
                    },
                    { updateOn: "blur" },
                ),
            });
            if (this.data.editRowData.hourlyWage && this.data.editRowData.hourlyWage !== "NaN") {
                this.hourlyFieldFlag = true;
                this.selectedType = SalaryType.HOURLY;
            } else {
                this.annualFieldFlag = true;
                this.selectedType = SalaryType.ANNUAL;
            }
            this.salaryPopUpForm.setErrors(null);
        }
        this.salaryPopUpControls = this.salaryPopUpForm.controls;
    }

    settingValidations(formGroup: FormGroup): void {
        this.state.configurations.payload.work.forEach((element) => {
            Object.keys(formGroup.controls).forEach((field) => {
                const control = formGroup.get(field);
                for (const subField in control["controls"]) {
                    if (
                        subField &&
                        element.name.split(".").pop() === subField &&
                        element.value === this.REQUIRED &&
                        !control["controls"][subField].errors
                    ) {
                        this.getValidationValueForKey(subField, this.REQUIRED);
                        if (control["controls"][subField].validator) {
                            control["controls"][subField].setValidators([Validators.required, control["controls"][subField].validator]);
                        } else {
                            control["controls"][subField].setValidators([Validators.required]);
                        }
                        control["controls"][subField].updateValueAndValidity();
                    }
                }
            });
        });
        this.getReadOnlyHiddenValidation(this.salaryPopUpForm);
    }

    getReadOnlyHiddenValidation(salaryPopUpForm: FormGroup): void {
        Object.keys(salaryPopUpForm.controls).forEach((key) => {
            if (salaryPopUpForm.controls[key] instanceof FormGroup) {
                this.getReadOnlyHiddenValidation(salaryPopUpForm.controls[key] as FormGroup);
            } else if (this.getValidationValueForKey(key, this.HIDDEN)) {
                this.hideFieldElementSetting[key] = !this.getValidationValueForKey(key, this.HIDDEN);
            } else if (this.getValidationValueForKey(key, this.READONLY)) {
                this.readOnlyFieldElementSetting[key] = this.getValidationValueForKey(key, this.READONLY);
            }
        });
    }

    getValidationValueForKey(key: any, validationString: string): boolean {
        let flag = false;
        this.state.configurations.payload.work.forEach((element) => {
            if (
                element.name.substring(element.name.lastIndexOf(".") + 1, element.length).toLowerCase() === key.toLowerCase() &&
                element.value.toLowerCase() === validationString.toLowerCase()
            ) {
                flag = true;
                this.requiredFields.push(element);
            }
        });
        return flag;
    }

    validateMessage(formGroupName: string, fieldName: string): boolean | undefined {
        if (this.salaryPopUpControls) {
            let fieldNameControl: any;
            if (formGroupName) {
                fieldNameControl = this.salaryPopUpControls[formGroupName].get(fieldName);
            } else {
                fieldNameControl = this.salaryPopUpForm.get(fieldName);
            }
            return fieldNameControl.touched && fieldNameControl.errors && fieldNameControl.errors.required;
        }
        return undefined;
    }

    validateAllFormFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((field) => {
            const control = formGroup.get(field);
            if (control["controls"]) {
                for (const subField in control["controls"]) {
                    if (subField) {
                        control["controls"][subField].markAsTouched({ onlySelf: true });
                    }
                }
            } else {
                control.markAsTouched({ onlySelf: true });
            }
        });
    }

    /**
     *This function is used to validate end date in salary pop-up
     * Added as mat-datepicker does not validate the dates when user clicks
     * outside the box, this is require to call validation explicitly
     * @returns void
     */
    @HostListener("click")
    validateEndDateChange(): void {
        let dateInput = "";
        if (this.endDate) {
            dateInput = this.endDate.nativeElement.value;
        }
        this.datesAreSame = false;
        const expiresAfter = this.salaryPopUpForm.controls.salaryData.get("expiresAfter");
        const effectiveStarting = this.salaryPopUpForm.controls.salaryData.get("effectiveStarting");
        const hireDate = this.dateService.toDate(this.datePipe.transform(this.hireDate, DateFormats.YEAR_MONTH_DAY));
        const startDate = this.dateService.toDate(this.datePipe.transform(effectiveStarting.value, DateFormats.YEAR_MONTH_DAY));
        let today = this.dateService.toDate(this.datePipe.transform(new Date(), DateFormats.YEAR_MONTH_DAY));
        today = this.dateService.toDate(
            this.datePipe.transform(today.setDate(today.getDate() + MAX_ALLOWED_START_DATE_FROM_TODAY), DateFormats.YEAR_MONTH_DAY),
        );
        const maxHireDate = this.dateService.toDate(this.datePipe.transform(today, DateFormats.YEAR_MONTH_DAY));
        if (startDate > maxHireDate) {
            effectiveStarting.setErrors({ maxDateFailed: true });
        } else if (hireDate > startDate) {
            effectiveStarting.setErrors({ invalidDate: true });
        } else if (startDate && dateInput && dateInput !== null) {
            expiresAfter.setErrors(null);
            const endDate = this.dateService.toDate(this.datePipe.transform(dateInput, DateFormats.YEAR_MONTH_DAY));
            this.differenceInDaysWhenEndDateIsLessThenStartDate = "";
            this.endDateLessThenStartDate = false;
            if (endDate < startDate && expiresAfter) {
                this.endDateLessThenStartDate = true;
                expiresAfter.setErrors({ incorrect: true });
            } else if (endDate > startDate) {
                this.endDateLessThenStartDate = false;
                expiresAfter.setErrors(null);
            } else {
                this.datesAreSame = true;
                expiresAfter.setErrors({ incorrect: true });
            }
        }
        if (!effectiveStarting.value) {
            this.salaryIsOverlappingActualFlag = false;
            this.salaryIsOverlappingBenefitFlag = false;
        }
        if (!dateInput) {
            expiresAfter.setErrors(null);
        }
        this.validateOverlappingSalaries();
        this.validateIfOverlapError(this.data.type);
    }

    get formControls(): Record<string, unknown> {
        return this.salaryPopUpForm.controls;
    }

    updateSalaryTypeSelection(): void {
        this.notificationOngoingOverlap = false;
        this.newDateToBeUpdated = "";
        if (this.selectedType === undefined) {
            this.annualFieldFlag = this.hourlyFieldFlag = false;
        } else if (this.selectedType === this.ANNUAL) {
            this.annualFieldFlag = true;
            this.hourlyFieldFlag = !this.annualFieldFlag;
            this.settingValidations(this.salaryPopUpForm);
            this.hourlyRateControl.setErrors(null);
            this.hoursPerWeekControl.setErrors(null);
            this.WeeksPerYearControl.setErrors(null);
            this.compensationHourlyControl.setErrors(null);
            this.isSalaryOutOfRange = false;
        } else if (this.selectedType === this.HOURLY) {
            this.hourlyFieldFlag = true;
            this.annualFieldFlag = !this.hourlyFieldFlag;
            this.settingValidations(this.salaryPopUpForm);
            this.salaryPopUpForm.controls.salaryData.get("annualSalary").setErrors(null);
            if (isNaN(this.hoursPerWeekControl.value)) {
                this.hoursPerWeekControl.setValue("");
            }
            this.calculateAnnualSalary();
        } else {
            this.annualFieldFlag = false;
            this.hourlyFieldFlag = false;
        }
    }

    /**
     * Function to validate form and save salary information
     * @param salaryFormData salay form value
     */
    onAddSalary(salaryFormData: FormData): void {
        this.validateIfOverlapError(this.data.type);
        if (this.salaryPopUpForm.valid && !this.isSalaryOutOfRange) {
            this.isLoading = true;
            const data = this.dateFormatter(salaryFormData);
            this.salaryBody = {
                type: this.data.type,
                validity: {
                    effectiveStarting: data.salaryData.effectiveStarting,
                    expiresAfter: data.salaryData.expiresAfter,
                },
            };
            if (this.selectedType === this.ANNUAL) {
                this.salaryBody.annualSalary = data.salaryData.annualSalary;
            } else if (this.selectedType === this.HOURLY) {
                this.setHourlySalary();
            }
            Object.keys(this.salaryBody).forEach((key) => {
                if (!this.salaryBody[key]) {
                    this.salaryBody[key] = key === "hoursPerYear" ? 0 : null;
                }
            });
            if (this.data.editRowData === undefined) {
                this.createSalary(this.salaryBody, this.memberId);
            } else {
                this.updateSalary(this.data.editRowData.id, this.memberId, this.salaryBody);
            }
            this.salaryBody.manage = false;
        }
    }

    /**
     * Function to set hourly salary value
     */
    setHourlySalary(): void {
        this.salaryBody.annualSalary = this.compensationHourlyControl.value;
        this.salaryBody.hourlyWage = this.hourlyRateControl.value;
        this.salaryBody.hoursPerYear = parseFloat(this.WeeksPerYearControl.value) * parseFloat(this.hoursPerWeekControl.value);
        if (this.compensationHourlyControl.value < this.annualSalaryMin || this.compensationHourlyControl.value > this.annualSalaryMax) {
            this.compensationHourlyControl.setErrors({ incorrect: true });
            this.salaryPopUpForm.updateValueAndValidity();
        }
    }

    dateFormatter(salaryFormData: any): any {
        salaryFormData.salaryData.effectiveStarting = this.datePipe.transform(
            salaryFormData.salaryData.effectiveStarting,
            AppSettings.DATE_FORMAT,
        );
        salaryFormData.salaryData.expiresAfter = this.datePipe.transform(salaryFormData.salaryData.expiresAfter, AppSettings.DATE_FORMAT);
        return salaryFormData;
    }

    /**
     * Function to call API to save salary information
     * @param salaryBody Salary information
     * @param memberId Member Id
     */
    createSalary(salaryBody: Salary, memberId: number): void {
        if (this.salaryPopUpForm.valid) {
            this.createSalarySubscriber = this.memberService.createSalary(memberId, salaryBody, this.mpGroupId).subscribe(
                (Response) => {
                    if (Response.status === AppSettings.API_RESP_201) {
                        const salaryId = Response.headers
                            .get(AppSettings.API_RESP_HEADER_LOCATION)
                            .substring(Response.headers.get(AppSettings.API_RESP_HEADER_LOCATION).lastIndexOf("/") + 1);
                        this.salaryBody["id"] = salaryId;
                        this.dialogRef.close({ data: this.salaryBody, for: this.addConstant });
                        this.createSalarySubscriber.unsubscribe();
                    }
                },
                (error) => {
                    this.showErrorAlertMessage(error);
                },
            );
        } else {
            this.isLoading = false;
            this.settingValidations(this.salaryPopUpForm);
        }
    }

    /**
     * Function to call API to update salary information
     * @param salaryId Salary Id to be updated
     * @param memberId member Id
     * @param salaryBody Salary information
     */
    updateSalary(salaryId: number, memberId: number, salaryBody: Salary): void {
        if (this.salaryPopUpForm.valid) {
            salaryBody["id"] = salaryId;
            this.updateSalarySubscriber = this.memberService.updateSalary(memberId, salaryBody, this.mpGroupId).subscribe(
                (Response) => {
                    if (Response.status === AppSettings.API_RESP_204) {
                        this.dialogRef.close({ data: this.salaryBody, for: this.editConstant });
                        this.updateSalarySubscriber.unsubscribe();
                    }
                },
                (error) => {
                    this.showErrorAlertMessage(error);
                },
            );
        } else {
            this.isLoading = false;
            this.settingValidations(this.salaryPopUpForm);
        }
    }

    onCancelClick(): void {
        this.dialogRef.close();
    }

    ngOnDestroy(): void {
        if (this.createSalarySubscriber) {
            this.createSalarySubscriber.unsubscribe();
        }
        if (this.updateSalarySubscriber) {
            this.updateSalarySubscriber.unsubscribe();
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    /**
     * Function to display error message received from api
     * @param err: Error - the error response from api
     */
    showErrorAlertMessage(err: Error): void {
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS].length > 0) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.members.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
        this.showErrorMessage = true;
        this.isLoading = false;
    }

    /**
     * Function to display warning message in add/edit salary popup and to validate overlapping salaries
     *  @returns void
     */
    validateOverlappingSalaries(): void {
        if (
            this.actualSalArr.length > 0 &&
            !this.data.editRowData &&
            // When adding salary and has salary entry for actual salary
            this.data.type === this.actualSalary
        ) {
            for (const sal of this.actualSalArr) {
                if (
                    !sal.validity.expiresAfter &&
                    sal.ongoing &&
                    // When previous salary is ongoing and do not have salary end date
                    this.dateService.checkIsAfter(
                        this.dateService.toDate(this.salaryPopUpForm.value.salaryData.effectiveStarting),
                        this.dateService.toDate(sal.validity.effectiveStarting),
                    )
                ) {
                    if (this.salaryPopUpForm.value.salaryData.effectiveStarting <= this.todaysDate) {
                        this.notificationOngoingOverlap = true;
                    }
                    const date = this.dateService.toDate(this.salaryPopUpForm.value.salaryData.effectiveStarting);
                    this.newDateToBeUpdated = this.datePipe.transform(date.setDate(date.getDate() - 1), AppSettings.DATE_FORMAT);
                    const dataToPass = {
                        "##DATE##": this.newDateToBeUpdated,
                    };
                    const tagFromLanguage =
                        this.secondaryLanguageStrings["secondary.portal.members.workValidationMsg.dateOverlapBenefitSalary"];
                    this.updatedMessage = this.memberService.getUpdatedLanguageValue(tagFromLanguage, dataToPass);
                }
            }
        } else if (
            this.benefitSalArr.length > 0 &&
            !this.data.editRowData &&
            // When adding salary and has salary entry for benefit salary
            this.data.type === this.benefitSalary
        ) {
            for (const sal of this.benefitSalArr) {
                if (
                    !sal.validity.expiresAfter &&
                    sal.ongoing &&
                    // When previous salary is ongoing and do not have salary end date
                    this.dateService.toDate(this.salaryPopUpForm.value.salaryData.effectiveStarting) >
                        this.dateService.toDate(sal.validity.effectiveStarting)
                ) {
                    const date = this.dateService.toDate(this.salaryPopUpForm.value.salaryData.effectiveStarting);
                    if (this.salaryPopUpForm.value.salaryData.effectiveStarting <= this.todaysDate) {
                        this.notificationOngoingOverlap = true;
                    }
                    this.newDateToBeUpdated = this.datePipe.transform(date.setDate(date.getDate() - 1), AppSettings.DATE_FORMAT);
                    const dataToPass = {
                        "##DATE##": this.newDateToBeUpdated,
                    };
                    const tagFromLanguage =
                        this.secondaryLanguageStrings["secondary.portal.members.workValidationMsg.dateOverlapBenefitSalary"];
                    this.updatedMessage = this.memberService.getUpdatedLanguageValue(tagFromLanguage, dataToPass);
                }
            }
        }
    }

    isRequiredField(control: string): boolean {
        let isRequired = false;
        const required = this.requiredFields.find((e) => e.name === `portal.member.form.work.${control}`);
        if (required) {
            isRequired = true;
        }
        return isRequired;
    }
    /**
     * @description for checking salary overlap errors
     * @param type string ACTUAL/BENEFIT
     * @returns void
     */
    // eslint-disable-next-line complexity
    validateIfOverlapError(type: string): void {
        if (this.salaryPopUpForm.value.salaryData.effectiveStarting || this.salaryPopUpForm.value.salaryData.expiresAfter) {
            const startDate = this.dateService.toDate(this.salaryPopUpForm.value.salaryData.effectiveStarting);
            const endDate = this.salaryPopUpForm.value.salaryData.expiresAfter
                ? this.dateService.toDate(this.salaryPopUpForm.value.salaryData.expiresAfter)
                : null;
            const currentDateObj = {
                effectiveStarting: startDate,
                expiresAfter: endDate ? endDate : null,
                id: this.data.editRowData ? this.data.editRowData.id : null,
            };
            let presentFuture = [];
            if (type === this.actualSalary) {
                for (const sal of this.actualSalArr) {
                    if (sal.validity.effectiveStarting && sal.validity.expiresAfter) {
                        const preExistingDates = {
                            effectiveStarting: this.dateService.toDate(sal.validity.effectiveStarting),
                            expiresAfter: this.dateService.toDate(sal.validity.expiresAfter),
                            id: sal.id,
                        };
                        if (preExistingDates !== currentDateObj) {
                            presentFuture.push(preExistingDates);
                        }
                    }
                }
            } else if (type === this.benefitSalary) {
                for (const sal of this.benefitSalArr) {
                    if (sal.validity.effectiveStarting && sal.validity.expiresAfter) {
                        const preExistingDates = {
                            effectiveStarting: this.dateService.toDate(sal.validity.effectiveStarting),
                            expiresAfter: this.dateService.toDate(sal.validity.expiresAfter),
                            id: sal.id,
                        };
                        if (preExistingDates !== currentDateObj) {
                            presentFuture.push(preExistingDates);
                        }
                    }
                }
            }
            if (this.data.action === this.SALARY_ACTION_EDIT) {
                presentFuture = presentFuture.filter(
                    (x) =>
                        (x.effectiveStarting.getTime() !== startDate.getTime() && x.id !== this.data.editRowData.id) ||
                        (x.expiresAfter !== endDate && x.id !== this.data.editRowData.id),
                );
            }
            if (startDate && endDate) {
                this.setSalaryOverlapOnUI(startDate, endDate, this.data.type, presentFuture);
            } else if (startDate && !endDate) {
                this.setStartDateOverlapOnUi(startDate, this.data.type, presentFuture);
            }
        }
    }

    /**
     * Method to check if start date is overlap between any date range defined before
     * @param startDate: Date
     * @param type:  string (ACTUAL / BENEFITS)
     * @param presentFuture:  Future date array of type PresentFutureDates
     * @return: none
     */
    setStartDateOverlapOnUi(startDate: Date, type: string, presentFuture: PresentFutureDates[]): void {
        this.salaryIsOverlappingActualErrorMessage = "";
        this.salaryIsOverlappingBenefitErrorMessage = "";
        this.salaryIsOverlappingActualFlag = false;
        this.salaryIsOverlappingBenefitFlag = false;
        for (const sals of presentFuture) {
            if (startDate >= sals.effectiveStarting && startDate <= sals.expiresAfter && type === this.actualSalary) {
                this.salaryIsOverlappingActualErrorMessage =
                    this.secondaryLanguageStrings["secondary.portal.members.work.dateOverlapActual"];
                this.salaryIsOverlappingActualFlag = true;
                this.salaryIsOverlappingBenefitFlag = false;
                if (this.notificationOngoingOverlap) {
                    this.updatedMessage = "";
                    this.notificationOngoingOverlap = false;
                }
                this.salaryPopUpForm.controls.salaryData.get("effectiveStarting").setErrors({ incorrect: true });
            } else if (startDate >= sals.effectiveStarting && startDate <= sals.expiresAfter && type === this.benefitSalary) {
                this.salaryIsOverlappingBenefitErrorMessage =
                    this.secondaryLanguageStrings["secondary.portal.members.work.dateOverlapBenefit"];
                this.salaryIsOverlappingActualFlag = false;
                this.salaryIsOverlappingBenefitFlag = true;
                if (this.notificationOngoingOverlap) {
                    this.updatedMessage = "";
                    this.notificationOngoingOverlap = false;
                }
                this.salaryPopUpForm.controls.salaryData.get("effectiveStarting").setErrors({ incorrect: true });
            }
        }
        this.salaryPopUpForm.updateValueAndValidity();
    }

    setSalaryOverlapOnUI(startDate: Date, endDate: Date, typeOfSal: string, presentFuture: any[]): void {
        this.salaryIsOverlappingActualErrorMessage = "";
        this.salaryIsOverlappingBenefitErrorMessage = "";
        this.salaryIsOverlappingActualFlag = false;
        this.salaryIsOverlappingBenefitFlag = false;
        for (const sals of presentFuture) {
            if (
                ((startDate >= sals.effectiveStarting && startDate < sals.expiresAfter) ||
                    this.datePipe.transform(startDate, AppSettings.DATE_FORMAT) ===
                        this.datePipe.transform(sals.effectiveStarting, AppSettings.DATE_FORMAT) ||
                    this.datePipe.transform(endDate, AppSettings.DATE_FORMAT) ===
                        this.datePipe.transform(sals.expiresAfter, AppSettings.DATE_FORMAT)) &&
                typeOfSal === this.actualSalary
            ) {
                this.salaryIsOverlappingActualErrorMessage =
                    this.secondaryLanguageStrings["secondary.portal.members.work.dateOverlapActual"];
                this.salaryIsOverlappingActualFlag = true;
                this.salaryIsOverlappingBenefitFlag = false;
                if (this.notificationOngoingOverlap) {
                    this.updatedMessage = "";
                    this.notificationOngoingOverlap = false;
                }
                this.salaryPopUpForm.controls.salaryData.get("effectiveStarting").setErrors({ incorrect: true });
            } else if (
                ((startDate >= sals.effectiveStarting && startDate < sals.expiresAfter) ||
                    this.datePipe.transform(startDate, AppSettings.DATE_FORMAT) ===
                        this.datePipe.transform(sals.effectiveStarting, AppSettings.DATE_FORMAT) ||
                    this.datePipe.transform(endDate, AppSettings.DATE_FORMAT) ===
                        this.datePipe.transform(sals.expiresAfter, AppSettings.DATE_FORMAT)) &&
                typeOfSal === this.benefitSalary
            ) {
                this.salaryIsOverlappingBenefitErrorMessage =
                    this.secondaryLanguageStrings["secondary.portal.members.work.dateOverlapBenefit"];
                this.salaryIsOverlappingActualFlag = false;
                this.salaryIsOverlappingBenefitFlag = true;
                if (this.notificationOngoingOverlap) {
                    this.updatedMessage = "";
                    this.notificationOngoingOverlap = false;
                }
                this.salaryPopUpForm.controls.salaryData.get("effectiveStarting").setErrors({ incorrect: true });
            }
        }
        this.salaryPopUpForm.updateValueAndValidity();
    }
    /**
     * @description for validating effective starting date and end date
     * @param control for getting the form control
     * @param form for getting the form
     * @param inputValue: string, the date value entered
     * @param iteration
     * @returns string: error messages
     */
    validateDate(control: string, form: string, inputValue: string, iteration?: string): string {
        const inputDate = this.dateService.toDate(this.datePipe.transform(inputValue, DateFormats.YEAR_MONTH_DAY));
        if (
            (this.salaryPopUpForm.controls.salaryData.get(control).value === null ||
                this.salaryPopUpForm.controls.salaryData.get(control).value === "") &&
            inputDate.toString() !== ""
        ) {
            return this.secondaryLanguageStrings["secondary.portal.common.invalidDateFormat"];
        }
        if (!this.salaryPopUpForm?.controls?.salaryData?.get(control).value && control !== "expiresAfter") {
            this.salaryPopUpForm.controls.salaryData.get(control).setErrors({ required: true });
            return this.secondaryLanguageStrings["secondary.portal.members.requiredField"];
        }
        if (
            this.dateService.checkIsAfter(this.dateService.toDate(this.hireDate.toString()), inputDate) &&
            control === this.EFFECTIVE_STARTING_DATE
        ) {
            return this.secondaryLanguageStrings["secondary.portal.members.workValidation.salaryStartDateBeforeHireDate"];
        }
        if (this.dateService.checkIsAfter(inputDate) && control !== this.EXPIRES_AFTER) {
            return this.langStrings["primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.invalidFutureDate"];
        }
        return "";
    }

    /**
     * Method to calculate hourly compensation and set it on form-fields after set validations
     * @val
     */
    calculateHourlyCompensation(val?: InterfaceHourly): void {
        if (this.WeeksPerYearControl.value > 0 && this.hoursPerWeekControl.value > 0 && this.youngerEmployeeHoursPerYearErrFlag) {
            this.hoursPerWeekControl.setErrors(null);
            this.WeeksPerYearControl.setErrors(null);
        }
        this.compensationHourlyControl.setErrors(null);
        this.youngerEmployeeHoursPerYearErr = undefined;
        this.youngerEmployeeHoursPerYearErrFlag = false;
        if (this.salaryDataControl && val) {
            const value = val.value.target.value && val.value.target.value !== "" ? parseFloat(val.value.target.value) : "0";
            this.salaryDataControl.get(val.type).setValue(value);
        }
        if (
            this.hoursPerWeekControl &&
            this.hoursPerWeekControl.valid &&
            this.WeeksPerYearControl &&
            this.WeeksPerYearControl.value &&
            this.hourlyRateControl &&
            this.hourlyRateControl.valid
        ) {
            this.hoursPerYear = parseFloat(this.WeeksPerYearControl.value) * parseFloat(this.hoursPerWeekControl.value);
            this.hoursPerWeekControl.setErrors(null);
            this.WeeksPerYearControl.setErrors(null);
            this.hourlyRateControl.setErrors(null);
            if (
                this.calculateAge(this.dateService.toDate(this.state.memberInfo.birthDate)) &&
                this.hoursPerYear > this.TOTAL_HRS_FOR_YOUNGER_EMP
            ) {
                this.youngerEmployeeHoursPerYearErrFlag = true;
                this.youngerEmployeeHoursPerYearErr = this.secondaryLanguageStrings["secondary.portal.common.work.errHoursPerYearDOB"];
                this.hoursPerWeekControl.setErrors({ incorrect: true });
                this.WeeksPerYearControl.setErrors({ incorrect: true });
                this.hoursPerWeekControl.markAsTouched();
                this.WeeksPerYearControl.markAsTouched();
                this.salaryPopUpForm.updateValueAndValidity();
                return;
            }
            this.calculateAnnualSalary();
        } else if (this.data.editRowData) {
            this.compensationHourlyControl.setValue(0);
        }
    }

    /**
     * Method to fetch configurations of hours per week and set validations
     */
    getHoursPerWeekConfiguration(): void {
        combineLatest(
            this.staticUtilService.cacheConfigValue("general.employee.work.hours_per_week.min"),
            this.staticUtilService.cacheConfigValue("general.employee.work.hours_per_week.max"),
        )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([minValue, maxValue]) => {
                this.hoursPerWeekMinConfig = parseFloat(minValue.replace(/,/g, ""));
                this.hoursPerWeekMaxConfig = parseFloat(maxValue.replace(/,/g, ""));
                this.hoursPerWeekControl.setValidators([
                    Validators.pattern(this.validationRegex.HOURSPERWEEK),
                    Validators.min(this.hoursPerWeekMinConfig),
                    Validators.max(this.hoursPerWeekMaxConfig),
                    Validators.required,
                ]);
                this.hoursPerWeekMoreThanMaxErrorMsg = this.secondaryLanguageStrings[
                    "secondary.portal.common.work.errHoursPerWeekMax"
                ].replace("##MAXHOURS##", maxValue);
                this.hoursPerWeekMoreThanMinErrorMsg = this.secondaryLanguageStrings[
                    "secondary.portal.common.work.errHoursPerWeekMin"
                ].replace("##MINHOURS##", minValue);
            });
    }

    /**
     * Method to fetch configurations of weeks per year and set validations
     */
    getWeeksPerYearConfiguration(): void {
        combineLatest([
            this.staticUtilService.cacheConfigValue("general.employee.work.weeks_per_year.min"),
            this.staticUtilService.cacheConfigValue("general.employee.work.weeks_per_year.max"),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([minValue, maxValue]) => {
                this.WeeksPerYearControl.patchValue(+maxValue);
                this.weeksPerYearMinConfig = parseFloat(minValue.replace(/,/g, ""));
                this.weeksPerYearMaxConfig = parseFloat(maxValue.replace(/,/g, ""));
                this.WeeksPerYearControl.setValidators([
                    Validators.pattern(this.validationRegex.HOURSPERWEEK),
                    Validators.min(this.weeksPerYearMinConfig),
                    Validators.max(this.weeksPerYearMaxConfig),
                    Validators.required,
                ]);
                this.weeksPerYearMoreThanMaxErrorMsg = this.secondaryLanguageStrings[
                    "secondary.portal.common.work.errWeekPerYearMax"
                ].replace("##MAXHOURS##", maxValue);
                this.weeksPerYearMoreThanMinErrorMsg = this.secondaryLanguageStrings[
                    "secondary.portal.common.work.errWeekPerYearMin"
                ].replace("##MINHOURS##", minValue);
            });
    }

    /**
     * Method to fetch configurations of hourly-rate and set validations
     */
    getHourlyRateConfiguration(): void {
        combineLatest([
            this.staticUtilService.cacheConfigValue("general.employee.work.hourly_rate.min"),
            this.staticUtilService.cacheConfigValue("general.employee.work.hourly_rate.max"),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([minValue, maxValue]) => {
                this.hourlyRateMinConfig = parseFloat(minValue.replace(/,/g, ""));
                this.hourlyRateMaxConfig = parseFloat(maxValue.replace(/,/g, ""));
                this.hourlyRateControl.setValidators([
                    Validators.pattern(this.validationRegex.HOURSPERWEEK),
                    Validators.min(this.hourlyRateMinConfig),
                    Validators.max(this.hourlyRateMaxConfig),
                    Validators.required,
                ]);
                this.hourlyRateMoreThanMaxErrorMsg = this.secondaryLanguageStrings["secondary.portal.common.work.errHourlyRateMax"].replace(
                    "##MAXWAGE##",
                    maxValue,
                );
                this.hourlyRateMoreThanMinErrorMsg = this.secondaryLanguageStrings["secondary.portal.common.work.errHourlyRateMin"].replace(
                    "##MINWAGE##",
                    minValue,
                );
            });
    }

    /* Below get functions are to get controls from formGroup to reduce code in HTML Template */
    get hoursPerWeekControl(): FormControl {
        return this.salaryPopUpForm.get("salaryData").get("hoursPerWeek") as FormControl;
    }
    get hourlyRateControl(): FormControl {
        return this.salaryPopUpForm.get("salaryData").get("hourlyRate") as FormControl;
    }
    get WeeksPerYearControl(): FormControl {
        return this.salaryPopUpForm.get("salaryData").get("weekPerYear") as FormControl;
    }

    /**
     * This will return salaryDataControl as abstract control for salaryData
     * @returns FormControl of SalaryData
     */
    get salaryDataControl(): FormControl {
        return this.salaryPopUpForm.get("salaryData") as FormControl;
    }
    /**
     * This will return compensationHourlyControl as abstract control for compensationHourly
     * @returns FormControl of compensationHourly
     */
    get compensationHourlyControl(): FormControl {
        return this.salaryDataControl.get("compensationHourly") as FormControl;
    }

    /**
     * Method to calculate the age and check whether it is less than configued age
     * @birthDate
     */
    calculateAge(birthDate: Date): number {
        const currentDate = new Date();
        if (birthDate < currentDate) {
            let age = currentDate.getFullYear() - birthDate.getFullYear();
            const month = currentDate.getMonth() - birthDate.getMonth();
            if (month < 0 || (month === 0 && currentDate.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < this.ELIGIBLE_EMPLOYEE_AGE) {
                return age;
            }
            return null;
        }
        return null;
    }
    /**
     * This function is used to limit the user entry hours per week field to decimal places
     * @param event: keypress event
     */
    validateNumber(event: HTMLInputElement): void {
        event.value = this.utilService.formatDecimalNumber(event.value);
    }

    /**
     * Trims hours per week field with just decimal point to proper value
     * @param event :HTMLInput Event which used to capture event.target
     */
    trimDecimalPoint(event: HTMLInputElement): void {
        if (+event.value) {
            this.salaryDataControl.get("hoursPerWeek").setValue((+event.value).toString());
        }
    }

    fetchSecondaryLanguages(): void {
        this.secondaryLanguageStrings = this.language.fetchSecondaryLanguageValues([
            "secondary.portal.common.work.errHoursPerWeekMax",
            "secondary.portal.common.work.errHoursPerWeekMin",
            "secondary.portal.common.work.errWeekPerYearMax",
            "secondary.portal.common.work.errWeekPerYearMin",
            "secondary.portal.common.work.errHourlyRateMax",
            "secondary.portal.common.work.errHourlyRateMin",
            "secondary.portal.common.work.errHoursPerWeekDecimal",
            "secondary.portal.common.work.errHourlyWageDecimal",
            "secondary.portal.common.work.errWeeksPerYearDecimal",
            "secondary.portal.common.work.errHoursPerYearDOB",
            "secondary.portal.members.requiredField",
            "secondary.portal.common.invalidDateFormat",
            "secondary.portal.members.work.dateOverlapBenefit",
            "secondary.portal.members.work.dateOverlapActual",
            "secondary.portal.members.workValidationMsg.dateOverlapBenefitSalary",
            "secondary.portal.members.workValidation.salaryStartDateBeforeHireDate",
            "secondary.portal.members.workValidation.maxStartDateAllowed",
        ]);
    }

    /**
     * method to calculate annual salary as per hourly rate
     */
    calculateAnnualSalary(): void {
        const compensation = (parseFloat(this.hourlyRateControl.value) * this.hoursPerYear).toFixed(this.PRECISION_POINT_LENGTH);
        this.isSalaryOutOfRange = parseFloat(compensation) < this.annualSalaryMin || parseFloat(compensation) > this.annualSalaryMax;
        this.compensationHourlyControl.setValue(compensation);
    }

    /**
     * get annual salary range from config
     */
    getAnnualSalaryConfigValue(): void {
        combineLatest(
            this.staticUtilService.cacheConfigValue(ConfigName.GENERAL_EMPLOYEE_SALARY_ANNUAL_MIN),
            this.staticUtilService.cacheConfigValue(ConfigName.GENERAL_EMPLOYEE_SALARY_ANNUAL_MAX),
        )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([annualMinValue, annualMaxValue]) => {
                this.annualSalaryMin = parseFloat(annualMinValue.replace(/,/g, ""));
                this.annualSalaryMax = parseFloat(annualMaxValue.replace(/,/g, ""));
            });
    }
}
