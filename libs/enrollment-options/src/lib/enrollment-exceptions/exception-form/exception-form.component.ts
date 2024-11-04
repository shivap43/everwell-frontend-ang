import { ConfigName, DateFormats, AlertType, RESIDENT_STATE, AppSettings, Exceptions, ExceptionType } from "@empowered/constants";
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ExceptionsService, AddException, AccountCallCenter, AccountList } from "@empowered/api";
import { AccountListState, StaticUtilService } from "@empowered/ngxs-store";
import { filter, map, startWith, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { Subject, combineLatest, Observable } from "rxjs";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import { DatePipe } from "@angular/common";
import { Store } from "@ngxs/store";
import { EnrollmentOptionsState } from "@empowered/ngxs-store";
import { ParentErrorStateMatcher } from "./parent-error-state-matcher";
import { ExceptionFormValidator } from "./exception-form.validators";
import { DateRangeErrorType, ExceptionFormType } from "../../models/manage-call-center.model";
import { DateService } from "@empowered/date";

const START_DATE_LIMIT_YEARS = 1;
const END_DATE_LIMIT_YEARS = 2;
const TODAY = new Date();

export type ExceptionFormAction = "ADD" | "EDIT" | "REMOVE" | "CANCEL";

interface ExceptionFormInput {
    action: ExceptionFormAction;
    inputData?: Exceptions;
    exceptionTypes?: string[];
}

@Component({
    selector: "empowered-exception-form",
    templateUrl: "./exception-form.component.html",
    styleUrls: ["./exception-form.component.scss"],
})
export class ExceptionFormComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.pinSignature.exceptionType",
        "primary.portal.pinSignature.startDate",
        "primary.portal.pinSignature.endDate",
        "primary.portal.common.save",
        "primary.portal.common.remove",
        "primary.portal.common.select",
        "primary.portal.pinSignature.newException",
        "primary.portal.pinSignature.removeExceptionContent",
        "primary.portal.common.requiredField",
        "primary.portal.common.invalidDateFormat",
        "primary.portal.coverage.cannotBePast",
        "primary.portal.pinSignature.pinSignatureException",
        "primary.portal.pinSignature.editException",
        "primary.portal.resources.invalidStartDate",
    ]);
    MAX_START_DATE = this.dateService.subtractDays(this.dateService.addYears(new Date(), START_DATE_LIMIT_YEARS), 1);
    languageSecondStringsArray: Record<string, string>;
    mpGroup = this.store.selectSnapshot(AccountListState.getMpGroupId).toString();
    exceptionForm: FormGroup;
    ExceptionType = ExceptionType;
    errorMessage = "";
    showError = false;
    maxLength = AppSettings.CALENDAR_MAX_LEN;
    private readonly unsubscribe$ = new Subject<void>();
    exceptionFormTypeEnum = ExceptionFormType;
    exceptionTypes: { name: string; value: string }[];
    startDateErrorMatcher = new ParentErrorStateMatcher(DateRangeErrorType.START);
    endDateErrorMatcher = new ParentErrorStateMatcher(DateRangeErrorType.END);
    minStartDate = new Date();
    maxStartDate = this.MAX_START_DATE;
    minEndDate = new Date();
    maxEndDate = this.dateService.addYears(new Date(), END_DATE_LIMIT_YEARS);
    maxStartDateError: string;
    minEndDateError: string;
    virtualCallCenterId: string;
    active8x8CallCenter: AccountCallCenter;
    overlapError: string;
    pinSignatureExceptionOverlapInfo: string;
    cannotAddException$: Observable<boolean>;
    alerts$: Observable<{ alertType: AlertType; content: string }[]>;
    exceptionFormValidator: ExceptionFormValidator;

    constructor(
        @Inject(MAT_DIALOG_DATA) readonly data: ExceptionFormInput,
        private readonly exceptionsService: ExceptionsService,
        private readonly language: LanguageService,
        private readonly matDialogRef: MatDialogRef<ExceptionFormComponent>,
        private readonly fb: FormBuilder,
        private readonly datePipe: DatePipe,
        private readonly store: Store,
        private readonly staticUtil: StaticUtilService,
        private readonly dateService: DateService,
    ) {
        this.exceptionFormValidator = new ExceptionFormValidator(dateService);
    }
    /**
     * on component initialization calling createFormFields function to create form fields and dispatching secondary languages in store
     */
    ngOnInit(): void {
        this.exceptionTypes = this.data.exceptionTypes.map((exceptionType) => ({
            name: this.language.fetchPrimaryLanguageValue(`primary.portal.exceptions.exceptionTypes.${exceptionType}`),
            value: exceptionType,
        }));
        this.getSecondaryLanguageKeys();
        this.getActive8x8CallCenter()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((virtualCallCenter) => {
                if (virtualCallCenter) {
                    this.init8x8CallCenterInfo(virtualCallCenter);
                }
                this.createFormFields();
                if (this.exceptionForm?.controls.type) {
                    this.alerts$ = this.exceptionForm.controls.type.valueChanges.pipe(
                        startWith(this.exceptionForm.controls.type.value),
                        withLatestFrom(
                            this.store.select(EnrollmentOptionsState.getPolicyOwnershipTypeDetails),
                            this.store.select(AccountListState.getGroup),
                        ),
                        tap(() => (this.overlapError = this.active8x8CallCenter && this.getOverlapError())),
                        map(([exceptionType, policyOwnershipTypeDetails, account]) =>
                            this.getAlerts(exceptionType, policyOwnershipTypeDetails, account),
                        ),
                    );
                    this.cannotAddException$ = this.alerts$.pipe(
                        map((alerts) => alerts.some(({ alertType }) => alertType === AlertType.DANGER)),
                    );
                }
            });

        const editMode = this.data.action === ExceptionFormType.EDIT;
        if (this.exceptionForm?.controls.validity) {
            this.getExceptionValidityChanges(
                this.exceptionForm.controls.validity as FormGroup,
                editMode && this.data.inputData.validity.effectiveStarting,
                editMode && this.data.inputData.validity.expiresAfter,
            )
                .pipe(
                    // Emit if at least one of the dates is non-null
                    filter<Date[]>((dates) => dates.some((date) => !!date)),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe(([startDate, endDate]) => this.updateDateRestrictions(startDate, endDate));
        }
    }

    /**
     * Returns alert messages to be shown to the user based on the selected exception type.
     *
     * @param exceptionType exception type
     * @param policyOwnershipTypeDetails information about whether the benefits offering
     * has individual or group plans
     * @param account account details
     * @returns list of alerts to be shown
     */
    getAlerts(
        exceptionType: ExceptionType,
        policyOwnershipTypeDetails: {
            onlyIndividualPlans: boolean;
            onlyGroupPlans: boolean;
        },
        account: AccountList,
    ): { alertType: AlertType; content: string }[] {
        const alerts = [];
        if (exceptionType === ExceptionType.ALLOWED_ENROLLMENT_EXCEPTIONS) {
            if (this.active8x8CallCenter?.tollFreeNumber) {
                alerts.push({
                    alertType: AlertType.INFO,
                    content: this.pinSignatureExceptionOverlapInfo,
                });
            }
            if (account.state === RESIDENT_STATE.NEW_YORK) {
                if (policyOwnershipTypeDetails.onlyGroupPlans) {
                    alerts.push({
                        alertType: AlertType.DANGER,
                        content: this.language.fetchPrimaryLanguageValue(
                            "primary.portal.enrollmentOptions.pinSignature.notAllowedForGroupPlansInNYState",
                        ),
                    });
                } else if (!policyOwnershipTypeDetails.onlyIndividualPlans) {
                    alerts.push({
                        alertType: AlertType.INFO,
                        content: this.language.fetchPrimaryLanguageValue(
                            "primary.portal.enrollmentOptions.pinSignature.allowedForIndividualPlanInNYState",
                        ),
                    });
                }
            }
        }
        return alerts;
    }
    /**
     * @description getting secondary language array.
     */
    getSecondaryLanguageKeys(): void {
        this.languageSecondStringsArray = this.language.fetchSecondaryLanguageValues([
            "secondary.portal.benefitsOffering.coveragedates.invalidDate",
            "secondary.portal.benefitsOffering.coveragedates.contiguous",
            "secondary.portal.benefitsOffering.coveragedates.invalidenddate",
            "secondary.portal.benefitsOffering.coveragedates.invalidStartDate",
            "secondary.portal.benefitsOffering.coveragedates.firstDateOfMonth",
            "secondary.portal.benefitsOffering.coveragedates.threeMonths",
            "secondary.portal.benefitsOffering.coveragedates.sixMonths",
            "secondary.portal.benefitsOffering.coveragedates.endDate.overlapping",
            "secondary.portal.benefitsOffering.coveragedates.startDate.overlapping",
            "secondary.portal.members.selectionRequired",
            "secondary.portal.pinSignature.addException.409.duplicate",
            "secondary.portal.pinSignature.addException.409.locked",
            "secondary.portal.benefitsOffering.coveragedates.oneYearAfterStartDate",
            "secondary.portal.benefitsOffering.coveragedates.twoYearAfterEndDate",
        ]);
    }

    /**
     * this function will make an api call to add exception
     */
    addExceptionHandler(): void {
        this.exceptionsService
            .addException(this.mpGroup, this.getExceptionToBeSaved())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.showError = false;
                    this.matDialogRef.close(ExceptionFormType.ADD);
                },
                (error) => {
                    this.showErrorMessage(error);
                },
            );
    }

    /**
     * this function will make an api call to edit exception
     */
    editExceptionHandler(): void {
        this.exceptionsService
            .updateException(this.mpGroup, this.data.inputData.id, this.getExceptionToBeSaved())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.matDialogRef.close(ExceptionFormType.EDIT);
                },
                (error) => {
                    this.showErrorMessage(error);
                },
            );
    }

    /**
     * this function will make an api call to remove exception
     */
    removeExceptionHandler(): void {
        this.exceptionsService
            .deleteException(this.mpGroup, this.data.inputData.id)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.matDialogRef.close(ExceptionFormType.REMOVE));
    }

    /**
     * this function will create form fields based on the
     * action need to be performed by the form
     */
    createFormFields(): void {
        const formType = this.data.action;
        this.exceptionForm = this.fb.group({});
        if (this.data.action !== ExceptionFormType.REMOVE) {
            this.exceptionForm.addControl(
                "type",
                this.fb.control(
                    { value: this.getDefaultExceptionType(formType), disabled: formType === ExceptionFormType.EDIT },
                    Validators.required,
                ),
            );
            this.exceptionForm.addControl(
                "validity",
                this.fb.group({
                    effectiveStarting: [
                        formType === ExceptionFormType.EDIT
                            ? this.dateService.toDate(this.data.inputData.validity.effectiveStarting || "")
                            : null,
                        [Validators.required],
                    ],
                    expiresAfter: [
                        formType === ExceptionFormType.EDIT
                            ? this.dateService.toDate(this.data.inputData.validity.expiresAfter || "")
                            : null,
                        [Validators.required],
                    ],
                }),
            );
            if (
                this.data.action === ExceptionFormType.EDIT &&
                this.dateService.isBefore(this.dateService.toDate(this.data.inputData.validity.effectiveStarting))
            ) {
                this.exceptionForm.controls.type.disable();
                this.exceptionForm.controls.validity.get("effectiveStarting").disable();
            }
            if (
                this.data.action === ExceptionFormType.EDIT &&
                this.dateService.isBefore(this.dateService.toDate(this.data.inputData.validity.expiresAfter))
            ) {
                this.exceptionForm.controls.validity.get("expiresAfter").disable();
            }
        }
        // If call center is approved, a PIN signature can be added if
        // its dates do not overlap with the call center.
        if (this.active8x8CallCenter?.tollFreeNumber) {
            this.exceptionForm.setValidators([
                this.exceptionFormValidator.dateRangeOverlapValidator(
                    this.dateService.toDate(this.active8x8CallCenter.validity.effectiveStarting),
                    this.active8x8CallCenter.validity.expiresAfter &&
                        this.dateService.toDate(this.active8x8CallCenter.validity.expiresAfter),
                ),
            ]);
        }
    }

    /**
     *this function will handle the form submit
     */
    onSubmit(): void {
        if (this.exceptionForm.invalid) {
            return;
        }
        if (this.data.action === ExceptionFormType.EDIT) {
            this.editExceptionHandler();
        } else if (this.data.action === ExceptionFormType.ADD) {
            this.addExceptionHandler();
        } else if (this.data.action === ExceptionFormType.REMOVE) {
            this.removeExceptionHandler();
        }
    }

    /**
     * this method is used to get exception object to be saved in db
     * @returns exception object formed from form control values
     */
    getExceptionToBeSaved(): AddException {
        const startDate = this.datePipe.transform(
            this.exceptionForm.controls.validity.get("effectiveStarting").value,
            AppSettings.DATE_FORMAT_YYYY_MM_DD,
        );
        const endDate = this.datePipe.transform(
            this.exceptionForm.controls.validity.get("expiresAfter").value,
            AppSettings.DATE_FORMAT_YYYY_MM_DD,
        );
        return {
            type: this.exceptionForm.controls.type.value,
            validity: {
                effectiveStarting: startDate,
                expiresAfter: endDate,
            },
        };
    }

    /**
     * this will enable the falg to show mon-alert with error message
     * @param error error object recived from api response
     */
    showErrorMessage(error: HttpErrorResponse): void {
        if (error.status === AppSettings.API_RESP_409) {
            if (error.error.code === AppSettings.DUPLICATE) {
                this.errorMessage = this.languageSecondStringsArray["secondary.portal.pinSignature.addException.409.duplicate"];
            }
            if (error.error.code === AppSettings.LOCKED) {
                this.errorMessage = this.languageSecondStringsArray["secondary.portal.pinSignature.addException.409.locked"];
            }
        } else if (error.status === AppSettings.API_RESP_400) {
            for (const detail of error.error["details"]) {
                this.errorMessage = this.language.fetchSecondaryLanguageValue(
                    `secondary.portal.pinSignature.addException.${error.error.status}.${detail.code}.${detail.field}`,
                );
            }
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.error.code}`);
        }
        this.showError = true;
    }

    /**
     * Initialize variables related to 8x8 call center.
     *
     * @param virtualCallCenter account call center
     */
    init8x8CallCenterInfo(virtualCallCenter: AccountCallCenter): void {
        this.active8x8CallCenter = virtualCallCenter;
        this.pinSignatureExceptionOverlapInfo = this.language
            .fetchPrimaryLanguageValue(
                virtualCallCenter.validity.expiresAfter
                    ? "primary.portal.enrollmentOptions.pinSignature.cannotOverlapVCCDates"
                    : "primary.portal.enrollmentOptions.pinSignature.cannotOverlapVCCDates.noEndDate",
            )
            .replace(
                "##vccstartdate##",
                this.dateService.format(this.dateService.toDate(virtualCallCenter.validity.effectiveStarting), DateFormats.MONTH_DAY_YEAR),
            )
            .replace(
                "##vccenddate##",
                this.dateService.format(this.dateService.toDate(virtualCallCenter.validity.expiresAfter || ""), DateFormats.MONTH_DAY_YEAR),
            );
    }

    /**
     * Finds and returns a 8x8 call center that has not expired yet, if it exists.
     *
     * @returns an active 8x8 call center
     */
    getActive8x8CallCenter(): Observable<AccountCallCenter> {
        return combineLatest([
            this.staticUtil.cacheConfigValue(ConfigName.CALL_CENTER_8X8_TRANSMITTAL_ALLOWED),
            this.store.select(EnrollmentOptionsState.getAccountCallCenters),
        ]).pipe(
            map(([virtualCallCenterId, accountCallCenters]) =>
                accountCallCenters?.find(
                    (accountCallCenter) =>
                        accountCallCenter.callCenter?.id === +virtualCallCenterId &&
                        (!accountCallCenter.validity.expiresAfter ||
                            this.dateService.checkIsAfter(this.dateService.toDate(accountCallCenter.validity.expiresAfter || ""))),
                ),
            ),
        );
    }

    /**
     * Get changes in the exception's validity (start and end dates).
     *
     * @param validityFormGroup form group with exception start and end date controls
     * @param initialStartDate defined if formType === ExceptionFormType.EDIT, exception start date on file
     * @param initialEndDate defined if formType === ExceptionFormType.EDIT, exception end date on file
     */
    getExceptionValidityChanges(
        validityFormGroup: FormGroup,
        initialStartDate?: Date | string,
        initialEndDate?: Date | string,
    ): Observable<Date[]> {
        return combineLatest([
            validityFormGroup.controls.effectiveStarting.valueChanges.pipe(startWith(this.dateService.toDate(initialStartDate || ""))),
            validityFormGroup.controls.expiresAfter.valueChanges.pipe(startWith(this.dateService.toDate(initialEndDate || ""))),
        ]);
    }

    /**
     * Returns the default exception type the form is pre-populated with.
     *
     * @param formType the action being performed
     * @returns default exception type
     */
    getDefaultExceptionType(formType: ExceptionFormAction): ExceptionType {
        if (formType === ExceptionFormType.EDIT) {
            // In edit mode, select the option that was chosen while adding the exception.
            return this.data.inputData.type as ExceptionType;
        }
        // In the add mode, if 8x8 call center has been approved, select disability PIN signature,
        // otherwise select PIN signature
        return this.active8x8CallCenter?.tollFreeNumber && this.data.exceptionTypes.includes(ExceptionType.ALLOWED_DISABILITY_ENROLLMENT)
            ? ExceptionType.ALLOWED_DISABILITY_ENROLLMENT
            : ExceptionType.ALLOWED_ENROLLMENT_EXCEPTIONS;
    }

    /**
     * Based on call center validity, determines the type of overlap the call
     * center may possibly have with the exception being added and based on that, determines the
     * error to be shown to the user.
     *
     * @returns error message
     */
    getOverlapError(): string {
        const callCenterEffectiveStarting = this.dateService.toDate(this.active8x8CallCenter.validity.effectiveStarting);
        const callCenterExpiresAfter = this.active8x8CallCenter.validity.expiresAfter
            ? this.dateService.toDate(this.active8x8CallCenter.validity.expiresAfter)
            : null;
        let key = "";
        if (this.exceptionForm.controls.type.value === ExceptionType.ALLOWED_ENROLLMENT_EXCEPTIONS) {
            key = this.getPINSignatureOverlapErrorKey(callCenterEffectiveStarting, callCenterExpiresAfter);
        } else if (this.exceptionForm.controls.type.value === ExceptionType.ALLOWED_DISABILITY_ENROLLMENT) {
            key = this.getDisabilityPINSignatureOverlapErrorKey(callCenterExpiresAfter);
        }

        return this.language
            .fetchSecondaryLanguageValue(key)
            .replace("##vccstartdate##", this.dateService.format(callCenterEffectiveStarting, DateFormats.MONTH_DAY_YEAR))
            .replace(
                "##vccenddate##",
                callCenterExpiresAfter
                    ? this.dateService.format(callCenterExpiresAfter, DateFormats.MONTH_DAY_YEAR)
                    : this.language.fetchSecondaryLanguageValue("secondary.portal.pinSignature.activeVCC.noEndDate"),
            );
    }

    /**
     * Returns the key for the language string for the error to be shown
     * when a PIN signature exception overlaps with a Virtual Contact Center (VCC).
     *
     * @param callCenterEffectiveStarting VCC effective starting date
     * @param callCenterExpiresAfter VCC expiry date
     * @returns language name for the error message
     */
    getPINSignatureOverlapErrorKey(callCenterEffectiveStarting: Date, callCenterExpiresAfter: Date): string {
        if (this.dateService.isBeforeOrIsEqual(callCenterEffectiveStarting)) {
            // Call center is active - can add a PIN signature after its end date.
            // Error - Must be after <VCC end date>
            return "secondary.portal.enrollmentOptions.activeVCC.exceptionStartDate.overlapping";
        }
        if (!callCenterExpiresAfter) {
            // Call center starts in the future, does not have an end date - can add PIN before start.
            // Error - Must be before <VCC start date>
            return "secondary.portal.enrollmentOptions.cannotOverlapActiveVCC";
        }
        // Call center starts in the future, has an end date - can add PIN before start or after end.
        // Error - Must be before <VCC start date> or after <VCC end date>
        return "secondary.portal.enrollmentOptions.exceptionStartDate.overlapping";
    }

    /**
     * Returns the key for the language string for the error to be shown
     * when a PIN signature exception's dates DO NOT fall between the active VCC's
     * effective starting and expiry dates.
     *
     * @param callCenterExpiresAfter VCC expiry date
     * @returns language name for the error message
     */
    getDisabilityPINSignatureOverlapErrorKey(callCenterExpiresAfter: Date): string {
        if (!callCenterExpiresAfter) {
            // Call center does not have an end date - can add disability PIN after its start date.
            // Error - Must be same as or after <VCC start date>
            return "secondary.portal.enrollmentOptions.errors.overlap.disabilityPIN.noEndDate";
        }
        // Call center has an end date - can add disability PIN between start and end dates.
        // Error - Must be between <VCC start date> and <VCC end date>
        return "secondary.portal.enrollmentOptions.errors.overlap.disabilityPIN.endDate";
    }

    /**
     * Updates start and end restrictions.
     *
     * @param startDate exception validity effective starting date
     * @param endDate exception validity expiry date
     */
    updateDateRestrictions(startDate: Date, endDate: Date): void {
        const maxStartDate =
            // If end date is defined and less than a year into the future, max start date is a day before end date.
            // If end date is defined but more than a year into the future, or if end date is not defined,
            // max start date is one day less than a year into the future.
            !endDate || this.dateService.checkIsAfter(endDate, this.MAX_START_DATE)
                ? this.MAX_START_DATE
                : this.dateService.subtractDays(endDate, 1);
        this.minEndDate = startDate ? this.dateService.addDays(startDate, 1) : TODAY;

        if (this.dateService.checkIsAfter(startDate, maxStartDate)) {
            this.maxStartDateError =
                endDate && this.dateService.checkIsAfter(startDate, endDate)
                    ? // Must be before end date.
                    this.language.fetchPrimaryLanguageValue("primary.portal.resources.invalidStartDate")
                    : // Must be within 1 year of start date
                    this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.coveragedates.maxEndDate");
        }
        if (this.dateService.isBefore(endDate, this.minEndDate)) {
            this.minEndDateError = this.dateService.isBefore(endDate)
                ? // Cannot be in the past
                this.language.fetchPrimaryLanguageValue("primary.portal.coverage.cannotBePast")
                : // Cannot be before start date
                this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.stopOffering.endDate.invalid");
        }
    }

    /**
     * this will complete the observable used in take until of all api subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
