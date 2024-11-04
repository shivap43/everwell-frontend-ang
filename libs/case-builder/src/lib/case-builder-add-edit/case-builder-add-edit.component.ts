/* eslint-disable @typescript-eslint/indent */
import { Component, Inject, OnDestroy, OnInit, Optional } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { AccountService } from "@empowered/api";
import { CaseBuilder, CaseBuilderAdmin, CaseBuilderRequest, DateFormats } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { CaseBuilderTableData } from "../case-builder/case-builder.model";
import { DateService } from "@empowered/date";
import { HttpErrorResponse } from "@angular/common/http";

const START_DATE = "startDate";
const END_DATE = "endDate";
const INVALID = "INVALID";
const ONGOING = "Ongoing";

interface DialogData {
    allCaseBuilderAdmin: CaseBuilderAdmin[];
    caseBuilderList: CaseBuilder[];
    selectedCaseBuilder: CaseBuilderTableData;
    mpGroup: number;
    type: string;
    id: number;
}

interface ConvertedDate {
    date?: string | null;
    startDate?: string | null;
    endDate?: string | null;
}

enum Actions {
    EDIT = "edit",
    ADD = "add",
    UPDATE = "update",
}

@Component({
    selector: "empowered-case-builder-add-edit",
    templateUrl: "./case-builder-add-edit.component.html",
    styleUrls: ["./case-builder-add-edit.component.scss"],
})
export class CaseBuilderAddEditComponent implements OnInit, OnDestroy {
    showCancel = false;
    closeIcon = false;
    caseBuilderAdminForm: FormGroup;
    apiError: string;
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.caseBuilderAdmin.admin",
        "primary.portal.caseBuilderAdmin.admin.select",
        "primary.portal.caseBuilderAdmin.header.add",
        "primary.portal.caseBuilderAdmin.header.edit",
        "primary.portal.caseBuilderAdmin.startDate",
        "primary.portal.caseBuilderAdmin.endDate",
        "primary.portal.caseBuilderAdmin.button.add",
        "primary.portal.caseBuilderAdmin.button.save",
        "primary.portal.caseBuilderAdmin.addEdit.text",
        "primary.portal.common.cancel",
        "primary.portal.common.requiredField",
        "primary.portal.common.optional",
        "primary.portal.caseBuilderAdmin.datePast",
        "primary.portal.caseBuilderAdmin.sameDateORbeforeDate",
        "primary.portal.caseBuilderAdmin.sameDateORafterStartDate",
        "primary.portal.caseBuilderAdmin.invalidDate",
        "primary.portal.caseBuilderAdmin.preventingOverlap",
    ]);

    START_DATE = START_DATE;
    END_DATE = END_DATE;

    isDisableCaseBuilderAdmin = false;
    error = {
        messageStartDate: "",
        fieldStartDate: "",
        messageEndDate: "",
        fieldEndDate: "",
    };
    isDisableStartDate = false;
    isDisableEndDate = false;
    isDisableAddButton = false;
    isDisableEditButton = false;
    dateType: string;
    date: Date | string | null = new Date();
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    isLoading: boolean;
    endDate: string | null;
    showSpinner: boolean;
    formSubmissionFlag: boolean;

    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        @Optional() private readonly matDialogRef: MatDialogRef<CaseBuilderAddEditComponent>,
        private readonly fb: FormBuilder,
        private readonly dateService: DateService,
        private readonly languageService: LanguageService,
        private readonly accountService: AccountService,
    ) {}

    /**
     * life cycle hook used for initialization of form and edit form values
     */
    ngOnInit(): void {
        this.date = this.dateService.format(this.date, DateFormats.YEAR_MONTH_DAY);
        this.caseBuilderAdminForm = this.fb.group({
            caseBuilderAdminSelect: ["", Validators.required],
            startDate: ["", Validators.required],
            endDate: [""],
        });

        this.caseBuilderAdminForm.controls["caseBuilderAdminSelect"].setValue(this.data.allCaseBuilderAdmin[0].id);
        this.isDisableCaseBuilderAdmin = true;
        this.caseBuilderAdminForm.controls["caseBuilderAdminSelect"].disable();
        if (
            this.data.type === Actions.EDIT &&
            this.data.selectedCaseBuilder &&
            this.data.allCaseBuilderAdmin &&
            this.data.allCaseBuilderAdmin.length > 0 &&
            this.data.selectedCaseBuilder.id === this.data.id
        ) {
            this.endDate = this.data.selectedCaseBuilder.endDate !== ONGOING ? this.data.selectedCaseBuilder.endDate : null;
            const convertedDate = this.convertDate(this.data.selectedCaseBuilder.startDate, this.endDate);
            if (convertedDate.startDate) {
                this.caseBuilderAdminForm.controls[START_DATE].setValue(convertedDate.startDate);
                this.caseBuilderAdminForm.controls[END_DATE].setValue(convertedDate.endDate);
                this.isDisableStartDate = convertedDate.startDate <= this.date;
                this.isDisableEndDate = convertedDate.endDate <= this.date;
                if (this.isDisableEndDate) {
                    this.caseBuilderAdminForm.controls[END_DATE].disable();
                } else {
                    this.caseBuilderAdminForm.controls[END_DATE].enable();
                }
            }
            if (this.isDisableStartDate) {
                this.caseBuilderAdminForm.controls[START_DATE].disable();
            } else {
                this.caseBuilderAdminForm.controls[START_DATE].enable();
            }
        }
    }

    /**
     * Method to create or update a new case builder account
     * @returns void
     */
    createUpdateCaseBuilderAdmin(): void {
        // Check overlap, only if no other validation error
        if (this.caseBuilderAdminForm.valid) {
            this.formSubmissionFlag = true;
            const convertedDate = this.convertDate(
                this.caseBuilderAdminForm.get(START_DATE).value,
                this.caseBuilderAdminForm.get(END_DATE).value,
            );
            this.checkOverlap(convertedDate.startDate, convertedDate.endDate);
        }
        if (this.caseBuilderAdminForm.valid && this.caseBuilderAdminForm.get("caseBuilderAdminSelect").value) {
            this.showSpinner = true;
            const caseBuilderRequest = this.createCaseBuilderRequest();
            if (this.data.type === Actions.EDIT) {
                this.isDisableEditButton = true;
                this.accountService
                    .updateAccountCaseBuilder(this.data.mpGroup?.toString(), this.data?.id, caseBuilderRequest)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        () => {
                            this.closePopup(true);
                        },
                        (error) => {
                            this.isDisableEditButton = false;
                            this.showErrorAlertMessage(error);
                        },
                    );
            } else {
                this.isDisableAddButton = true;
                this.accountService
                    .createCaseBuilder(this.data.mpGroup.toString(), caseBuilderRequest)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        () => {
                            this.closePopup(true);
                        },
                        (error) => {
                            this.isDisableAddButton = false;
                            this.showErrorAlertMessage(error);
                        },
                    );
            }
        }
    }

    /**
     * Method to Add/Edit a request payload;
     * @returns CaseBuilderRequest
     */
    createCaseBuilderRequest(): CaseBuilderRequest {
        const caseBuilderRequest = { validity: {} } as CaseBuilderRequest;

        caseBuilderRequest.caseBuilderId = this.caseBuilderAdminForm.get("caseBuilderAdminSelect").value;
        if (this.caseBuilderAdminForm.get(START_DATE).value) {
            const convertedDate = this.convertDate(
                this.caseBuilderAdminForm.get(START_DATE).value,
                this.caseBuilderAdminForm.get(END_DATE).value,
            );
            caseBuilderRequest.validity.effectiveStarting = convertedDate.startDate;
            caseBuilderRequest.validity.expiresAfter = convertedDate.endDate;
        }

        return caseBuilderRequest;
    }

    /* Shows an alert on the screen in case of an error.
     * @param errorDetails http error response
     */
    showErrorAlertMessage(errorDetails: HttpErrorResponse): void {
        if (errorDetails?.error?.status) {
            this.apiError = this.languageService.fetchSecondaryLanguageValue(
                `secondary.api.${errorDetails.error.status}.${errorDetails.error.code}`,
            );
        } else {
            this.apiError = this.languageService.fetchSecondaryLanguageValue("secondary.api.400.badRequest");
        }
        this.showSpinner = false;
    }

    /**
     * Method to convert the date into a particular format.
     * @param date1 - start date
     * @param date2 - end date
     * @returns - an object with date/dates in a particular format
     */
    convertDate(startDate: Date | string | null, endDate?: string | null): ConvertedDate {
        let convertedDate: ConvertedDate;
        if (startDate && !endDate) {
            startDate = this.dateService.format(startDate, DateFormats.YEAR_MONTH_DAY);
            convertedDate = { startDate: startDate };
        } else {
            startDate = this.dateService.format(startDate, DateFormats.YEAR_MONTH_DAY);
            endDate = this.dateService.format(endDate, DateFormats.YEAR_MONTH_DAY);
            convertedDate = { startDate: startDate, endDate: endDate };
        }
        return convertedDate;
    }

    /**
     * Function to validate the date fields on dateChange event
     * @params dateType : string declare the type of field on which even is getting trigger
     */
    validateInput(dateType?: string): void {
        this.dateType = dateType || "";
        if (
            (this.error.fieldStartDate || this.error.fieldEndDate) &&
            ((this.caseBuilderAdminForm.get(START_DATE).status === INVALID && this.caseBuilderAdminForm.get(START_DATE).dirty) ||
                (this.caseBuilderAdminForm.get(END_DATE).status === INVALID && this.caseBuilderAdminForm.get(END_DATE).dirty))
        ) {
            this.error.fieldStartDate = this.error.fieldEndDate = "";
            if (this.caseBuilderAdminForm.get(START_DATE).value) {
                this.caseBuilderAdminForm.get(START_DATE).setErrors(null);
            }
            this.caseBuilderAdminForm.get(END_DATE).setErrors(null);
        }
        this.setValidationErrors();
    }
    /**
     * Function to set validation errors based on date fields
     * Error message should be displayed for the following 4 different scenarios:
     * 1. Start date should not be blank.
     * 2. Start date should be greater than or equals to today's date.
     * 3. Start date should be lesser than end date.
     * 4. End date should be greater than start date.
     */
    setValidationErrors(): void {
        const startDate = this.caseBuilderAdminForm.get(START_DATE).value;
        const endDate = this.caseBuilderAdminForm.get(END_DATE).value;

        this.error.fieldStartDate = this.error.fieldEndDate = this.error.messageStartDate = this.error.messageEndDate = "";

        if (!this.caseBuilderAdminForm.get(START_DATE)?.errors?.matDatepickerParse?.text && startDate) {
            this.caseBuilderAdminForm.get(START_DATE).setErrors(null);
        }
        this.caseBuilderAdminForm.get(END_DATE).setErrors(null);

        if (this.caseBuilderAdminForm.get(START_DATE)?.errors?.matDatepickerParse?.text) {
            this.showFormatValidationErrors(START_DATE, this.languageStrings["primary.portal.caseBuilderAdmin.invalidDate"]);
        } else if (!endDate) {
            this.caseBuilderAdminForm.get(END_DATE).setValue(null);
            this.caseBuilderAdminForm.get(END_DATE).setErrors(null);
        }

        if (startDate || endDate) {
            const convertedDate = this.convertDate(startDate, endDate);
            if (
                convertedDate.startDate &&
                this.dateService.isBefore(convertedDate.startDate, this.date) &&
                !this.caseBuilderAdminForm.get(START_DATE).disabled
            ) {
                this.showFormatValidationErrors(START_DATE, this.languageStrings["primary.portal.caseBuilderAdmin.datePast"]);
            }
            if (
                convertedDate.endDate &&
                this.dateService.isBefore(convertedDate.endDate, this.date) &&
                !this.caseBuilderAdminForm.get(END_DATE).disabled
            ) {
                this.showFormatValidationErrors(END_DATE, this.languageStrings["primary.portal.caseBuilderAdmin.datePast"]);
            }
            if (startDate && endDate) {
                if (this.dateService.checkIsAfter(convertedDate.startDate, convertedDate.endDate) && this.dateType === END_DATE) {
                    this.showFormatValidationErrors(
                        END_DATE,
                        this.languageStrings["primary.portal.caseBuilderAdmin.sameDateORafterStartDate"],
                    );
                }
                if (this.dateService.checkIsAfter(convertedDate.startDate, convertedDate.endDate) && this.dateType === START_DATE) {
                    this.showFormatValidationErrors(
                        START_DATE,
                        this.languageStrings["primary.portal.caseBuilderAdmin.sameDateORbeforeDate"],
                    );
                }
            }
            // Check overlap, only if no other validation error
            if (this.caseBuilderAdminForm.valid) {
                this.checkOverlap(startDate, endDate);
            }
        }
    }

    /**
     * Method to validate if the dates are overlapping and set appropriate errors if required
     * @param date1 - start date
     * @param date2 - end date
     */
    checkOverlap(startDate: Date | string | null, endDate?: string | null): void {
        // Filter out the chosen case builder components from the list and check for overlap
        let filteredCaseBuilderList = this.data.caseBuilderList.filter(
            (caseBuilderElement) =>
                caseBuilderElement?.caseBuilder?.id === (this.caseBuilderAdminForm?.get("caseBuilderAdminSelect").value as number),
        );
        // While editing case builder item, remove the selected item from the list because it shouldn't compare dates with itself
        if (this.data.selectedCaseBuilder) {
            filteredCaseBuilderList = filteredCaseBuilderList.filter((caseBuilder) => caseBuilder.id !== this.data.selectedCaseBuilder?.id);
        }
        for (const caseBuilder of filteredCaseBuilderList) {
            const maxStart = this.dateService.max([
                this.dateService.toDate(startDate),
                this.dateService.toDate(caseBuilder.validity?.effectiveStarting),
            ]);

            let minEnd;
            if (endDate && caseBuilder.validity?.expiresAfter) {
                minEnd = this.dateService.min([
                    this.dateService.toDate(endDate),
                    this.dateService.toDate(caseBuilder.validity?.expiresAfter),
                ]);
            } else {
                // Find the first not null value from the list
                const dateList = [endDate, caseBuilder.validity?.expiresAfter, maxStart];
                minEnd = dateList.find((dateElement) => dateElement);
            }
            // Date overlaps if maxStart date less than or equal to min endDate
            if (this.dateService.isBeforeOrIsEqual(maxStart, minEnd)) {
                if (endDate) {
                    let errorFlag = false;
                    if (this.dateService.isEqual(startDate, maxStart)) {
                        this.showFormatValidationErrors(
                            START_DATE,
                            this.languageStrings["primary.portal.caseBuilderAdmin.preventingOverlap"],
                        );
                        errorFlag = true;
                    }
                    if (this.dateService.isEqual(endDate, minEnd)) {
                        this.showFormatValidationErrors(
                            END_DATE,
                            this.languageStrings["primary.portal.caseBuilderAdmin.preventingOverlap"],
                        );
                        errorFlag = true;
                    }
                    // It's a unique situation if the first two conditions are not met
                    if (!errorFlag) {
                        this.showFormatValidationErrors(
                            START_DATE,
                            this.languageStrings["primary.portal.caseBuilderAdmin.preventingOverlap"],
                        );
                        this.showFormatValidationErrors(
                            END_DATE,
                            this.languageStrings["primary.portal.caseBuilderAdmin.preventingOverlap"],
                        );
                    }
                } else {
                    // if provided start date is between existing date range
                    if (
                        !caseBuilder.validity?.expiresAfter
                            ? this.dateService.getIsAfterOrIsEqual(startDate, caseBuilder.validity?.effectiveStarting)
                            : this.dateService.isBetween(
                                  this.dateService.toDate(caseBuilder.validity?.effectiveStarting),
                                  this.dateService.toDate(caseBuilder.validity?.expiresAfter),
                                  this.dateService.toDate(startDate),
                              )
                    ) {
                        this.showFormatValidationErrors(
                            START_DATE,
                            this.languageStrings["primary.portal.caseBuilderAdmin.preventingOverlap"],
                        );
                    }
                    // No end date and submit the form
                    if (this.formSubmissionFlag) {
                        this.showFormatValidationErrors(
                            END_DATE,
                            this.languageStrings["primary.portal.caseBuilderAdmin.preventingOverlap"],
                        );
                    }
                }
            }
        }
        this.formSubmissionFlag = false;
    }

    /**
     * Method : showFormatValidationErrors() to validate the format related error messages.
     * @param field:string is a required parameter to check the conditions like Invalid format
     * @param errorMessage:string is a required parameter to check the conditions like Invalid format
     */

    showFormatValidationErrors(field: string, errorMessage: string): void {
        if (field === START_DATE) {
            this.error.fieldStartDate = field;
            this.error.messageStartDate = errorMessage;
        } else {
            this.error.fieldEndDate = field;
            this.error.messageEndDate = errorMessage;
        }
        this.caseBuilderAdminForm.get(field).setErrors({ invalid: true });
    }

    /**
     * Method used to close the modal
     * @param flag boolean to check whether add or edit clicked
     */
    closePopup(flag: boolean): void {
        this.matDialogRef.close(flag);
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
