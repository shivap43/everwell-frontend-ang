// Angular imports
import { HttpErrorResponse } from "@angular/common/http";
import { Component, OnDestroy, OnInit, Inject } from "@angular/core";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatOption } from "@angular/material/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Router, ActivatedRoute } from "@angular/router";
// Custom imports
import { AccountList, AccountService, StaticService, LanguageModel } from "@empowered/api";
import { Subscription, Observable, Subject } from "rxjs";
import { Select, Store } from "@ngxs/store";
import { LanguageService, LanguageState } from "@empowered/language";
import { PhoneNumber, PayFrequency, ProspectType, CountryState, SitusState, Accounts } from "@empowered/constants";
import { AccountListState, UtilService } from "@empowered/ngxs-store";
import { CustomValidation } from "@empowered/ui";
import { takeUntil } from "rxjs/operators";

export interface DialogData {
    route: ActivatedRoute;
}

export enum ControlsEnum {
    COMPANY_NAME = "companyname",
    CONTACT = "contact",
    ADDRESS = "address",
    ADDRESS1 = "address1",
    ADDRESS2 = "address2",
    CITY = "city",
    STATE = "state",
    ZIP = "zip",
    EMAIL_ADDRESSES = "emailAddresses",
    EMAIL = "email",
    PHONE_NUMBERS = "phoneNumbers",
    PHONE_NUMBER = "phoneNumber",
    PAY_FREQUENCY_ID = "payFrequencyId",
}

@Component({
    selector: "empowered-create-account-form",
    templateUrl: "./create-account-form.component.html",
    styleUrls: ["./create-account-form.component.scss"],
})
export class CreateAccountFormComponent implements OnInit, OnDestroy {
    readonly PHONE_NUMBER_MAX_LENGTH = PhoneNumber.MAX_LENGTH;
    private readonly unsubscribe$: Subject<void> = new Subject();
    state: CountryState[];
    payFrequency: PayFrequency[];
    form: FormGroup;
    apiAccount: Accounts = {} as Accounts;
    selectedState: CountryState;
    slectedSitusObject: SitusState;
    selectedPayFrequencyId: number;
    errorMessage: string;
    successMessage: string;
    errorResponse: boolean;
    accountListData: any;
    successResponse: boolean;
    showErrorMessage = false;
    duplicateName = false;
    validAddress = true;
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    fieldsLanguageKeys = [];
    isLoading = false;
    arr = [];
    duplicateArr = [];
    @Select(AccountListState.getAccountList) accountsLi: Observable<AccountList[]>;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.accounts.newAccount",
        "primary.portal.accounts.companyName",
        "primary.portal.accounts.addressOne",
        "primary.portal.accounts.addressTwo",
        "primary.portal.accounts.city",
        "primary.portal.accounts.zip",
        "primary.portal.accounts.state",
        "primary.portal.accounts.payFrequency",
        "primary.portal.common.select",
        "primary.portal.accounts.contactEmail",
        "primary.portal.accounts.contactPhone",
        "primary.portal.accounts.primaryProducer",
        "primary.portal.accounts.createAccount",
        "primary.portal.accounts.me",
        "primary.portal.accounts.someonefromMyteam",
        "primary.portal.accounts.producernotFound",
        "primary.portal.common.close",
        "primary.portal.common.cancel",
        "primary.portal.common.selectOption",
        "primary.portal.common.optional",
    ]);

    constructor(
        private readonly staticService: StaticService,
        private readonly accountService: AccountService,
        private readonly fb: FormBuilder,
        private readonly dialogRef: MatDialogRef<CreateAccountFormComponent>,
        private readonly router: Router,
        private readonly store: Store,
        private readonly utilService: UtilService,
        private readonly language: LanguageService,
        @Inject(MAT_DIALOG_DATA) private readonly data: DialogData,
    ) {}

    get emailAdressessArray(): FormArray {
        return this.form.get("contact.emailAddresses") as FormArray;
    }

    get phoneNumbersArray(): FormArray {
        return this.form.get("contact.phoneNumbers") as FormArray;
    }

    ngOnInit(): void {
        this.accountListData = this.utilService.copy(this.store.selectSnapshot(AccountListState.getAccountList));
        this.accountListData.content = this.accountListData.content.filter((element) => {
            this.arr.push(element.name);
        });

        const customValidator = new CustomValidation();
        this.staticService
            .getStates()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (value) => {
                    this.state = value;
                },
                (error) => error,
            );
        this.accountService
            .getPayFrequencies()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (value) => {
                    this.payFrequency = value;
                },
                (error) => error,
            );
        const address = this.fb.group({
            address1: ["", [Validators.required, CustomValidation.checkAddressValidation]],
            address2: ["", [CustomValidation.checkAddressValidation]],
            city: ["", [Validators.required, CustomValidation.checkCityValidation]],
            state: ["", Validators.required],
            zip: ["", [Validators.required, CustomValidation.zipCodeValidator]],
        });

        const email = this.fb.array([this.createEmail()]);

        const phoneNumber = this.fb.array([this.createItem()]);

        this.form = this.fb.group({
            companyname: ["", [Validators.required, CustomValidation.checkCompanyNameValidation]],
            contact: this.fb.group({
                address: address,
                emailAddresses: email,
                phoneNumbers: phoneNumber,
            }),
            payFrequencyId: ["", Validators.required],
        });

        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
        this.fieldsLanguageKeys = [
            { fieldName: "name", languageKey: "primary.portal.accounts.companyName" },
            { fieldName: "address1", languageKey: "primary.portal.accounts.addressOne" },
            { fieldName: "address2", languageKey: "primary.portal.accounts.addressTwo" },
            { fieldName: "city", languageKey: "primary.portal.accounts.city" },
            { fieldName: "zip", languageKey: "primary.portal.accounts.zip" },
            { fieldName: "email", languageKey: "primary.portal.accounts.contactEmail" },
            { fieldName: "phoneNumber", languageKey: "primary.portal.accounts.contactPhone" },
        ];
    }

    getErrorCompanyName(): any {
        return this.form.get(ControlsEnum.COMPANY_NAME).hasError("required")
            ? "secondary.portal.accounts.companyRequired"
            : this.form.get(ControlsEnum.COMPANY_NAME).hasError("invalidCompanyName")
                ? "secondary.portal.accounts.companyInvalid"
                : this.form.get(ControlsEnum.COMPANY_NAME).hasError("invalidCompanyNameLength")
                    ? "secondary.portal.accounts.minCharRequired"
                    : "";
    }

    getErrorZip(): any {
        return this.form.get(ControlsEnum.CONTACT).get(ControlsEnum.ADDRESS).get(ControlsEnum.ZIP).hasError("required")
            ? "secondary.portal.accounts.zipRequired"
            : this.form.get(ControlsEnum.CONTACT).get(ControlsEnum.ADDRESS).get(ControlsEnum.ZIP).hasError("invalidZip")
                ? "secondary.portal.accounts.zipInvalid"
                : "";
    }

    getErrorAddress1(): any {
        return this.form.get(ControlsEnum.CONTACT).get(ControlsEnum.ADDRESS).get(ControlsEnum.ADDRESS1).hasError("required")
            ? "secondary.portal.accounts.addressRequired"
            : this.form.get(ControlsEnum.CONTACT).get(ControlsEnum.ADDRESS).get(ControlsEnum.ADDRESS1).hasError("invalidAddress")
                ? "secondary.portal.accounts.addressInvalid"
                : "";
    }

    getErrorAddress2(): any {
        return this.form.get(ControlsEnum.CONTACT).get(ControlsEnum.ADDRESS).get(ControlsEnum.ADDRESS2).hasError("required")
            ? "secondary.portal.accounts.addressRequired"
            : this.form.get(ControlsEnum.CONTACT).get(ControlsEnum.ADDRESS).get(ControlsEnum.ADDRESS2).hasError("invalidAddress")
                ? "secondary.portal.accounts.addressInvalid"
                : "";
    }

    getErrorCity(): any {
        return this.form.get(ControlsEnum.CONTACT).get(ControlsEnum.ADDRESS).get(ControlsEnum.CITY).hasError("required")
            ? "secondary.portal.accounts.cityRequired"
            : this.form.get(ControlsEnum.CONTACT).get(ControlsEnum.ADDRESS).get(ControlsEnum.CITY).hasError("invalidCity")
                ? "secondary.portal.accounts.cityInvalid"
                : "";
    }

    getErrorState(): any {
        return this.form.get(ControlsEnum.CONTACT).get(ControlsEnum.ADDRESS).get(ControlsEnum.STATE).hasError("required")
            ? "secondary.portal.accounts.stateRequired"
            : "";
    }

    getErrorPayFrequency(): any {
        return this.form.get(ControlsEnum.PAY_FREQUENCY_ID).hasError("required") ? "secondary.portal.accounts.payRequired" : "";
    }

    getErrorEmail(): any {
        return this.form.get(ControlsEnum.CONTACT).get(ControlsEnum.EMAIL_ADDRESSES).get("0").get(ControlsEnum.EMAIL).hasError("required")
            ? "secondary.portal.accounts.emailRequired"
            : this.form
                .get(ControlsEnum.CONTACT)
                .get(ControlsEnum.EMAIL_ADDRESSES)
                .get("0")
                .get(ControlsEnum.EMAIL)
                .hasError("invalidEmail")
                ? "secondary.portal.accounts.emailInvalid"
                : "";
    }

    getErrorPhone(): any {
        return this.form
            .get(ControlsEnum.CONTACT)
            .get(ControlsEnum.PHONE_NUMBERS)
            .get("0")
            .get(ControlsEnum.PHONE_NUMBER)
            .hasError("required")
            ? "secondary.portal.accounts.phoneRequired"
            : this.form
                .get(ControlsEnum.CONTACT)
                .get(ControlsEnum.PHONE_NUMBERS)
                .get("0")
                .get(ControlsEnum.PHONE_NUMBER)
                .hasError("invalidPhone")
                ? "secondary.portal.accounts.phoneInvalid"
                : "";
    }

    createItem(): FormGroup {
        return this.fb.group({
            phoneNumber: ["", [Validators.required, CustomValidation.checkPhoneValidation]],
            extension: [""],
            type: ["WORK", Validators.required],
        });
    }

    createEmail(): FormGroup {
        return this.fb.group({
            email: ["", [Validators.required, CustomValidation.checkEmailValidation]],
            type: ["WORK", Validators.required],
        });
    }

    closeForm(): void {
        this.dialogRef.close();
    }

    checkDuplicateName(companyName: string): void {
        this.duplicateName = false;
        this.duplicateArr = this.arr.filter((i) => i.toLocaleLowerCase() === companyName.toLocaleLowerCase());
        if (this.duplicateArr.length > 0) {
            this.duplicateName = true;
        }
    }

    onSubmit(): void {
        this.checkDuplicateName(this.form.value.companyname);
        const formValue = this.form.value;
        const formContact = formValue.contact;
        let validateStateZip = true;
        if (!this.duplicateName) {
            if (!this.form.invalid) {
                this.isLoading = true;
                this.staticService
                    .validateStateZip(this.selectedState.abbreviation, formValue.contact.address.zip)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (resp) => {
                            if (formValue && validateStateZip) {
                                this.apiAccount.name = formValue.companyname;
                                this.apiAccount.contact = formContact;
                                this.apiAccount.contact.address.state = this.selectedState.abbreviation;
                                this.apiAccount.contact.name = formValue.companyname;
                                this.apiAccount.contact.typeId = 1;
                                this.apiAccount.primaryContact = formValue.contact;
                                this.apiAccount.primaryContact.address.state = this.selectedState.abbreviation;
                                this.apiAccount.primaryContact.name = formValue.companyname;
                                this.apiAccount.primaryContact.typeId = 1;
                                this.slectedSitusObject = {
                                    state: this.selectedState,
                                    zip: formValue.contact.address.zip,
                                };
                                this.apiAccount.situs = this.slectedSitusObject;
                                this.apiAccount.payFrequencyId = this.selectedPayFrequencyId;
                                this.apiAccount.type = ProspectType.CLIENT;
                            }
                            this.accountService
                                .createAccount(this.apiAccount)
                                .pipe(takeUntil(this.unsubscribe$))
                                .subscribe(
                                    (res) => {
                                        this.isLoading = false;
                                        this.errorResponse = false;
                                        this.successResponse = true;
                                        this.successMessage = "secondary.portal.accounts.success";
                                        this.closeForm();
                                        const location: string = res.headers.get("location");
                                        const stringArray = location.split("/");
                                        const mpGroup = Number(stringArray[stringArray.length - 1]);
                                        this.router.navigate([`./${mpGroup}/dashboard`], {
                                            relativeTo: this.data.route,
                                        });
                                    },
                                    (error: HttpErrorResponse) => {
                                        this.isLoading = false;
                                        this.errorResponse = true;
                                        this.errorMessage = "";
                                        if (error.status === 400) {
                                            this.getErrorMessage(error);
                                        } else if (error.status === 409) {
                                            this.errorMessage = this.secondaryLanguages
                                                .filter((lang) => lang.tagName === "secondary.portal.accounts.409")
                                                .pop().value;
                                        } else {
                                            this.errorMessage = this.secondaryLanguages
                                                .filter((lang) => lang.tagName === "secondary.portal.accounts.error")
                                                .pop().value;
                                        }
                                    },
                                );
                        },
                        (error) => {
                            this.isLoading = false;
                            this.errorResponse = true;
                            this.errorMessage = this.secondaryLanguages
                                .filter((lang) => lang.tagName === "secondary.portal.accounts.zipMismatch")
                                .pop().value;
                            validateStateZip = false;
                        },
                    );
            }
        } else {
            this.isLoading = false;
            this.errorResponse = true;
            this.errorMessage = this.secondaryLanguages
                .filter((lang) => lang.tagName === "secondary.portal.accounts.companyNameExists")
                .pop().value;
        }
    }

    numberValidation(event: any): void {
        if (event.type === "keypress" && !(event.keyCode <= 57 && event.keyCode >= 48)) {
            event.preventDefault();
        }
        if (event.type === "paste") {
            const ZIP_REGEXP = new RegExp(/^([0-9])*$/);
            if (!ZIP_REGEXP.test(event.clipboardData.getData("Text"))) {
                event.preventDefault();
            }
        }
    }

    changeClient(value: any): void {
        this.selectedState = { name: (value.source.selected as MatOption).viewValue, abbreviation: value.source.value };
    }

    changeClientPayFrequency(value: any): void {
        this.selectedPayFrequencyId = value.source.value;
    }

    /**
     * This method destroys all subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    getErrorMessage(error: any): void {
        const errorDetails = error.error.details;
        const invalidFields = [];
        const requiredFields = [];
        errorDetails.forEach((detail) => {
            this.fieldsLanguageKeys.forEach((field) => {
                if (detail.field.indexOf(field["fieldName"]) >= 0) {
                    const fieldName = this.primaryLanguages.filter((lang) => lang.tagName === field["languageKey"]).pop().value;
                    if (detail.message.indexOf("regex.validation") >= 0) {
                        invalidFields.push(fieldName);
                    } else {
                        requiredFields.push(fieldName);
                    }
                }
            });
        });
        if (invalidFields.length > 0) {
            let invalidNames = "";
            for (const invalidField of invalidFields) {
                invalidNames += invalidField + ",";
            }
            this.errorMessage +=
                invalidNames.replace(/,(\s+)?$/, " ") +
                (invalidFields.length === 1
                    ? this.secondaryLanguages.filter((lang) => lang.tagName === "secondary.portal.accounts.isInvalid").pop().value
                    : this.secondaryLanguages.filter((lang) => lang.tagName === "secondary.portal.accounts.areInvalid").pop().value);
        }
        if (requiredFields.length > 0) {
            let requiredNames = "";
            for (const requiredField of requiredFields) {
                requiredNames += requiredField + ",";
            }
            this.errorMessage +=
                requiredNames.replace(/,(\s+)?$/, " ") +
                (requiredFields.length === 1
                    ? this.secondaryLanguages.filter((lang) => lang.tagName === "secondary.portal.accounts.isRequired").pop().value
                    : this.secondaryLanguages.filter((lang) => lang.tagName === "secondary.portal.accounts.areRequired").pop().value);
        }
        this.errorMessage += " " + this.secondaryLanguages.filter((lang) => lang.tagName === "secondary.portal.accounts.400").pop().value;
    }
}
