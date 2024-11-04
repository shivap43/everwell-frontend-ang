import { Component, OnInit, Inject, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Select, Store } from "@ngxs/store";
import { Observable, of, Subject, combineLatest, BehaviorSubject } from "rxjs";
import { takeUntil, switchMap, finalize, shareReplay, catchError, tap } from "rxjs/operators";
import {
    ConfigName,
    MASK_SSN_FORMAT,
    PhoneNumber,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    ClientErrorResponseDetailCodeType,
    SSN_MASK_LENGTH,
    SSN_MAX_LENGTH,
    ContactType,
    CountryState,
    MemberBeneficiary,
    MemberProfile,
    MemberDependent,
    MemberContact,
} from "@empowered/constants";
import { MemberService, DependentContact, StaticService, SSNMask } from "@empowered/api";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { StaticUtilService, UtilService, SharedState, RegexDataType } from "@empowered/ngxs-store";

const PARTIALLY_MASKED_SSN = "PARTIALLY_MASKED";
const FULLY_MASKED_SSN = "FULLY_MASKED";
const FULLY_VISIBLE_SSN = "FULLY_VISIBLE";
const BENEFICIARY_MISSING_INFO_CONTROLS = {
    CITY: "city",
    SSN: "ssn",
    PHONE_NUMBER: "phone",
    PHONE_TYPE: "phoneType",
    IS_MOBILE: "isMobile",
    ADDRESS1: "address1",
    ADDRESS2: "address2",
    STATE: "state",
    ZIP: "zip",
};
const SSN_IDENTIFIER_ID = 1;
const ERROR = "error";
const DETAILS = "details";
const EMPTYSTRING = "";
const ITIN = "ITIN";
const SSN = "SSN";

@Component({
    selector: "empowered-beneficiary-missing-info",
    templateUrl: "./beneficiary-missing-info.component.html",
    styleUrls: ["./beneficiary-missing-info.component.scss"],
})
export class BeneficiaryMissingInfoComponent implements OnInit, OnDestroy {
    @Select(SharedState.regex) regex$: Observable<any>;
    states$: Observable<CountryState[]> = this.staticService.getStates().pipe(shareReplay(1));
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.beneficiaryMissingInfo.title",
        "primary.portal.beneficiaryMissingInfo.beneficiaryInfo",
        "primary.portal.beneficiaryMissingInfo.description",
        "primary.portal.beneficiaryMissingInfo.homeAddressCity",
        "primary.portal.members.personalLabel.socialSecurityNumber",
        "primary.portal.profile.accountContacts.addUpdateContact.phone",
        "primary.portal.census.manualEntry.phoneType",
        "primary.portal.beneficiaryMissingInfo.isMobileNumber",
        "primary.portal.continueToApplication",
        "primary.portal.common.requiredField",
        "primary.portal.members.beneficiaryValidationMsg.city",
        "primary.portal.beneficiaryMissingInfo.cityMaxLength",
        "primary.portal.members.beneficiaryValidationMsg.ssnInvalidEntry",
        "primary.portal.members.beneficiaryValidationMsg.mustBeDigits",
        "primary.portal.beneficiaryMissingInfo.duplicateSsn",
        "primary.portal.members.beneficiaryValidationMsg.phoneNumber",
        "primary.portal.common.show",
        "primary.portal.common.hide",
        "primary.portal.common.cancel",
        "primary.portal.appFlow.homeStreetAddress1",
        "primary.portal.members.dependentValidationMsg.streetAddress1Msg1",
        "primary.portal.appFlow.homeStreetAddress2",
        "primary.portal.common.optional",
        "primary.portal.members.streetAddressHint1",
        "primary.portal.members.dependent.personalInfo.city",
        "primary.portal.members.dependent.personalInfo.state",
        "primary.portal.common.select",
        "primary.portal.member.ssn_itin",
    ]);
    secondaryLanguageStrings: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.applicationFlow.dependents.error.maxLength",
        "secondary.portal.members.selectionRequired",
        "secondary.portal.members.api.ssn.duplicate",
        "secondary.portal.members.api.itin.duplicate",
    ]);
    form: FormGroup;
    queryString = ["input.ng-invalid", "mat-selection-list.ng-invalid > mat-list-option"].join(",");
    validationRegex: RegexDataType;
    customPattern = { X: { pattern: new RegExp("\\d"), symbol: "X" }, 0: { pattern: new RegExp("\\d") } };
    ssnMaskedPattern = { X: { pattern: new RegExp("\\d"), symbol: "X" }, 0: { pattern: new RegExp("\\d") } };
    ssnUnmaskedPattern = { X: { pattern: new RegExp("\\d"), symbol: null }, 0: { pattern: new RegExp("\\d") } };
    isMaskedTrue: boolean;
    isShowHideButtonVisible: boolean;
    invalidSSNValidation: RegExp;
    beneficiaryObj: MemberBeneficiary;
    cityInput: string;
    ssnInput: string;
    phoneNumberInput: string;
    phoneTypeInput: string;
    phoneNumberTypes = [ContactType.HOME, ContactType.OTHER];
    phoneMaxLength = PhoneNumber.MAX_LENGTH;
    private readonly unsubscribe$: Subject<void> = new Subject();
    firstName: string;
    lastName: string;
    isSpinnerLoading: boolean;
    errorMessage: string;
    showErrorMessage: boolean;
    displayPhoneField = false;
    ssnFormat = MASK_SSN_FORMAT;
    maxLength: number;
    displayContactFields: boolean;
    private readonly stateControlValueSubject$: BehaviorSubject<string> = new BehaviorSubject("");
    readonly stateControlValue$: Observable<string> = this.stateControlValueSubject$.asObservable();
    ssnMaxLength = SSN_MAX_LENGTH;
    unmaskedSSNValue: string;
    maskedSSNValue: string;
    isFullyVisible = false;
    isFullyMasked = false;
    isPartiallyMasked = false;
    addForm: boolean;
    isSSNValue: boolean;

    /**
     * This method will be automatically invoked when an instance of the class is created.
     * @param language is reference of LanguageService
     * @param injectedData is the inject mat-bottom-sheet data
     * @param fb is reference of FormBuilder
     * @param staticUtilService is reference of StaticUtilService
     * @param memberService is reference of MemberService
     * @param dialogRefSheet is mat-bottom-sheet reference of BeneficiaryMissingInfoComponent
     * @param utilService is reference of UtilService
     * @param changeDetectorRef is reference of ChangeDetectorRef
     * @param store is reference of Store
     */
    constructor(
        private readonly language: LanguageService,
        @Inject(MAT_BOTTOM_SHEET_DATA)
        readonly injectedData: {
            beneficiary: MemberBeneficiary;
            mpGroup: string;
            memberId: string;
            dependentInformation: MemberDependent;
            isJuvenilePlan: boolean;
            memberInfo?: MemberProfile;
            memberContactInfo: MemberContact[];
        },
        private readonly fb: FormBuilder,
        private readonly staticUtilService: StaticUtilService,
        private readonly memberService: MemberService,
        private readonly dialogRefSheet: MatBottomSheetRef<BeneficiaryMissingInfoComponent>,
        private readonly utilService: UtilService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly store: Store,
        private readonly staticService: StaticService,
    ) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     * Gets secondary language from store, Validates SSN and sets injectedData
     * used to call @method hideErrorAlertMessage that hides alert messages
     * used to call @method createForm that creates a form
     * used to call @method getSSNConfiguration that gets the SSN masking configuration
     */
    ngOnInit(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.hideErrorAlertMessage();
        this.form = this.fb.group({});
        this.isSpinnerLoading = true;
        combineLatest(this.regex$, this.staticUtilService.cacheConfigValue(ConfigName.SINGLE_LINE_INPUT_MAX_LENGTH))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([regex, maxLength]) => {
                if (regex) {
                    this.validationRegex = regex;
                    this.invalidSSNValidation = new RegExp(this.validationRegex.INVALID_SSN);
                }
                this.maxLength = +maxLength;
                this.createForm();
                this.getSSNConfiguration();
                this.firstName = this.injectedData.beneficiary.name.firstName;
                this.lastName = this.injectedData.beneficiary.name.lastName;
                this.changeDetectorRef.detectChanges();
                this.isSpinnerLoading = false;
            });
    }
    /**
     * This method is used to create form by adding all required controls and validations
     */
    createForm(): void {
        if (this.injectedData && this.injectedData.beneficiary) {
            this.createAddressControls();
            if (!this.injectedData.beneficiary.ssn && this.injectedData.isJuvenilePlan) {
                this.form.addControl(
                    BENEFICIARY_MISSING_INFO_CONTROLS.SSN,
                    this.fb.control("", [Validators.pattern(new RegExp(this.validationRegex.UNMASKSSN_ITIN))]),
                );
            }
            if (
                !this.injectedData.beneficiary.contact ||
                !this.injectedData.beneficiary.contact.phoneNumbers.length ||
                !this.injectedData.beneficiary.contact.phoneNumbers[0].phoneNumber
            ) {
                this.createPhoneControl();
            }
        }
    }
    /**
     * creates required address controls based on previous value
     */
    createAddressControls(): void {
        if (!(this.injectedData.beneficiary.contact && this.injectedData.beneficiary.contact.address)) {
            this.createAddress1Control();
            this.createAddress2Control();
            this.createCityControl();
            this.createStateControl();
            this.createZipControl();
        } else {
            if (!this.injectedData.beneficiary.contact.address.address1) {
                this.createAddress1Control();
            }
            if (!this.injectedData.beneficiary.contact.address.address2) {
                this.createAddress2Control();
            }
            if (!this.injectedData.beneficiary.contact.address.city) {
                this.createCityControl();
            }
            if (!this.injectedData.beneficiary.contact.address.state || !this.injectedData.beneficiary.contact.address.zip) {
                this.createStateControl();
                this.createZipControl();

                // subscribe to state value updates to pass along to zip code input for match validation
                this.form.controls.state.valueChanges
                    .pipe(
                        tap((value: string) => {
                            this.stateControlValueSubject$.next(value);
                        }),
                        takeUntil(this.unsubscribe$),
                    )
                    .subscribe();
            }
        }
    }
    /**
     * creates address1 control
     */
    createAddress1Control(): void {
        this.displayContactFields = true;
        this.form.addControl(
            BENEFICIARY_MISSING_INFO_CONTROLS.ADDRESS1,
            this.fb.control("", [
                Validators.required,
                Validators.pattern(this.validationRegex.ADDRESS),
                Validators.maxLength(this.maxLength),
            ]),
        );
    }
    /**
     * creates address2 control
     */
    createAddress2Control(): void {
        this.displayContactFields = true;
        this.form.addControl(
            BENEFICIARY_MISSING_INFO_CONTROLS.ADDRESS2,
            this.fb.control("", [Validators.pattern(this.validationRegex.ADDRESS), Validators.maxLength(this.maxLength)]),
        );
    }
    /**
     * creates city control
     */
    createCityControl(): void {
        this.displayContactFields = true;
        this.form.addControl(
            BENEFICIARY_MISSING_INFO_CONTROLS.CITY,
            this.fb.control("", [
                Validators.required,
                Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED),
                Validators.maxLength(this.maxLength),
            ]),
        );
    }
    /**
     * creates state control
     */
    createStateControl(): void {
        this.displayContactFields = true;
        this.form.addControl(BENEFICIARY_MISSING_INFO_CONTROLS.STATE, this.fb.control("", [Validators.required]));
    }
    /**
     * creates zip control
     */
    createZipControl(): void {
        this.displayContactFields = true;
        this.form.addControl(BENEFICIARY_MISSING_INFO_CONTROLS.ZIP, this.fb.control("", [Validators.required]));
    }
    /**
     * creates phone control
     */
    createPhoneControl(): void {
        this.displayPhoneField = true;
        this.form.addControl(
            BENEFICIARY_MISSING_INFO_CONTROLS.PHONE_NUMBER,
            this.fb.control("", [Validators.required, Validators.pattern(new RegExp(this.validationRegex.VALID_PHONE))]),
        );
        this.form.addControl(BENEFICIARY_MISSING_INFO_CONTROLS.PHONE_TYPE, this.fb.control(ContactType.HOME, [Validators.required]));
        this.form.addControl(BENEFICIARY_MISSING_INFO_CONTROLS.IS_MOBILE, this.fb.control(false));
    }
    /**
     * This method is used to update beneficiary details, if form is valid
     */
    onSubmit(): void {
        if (this.form.valid) {
            this.isSpinnerLoading = true;
            this.changeDetectorRef.detectChanges();
            if (!this.injectedData.beneficiary.isMember) {
                this.getUpdatedBeneficiaryObject();
            }
            this.getAPICall()
                .pipe(
                    finalize(() => {
                        this.isSpinnerLoading = false;
                        this.changeDetectorRef.detectChanges();
                    }),
                )
                .subscribe(
                    (res) => {
                        this.hideErrorAlertMessage();
                        this.closePopup();
                    },
                    (error) => {
                        if (error.status === ClientErrorResponseCode.RESP_409 && error.error.code === ClientErrorResponseType.DUPLICATE) {
                            if (error.error.details && error.error.details.some((detail) => detail.field === SSN)) {
                                this.errorMessage = this.secondaryLanguageStrings["secondary.portal.members.api.ssn.duplicate"];
                            } else if (error.error.details && error.error.details.some((detail) => detail.field === ITIN)) {
                                this.errorMessage = this.secondaryLanguageStrings["secondary.portal.members.api.itin.duplicate"];
                            } else {
                                this.errorMessage = this.language.fetchSecondaryLanguageValue(
                                    `secondary.api.dependent.${error.status}.${error.code}`,
                                );
                            }
                            this.showErrorMessage = true;
                        } else {
                            this.showErrorAlertMessage(error);
                        }
                    },
                );
        }
    }
    /**
     * gets updated Beneficiary object
     */
    getUpdatedBeneficiaryObject(): void {
        this.beneficiaryObj = this.utilService.copy(this.injectedData.beneficiary);
        delete this.beneficiaryObj.dependentId;
        this.beneficiaryObj.contact.address.address1 = this.injectedData.beneficiary.contact.address.address1 || this.form.value.address1;
        this.beneficiaryObj.contact.address.address2 = this.injectedData.beneficiary.contact.address.address2 || this.form.value.address2;
        this.beneficiaryObj.contact.address.city = this.injectedData.beneficiary.contact.address.city || this.form.value.city;
        this.beneficiaryObj.contact.address.state = this.injectedData.beneficiary.contact.address.state || this.form.value.state;
        this.beneficiaryObj.contact.address.zip = this.injectedData.beneficiary.contact.address.zip || this.form.value.zip;
        this.beneficiaryObj.contact.phoneNumbers = [
            {
                phoneNumber: !this.displayPhoneField
                    ? this.injectedData.beneficiary.contact.phoneNumbers[0].phoneNumber
                    : this.form.controls.phone.value,
                type: !this.displayPhoneField
                    ? this.injectedData.beneficiary.contact.phoneNumbers[0].type
                    : this.form.controls.phoneType.value,
                isMobile: !this.displayPhoneField
                    ? this.injectedData.beneficiary.contact.phoneNumbers[0].isMobile
                    : this.form.controls.isMobile.value,
            },
        ];
        this.beneficiaryObj.ssn = this.injectedData.beneficiary.ssn || this.unmaskedSSNValue;
    }
    /**
     * Method to get api call based on condition
     * @returns {Observable<MemberProfile | void | DependentContact>}
     */
    getAPICall(): Observable<MemberProfile | void | DependentContact> {
        return this.injectedData.beneficiary.isMember
            ? this.updateMemberInfo()
            : this.checkAndUpdateDependentDetails().pipe(
                takeUntil(this.unsubscribe$),
                switchMap(() =>
                    this.memberService.updateMemberBeneficiary(
                        +this.injectedData.memberId,
                        +this.injectedData.mpGroup,
                        this.injectedData.beneficiary.id,
                        this.beneficiaryObj,
                    ),
                ),
            );
    }
    /**
     * Method to update member info
     * @returns Observable of MemberProfile
     */
    updateMemberInfo(): Observable<MemberProfile> {
        const memberInfo: MemberProfile = this.injectedData.memberInfo;
        memberInfo.ssn = this.unmaskedSSNValue;
        return this.memberService.updateMember(memberInfo, this.injectedData.mpGroup, this.injectedData.memberId, false);
    }
    /**
     * Handles and displays error messages
     * @param err error occurred
     */
    showErrorAlertMessage(err: Error): void {
        const error = err[ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[DETAILS].length) {
            if (error[DETAILS].code === ClientErrorResponseType.DUPLICATE) {
                this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.portal.members.api.ssn.duplicate");
            } else if (error[DETAILS][0].code === ClientErrorResponseDetailCodeType.VALID_PHONE) {
                this.errorMessage = this.language.fetchPrimaryLanguageValue(`${error[DETAILS][0].message}`);
            } else {
                this.errorMessage = this.language.fetchSecondaryLanguageValue(
                    `secondary.portal.members.api.${error.status}.${error.code}.${error[DETAILS][0].field}`,
                );
            }
        } else if (error.code === ClientErrorResponseType.DUPLICATE) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.portal.members.api.${error.status}.${error.code}`);
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
        this.showErrorMessage = true;
    }

    /**
     * Hides alert message on successful calls
     */
    hideErrorAlertMessage(): void {
        this.errorMessage = "";
        this.showErrorMessage = false;
    }

    /**
     * Updates the Dependent contact info if the beneficiary has dependentId
     * @returns Observable of type void or DependentContact
     */
    checkAndUpdateDependentDetails(): Observable<void | DependentContact> {
        if (this.injectedData.beneficiary.dependentId) {
            let dependentContact: DependentContact;
            let isError = false;
            if (this.displayPhoneField || this.displayContactFields) {
                return this.memberService
                    .getDependentContact(
                        +this.injectedData.memberId,
                        this.injectedData.beneficiary.dependentId.toString(),
                        +this.injectedData.mpGroup,
                    )
                    .pipe(
                        tap((res) => {
                            dependentContact = this.utilService.copy(res);
                        }),
                        catchError((error: HttpErrorResponse) => {
                            isError = true;
                            return this.errorSaveDependent(error);
                        }),
                        switchMap((res) => this.successSaveDependent(isError, dependentContact)),
                        switchMap(() => {
                            if (this.injectedData.isJuvenilePlan && this.beneficiaryObj.ssn) {
                                return this.memberService.saveDependentIdentifier(
                                    +this.injectedData.memberId,
                                    this.injectedData.beneficiary.dependentId.toString(),
                                    SSN_IDENTIFIER_ID,
                                    +this.injectedData.mpGroup,
                                    this.beneficiaryObj.ssn,
                                );
                            }
                            return of(null);
                        }),
                    );
            }
            if (this.injectedData.isJuvenilePlan && !this.injectedData.beneficiary.ssn) {
                return this.memberService.saveDependentIdentifier(
                    +this.injectedData.memberId,
                    this.injectedData.beneficiary.dependentId.toString(),
                    SSN_IDENTIFIER_ID,
                    +this.injectedData.mpGroup,
                    this.beneficiaryObj.ssn,
                );
            }
        }
        return of(null);
    }
    /**
     * saves dependent contact when contact is not found
     * @param error error details
     * @returns Observable of type HttpResponse
     */
    errorSaveDependent(error: HttpErrorResponse): Observable<HttpResponse<Response>> {
        if (error && error.error && error.error.status === ClientErrorResponseCode.RESP_404) {
            const dependentContact: DependentContact = this.beneficiaryObj.contact as DependentContact;
            return this.saveDependentContact(dependentContact);
        }
        throw error;
    }

    /**
     * saves dependent contact when contact is found
     * @param isError indicates of error occurred or not
     * @returns Observable of type HttpResponse
     */
    successSaveDependent(isError: boolean, dependentContact: DependentContact): Observable<HttpResponse<Response> | void> {
        if (!isError) {
            dependentContact.address.address1 = this.beneficiaryObj.contact.address.address1;
            dependentContact.address.address2 = this.beneficiaryObj.contact.address.address2;
            dependentContact.address.city = this.beneficiaryObj.contact.address.city;
            dependentContact.address.state = this.beneficiaryObj.contact.address.state;
            dependentContact.address.zip = this.beneficiaryObj.contact.address.zip;
            const isDuplicate =
                dependentContact.phoneNumbers &&
                dependentContact.phoneNumbers.some(
                    (phoneNumber) => phoneNumber.phoneNumber === this.beneficiaryObj.contact.phoneNumbers[0].phoneNumber,
                );
            if (!isDuplicate) {
                dependentContact.phoneNumbers.push(...this.beneficiaryObj.contact.phoneNumbers);
            }
            dependentContact.phoneNumbers = dependentContact.phoneNumbers.filter((item) => item.phoneNumber !== EMPTYSTRING);
            dependentContact.contactType = dependentContact.phoneNumbers
                ? (dependentContact.phoneNumbers[0].type as ContactType)
                : dependentContact.contactType;
            return this.saveDependentContact(dependentContact);
        }
        return of(null);
    }

    /**
     * saves dependent contact
     * @param dependentContact dependent contact data
     * @returns Observable of type HttpResponse
     */
    saveDependentContact(dependentContact: DependentContact): Observable<HttpResponse<Response>> {
        return this.memberService.saveDependentContact(
            dependentContact,
            +this.injectedData.memberId,
            this.injectedData.beneficiary.dependentId.toString(),
            +this.injectedData.mpGroup,
        );
    }

    /**
     * to close the popup
     */
    closePopup(): void {
        this.isSpinnerLoading = false;
        this.dialogRefSheet.dismiss(true);
    }

    /**
     * to get ssn config value
     */
    getSSNConfiguration(): void {
        this.isPartiallyMasked = false;
        this.isFullyMasked = false;
        this.isFullyVisible = false;
        this.staticUtilService
            .cacheConfigValue(ConfigName.SSN_MASKING_CONFIG)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((ssnConfig) => {
                if (ssnConfig === PARTIALLY_MASKED_SSN) {
                    this.isMaskedTrue = true;
                    this.isPartiallyMasked = true;
                    this.isShowHideButtonVisible = true;
                } else if (ssnConfig === FULLY_MASKED_SSN) {
                    this.isMaskedTrue = true;
                    this.isFullyMasked = true;
                } else if (ssnConfig === FULLY_VISIBLE_SSN) {
                    this.isShowHideButtonVisible = false;
                    this.isMaskedTrue = false;
                    this.isFullyVisible = true;
                }
                this.isPartiallyMasked = ssnConfig === SSNMask.PARTIALLY_MASKED;
                this.isFullyMasked = ssnConfig === SSNMask.FULLY_MASKED;
                this.isFullyVisible = ssnConfig === SSNMask.FULLY_VISIBLE;
            });
        if (this.form.controls.ssn) {
            this.form.controls.ssn.setErrors(null);
            this.form.controls.ssn.clearValidators();
        }
    }

    /**
     * method to do masking and unmasking as per condition
     * @param isMasked boolean value to check mask
     */
    ssnMaskingToggler(isMasked: boolean): void {
        this.form.controls.ssn.clearValidators();
        this.form.controls.ssn.setValidators(Validators.pattern(this.validationRegex.UNMASKSSN_ITIN));
        if (!this.form.controls.ssn.value) {
            this.unmaskedSSNValue = "";
        }
        if (!this.isFullyVisible && this.form.controls.ssn.valid) {
            if (isMasked) {
                this.unmaskedSSNValue = (this.unmaskedSSNValue || "").replace(/(\d{3})(\d{2})(\d{4})/, "$1-$2-$3");
                this.isMaskedTrue = false;
                this.form.controls.ssn.setValue(this.unmaskedSSNValue);
                this.form.controls.ssn.clearValidators();
                this.form
                    .get("ssn")
                    .setValidators([Validators.minLength(SSN_MAX_LENGTH), Validators.pattern(this.validationRegex.UNMASKSSN_ITIN)]);
                this.form.controls.ssn.markAsTouched({ onlySelf: true });
                this.form.controls.ssn.updateValueAndValidity();
            } else {
                this.isMaskedTrue = true;
                this.form.controls.ssn.setValue(this.maskedSSNValue);
                this.form.controls.ssn.setErrors(null);
                this.form.controls.ssn.clearValidators();
                this.form.controls.ssn.updateValueAndValidity();
            }
        }
    }
    /**
     * Masks SSN, partially/fully
     */
    maskValue(): void {
        const ssnControl = this.form.controls.ssn;
        this.isFullyVisible = ssnControl.valid ? !(this.isPartiallyMasked || this.isFullyMasked) : true;
        if (!this.isFullyMasked && ssnControl.value && ssnControl.valid) {
            let tempMask = "";
            const ssnFormValue = ssnControl.value.replace(/-/g, "");
            const lengthUnmaskedSSN = ssnFormValue.length;
            tempMask = "XXX-XX-" + ssnFormValue.slice(SSN_MASK_LENGTH, lengthUnmaskedSSN);
            this.maskedSSNValue = tempMask;
            this.unmaskedSSNValue = ssnFormValue;
            ssnControl.setValue(this.maskedSSNValue);
            this.isMaskedTrue = true;
            ssnControl.clearValidators();
            ssnControl.updateValueAndValidity();
            ssnControl.setErrors(null);
        } else if (ssnControl.value === "") {
            this.isFullyVisible = true;
        }
    }
    /**
     * method to detect changes on keyup in order to hide button on deleting value from ssn field
     */
    onSSNValueChange(): void {
        this.isSSNValue = Boolean(this.form.controls.ssn.value);
        this.form.controls.ssn.markAsTouched();
    }

    /**
     * Method to check phone is invalid and uncheck mobile number checkbox
     */
    setIsMobile(): void {
        if (this.form.controls.phone.invalid) {
            this.form.controls.isMobile.patchValue(false);
        }
    }

    /**
     * Implements Angular OnDestroy Life Cycle hook
     * This method is used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
