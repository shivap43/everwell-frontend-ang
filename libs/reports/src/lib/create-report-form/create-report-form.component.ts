import { ChipSelectComponent } from "@empowered/ui";
import { Component, Inject, OnInit, ViewChild, AfterViewInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators, ValidationErrors } from "@angular/forms";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import {
    EmploymentStatus,
    FormCompletionStatus,
    ReportCriteria,
    ViewedStatus,
    EnrollmentReportStatus,
    IncludeEnrollments,
    CommissionsEnrollmentStatus,
} from "@empowered/api";
import { Observable, Subject, Subscription } from "rxjs";
import { DocumentsService } from "@empowered/documents";
import { take, map, filter, tap } from "rxjs/operators";
import { DatePipe } from "@angular/common";
import { ConfigName, DateFormats, ChipData } from "@empowered/constants";
import { Select } from "@ngxs/store";
import { SharedState, RegexDataType, StaticUtilService } from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";
import { MPGroupAccountService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

const SENT = "SENT";
const UNSENT = "UNSENT";
const ALL = "ALL";
@Component({
    selector: "empowered-create-report-form",
    templateUrl: "./create-report-form.component.html",
    styleUrls: ["./create-report-form.component.scss"],
})
export class CreateReportFormComponent implements OnInit, AfterViewInit, OnDestroy {
    reportType: "demographics" | "enrollment" | "deductions" | "PDA" | "commissions";
    displayedColumns = ["reportType", "description", "uploadDate", "status", "uploadAdmin", "manage"];

    createReportForm: FormGroup;

    carriers: FormControl;
    classes: FormControl;
    statesOfResidence: FormControl;
    formCompletionStatuses: FormGroup;
    employeeStatuses: FormGroup;
    enrollmentStatuses: FormGroup;
    viewedPlans: FormGroup;

    allCarriers$: Observable<ChipData[]>;

    allClasses$: Observable<ChipData[]>;
    allEmployeesClassId = 1;

    allStates$: Observable<ChipData[]>;
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    @ViewChild("stateChipSelect") stateChipSelect: ChipSelectComponent;
    @ViewChild("carrierChipSelect") carrierChipSelect: ChipSelectComponent;
    @ViewChild("classChipSelect") classChipSelect: ChipSelectComponent;
    stateValueChipSelect = new FormControl([], Validators.required);
    carrierValueChipSelect = new FormControl([], Validators.required);
    classValueChipSelect = new FormControl([], Validators.required);

    private readonly changeStrategySubject$: Subject<void> = new Subject();

    carrierMissing = false;
    classMissing = false;
    stateMissing = false;
    employeeStatusesMissing = false;
    enrollmentStatusMissing = false;
    formCompletionStatusesMissing = false;
    viewedPlansMissing = false;
    hasSubmitted = false;

    today = new Date();
    viewedPlansTooltip: string;
    MAX_DATE_LENGTH = 8;
    signedStartDate = "signedStartDate";
    signedEndDate = "signedEndDate";
    direct = "direct";
    fromDirect: boolean;
    includeEnrollmentOptions = IncludeEnrollments;
    // only direct
    isDirectGroup$: Observable<boolean> = this.mpGroupAccountService.mpGroupAccount$.pipe(
        map((account) => {
            const isDirect = account.partnerAccountType === "DIRECT";
            if (isDirect) {
                this.displayedColumns = this.displayedColumns.filter((column) => column !== "uploadAdmin");
            }
            return isDirect;
        }),
    );
    validationRegex: RegexDataType;
    subscriber: Subscription[] = [];
    constructor(
        /* eslint no-underscore-dangle: ["error", { "allow": ["_bottomSheetRef"]}]*/
        private readonly _bottomSheetRef: MatBottomSheetRef<CreateReportFormComponent>,
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly document: DocumentsService,
        private readonly mpGroupAccountService: MPGroupAccountService,
        private readonly datePipe: DatePipe,
        private readonly dateService: DateService,
    ) {
        this.reportType = data.reportType;
        this.allCarriers$ = data.allCarriers$;
        this.allClasses$ = data.allClasses$;
        this.allStates$ = data.allStates$;
    }

    /**
     * Angular life-cycle hook ngAfterViewInit
     * create report form as per report type selected
     */
    ngAfterViewInit(): void {
        if (this.reportType === "demographics" || this.reportType === "enrollment" || this.reportType === "deductions") {
            this.createReportForm.addControl("statesOfResidence", this.stateValueChipSelect);
            if (this.classChipSelect) {
                this.createReportForm.addControl("classes", this.classValueChipSelect);
            }
        }
        if (this.reportType === "enrollment" || this.reportType === "deductions") {
            this.createReportForm.addControl("carriers", this.carrierValueChipSelect);
        }
    }

    /**
     * setting up the report form based on the report type
     */
    ngOnInit(): void {
        this.subscriber.push(
            this.regex$
                .pipe(
                    filter((regex) => regex !== null),
                    tap((regex) => (this.validationRegex = regex)),
                )
                .subscribe(),
        );
        this.fromDirect = this.data.source === this.direct;
        const ENROLLMENT_STATUSES = "enrollmentStatuses";
        this.viewedPlansTooltip = this.language.fetchPrimaryLanguageValue("primary.portal.createReportForm.viewedPlansInfo");
        this.createReportForm = this.fb.group({
            description: ["", Validators.pattern(new RegExp(this.validationRegex.ALPHANUMERIC_SPECIAL_CHARACTERS))],
        });

        switch (this.reportType) {
            case "demographics":
                this.employeeStatuses = this.fb.group({ active: false, terminated: false }, Validators.required);
                this.viewedPlans = this.fb.group({ seen: false, notSeen: false }, Validators.required);
                this.createReportForm.addControl("employeeStatuses", this.employeeStatuses);
                this.createReportForm.addControl("viewedPlans", this.viewedPlans);
                this.createReportForm.addControl("showChangedRecords", this.fb.control("all"));
                this.createReportForm.addControl("effectiveStarting", this.fb.control("", this.validateInputDate.bind(this)));
                break;
            case "enrollment":
                this.employeeStatuses = this.fb.group({ active: false, terminated: false }, Validators.required);
                this.enrollmentStatuses = this.fb.group({
                    approved: false,
                    pending: false,
                    pendingEAA: false,
                    pendingPDA: false,
                    // For Direct
                    pendingSignature: false,
                    pendingOtherReasons: false,
                });
                this.createReportForm.addControl(ENROLLMENT_STATUSES, this.enrollmentStatuses);
                this.createReportForm.addControl("employeeStatuses", this.employeeStatuses);
                this.createReportForm.addControl("includeEnrollments", this.fb.control(this.includeEnrollmentOptions.ALL));
                this.createReportForm.addControl("effectiveStarting", this.fb.control("", this.validateInputDate.bind(this)));
                this.createReportForm.addControl("expiresAfter", this.fb.control("", this.validateInputDate.bind(this)));
                break;
            case "deductions":
                this.employeeStatuses = this.fb.group({ active: false, terminated: false }, Validators.required);
                this.createReportForm.addControl("employeeStatuses", this.employeeStatuses);
                this.createReportForm.addControl("payrollReportDate", this.fb.control(new Date(), this.validateInputDate.bind(this)));
                break;
            case "PDA":
                this.formCompletionStatuses = this.fb.group({ complete: false, incomplete: false }, Validators.required);
                this.viewedPlans = this.fb.group({ seen: false, notSeen: false }, Validators.required);
                this.createReportForm.addControl("formCompletionStatuses", this.formCompletionStatuses);
                this.createReportForm.addControl("viewedPlans", this.viewedPlans);
                this.createReportForm.addControl(
                    "reportDate",
                    this.fb.control(new Date(), [Validators.required, this.validateInputDate.bind(this)]),
                );
                break;
            case "commissions":
                this.createReportForm.addControl(
                    "enrollmentStatus",
                    this.fb.control(this.includeEnrollmentOptions.ALL, Validators.required),
                );
                this.createReportForm.addControl("signedDates", this.fb.control("all", Validators.required));
                this.createReportForm.addControl("signedStartDate", this.fb.control("", Validators.required));
                this.createReportForm.addControl("signedEndDate", this.fb.control("", Validators.required));
                break;
        }
    }

    /**
     * close out bottom sheet
     */
    closeFormModal(): void {
        this._bottomSheetRef.dismiss();
    }

    /**
     * after validation, submit the form by calling the API to create the report
     * @param submittedForm is the type of form
     */
    onSubmit(submittedForm: FormGroup): void {
        this.hasSubmitted = true;
        let anyError = false;

        this.carrierValueChipSelect.setValue(this.carrierChipSelect ? this.carrierChipSelect.selectedChips : []);
        this.classValueChipSelect.setValue(this.classChipSelect ? this.classChipSelect.selectedChips : []);
        this.stateValueChipSelect.setValue(this.stateChipSelect ? this.stateChipSelect.selectedChips : []);
        this.changeStrategySubject$.next();

        anyError = this.checkValidation();

        if (!anyError) {
            let reportCriteria: ReportCriteria;
            if (this.data.source === this.direct) {
                reportCriteria = {
                    type: "ENROLLMENT",
                    description: this.createReportForm.controls.description.value ? this.createReportForm.controls.description.value : null,
                    carrierIds: this.generateCarrierIdList(),
                    classIds: null,
                    statesOfResidence: this.generateStateAbbreviationList(),
                    status: this.generateEnrollmentStatuses(),
                    enrollmentStatus: this.generateEnrollments(),
                };
            } else {
                reportCriteria = this.setReportCriteria(submittedForm);
            }
            this._bottomSheetRef.dismiss(this.document.createReport(reportCriteria, this.fromDirect).pipe(take(1)));
        }
    }
    /**
     * This function is used to fetch the ENUM values for enrollment status of type sent,unsent and all
     * @returns CommissionsEnrollmentStatus might be SENT,UNSENT or ALL
     */
    generateEnrollments(): CommissionsEnrollmentStatus {
        let enrollment: IncludeEnrollments;
        if (this.createReportForm.controls.includeEnrollments.value === SENT) {
            enrollment = IncludeEnrollments.SENT;
        }
        if (this.createReportForm.controls.includeEnrollments.value === UNSENT) {
            enrollment = IncludeEnrollments.UNSENT;
        }
        if (this.createReportForm.controls.includeEnrollments.value === ALL) {
            enrollment = IncludeEnrollments.ALL;
        }
        return enrollment;
    }
    /**
     * This function is used to set report criteria
     * @param submittedForm form for submission
     * @returns ReportCriteria object which holds information about report
     */
    setReportCriteria(submittedForm: FormGroup): ReportCriteria {
        let reportCriteria: ReportCriteria;
        switch (this.reportType) {
            case "demographics":
                reportCriteria = {
                    type: "DEMOGRAPHICS",
                    description: submittedForm.value.description,
                    classIds: this.generateClassIdList(),
                    statesOfResidence: this.generateStateAbbreviationList(),
                    employmentStatuses: this.generateEmployeeStatuses(),
                    viewedStatuses: this.generateViewedPlanStatuses(),
                    recordsChangedValidity: { effectiveStarting: submittedForm.value.effectiveStarting },
                };
                if (submittedForm.value.effectiveStarting === "") {
                    delete reportCriteria.recordsChangedValidity;
                } else {
                    reportCriteria.recordsChangedValidity.effectiveStarting = this.datePipe.transform(
                        submittedForm.value.effectiveStarting,
                        DateFormats.YEAR_MONTH_DAY,
                    );
                }
                break;
            case "enrollment":
                reportCriteria = {
                    type: "ENROLLMENT",
                    description: submittedForm.value.description,
                    carrierIds: this.generateCarrierIdList(),
                    classIds: this.generateClassIdList(),
                    statesOfResidence: this.generateStateAbbreviationList(),
                    employmentStatuses: this.generateEmployeeStatuses(),
                    status: this.generateEnrollmentStatuses(),
                    enrollmentCoverageValidity: {
                        effectiveStarting: submittedForm.value.effectiveStarting,
                        expiresAfter: submittedForm.value.expiresAfter,
                    },
                };
                if (submittedForm.value.expiresAfter === "") {
                    delete reportCriteria.enrollmentCoverageValidity.expiresAfter;
                } else {
                    reportCriteria.enrollmentCoverageValidity.expiresAfter = this.datePipe.transform(
                        submittedForm.value.expiresAfter,
                        DateFormats.YEAR_MONTH_DAY,
                    );
                }
                if (submittedForm.value.effectiveStarting === "") {
                    delete reportCriteria.enrollmentCoverageValidity;
                } else {
                    reportCriteria.enrollmentCoverageValidity.effectiveStarting = this.datePipe.transform(
                        submittedForm.value.effectiveStarting,
                        DateFormats.YEAR_MONTH_DAY,
                    );
                }
                break;
            case "deductions":
                reportCriteria = {
                    type: "DEDUCTIONS",
                    description: submittedForm.value.description,
                    carrierIds: this.generateCarrierIdList(),
                    classIds: this.generateClassIdList(),
                    statesOfResidence: this.generateStateAbbreviationList(),
                    employmentStatuses: this.generateEmployeeStatuses(),
                    asOfDate: this.datePipe.transform(submittedForm.value.payrollReportDate, DateFormats.YEAR_MONTH_DAY),
                };
                break;
            case "PDA":
                reportCriteria = {
                    type: this.reportType,
                    description: submittedForm.value.description,
                    formCompletionStatuses: this.generateFormCompletionStatuses(),
                    viewedStatuses: this.generateViewedPlanStatuses(),
                    asOfDate: this.datePipe.transform(submittedForm.value.reportDate, DateFormats.YEAR_MONTH_DAY),
                };
                break;
            case "commissions":
                reportCriteria = {
                    type: "COMMISSIONS",
                    description: submittedForm.value.description,
                    enrollmentStatus: submittedForm.value.enrollmentStatus,
                    signedDateValidity: {
                        effectiveStarting: submittedForm.value.signedStartDate,
                        expiresAfter: submittedForm.value.signedEndDate,
                    },
                };
                if (submittedForm.value.enrollmentStatus === "all") {
                    delete reportCriteria.enrollmentStatus;
                }
                if (submittedForm.value.signedDates === "all") {
                    delete reportCriteria.signedDateValidity;
                } else {
                    reportCriteria.signedDateValidity.effectiveStarting = this.datePipe.transform(
                        submittedForm.value.signedStartDate,
                        DateFormats.YEAR_MONTH_DAY,
                    );
                    reportCriteria.signedDateValidity.expiresAfter = this.datePipe.transform(
                        submittedForm.value.signedEndDate,
                        DateFormats.YEAR_MONTH_DAY,
                    );
                }
                break;
        }

        if (submittedForm.value.description.trim() === "") {
            delete reportCriteria.description;
        }
        return reportCriteria;
    }

    /**
     * validating the demographics report form based on the fields present
     */
    validateDemographicsReport(): boolean {
        let anyError = false;
        if (this.createReportForm.controls.classes && this.createReportForm.controls.classes.status === "INVALID") {
            this.classMissing = true;
            anyError = true;
        } else {
            this.classMissing = false;
        }

        if (this.createReportForm.controls.statesOfResidence.status === "INVALID") {
            this.stateMissing = true;
            anyError = true;
        } else {
            this.stateMissing = false;
        }

        if (!this.employeeStatuses.value.active && !this.employeeStatuses.value.terminated) {
            this.employeeStatusesMissing = true;
            anyError = true;
        } else {
            this.employeeStatusesMissing = false;
        }

        if (!this.viewedPlans.value.seen && !this.viewedPlans.value.notSeen) {
            this.viewedPlansMissing = true;
            anyError = true;
        } else {
            this.viewedPlansMissing = false;
        }

        if (this.createReportForm.value.showChangedRecords === "onOrAfter" && this.createReportForm.value.effectiveStarting === "") {
            this.createReportForm.controls.effectiveStarting.setErrors({ requirement: true });
            anyError = true;
        }
        anyError = this.descriptionFieldValidationCheck(anyError);
        return anyError;
    }

    /**
     * validating the enrollment report form based on the fields present
     * @return returns a flag if there is an error
     */
    validateEnrollmentReport(): boolean {
        let anyError = false;
        if (this.createReportForm.controls.carriers.status === "INVALID") {
            this.carrierMissing = true;
            anyError = true;
        } else {
            this.carrierMissing = false;
        }
        if (this.classChipSelect && this.createReportForm.controls.classes.status === "INVALID") {
            this.classMissing = true;
            anyError = true;
        } else {
            this.classMissing = false;
        }

        if (this.createReportForm.controls.statesOfResidence.status === "INVALID") {
            this.stateMissing = true;
            anyError = true;
        } else {
            this.stateMissing = false;
        }
        const enrollmentStatusError = this.enrollmentStatusFlagSet();
        let employeeStatusError = false;
        if (!this.fromDirect) {
            employeeStatusError = this.employeeStatusFlagSet();
            if (
                this.createReportForm.value.includeEnrollments === "onOrAfter" &&
                (this.createReportForm.value.effectiveStarting === "" || this.createReportForm.value.effectiveStarting === null)
            ) {
                this.createReportForm.controls.effectiveStarting.setErrors({ requirement: true });
                anyError = true;
            }

            if (
                this.createReportForm.value.includeEnrollments === "withCoverageBetween" &&
                (this.createReportForm.value.effectiveStarting === "" || this.createReportForm.value.effectiveStarting === null)
            ) {
                this.createReportForm.controls.effectiveStarting.setErrors({ requirement: true });
                anyError = true;
            }
            if (
                this.createReportForm.value.includeEnrollments === "withCoverageBetween" &&
                (this.createReportForm.value.expiresAfter === "" || this.createReportForm.value.expiresAfter === null)
            ) {
                this.createReportForm.controls.expiresAfter.setErrors({ requirement: true });
                anyError = true;
            }
        }
        anyError = this.descriptionFieldValidationCheck(anyError);
        return anyError || employeeStatusError || enrollmentStatusError;
    }
    /**
     * this function checks if the enrollment status is checked or not based on direct or payroll and setting the flags accordingly
     * @return returns a flag if there is an error
     */
    enrollmentStatusFlagSet(): boolean {
        let anyError = false;
        if (
            !this.fromDirect &&
            !this.enrollmentStatuses.controls.approved.value &&
            !this.enrollmentStatuses.controls.pending.value &&
            !this.enrollmentStatuses.controls.pendingEAA.value &&
            !this.enrollmentStatuses.controls.pendingPDA.value
        ) {
            this.enrollmentStatusMissing = true;
            anyError = true;
        } else if (
            this.fromDirect &&
            !this.enrollmentStatuses.controls.approved.value &&
            !this.enrollmentStatuses.controls.pendingSignature.value &&
            !this.enrollmentStatuses.controls.pendingOtherReasons.value
        ) {
            this.enrollmentStatusMissing = true;
            anyError = true;
        } else {
            this.enrollmentStatusMissing = false;
        }
        return anyError;
    }
    /**
     * this function is used to check if the employee status is checked or not based on direct or payroll and setting the flags accordingly
     * @return returns a flag if there is an error
     */
    employeeStatusFlagSet(): boolean {
        let anyError = false;
        if (!this.fromDirect && !this.employeeStatuses.value.active && !this.employeeStatuses.value.terminated) {
            this.employeeStatusesMissing = true;
            anyError = true;
        } else {
            this.employeeStatusesMissing = false;
        }
        return anyError;
    }
    /**
     * validating the payroll report form based on the fields present
     */
    validatePayrollReport(): boolean {
        let anyError = false;
        if (this.createReportForm.controls.carriers.status === "INVALID") {
            this.carrierMissing = true;
            anyError = true;
        } else {
            this.carrierMissing = false;
        }
        if (this.classChipSelect && this.createReportForm.controls.classes.status === "INVALID") {
            this.classMissing = true;
            anyError = true;
        } else {
            this.classMissing = false;
        }

        if (this.createReportForm.controls.statesOfResidence.status === "INVALID") {
            this.stateMissing = true;
            anyError = true;
        } else {
            this.stateMissing = false;
        }

        if (!this.employeeStatuses.value.active && !this.employeeStatuses.value.terminated) {
            this.employeeStatusesMissing = true;
            anyError = true;
        } else {
            this.employeeStatusesMissing = false;
        }

        if (this.createReportForm.value.payrollReportDate === "" || this.createReportForm.value.payrollReportDate === null) {
            this.createReportForm.controls.payrollReportDate.setErrors({ requirement: true });
            anyError = true;
        }
        anyError = this.descriptionFieldValidationCheck(anyError);
        return anyError;
    }

    /**
     * validating the PDA report form based on the fields present
     * @returns boolean
     */
    validatePdaReport(): boolean {
        let anyError = false;

        if (!this.formCompletionStatuses.value.complete && !this.formCompletionStatuses.value.incomplete) {
            this.formCompletionStatusesMissing = true;
            anyError = true;
        } else {
            this.formCompletionStatusesMissing = false;
        }

        if (!this.viewedPlans.value.seen && !this.viewedPlans.value.notSeen) {
            this.viewedPlansMissing = true;
            anyError = true;
        } else {
            this.viewedPlansMissing = false;
        }

        if (this.createReportForm.value.reportDate === "" || this.createReportForm.value.reportDate === null) {
            this.createReportForm.controls.reportDate.setErrors({ requirement: true });
            anyError = true;
        }
        anyError = this.descriptionFieldValidationCheck(anyError);
        return anyError;
    }

    /**
     * validating the commission report form based on the fields present
     * @return returns a flag if there is an error
     */
    validateCommissionsReport(): boolean {
        let anyError = false;

        if (this.createReportForm.value.signedDates === "selected") {
            if (this.createReportForm.value.signedStartDate === "" || this.createReportForm.value.signedStartDate === null) {
                this.createReportForm.controls.signedStartDate.setErrors({ requirement: true });
                anyError = true;
            }
            if (this.createReportForm.value.signedEndDate === "" || this.createReportForm.value.signedEndDate === null) {
                this.createReportForm.controls.signedEndDate.setErrors({ requirement: true });
                anyError = true;
            }
        }
        anyError = this.descriptionFieldValidationCheck(anyError);
        return anyError;
    }

    /**
     * Validating the description field for commission and enrollment report
     * @param anyError boolean flag, it will be true/false based on form field error
     * @returns returns a flag if there is an error
     */
    descriptionFieldValidationCheck(anyError: boolean): boolean {
        if (this.createReportForm.controls.description.hasError("pattern")) {
            anyError = true;
        }
        return anyError;
    }

    /**
     * This method validates the signed start and end dates.
     * @param control: string, the control to be validated, i.e. start or end date
     * @param event: string, the date value entered
     * @returns language string on the basis of error response.
     */
    validateDate(control: string, event: string): string {
        const requiredField = "primary.portal.common.requiredField";
        const invalidDateFormat = "primary.portal.common.invalidDateFormat";
        let errorMessage = "";
        if (this.hasSubmitted && !this.createReportForm.controls[control].value) {
            errorMessage = requiredField;
        }
        if (
            (this.createReportForm.controls[control].value === null || this.createReportForm.controls[control].value === "") &&
            event !== ""
        ) {
            errorMessage = invalidDateFormat;
        }
        return errorMessage;
    }

    /**
     * getting the list of carrier ids from the carriers provided from the report form for submission
     */
    generateCarrierIdList(): number[] {
        return this.createReportForm.value.carriers.map((carrier) => parseInt(carrier.value, 10));
    }

    /**
     * getting the list of class ids from the classes provided from the report form for submission
     * if there are no visible classes, then use All Employees as the class id
     */
    generateClassIdList(): number[] {
        let classIdList = [];
        const classControl = this.classValueChipSelect.value;
        if (classControl && classControl.length) {
            classIdList = classControl.map((clazz) => parseInt(clazz.value, 10));
        } else {
            classIdList.push(this.allEmployeesClassId);
        }
        return classIdList;
    }

    /**
     * getting the list of state abbreviations from the states provided from the report form for submission
     */
    generateStateAbbreviationList(): string[] {
        return this.stateValueChipSelect.value.map((state) => state.value);
    }

    /**
     * getting the list of employee statuses from the appropriate checked fields from the report form for submission
     */
    generateEmployeeStatuses(): EmploymentStatus[] {
        const employeeStatuses = [];
        if (this.employeeStatuses.value.active) {
            employeeStatuses.push("ACTIVE");
        }
        if (this.employeeStatuses.value.terminated) {
            employeeStatuses.push("TERMINATED");
        }
        return employeeStatuses;
    }

    /**
     * getting the list of enrollment status from the appropriate checked fields from the report form for submission
     * @return Returns user selected enrollment statuses
     */
    generateEnrollmentStatuses(): EnrollmentReportStatus[] {
        const enrollmentStatuses: EnrollmentReportStatus[] = [];
        if (this.enrollmentStatuses.value.approved) {
            enrollmentStatuses.push(EnrollmentReportStatus.APPROVED);
        }
        if (this.enrollmentStatuses.value.pending) {
            enrollmentStatuses.push(EnrollmentReportStatus.PENDING);
        }
        if (this.enrollmentStatuses.value.pendingEAA) {
            enrollmentStatuses.push(EnrollmentReportStatus.PENDING_EEA);
        }
        if (this.enrollmentStatuses.value.pendingPDA) {
            enrollmentStatuses.push(EnrollmentReportStatus.PENDING_PDA);
        }
        if (this.enrollmentStatuses.value.pendingOtherReasons) {
            enrollmentStatuses.push(EnrollmentReportStatus.PENDING);
        }
        if (this.enrollmentStatuses.value.pendingSignature) {
            enrollmentStatuses.push(EnrollmentReportStatus.PENDING_SIGNATURE);
        }
        return enrollmentStatuses;
    }

    /**
     * getting the list of form completion statuses from the appropriate checked fields
     * from the report form for submission
     */
    generateFormCompletionStatuses(): FormCompletionStatus[] {
        const formCompletionStatuses = [];
        if (this.formCompletionStatuses.value.complete) {
            formCompletionStatuses.push("COMPLETE");
        }
        if (this.formCompletionStatuses.value.incomplete) {
            formCompletionStatuses.push("INCOMPLETE");
        }
        return formCompletionStatuses;
    }

    /**
     * getting the list of viewed plan statuses from the appropriate checked fields
     * from the report form for submission
     */
    generateViewedPlanStatuses(): ViewedStatus[] {
        const viewedPlanStatuses = [];
        if (this.viewedPlans.value.seen) {
            viewedPlanStatuses.push("VIEWED");
        }
        if (this.viewedPlans.value.notSeen) {
            viewedPlanStatuses.push("NOT_VIEWED");
        }
        return viewedPlanStatuses;
    }

    /**
     * storing checked value for enrollment status
     * param label used for passing formControl name
     * Returns void
     */
    toggleEnrollmentStatus(label: string): void {
        this.enrollmentStatuses.get(label).setValue(!this.enrollmentStatuses.get(label).value);
    }

    /**
     * storing checked value for active employee status
     */
    toggleCheckedActive(): void {
        this.employeeStatuses.get("active").setValue(!this.employeeStatuses.get("active").value);
        this.employeeStatusFlagSet();
    }

    /**
     * storing checked value for terminated employee status
     */
    toggleCheckedTerminated(): void {
        this.employeeStatuses.get("terminated").setValue(!this.employeeStatuses.get("terminated").value);
        this.employeeStatusFlagSet();
    }

    /**
     * storing checked value for complete form completion status
     */
    toggleCheckedComplete(): void {
        this.formCompletionStatuses.get("complete").setValue(!this.formCompletionStatuses.get("complete").value);
    }

    /**
     * storing checked value for incomplete form completion status
     */
    toggleCheckedIncomplete(): void {
        this.formCompletionStatuses.get("incomplete").setValue(!this.formCompletionStatuses.get("incomplete").value);
    }

    /**
     * storing checked value for seen viewed plan status
     */
    toggleCheckedSeen(): void {
        this.viewedPlans.get("seen").setValue(!this.viewedPlans.get("seen").value);
    }

    /**
     * storing checked value for not seen viewed plan status
     */
    toggleCheckedNotSeen(): void {
        this.viewedPlans.get("notSeen").setValue(!this.viewedPlans.get("notSeen").value);
    }

    /**
     * The below method is bound to form control and validates the input date
     * @param control is formControl value
     * @returns ValidationErrors for currently called form-control
     */
    validateInputDate(control: FormControl): ValidationErrors {
        if (control.value && control.value.toString().trim().length) {
            const inputDate = this.dateService.toDate(control.value);
            if (!inputDate) {
                return { required: true };
            }
            if (inputDate && !this.dateService.isValid(inputDate) && control.value.length) {
                return { invalid: true };
            }
            return null;
        }
        if (!control.value && control.errors) {
            return { invalid: true };
        }
        return null;
    }

    /**
     * This function is used to check validation on value change
     * @returns boolean
     */
    checkValidation(): boolean | undefined {
        let anyError = false;
        if (this.hasSubmitted) {
            switch (this.reportType) {
                case "demographics":
                    anyError = this.validateDemographicsReport();
                    break;
                case "enrollment":
                    anyError = this.validateEnrollmentReport();
                    break;
                case "deductions":
                    anyError = this.validatePayrollReport();
                    break;
                case "PDA":
                    anyError = this.validatePdaReport();
                    break;
                case "commissions":
                    anyError = this.validateCommissionsReport();
                    break;
            }
            return anyError;
        }
        return undefined;
    }

    ngOnDestroy(): void {
        this.subscriber.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
