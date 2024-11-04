import { Component, OnInit, Optional, Inject, OnDestroy } from "@angular/core";
import { AccountService, StaticService, EmailTypes, AccountContactType } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Validators, FormGroup, FormBuilder } from "@angular/forms";
import { Subscription, Observable } from "rxjs";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { SharedState } from "@empowered/ngxs-store";
import {
    ClientErrorResponseDetailCodeType,
    ClientErrorResponseCode,
    PhoneNumber,
    ZIP_CODE_MIN_LENGTH,
    ZIP_CODE_MAX_LENGTH,
    AppSettings,
    Address,
    CountryState,
    PhoneNumberType,
    AddUpdateContactDialogData,
} from "@empowered/constants";
import { PhoneFormatConverterPipe } from "../../pipes";

const DETAILS = "details";

@Component({
    selector: "empowered-add-update-contact-info",
    templateUrl: "./add-update-contact-info.component.html",
    styleUrls: ["./add-update-contact-info.component.scss"],
})
export class AddUpdateContactInfoComponent implements OnInit, OnDestroy {
    isSpinnerLoading = false;
    showErrorMessage = false;
    langStrings: Record<string, string>;
    errorMessage: string;
    mpGroupId: string;
    contactId: number;
    states: CountryState[];
    addUpdateContactForm: FormGroup;
    leaveWithoutSavingPopup: any;
    parentMode: string;
    isAdd: boolean;
    accountContactTypes: AccountContactType[];
    title: string;
    contactNameText: string;
    isPrimary: boolean;
    existingAddresses: Address[];
    isPrimaryDisable: boolean;
    replacePrimary: any;
    existingAddrSelected = false;
    showType: boolean;
    parentModeType = {
        ACCOUNT: "ACCOUNT",
        CARRIER: "CARRIER",
    };
    validationRegex: any;
    @Select(SharedState.regex) regex$: Observable<any>;
    phoneFilter: PhoneFormatConverterPipe;
    accountContactTypeIds = {
        PRIMARY: 1,
        BILLING: 2,
    };
    allowEditingAddress: boolean;
    allowEditingContactName: boolean;
    allowEditingPhoneNumber: boolean;
    allowEditingEmailAddress: boolean;

    subscriber: Subscription[] = [];
    isFormatted: boolean;
    nameWithHypenApostrophesValidation: any;

    // used in template
    MAX_LENGTH_UNFORMATTED = PhoneNumber.MAX_LENGTH_DIGITS_ONLY;
    MAX_LENGTH_FORMATTED = PhoneNumber.MAX_LENGTH;
    maxLength = PhoneNumber.MAX_LENGTH_DIGITS_ONLY;

    constructor(
        private readonly accountService: AccountService,
        private readonly staticService: StaticService,
        private readonly store: Store,
        private readonly languageService: LanguageService,
        private readonly formBuilder: FormBuilder,
        @Optional() @Inject(MAT_DIALOG_DATA) private readonly data: AddUpdateContactDialogData,
        private readonly dialogRef: MatDialogRef<AddUpdateContactInfoComponent>,
    ) {
        this.subscriber.push(
            this.regex$.subscribe((regex) => {
                if (regex) {
                    this.validationRegex = regex;
                    this.nameWithHypenApostrophesValidation = new RegExp(this.validationRegex.NAME_WITH_HYPENS_APOSTROPHES);
                }
            }),
        );
    }

    ngOnInit(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.isSpinnerLoading = false;
        this.existingAddrSelected = false;
        this.existingAddresses = [];
        this.parentMode = this.data.parentMode;
        this.isAdd = this.data.isAdd;
        this.isPrimary = this.data.isPrimary;
        this.showType = this.data.showType ? true : false;
        this.replacePrimary = this.data.replacePrimary;
        this.isPrimaryDisable = this.isPrimary;
        this.mpGroupId = this.data.mpGroupId;
        this.phoneFilter = new PhoneFormatConverterPipe();
        this.isFormatted = false;
        this.allowEditingAddress = this.data.allowEditingAddress;
        this.allowEditingContactName = this.data.allowEditingContactName;
        this.allowEditingPhoneNumber = this.data.allowEditingPhoneNumber;
        this.allowEditingEmailAddress = this.data.allowEditingEmailAddress;
        this.initializeForm();
        this.getDropdownData();
        this.fetchLanguageStrings();
        this.setupDisplayContent();
        if (this.showType) {
            this.getAccountContactTypes();
        }
        if (!this.isAdd) {
            this.getContactDetails();
        }
        this.replacePrimary = this.data.replacePrimary
            ? this.langStrings["primary.portal.profile.accountContacts.addUpdateContact.replacePrimary"].replace(
                "#name",
                this.data.replacePrimary,
            )
            : undefined;
    }

    initializeForm(): void {
        this.addUpdateContactForm = this.formBuilder.group(
            {
                type: ["", this.showType ? Validators.required : ""],
                name: [
                    { value: "", disabled: !this.isAdd && !this.allowEditingContactName },
                    Validators.compose([
                        Validators.pattern(new RegExp(this.validationRegex.ACCOUNT_NAME)),
                        Validators.maxLength(AppSettings.MAX_LENGTH_200),
                        Validators.required,
                    ]),
                ],
                existing: [""],
                address1: [
                    { value: "", disabled: !this.isAdd && !this.allowEditingAddress },
                    [
                        Validators.required,
                        Validators.maxLength(AppSettings.MAX_LENGTH_100),
                        Validators.pattern(new RegExp(this.validationRegex.ADDRESS)),
                    ],
                ],
                address2: [
                    { value: "", disabled: !this.isAdd && !this.allowEditingAddress },
                    [Validators.maxLength(AppSettings.MAX_LENGTH_100), Validators.pattern(new RegExp(this.validationRegex.ADDRESS))],
                ],
                city: [
                    { value: "", disabled: !this.isAdd && !this.allowEditingAddress },
                    [
                        Validators.required,
                        Validators.maxLength(AppSettings.MAX_LENGTH_100),
                        Validators.pattern(new RegExp(this.validationRegex.CITY)),
                    ],
                ],
                state: [{ value: "", disabled: !this.isAdd && !this.allowEditingAddress }, Validators.required],
                zip: [
                    { value: "", disabled: !this.isAdd && !this.allowEditingAddress },
                    [
                        Validators.required,
                        Validators.minLength(ZIP_CODE_MIN_LENGTH),
                        Validators.maxLength(ZIP_CODE_MAX_LENGTH),
                        Validators.pattern(new RegExp(this.validationRegex.ZIP_CODE)),
                    ],
                ],
                phone: [
                    { value: "", disabled: !this.isAdd && !this.allowEditingPhoneNumber },
                    [Validators.required, Validators.pattern(new RegExp(this.validationRegex.VALID_PHONE))],
                ],
                email: [
                    { value: "", disabled: !this.isAdd && !this.allowEditingEmailAddress },
                    [Validators.required, Validators.pattern(new RegExp(this.validationRegex.EMAIL))],
                ],
            },
            { updateOn: "blur" },
        );
        this.maxLength = PhoneNumber.MAX_LENGTH;
    }
    getAccountContactTypes(): void {
        this.accountContactTypes = [];
        this.subscriber.push(
            this.accountService.getAccountContactTypes().subscribe((result) => {
                if (result && result.length) {
                    this.accountContactTypes = result.filter((x) => x.id === this.accountContactTypeIds.BILLING);
                }
            }),
        );
    }
    setupDisplayContent(): void {
        if (this.parentMode === this.parentModeType.CARRIER) {
            const carrierName = this.data.carrier.name;
            this.title = this.isAdd
                ? this.langStrings["primary.portal.profile.accountContacts.addUpdateContact.title_addCarrierContact"].replace(
                    "#name",
                    carrierName,
                )
                : this.langStrings["primary.portal.profile.accountContacts.addUpdateContact.title_editCarrierContact"].replace(
                    "#name",
                    carrierName,
                );
            this.contactNameText = this.langStrings["primary.portal.profile.accountContacts.addUpdateContact.name_carrier"];
        } else if (this.parentMode === this.parentModeType.ACCOUNT) {
            this.title = this.isAdd
                ? this.langStrings["primary.portal.profile.accountContacts.addUpdateContact.titleAddBillingContact"]
                : this.isPrimary
                    ? this.langStrings["primary.portal.profile.accountContacts.addUpdateContact.title_editPrimaryContact"]
                    : this.langStrings["primary.portal.profile.accountContacts.addUpdateContact.title_editBillingContact"];
            this.contactNameText = this.langStrings["primary.portal.profile.accountContacts.addUpdateContact.name_account"];
        }
    }

    getDropdownData(): void {
        this.isSpinnerLoading = true;
        this.hideErrorAlertMessage();
        this.subscriber.push(
            this.staticService.getStates().subscribe(
                (Response) => {
                    this.isSpinnerLoading = false;
                    this.states = Response;
                },
                (error) => {
                    this.isSpinnerLoading = false;
                    if (error) {
                        this.showErrorAlertMessage(error);
                    } else {
                        this.errorMessage = null;
                    }
                },
            ),
        );
        let getExistingContactObserver: any;
        if (this.parentMode === this.parentModeType.CARRIER) {
            getExistingContactObserver = this.accountService.getCarrierContacts(this.mpGroupId.toString(), this.data.carrier.id);
        } else if (this.parentMode === this.parentModeType.ACCOUNT) {
            getExistingContactObserver = this.accountService.getAccountContacts("typeId");
        }
        this.subscriber.push(
            getExistingContactObserver.subscribe(
                (Response) => {
                    this.isSpinnerLoading = false;
                    Response.forEach((element) => {
                        this.existingAddresses.push(element.address);
                    });
                },
                (error) => {
                    this.isSpinnerLoading = false;
                    if (error) {
                        this.showErrorAlertMessage(error);
                    } else {
                        this.errorMessage = null;
                    }
                },
            ),
        );
    }

    getContactDetails(): void {
        let getContact: any;
        if (this.parentMode === this.parentModeType.CARRIER) {
            getContact = this.accountService.getAccountCarrierContact(this.mpGroupId, this.data.carrier.id, this.data.carrierContact.id);
        } else if (this.parentMode === this.parentModeType.ACCOUNT) {
            getContact = this.accountService.getAccountContact(this.mpGroupId, this.data.accountContact.id, "typeId");
        }
        this.subscriber.push(
            getContact.subscribe(
                (Response) => {
                    this.patchContactDetails(Response);
                },
                (Error) => {},
            ),
        );
    }

    patchContactDetails(contactDetails: any): void {
        this.addUpdateContactForm.get("name").patchValue(contactDetails.name);
        if (contactDetails.address) {
            this.addUpdateContactForm.get("address1").patchValue(contactDetails.address.address1);
            this.addUpdateContactForm.get("address2").patchValue(contactDetails.address.address2);
            this.addUpdateContactForm.get("city").patchValue(contactDetails.address.city);
            this.addUpdateContactForm.get("state").patchValue(contactDetails.address.state);
            this.addUpdateContactForm.get("zip").patchValue(contactDetails.address.zip);
        }
        if (contactDetails.phoneNumbers.length) {
            this.isFormatted = true;
            this.maxLength = PhoneNumber.MAX_LENGTH;
            this.addUpdateContactForm.get("phone").patchValue(this.formatNumber(contactDetails.phoneNumbers[0].phoneNumber));
        }
        if (contactDetails.emailAddresses.length) {
            this.addUpdateContactForm.get("email").patchValue(contactDetails.emailAddresses[0].email);
        }
        if (this.showType) {
            this.addUpdateContactForm.get("type").patchValue(contactDetails.type.id.toString());
            this.addUpdateContactForm.get("type").disable();
        }
    }

    formatNumber(num: string): string {
        this.isFormatted = true;
        return this.phoneFilter.transform(num, AppSettings.COUNTRY_US);
    }

    onChangePrimary(event: MatCheckboxChange): void {
        this.isPrimary = event.checked;
    }

    changeFormat(): void {
        if (this.addUpdateContactForm.get("phone").value) {
            this.maxLength = PhoneNumber.MAX_LENGTH;
            const unformattedNum = this.normalizeFormat(this.addUpdateContactForm.get("phone").value);
            this.addUpdateContactForm.get("phone").patchValue(unformattedNum);
        }
    }

    normalizeFormat(num: string): string {
        if (num && num.indexOf("-") !== -1) {
            this.isFormatted = false;
            this.maxLength = PhoneNumber.MAX_LENGTH;
            return num.replace(/-/g, "");
        }
        return num;
    }

    revertToFormat(): void {
        if (this.addUpdateContactForm.get("phone").value) {
            this.maxLength = PhoneNumber.MAX_LENGTH;
            this.addUpdateContactForm.get("phone").patchValue(this.formatNumber(this.addUpdateContactForm.get("phone").value));
        }
    }

    onSubmit(): void {
        this.hideErrorAlertMessage();
        if (this.addUpdateContactForm.valid) {
            this.addUpdateContactForm.get("phone").clearValidators();
            const formData = this.addUpdateContactForm.getRawValue();
            const contactObject = {
                name: formData.name,
                primary: this.isPrimary,
                address: {
                    address1: formData.address1,
                    address2: formData.address2,
                    city: formData.city,
                    state: formData.state,
                    zip: formData.zip,
                },
                phoneNumbers: [
                    {
                        phoneNumber: this.normalizeFormat(formData.phone),
                        type: PhoneNumberType.OTHER,
                    },
                ],
                emailAddresses: [
                    {
                        email: formData.email,
                        type: EmailTypes.OTHER,
                    },
                ],
            };
            let submitFormObserver: any;
            if (this.parentMode === this.parentModeType.CARRIER) {
                const carrierId = this.data.carrier.id;
                if (this.isAdd) {
                    submitFormObserver = this.accountService.addCarrierContact(this.mpGroupId, carrierId, contactObject);
                } else {
                    submitFormObserver = this.accountService.updateAccountCarrierContact(
                        this.mpGroupId.toString(),
                        carrierId,
                        this.data.carrierContact.id,
                        contactObject,
                    );
                }
            } else if (this.parentMode === this.parentModeType.ACCOUNT) {
                if (this.isAdd) {
                    contactObject["typeId"] = formData.type;
                    submitFormObserver = this.accountService.addAccountContact(this.mpGroupId.toString(), contactObject);
                } else {
                    if (this.data.accountContact.type) {
                        contactObject["typeId"] = this.data.accountContact.type.id;
                    }
                    const contactId = this.data.accountContact.id;
                    submitFormObserver = this.accountService.updateAccountContact(this.mpGroupId.toString(), contactId, contactObject);
                }
            }
            this.subscriber.push(
                submitFormObserver.subscribe(
                    (Response) => {
                        this.isSpinnerLoading = false;
                        this.addUpdateContactForm.markAsPristine();
                        this.closePopup(true);
                    },
                    (Error) => {
                        this.isSpinnerLoading = false;
                        this.showErrorAlertMessage(Error);
                    },
                ),
            );
        }
    }

    existingAddressChange(event: any): void {
        if (event.value) {
            this.existingAddrSelected = true;
            const address = event.value;
            this.addUpdateContactForm.get("address1").patchValue(address.address1);
            this.addUpdateContactForm.get("address2").patchValue(address.address2);
            this.addUpdateContactForm.get("city").patchValue(address.city);
            this.addUpdateContactForm.get("state").patchValue(address.state);
            this.addUpdateContactForm.get("zip").patchValue(address.zip);
        }
    }
    removeDefaultExisting(): void {
        if (this.existingAddrSelected) {
            this.existingAddrSelected = false;
            this.addUpdateContactForm.get("existing").setValue(null);
        }
    }

    /** Fetches language strings from db */
    fetchLanguageStrings(): void {
        this.langStrings = this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.profile.accountContacts.addUpdateContact.name_account",
            "primary.portal.profile.accountContacts.addUpdateContact.selectExisting",
            "primary.portal.profile.accountContacts.addUpdateContact.address1",
            "primary.portal.profile.accountContacts.addUpdateContact.address2",
            "primary.portal.profile.accountContacts.addUpdateContact.address2.hint",
            "primary.portal.profile.accountContacts.addUpdateContact.city",
            "primary.portal.profile.accountContacts.addUpdateContact.state",
            "primary.portal.profile.accountContacts.addUpdateContact.zip",
            "primary.portal.profile.accountContacts.addUpdateContact.phone",
            "primary.portal.profile.accountContacts.addUpdateContact.email",
            "primary.portal.common.optional",
            "primary.portal.common.close",
            "primary.portal.common.save",
            "primary.portal.common.add",
            "primary.portal.profile.accountContacts.addUpdateContact.makePrimary",
            "primary.portal.profile.accountContacts.addUpdateContact.replacePrimary",
            "primary.portal.profile.accountContacts.addUpdateContact.title_editPrimaryContact",
            "primary.portal.profile.accountContacts.addUpdateContact.title_editBillingContact",
            "primary.portal.profile.accountContacts.addUpdateContact.name_carrier",
            "primary.portal.profile.accountContacts.addUpdateContact.title_editCarrierContact",
            "primary.portal.profile.accountContacts.addUpdateContact.title_addCarrierContact",
            "primary.portal.profile.accountContacts.addUpdateContact.type",
            "primary.portal.profile.accountContacts.addUpdateContact.titleAddBillingContact",
            "primary.portal.profile.accountContacts.addUpdateContact.cancelEditingContact",
            "primary.portal.profile.accountContacts.addUpdateContact.invalidEmail",
        ]);
    }

    /** Error Handling */
    hideErrorAlertMessage(): void {
        this.showErrorMessage = false;
        this.errorMessage = null;
    }

    /**
     * This method is used to show error messages when the API call fails.
     * @param err error object of type ERROR
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        const error = err["error"];
        this.showErrorMessage = true;
        if (error.status === ClientErrorResponseCode.RESP_400 && error[DETAILS].length) {
            if (error[DETAILS][0].code === "zip.stateMismatch") {
                this.showMissMatchStateError();
                return;
            }
            if (error[DETAILS][0].code === ClientErrorResponseDetailCodeType.RESTRICTED_EMAIL) {
                this.errorMessage = this.langStrings["primary.portal.profile.accountContacts.addUpdateContact.invalidEmail"];
                return;
            }
            if (
                error[DETAILS][0].code === ClientErrorResponseDetailCodeType.VALID_EMAIL ||
                error[DETAILS][0].code === ClientErrorResponseDetailCodeType.VALID_PHONE
            ) {
                this.errorMessage = this.languageService.fetchPrimaryLanguageValue(error[DETAILS][0].message);
                return;
            }
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                `secondary.portal.profile.addUpdateContact.api.${error.status}.${error.code}.${error[DETAILS][0].field}`,
            );
        } else {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
        this.showErrorMessage = true;
    }

    showMissMatchStateError(): void {
        this.addUpdateContactForm.get("zip").setErrors({ mismatch: true });
    }

    closePopup(flag?: boolean): void {
        this.dialogRef.close(flag);
    }

    ngOnDestroy(): void {
        this.subscriber.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
