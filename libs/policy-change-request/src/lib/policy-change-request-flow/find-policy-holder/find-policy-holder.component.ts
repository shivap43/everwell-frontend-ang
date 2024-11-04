import { PolicyChangeRequestState, SetMemeberInfo, SetFindPolicyHolderDetails } from "@empowered/ngxs-store";
import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { SideNavService } from "./../side-nav/services/side-nav.service";
import { Store, Select } from "@ngxs/store";
import { Subject, Observable, Subscription } from "rxjs";
import { StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { DatePipe } from "@angular/common";
import { PolicyChangeRequestService, FindPolicyholderModel, PolicyTransactionForms } from "@empowered/api";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { PolicyChangeRequestComponent } from "../../policy-change-request.component";
import { NgxMaskPipe } from "ngx-mask";
import { UserService } from "@empowered/user";
import { ClientErrorResponseCode, AppSettings, ClientErrorResponseType } from "@empowered/constants";
import { AccountInfoState, SharedState } from "@empowered/ngxs-store";
import { PolicyChangeRequestCancelPopupComponent } from "@empowered/ui";
import { DateService } from "@empowered/date";

@Component({
    selector: "empowered-find-policy-holder",
    templateUrl: "./find-policy-holder.component.html",
    styleUrls: ["./find-policy-holder.component.scss"],
    providers: [DatePipe],
})
export class FindPolicyHolderComponent implements OnInit, OnDestroy {
    subscriptions: Subscription[] = [];
    @Input() productOffering: string;
    @Select(SharedState.regex) regex$: Observable<any>;
    findPolicyholderForm: FormGroup;
    findpolicyholderControls: any;
    private unsubscribe$ = new Subject<void>();
    birthDateIsFutureDate: boolean;
    maxDate: any;
    dataSource: any;
    validationRegex: any;
    propertyHolder: string;
    searchPolicyResponse: FindPolicyholderModel;
    DETAILS = "details";
    NAME_MAX_LENGTH = 60;
    displayedColumnsArray: string[];
    errorMessage: string;
    errorMessageArray = [];
    ERROR = "error";
    showErrorMessage: boolean;
    displayResults: boolean;
    findPolicyHolderColumnsMap = [
        {
            propertyName: "policyHolder",
        },
        {
            propertyName: "policyName",
        },
    ];
    mpGroup: string;
    wrongGroupPolicyError: boolean;
    languageStrings: Record<string, string> = this.langService.fetchPrimaryLanguageValues([
        "primary.portal.dashboard.policyChangeRequestFlow.pcrFlow",
        "primary.portal.common.cancel",
        "primary.portal.common.back",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessage",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.policyCertificateNumberRequired",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.errorMessageOnNextClick",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.findPolicyHolder",
        "primary.portal.dashboard.policyChangeRequestList.findPolicyholder",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.firstName",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.requiredField",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.invalidFirstName",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.lastName",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.invalidLastName",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.birthDate",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.futureDateError",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.invalidFutureDate",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.zip",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.invalidZipCode",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.zipCodeNotFound",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.or",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.policyCertificateNumber",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.invalidPolicyNumber",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.results",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.noPolicyMatch",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.noPolicyMatchAndClickNext",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.table.column.policyHolder",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.table.column.affectedPolicies",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.cancel",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.next",
        "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.policyNotFound",
    ]);
    secondaryLanguageStrings = {
        requiredField: this.langService.fetchSecondaryLanguageValue(
            "secondary.portal.policyChangeRequest.policyChangeRequestFlow.requiredField",
        ),
        invalidDateFormat: this.langService.fetchSecondaryLanguageValue("secondary.portal.common.invalidDateFormat"),
    };
    searchResult = true;
    maxlengthPolicyNumber = 8;
    showErrorMessageEmptyPolicy: boolean;
    isDateInvalid: boolean;
    isApiTriggered: any;
    isLoading: boolean;
    isAdmin: boolean;
    isTransferToPayrollEnabled = false;
    isTransferToDirectEnabled = false;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly store: Store,
        private readonly sideNavService: SideNavService,
        private readonly datePipe: DatePipe,
        private readonly langService: LanguageService,
        private readonly dialog: MatDialog,
        private readonly policyChangeRequestService: PolicyChangeRequestService,
        private readonly PCRDialogRef: MatDialogRef<PolicyChangeRequestComponent>,
        private cancelDialogRef: MatDialogRef<PolicyChangeRequestCancelPopupComponent>,
        private readonly maskPipe: NgxMaskPipe,
        private readonly userService: UserService,
        private readonly staticUtilService: StaticUtilService,
        private readonly utilService: UtilService,
        private readonly dateService: DateService,
    ) {
        this.subscriptions.push(
            this.userService.credential$.subscribe((credential) => {
                this.isAdmin = "adminId" in credential;
            }),
        );
        this.subscriptions.push(
            this.staticUtilService
                .cacheConfigEnabled("general.pcr.transfer_to_payroll_union_association_billing.option_show")
                .subscribe((enabled) => (this.isTransferToPayrollEnabled = enabled)),
        );
        this.subscriptions.push(
            this.staticUtilService
                .cacheConfigEnabled("general.pcr.transfer_to_direct_billing.option_show")
                .subscribe((enabled) => (this.isTransferToDirectEnabled = enabled)),
        );
    }
    /**
     * In this ngOnInit life cycle hook we are getting values from store.
     * Initalizing the values in this function.
     * Getting value of mpGroup from PCRDialogRef component.
     */
    ngOnInit(): void {
        // TODO: data isn't a property of MatDialogRef<PolicyChangeRequestComponent, any>
        // If this code actually works, the generic likely needs to be updated or we need to introduce a different type here
        this.mpGroup = (this.PCRDialogRef.componentInstance as any).data ? (this.PCRDialogRef.componentInstance as any).mpGroup : undefined;
        this.maxDate = this.datePipe.transform(new Date(), AppSettings.DATE_FORMAT);
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.sideNavService.stepClicked$.next(0);
        this.isDateInvalid = true;
        this.getStoredData();
        this.displayedColumnsArray = this.findPolicyHolderColumnsMap.map((col) => col.propertyName);
    }

    getStoredData(): void {
        const findPolicyHolderDetails = this.store.selectSnapshot(PolicyChangeRequestState.GetFindPolicyHolderDetails);
        this.subscriptions.push(
            this.regex$.subscribe((data) => {
                if (data) {
                    this.validationRegex = data;
                }
            }),
        );
        this.createFormControl();
        if (findPolicyHolderDetails) {
            this.findPolicyholderForm.controls["policyNumber"].setValue(findPolicyHolderDetails.policyNumber);
            this.findPolicyholderForm.controls["firstName"].setValue(findPolicyHolderDetails.firstName);
            this.findPolicyholderForm.controls["lastName"].setValue(findPolicyHolderDetails.lastName);
            this.findPolicyholderForm.controls["birthDate"].setValue(findPolicyHolderDetails.birthDate);
            this.findPolicyholderForm.controls["zip"].setValue(findPolicyHolderDetails.zip);
        }
        const findpolicyStoredData = this.store.selectSnapshot(PolicyChangeRequestState.GetmemberInfo);
        if (findpolicyStoredData) {
            this.propertyHolder = `${this.getTitleCaseResponse(
                this.findPolicyholderForm.controls["firstName"].value,
            )} ${this.getTitleCaseResponse(this.findPolicyholderForm.controls["lastName"].value)}`;
            this.dataSource = findpolicyStoredData.policies;
            this.displayResults = this.dataSource.length > 0 ? true : false;
        }
    }
    get policyholderformControls(): unknown {
        return this.findPolicyholderForm.controls;
    }
    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }
    createFormControl(): void {
        this.findPolicyholderForm = this.formBuilder.group({
            firstName: [
                "",
                [
                    Validators.maxLength(this.NAME_MAX_LENGTH),
                    Validators.pattern(new RegExp(this.validationRegex.NAME_WITH_SPACE_ALLOWED)),
                    Validators.required,
                ],
            ],
            lastName: [
                "",
                [
                    Validators.maxLength(this.NAME_MAX_LENGTH),
                    Validators.pattern(new RegExp(this.validationRegex.NAME_WITH_SPACE_ALLOWED)),
                    Validators.required,
                ],
            ],
            birthDate: [null, [Validators.required]],
            zip: ["", [Validators.required, Validators.pattern(new RegExp(this.validationRegex.ZIP_LENGTH))]],
            policyNumber: ["", [Validators.required, Validators.pattern(new RegExp(this.validationRegex.ALPHANUMERIC))]],
        });
        this.findpolicyholderControls = this.findPolicyholderForm.controls;
    }

    /* Added mat-datepicker does not validate the dates when user clicks
    outside the box, this is require to call validation explicitly */
    checkBirthDateChange(): any {
        if (this.findPolicyholderForm.value.birthDate) {
            this.checkBirthDate("change", { value: this.findPolicyholderForm.value.birthDate });
        }
    }
    checkBirthDate(type: string, event: any): void {
        const birthDate = this.dateService.toDate(this.datePipe.transform(event.value, AppSettings.DATE_FORMAT));
        this.maxDate = this.dateService.toDate(this.datePipe.transform(this.maxDate, AppSettings.DATE_FORMAT));
        this.findPolicyholderForm.get("birthDate").setErrors(null);
        this.birthDateIsFutureDate = false;
        if (birthDate > this.maxDate) {
            this.birthDateIsFutureDate = true;
            this.findPolicyholderForm.get("birthDate").setErrors({ invalid: true });
        }
    }

    getTitleCaseResponse(value: string): string {
        return `${value.substring(0, 1).toUpperCase()}${value.substring(1, value.length).toLowerCase()}`;
    }
    /**
     * Validating Form field
     * @param formGroup
     * @returns void
     */
    validateAllFormFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((field) => {
            const control = formGroup.get(field);
            if (control instanceof FormControl) {
                control.markAsTouched();
            } else if (control instanceof FormGroup) {
                this.validateAllFormFields(control);
            }
        });
    }
    /**
     * Function triggers on click of Next button
     * Based on validation show error messages on front end or redirecting to next step.
     */
    onNext(): void {
        this.validateAllFormFields(this.findPolicyholderForm);
        if (this.findPolicyholderForm.valid && this.displayResults) {
            this.nextStep();
        } else if (this.findPolicyholderForm.valid && !this.displayResults) {
            this.showErrorMessage = false;
            this.showErrorMessageEmptyPolicy = true;
        }
        if (this.findPolicyholderForm.valid) {
            this.showErrorMessageEmptyPolicy = false;
            this.errorMessage = this.wrongGroupPolicyError
                ? this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.policyNotFound"]
                : this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.errorMessageOnNextClick"];
            this.showErrorMessage = true;
        }
    }
    nextStep(): void {
        this.store.dispatch(new SetFindPolicyHolderDetails(this.findPolicyholderForm.value));
        this.sideNavService.setPolicyHolderName(this.propertyHolder);
        this.sideNavService.defaultStepPositionChanged$.next(2);
    }

    /**
     * Search policy api called on form submit
     * @param form : PolicyHolderForm values
     * @param valid : flag to check if form is valid
     */
    onSubmit(form: any, valid: boolean): void {
        if (valid) {
            this.isLoading = true;
            form.birthDate = this.datePipe.transform(form.birthDate, AppSettings.DATE_FORMAT);
            if (form.zip) {
                form.zip = form.zip.replace(/-/g, "");
            }
            this.subscriptions.push(
                this.policyChangeRequestService.searchPolicies(form).subscribe(
                    (response) => {
                        this.isLoading = false;
                        this.showErrorMessage = false;
                        this.showErrorMessageEmptyPolicy = false;
                        this.wrongGroupPolicyError = false;
                        if (
                            (Object.keys(response).length === 0 && response.constructor === Object) ||
                            response.policies.length === 0 ||
                            this.validateGroup(response)
                        ) {
                            this.searchResult = false;
                            this.displayResults = false;
                        } else if (this.mpGroup && (!response.groupId || this.mpGroup.toString() !== response.groupId.toString())) {
                            this.wrongGroupPolicyError = true;
                            this.searchResult = true;
                            this.displayResults = false;
                            this.showErrorMessage = true;
                            this.errorMessage =
                                this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.policyNotFound"];
                        } else {
                            this.propertyHolder = `${this.getTitleCaseResponse(form.firstName)} ${this.getTitleCaseResponse(
                                form.lastName,
                            )}`;
                            if (!this.isTransferToDirectEnabled || !this.isTransferToPayrollEnabled) {
                                response.allowedForms = response.allowedForms.filter(
                                    (allowedForm) =>
                                        (PolicyTransactionForms[allowedForm] !== PolicyTransactionForms.BILLING_MODE_CHANGE ||
                                            this.isTransferToPayrollEnabled) &&
                                        (PolicyTransactionForms[allowedForm] !== PolicyTransactionForms.TRANSFER_TO_DIRECT ||
                                            this.isTransferToDirectEnabled),
                                );
                            }
                            this.searchPolicyResponse = response;
                            this.store.dispatch(new SetMemeberInfo(this.searchPolicyResponse));
                            this.dataSource = response.policies;
                            this.displayResults = response.policies.length > 0 ? true : false;
                            this.searchResult = true;
                        }
                    },
                    (err) => {
                        this.isLoading = false;
                        this.searchResult = true;
                        this.showErrorMessageEmptyPolicy = false;
                        this.sideNavService.removeTransactionScreenFromStore(true);
                        this.displayResults = false;
                        this.showErrorAlertMessage(err);
                    },
                ),
            );
        }
    }

    validateGroup(response: any): boolean {
        const mpGroup = this.store.selectSnapshot(AccountInfoState.getMpGroupId);
        return this.isAdmin && mpGroup && response && response.groupId && response.groupId !== +mpGroup;
    }

    onCancel(): void {
        this.cancelDialogRef = this.dialog.open(PolicyChangeRequestCancelPopupComponent, {
            width: "667px",
            data: {
                cancelModalDisplayType: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.pcrFlow"],
                cancelButton: this.languageStrings["primary.portal.common.cancel"],
                backButton: this.languageStrings["primary.portal.common.back"],
                requestType: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.cancelMessage"],
                description: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved"],
            },
        });
        this.subscriptions.push(
            this.cancelDialogRef.afterClosed().subscribe((response) => {
                if (response === "cancel") {
                    this.sideNavService.removeTransactionScreenFromStore(true);
                    this.PCRDialogRef.close("close");
                }
            }),
        );
    }
    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        this.errorMessageArray = [];
        const error = err[this.ERROR];

        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS] && error[this.DETAILS].length > 0) {
            if (error[this.DETAILS][0].field === "zip") {
                this.showZipErrorMessage(true);
            } else {
                this.showZipErrorMessage(false);
                this.errorMessage = this.langService.fetchSecondaryLanguageValue(
                    `secondary.portal.dashboard.policyChangeRequestFlow.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
                );
            }
        } else if (error.status === ClientErrorResponseCode.RESP_409 && error.code === ClientErrorResponseType.INVALID_STATE) {
            this.errorMessage = this.langService.fetchSecondaryLanguageValue("secondary.portal.applicationFlow.conversion.policyNotFound");
        } else {
            this.errorMessage = this.langService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
        this.showErrorMessage = true;
    }

    showNoResponseMessage(): void {
        this.errorMessage = this.langService.fetchSecondaryLanguageValue("secondary.portal.api.policyChangeRequestFlow.noPolicyHolder");
        this.showErrorMessage = true;
    }

    validateDate(control: string, event: any): string | undefined {
        if (
            (this.findPolicyholderForm.get(control).value === null || this.findPolicyholderForm.get(control).value === "") &&
            event !== ""
        ) {
            return this.secondaryLanguageStrings.invalidDateFormat;
        }
        if (!this.findPolicyholderForm.get(control).value) {
            this.findPolicyholderForm.get(control).setErrors({ required: true });
            return this.secondaryLanguageStrings.requiredField;
        }
        return undefined;
    }

    validateZipPolicy(): string {
        if (
            this.findPolicyholderForm.get("zip").hasError("required") &&
            this.findPolicyholderForm.get("policyNumber").hasError("required")
        ) {
            return this.languageStrings[
                "primary.portal.dashboard.policyChangeRequestFlow.findPolicyHolder.policyCertificateNumberRequired"
            ];
        }
        if (this.findPolicyholderForm.get("zip").hasError("required")) {
            this.findPolicyholderForm.get("zip").setErrors(null);
        } else if (this.findPolicyholderForm.get("policyNumber").hasError("required")) {
            this.findPolicyholderForm.get("policyNumber").setErrors(null);
        } else if (this.findPolicyholderForm.get("policyNumber").value === "" && this.findPolicyholderForm.get("zip").value === "") {
            this.findPolicyholderForm.get("policyNumber").setErrors({ required: true });
            this.findPolicyholderForm.get("zip").setErrors({ required: true });
        }

        return "";
    }

    showZipErrorMessage(zipFoundFlag: boolean): void {
        if (zipFoundFlag) {
            this.findPolicyholderForm.get("zip").setErrors({
                noZipFound: zipFoundFlag,
                incorrect: true,
            });
        } else {
            this.findPolicyholderForm.get("zip").setErrors(null);
        }
        this.findPolicyholderForm.updateValueAndValidity();
        this.showErrorMessage = false;
    }

    /**
     * Validates and allows only number to be entered
     * @param event triggered on press of any key
     */
    numberValidation(event: KeyboardEvent): void {
        this.utilService.numberValidation(event);
    }

    // This method will unsubscribe all the api subscription.
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
    }
}
