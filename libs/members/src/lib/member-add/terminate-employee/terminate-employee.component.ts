import { Component, OnInit, OnDestroy, ViewChild, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatStepper } from "@angular/material/stepper";
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl, ValidationErrors } from "@angular/forms";
import { STEPPER_GLOBAL_OPTIONS } from "@angular/cdk/stepper";
import { MemberAddDialogData } from "../member-add-modal/member-add-modal.model";
import { EnrollmentService, MemberService, CoreService, TerminateReason, StaticService } from "@empowered/api";
import { Subject, Subscription } from "rxjs";

import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Store } from "@ngxs/store";
import { NgxMaskPipe } from "ngx-mask";
import { DatePipe } from "@angular/common";
import { SaveMemberResponseModel, SaveTerminationData } from "../model/member-work-model";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ClientErrorResponseCode, DateFormats, AppSettings } from "@empowered/constants";
import { StaticUtilService } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";
import { takeUntil } from "rxjs/operators";

const COMMENT = "comment";
const TERMINATION_DATE = "terminationDate";
const TERMINATION_ID = "terminationCodeId";
const DATE = "date";
const END_DATE = "endDate";
const TERMINATE = "terminate";
const COVERAGE = "coverage";
const DAY = "day";
const DAYS = "days";
const TERMINATE_DATE = "##Terminationdate##";
const ONE_DAY = 24 * 60 * 60 * 1000;
const DATE_AFTER_TERMINATION_LANGUAGE = "primary.portal.member.terminate.dateAfterTermination";
const NOTES_MAX_LENGTH = 1000;
const TERMINATE_DAY_RANGE_CONFIG = "portal.member.terminate.dayRange";
const INITIAL_STEP_INDEX = 0;

@Component({
    selector: "empowered-terminate-employee",
    templateUrl: "./terminate-employee.component.html",
    styleUrls: ["./terminate-employee.component.scss"],
    providers: [
        {
            provide: STEPPER_GLOBAL_OPTIONS,
            useValue: { displayDefaultIndicatorType: false },
        },
    ],
})
export class TerminateEmployeeComponent implements OnInit, OnDestroy {
    @ViewChild("progressIndicator", { static: true }) progressIndicator;
    @ViewChild("stepper") stepper: MatStepper;
    changeStepper: number;
    showCoverages = true;
    terminationForm: FormGroup;
    coverageForm: FormGroup;
    stepPosition = 0;
    step1 = 1;
    step2 = 2;
    step3 = 3;
    readOnly = false;
    editMode;
    getEnrollmentData: Subscription;
    dateError = "";
    productList = [];
    displayValidDate = "";
    languageStrings: Record<string, string>;
    confirmationheading = "";
    productsError = "";
    terminationList = [];
    invalidDateError: any;
    errorMessage: string;
    errorMessageArray = [];
    lastSelectedReason: string;
    ERROR = "error";
    DETAILS = "details";
    isLoaded = false;
    isCoverageDateChanged = false;
    coveragEndDateError = "";
    reviewCoverageHeader = "";
    EDIT = "edit";
    getAllProductsData: any;
    SUCCESS = "success";
    notesHeading = "";
    selectedIndex = 0;
    changeCoverageHeading = true;
    configurableDayRange;
    readonly partnerServiceResultStatus = {
        NOT_AVAILABLE: "NOT_AVAILABLE",
        SUCCESS: "SUCCESS",
    };
    previousDate: string;
    previousComments: string;
    previousCoverageDate: string;
    confirmContent: SafeHtml;
    terminationDate: string;
    invalidComment: string;
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly fb: FormBuilder,
        private readonly dialogRef: MatDialogRef<TerminateEmployeeComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: MemberAddDialogData,
        private readonly enrollmentService: EnrollmentService,
        private readonly memberService: MemberService,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly maskPipe: NgxMaskPipe,
        private readonly coreService: CoreService,
        private readonly datePipe: DatePipe,
        private readonly domSanitizer: DomSanitizer,
        private readonly staticService: StaticService,
        private readonly staticUtilService: StaticUtilService,
        private readonly dateService: DateService,
    ) {
        if (this.data.content.action === this.EDIT) {
            this.getAllproducts();
            this.editMode = true;
        } else {
            this.editMode = false;
            this.isLoaded = true;
        }
    }
    ngOnInit(): void {
        this.getLanguageStrings();
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.changeStepper = 1;
        this.intializeForm();
        this.getEnrollments();
        let i = 1;
        for (const key in TerminateReason) {
            if (Object.prototype.hasOwnProperty.call(TerminateReason, key)) {
                this.terminationList.push({ id: i++, name: TerminateReason[key] });
            }
        }
        this.staticService
            .getConfigurations(TERMINATE_DAY_RANGE_CONFIG, this.data.content.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => {
                this.configurableDayRange = parseInt(data[0].value, 10);
                this.setTerminateMinMaxDate();
            });
        if (!this.editMode) {
            this.staticUtilService
                .cacheConfigValue("general.subscriber.enrollment.termination.edit_product_coverage_end_date")
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((resp: string) => {
                    this.readOnly = resp !== AppSettings.TRUE.toUpperCase();
                });
        }
    }

    getLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.member.terminate.dateAfter",
            "primary.portal.member.terminate.dateBefore",
            "primary.portal.member.terminate.dateAfterTermination",
            "primary.portal.member.terminate.reviewcoveragedateheading",
            "primary.portal.member.terminate.confirmationheading",
            "primary.portal.member.terminate.confirmsubheading",
            "primary.portal.member.terminate.notes",
            "primary.portal.common.optional",
            "primary.portal.member.terminate.termreason",
            "primary.portal.member.terminate.coveragedate",
            "primary.portal.member.terminate.reviewcoveragedate",
            "primary.portal.commission.producer.addSplit.required",
            "primary.portal.member.terminate.coveragedateheading",
            "primary.portal.member.terminate.samedayend",
            "primary.portal.member.terminate.terminationdetails",
            "primary.portal.member.editterminate.heading",
            "primary.portal.common.dateHint",
            "primary.portal.member.terminate.affectedcoverage",
            "primary.portal.member.terminate.coverage",
            "primary.portal.member.terminate.reason",
            "primary.portal.member.terminate.date",
            "primary.portal.member.terminate.heading",
            "primary.portal.common.save",
            "primary.portal.common.back",
            "primary.portal.common.next",
            "primary.portal.common.cancel",
            "primary.portal.member.terminate.confirmation",
            "primary.portal.member.terminate.coveragedates",
            "primary.portal.member.terminate.hireDateError",
            "primary.portal.common.close",
        ]);
        this.invalidDateError = this.language.fetchSecondaryLanguageValue("secondary.portal.common.invalidDateFormat");
        this.invalidComment = this.language.fetchSecondaryLanguageValue("secondary.portal.members.api.400.badParameter.comment");
        // eslint-disable-next-line max-len
        this.notesHeading = `${this.languageStrings["primary.portal.member.terminate.notes"]} ${this.languageStrings["primary.portal.common.optional"]}`;
    }
    patchData(): void {
        this.memberService
            .getMemberTermination(this.data.content.memberId, this.data.content.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (result) => {
                    this.isLoaded = true;
                    this.previousDate = result.terminationDate;
                    this.previousComments = result.terminationComments;
                    this.terminationForm.get("reason").setValue(result.terminationCodeId);
                    this.terminationForm.get("notes").setValue(result.terminationComments);
                    this.terminationForm.get("date").setValue(this.dateService.toDate(result.terminationDate.replace(/-/g, "/")));
                    this.terminationForm
                        .get("displayValidFutureDate")
                        .setValue(
                            this.dateService
                                .toDate(this.terminationForm.get("date").value)
                                .setDate(new Date().getDate() + this.configurableDayRange),
                        );
                    this.terminationForm
                        .get("displayValidPastDate")
                        .setValue(
                            this.dateService
                                .toDate(this.terminationForm.get("date").value)
                                .setDate(new Date().getDate() - this.configurableDayRange),
                        );
                    this.lastSelectedReason = this.terminationForm.get("reason").value;
                    const validDate = this.dateService.toDate(this.terminationForm.get("date").value);
                    this.displayValidDate = validDate.getMonth() + 1 + "/" + validDate.getDate() + "/" + validDate.getFullYear();
                    for (const name in result.terminationProductCoverageEnd) {
                        if (name && this.productList.find((x) => x.id === name) === undefined) {
                            this.productList.push({
                                id: name,
                                name: this.fetchProductName(parseInt(name, 10)),
                                date: result.terminationProductCoverageEnd[name].replace(/-/g, "/"),
                            });
                        }
                    }
                    if (result.editable) {
                        this.readOnly = false;
                        this.coverageChanged({ checked: true });
                    } else {
                        this.readOnly = true;
                    }
                },
                (error) => {
                    this.isLoaded = true;
                    if (error) {
                        this.showErrorAlertMessage(error);
                    } else {
                        this.errorMessage = null;
                    }
                },
            );
    }
    intializeForm(): void {
        this.terminationForm = this.fb.group(
            {
                reason: ["", Validators.required],
                date: ["", [Validators.required, this.dateChange(TERMINATE)]],
                notes: ["", Validators.maxLength(NOTES_MAX_LENGTH)],
                displayValidFutureDate: [""],
                displayValidPastDate: [""],
            },
            { updateOn: "blur" },
        );
        this.coverageForm = this.fb.group(
            {
                coverageEnd: true,
                endDate: ["", [Validators.required, this.dateChange(COVERAGE)]],
                validFutureDate: [],
                validPastDate: [this.terminationForm.get("date").value],
            },
            { updateOn: "blur" },
        );
        this.terminationForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
            this.errorMessage = null;
        });
        this.coverageForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
            this.errorMessage = null;
        });
    }
    /*
     * Set min and max date range for termination based on config value
     */
    setTerminateMinMaxDate(): void {
        this.terminationForm.get("displayValidFutureDate").setValue(this.dateService.addDays(new Date(), this.configurableDayRange));
        this.terminationForm.get("displayValidPastDate").setValue(this.data.content.employeeData.hireDate);
    }
    getEnrollments(): void {
        this.enrollmentService
            .getEnrollments(this.data.content.memberId, this.data.content.mpGroupId, "planId,productId")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                if (result) {
                    result.forEach((product) => {
                        if (this.productList.find((x) => x.id === product.plan.product.id) === undefined) {
                            this.productList.push({
                                id: product.plan.product.id.toString(),
                                name: product.plan.product.name,
                                date: product.validity.expiresAfter,
                            });
                        }
                    });
                }
            });
    }
    fetchProductName(id: number): any {
        return this.getAllProductsData.filter((x) => x.id === id)[0].name;
    }
    getAllproducts(): void {
        this.coreService
            .getProducts()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                this.getAllProductsData = result;
                this.patchData();
            });
    }
    closeForm(): void {
        this.dialogRef.close(null);
    }
    /**
     * Method to update step index on step change
     * @param selectedIndex : selected step index of the stepper
     */
    stepChanged(selectedIndex: number): void {
        if (selectedIndex === INITIAL_STEP_INDEX) {
            if (this.productList.length) {
                this.selectedIndex = INITIAL_STEP_INDEX;
            } else {
                this.selectedIndex = this.step1;
            }
        } else if (selectedIndex === this.step1) {
            this.selectedIndex = this.step1;
        } else {
            this.selectedIndex = this.step2;
        }
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    coverageChanged(evt: any): void {
        if (evt.checked) {
            this.changeCoverageHeading = true;
            this.showCoverages = true;
            if (!this.coverageForm.get("endDate")) {
                this.coverageForm.addControl("endDate", this.fb.control("", Validators.required));
                this.coverageForm.get("endDate").setValue(this.terminationForm.get("date").value);
            }
            this.coverageForm.removeControl("productEndDates");
        } else {
            this.changeCoverageHeading = false;
            this.showCoverages = false;
            if (this.coverageForm.get("endDate")) {
                this.coverageForm.removeControl("endDate");
            }
            if (!this.coverageForm.get("productEndDates")) {
                this.coverageForm.addControl("productEndDates", new FormArray([]));
                const productEndDates = this.coverageForm.get("productEndDates") as FormArray;
                this.productList.forEach((element) => {
                    productEndDates.push(
                        this.fb.group(
                            {
                                id: [element.id, Validators.required],
                                name: [element.name, Validators.required],
                                date: [this.terminationForm.get("date").value, Validators.required],
                                validFutureDate: [],
                                validPastDate: [this.terminationForm.get("date").value],
                            },
                            { updateOn: "blur" },
                        ),
                    );
                });
            }
        }
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
    /** *
     * Validator for termination date and Coverage End date.
     * @param source source flag to check where the validator is called from (termination or coverage)
     * @returns validator function that validates changed date.
     */
    dateChange(source: string): ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            if (control.valid) {
                const inputDate = this.dateService.toDate(control.value);
                const currentDate = new Date();
                const inputCoverageDate = this.dateService.toDate(control.value);
                if (
                    this.data.content.employeeData.hireDate &&
                    !this.dateService.getIsAfterOrIsEqual(
                        this.dateService.toDate(control.value),
                        this.dateService.toDate(this.data.content.employeeData.hireDate || ""),
                    ) &&
                    source === TERMINATE
                ) {
                    this.dateError = this.languageStrings["primary.portal.member.terminate.hireDateError"].replace(
                        "##HireDate##",
                        this.datePipe.transform(this.data.content.employeeData.hireDate, AppSettings.DATE_FORMAT_MM_DD_YYYY),
                    );
                    return { invalid: true };
                }

                if (
                    this.terminationForm?.get(DATE)?.value &&
                    this.dateService.checkIsAfter(
                        this.dateService.toDate(this.terminationForm.get(DATE).value),
                        this.dateService.toDate(inputCoverageDate),
                    ) &&
                    source === COVERAGE
                ) {
                    this.dateError = this.languageStrings[DATE_AFTER_TERMINATION_LANGUAGE].replace(
                        TERMINATE_DATE,
                        this.datePipe.transform(
                            this.dateService.toDate(this.terminationForm.get(DATE).value),
                            AppSettings.DATE_FORMAT_MM_DD_YYYY,
                        ),
                    );
                    return { invalid: true };
                }
                if (inputDate > currentDate) {
                    const validFutureDate = new Date();
                    validFutureDate.setDate(new Date().getDate() + this.configurableDayRange);
                    const displayValidFutureDate =
                        validFutureDate.getMonth() + 1 + "/" + validFutureDate.getDate() + "/" + validFutureDate.getFullYear();
                    const diffDaysFuture = this.dateService.getDifferenceInDays(inputDate, currentDate);

                    if (diffDaysFuture >= this.configurableDayRange) {
                        this.dateError = this.languageStrings["primary.portal.member.terminate.dateBefore"].replace(
                            "##validDate##",
                            displayValidFutureDate,
                        );
                        return { invalid: true };
                    }
                    return null;
                }
                const validPastDate = new Date();
                validPastDate.setDate(new Date().getDate() - this.configurableDayRange);
                const diffDaysPast = this.dateService.getDifferenceInDays(currentDate, inputDate);
                const diffDays = this.dateService.getDifferenceInDays(currentDate, this.data.content.employeeData.hireDate);
                if (diffDaysPast > diffDays) {
                    this.dateError = this.languageStrings["primary.portal.member.terminate.dateAfter"].replace(
                        "##validDate##",
                        this.data.content.employeeData.hireDate,
                    );
                    return { invalid: true };
                }
            }
            return null;
        };
    }

    coverageDateChange(valid: boolean, value: any, i?: number): boolean | undefined {
        if (valid) {
            const oneDay = ONE_DAY;
            const currentDate = new Date().getTime();
            const validFutureDate = new Date();
            validFutureDate.setDate(new Date().getDate() + this.configurableDayRange);
            const inputDate = this.dateService.toDate(value).getTime();
            const validDate = this.dateService.toDate(this.terminationForm.get("date").value);
            this.displayValidDate = validDate.getMonth() + 1 + "/" + validDate.getDate() + "/" + validDate.getFullYear();
            this.isCoverageDateChanged = true;
            if (Math.round(Math.abs((inputDate - currentDate) / oneDay)) > this.configurableDayRange) {
                if (i === undefined || i === null) {
                    this.coverageForm.get("endDate").setErrors({ invalid: true });
                    this.coveragEndDateError = this.languageStrings[DATE_AFTER_TERMINATION_LANGUAGE].replace(
                        TERMINATE_DATE,
                        this.displayValidDate,
                    );
                    return true;
                }
                return this.fetchText(true, i);
            }
            if (i === undefined || i === null) {
                this.coverageForm.get("endDate").setErrors(null);
                this.coveragEndDateError = this.languageStrings[DATE_AFTER_TERMINATION_LANGUAGE].replace(
                    TERMINATE_DATE,
                    this.displayValidDate,
                );
            } else {
                return this.fetchText(false, i);
            }
        }
        return undefined;
    }
    fetchText(x: boolean, i?: number): boolean {
        this.productsError = this.languageStrings[DATE_AFTER_TERMINATION_LANGUAGE].replace(TERMINATE_DATE, this.displayValidDate);
        this.coverageForm.get("productEndDates")["controls"][i].get(DATE).setErrors(null);
        return x;
    }
    /**
     * Method called on next button click
     */
    buttonClicked(): void {
        if (this.changeStepper === this.step1) {
            if (this.terminationForm.valid) {
                this.reviewCoverageHeader = this.languageStrings["primary.portal.member.terminate.reviewcoveragedateheading"].replace(
                    TERMINATE_DATE,
                    this.datePipe.transform(
                        this.dateService.toDate(this.terminationForm?.get(DATE)?.value || ""),
                        DateFormats.MONTH_DAY_YEAR,
                    ),
                );
            }
            if (this.productList.length > 0) {
                if (!this.terminationForm.valid || this.terminationForm.get("date").hasError("invalid")) {
                    this.validateAllFormFields(this.terminationForm);
                } else {
                    if (this.coverageForm.get("coverageEnd").value && this.coverageForm.get("endDate")) {
                        this.coverageForm.get("endDate").setValue(this.terminationForm.get("date").value);
                        this.previousCoverageDate = this.datePipe.transform(
                            this.coverageForm.get(END_DATE).value,
                            AppSettings.DATE_FORMAT_MM_DD_YYYY,
                        );
                    }
                    this.changeStepper = this.step2;
                    this.stepPosition = this.step1;
                    this.stepChanged(this.step1);
                    if (this.progressIndicator.selected !== undefined) {
                        this.progressIndicator.selected.completed = true;
                    }
                }
            } else if (this.productList.length === 0) {
                if (!this.terminationForm.valid || this.terminationForm.get("date").hasError("invalid")) {
                    this.validateAllFormFields(this.terminationForm);
                } else {
                    const validDate = this.dateService.toDate(this.terminationForm.get("date").value);
                    this.displayValidDate = validDate.getMonth() + 1 + "/" + validDate.getDate() + "/" + validDate.getFullYear();
                    this.confirmationheading = this.languageStrings["primary.portal.member.terminate.confirmationheading"].replace(
                        "##EmployeeName##",
                        `${this.data.content.employeeData.firstName} ${this.data.content.employeeData.lastName}`,
                    );
                    this.confirmContent = this.domSanitizer.bypassSecurityTrustHtml(
                        this.languageStrings["primary.portal.member.terminate.confirmsubheading"],
                    );
                    this.changeStepper = this.step3;
                    this.stepPosition = this.step2;
                    this.stepChanged(this.step1);
                    if (this.progressIndicator.selected !== undefined) {
                        this.progressIndicator.selected.completed = true;
                    }
                }
            }
        } else if (this.changeStepper === this.step2) {
            const validDate = this.dateService.toDate(this.terminationForm.get("date").value);
            this.displayValidDate = validDate.getMonth() + 1 + "/" + validDate.getDate() + "/" + validDate.getFullYear();
            this.confirmationheading = this.languageStrings["primary.portal.member.terminate.confirmationheading"].replace(
                "##EmployeeName##",
                `${this.data.content.employeeData.firstName} ${this.data.content.employeeData.lastName}`,
            );
            this.confirmContent = this.domSanitizer.bypassSecurityTrustHtml(
                this.languageStrings["primary.portal.member.terminate.confirmsubheading"],
            );
            if (!this.coverageForm.valid) {
                this.validateAllFormFields(this.coverageForm);
            } else {
                this.changeStepper = this.step3;
                this.stepPosition = this.step2;
                this.stepChanged(this.step2);
                if (this.progressIndicator.selected !== undefined) {
                    this.progressIndicator.selected.completed = true;
                }
            }
        }
    }
    /**
     * Method called on click of back button
     */
    onClickBack(): void {
        this.errorMessage = null;
        if (this.changeStepper === this.step2) {
            this.changeStepper = this.step1;
            this.stepChanged(INITIAL_STEP_INDEX);
        } else if (this.changeStepper) {
            if (this.productList.length) {
                this.changeStepper = this.step2;
                this.stepChanged(this.step1);
            } else {
                this.changeStepper = this.step1;
                this.stepChanged(INITIAL_STEP_INDEX);
            }
        }
    }
    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
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
    }
    /**
     * On submission of Termination form, the page routes to the employee list with the necessary parameters
     * in order to show the alert message
     * */
    onSubmit(): void {
        if (this.terminationForm.valid && (!this.productList.length || this.coverageForm.valid)) {
            const saveTerminationData = {};
            saveTerminationData["terminationCodeId"] = this.terminationForm.get("reason").value;
            saveTerminationData["terminationDate"] = this.datePipe.transform(
                this.terminationForm.get("date").value,
                AppSettings.DATE_FORMAT,
            );
            saveTerminationData["comment"] = this.terminationForm.get("notes").value;
            if (this.productList) {
                saveTerminationData["terminationProductCoverageEnd"] = {};
                const productObject = {};
                if (this.coverageForm.get("coverageEnd").value) {
                    this.productList.forEach((element) => {
                        productObject[`${element.id}`] = this.datePipe.transform(
                            this.coverageForm.get("endDate").value,
                            AppSettings.DATE_FORMAT,
                        );
                    });
                } else {
                    this.productList.forEach((element, index) => {
                        productObject[`${element.id}`] = this.datePipe.transform(
                            this.coverageForm.get("productEndDates")["controls"][index].get("date").value,
                            AppSettings.DATE_FORMAT,
                        );
                    });
                }
                saveTerminationData["terminationProductCoverageEnd"] = productObject;
            }
            this.memberService
                .saveMemberTermination(this.data.content.memberId, this.data.content.mpGroupId, saveTerminationData)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (result) => {
                        const conditionCalled = this.editTermination(saveTerminationData, result);
                        if (!conditionCalled) {
                            if (
                                this.editMode &&
                                saveTerminationData[TERMINATION_ID] !== this.lastSelectedReason &&
                                (result.partnerServiceResult === this.partnerServiceResultStatus.SUCCESS ||
                                    result.partnerServiceResult === this.partnerServiceResultStatus.NOT_AVAILABLE)
                            ) {
                                const reasonObj = this.terminationList.find(
                                    (terminate) => terminate.id === saveTerminationData[TERMINATION_ID],
                                );
                                this.dialogRef.close({
                                    currentReason: reasonObj.name,
                                    partnerServiceResult:
                                        result.partnerServiceResult === this.partnerServiceResultStatus.SUCCESS
                                            ? this.partnerServiceResultStatus.SUCCESS
                                            : "",
                                });
                            } else if (this.editMode && this.previousDate !== saveTerminationData[TERMINATION_DATE]) {
                                this.dialogRef.close({
                                    futureDate: true,
                                    editMode: this.editMode,
                                    terminationDate: this.datePipe.transform(
                                        this.terminationForm.get(DATE).value,
                                        AppSettings.DATE_FORMAT_MM_DD_YYYY,
                                    ),
                                    partnerServiceResult:
                                        result.partnerServiceResult === this.partnerServiceResultStatus.SUCCESS
                                            ? this.partnerServiceResultStatus.SUCCESS
                                            : "",
                                });
                            } else if (
                                this.editMode &&
                                this.dateService.checkIsAfter(this.dateService.toDate(saveTerminationData[TERMINATION_DATE] || ""))
                            ) {
                                this.dialogRef.close({
                                    futureDate: true,
                                    terminationDate: this.datePipe.transform(
                                        this.terminationForm.get(DATE).value,
                                        AppSettings.DATE_FORMAT_MM_DD_YYYY,
                                    ),
                                    partnerServiceResult:
                                        result.partnerServiceResult === this.partnerServiceResultStatus.SUCCESS
                                            ? this.partnerServiceResultStatus.SUCCESS
                                            : "",
                                });
                            } else if (result.partnerServiceResult === this.partnerServiceResultStatus.SUCCESS) {
                                this.dialogRef.close({
                                    futureDate: false,
                                    terminationDate: this.datePipe.transform(
                                        this.terminationForm.get(DATE).value,
                                        AppSettings.DATE_FORMAT_MM_DD_YYYY,
                                    ),
                                });
                            } else if (
                                this.dateService.checkIsAfter(this.dateService.toDate(saveTerminationData[TERMINATION_DATE] || ""))
                            ) {
                                this.dialogRef.close({
                                    partnerServiceResult: "",
                                    futureDate: true,
                                    terminationDate: this.datePipe.transform(
                                        this.terminationForm.get(DATE).value,
                                        DateFormats.MONTH_DAY_YEAR,
                                    ),
                                    editMode: false,
                                });
                            } else {
                                this.dialogRef.close({
                                    partnerServiceResult: "",
                                    terminationDate: this.datePipe.transform(
                                        this.terminationForm.get(DATE).value,
                                        DateFormats.MONTH_DAY_YEAR,
                                    ),
                                    editMode: false,
                                });
                            }
                            this.isCoverageDateChanged = false;
                        }
                    },
                    (error) => {
                        if (error) {
                            this.showErrorAlertMessage(error);
                        } else {
                            this.errorMessage = null;
                        }
                    },
                );
        }
    }

    /**
     * This method will close the edit termination modal and send response based on conditions.
     * @param saveTerminationData object that stores the latest termination data
     * @param result response of saveMemberTermination API call that contains partnerServiceResult SUCCESS or NOT_AVAILABLE
     * @return boolean value that ensures that conditional branch is executed
     */
    editTermination(saveTerminationData: SaveTerminationData, result: SaveMemberResponseModel): boolean {
        const currentComment = saveTerminationData[COMMENT];
        const currentTerminationDate = saveTerminationData[TERMINATION_DATE];
        const currentTerminationId = saveTerminationData[TERMINATION_ID];
        if (this.editMode && this.isCoverageDateChanged) {
            this.dialogRef.close({
                isCoverageDateChanged: true,
                terminationDate: this.datePipe.transform(this.terminationForm.get(DATE).value, AppSettings.DATE_FORMAT_MM_DD_YYYY),
                partnerServiceResult:
                    result.partnerServiceResult === this.partnerServiceResultStatus.SUCCESS ? this.partnerServiceResultStatus.SUCCESS : "",
            });
            return true;
        }
        if (
            this.editMode &&
            this.previousDate !== currentTerminationDate &&
            currentTerminationId !== this.lastSelectedReason &&
            (result.partnerServiceResult === this.partnerServiceResultStatus.SUCCESS ||
                result.partnerServiceResult === this.partnerServiceResultStatus.NOT_AVAILABLE)
        ) {
            const reasonObj = this.terminationList.find((termination) => termination.id === currentTerminationId);
            this.dialogRef.close({
                editMode: true,
                terminationDate: this.datePipe.transform(currentTerminationDate, AppSettings.DATE_FORMAT_MM_DD_YYYY),
                currentReason: reasonObj.name,
                partnerServiceResult:
                    result.partnerServiceResult === this.partnerServiceResultStatus.SUCCESS ? this.partnerServiceResultStatus.SUCCESS : "",
            });
            return true;
        }
        if (
            this.editMode &&
            currentComment !== this.previousComments &&
            this.previousDate === currentTerminationDate &&
            currentTerminationId === this.lastSelectedReason
        ) {
            this.dialogRef.close({
                editMode: true,
                comments: currentComment,
                partnerServiceResult:
                    result.partnerServiceResult === this.partnerServiceResultStatus.SUCCESS ? this.partnerServiceResultStatus.SUCCESS : "",
            });
            return true;
        }
        return false;
    }

    fetchMaxDate(): Date {
        const validFutureDate = new Date();
        validFutureDate.setDate(new Date().getDate() + this.configurableDayRange);
        return this.dateService.toDate(validFutureDate);
    }
    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }

    /**
     * This method will check if coverage date has been changed.
     * @param value coverage end date selected
     */
    coverageEndChange(value: Date): void {
        const previousValue = this.dateService.toDate(this.previousCoverageDate);
        this.isCoverageDateChanged = !this.dateService.isEqual(previousValue, this.dateService.toDate(value));
    }
}
