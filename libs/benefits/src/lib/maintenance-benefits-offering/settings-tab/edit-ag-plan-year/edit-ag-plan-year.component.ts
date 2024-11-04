import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { BenefitsOfferingService, CoveragePeriod, ApprovalRequest, ApprovalRequestStatus } from "@empowered/api";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { FormBuilder, Validators, FormGroup, ValidationErrors, FormControl, AbstractControl } from "@angular/forms";
import {
    DateFormats,
    ClientErrorResponseType,
    ClientErrorResponseCode,
    ConfigName,
    PlanYearType,
    EnrollmentPeriod,
    PlanYear,
} from "@empowered/constants";
import { BenefitOfferingHelperService } from "../../../benefit-offering-helper.service";
import { DatePipe } from "@angular/common";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { Store } from "@ngxs/store";
import { StaticUtilService } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

@Component({
    selector: "empowered-edit-ag-plan-year",
    templateUrl: "./edit-ag-plan-year.component.html",
    styleUrls: ["./edit-ag-plan-year.component.scss"],
})
export class EditAgPlanYearComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.editPlanYear.planYearName",
        "primary.portal.maintenanceBenefitsOffering.editPlanYear.enrollmentDates",
        "primary.portal.maintenanceBenefitsOffering.editPlanYear.coverageDates",
        "primary.portal.common.close",
        "primary.portal.maintenanceBenefitsOffering.editPlanYear.title",
        "primary.portal.common.save",
        "primary.portal.benefitsOffering.planName",
        "primary.portal.benefitsOffering.planExample",
        "primary.portal.common.requiredField",
        "primary.portal.benefitsOffering.enrollmentDates",
        "primary.portal.maintenanceBenefitsOffering.nonAflacCoverageDates",
        "primary.portal.common.dateHint",
        "primary.portal.coverage.cannotBePast",
        "primary.portal.benefits.agOffering.invalidDate",
        "primary.portal.benefits.agOffering.cannotBeAfterEnrollmentDate",
        "primary.portal.benefits.agOffering.cannotBeAfterCoverageDate",
        "primary.portal.benefits.agOffering.cannotBeBeforeEnrollmentDate",
        "primary.portal.benefits.agOffering.mustBeFifteenDays",
        "primary.portal.benefitsOffering.coverageStartDate",
        "primary.portal.benefitsOffering.aflacOffering.coverageDateInfo",
        "primary.portal.maintenanceBenefitsOffering.editPlanYear.coverageEndDate",
        "primary.portal.dashboard.hyphen",
        "primary.portal.benefits.agOffering.boDaysBetweenOeAndCoverage",
    ]);

    aflacGroupOfferingForm: FormGroup;
    enrollmentDateGroup: FormGroup;
    coverageDateGroup: FormGroup;
    today: Date = new Date();
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    fieldErrorMessage: string;
    dateFormat: string = DateFormats.MONTH_DAY_YEAR;
    agMinDaysDifference: number;

    /**
     * This method will be automatically invoked when an instance of the class is created.
     * @param injectedData is the injected data while opening dialog
     * @param language is reference of LanguageService
     * @param formBuilder is reference of FormBuilder
     * @param benefitsOfferingHelperService is reference of BenefitOfferingHelperService
     * @param benefitsOfferingService is reference of BenefitsOfferingService
     * @param datePipe is reference of DatePipe
     * @param store is reference of Store
     * @param dialogRef is mat-dialog reference of EditAgPlanYearComponent
     */
    constructor(
        @Inject(MAT_DIALOG_DATA)
        readonly injectedData: {
            planYear: PlanYear;
            mpGroup: string | number;
            isEditable: boolean;
            latestPlanYear: PlanYear;
            latestApprovalRequest: ApprovalRequest;
        },
        private readonly language: LanguageService,
        private readonly formBuilder: FormBuilder,
        private readonly benefitsOfferingHelperService: BenefitOfferingHelperService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly datePipe: DatePipe,
        private readonly store: Store,
        private readonly dialogRef: MatDialogRef<EditAgPlanYearComponent>,
        private readonly staticUtilService: StaticUtilService,
        private readonly dateService: DateService,
    ) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     * used to call @method initializeForm which initializes form group
     */
    ngOnInit(): void {
        this.staticUtilService
            .cacheConfigValue(ConfigName.AG_BO_MIN_DAYS_BETWEEN_OE_AND_COVERAGE)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((minDays) => (this.agMinDaysDifference = +minDays));
        if (this.injectedData.isEditable) {
            this.initializeForm();
        }
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
    }

    /**
     * This method is used to initialize aflacGroupOfferingForm formGroup
     */
    initializeForm(): void {
        this.aflacGroupOfferingForm = this.formBuilder.group({
            planYearName: [this.injectedData.planYear.name, Validators.required],
        });
        this.enrollmentDateGroup = this.formBuilder.group({
            effectiveStarting: ["", [Validators.required, this.checkDate.bind(this), this.checkEnrollmentStartDate.bind(this)]],
            expiresAfter: ["", [Validators.required, this.checkDate.bind(this), this.checkEnrollmentEndDate.bind(this)]],
        });
        this.coverageDateGroup = this.formBuilder.group({
            effectiveStarting: [
                {
                    disabled: true,
                    value: "",
                },
                [Validators.required],
            ],
            expiresAfter: [{ disabled: true, value: "" }, [Validators.required]],
        });
        this.aflacGroupOfferingForm.addControl("enrollmentPeriod", this.enrollmentDateGroup);
        this.aflacGroupOfferingForm.addControl("coveragePeriod", this.coverageDateGroup);
        this.patchPlanYearInfo();
    }

    /**
     * This method is used to patch plan-year information to respective form controls
     */
    patchPlanYearInfo(): void {
        this.coverageDateGroup.controls.effectiveStarting.patchValue(
            this.dateService.toDate(this.injectedData.planYear.coveragePeriod.effectiveStarting || ""),
        );
        this.coverageDateGroup.controls.expiresAfter.patchValue(
            this.dateService.toDate(this.injectedData.planYear.coveragePeriod.expiresAfter || ""),
        );
        this.enrollmentDateGroup.controls.effectiveStarting.patchValue(
            this.dateService.toDate(this.injectedData.planYear.enrollmentPeriod.effectiveStarting || ""),
        );
        this.enrollmentDateGroup.controls.expiresAfter.patchValue(
            this.dateService.toDate(this.injectedData.planYear.enrollmentPeriod.expiresAfter || ""),
        );
        if (this.dateService.toDate(this.injectedData.planYear.enrollmentPeriod.effectiveStarting || "") < new Date()) {
            this.enrollmentDateGroup.controls.effectiveStarting.disable();
            this.enrollmentDateGroup.controls.expiresAfter.disable();
        }
        if (
            this.injectedData.planYear.id === this.injectedData.latestPlanYear.id &&
            ((this.injectedData.latestApprovalRequest &&
                this.injectedData.latestApprovalRequest.status === ApprovalRequestStatus.DECLINED) ||
                !this.injectedData.latestApprovalRequest)
        ) {
            this.enrollmentDateGroup.controls.effectiveStarting.enable();
            this.enrollmentDateGroup.controls.expiresAfter.enable();
        }
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
     * The below method is bound to form control and validates enrollment start date
     * @param control is formControl value
     * @returns ValidationErrors for form-control
     */
    checkEnrollmentStartDate(control: FormControl): ValidationErrors {
        return this.checkEnrollmentDates(control, true);
    }

    /**
     * The below method is bound to form control and validates enrollment end date
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
            if (
                !isStartDate &&
                inputDate &&
                coverageDateControl?.value &&
                this.dateService.getDifferenceInDays(coverageDateControl.value, inputDate) <= this.agMinDaysDifference
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
            startDate < endDate &&
            startDate >= currentDate &&
            expiresAfterValue &&
            this.dateService.getDifferenceInDays(
                this.dateService.toDate(coverageDateControl.value),
                this.dateService.toDate(expiresAfterValue),
            ) > this.agMinDaysDifference &&
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
     * This method will be called on click of save
     * This method is used to update plan year
     */
    onSave(): void {
        if (this.aflacGroupOfferingForm.invalid) {
            return;
        }
        const planYear: PlanYear = this.constructPlanYearPayload();
        this.benefitsOfferingService
            .updatePlanYear(planYear, +this.injectedData.mpGroup, this.injectedData.planYear.id)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.dialogRef.close(true);
                },
                (errorResp) => {
                    if (
                        errorResp.status === ClientErrorResponseCode.RESP_400 &&
                        errorResp.error.code === ClientErrorResponseType.BAD_PARAMETER
                    ) {
                        if (errorResp.details) {
                            for (const detail of errorResp["details"]) {
                                this.fieldErrorMessage = this.language.fetchSecondaryLanguageValue(
                                    `secondary.portal.benefitsOffering.${errorResp.status}.${detail.code}.${detail.field}`,
                                );
                            }
                        }
                    } else if (
                        errorResp.status === ClientErrorResponseCode.RESP_409 &&
                        errorResp.error.code === ClientErrorResponseType.DUPLICATE
                    ) {
                        this.fieldErrorMessage = this.language.fetchSecondaryLanguageValue(
                            "secondary.portal.benefitsOffering.duplicatePlanYear",
                        );
                    }
                    if (!this.fieldErrorMessage) {
                        this.fieldErrorMessage = this.language.fetchSecondaryLanguageValue(
                            `secondary.api.${errorResp.status}.${errorResp.code}`,
                        );
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
