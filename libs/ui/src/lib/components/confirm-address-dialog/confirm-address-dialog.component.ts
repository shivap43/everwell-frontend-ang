import { AddressVerificationComponent, validateStateAndZipCode } from "../../business/address-verification/address-verification.component";
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormBuilder, Validators, FormGroup } from "@angular/forms";
import {
    MemberService,
    StaticService,
    ProducerService,
    BenefitsOfferingService,
    AflacService,
    WebexConnectInfo,
    DependentContact,
} from "@empowered/api";
import { LanguageService } from "@empowered/language";
import {
    Permission,
    ConfigName,
    ADDRESS_OPTIONS,
    AppSettings,
    EnrollmentMethod,
    Address,
    VerifiedAddress,
    PersonalAddress,
    ContactType,
    CountryState,
    ProducerCredential,
    MemberContact,
    AddressConfig,
} from "@empowered/constants";
import { Select, Store } from "@ngxs/store";
import { Observable, Subscription, Subject, forkJoin, of, combineLatest, iif, defer, concat } from "rxjs";
import { switchMap, takeUntil, tap, catchError, map, filter, finalize, mergeMap, reduce, take } from "rxjs/operators";
import { UserService } from "@empowered/user";
import { HttpResponse } from "@angular/common/http";
import { Router } from "@angular/router";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";
import { StaticUtilService } from "@empowered/ngxs-store";
import { filterNullValues, SharedState, RegexDataType, EnrollmentMethodState } from "@empowered/ngxs-store";
import { DependentAddressUpdateModalComponent } from "../../business";

const NEW_YORK_ABBR = "NY";
const PUERTO_RICO_ABBR = "PR";
const VIRGIN_ISLANDS_ABBR = "VI";
const GUAM_ABBR = "GU";
const NEW_YORK = "New York";
const DIRECT = "direct";
const ENROLL_SUCCESS_ACTION = "enrollmentSuccess";
const ENROLL = "enroll";
const SHOP_SUCCESS = "shopSuccess";
const ERROR = "error";
const PERSONAL = "PERSONAL";
const REQUIRED = "required";

@Component({
    selector: "empowered-confirm-address-dialog",
    templateUrl: "./confirm-address-dialog.component.html",
    styleUrls: ["./confirm-address-dialog.component.scss"],
})
export class ConfirmAddressDialogComponent implements OnInit, OnDestroy {
    addressForm: FormGroup;
    showError = false;
    memberId: number;
    address: Address;
    memberContact: MemberContact;
    stateMapping = {};
    zipMismatchError = false;
    validationRegex: RegexDataType;
    private subscriptions: Subscription[] = [];
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    private readonly unsubscribe$ = new Subject<void>();
    states: CountryState[] = [];
    addressValidationSwitch: boolean;
    consentSent = false;
    addressResp: boolean;
    addressMessage: string[] = [];
    openAddressModal = false;
    isLoading: boolean;
    confirmAddressHeader: string;
    invalidEmail: boolean;
    hasConsent: boolean;
    enrollmentMethodEnum = EnrollmentMethod;
    showWebexWarning = false;
    isVirtualF2FInfoDisplay = false;
    webexMeetingLink: string;
    currentEnrollmentData = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
    hasCifNumber = false;
    isStandaloneDemographicEnabled: boolean;
    dependentIds: string[] = [];
    hasDependents: boolean;
    fieldsChanged: boolean;
    enableDependentUpdateAddressModal = true;

    readonly EMAIL = "email";
    readonly EMAIL_CONSENT_SENT = "emailConsentSent";
    readonly SHOP = "shop";
    readonly VIRTUAL_FACE_TO_FACE_ENABLED = ConfigName.VIRTUAL_FACE_TO_FACE_ENABLED;

    /**
     * Set available country states based on various logic.
     */
    states$ = combineLatest([
        this.userService.credential$,
        this.staticUtilService.hasPermission(Permission.HYBRID_USER),
        this.staticUtilService.hasPermission(Permission.AFLAC_E_FINANCE),
        this.staticUtilService.hasPermission(Permission.AFLAC_CLEAR_LINK),
    ]).pipe(
        switchMap(([credential, hybridUserPermission, aflacEFinance, aflacClearLink]: [ProducerCredential, boolean, boolean, boolean]) =>
            this.producerService.getProducerInformation(credential.producerId.toString()).pipe(
                switchMap((producerInfo) => {
                    const licensedStateList = producerInfo.licenses.map((license) => license.state);
                    if (credential.producerId && credential.callCenterId && hybridUserPermission) {
                        return of([]).pipe(
                            map(() => {
                                this.states = licensedStateList.filter((state) => state.abbreviation !== NEW_YORK_ABBR);
                                return this.states || [];
                            }),
                        );
                    }
                    if (this.router.url.indexOf(DIRECT) >= 0) {
                        this.states = licensedStateList.filter((state) => state.abbreviation !== NEW_YORK_ABBR);

                        if (aflacEFinance) {
                            this.states = licensedStateList.filter((state) => state.abbreviation !== PUERTO_RICO_ABBR);
                        } else if (aflacClearLink) {
                            this.states = licensedStateList.filter(
                                (state) =>
                                    state.abbreviation !== PUERTO_RICO_ABBR &&
                                    state.abbreviation !== VIRGIN_ISLANDS_ABBR &&
                                    state.abbreviation !== GUAM_ABBR,
                            );
                        }
                        return of(this.states || []);
                    }
                    return this.benefitOfferingService.getBenefitOfferingSettings(this.data.mpGroup).pipe(
                        map((offeredState) => {
                            const producerLicensedStates = licensedStateList.filter((state) => state.abbreviation !== NEW_YORK_ABBR);
                            this.states = offeredState.states.filter((state) =>
                                producerLicensedStates.some((producerState) => state.abbreviation === producerState.abbreviation),
                            );
                            return this.states || [];
                        }),
                    );
                }),
                tap((states) => {
                    this.states.sort((state1, state2) => (state1.abbreviation < state2.abbreviation ? -1 : 1));
                }),
            ),
        ),
    );

    /**
     * Get member's home contact and populate related data.
     */
    getMemberContact$ = this.memberService.getMemberContact(this.data.memberId, ContactType.HOME, this.data.mpGroup.toString()).pipe(
        tap((memberContact) => {
            this.memberContact = memberContact.body;
            this.address = memberContact.body.address;
            if (this.address.state === NEW_YORK_ABBR) {
                this.states = [{ name: NEW_YORK, abbreviation: NEW_YORK_ABBR }];
                this.states$ = of(this.states);
            }
            this.createForm();
        }),
        catchError((error) => {
            this.dialogRef.close({
                action: ERROR,
            });
            return of(null);
        }),
    );

    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.callCenter.confirm",
        "primary.portal.callCenter.consentstatement",
        "primary.portal.callCenter.acknowledge",
        "primary.portal.callCenter.selectionRequired",
        "primary.portal.callCenter.zipCode",
        "primary.portal.callCenter.state",
        "primary.portal.callCenter.city",
        "primary.portal.callCenter.aptUnit",
        "primary.portal.callCenter.streetAddress1",
        "primary.portal.callCenter.streetAddress2",
        "primary.portal.callCenter.confirmEmployeeAddress",
        "primary.portal.common.optional",
        "primary.portal.common.close",
        "primary.portal.census.manualEntry.zipErrorMsg",
        "primary.portal.common.city.patternError",
        "primary.portal.callCenter.confirmCustomerAddress",
        "primary.portal.admin.send",
        "primary.portal.coverage.sent",
        "primary.portal.direct.addCustomer.consent.email",
        "primary.portal.callCenter.emailStatement",
        "primary.portal.common.optional",
        "primary.portal.callCenter.invalidEmail",
        "primary.portal.callCenter.emailCopy",
        "primary.portal.callCenter.emailConsent",
        "primary.portal.tpiConfirmAddress.invalidZip",
        "primary.portal.callCenter.confirm",
        "primary.portal.enrollment.acknowledgement",
        "primary.portal.callCenter.applicantStatementValidation",
        "primary.portal.enrollmentMethod.virtualFaceToFace",
        "primary.portal.callCenter.confirmEmployeesAddress",
        "primary.portal.enrollmentMethod.virtualFaceToFace.webexText",
        "primary.portal.enrollmentMethod.virtualFaceToFace.webexLink",
        "primary.portal.callCenter.applicantEmailAddress",
    ]);

    constructor(
        private readonly dialogRef: MatDialogRef<ConfirmAddressDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private readonly data: any,
        private readonly formBuilder: FormBuilder,
        private readonly memberService: MemberService,
        private readonly staticService: StaticService,
        private readonly language: LanguageService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly producerService: ProducerService,
        private readonly userService: UserService,
        private readonly staticUtilService: StaticUtilService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly router: Router,
        private readonly sharedService: SharedService,
        private readonly store: Store,
        private readonly aflacService: AflacService,
    ) {}

    /**
     * Function to execute logic on component initialization.
     */
    ngOnInit(): void {
        this.subscriptions.push(
            this.sharedService.getStateZipFlag().subscribe((resp) => {
                this.isLoading = resp;
            }),
        );
        this.memberId = this.data.memberId;

        this.memberService
            .getMemberDependents(this.memberId, false, this.data.mpGroup)
            .pipe(
                mergeMap((dependents) =>
                    iif(
                        () => !!dependents?.length,
                        defer(() =>
                            forkJoin(
                                dependents.map((dependent) =>
                                    this.memberService
                                        .getDependentContact(this.memberId, dependent.id.toString(), this.data.mpGroup)
                                        .pipe(map((contact) => ({ ...dependent, contact }))),
                                ),
                            ),
                        ),
                        of([]),
                    ),
                ),
                tap((dependents) => {
                    if (dependents?.length) {
                        this.hasDependents = true;
                        dependents.map((dependent) => {
                            if (!dependent.contact?.address?.address1 && !dependent.contact?.address?.city) {
                                this.dependentIds.push(dependent.id);
                            }
                        });
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.confirmAddressHeader =
            this.languageStrings[
                this.router.url.indexOf(DIRECT) >= 0
                    ? "primary.portal.callCenter.confirmCustomerAddress"
                    : "primary.portal.callCenter.confirmEmployeeAddress"
            ];
        this.subscriptions.push(this.regex$.subscribe((data) => (this.validationRegex = data ? data : undefined)));
        this.subscriptions.push(this.getMemberContact$.subscribe());
        this.isLoading = true;
        this.subscriptions.push(
            this.memberService.getMember(this.data.memberId, true, this.data.mpGroup.toString()).subscribe(
                (memberData) => {
                    this.isLoading = false;
                    this.hasCifNumber = memberData.body?.customerInformationFileNumber !== undefined;
                },
                () => {
                    this.isLoading = false;
                },
            ),
        );

        this.getConfig();
    }

    /**
     * Create confirm address form and get consent (if required).
     */
    createForm(): void {
        const address1 = this.address.address1 ? this.address.address1 : "";
        const address2 = this.address.address2 ? this.address.address2 : "";
        const city = this.address.city ? this.address.city : "";
        this.addressForm = this.formBuilder.group({
            street1Control: [address1, Validators.required],
            street2Control: [address2],
            cityControl: [city, [Validators.required, Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)]],
            stateControl: [this.address.state, Validators.required],
            zipControl: [this.address.zip, [Validators.required, Validators.pattern(this.validationRegex.ZIP_CODE)]],
            acknowledgeControl: [false, Validators.requiredTrue],

            email: [this.memberContact.emailAddresses.length ? this.memberContact.emailAddresses[0].email : ""],
            send: [Validators.required],
        });
        const methodsRequiringConsent = [`${this.enrollmentMethodEnum.CALL_CENTER}`, `${this.enrollmentMethodEnum.PIN_SIGNATURE}`];
        if (
            methodsRequiringConsent.includes(this.data.method) ||
            (this.currentEnrollmentData && methodsRequiringConsent.includes(this.currentEnrollmentData.enrollmentMethod))
        ) {
            this.isLoading = true;
            this.memberService
                .getMemberConsent(this.data.memberId, this.data.mpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((resp: boolean) => {
                    this.isLoading = false;
                    this.hasConsent = resp;
                    if (!this.hasConsent) {
                        this.addressForm.controls.email.setValidators([Validators.required, Validators.email]);
                        this.addressForm.controls.email.updateValueAndValidity();
                    }
                });
            if (this.memberContact.emailAddresses.length) {
                this.addressForm.controls.email.disable();
            }
        }
        if (this.data.method === this.enrollmentMethodEnum.VIRTUAL_FACE_TO_FACE) {
            this.confirmAddressHeader = this.languageStrings["primary.portal.callCenter.confirmEmployeesAddress"];
            this.addressForm.controls.acknowledgeControl.clearValidators();
            this.isVirtualF2FInfoDisplay = this.data.purpose === this.SHOP;
        }
    }

    onCancel(): void {
        this.dialogRef.close({ action: "close" });
    }

    /**
     * Method to fetch configurations
     */
    getConfig(): void {
        // Config to check if address validation is required
        this.staticUtilService
            .cacheConfigs([AddressConfig.ADDRESS_VALIDATION, AddressConfig.ENABLE_DEPENDENT_ADDRESS_MODAL])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([addressValidationSwitch, enableDependentUpdateAddressModal]) => {
                this.addressValidationSwitch = this.staticUtilService.isConfigEnabled(addressValidationSwitch);
                this.enableDependentUpdateAddressModal = this.staticUtilService.isConfigEnabled(enableDependentUpdateAddressModal);
            });

        // Config to check if Standalone Demographic Change is enabled
        this.sharedService
            .getStandardDemographicChangesConfig()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((isStandaloneDemographicEnabled) => (this.isStandaloneDemographicEnabled = isStandaloneDemographicEnabled));
    }

    /**
     *
     * This function is used for validating state and zip code
     * @returns void
     */
    checkZipCode(value: string): void {
        this.fieldsChanged = true;
        const addressForm = this.addressForm.controls;
        const zipFormControl = addressForm.zipControl;
        const stateValue = addressForm.stateControl.value;
        this.subscriptions.push(validateStateAndZipCode(stateValue, value, zipFormControl, this.staticService, this.sharedService));
    }

    /**
     * Close the dialog, passing the current action.
     */
    closeDialog(): void {
        this.dialogRef.close({
            action: this.data.purpose === this.SHOP ? SHOP_SUCCESS : ENROLL_SUCCESS_ACTION,
            newState: this.states.find((state) => state.abbreviation === this.addressForm.controls.stateControl.value),
            newCity: this.addressForm.controls.cityControl.value,
        });
    }

    /**
     * Method to accept consent and close the modal after address verification
     */
    onSuccess(): void {
        if (this.data.method === EnrollmentMethod.VIRTUAL_FACE_TO_FACE) {
            this.closeDialog();
        } else {
            this.isLoading = true;
            this.memberService
                .acceptMemberConsent(this.memberId, this.data.mpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((response) => {
                    this.isLoading = false;
                    this.closeDialog();
                });
        }
    }
    /**
     * This method checks for method selected by user and proceed accordingly or fetch config value based on enrollment method
     * @returns void
     */
    checkMethodAndSubmit(): void {
        this.isLoading = true;
        if (this.data.method === EnrollmentMethod.VIRTUAL_FACE_TO_FACE) {
            this.aflacService
                .getWebexConnectionAndLicenseStatus(this.data.mpGroup, this.memberId)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap((res: WebexConnectInfo) => {
                        if (Number(res.meetingId)) {
                            return this.onSubmit();
                        }
                        this.showWebexWarning = true;
                        this.isVirtualF2FInfoDisplay = false;
                        return this.sharedService.fetchWebexConfig();
                    }),
                    filter(() => this.showWebexWarning),
                    tap((resp: string) => {
                        this.webexMeetingLink = resp;
                    }),
                )
                .subscribe(
                    () => {
                        this.isLoading = false;
                    },
                    (error) => {
                        this.isLoading = false;
                    },
                    () => {
                        this.isLoading = false;
                    },
                );
        }
    }
    /**
     *
     *@description checks for method selected by user and proceed accordingly
     * @memberof ConfirmAddressDialogComponent
     * @return Personal address details
     */
    onSubmit(): Observable<PersonalAddress> | Observable<void | [HttpResponse<void>, void]> {
        let observableToReturn: Observable<PersonalAddress> | Observable<void | [HttpResponse<void>, void]> = of(null);
        if (
            this.data.method === this.enrollmentMethodEnum.CALL_CENTER ||
            this.data.method === this.enrollmentMethodEnum.PIN_SIGNATURE ||
            (this.currentEnrollmentData &&
                (this.currentEnrollmentData.enrollmentMethod === this.enrollmentMethodEnum.CALL_CENTER ||
                    this.currentEnrollmentData.enrollmentMethod === this.enrollmentMethodEnum.PIN_SIGNATURE))
        ) {
            if (this.hasConsent && (this.addressForm.controls[this.EMAIL].value || !this.consentSent)) {
                observableToReturn = this.onConfirm();
            } else if (
                this.addressForm.controls[this.EMAIL].value &&
                !this.hasConsent &&
                !this.addressForm.controls.email.hasError(this.EMAIL)
            ) {
                this.addressForm.controls[this.EMAIL].setErrors({
                    emailConsentSent: true,
                });
            } else {
                this.addressForm.controls[this.EMAIL].setErrors({ email: true });
            }
        } else {
            observableToReturn = this.onConfirm();
        }
        return observableToReturn;
    }

    /**
     *
     * @description submits the confirm employee address form and proceeds to shop
     * @memberof ConfirmAddressDialogComponent
     * @returns Personal address details
     */
    onConfirm(): Observable<[HttpResponse<void>, void] | void> | Observable<PersonalAddress> {
        this.zipMismatchError = false;
        let observableToReturn: Observable<PersonalAddress> | Observable<void | [HttpResponse<void>, void]>;
        if (this.addressForm.invalid) {
            this.showError = true;
        } else {
            this.showError = false;
            if (!this.memberContact.emailAddresses.length && this.addressForm.controls.email.value) {
                const contactInfo: any = {
                    email: this.addressForm.controls.email.value,
                    type: PERSONAL,
                    id: null,
                };
                this.memberContact.emailAddresses.push(contactInfo);
            }
            this.memberContact.address = {
                address1: this.addressForm.controls.street1Control.value,
                address2: this.addressForm.controls.street2Control.value ? this.addressForm.controls.street2Control.value : "",
                city: this.addressForm.controls.cityControl.value,
                state: this.addressForm.controls.stateControl.value,
                zip: this.addressForm.controls.zipControl.value,
                country: this.memberContact.address.country ? this.memberContact.address.country : null,
                countyId: this.memberContact.address.countyId ? this.memberContact.address.countyId : null,
            };
            if (this.addressValidationSwitch) {
                observableToReturn = this.verifyAddressDetails();
            } else {
                observableToReturn = this.nextAfterVerifyAddress();
            }
        }
        return observableToReturn;
    }

    /**
     * This function calls verify address api and deals with post verification actions
     * @memberof ConfirmAddressDialogComponent
     * @returns Personal address details
     */
    verifyAddressDetails(): Observable<void | [HttpResponse<void>, void]> {
        const address = this.memberContact.address as PersonalAddress;
        return this.memberService.verifyMemberAddress(address).pipe(
            tap((verifiedAddress: VerifiedAddress) => {
                this.addressResp = false;
                this.memberContact.addressValidationDate = new Date();
            }),
            switchMap((verifiedAddress: VerifiedAddress) => {
                if (verifiedAddress.matched) {
                    return this.nextAfterVerifyAddress();
                }
                return this.openModal(AppSettings.ADDRESS_BOTH_OPTION, address, verifiedAddress);
            }),
            catchError((error) => {
                this.addressMessage = [];
                this.addressResp = true;
                if (error.status === AppSettings.API_RESP_400) {
                    this.memberContact.addressValidationDate = new Date();
                    if (error.error.details) {
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
                } else {
                    this.addressMessage.push(this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code));
                }
                return of(error);
            }),
            switchMap((resp) => {
                if (this.addressResp) {
                    return this.openModal(ADDRESS_OPTIONS.SINGLE, address, null, resp.status);
                }
                return of(null);
            }),
        );
    }

    /**
     * This function will be invoked when any form field is toggled
     */
    setChecker() {
        this.fieldsChanged = true;
    }

    /**
     *
     * This function will be called when a next action is triggered in address verification modal
     * @param {{ isVerifyAddress: boolean; selectedAddress: string }} [modalData]
     * @param {VerifiedAddress} [resp]
     * @returns {Observable<[HttpResponse<void>}
     * @memberof ConfirmAddressDialogComponent
     */
    nextAfterVerifyAddress(
        modalData?: { isVerifyAddress: boolean; selectedAddress: string },
        resp?: VerifiedAddress,
    ): Observable<[HttpResponse<void>, void] | void> {
        this.isLoading = true;
        const validateStateZip$ = this.staticService.validateStateZip(
            this.addressForm.controls.stateControl.value,
            this.addressForm.controls.zipControl.value,
        );
        const continueWithAddress = modalData && modalData.selectedAddress !== AppSettings.SUGGESTED_ADDRESS && modalData.isVerifyAddress;
        const suggestedAddress = modalData && modalData.selectedAddress === AppSettings.SUGGESTED_ADDRESS && modalData.isVerifyAddress;
        if (suggestedAddress) {
            this.memberContact.address = resp?.suggestedAddress;
        }
        if (this.enableDependentUpdateAddressModal) {
            if (suggestedAddress || this.fieldsChanged) {
                this.memberService
                    .saveMemberContact(this.memberId, ContactType.HOME, this.memberContact, this.data.mpGroup.toString())
                    .pipe(
                        takeUntil(this.unsubscribe$),
                        tap(() => {
                            this.onSuccess();
                            if (this.hasDependents) {
                                this.empoweredModalService.openDialog(DependentAddressUpdateModalComponent, {
                                    width: "667px",
                                    data: {
                                        memberId: this.memberId,
                                        memberAddress: this.memberContact.address,
                                        mpGroupId: this.data.mpGroup,
                                    },
                                });
                            }
                        }),
                        catchError((_err) => of(undefined)),
                        finalize(() => {
                            this.isLoading = false;
                        }),
                    )
                    .subscribe();
            } else {
                this.onSuccess();
            }
            return of(null);
        } else {
            // If dependent address update modal config is turned off use the old logic to update the dependent address
            if (continueWithAddress || suggestedAddress || !modalData) {
                const saveMemberContact$ = this.memberService
                    .saveMemberContact(this.memberId, ContactType.HOME, this.memberContact, this.data.mpGroup.toString())
                    .pipe(
                        catchError((_err) => of(undefined)),
                        finalize(() => (this.isLoading = false)),
                    );
                const saveDependentsContact$ = this.dependentIds.map((dependentId) =>
                    this.memberService.getDependentContact(this.memberId, dependentId, this.data.mpGroup).pipe(
                        switchMap((dependentContact) => {
                            const updatedDependentContact = {
                                ...dependentContact,
                                address: this.memberContact.address,
                            };
                            return this.memberService.saveDependentContact(
                                updatedDependentContact,
                                this.memberId,
                                dependentId,
                                this.data.mpGroup,
                            );
                        }),
                    ),
                );

                return (
                    this.dependentIds?.length
                        ? concat(...saveDependentsContact$).pipe(
                              take(saveDependentsContact$.length),
                              reduce((accumulator, saveDependentContact$) => [...accumulator, saveDependentContact$], []),
                          )
                        : of(null)
                ).pipe(
                    switchMap(() =>
                        forkJoin([validateStateZip$, saveMemberContact$]).pipe(
                            filterNullValues(),
                            tap(([_stateValidityResponse, saveMemberResponse]) => {}),
                            catchError((err) => {
                                this.zipMismatchError = true;
                                return of(err);
                            }),
                            finalize(() => (this.isLoading = false)),
                        ),
                    ),
                );
            }
            return of(null);
        }
    }

    /**
     *
     * This function will open address verification modal and deal with post closing modal actions
     * @param option response address options single/both
     * @param address user provided address
     * @param verifiedAddress suggested address from API
     * @param errorStatus API Error status
     * @returns data from the closed confirm address dialog
     * @memberof ConfirmAddressDialogComponent
     */
    openModal(
        option: string,
        address: PersonalAddress,
        verifiedAddress?: VerifiedAddress,
        errorStatus?: number,
    ): Observable<[HttpResponse<void>, void] | void> {
        this.isLoading = false;
        const addressDialog = this.empoweredModalService.openDialog(AddressVerificationComponent, {
            data: {
                suggestedAddress: verifiedAddress ? verifiedAddress.suggestedAddress : null,
                providedAddress: address,
                addressResp: this.addressResp,
                addressMessage: this.addressMessage,
                option: option,
                errorStatus: errorStatus,
            },
        });
        return addressDialog.afterClosed().pipe(
            filterNullValues(),
            switchMap((elementData) => this.nextAfterVerifyAddress(elementData.data, verifiedAddress)),
        );
    }
    /**
     *
     * @description Sends member consent via email
     * @memberof ConfirmAddressDialogComponent
     */
    sendConsent(): void {
        if (this.addressForm.controls.email.hasError(REQUIRED) || this.addressForm.controls.email.hasError(this.EMAIL)) {
            this.invalidEmail = true;
        } else {
            this.isLoading = true;
            this.memberService
                .emailMemberConsent(this.data.memberId, this.data.mpGroup, this.addressForm.controls.email.value)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        this.consentSent = true;
                        this.hasConsent = true;
                        this.isLoading = false;
                        this.addressForm.controls[this.EMAIL].setErrors(null);
                    },
                    (err) => {
                        this.addressForm.controls[this.EMAIL].setErrors({ email: true });
                        this.isLoading = false;
                    },
                );

            // No particular type can be given when sending one attribute in saveMemberContact PUT call
            const contactInfo: any = {
                ...this.memberContact,
                emailAddresses: [
                    {
                        email: this.addressForm.controls.email.value,
                        type: PERSONAL,
                        primary: true,
                        id: null,
                    },
                ],
            };
            this.isLoading = true;
            if (this.hasConsent) {
                this.memberService
                    .saveMemberContact(this.data.memberId, ContactType.HOME, contactInfo, this.data.mpGroup)
                    .pipe(
                        takeUntil(this.unsubscribe$),
                        switchMap((resp) => this.memberService.getMemberContact(this.memberId, ContactType.HOME, this.data.mpGroup)),
                    )
                    .subscribe(
                        (resp) => {
                            this.isLoading = false;
                            this.memberContact = {
                                ...this.memberContact,
                                emailAddresses: resp.body.emailAddresses,
                            };
                        },
                        (err) => (this.isLoading = false),
                    );
            }
        }
    }
    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        if (this.subscriptions) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
