import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { MemberService, StaticService, AuthenticationService, PreferredLang, AccountService, EmailTypes } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { Subscription, forkJoin, Observable, Subject, throwError, combineLatest } from "rxjs";

import {
    SetContactForm,
    SetRegistrationMemberId,
    SetGroupId,
    RegistrationState,
    SharedState,
    SetIncompleteRegistrationAlert,
    StaticUtilService,
} from "@empowered/ngxs-store";
import { RegexForFieldValidation, AddressVerificationComponent, validateStateAndZipCode } from "@empowered/ui";
import {
    ClientErrorResponseCode,
    ADDRESS_OPTIONS,
    AppSettings,
    PhoneContactTypes,
    Portals,
    PersonalAddress,
    ContactType,
    MemberProfile,
    MemberContact,
    ConfigName,
} from "@empowered/constants";
import { catchError, switchMap, takeUntil, tap, filter } from "rxjs/operators";
import { LanguageService } from "@empowered/language";
import { UserService } from "@empowered/user";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { TPIRestrictionsForHQAccountsService, SharedService, EmpoweredModalService } from "@empowered/common-services";

const COUNTRY_NAME = "USA";
const AFLAQ_HQ_REGISTRATION_EDIT = "aflac_hq.member.registration.info.edit";

@Component({
    selector: "empowered-contact-info",
    templateUrl: "./contact-info.component.html",
    styleUrls: ["./contact-info.component.scss"],
})
export class ContactInfoComponent implements OnInit, OnDestroy {
    propOne: string;
    propTwo: string;
    workType = [];
    personalForm: MemberProfile;
    contactForm: FormGroup;
    address: FormGroup;
    apiMember: Observable<HttpResponse<MemberProfile>>;
    apiMemberContact: Observable<any>;
    apiSubscriptionPut: any;
    emailSelected = false;
    emailValue = "ELECTRONIC";
    states;
    phoneType = "HOME";
    memberId;
    mpGroup: number;
    inlineValidation = false;
    errorMessage = "";
    error = false;
    phone = "phoneNumber";
    strDuplicate = "duplicate";
    strEmailAdress = "emailAddresses";
    EMAIL_REGEX = new RegExp(RegexForFieldValidation.EMAIL);
    PHONE_REGEX = new RegExp(RegexForFieldValidation.PHONE);
    profile: FormGroup;
    phoneNumbers: FormGroup;
    emailAddresses: FormGroup;
    preferredLangOptions: string[];
    subscriptions: Subscription[] = [];
    personalFormResp;
    saveError = false;
    incompleteRegistrationError: string;
    loadSpinner = true;
    contactInfoResponse: any;
    readonly zipMaxLength = 5;
    isDateLoaded = false;
    isMobile = false;
    isMemberPortal = false;
    isDuplicateEmail = false;
    portal: string;
    firstName: string;
    formInitInvalid = false;
    isAflacReadOnly = false;
    hidePersonalInfoTab: boolean;
    hideContactTab: boolean;
    hideDependentTab: boolean;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.optional",
        "primary.portal.register.contactInfo.streetAddress1",
        "primary.portal.register.contactInfo.streetAddress2",
        "primary.portal.register.contactInfo.city",
        "primary.portal.register.contactInfo.state",
        "primary.portal.register.contactInfo.zip",
        "primary.portal.register.contactInfo.phoneNumber",
        "primary.portal.register.contactInfo.workOrHome",
        "primary.portal.register.contactInfo.infoReceiveType",
        "primary.portal.register.contactInfo.receiveTypeEmailField",
        "primary.portal.common.next",
        "primary.portal.common.back",
        "primary.portal.common.confirm",
        "primary.portal.members.personalLabel.preferredLanguage",
        "primary.portal.members.personalLabel.select",
        "primary.portal.members.mmpPolicyDeliveryMsgElectronic",
        "primary.portal.members.mappPolicyDeliveryMsgElectronic",
        "primary.portal.members.mmpPolicyDeliveryMsgPaper",
        "primary.portal.members.mappPolicyDeliveryMsgPaper",
        "primary.portal.common.city.patternError",
        "primary.portal.register.contactInfo.confirmInfo",
        "primary.portal.common.finishRegistration",
        "primary.portal.common.requiredField",
    ]);
    employeeZipFlag = true;
    @Select(SharedState.regex) regex$: Observable<any>;
    private readonly unsubscribe$ = new Subject<void>();
    isFormSubmit = false;
    zipMinLength = 5;
    zipMaximumLength = 10;
    phoneNumberLength = AppSettings.PHONE_NUM_MAX_LENGTH;
    addressRegex: RegExp;
    cityRegex: RegExp;
    zipRegex: RegExp;
    phoneRegex: RegExp;
    numberRegex: RegExp;
    suggestedAddress: PersonalAddress;
    tempMemberAddress: PersonalAddress;
    addressResp: boolean;
    addressMessage: string[] = [];
    duplicateEmailErrors: string[] = [];
    selectedAddress: string;
    openAddressModal = false;
    addressValidationSwitch = false;
    matched: boolean;
    @Select(RegistrationState.getMultipleAccountMode) multipleAccountMode$: Observable<boolean>;

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly staticService: StaticService,
        private readonly accountService: AccountService,
        private readonly memberService: MemberService,
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly auth: AuthenticationService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly userService: UserService,
        private readonly sharedService: SharedService,
        private readonly staticUtil: StaticUtilService,
        private readonly tpiRestrictions: TPIRestrictionsForHQAccountsService,
    ) {
        this.personalForm = this.store.selectSnapshot(RegistrationState.personalForm);
        const currentNavigationState = this.router.getCurrentNavigation().extras.state;
        if (currentNavigationState && currentNavigationState.multipleAccountMode) {
            this.store.dispatch(new SetRegistrationMemberId(currentNavigationState.memberId));
            this.store.dispatch(new SetGroupId(currentNavigationState.groupId));
        }
    }
    /**
     * Initializing all variables, updating all field data and validating Aflac HQ Account
     */
    ngOnInit(): void {
        this.memberId = this.store.selectSnapshot(RegistrationState.memberId);
        this.mpGroup = this.store.selectSnapshot(RegistrationState.groupId);
        this.getConfiguration();
        this.userService.portal$.pipe(takeUntil(this.unsubscribe$)).subscribe((type) => {
            this.portal = type;
            if (this.portal === Portals.MEMBER.toLowerCase()) {
                this.isMemberPortal = true;
            }
        });
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.addressRegex = new RegExp(data.ADDRESS);
                this.cityRegex = new RegExp(data.NAME_WITH_SPACE_ALLOWED);
                this.zipRegex = new RegExp(data.ZIP_CODE);
                this.phoneRegex = new RegExp(data.PHONE);
                this.numberRegex = new RegExp(data.NUMERIC);
                this.isDateLoaded = true;
                this.initializeForm();
            }
        });
        // It is used to not route user directly to other page of registration
        if (this.auth.formValue.value < 6) {
            this.saveError = true;
            this.store.dispatch(new SetIncompleteRegistrationAlert(this.saveError));
            this.router.navigate(["../../login"], { relativeTo: this.route });
        }
        this.staticService.getStates().subscribe(
            (resp) => {
                this.states = resp;
            },
            () => {
                // TODO: should be replaced with Mon-alert
            },
        );
        this.subscriptions.push(
            this.accountService.getVocabularies(this.mpGroup.toString()).subscribe((Response) => {
                this.preferredLangOptions = Response;
            }),
        );
        this.apiMember = this.memberService.getMember(this.memberId, true, this.mpGroup.toString()).pipe(
            catchError((err) => {
                this.error = true;
                if (err.status === 404) {
                    this.errorMessage = "secondary.portal.register.personalInfo.memberNotFound";
                }
                throw err;
            }),
        );
        this.apiMemberContact = this.memberService.getMemberContact(this.memberId, ContactType.HOME, this.mpGroup.toString()).pipe(
            catchError((err) => {
                this.error = true;
                if (err.status === 404) {
                    this.errorMessage = "secondary.portal.register.contactInfo.contactNotFound";
                }
                throw err;
            }),
        );
        forkJoin([this.apiMember, this.apiMemberContact])
            .pipe(
                switchMap(([res1, res2]) => {
                    this.personalFormResp = res1.body;
                    this.firstName = res1.body.name.firstName;
                    this.editMemberContactForm(res2);
                    this.contactInfoResponse = res2;
                    return combineLatest(
                        this.tpiRestrictions.canAccessTPIRestrictedModuleInHQAccount(null, null, this.mpGroup),
                        this.staticUtil.cacheConfigEnabled(AFLAQ_HQ_REGISTRATION_EDIT),
                    );
                }),
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([isNotHQAccount, response]) => {
                this.isAflacReadOnly = !isNotHQAccount && !response;
                if (this.isAflacReadOnly && this.contactForm.invalid) {
                    this.formInitInvalid = true;
                }
                this.loadSpinner = false;
            });
        this.workType = [
            { value: "WORK", viewValue: "WORK" },
            { value: "HOME", viewValue: "HOME" },
        ];
    }
    /**
     * Creating form builder object with form field validators
     */
    initializeForm(): void {
        this.contactForm = this.fb.group({});
        this.address = this.fb.group({
            address1: ["", [Validators.required, Validators.pattern(this.addressRegex)]],
            address2: ["", RegexForFieldValidation.ADDRESS],
            city: ["", [Validators.required, Validators.pattern(this.cityRegex)]],
            state: ["", Validators.required],
            zip: ["", [Validators.required, Validators.pattern(this.zipRegex)]],
            country: [COUNTRY_NAME],
        });
        this.profile = this.fb.group({
            correspondenceType: ["", Validators.required],
            languagePreference: [PreferredLang.ENGLISH],
        });
        this.phoneNumbers = this.fb.group({
            phoneNumber: ["", [Validators.required, Validators.pattern(this.phoneRegex)]],
            extension: [""],
            type: [ContactType.HOME, false],
            primary: true,
        });
        this.emailAddresses = this.fb.group({
            email: ["", Validators.pattern(this.EMAIL_REGEX)],
            type: [EmailTypes.PERSONAL],
            primary: true,
        });

        this.contactForm.addControl("address", this.address);
        this.contactForm.addControl("profile", this.profile);
        this.contactForm.addControl("phoneNumbers", this.phoneNumbers);
        this.contactForm.addControl("emailAddresses", this.emailAddresses);
    }

    /**
     * This function is used to set validator in email form control
     * @param evt Radio button event
     */
    selectEmail(evt: any): void {
        if (evt.value === this.emailValue) {
            this.emailSelected = true;
            this.emailAddresses.controls.email.setValidators([Validators.pattern(this.EMAIL_REGEX)]);
        } else {
            this.selectPaper(evt);
        }
    }
    /**
     * This function is used to clear validators for email address form controls if user selects paper
     */
    selectPaper(evt: KeyboardEvent): void {
        this.emailAddresses.controls.email.setErrors(null);
        this.emailSelected = false;
        this.emailAddresses.controls.email.clearValidators();
    }
    cellType(evt: any): any {
        if (evt.checked) {
            this.phoneType = PhoneContactTypes.CELL;
            this.isMobile = true;
        } else {
            this.phoneType = PhoneContactTypes.HOME;
            this.isMobile = false;
        }
    }
    /**
     * Updating form field data with initial value
     *  @param resp { any } initial form data passing as parameter
     */
    editMemberContactForm(resp: any): void {
        const respBody = resp.body;
        let respEmail = null;
        let respPhone = null;
        let respPhoneType = null;
        if (resp.body.emailAddresses.length > 0) {
            respEmail = respBody.emailAddresses[0].email;
        }
        if (resp.body.phoneNumbers.length > 0) {
            respPhone = respBody.phoneNumbers[0].phoneNumber;
            if (respBody.phoneNumbers[0].isMobile) {
                this.isMobile = respBody.phoneNumbers[0].isMobile;
            }
            respPhoneType = ContactType.HOME;
        }

        this.contactForm.patchValue({
            address: {
                address1: respBody.address.address1,
                address2: respBody.address.address2,
                city: respBody.address.city,
                state: respBody.address.state,
                zip: respBody.address.zip,
                country: COUNTRY_NAME,
            },
            profile: {
                languagePreference: this.personalFormResp.profile.languagePreference,
                // Fix-Me: String literal to be used
                correspondenceType: this.personalFormResp.profile.correspondenceType,
            },
            phoneNumbers: {
                phoneNumber: respPhone,
                type: ContactType.HOME,
                primary: true,
            },
            emailAddresses: {
                email: respEmail,
                primary: true,
            },
        });
        if (this.personalFormResp.profile.correspondenceType === "ELECTRONIC") {
            this.emailSelected = true;
        }
    }

    isDisabled(): boolean {
        if (this.address.valid && this.phoneNumbers.valid && this.profile.valid && this.emailAddresses.valid) {
            return false;
        }
        return true;
    }

    /**
     * Method called on click of submit
     * Validates the form and calls method to perform service calls to save contact information
     */
    onSubmit(): void {
        this.isFormSubmit = true;
        this.markAsTouched(this.contactForm); // touch all the controls
        if (this.contactForm.invalid) {
            return;
        }
        // Updates the value of registration form
        this.auth.formValue.next(7);
        if (this.contactForm.invalid) {
            this.inlineValidation = true;
        }
        const contactModel = this.contactForm.value;
        contactModel.phoneNumbers = [
            {
                phoneNumber: this.normalizeFormat(this.phoneNumbers.controls.phoneNumber.value),
                type: ContactType.HOME,
                primary: true,
                id: this.contactInfoResponse.body.phoneNumbers.length ? this.contactInfoResponse.body.phoneNumbers[0].id : null,
                isMobile: this.isMobile,
            },
        ];
        if (this.emailSelected) {
            if (this.emailAddresses.controls.email.value === "") {
                this.emailAddresses.controls.email.setErrors({ required: true });
            }
            contactModel.emailAddresses = [
                {
                    email: this.emailAddresses.controls.email.value,
                    // Fix-Me: String literal to be used
                    type: "PERSONAL",
                    primary: true,
                    id: this.contactInfoResponse.body.emailAddresses.length ? this.contactInfoResponse.body.emailAddresses[0].id : null,
                },
            ];
            // eslint-disable-next-line sonarjs/no-collapsible-if
        } else {
            if (this.contactInfoResponse.body.emailAddresses.length) {
                contactModel.emailAddresses = [
                    {
                        email: this.contactInfoResponse.body.emailAddresses[0].email,
                        // Fix-Me: String literal to be used
                        type: "PERSONAL",
                        primary: true,
                        id: this.contactInfoResponse.body.emailAddresses[0].id,
                    },
                ];
            } else {
                contactModel.emailAddresses = null;
            }
        }

        if (this.contactForm.valid) {
            this.personalFormResp.profile.correspondenceType = this.profile.controls.correspondenceType.value;
            this.personalFormResp.profile.languagePreference = this.profile.controls.languagePreference.value;
            const model = { ...this.personalFormResp, ...{ id: parseInt(this.memberId.toString(), 10) } };
            this.loadSpinner = true;
            if (this.addressValidationSwitch) {
                this.verifyAddressDetails(contactModel, model);
            } else {
                this.saveContactDetails(contactModel, model);
            }
        }
    }

    /**
     * This function is used to save member's contact and member's profile details
     * @param contactModel { MemberContact } is containing MemberContact details
     * @param model { MemberProfile } is containing MemberProfile details
     * @returns Nothing
     */
    saveContactDetails(contactModel: MemberContact, model: MemberProfile): void {
        this.apiSubscriptionPut = this.getSaveMemberContactObservable(contactModel, model).subscribe(
            (resp) => {
                this.loadSpinner = false;
                this.store.dispatch(new SetContactForm(this.contactForm.value));
                if (!this.hideDependentTab && !this.isAflacReadOnly) {
                    this.router.navigate(["../manage"], { relativeTo: this.route });
                } else {
                    this.router.navigate(["../../login"], { relativeTo: this.route });
                }
            },
            (err) => {
                this.handleSaveContactError(err);
            },
        );
    }

    /**
     * Method to handle error scenarios for save contact service
     * @param error {HttpErrorResponse} received from service
     */
    handleSaveContactError(err: HttpErrorResponse): void {
        this.loadSpinner = false;
        this.error = true;
        const error = err.error;
        if (error.status === ClientErrorResponseCode.RESP_400 && error.details.length > 0) {
            for (const detail of error.details) {
                this.errorMessage = `secondary.portal.register.personalInfo.api.${error.status}.${detail.code}.${detail.field}`;
            }
        } else if (error.status === ClientErrorResponseCode.RESP_409) {
            for (const detail of error.details) {
                this.errorMessage = `secondary.portal.register.personalInfo.api.${error.status}.${error.code}.${detail.field}`;
            }
        } else {
            this.errorMessage = "secondary.portal.register.contactInfo.badParameter";
        }
    }

    /**
     * This function used to return member contact observable
     * @param contactModel is containing MemberContact details
     * @param model is containing MemberProfile details
     * @returns save  member contatct Observable
     */
    getSaveMemberContactObservable(contactModel: MemberContact, model: MemberProfile): Observable<void> {
        return this.memberService.saveMemberContact(this.memberId, ContactType.HOME, contactModel, this.mpGroup.toString()).pipe(
            switchMap((result) => this.memberService.updateMember(model, this.mpGroup.toString())),
            catchError((err) => {
                err.error.details.forEach((msg) => {
                    if (msg.code === this.strDuplicate && msg.field === this.strEmailAdress) {
                        this.isDuplicateEmail = true;
                        this.duplicateEmailErrors.push(msg.message);
                    }
                });
                return throwError(err);
            }),
        );
    }

    /**
     * This function is used to navigate back from contact info personal-info or login
     */
    onBack(): void {
        if (!this.hidePersonalInfoTab) {
            this.personalForm = this.store.selectSnapshot(RegistrationState.personalForm);
            this.router.navigate(["../personal-info"], { relativeTo: this.route });
        } else {
            this.router.navigate(["../../login"], { relativeTo: this.route });
        }
    }

    markAsTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((key: any) => {
            const control = formGroup.get(key);
            if (control instanceof FormGroup) {
                this.markAsTouched(control);
            } else if (control instanceof FormControl) {
                (control as FormControl).markAsTouched();
            }
        });
    }
    /**
     * This function is used to validate state and zip code.
     * @param value zip code value.
     */
    checkZipCode(value: string): void {
        this.subscriptions.push(
            validateStateAndZipCode(this.address.value.state, value, this.address.controls.zip, this.staticService, this.sharedService),
        );
    }
    /**
     * This method is used to verify the address entered by user before saving it.
     * @param contactDetails is containing MemberContact details
     * @param model is containing MemberProfile details
     * @returns void
     */
    verifyAddressDetails(contactDetails: MemberContact, model: MemberProfile): void {
        this.tempMemberAddress = this.address.value;
        this.subscriptions.push(
            this.memberService.verifyMemberAddress(this.tempMemberAddress).subscribe(
                (resp) => {
                    this.addressResp = false;
                    this.loadSpinner = false;
                    this.matched = resp.matched;
                    this.suggestedAddress = resp.suggestedAddress;
                    contactDetails.addressValidationDate = new Date();

                    if (resp.matched) {
                        this.nextAfterVerifyAddress(contactDetails, model);
                    } else if (this.openAddressModal === false) {
                        this.openModal(AppSettings.ADDRESS_BOTH_OPTION, contactDetails, model);
                    }
                },
                (error) => {
                    this.error = false;
                    this.addressResp = true;
                    this.loadSpinner = false;
                    this.addressMessage = [];
                    if (error.status === AppSettings.API_RESP_400) {
                        contactDetails.addressValidationDate = new Date();
                        if (error.error && error.error.details) {
                            error.error.details.map((item) => this.addressMessage.push(item.message));
                        } else {
                            this.addressMessage.push(
                                this.language.fetchSecondaryLanguageValue("secondary.portal.directAccount.invalidAdressdata"),
                            );
                        }
                    } else if (error.status === AppSettings.API_RESP_500) {
                        this.addressMessage.push(
                            this.language.fetchSecondaryLanguageValue("secondary.portal.accountPendingEnrollments.internalServer"),
                        );
                    } else if (error.status) {
                        this.addressMessage.push(error.error.details[0].message);
                    }
                    if (!this.openAddressModal) {
                        this.openModal(ADDRESS_OPTIONS.SINGLE, contactDetails, model, error.status);
                    }
                },
            ),
        );
    }

    /**
     * This function will be called when user will click on save after filling contact info form
     * @param option { string } contains the number of options we have to show in verify address pop-up
     * @param addressDetails { MemberContact } is containing member contact address details
     * @param model { MemberProfile } is containing member profile details
     * @param errorStatus API error status
     * @returns Nothing
     */
    openModal(option: string, addressDetails?: MemberContact, model?: MemberProfile, errorStatus?: number): void {
        const addressDialog = this.empoweredModalService.openDialog(AddressVerificationComponent, {
            data: {
                suggestedAddress: this.suggestedAddress,
                providedAddress: this.tempMemberAddress,
                addressResp: this.addressResp,
                addressMessage: this.addressMessage,
                option: option,
                errorStatus: errorStatus,
            },
        });
        this.subscriptions.push(
            addressDialog
                .afterClosed()
                .pipe(
                    tap((elementData) => {
                        this.selectedAddress = elementData.data.selectedAddress;
                        if (this.selectedAddress === AppSettings.SUGGESTED_ADDRESS) {
                            addressDetails.address = this.suggestedAddress;
                        } else {
                            addressDetails.address = this.tempMemberAddress;
                        }
                        if (!elementData.data.isVerifyAddress) {
                            this.closeModal();
                        }
                    }),
                    filter((elementData) => elementData.data.isVerifyAddress !== null && elementData.data.isVerifyAddress),
                    switchMap(() => this.getSaveMemberContactObservable(addressDetails, model)),
                )
                .subscribe(
                    () => {
                        this.loadSpinner = false;
                        this.store.dispatch(new SetContactForm(this.contactForm.value));
                        if (!this.hideDependentTab && !this.isAflacReadOnly) {
                            this.router.navigate(["../manage"], { relativeTo: this.route });
                        } else {
                            this.router.navigate(["../../login"], { relativeTo: this.route });
                        }
                    },
                    (err) => {
                        this.handleSaveContactError(err);
                    },
                ),
        );
    }
    /**
     * This function will be call when user will click on next on the address verify pop-up
     * @param contactDetails is containing MemberContact details
     * @param model is containing MemberProfile details
     */
    nextAfterVerifyAddress(contactDetails: MemberContact, model: MemberProfile): void {
        this.saveContactDetails(contactDetails, model);
    }
    closeModal(): void {
        this.openAddressModal = false;
        this.addressResp = false;
    }

    /**
     * Method to remove '-' from phone number
     * @param num {string} phone number
     * @returns {string} returns modified phone number without '-'
     */
    normalizeFormat(num: string): string {
        if (num && num.indexOf("-") !== -1) {
            return num.replace(/-/g, "");
        }
        return num;
    }
    /**
     * This function is used to get config to check whether we have to hide personal info or not.
     */
    getConfiguration(): void {
        combineLatest([
            this.staticService.getConfigurations("general.feature.enable.aflac.api.address_validation", this.mpGroup),
            this.staticUtil.cacheConfigs([
                ConfigName.REGISTRATION_SKIP_PERSONAL_INFO,
                ConfigName.REGISTRATION_SKIP_CONTACT_INFO,
                ConfigName.REGISTRATION_SKIP_DEPENDENTS,
            ]),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([resp, [personalFlag, contactFlag, dependentFlag]]) => {
                this.addressValidationSwitch = this.staticUtil.isConfigEnabled(resp[0]);

                this.hidePersonalInfoTab = this.staticUtil.isConfigEnabled(personalFlag);
                this.hideContactTab = this.staticUtil.isConfigEnabled(contactFlag);
                this.hideDependentTab = this.staticUtil.isConfigEnabled(dependentFlag);
            });
    }
    ngOnDestroy(): void {
        if (this.apiSubscriptionPut !== undefined) {
            this.apiSubscriptionPut.unsubscribe();
        }
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
