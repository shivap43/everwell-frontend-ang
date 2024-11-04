import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { FormGroup, FormBuilder, Validators, FormArray, AbstractControl, FormControl } from "@angular/forms";
import {
    AccountCallCenter,
    DocumentApiService,
    AccountService,
    CallCenter,
    CallCenterMessageType,
    CallCenterType,
    StaticService,
    CallingSchedule,
    ProducerListItem,
} from "@empowered/api";
import { DatePipe } from "@angular/common";
import { Store } from "@ngxs/store";

import {
    ClientErrorResponseCode,
    ClientErrorResponseType,
    DateFormats,
    DATE_MASK_FORMAT,
    TimeFormats,
    AccountImportTypes,
    Validity,
    AppSettings,
    Documents,
    DateFnsFormat,
    Permission,
} from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { UserState } from "@empowered/user";

import { BehaviorSubject, combineLatest, defer, EMPTY, forkJoin, iif, Observable, of, Subject } from "rxjs";
import { NgxMaskPipe } from "ngx-mask";
import {
    catchError,
    defaultIfEmpty,
    distinctUntilChanged,
    filter,
    switchMap,
    takeUntil,
    tap,
    shareReplay,
    startWith,
    finalize,
} from "rxjs/operators";
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from "@angular/material/bottom-sheet";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { CallingScheduleTime, ManageCallCenterDialogData } from "../../models/manage-call-center.model";
import { CallCenterConfigs } from "../../models/call-center-configs.model";
import { CustomValidation, PhoneFormatConverterPipe } from "@empowered/ui";
import {
    AccountListState,
    AccountInfoState,
    SharedState,
    ExceptionBusinessService,
    EnrollmentOptionsState,
    StaticUtilService,
} from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

enum CallCenterFormFields {
    NAME = "nameControl",
    START_DATE = "startDateControl",
    END_DATE = "endDateControl",
    SPECIAL_INSTRUCTIONS = "specialInstructionsControl",
    CALL_CENTER_TYPE = "callCenterType",
    TOLL_FREE_NUMBER = "tollFreeNumber",
    TOLL_FREE_NUMBER_OPTIONS = "tollFreeNumberOptions",
    VOICEMAIL_ROUTING = "voicemailRouting",
    CALL_SCHEDULE = "callSchedule",
    MESSAGING = "messaging",
}

enum TollFreeNumberOptions {
    NEW,
    EXISTING,
}

const DAYS = "days";
const HOURS_IN_A_DAY = 24;
const CALL_CENTER_AVAILABILITY_TIME_INTERVAL_MINUTES = 30;
const CALL_SCHEDULE_DEFAULT_TIME_ZONE = "EST";
const DAYS_IN_A_WEEK = 7;
const WEEKDAY_FORMAT_LONG = "dddd";
const LAST_AVAILABLE_END_TIME = "11:59 PM";
const DOCUMENT_STATUS_COMPLETE = "COMPLETE";
const ALL_DASHES = /-/g;
const TFN_COUNTRY_CODE = "US";
const LAST_AVAILABLE_HOUR = 23;
const LAST_AVAILABLE_MINUTES = 59;

@Component({
    selector: "empowered-manage-call-center-dialog",
    templateUrl: "./manage-call-center-dialog.component.html",
    styleUrls: ["./manage-call-center-dialog.component.scss"],
})
export class ManageCallCenterDialogComponent implements OnInit, OnDestroy {
    // These are used in the template.
    TollFreeNumberOptions = TollFreeNumberOptions;
    CallCenterType = CallCenterType;
    AccountImportTypes = AccountImportTypes;
    DateFormats = DateFormats;

    manageForm: FormGroup;
    callCenters: CallCenter[] = [];
    accountCallCenters: AccountCallCenter[];
    currentCallCenter: AccountCallCenter;
    isAdd: boolean;
    currentDate = new Date();
    minStartDate: Date;
    startWarningDate: Date;
    mpGroupId: number;
    isCensusUploaded: boolean;
    overlappingRemoveCallCenter: AccountCallCenter[];
    overlappingAdjustEndCallCenter: AccountCallCenter;
    sameCallCenterOverlap: AccountCallCenter;
    sameCallCenterAdjacent: AccountCallCenter;
    isShowDateOverlapRemove: boolean;
    isShowDateOverlapAdjustEnd: boolean;
    newEndDate: Date;
    isShowStartDateWarning: boolean;
    employeesLessThan200: boolean;
    formSubmitted = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.callCenter.addcallcenter",
        "primary.portal.callCenter.editcallcenter",
        "primary.portal.callCenter.startdate",
        "primary.portal.callCenter.enddate",
        "primary.portal.common.optional",
        "primary.portal.callCenter.specialinstructions",
        "primary.portal.callCenter.name",
        "primary.portal.callCenter.employees",
        "primary.portal.common.add",
        "primary.portal.common.save",
        "primary.portal.common.close",
        "primary.portal.callCenter.eligibleEmployees",
        "primary.portal.callCenter.8x8.form.section.messaging.standardRecordingAccountName.preview",
        "primary.portal.callCenter.8x8.form.section.messaging.firstMessageAccountName.preview",
        "primary.portal.callCenter.8x8.form.section.messaging.customRecording.hint",
        "primary.portal.callCenter.8x8.form.tollFreeNumber.hint",
        "primary.portal.common.minLength",
        "primary.portal.callCenter.errors.overlappingCallCenters.single",
        "primary.portal.callCenter.errors.overlappingCallCenters.adjustDates",
        "primary.portal.callCenter.8x8.form.alert.cannotEnrollDisability",
        "primary.portal.callCenter.errors.startDateMin",
    ]);
    selectedCallCenter: CallCenter;
    private readonly unsubscribe$ = new Subject<void>();

    callCenterAvailabilityStartTimes: CallingScheduleTime[];
    callCenterAvailabilityEndTimes: CallingScheduleTime[];
    allTimes: CallingScheduleTime[];
    is8x8CallCenterSelected: boolean;
    timeZones$: Observable<string[]>;
    callCenter8x8Configs: CallCenterConfigs;
    previewEmptyAccountName = this.language.fetchPrimaryLanguageValue(
        "primary.portal.callCenter.8x8.form.section.messaging.accountName.preview.empty",
    );
    account = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
    regex = this.store.selectSnapshot(SharedState.regex);
    accountHasOnlyIndividualPlans: boolean;
    accountHasOnlyGroupPlans: boolean;
    vccCannotEnrollDisability: boolean;
    callCenterAlerts: { alertType: "info" | "danger" | "warning"; content: string }[] = [];
    enrollmentNotAllowed: boolean;
    errorMessage: string;
    apiErrorSubject$ = new BehaviorSubject<boolean>(false);
    apiError$ = this.apiErrorSubject$.asObservable();
    minEndDate: Date = new Date();
    isLoading: boolean;
    showSupportEmail: boolean;
    isRole20User = false;
    buildingBlocksRole = false;

    constructor(
        readonly bottomSheetRef: MatBottomSheetRef<ManageCallCenterDialogComponent>,
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: ManageCallCenterDialogData,
        private readonly formBuilder: FormBuilder,
        private readonly datePipe: DatePipe,
        private readonly documentApiService: DocumentApiService,
        private readonly store: Store,
        private readonly accountService: AccountService,
        private readonly language: LanguageService,
        private readonly maskPipe: NgxMaskPipe,
        private readonly staticService: StaticService,
        private readonly phoneFormatConverter: PhoneFormatConverterPipe,
        private readonly exceptionBusinessService: ExceptionBusinessService,
        private readonly dateService: DateService,
        private readonly staticUtilService: StaticUtilService,
    ) {}

    /**
     * Get call centers & employee information.
     * @returns void
     */
    ngOnInit(): void {
        this.store
            .select(SharedState.hasPermission(Permission.MANAGE_AGENT_ASSISTED))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.isRole20User = res;
            });
        this.allowBuildingBlocksRole();
        this.isShowStartDateWarning = false;
        this.isShowDateOverlapRemove = false;
        this.overlappingRemoveCallCenter = [];
        this.isShowDateOverlapAdjustEnd = false;
        this.mpGroupId = this.store.selectSnapshot(AccountListState.getMpGroupId);
        this.callCenters = this.data.callCentersList;
        this.accountCallCenters = this.data.accountCallCenters;
        if (!this.data.isAdd) {
            this.currentCallCenter = this.data.callCenter;
            this.selectedCallCenter = this.currentCallCenter && this.currentCallCenter.callCenter;
        }
        this.minStartDate = this.accountCallCenters.some((callCenter) =>
            this.dateService.isEqual(this.dateService.toDate(callCenter.validity.effectiveStarting)),
        )
            ? this.dateService.addDays(new Date(), 1)
            : this.currentDate;

        const customValidator = new CustomValidation();
        this.callCenterAvailabilityStartTimes = this.getCallCenterScheduleTimeList("start");
        this.callCenterAvailabilityEndTimes = this.getCallCenterScheduleTimeList("end");
        this.allTimes = this.getCallCenterScheduleTimeList("all");

        this.searchDocuments().subscribe();
        this.initForm(customValidator);
        this.timeZones$ = this.staticService.getTimeZones().pipe(takeUntil(this.unsubscribe$), shareReplay(1));

        // This is to remove the matDatepickerParse error that is thrown when the field is empty.
        this.manageForm.controls.endDateControl.statusChanges
            .pipe(
                takeUntil(this.unsubscribe$),
                filter(
                    (status) =>
                        status === "INVALID" &&
                        this.manageForm.controls.endDateControl.errors &&
                        this.manageForm.controls.endDateControl.errors.matDatepickerParse &&
                        !this.manageForm.controls.endDateControl.errors.matDatepickerParse.text,
                ),
                tap((status) => this.manageForm.controls.endDateControl.setErrors(null)),
            )
            .subscribe();
    }

    /**
     * Determine whether the census has been uploaded.
     *
     * @returns list of uploaded census documents
     */
    searchDocuments(): Observable<Documents> {
        return this.documentApiService
            .searchDocuments(this.mpGroupId, {
                property: "type",
                value: "CENSUS",
            })
            .pipe(
                takeUntil(this.unsubscribe$),
                catchError((error) => of(null)),
                tap(
                    (documents) =>
                        (this.isCensusUploaded =
                            documents.content &&
                            documents.content.length &&
                            documents.content.some((document) => document.status === DOCUMENT_STATUS_COMPLETE)),
                ),
            );
    }

    /**
     * Initializes the add / edit call center form.
     *
     * @param customValidator custom validation object
     */
    initForm(customValidator: CustomValidation): void {
        this.callCenter8x8Configs = this.data.configs;
        this.getRestrictionsFor8x8CallCenters();
        this.is8x8CallCenterSelected =
            this.callCenter8x8Configs.featureEnabled &&
            !this.data.isAdd &&
            this.callCenter8x8Configs.allowedCallCenterIds.includes(this.currentCallCenter.callCenter.id);
        this.manageForm = this.createForm();
        if (!this.is8x8CallCenterSelected || !this.callCenter8x8Configs.featureEnabled) {
            // Do not show the 'special instructions' field for virtual call centers (VCC).
            this.manageForm.addControl(
                CallCenterFormFields.SPECIAL_INSTRUCTIONS,
                this.getNew8x8FormControlByName(CallCenterFormFields.SPECIAL_INSTRUCTIONS),
            );
        }
        // if this is edit mode and 8x8 call center is enabled,
        // add required controls.
        if (!this.data.isAdd) {
            this.callCenterAlerts = this.getCallCenterAlerts(this.currentCallCenter.callCenter.id);
            if (this.callCenter8x8Configs.featureEnabled) {
                this.addOrRemoveControlsBasedOnSelectedCallCenter(this.currentCallCenter.callCenter.id);
            }
            this.initEditMode();
        }
        if (this.data.isAdd || this.is8x8CallCenterSelected) {
            forkJoin([
                iif(
                    () => this.data.isAdd || !this.callCenter8x8Configs.featureEnabled,
                    defer(() => this.getCallCenterNameValueChanges()),
                    defer(() => this.getObservablesBasedOnSelectedCallCenter()),
                ),
                this.getDateValueChanges(),
            ]).subscribe();
        }
    }

    /**
     * Initializes form with required controls.
     */
    createForm(): FormGroup {
        if (this.data.isAdd) {
            return this.formBuilder.group({
                nameControl: ["", Validators.required],
                startDateControl: ["", Validators.required],
                endDateControl: [""],
            });
        }
        this.minEndDate = this.dateService.max([
            new Date(),
            this.dateService.addDays(this.dateService.toDate(this.currentCallCenter.validity.effectiveStarting), 1),
        ]);
        return this.formBuilder.group({
            nameControl: [{ value: this.currentCallCenter.callCenter.id, disabled: true }, Validators.required],
            startDateControl: [
                {
                    value: this.currentCallCenter.validity.effectiveStarting,
                    disabled: this.dateService.isBeforeOrIsEqual(
                        this.dateService.toDate(this.currentCallCenter.validity.effectiveStarting),
                    ),
                },
                Validators.required,
            ],
            endDateControl: [this.currentCallCenter.validity.expiresAfter ? this.currentCallCenter.validity.expiresAfter : ""],
        });
    }

    /**
     * Initializes call center type and toll free number options for VCC.
     */
    initEditMode(): void {
        // If 8x8 call center is selected in edit mode
        if (this.is8x8CallCenterSelected) {
            // initialize call center type and toll free number options.
            if ([CallCenterType.INBOUND, CallCenterType.BOTH].includes(this.currentCallCenter.scheduleType)) {
                const fieldsToAdd = [CallCenterFormFields.CALL_SCHEDULE];
                if (this.data.numberOfMembers >= this.callCenter8x8Configs.inboundCallCenterMinEligibleEmployees) {
                    fieldsToAdd.push(CallCenterFormFields.MESSAGING);
                }
                fieldsToAdd.forEach((name) => this.manageForm.addControl(name, this.getNew8x8FormControlByName(name)));
            }

            this.updateFieldsBasedOnTollFreeNumberOption(this.manageForm.controls.tollFreeNumberOptions.value);

            // Toll-free number options and toll-free number are not editable.
            [this.manageForm.controls.tollFreeNumberOptions, this.manageForm.controls.tollFreeNumber].forEach((control) =>
                control.disable(),
            );
        }
    }

    /**
     * Close bottom sheet.
     */
    onCancel(): void {
        this.bottomSheetRef.dismiss({ action: "close" });
    }

    /**
     * method to remove and create call center
     * @returns void
     */
    deleteAndCreate(): void {
        const newCallCenter = this.getCreateCallCenterObject();

        this.removeCallCentersWithOverlappingDates()
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((deleteResponses) => this.accountService.createAccountCallCenter(this.mpGroupId.toString(), newCallCenter)),
                finalize(() => (this.isLoading = false)),
            )
            .subscribe(
                (createResponse) => this.dismissSheet("addSuccess", newCallCenter),
                (error) => {
                    this.showErrorAlertMessage(error);
                },
            );
    }

    /**
     * method to update and create call center
     * @returns void
     */
    updateAndCreateEnd(): void {
        const updateAccountCallCenter = this.getCreateCallCenterObject(true);

        this.accountService
            .updateAccountCallCenter(this.overlappingAdjustEndCallCenter.id, this.mpGroupId.toString(), updateAccountCallCenter)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((updateResult) =>
                    this.accountService.createAccountCallCenter(this.mpGroupId.toString(), this.getCreateCallCenterObject()),
                ),
                finalize(() => (this.isLoading = false)),
            )
            .subscribe(
                (createResult) => {
                    const newCallCenter = this.getCreateCallCenterObject();
                    this.dismissSheet("addSuccess", newCallCenter);
                },
                (error) => {
                    this.showErrorAlertMessage(error);
                },
            );
    }

    /**
     * method to create call center
     * @returns void
     */
    create(): void {
        const newCallCenter = this.getCreateCallCenterObject();

        this.accountService
            .createAccountCallCenter(this.mpGroupId.toString(), newCallCenter)
            .pipe(
                takeUntil(this.unsubscribe$),
                finalize(() => (this.isLoading = false)),
            )
            .subscribe(
                (createResult) => this.dismissSheet("addSuccess", newCallCenter),
                (error) => {
                    this.showErrorAlertMessage(error);
                },
            );
    }

    /**
     * method to remove and update call center
     * @returns void
     */
    deleteAndUpdate(): void {
        const newCallCenter = this.getCreateCallCenterObject();
        this.removeCallCentersWithOverlappingDates()
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((deleteResult) =>
                    this.accountService.updateAccountCallCenter(this.currentCallCenter.id, this.mpGroupId.toString(), newCallCenter),
                ),
                finalize(() => (this.isLoading = false)),
            )
            .subscribe(
                (updateResult) => this.dismissSheet("updateSuccess", newCallCenter),
                (error) => {
                    this.showErrorAlertMessage(error);
                },
            );
    }

    /**
     * method to update call center with existing values and that manage form values,
     * This will execute when overlap start and end dates
     * @returns void
     */
    updateAndUpdate(): void {
        const newCallCenter = this.getCreateCallCenterObject();
        this.accountService
            .updateAccountCallCenter(
                this.overlappingAdjustEndCallCenter.id,
                this.mpGroupId.toString(),
                this.getCreateCallCenterObject(true),
            )
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((updateResult) =>
                    this.accountService.updateAccountCallCenter(
                        this.currentCallCenter.id,
                        this.mpGroupId.toString(),
                        this.getCreateCallCenterObject(),
                    ),
                ),
                finalize(() => (this.isLoading = false)),
            )
            .subscribe(
                (updateResult) => this.dismissSheet("updateSuccess", newCallCenter),
                (error) => {
                    this.showErrorAlertMessage(error);
                },
            );
    }

    /**
     * method to update call center
     * @returns void
     */
    update(): void {
        const updateAccountCallCenter = this.getCreateCallCenterObject(false);
        const newCallCenter = this.getCreateCallCenterObject();
        this.accountService
            .updateAccountCallCenter(this.currentCallCenter.id, this.mpGroupId.toString(), updateAccountCallCenter)
            .pipe(
                takeUntil(this.unsubscribe$),
                finalize(() => (this.isLoading = false)),
            )
            .subscribe(
                (updateResult) => this.dismissSheet("updateSuccess", newCallCenter),
                (error) => {
                    this.showErrorAlertMessage(error);
                },
            );
    }

    /**
     * Closes bottom sheet with the data required for the parent component.
     * @param action indicates whether the modal added or updated call center
     * and whether the action succeeded
     * @param callCenter account call center info
     */
    dismissSheet(action: "addSuccess" | "updateSuccess", callCenter: AccountCallCenter): void {
        this.bottomSheetRef.dismiss({
            action,
            startDate: callCenter.validity.effectiveStarting,
            endDate: callCenter.validity.expiresAfter || null,
            is8x8CallCenterSelected: this.is8x8CallCenterSelected,
            account: this.account,
            currentAccountCallCenter: callCenter,
            callCenterName: this.selectedCallCenter.name,
        });
    }

    /**
     * Removes call centers with dates overlapping with those of the call center to be created.
     *
     * @returns observable that emits when all overlapping call centers have been deleted
     */
    removeCallCentersWithOverlappingDates(): Observable<HttpResponse<void>[]> {
        return forkJoin(
            this.overlappingRemoveCallCenter.map((callCenter) =>
                this.accountService.deleteAccountCallCenter(callCenter.id, this.mpGroupId),
            ),
        ).pipe(
            defaultIfEmpty(null),
            finalize(() => (this.isLoading = false)),
        );
    }

    /**
     * This function will be called on click of Add / Save button
     */
    onSubmit(): void {
        this.apiErrorSubject$.next(false);
        this.showSupportEmail = false;
        // Validate the call center availability form on submit (applies to for VCC only).
        // At least one day of the week has to be selected.
        const dailySchedule = this.getDailySchedule();

        if (dailySchedule) {
            dailySchedule.setValidators(
                (formArray: FormArray) =>
                    (formArray.controls.every((group: FormGroup) => !group.controls.selected.value) && {
                        atLeastOneDayIsRequired: true,
                    }) ||
                    null,
            );
            dailySchedule.updateValueAndValidity();
        }

        this.checkEmployees();
        if (this.manageForm.invalid) {
        } else {
            this.isLoading = true;
            this.formSubmitted = true;
            if (this.data.isAdd) {
                if (this.isSameCallCenterOverlap()) {
                    this.bottomSheetRef.dismiss({
                        action: "sameCallCenterOverlap",
                        currentAccountCallCenter: this.sameCallCenterOverlap,
                    });
                } else if (this.isSameCallCenterAdjacent()) {
                    this.bottomSheetRef.dismiss({
                        action: "sameCallCenterAdjacent",
                        currentAccountCallCenter: this.sameCallCenterAdjacent,
                    });
                } else if (this.isShowDateOverlapRemove) {
                    this.deleteAndCreate();
                } else if (this.isShowDateOverlapAdjustEnd) {
                    this.updateAndCreateEnd();
                } else {
                    this.create();
                }
            } else if (!this.data.isAdd) {
                if (this.isShowDateOverlapRemove) {
                    this.deleteAndUpdate();
                } else if (this.isShowDateOverlapAdjustEnd) {
                    this.updateAndUpdate();
                } else {
                    this.update();
                }
            }
        }
    }

    createAccountCallCenterObject(name: number, startDate: any, endDate?: any, specialInstructions?: string): AccountCallCenter {
        const validity = {
            effectiveStarting: this.datePipe.transform(startDate, "yyyy-MM-dd"),
        };
        if (endDate) {
            validity["expiresAfter"] = this.datePipe.transform(endDate, "yyyy-MM-dd");
        }
        const accountCallCenter = {
            callCenterId: name,
            validity: validity,
        };
        if (specialInstructions) {
            accountCallCenter["specialInstructions"] = specialInstructions;
        }
        return accountCallCenter;
    }

    dateTransform(dateValue: any): Date {
        const a = this.datePipe.transform(dateValue, AppSettings.DATE_FORMAT_MM_DD_YYYY);
        return this.dateService.toDate(a);
    }

    /**
     * Shows start date warning
     */
    isStartDateWarning(): void {
        const startDate = this.manageForm.getRawValue().startDateControl;
        this.isShowStartDateWarning =
            this.data.isAdd &&
            startDate &&
            this.dateService.getDifferenceInDays(this.dateService.addDays(this.dateService.toDate(startDate), 1), new Date()) <
                this.callCenter8x8Configs.callCenterStartDateFromMinDays;
    }

    datediff(dateToday: any, formDate: any): number {
        return Math.round((formDate - dateToday) / (1000 * 60 * 60 * 24));
    }

    getCallCenter(callCenterId: number): CallCenter {
        return this.callCenters.find((callCenter) => callCenter.id === callCenterId);
    }

    isShowDateOverlapRemoveWarning(): void {
        if (
            this.manageForm.getRawValue().nameControl &&
            this.manageForm.getRawValue().startDateControl &&
            this.manageForm.getRawValue().endDateControl
        ) {
            const duplicate = this.accountCallCenters.find(
                (accountCallCenter) =>
                    this.manageForm.getRawValue().nameControl === accountCallCenter.callCenter.id &&
                    this.dateTransform(accountCallCenter.validity.expiresAfter) >= this.currentDate,
            );
            // eslint-disable-next-line complexity
            const accountOverlap = this.accountCallCenters.filter((accountCallCenter) => {
                if (accountCallCenter.validity.expiresAfter) {
                    const tempDate1 = this.dateService.toDate(accountCallCenter.validity.effectiveStarting);
                    const tempDate2 = this.dateService.toDate(accountCallCenter.validity.expiresAfter);
                    return (
                        // Complete outer overlap
                        (this.dateTransform(this.manageForm.getRawValue().startDateControl) <
                            this.dateTransform(this.manageForm.getRawValue().endDateControl) &&
                            this.dateTransform(accountCallCenter.validity.effectiveStarting) >=
                                this.dateTransform(this.manageForm.getRawValue().startDateControl) &&
                            new Date(tempDate2.getFullYear(), tempDate2.getMonth(), tempDate2.getDate() - 1) <=
                                this.dateTransform(this.manageForm.getRawValue().endDateControl) &&
                            this.manageForm.getRawValue().nameControl !== accountCallCenter.callCenter.id &&
                            !duplicate) ||
                        // Complete inner overlap
                        (this.dateTransform(this.manageForm.getRawValue().startDateControl) <
                            this.dateTransform(this.manageForm.getRawValue().endDateControl) &&
                            this.dateTransform(accountCallCenter.validity.effectiveStarting) <
                                this.dateTransform(this.manageForm.getRawValue().startDateControl) &&
                            this.dateTransform(accountCallCenter.validity.expiresAfter) >
                                this.dateTransform(this.manageForm.getRawValue().endDateControl) &&
                            this.manageForm.getRawValue().nameControl !== accountCallCenter.callCenter.id &&
                            !duplicate) ||
                        // Adjust Start
                        (this.dateTransform(this.manageForm.getRawValue().startDateControl) <
                            this.dateTransform(this.manageForm.getRawValue().endDateControl) &&
                            this.dateTransform(accountCallCenter.validity.effectiveStarting) >=
                                this.dateTransform(this.manageForm.getRawValue().startDateControl) &&
                            this.dateTransform(accountCallCenter.validity.effectiveStarting) <=
                                this.dateTransform(this.manageForm.getRawValue().endDateControl) &&
                            this.dateTransform(accountCallCenter.validity.expiresAfter) >
                                this.dateTransform(this.manageForm.getRawValue().endDateControl) &&
                            this.manageForm.getRawValue().nameControl !== accountCallCenter.callCenter.id &&
                            !duplicate)
                    );
                }
                return (
                    this.dateTransform(this.manageForm.getRawValue().startDateControl) <
                        this.dateTransform(this.manageForm.getRawValue().endDateControl) &&
                    this.dateTransform(accountCallCenter.validity.effectiveStarting) >=
                        this.dateTransform(this.manageForm.getRawValue().startDateControl) &&
                    this.dateTransform(accountCallCenter.validity.effectiveStarting) <=
                        this.dateTransform(this.manageForm.getRawValue().endDateControl) &&
                    this.manageForm.getRawValue().nameControl !== accountCallCenter.callCenter.id &&
                    !duplicate
                );
            });
            if (accountOverlap.length) {
                this.overlappingRemoveCallCenter = accountOverlap;
                this.isShowDateOverlapRemove = true;
            }
        } else if (this.manageForm.getRawValue().nameControl && this.manageForm.getRawValue().startDateControl) {
            const duplicate = this.accountCallCenters.find(
                (accountCallCenter) =>
                    this.manageForm.getRawValue().nameControl === accountCallCenter.callCenter.id &&
                    this.dateTransform(accountCallCenter.validity.expiresAfter) >= this.currentDate,
            );
            const accountOverlap = this.accountCallCenters.filter((accountCallCenter) => {
                const tempDate = this.dateTransform(accountCallCenter.validity.effectiveStarting);
                return (
                    this.dateTransform(this.manageForm.getRawValue().startDateControl) <
                        new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate() + 1) &&
                    this.manageForm.getRawValue().nameControl !== accountCallCenter.callCenter.id &&
                    !duplicate
                );
            });
            if (accountOverlap.length) {
                this.overlappingRemoveCallCenter = accountOverlap;
                this.isShowDateOverlapRemove = true;
            }
        }
    }
    /**
     * function to show overlap adjust end warning based on start and end dates
     */
    isShowDateOverlapAdjustEndWarning(): void {
        if (
            this.manageForm.getRawValue().nameControl &&
            this.manageForm.getRawValue().startDateControl &&
            this.manageForm.getRawValue().endDateControl
        ) {
            const duplicate = this.accountCallCenters.find(
                (accountCallCenter) =>
                    this.manageForm.getRawValue().nameControl === accountCallCenter.callCenter.id &&
                    this.dateTransform(accountCallCenter.validity.expiresAfter) >= this.currentDate,
            );
            const accountAdjust = this.accountCallCenters.find((accountCallCenter) => {
                if (accountCallCenter.validity.expiresAfter) {
                    return (
                        this.dateTransform(this.manageForm.getRawValue().startDateControl) <
                            this.dateTransform(this.manageForm.getRawValue().endDateControl) &&
                        this.dateTransform(accountCallCenter.validity.effectiveStarting) <
                            this.dateTransform(this.manageForm.getRawValue().startDateControl) &&
                        this.dateTransform(accountCallCenter.validity.expiresAfter) >=
                            this.dateTransform(this.manageForm.getRawValue().startDateControl) &&
                        this.dateTransform(accountCallCenter.validity.expiresAfter) <=
                            this.dateTransform(this.manageForm.getRawValue().endDateControl) &&
                        this.manageForm.getRawValue().nameControl !== accountCallCenter.callCenter.id &&
                        !duplicate
                    );
                }
                return (
                    this.dateTransform(this.manageForm.getRawValue().startDateControl) <
                        this.dateTransform(this.manageForm.getRawValue().endDateControl) &&
                    this.dateTransform(accountCallCenter.validity.effectiveStarting) <
                        this.dateTransform(this.manageForm.getRawValue().startDateControl) &&
                    this.manageForm.getRawValue().nameControl !== accountCallCenter.callCenter.id &&
                    !duplicate
                );
            });
            if (accountAdjust) {
                this.overlappingAdjustEndCallCenter = accountAdjust;
                this.isShowDateOverlapAdjustEnd = true;
                const tempDate = this.dateService.toDate(this.datePipe.transform(this.manageForm.getRawValue().startDateControl));
                this.newEndDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate() - 1);
            }
        }
        if (this.manageForm.getRawValue().nameControl && this.manageForm.getRawValue().startDateControl) {
            const duplicate = this.accountCallCenters.find(
                (accountCallCenter) =>
                    this.manageForm.getRawValue().nameControl === accountCallCenter.callCenter.id &&
                    this.dateTransform(accountCallCenter.validity.expiresAfter) >= this.currentDate,
            );
            const accountAdjust = this.fetchAdjustAccountCallCenter(duplicate);
            if (accountAdjust) {
                this.overlappingAdjustEndCallCenter = accountAdjust;
                this.isShowDateOverlapAdjustEnd = true;
                const tempDate = this.dateService.toDate(this.datePipe.transform(this.manageForm.getRawValue().startDateControl));
                this.newEndDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate() - 1);
                if (
                    this.dateService.isEqual(
                        this.dateService.toDate(this.newEndDate),
                        this.dateService.toDate(this.overlappingAdjustEndCallCenter.validity.effectiveStarting),
                    )
                ) {
                    this.newEndDate = this.dateService.addDays(this.dateService.toDate(this.newEndDate), 1);
                    this.manageForm.controls.startDateControl.setValue(this.dateService.addDays(this.newEndDate, 1));
                }
            }
        }
    }
    /**
     * function to fetch ajusted account call center
     * @duplicate account call center
     * @returns AccountCallCenter
     */
    fetchAdjustAccountCallCenter(duplicate: AccountCallCenter): AccountCallCenter {
        return this.accountCallCenters.find((accountCallCenter) => {
            if (accountCallCenter.validity.expiresAfter) {
                return (
                    this.dateTransform(accountCallCenter.validity.effectiveStarting) <
                        this.dateTransform(this.manageForm.getRawValue().startDateControl) &&
                    this.dateTransform(accountCallCenter.validity.expiresAfter) >=
                        this.dateTransform(this.manageForm.getRawValue().startDateControl) &&
                    this.manageForm.getRawValue().nameControl !== accountCallCenter.callCenter.id &&
                    !duplicate
                );
            }
            return (
                this.dateTransform(accountCallCenter.validity.effectiveStarting) <
                    this.dateTransform(this.manageForm.getRawValue().startDateControl) &&
                this.manageForm.getRawValue().nameControl !== accountCallCenter.callCenter.id &&
                !duplicate
            );
        });
    }

    /**
     * Determines whether there is an overlap with dates of an exiting call center.
     *
     * @returns true if there is an overlap with dates of an exiting call center
     */
    isSameCallCenterOverlap(): boolean {
        if (
            this.data.isAdd &&
            this.manageForm.getRawValue().nameControl &&
            this.manageForm.getRawValue().startDateControl &&
            this.manageForm.getRawValue().endDateControl
        ) {
            const sameAccountOverlap = this.accountCallCenters.find((accountCallCenter) => {
                if (accountCallCenter.validity.expiresAfter) {
                    return (
                        this.manageForm.getRawValue().nameControl === accountCallCenter.callCenter.id &&
                        this.dateTransform(this.manageForm.getRawValue().startDateControl) <
                            this.dateTransform(this.manageForm.getRawValue().endDateControl) &&
                        this.dateTransform(this.manageForm.getRawValue().startDateControl) <=
                            this.dateTransform(accountCallCenter.validity.expiresAfter) &&
                        this.dateTransform(accountCallCenter.validity.expiresAfter) >= this.currentDate
                    );
                }
                return (
                    this.manageForm.getRawValue().nameControl === accountCallCenter.callCenter.id &&
                    this.dateTransform(this.manageForm.getRawValue().startDateControl) <
                        this.dateTransform(this.manageForm.getRawValue().endDateControl)
                );
            });
            if (sameAccountOverlap) {
                this.sameCallCenterOverlap = sameAccountOverlap;
                return true;
            }
        }
        if (this.data.isAdd && this.manageForm.getRawValue().nameControl && this.manageForm.getRawValue().startDateControl) {
            const sameAccountOverlap = this.accountCallCenters.find((accountCallCenter) => {
                if (accountCallCenter.validity.expiresAfter) {
                    return (
                        this.manageForm.getRawValue().nameControl === accountCallCenter.callCenter.id &&
                        this.dateTransform(this.manageForm.getRawValue().startDateControl) <=
                            this.dateTransform(accountCallCenter.validity.expiresAfter) &&
                        this.dateTransform(accountCallCenter.validity.expiresAfter) >= this.currentDate
                    );
                }
                return this.manageForm.getRawValue().nameControl === accountCallCenter.callCenter.id;
            });
            if (sameAccountOverlap) {
                this.sameCallCenterOverlap = sameAccountOverlap;
                return true;
            }
        }
        return false;
    }

    isSameCallCenterAdjacent(): boolean {
        if (
            this.data.isAdd &&
            this.manageForm.getRawValue().nameControl &&
            this.manageForm.getRawValue().startDateControl &&
            this.manageForm.getRawValue().endDateControl
        ) {
            const sameAccountAdjacent = this.accountCallCenters.find((accountCallCenter) => {
                if (accountCallCenter.validity.expiresAfter) {
                    return (
                        this.manageForm.getRawValue().nameControl === accountCallCenter.callCenter.id &&
                        this.dateTransform(this.manageForm.getRawValue().startDateControl) <
                            this.dateTransform(this.manageForm.getRawValue().endDateControl) &&
                        this.dateTransform(this.manageForm.getRawValue().startDateControl) >
                            this.dateTransform(accountCallCenter.validity.expiresAfter) &&
                        this.dateTransform(accountCallCenter.validity.expiresAfter) >= this.currentDate
                    );
                }
                return undefined;
            });
            if (sameAccountAdjacent) {
                this.sameCallCenterAdjacent = sameAccountAdjacent;
                return true;
            }
        }
        if (this.data.isAdd && this.manageForm.getRawValue().nameControl && this.manageForm.getRawValue().startDateControl) {
            const sameAccountAdjacent = this.accountCallCenters.find((accountCallCenter) => {
                if (accountCallCenter.validity.expiresAfter) {
                    return (
                        this.manageForm.getRawValue().nameControl === accountCallCenter.callCenter.id &&
                        this.datePipe.transform(this.manageForm.getRawValue().startDateControl) >
                            this.datePipe.transform(accountCallCenter.validity.expiresAfter) &&
                        this.dateTransform(accountCallCenter.validity.expiresAfter) >= this.currentDate
                    );
                }
                return undefined;
            });
            if (sameAccountAdjacent) {
                this.sameCallCenterAdjacent = sameAccountAdjacent;
                return true;
            }
        }
        return false;
    }

    /**
     * Runs start date validations.
     */
    onStartDateChange(): void {
        this.isShowStartDateWarning = false;
        this.isShowDateOverlapRemove = false;
        this.isShowDateOverlapAdjustEnd = false;
        if (this.manageForm.controls.startDateControl.value) {
            this.minEndDate = this.dateService.addDays(this.dateService.toDate(this.manageForm.controls.startDateControl.value), 1);
            this.manageForm.controls.endDateControl.updateValueAndValidity();
        } else {
            this.minEndDate = new Date();
        }
        this.isStartDateWarning();
        this.isShowDateOverlapRemoveWarning();
        this.isShowDateOverlapAdjustEndWarning();
    }

    /**
     * This function will be called on end date value change.
     * Which then compares with start date for removing and adjusting warning message.
     */
    onEndDateChange(): void {
        this.isShowDateOverlapRemove = false;
        this.isShowDateOverlapAdjustEnd = false;
        if (this.manageForm.getRawValue().endDateControl) {
            this.isShowDateOverlapRemoveWarning();
            this.isShowDateOverlapAdjustEndWarning();
        }
    }

    /**
     * This function will mask the input date into desired date format.
     * @param event will take button input event value on end date field.
     * @returns void
     */
    maskDate(event: any): void {
        if (this.manageForm.getRawValue().endDateControl) {
            event.target.value = this.maskPipe.transform(event.target.value, DATE_MASK_FORMAT);
        } else {
            this.manageForm.patchValue({
                endDateControl: "",
            });
        }
        if (this.manageForm.getRawValue().startDateControl) {
            event.target.value = this.maskPipe.transform(event.target.value, DATE_MASK_FORMAT);
        } else {
            this.manageForm.patchValue({
                startDateControl: "",
            });
        }
    }

    /**
     * Function used to check the employees count less than 200 or not
     */
    checkEmployees(): void {
        this.selectedCallCenter = this.getCallCenter(this.manageForm.getRawValue().nameControl);
        if (
            this.data.isAdd &&
            this.manageForm.getRawValue().nameControl &&
            this.data.numberOfMembers < this.selectedCallCenter.minSubscriberCount &&
            this.selectedCallCenter.messageType === CallCenterMessageType.ERROR
        ) {
            this.employeesLessThan200 = true;
            this.manageForm.markAsDirty();
        } else {
            this.employeesLessThan200 = false;
        }
    }

    /**
     * For virtual call centers, add the following fields:
     * call center type, toll-free number, toll-free number options (create new / use existing).
     * Remove special instructions.
     * For other call centers these fields are NA and should be removed.
     *
     * @param selectedCallCenterId selected call center's ID
     */
    addOrRemoveControlsBasedOnSelectedCallCenter(selectedCallCenterId: number): void {
        if (this.is8x8CallCenterSelected) {
            [
                CallCenterFormFields.CALL_CENTER_TYPE,
                CallCenterFormFields.TOLL_FREE_NUMBER,
                CallCenterFormFields.TOLL_FREE_NUMBER_OPTIONS,
            ].forEach((name) => this.manageForm.addControl(name, this.getNew8x8FormControlByName(name)));

            this.manageForm.removeControl(CallCenterFormFields.SPECIAL_INSTRUCTIONS);
            this.addVoicemailRouting();
        } else {
            this.manageForm.addControl(
                CallCenterFormFields.SPECIAL_INSTRUCTIONS,
                this.getNew8x8FormControlByName(CallCenterFormFields.SPECIAL_INSTRUCTIONS),
            );

            [
                CallCenterFormFields.CALL_CENTER_TYPE,
                CallCenterFormFields.TOLL_FREE_NUMBER,
                CallCenterFormFields.TOLL_FREE_NUMBER_OPTIONS,
                CallCenterFormFields.CALL_SCHEDULE,
                CallCenterFormFields.MESSAGING,
                CallCenterFormFields.VOICEMAIL_ROUTING,
            ].forEach((name) => this.manageForm.removeControl(name));
        }
    }

    /**
     * Enables or disables start and end times in the per-day schedule based on the 'use same dates for each day' field.
     * and on whether the day is selected.
     *
     * @param useSameDates 'use same dates' field's value
     */
    enableOrDisableRequiredControls(useSameDates: boolean): void {
        const dailySchedule = this.getDailySchedule();

        dailySchedule.controls.forEach((group: FormGroup) => {
            [group.controls.startTime, group.controls.endTime].forEach((control, i) => {
                // For each day, if 'use same dates' is selected, or if the day has not been selected,
                // disable both start and end times for that day.

                if (useSameDates || !group.controls.selected.value) {
                    control.setValue(null, { emitEvent: false });
                    control.disable({ emitEvent: false });
                } else if (!control.value) {
                    // Else set start and end dates to the default values (if the user has not already made a selection).

                    control.setValue(i === 0 ? this.callCenter8x8Configs.startTimeDefault : this.callCenter8x8Configs.endTimeDefault, {
                        emitEvent: false,
                    });
                    control.enable({ emitEvent: false });
                }
            });
        });
    }

    /**
     * Observe call center validity (start and end date) changes.
     *
     * @returns observable of start and end date value changes
     */
    getDateValueChanges(): Observable<string[]> {
        return combineLatest([
            this.manageForm.controls.startDateControl.valueChanges.pipe(startWith(this.manageForm.controls.startDateControl.value)),
            this.manageForm.controls.endDateControl.valueChanges.pipe(startWith(this.manageForm.controls.endDateControl.value)),
        ]).pipe(
            filter(
                ([startDate, endDate]) =>
                    startDate &&
                    endDate &&
                    this.dateService.isValid(this.dateService.toDate(startDate)) &&
                    this.dateService.isValid(this.dateService.toDate(endDate)),
            ),
            tap(([startDate, endDate]) => {
                this.vccCannotEnrollDisability = this.isDisabilityEnrollmentRestricted(startDate, endDate);
            }),
        );
    }

    /**
     * Observes changes to the 'call center name' field and adds / removes form controls accordingly.
     *
     * @returns observable of call center name changes
     */
    getCallCenterNameValueChanges(): Observable<unknown> {
        return this.manageForm.controls.nameControl.valueChanges.pipe(
            takeUntil(this.unsubscribe$),
            tap((selectedCallCenterId) => {
                this.selectedCallCenter = this.getCallCenter(selectedCallCenterId);
                this.manageForm.controls.startDateControl.reset();
                this.manageForm.controls.endDateControl.reset();
                this.is8x8CallCenterSelected =
                    this.callCenter8x8Configs.featureEnabled &&
                    this.callCenter8x8Configs.allowedCallCenterIds.includes(selectedCallCenterId);
                this.callCenterAlerts = this.getCallCenterAlerts(selectedCallCenterId);
            }),
            filter((selectedCallCenterId) => this.callCenter8x8Configs.featureEnabled),
            // Add or remove fields according to the selected value.
            tap((selectedCallCenterId) => this.addOrRemoveControlsBasedOnSelectedCallCenter(selectedCallCenterId)),
            switchMap((selectedCallCenterId) =>
                // If VCC has been selected, observe any changes to the newly added fields
                // to either enable / disable OR add / remove certain other fields.
                this.getObservablesBasedOnSelectedCallCenter(),
            ),
        );
    }

    /**
     * Returns form control value changes per selected call center.
     *
     * @returns observable of form control changes
     */
    getObservablesBasedOnSelectedCallCenter(): Observable<unknown[]> {
        const observables: Observable<unknown>[] = [];
        if (this.is8x8CallCenterSelected) {
            observables.push(this.getTollFreeNumberOptionsValueChanges(), this.getCallCenterTypeValueChanges());
        }
        if (this.manageForm.controls.voicemailRouting) {
            observables.push(this.getVoicemailRoutingContactAgentChanges());
        }
        if (
            this.manageForm.controls.callCenterType &&
            [CallCenterType.INBOUND, CallCenterType.BOTH].includes(this.manageForm.controls.callCenterType.value)
        ) {
            observables.push(...this.getCallingScheduleValueChanges());
        }

        return iif(
            () => this.is8x8CallCenterSelected && observables.length > 0,
            defer(() => forkJoin(observables)),
            EMPTY,
        );
    }

    /**
     * Observes changes to the 'toll-free number options' field.
     *
     * @returns observable that is notified when 'toll-free number options' change
     */
    getTollFreeNumberOptionsValueChanges(): Observable<TollFreeNumberOptions> {
        return this.manageForm.controls.tollFreeNumberOptions.valueChanges.pipe(
            takeUntil(this.unsubscribe$),
            tap((option) => this.updateFieldsBasedOnTollFreeNumberOption(option)),
        );
    }

    /**
     * Disable / enable or add / remove form fields according to the selected toll-free number option.
     *
     * @param option selected toll free number option ('use existing' / 'create new')
     */
    updateFieldsBasedOnTollFreeNumberOption(option: TollFreeNumberOptions): void {
        if (option === TollFreeNumberOptions.NEW) {
            this.manageForm.controls.tollFreeNumber.disable();
            this.manageForm.controls.callCenterType.enable();
            if (this.data.isAdd) {
                this.manageForm.controls.tollFreeNumber.reset();
                this.manageForm.controls.callCenterType.setValue(CallCenterType.OUTBOUND);
            }
        } else {
            this.manageForm.controls.tollFreeNumber.enable();
            this.manageForm.controls.callCenterType.reset();

            this.manageForm.controls.callCenterType.disable();
            [CallCenterFormFields.VOICEMAIL_ROUTING, CallCenterFormFields.MESSAGING, CallCenterFormFields.CALL_SCHEDULE].forEach((name) =>
                this.manageForm.removeControl(name),
            );
        }
    }

    /**
     * Observes changes to the 'call center type' field
     * and adds / removes certain other fields based on the change
     *
     * @returns observable that is notified when 'call center type' changes
     */
    getCallCenterTypeValueChanges(): Observable<(string | string[])[]> {
        const inboundCallCenters = [CallCenterType.INBOUND, CallCenterType.BOTH];
        return this.manageForm.controls.callCenterType.valueChanges.pipe(
            takeUntil(this.unsubscribe$),
            distinctUntilChanged(
                (prevValue, currValue) =>
                    // Only update if the value changes from one of 'inbound' and 'both' to 'outbound' (or vice versa).
                    // If it was changed from 'inbound' to 'both' (or vice versa), no changes are needed.
                    prevValue === currValue || [prevValue, currValue].every((value) => inboundCallCenters.includes(value)),
            ),
            tap((callCenterType) => {
                if (!this.manageForm.controls.voicemailRouting) {
                    this.addVoicemailRouting();
                }
                if ([CallCenterType.INBOUND, CallCenterType.BOTH].includes(callCenterType)) {
                    const fieldsToAdd = [CallCenterFormFields.CALL_SCHEDULE];
                    if (this.data.numberOfMembers >= this.callCenter8x8Configs.inboundCallCenterMinEligibleEmployees) {
                        fieldsToAdd.push(CallCenterFormFields.MESSAGING);
                    }
                    fieldsToAdd.forEach((name) => this.manageForm.addControl(name, this.getNew8x8FormControlByName(name)));
                } else {
                    // Outbound
                    [CallCenterFormFields.CALL_SCHEDULE, CallCenterFormFields.MESSAGING, CallCenterFormFields.VOICEMAIL_ROUTING].forEach(
                        (name) => this.manageForm.removeControl(name),
                    );
                }
            }),
            filter((callCenterType) => inboundCallCenters.includes(callCenterType)),
            switchMap((callCenterType) => forkJoin(this.getCallingScheduleValueChanges())),
        );
    }

    /**
     * Returns observables for calling schedule changes.
     *
     * @returns list of observables for calling schedule changes
     */
    getCallingScheduleValueChanges(): Observable<string | string[]>[] {
        const weeklySchedule = this.getWeeklySchedule();
        const observables$: Observable<string | string[]>[] = [
            this.getUseSameTimeForEachDayValueChanges(),
            this.getSelectedDaysValueChanges(),
            this.getStartTimeValueChangesForDailyScheduleForm(),
            this.getEndTimeValueChangesForDailyScheduleForm(),
        ];
        if (weeklySchedule.controls.startTime && weeklySchedule.controls.endTime) {
            observables$.push(this.getStartTimeValueChanges(weeklySchedule), this.getEndTimeValueChanges(weeklySchedule));
        }
        return observables$;
    }

    /**
     * Observes changes to the 'use same values for each day' field
     * and adds / removes fields for start time, end time and time zone.
     *
     * @returns observable that is notified when 'use same values for each day' changes
     */
    getUseSameTimeForEachDayValueChanges(): Observable<string[]> {
        const callSchedule = this.getCallSchedule();
        const weeklySchedule = this.getWeeklySchedule();

        return callSchedule.controls.useSameTimesForEachDay.valueChanges.pipe(
            takeUntil(this.unsubscribe$),
            tap((useSameDates) => {
                if (useSameDates) {
                    weeklySchedule.addControl("startTime", this.formBuilder.control(this.callCenter8x8Configs.startTimeDefault));
                    weeklySchedule.addControl("endTime", this.formBuilder.control(this.callCenter8x8Configs.endTimeDefault));
                } else {
                    weeklySchedule.removeControl("startTime");
                    weeklySchedule.removeControl("endTime");
                }
                this.enableOrDisableRequiredControls(useSameDates);
            }),
            filter<boolean>(Boolean),
            switchMap((useSameDates) =>
                forkJoin([this.getStartTimeValueChanges(weeklySchedule), this.getEndTimeValueChanges(weeklySchedule)]),
            ),
        );
    }

    /**
     * Observes changes to selected days,
     * enables / disables start and end times for these days.
     *
     * @returns observable that is notified when the list of selected days for call center availability changes
     */
    getSelectedDaysValueChanges(): Observable<string[]> {
        const callSchedule = this.getCallSchedule();
        const dailySchedule = this.getDailySchedule();

        return dailySchedule.valueChanges.pipe(
            takeUntil(this.unsubscribe$),
            distinctUntilChanged((prevSchedule, currSchedule) =>
                // Only detect changes to list of selected days; ignore changes to other fields in the form group.
                prevSchedule.map((day) => day.selected).every((selectedDay, index) => selectedDay === currSchedule[index].selected),
            ),
            tap((value) => this.enableOrDisableRequiredControls(callSchedule.controls.useSameTimesForEachDay.value)),
        );
    }

    /**
     * Observes changes in 'producer' dropdown in the voicemail routing form.
     * Updates the 'name' and 'email' inputs to required or optional according to whether a selection has been made.
     *
     * @returns observable of changes in selected producer
     */
    getVoicemailRoutingContactAgentChanges(): Observable<string[]> {
        const voicemailRouting = this.manageForm.controls.voicemailRouting as FormGroup;
        return voicemailRouting.controls.selectedProducer.valueChanges.pipe(
            takeUntil(this.unsubscribe$),
            tap((status) => {
                // If the user selects the 'Other' option, require 'name' and 'email' inputs.
                voicemailRouting.controls.contactAgentName.reset();
                voicemailRouting.controls.contactAgentEmail.reset();
                if (!voicemailRouting.controls.selectedProducer.value) {
                    voicemailRouting.controls.contactAgentName.setValidators([Validators.required, CustomValidation.nameValidator]);
                    voicemailRouting.controls.contactAgentEmail.setValidators([Validators.required, Validators.pattern(this.regex.EMAIL)]);
                } else {
                    voicemailRouting.controls.contactAgentName.clearValidators();
                    voicemailRouting.controls.contactAgentEmail.clearValidators();
                }
                voicemailRouting.controls.contactAgentName.updateValueAndValidity();
                voicemailRouting.controls.contactAgentEmail.updateValueAndValidity();
            }),
        );
    }

    /**
     * Observes changes to start times of selected days
     * and sets field errors.
     *
     * @returns observable that is notified the start time for any day changes
     */
    getStartTimeValueChangesForDailyScheduleForm(): Observable<string[]> {
        const dailySchedule = this.getDailySchedule();

        return forkJoin(dailySchedule.controls.map((group: FormGroup) => this.getStartTimeValueChanges(group)));
    }

    /**
     * Observes changes to end times of selected days
     * and sets field errors.
     *
     * @returns observable that is notified the end time for any day changes
     */
    getEndTimeValueChangesForDailyScheduleForm(): Observable<string[]> {
        const dailySchedule = this.getDailySchedule();

        return forkJoin(dailySchedule.controls.map((group: FormGroup) => this.getEndTimeValueChanges(group)));
    }

    /**
     * Observes changes to start times of selected days
     * and sets field errors.
     *
     * @param group form group which has the date field
     * @returns observable that is notified the start time for any day changes
     */
    getStartTimeValueChanges(group: FormGroup): Observable<string> {
        return group.controls.startTime.valueChanges.pipe(
            takeUntil(this.unsubscribe$),
            distinctUntilChanged(),
            tap((startTime) => {
                // For each control (day), if selected start time is after end time, flag the start time field as erroneous.
                // Do not show errors on end date.
                group.controls.startTime.setErrors(
                    group.controls.endTime.value &&
                        this.allTimes.findIndex((time) => time.value === startTime) >=
                            this.allTimes.findIndex((time) => time.value === group.controls.endTime.value)
                        ? { invalid: true }
                        : null,
                );
                group.controls.endTime.setErrors(null);
                group.controls.startTime.markAsTouched();
                group.controls.endTime.markAsTouched();
            }),
        );
    }

    /**
     * Observes changes to end times of selected days
     * and sets field errors.
     *
     * @param group form group which has the date field
     * @returns observable that is notified the end time for any day changes
     */
    getEndTimeValueChanges(group: FormGroup): Observable<string> {
        return group.controls.endTime.valueChanges.pipe(
            takeUntil(this.unsubscribe$),
            distinctUntilChanged(),
            tap((endTime) => {
                // For each control (day), if selected end time is before start time, flag the end time field as erroneous.
                // Do not show errors on start date.
                group.controls.endTime.setErrors(
                    group.controls.startTime.value &&
                        this.allTimes.findIndex((time) => time.value === endTime) <=
                            this.allTimes.findIndex((time) => time.value === group.controls.startTime.value)
                        ? { invalid: true }
                        : null,
                );
                group.controls.startTime.setErrors(null);
                group.controls.startTime.markAsTouched();
                group.controls.endTime.markAsTouched();
            }),
        );
    }

    /**
     * Returns the call schedule form group.
     *
     * @returns call schedule
     */
    getCallSchedule(): FormGroup {
        return this.manageForm.controls.callSchedule as FormGroup;
    }

    /**
     * Returns the weekly schedule form array if it exists.
     *
     * @returns weekly schedule
     */

    getWeeklySchedule(): FormGroup {
        const callSchedule = this.getCallSchedule();
        return callSchedule && (callSchedule.controls.weeklySchedule as FormGroup);
    }

    /**
     * Returns the daily schedule form array if it exists.
     *
     * @returns daily schedule
     */
    getDailySchedule(): FormArray {
        const callSchedule = this.getCallSchedule();
        return callSchedule && (callSchedule.controls.dailySchedule as FormArray);
    }

    /**
     * Creates a new form control for the 8x8virtual call center form based on the field name and returns it.
     *
     * @param name form control's name
     * @returns newly created form control whose name is @param name
     */
    getNew8x8FormControlByName(name: CallCenterFormFields): AbstractControl {
        let control: AbstractControl;
        switch (name) {
            case CallCenterFormFields.CALL_CENTER_TYPE:
                control = this.formBuilder.control(
                    this.data.isAdd || !this.currentCallCenter.scheduleType ? CallCenterType.OUTBOUND : this.currentCallCenter.scheduleType,
                );
                break;

            case CallCenterFormFields.CALL_SCHEDULE:
                control =
                    this.data.isAdd || !(this.currentCallCenter.schedules && this.currentCallCenter.schedules.length)
                        ? this.getAddCallScheduleFormGroup()
                        : this.getEditCallScheduleFormGroup();
                break;

            case CallCenterFormFields.MESSAGING:
                control = this.getMessagingFormGroup();
                break;

            case CallCenterFormFields.SPECIAL_INSTRUCTIONS:
                control = this.formBuilder.control((this.currentCallCenter && this.currentCallCenter.specialInstructions) || "");
                break;

            case CallCenterFormFields.TOLL_FREE_NUMBER:
                control = this.getTollFreeNumberControl();
                break;

            case CallCenterFormFields.TOLL_FREE_NUMBER_OPTIONS:
                control = this.formBuilder.control(
                    this.data.isAdd || this.currentCallCenter.scheduleType ? TollFreeNumberOptions.NEW : TollFreeNumberOptions.EXISTING,
                );
                break;

            case CallCenterFormFields.VOICEMAIL_ROUTING:
                control = this.getVoicemailRoutingFormGroup();
                break;
            default:
                control = this.formBuilder.control(null);
        }
        return control;
    }

    /**
     * Creates and initializes a new form group to add a call center schedule.
     *
     * @returns call schedule form group
     */
    getAddCallScheduleFormGroup(): FormGroup {
        return this.formBuilder.group({
            useSameTimesForEachDay: [true],

            // weeklySchedule has the following fields: timeZone, startTime, endTime
            // startTime and endTime are added / removed based on 'useSameTimesForEachDay'
            weeklySchedule: this.formBuilder.group({
                startTime: this.callCenter8x8Configs.startTimeDefault,
                endTime: this.callCenter8x8Configs.endTimeDefault,
                timeZone: [CALL_SCHEDULE_DEFAULT_TIME_ZONE],
            }),
            // dailySchedule is an array of form groups, one for each of the days of a week.
            // Its value is of the form: [{ day: 'Monday', selected: true, startTime: "8:00 AM", endTime: "5:00 PM" } ...].
            // If useSameTimesForEachDay is true, only the selected days ('selected' field) matter.
            dailySchedule: this.formBuilder.array(
                this.getDaysOfTheWeek().map((day) =>
                    this.formBuilder.group({
                        day, // Day of the week
                        selected: [false], // Whether the day has been selected
                        startTime: [{ value: null, disabled: true }], // Call center availability start time for the day
                        endTime: [{ value: null, disabled: true }], // Call center availability end time for the day
                    }),
                ),
            ),
        });
    }

    /**
     * Creates and initializes a new form group to edit a call center schedule.
     *
     * @returns call schedule form group
     */
    getEditCallScheduleFormGroup(): FormGroup {
        // set this to true if for all days, the start and end times are the same
        const useSameTimesForEachDay = this.currentCallCenter.schedules.every(
            (dailySchedule) =>
                dailySchedule.startTime === this.currentCallCenter.schedules[0].startTime &&
                dailySchedule.endTime === this.currentCallCenter.schedules[0].endTime,
        );

        const weeklySchedule: { timeZone: string; startTime?: string; endTime?: string } = {
            timeZone: this.currentCallCenter.schedules[0].timeZoneAbbreviation,
        };

        if (useSameTimesForEachDay) {
            weeklySchedule.startTime = this.currentCallCenter.schedules[0].startTime as string;
            weeklySchedule.endTime = this.currentCallCenter.schedules[0].endTime as string;
        }
        return this.formBuilder.group({
            useSameTimesForEachDay: [useSameTimesForEachDay],
            weeklySchedule: this.formBuilder.group(weeklySchedule),
            dailySchedule: this.formBuilder.array(
                // add a form group for each day, selected or not
                this.getDaysOfTheWeek().map((day) => {
                    const selected = this.currentCallCenter.schedules.find((schedule) => schedule.day.toLowerCase() === day.toLowerCase());
                    const disabled = useSameTimesForEachDay || !selected;
                    return this.formBuilder.group({
                        day, // Day of the week
                        selected: [!!selected], // Whether the day has been selected
                        startTime: [
                            {
                                value: !useSameTimesForEachDay && selected ? selected.startTime : null,
                                disabled: useSameTimesForEachDay || !selected,
                            },
                        ], // Call center availability start time for the day
                        endTime: [
                            {
                                value: !disabled ? selected.endTime : null,
                                disabled,
                            },
                        ], // Call center availability end time for the day
                    });
                }),
            ),
        });
    }

    /**
     * Creates and returns a new form group for messaging initialized according to whether
     * the for is to add or edit the call center.
     *
     * @returns form group with a controls for account name, custom recording and Spanish language assistance
     */
    getMessagingFormGroup(): FormGroup {
        const accountNameValidators = [
            Validators.required,
            CustomValidation.nameWithHyphensAndApostrophes,
            Validators.minLength(this.callCenter8x8Configs.accountNameMinLength),
            Validators.maxLength(this.callCenter8x8Configs.accountNameMaxLength),
        ];
        return this.formBuilder.group({
            standardRecordingAccountName: [
                this.data.isAdd || !this.currentCallCenter.recordingStandardAccountName
                    ? this.account.name
                    : this.currentCallCenter.recordingStandardAccountName,
                {
                    validators: accountNameValidators,
                    updateOn: "blur",
                },
            ],
            firstMessageAfterHourAccountName: [
                this.data.isAdd || !this.currentCallCenter.recordingAfterHoursAccountName
                    ? this.account.name
                    : this.currentCallCenter.recordingAfterHoursAccountName,
                { validators: accountNameValidators, updateOn: "blur" },
            ],
            customRecordingMessage: [this.data.isAdd ? "" : this.currentCallCenter.recordingCustomMessage, { updateOn: "blur" }],
            spanishIndicator: [this.data.isAdd ? false : !!this.currentCallCenter.spanishAssistance],
        });
    }

    /**
     * Creates and returns a new form group for voicemail routing initialized according to whether
     * the for is to add or edit the call center.
     *
     * @returns form group with a control to select a producer from a dropdown
     * and controls to enter a name and email manually.
     */
    getVoicemailRoutingFormGroup(): FormGroup {
        const signedInProducer = this.store.selectSnapshot(UserState);
        let defaultProducer: number | ProducerListItem = 0;
        if (this.data.isAdd || !(this.currentCallCenter.contactAgentName && this.currentCallCenter.contactAgentEmail)) {
            defaultProducer = this.data.producers.content.find(
                (producer) => producer.id === (signedInProducer && signedInProducer.producerId),
            );
        } else if (this.currentCallCenter.contactAgentName && this.currentCallCenter.contactAgentEmail) {
            const [firstName, lastName] = this.currentCallCenter.contactAgentName.split(" ");
            defaultProducer = this.data.producers.content.find(
                (producer) =>
                    producer.email === this.currentCallCenter.contactAgentEmail &&
                    producer.name.firstName === firstName &&
                    producer.name.lastName === lastName,
            );
        }

        const validators = defaultProducer ? [] : [Validators.required];
        return this.formBuilder.group({
            selectedProducer: [defaultProducer || 0],
            contactAgentName: [
                defaultProducer ? "" : (!this.data.isAdd && this.currentCallCenter.contactAgentName) || "",
                { validators: [CustomValidation.nameValidator, ...validators], updateOn: "blur" },
            ],
            contactAgentEmail: [
                defaultProducer ? "" : (!this.data.isAdd && this.currentCallCenter.contactAgentEmail) || "",
                {
                    validators: [Validators.pattern(this.regex.EMAIL), ...validators],
                    updateOn: "blur",
                },
            ],
        });
    }

    /**
     * Creates control for toll-free number.
     *
     * @returns form control for toll-free number
     */
    getTollFreeNumberControl(): FormControl {
        return this.formBuilder.control(
            {
                value:
                    this.data.isAdd || this.currentCallCenter.scheduleType
                        ? ""
                        : this.phoneFormatConverter.transform(this.currentCallCenter.tollFreeNumber, TFN_COUNTRY_CODE, true),
                disabled: true,
            },
            {
                validators: [Validators.pattern(this.regex.TOLL_FREE_NUMBER), Validators.required],
                updateOn: "blur",
            },
        );
    }

    /**
     * Generates a list of alerts (info/warning/danger) to be displayed for the selected call center.
     *
     * @returns list of objects with info about the alert type and the message
     */
    getCallCenterAlerts(callCenterId: number): { alertType: "info" | "warning" | "danger"; content: string }[] {
        this.employeesLessThan200 = false;
        const alerts = [];
        const callCenter = this.getCallCenter(callCenterId);
        const isNYAccount = this.account.situs.state.abbreviation === "NY";
        const vcc = "##vcc##";
        if (this.is8x8CallCenterSelected && isNYAccount && this.accountHasOnlyGroupPlans) {
            this.enrollmentNotAllowed = true;
            alerts.push({
                alertType: "danger",
                content: this.language
                    .fetchPrimaryLanguageValue("primary.portal.callCenter.8x8.form.alert.NY.enrollmentNotAllowed")
                    .replace(vcc, callCenter.name),
            });
        } else {
            this.enrollmentNotAllowed = false;
            const employees = this.language.fetchPrimaryLanguageValue("primary.portal.callCenter.employees");
            if (!this.callCenter8x8Configs.featureEnabled) {
                const verbiage = this.language.fetchPrimaryLanguageValue(
                    "primary.portal.callCenter." + (!this.isCensusUploaded ? "recommendsMinimum" : "requiresMinimum"),
                );
                const content = `${callCenter.name} ${verbiage} ${callCenter.minSubscriberCount} ${employees}`;
                if (!this.isCensusUploaded) {
                    alerts.push({ alertType: "info", content });
                } else if (this.data.numberOfMembers < callCenter.minSubscriberCount) {
                    alerts.push({ alertType: "warning", content });
                }
            }
            // Do not show the required alert when adding a call center if user is a BB role and BB call center is selected
            if ((this.data.isAdd && !this.buildingBlocksRole) || (this.buildingBlocksRole && callCenter.name !== "Building Blocks")) {
                alerts.push({
                    alertType: "info",
                    content: `${callCenter.name} ${this.language.fetchPrimaryLanguageValue("primary.portal.callCenter.requiresApproval")}`,
                });
            }

            if (this.is8x8CallCenterSelected && isNYAccount && !this.accountHasOnlyGroupPlans && !this.accountHasOnlyIndividualPlans) {
                alerts.push({
                    alertType: "info",
                    content: this.language
                        .fetchPrimaryLanguageValue("primary.portal.callCenter.8x8.form.alert.NY.individualEnrollmentsAllowed")
                        .replace(vcc, callCenter.name),
                });
            }
        }
        return alerts;
    }

    /**
     * Sets any restrictions on adding an 8x8 virtual call center.
     */
    getRestrictionsFor8x8CallCenters(): void {
        const policyOwnershipTypeDetails = this.store.selectSnapshot(EnrollmentOptionsState.getPolicyOwnershipTypeDetails);
        this.accountHasOnlyIndividualPlans = policyOwnershipTypeDetails?.onlyIndividualPlans;

        this.accountHasOnlyGroupPlans = policyOwnershipTypeDetails?.onlyGroupPlans;

        this.vccCannotEnrollDisability = this.isDisabilityEnrollmentRestricted(
            this.data.isAdd ? undefined : this.currentCallCenter.validity.effectiveStarting,
            this.data.isAdd || !this.currentCallCenter.validity.expiresAfter ? undefined : this.currentCallCenter.validity.expiresAfter,
        );
    }

    /**
     * Returns whether disability enrollment is restricted for VCC.
     *
     * @param effectiveStarting call center validity start date
     * @param expiresAfter call center validity end date
     * @returns whether disability enrollment is restricted for VCC
     */
    isDisabilityEnrollmentRestricted(effectiveStarting: string | Date, expiresAfter: string | Date): boolean {
        return this.exceptionBusinessService.isDisabilityEnrollmentRestricted(
            this.data.numberOfMembers,
            this.callCenter8x8Configs.disabilityEnrollmentMinEmployees,
            this.data.pinSignatureExceptions,
            this.data.planChoices,
            { effectiveStarting, expiresAfter },
        );
    }

    /**
     * Get an array of days of the week in the required format.
     *
     * @returns days of the week starting Monday
     */
    getDaysOfTheWeek(): string[] {
        return this.dateService.getWeekdaysName(DAYS_IN_A_WEEK);
    }

    /**
     * This function is used to determine account 8x8 call center object needs to created from manage form or use exiting values.
     * @param manageForm form group which has manage form values from UI.
     * @param overLappingAdjust boolean - determine if values need to get from manage form (from UI) or not.
     * @returns AccountCallCenter object
     */
    createAccount8x8CallCenterObject(manageForm: FormGroup, overLappingAdjust: boolean): AccountCallCenter {
        let accountCallCenter: AccountCallCenter;
        const formValue = manageForm.getRawValue();
        if (overLappingAdjust) {
            const validity: Validity = {
                effectiveStarting: this.datePipe.transform(
                    this.overlappingAdjustEndCallCenter.validity.effectiveStarting,
                    DateFormats.YEAR_MONTH_DAY,
                ),
            };
            if (this.newEndDate) {
                validity.expiresAfter = this.datePipe.transform(this.newEndDate, DateFormats.YEAR_MONTH_DAY);
            }
            accountCallCenter = {
                callCenterId: this.overlappingAdjustEndCallCenter.callCenter.id,
                validity: validity,
            };
            if (this.overlappingAdjustEndCallCenter.specialInstructions) {
                accountCallCenter["specialInstructions"] = this.overlappingAdjustEndCallCenter.specialInstructions;
            }
        } else {
            const endDate = formValue.endDateControl;
            const validity: Validity = {
                effectiveStarting: this.datePipe.transform(formValue.startDateControl, DateFormats.YEAR_MONTH_DAY),
            };
            if (endDate) {
                validity.expiresAfter = this.datePipe.transform(endDate, DateFormats.YEAR_MONTH_DAY);
            }
            if (this.is8x8CallCenterSelected) {
                // Account Virtual Contact Center selected.
                accountCallCenter = this.virtualContactCenterSelected(manageForm, validity);
            } else {
                // Other Account Call Center selected.
                accountCallCenter = {
                    callCenterId: formValue.nameControl,
                    validity: validity,
                };
                if (formValue.specialInstructionsControl) {
                    accountCallCenter.specialInstructions = formValue.specialInstructionsControl;
                }
            }
        }
        return accountCallCenter;
    }
    /**
     * This function is used to create account 8x8 call center object base on Toll free number selection (new/existing).
     * @param manageForm form group which has manage form values from UI.
     * @param validity validity object which contains start date and end date.
     * @returns AccountCallCenter object
     */
    virtualContactCenterSelected(manageForm: FormGroup, validity: Validity): AccountCallCenter {
        const formValue = manageForm.getRawValue();
        const tollFreeNumber = formValue.tollFreeNumber ? formValue.tollFreeNumber.replace(ALL_DASHES, "") : undefined;
        const schedules = formValue.callSchedule ? this.createCallingScheduleArray() : undefined;
        const scheduleType = formValue.callCenterType || undefined;

        let voicemailRouting;
        if (formValue.voicemailRouting) {
            voicemailRouting =
                formValue.voicemailRouting.selectedProducer === 0
                    ? {
                          contactAgentName: formValue.voicemailRouting.contactAgentName.trim(),
                          contactAgentEmail: formValue.voicemailRouting.contactAgentEmail.trim(),
                      }
                    : {
                          // eslint-disable-next-line max-len
                          contactAgentName: `${formValue.voicemailRouting.selectedProducer.name.firstName} ${formValue.voicemailRouting.selectedProducer.name.lastName}`,
                          contactAgentEmail: formValue.voicemailRouting.selectedProducer.email,
                      };
        }

        const messaging = formValue.messaging
            ? {
                  recordingStandardAccountName: formValue.messaging.standardRecordingAccountName,
                  recordingAfterHoursAccountName: formValue.messaging.firstMessageAfterHourAccountName,
                  recordingCustomMessage: formValue.messaging.customRecordingMessage,
                  spanishAssistance: formValue.messaging.spanishIndicator,
              }
            : {};

        const callCenter = {
            callCenterId: formValue.nameControl,
            validity,
            tollFreeNumber,
            scheduleType,
            ...voicemailRouting,
            ...messaging,
        };

        return (formValue.tollFreeNumberOptions === TollFreeNumberOptions.NEW && formValue.callCenterType === CallCenterType.OUTBOUND) ||
            !formValue.callCenterType
            ? // when the user selects new TFN (Account Virtual Contact Center New) and call center type is Outbound
              callCenter
            : // when the user selects new TFN (Account Virtual Contact Center New) and call center type is Inbound/Both
              { ...callCenter, schedules };
    }

    /**
     * This function is used to create calling schedule array.
     * @returns Array of CallingSchedule
     */
    createCallingScheduleArray(): CallingSchedule[] {
        let callingSchedule: CallingSchedule[];
        const weeklySchedule = this.manageForm.controls.callSchedule.value.weeklySchedule;
        // get selected days from daily schedule object and remove selected property from it.
        const selectedDays = this.manageForm.controls.callSchedule.value.dailySchedule
            .filter((day) => day.selected === true)
            .map(({ selected, ...schedule }) => ({
                day: schedule.day.toUpperCase(),
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                timeZoneAbbreviation: weeklySchedule.timeZone,
            }));
        // Add timeZone property to each to calling schedule object
        callingSchedule = selectedDays.map((schedule) => ({
            ...schedule,
            timeZoneAbbreviation: weeklySchedule.timeZone,
        }));
        if (this.manageForm.controls.callSchedule.value.useSameTimesForEachDay) {
            // If start/end time are different for each day then add startTime and endTime property to each to calling schedule object
            callingSchedule = selectedDays.map((schedule) => ({
                ...schedule,
                day: schedule.day.toUpperCase(),
                startTime: weeklySchedule.startTime,
                endTime: weeklySchedule.endTime,
            }));
        }
        return callingSchedule;
    }

    /**
     * Method to handle error message
     * @param httpError {HttpErrorResponse} is used to receive error object
     */
    showErrorAlertMessage(httpError: HttpErrorResponse): void {
        this.apiErrorSubject$.next(true);
        if (httpError.error && httpError.error.status) {
            let errorKey;
            if (httpError.error.details && httpError.error.details.length) {
                // eslint-disable-next-line max-len
                errorKey = `secondary.portal.callCenter.8x8.api.${httpError.error.status}.${httpError.error.code}.${httpError.error.details[0].field}`;
                if (
                    httpError.error.status === ClientErrorResponseCode.RESP_400 &&
                    httpError.error.code === ClientErrorResponseType.BAD_PARAMETER &&
                    httpError.error.details.some((detail) => detail.field === "tollFreeNumber")
                ) {
                    this.manageForm.controls.tollFreeNumber?.setErrors({
                        notFound: true,
                    });
                    this.showSupportEmail = true;
                }
            } else {
                errorKey = `secondary.portal.callCenter.8x8.api.${httpError.error.status}.${httpError.error.code}`;
            }
            this.errorMessage =
                this.language.fetchSecondaryLanguageValue(errorKey) ||
                this.language.fetchSecondaryLanguageValue("secondary.portal.callCenter.8x8.api.common.error.message");
        } else {
            this.bottomSheetRef.dismiss({ action: "close" });
        }
    }

    /**
     * Creates call center object to be passed to the 'createAccountCallCenter' endpoint.
     *
     * @param fromOverlappingCallCenter whether to create call center from form values or from an overlapping call center
     * @returns account call center
     */
    getCreateCallCenterObject(fromOverlappingCallCenter: boolean = false): AccountCallCenter {
        const formValue = this.manageForm.getRawValue();
        if (this.callCenter8x8Configs.featureEnabled) {
            return this.createAccount8x8CallCenterObject(this.manageForm, fromOverlappingCallCenter);
        }
        return fromOverlappingCallCenter
            ? this.createAccountCallCenterObject(
                  this.overlappingAdjustEndCallCenter.callCenter.id,
                  this.overlappingAdjustEndCallCenter.validity.effectiveStarting,
                  this.newEndDate,
                  this.overlappingAdjustEndCallCenter.specialInstructions,
              )
            : this.createAccountCallCenterObject(
                  formValue.nameControl,
                  formValue.startDateControl,
                  formValue.endDateControl,
                  formValue.specialInstructionsControl,
              );
    }

    /**
     * Get list of available times for tha calling schedule of 8x8 call center.
     *
     * @param type defines whether to return the list of start, end or all available times.
     * @returns list of available calling schedule times
     */
    getCallCenterScheduleTimeList(type: "start" | "end" | "all"): CallingScheduleTime[] {
        const list = Array(HOURS_IN_A_DAY)
            .fill(0)
            .map((value, index) => index)
            .reduce((times, hour) => {
                const fullHour = new Date().setHours(hour, 0, 0, 0);
                const halfHour = new Date().setHours(hour, CALL_CENTER_AVAILABILITY_TIME_INTERVAL_MINUTES, 0, 0);
                return [
                    ...times,
                    {
                        text: this.dateService.format(fullHour, DateFnsFormat.LOCALIZED_TIME),
                        value: this.dateService.format(fullHour, TimeFormats.TIME_24_HOURS_HMS),
                    },
                    {
                        text: this.dateService.format(halfHour, DateFnsFormat.LOCALIZED_TIME),
                        value: this.dateService.format(halfHour, TimeFormats.TIME_24_HOURS_HMS),
                    },
                ];
            }, []);
        if (type === "start") {
            return list;
        }
        const lastAvailableTime = {
            text: LAST_AVAILABLE_END_TIME,
            value: this.dateService.format(
                new Date().setHours(LAST_AVAILABLE_HOUR, LAST_AVAILABLE_MINUTES, 0, 0),
                TimeFormats.TIME_24_HOURS_HMS,
            ),
        };
        if (type === "end") {
            return list.slice(1).concat(lastAvailableTime);
        }
        return list.concat(lastAvailableTime);
    }

    /**
     * Adds voicemail routing form group if the account is eligible.
     */
    addVoicemailRouting(): void {
        if (
            this.data.numberOfMembers >= this.callCenter8x8Configs.inboundCallCenterMinEligibleEmployees &&
            // if selected call center type is OUTBOUND only then does not display Voicemail Routing
            this.manageForm.controls?.callCenterType.value !== CallCenterType.OUTBOUND
        ) {
            this.manageForm.addControl(
                CallCenterFormFields.VOICEMAIL_ROUTING,
                this.getNew8x8FormControlByName(CallCenterFormFields.VOICEMAIL_ROUTING),
            );
        }
    }

    /**
     * @description checks role for BB permission
     */
    allowBuildingBlocksRole(): void {
        this.staticUtilService.hasPermission(Permission.ALLOW_BUILDING_BLOCKS).subscribe((allowBuildingBlocksPermission: boolean) => {
            this.buildingBlocksRole = allowBuildingBlocksPermission;
        });
    }

    /**
     * destroy life cycle hook of angular.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
