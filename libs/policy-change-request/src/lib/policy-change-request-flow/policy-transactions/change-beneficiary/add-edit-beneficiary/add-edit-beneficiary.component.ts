import { Component, OnInit, EventEmitter, Output, Input, OnDestroy } from "@angular/core";
import { AbstractControl, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { StaticService, ThirdPartyBeneficiaryType } from "@empowered/api";
import { DatePipe } from "@angular/common";
import { Select, Store } from "@ngxs/store";
import { SetBeneficiary, PolicyChangeRequestState, SharedState } from "@empowered/ngxs-store";
import { NgxMaskPipe } from "ngx-mask";
import { LanguageService } from "@empowered/language";
import { Subscription, Observable } from "rxjs";
import { DateFormats, SSN_MAX_LENGTH, SSN_MASK_LENGTH, AppSettings, CountryState } from "@empowered/constants";

@Component({
    selector: "empowered-add-edit-beneficiary",
    templateUrl: "./add-edit-beneficiary.component.html",
    styleUrls: ["./add-edit-beneficiary.component.scss"],
    providers: [DatePipe],
})
export class AddEditBeneficiaryComponent implements OnInit, OnDestroy {
    subscriptions: Subscription[] = [];
    addBeneficiaryForm: FormGroup;
    suffixes$: Observable<string[]>;
    states$: Observable<CountryState[]>;
    validationRegex: any;
    maxDate: string;
    phoneNumberMaxLength = AppSettings.PHONE_NUM_MAX_LENGTH;
    ssnMaxLength = SSN_MAX_LENGTH;
    showSpinner: boolean;
    nameWithHypenApostrophesValidation: any;
    primaryBeneficiaryList: any = [];
    secondaryBeneficiaryList: any = [];
    unmaskedSSNValue = "";
    maskedSSNValue = "";
    isMaskedTrue: boolean;
    @Input() beneficiary: any;
    @Input() isPrimaryBeneficiary: any;
    @Input() beneficiaryId: number;
    @Output() beneficiaryEvent = new EventEmitter();
    @Select(SharedState.regex) regex$: Observable<any>;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addEditBeneficiary.header",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addEditBeneficiary.firstName",
        "primary.portal.policyChangeRequest.transactions.requiredField",
        "primary.portal.policyChangeRequest.transactions.maxLength60",
        "primary.portal.policyChangeRequest.transactions.namevalidationMsg1",
        "primary.portal.policyChangeRequest.transactions.namevalidationMsg2",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addEditBeneficiary.mi",
        "primary.portal.common.optional",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addEditBeneficiary.lastName",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addEditBeneficiary.suffix",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addEditBeneficiary.relationship",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addEditBeneficiary.ssn",
        "primary.portal.members.beneficiaryValidationMsg.SSNMsg2",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addEditBeneficiary.birthdate",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addEditBeneficiary.dateFormat",
        "primary.portal.policyChangeRequest.transactions.changeGender.validationError.birtdate",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addEditBeneficiary.streetAddress1",
        "primary.portal.policyChangeRequest.transactions.maxLength100",
        "primary.portal.policyChangeRequest.transactions.streetAddress1ValidationMessage",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addEditBeneficiary.streetAddress2",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addEditBeneficiary.city",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addEditBeneficiary.state",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addEditBeneficiary.zip",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addEditBeneficiary.validationError.zip",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.addEditBeneficiary.validationError.phone",
        "primary.portal.policyChangeRequest.transactions.invalidPhoneNumber",
        "primary.portal.common.cancel",
        "primary.portal.common.save",
        "primary.portal.common.update",
        "primary.portal.member.ssn_itin",
    ]);

    constructor(
        private readonly fb: FormBuilder,
        private readonly staticService: StaticService,
        private readonly datePipe: DatePipe,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly maskPipe: NgxMaskPipe,
    ) {
        this.subscriptions.push(
            this.regex$.subscribe((data) => {
                if (data) {
                    this.validationRegex = data;
                }
            }),
        );
    }

    ngOnInit(): void {
        this.nameWithHypenApostrophesValidation = new RegExp(this.validationRegex.NAME_WITH_HYPENS_APOSTROPHES);
        this.maxDate = this.datePipe.transform(new Date(), AppSettings.DATE_FORMAT);
        this.createFormControl();
        this.states$ = this.staticService.getStates();
        this.suffixes$ = this.staticService.getSuffixes();
        const primary = this.store.selectSnapshot(PolicyChangeRequestState.GetPrimaryBeneficiary);
        const secondary = this.store.selectSnapshot(PolicyChangeRequestState.GetContingentBeneficiary);
        this.primaryBeneficiaryList = primary ? [...primary] : [];
        this.secondaryBeneficiaryList = secondary ? [...secondary] : [];

        if (this.beneficiary) {
            this.addBeneficiaryForm.patchValue(this.beneficiary);
            this.validateAllFormFields(this.addBeneficiaryForm);
            this.addBeneficiaryForm.controls.ssn.clearValidators();
            this.addBeneficiaryForm.controls.ssn.setErrors(null);
            this.addBeneficiaryForm.controls.ssn.updateValueAndValidity();
            this.maskValue();
            this.ssnMaskingToggler(false);
        }
    }

    /**
     * Creates the add beneficiary form group, initializing fields with values and validators
     */
    createFormControl(): void {
        this.addBeneficiaryForm = this.fb.group({
            firstName: [
                "",
                Validators.compose([
                    Validators.required,
                    Validators.maxLength(60),
                    Validators.pattern(new RegExp(this.validationRegex.NAME)),
                ]),
            ],
            middleName: ["", Validators.compose([Validators.maxLength(60), Validators.pattern(new RegExp(this.validationRegex.NAME))])],
            lastName: [
                "",
                Validators.compose([
                    Validators.required,
                    Validators.maxLength(60),
                    Validators.pattern(new RegExp(this.validationRegex.NAME)),
                ]),
            ],
            relationship: ["", [Validators.required, Validators.pattern(this.validationRegex.ALPHA)]],
            ssn: [null, Validators.pattern(this.validationRegex.UNMASKSSN_ITIN)],
            birthDate: ["", Validators.required],
            suffix: [""],
            address1: [
                "",
                Validators.compose([
                    Validators.required,
                    Validators.maxLength(100),
                    Validators.pattern(new RegExp(this.validationRegex.ADDRESS)),
                ]),
            ],
            address2: ["", Validators.compose([Validators.maxLength(100), Validators.pattern(new RegExp(this.validationRegex.ADDRESS))])],
            city: [
                "",
                Validators.compose([
                    Validators.required,
                    Validators.maxLength(100),
                    Validators.pattern(new RegExp(this.validationRegex.ADDRESS)),
                ]),
            ],
            state: ["", Validators.required],
            zip: ["", Validators.compose([Validators.required, Validators.pattern(new RegExp(this.validationRegex.ZIP_CODE))])],
            phoneNumber: ["", Validators.compose([Validators.required, Validators.pattern(new RegExp(this.validationRegex.VALID_PHONE))])],
            allocation: [null],
            allocationType: [this.isPrimaryBeneficiary ? ThirdPartyBeneficiaryType.PRIMARY : ThirdPartyBeneficiaryType.CONTINGENT],
        });
    }
    /**
     * Gets form control in the add / edit beneficiary form group
     * @returns form control as an object where the key is the control's name and the value is the form control
     */
    get formControl(): { [key: string]: AbstractControl } {
        return this.addBeneficiaryForm.controls;
    }

    /**
     * Convert date to yyyy-MM-dd format
     */
    setBirthDateFormat(): void {
        this.addBeneficiaryForm.value["birthDate"] = this.datePipe.transform(
            this.addBeneficiaryForm.value["birthDate"],
            DateFormats.YEAR_MONTH_DAY,
        );
    }

    cancel(): void {
        this.addBeneficiaryForm.reset();
        this.beneficiaryEvent.emit({ event: "cancel" });
    }
    /**
     * Method validates zip code
     */
    validateZipCode(): void {
        if (
            (this.formControl["zip"].dirty || this.formControl["state"].dirty) &&
            this.formControl["zip"].value &&
            this.formControl["state"].value
        ) {
            this.showSpinner = true;
            this.subscriptions.push(
                this.staticService.validateStateZip(this.formControl["state"].value, this.formControl["zip"].value).subscribe(
                    (resp) => {
                        this.showSpinner = false;
                        this.formControl["zip"].setErrors(null);
                        this.formControl["state"].setErrors(null);
                        this.addBeneficiaryForm.updateValueAndValidity();
                    },
                    (error) => {
                        this.showSpinner = false;
                        this.formControl["zip"].setErrors({ zipValid: true });
                        this.formControl["state"].setErrors({
                            zipValid: true,
                        });
                        this.addBeneficiaryForm.updateValueAndValidity();
                    },
                ),
            );
        }
    }

    /**
     * Validate the form and add beneficiary
     */
    addBeneficiary(): void {
        this.validateAllFormFields(this.addBeneficiaryForm);
        if (this.addBeneficiaryForm.valid) {
            this.addBeneficiaryForm.controls.ssn.setValue(this.unmaskedSSNValue);
            this.setBirthDateFormat();
            this.checkBeneficiaryType();
        }
    }

    checkBeneficiaryType(): any {
        if (this.isPrimaryBeneficiary) {
            if (this.primaryBeneficiaryList) {
                this.primaryBeneficiaryList = [...this.primaryBeneficiaryList];
            }
            this.primaryBeneficiaryList.push(this.addBeneficiaryForm.value);
        } else {
            if (this.secondaryBeneficiaryList) {
                this.secondaryBeneficiaryList = [...this.secondaryBeneficiaryList];
            }
            this.secondaryBeneficiaryList.push(this.addBeneficiaryForm.value);
        }
        this.storeBeneficiary();
    }

    storeBeneficiary(): void {
        this.store.dispatch(new SetBeneficiary(this.primaryBeneficiaryList, this.secondaryBeneficiaryList));
        this.beneficiaryEvent.emit();
        this.addBeneficiaryForm.reset();
    }

    /**
     * Validate the form and update beneficiary details
     * @returns void
     */
    updateBeneficiary(): void {
        this.validateAllFormFields(this.addBeneficiaryForm);
        if (this.addBeneficiaryForm.valid) {
            this.addBeneficiaryForm.controls.ssn.setValue(this.unmaskedSSNValue);
            this.setBirthDateFormat();
            if (this.isPrimaryBeneficiary) {
                this.primaryBeneficiaryList[this.beneficiaryId] = this.addBeneficiaryForm.value;
            } else {
                this.addBeneficiaryForm.controls.ssn.setValue(this.unmaskedSSNValue);
                this.secondaryBeneficiaryList[this.beneficiaryId] = this.addBeneficiaryForm.value;
            }
            this.storeBeneficiary();
        }
    }
    /**
     * This method will unsubscribe all the api subscription.
     */

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
     * method to do masking and unmasking as per condition
     * executes while blur and click of show and hide link
     * @param isMasked boolean value to check mask
     */
    ssnMaskingToggler(isMasked: boolean): void {
        this.addBeneficiaryForm.controls.ssn.clearValidators();
        this.addBeneficiaryForm.controls.ssn.setValidators(Validators.pattern(this.validationRegex.UNMASKSSN_ITIN));
        if (!this.addBeneficiaryForm.controls.ssn.value) {
            this.unmaskedSSNValue = "";
        }
        if (this.addBeneficiaryForm.controls.ssn.value && this.addBeneficiaryForm.controls.ssn.valid) {
            if (isMasked) {
                this.unmaskedSSNValue = (this.unmaskedSSNValue || "").replace(/(\d{3})(\d{2})(\d{4})/, "$1-$2-$3");
                this.isMaskedTrue = false;
                this.addBeneficiaryForm.controls.ssn.setValue(this.unmaskedSSNValue);
                this.addBeneficiaryForm.controls.ssn.clearValidators();
                this.addBeneficiaryForm
                    .get("ssn")
                    .setValidators([Validators.minLength(SSN_MAX_LENGTH), Validators.pattern(this.validationRegex.UNMASKSSN_ITIN)]);
                this.addBeneficiaryForm.controls.ssn.markAsTouched({ onlySelf: true });
                this.addBeneficiaryForm.controls.ssn.updateValueAndValidity();
            } else {
                this.isMaskedTrue = true;
                this.ssnMaxLength = SSN_MAX_LENGTH;
                this.addBeneficiaryForm.controls.ssn.setValue(this.maskedSSNValue);
                this.addBeneficiaryForm.controls.ssn.setErrors(null);
                this.addBeneficiaryForm.controls.ssn.clearValidators();
                this.addBeneficiaryForm.controls.ssn.updateValueAndValidity();
            }
        }
    }

    /**
     * Masks SSN, partially/fully
     */
    maskValue(): void {
        const ssnControl = this.addBeneficiaryForm.controls.ssn;
        if (ssnControl.value && ssnControl.valid) {
            let tempMask = "";
            const ssnFormValue = ssnControl.value.replace(/-/g, "");
            if (ssnFormValue !== this.unmaskedSSNValue) {
                const lengthUnmaskedSSN = ssnFormValue.length;
                tempMask = "XXX-XX-" + ssnFormValue.slice(SSN_MASK_LENGTH, lengthUnmaskedSSN);
                this.maskedSSNValue = tempMask;
                this.unmaskedSSNValue = ssnFormValue;
                ssnControl.setValue(this.maskedSSNValue);
                this.isMaskedTrue = true;
                ssnControl.clearValidators();
                ssnControl.updateValueAndValidity();
                ssnControl.setErrors(null);
            }
        }
    }

    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }

    ngOnDestroy(): void {
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
    }
}
