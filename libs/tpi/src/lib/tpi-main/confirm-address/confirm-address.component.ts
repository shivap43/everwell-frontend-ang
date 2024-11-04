import { Component, OnInit, OnDestroy, HostBinding } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MemberService, StaticService, ProducerService, AccountService } from "@empowered/api";
import { Observable, Subject, of, forkJoin, EMPTY } from "rxjs";
import { LanguageService } from "@empowered/language";
import { AddressVerificationComponent, DependentAddressUpdateModalComponent } from "@empowered/ui";
import { Select, Store } from "@ngxs/store";
import { switchMap, map, tap, catchError, takeUntil } from "rxjs/operators";
import { Router } from "@angular/router";

import {
    EnrollmentState,
    SetEnrollmentState,
    SetRegex,
    SharedState,
    RegexDataType,
    TPIState,
    filterNullValues,
    StaticUtilService,
} from "@empowered/ngxs-store";
import { TpiServices, SharedService, EmpoweredModalService, AddressMatchingService } from "@empowered/common-services";

import {
    ADDRESS_OPTIONS,
    AppSettings,
    EnrollmentMethod,
    Address,
    VerifiedAddress,
    PersonalAddress,
    ContactType,
    CountryState,
    MemberContact,
    AddressConfig,
} from "@empowered/constants";

const AG_ACCOUNT = "is_hq_account";
const NEW_YORK_ABBR = "NY";
const NEW_YORK_CITY = "New York";

@Component({
    selector: "empowered-confirm-address",
    templateUrl: "./confirm-address.component.html",
    styleUrls: ["./confirm-address.component.scss"],
})
export class ConfirmAddressComponent implements OnInit, OnDestroy {
    addressForm: FormGroup;
    memberId: number;
    mpGroup: string;
    isSpinnerLoading = false;
    showError = false;
    memberContact: MemberContact;
    address: Address;
    zipMismatchError = false;
    validationRegex: RegexDataType;
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    addressValidationSwitch: boolean;
    states$: CountryState[];
    addressResp: boolean;
    addressMessages: string[] = [];
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    openAddressModal = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.callCenter.selectionRequired",
        "primary.portal.tpiEnrollment.zip",
        "primary.portal.tpiEnrollment.state",
        "primary.portal.tpiEnrollment.city",
        "primary.portal.callCenter.aptUnit",
        "primary.portal.tpiEnrollment.streetAddressOne",
        "primary.portal.tpiEnrollment.streetAddressTwo",
        "primary.portal.common.optional",
        "primary.portal.common.continue",
        "primary.portal.tpiEnrollment.reviewResidentAddress",
        "primary.portal.tpiEnrollment.exit",
        "primary.portal.common.back",
        "primary.portal.tpiConfirmAddress.invalidZip",
        "primary.portal.common.requiredField",
        "primary.portal.tpiEnrollment.confirmAddress",
        "primary.portal.members.personalValidationMsg.maxlength100",
        "primary.portal.members.personalValidationMsg.city",
        "primary.portal.enrollment.acknowledgement",
        "primary.portal.callCenter.acknowledge",
        "primary.portal.common.selectionRequired",
        "primary.portal.tpiEnrollment.tpiValidationMsg.streetAddres1",
        "primary.portal.tpiEnrollment.addressChangeConfirmation",
        "primary.portal.tpiEnrollment.selfService.addressConfirmation",
    ]);
    hideBackButton: boolean;
    @HostBinding("class") classes = "tpi-content-wrapper";
    enrollmentMethod: EnrollmentMethod;
    isAGAccount = false;
    tpiLnlMode = false;
    displayConsent = false;
    HEADSET_METHOD = EnrollmentMethod.HEADSET;
    SELF_SERVICE = EnrollmentMethod.SELF_SERVICE;
    isMemberCIF = false;
    isStandaloneDemographicEnabled: boolean;
    dependentCount: number;
    enableDependentUpdateAddressModal = true;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly memberService: MemberService,
        private readonly staticService: StaticService,
        private readonly language: LanguageService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly producerService: ProducerService,
        private readonly staticUtilService: StaticUtilService,
        private readonly store: Store,
        private readonly router: Router,
        private readonly accountService: AccountService,
        private readonly tpiService: TpiServices,
        private readonly sharedService: SharedService,
        private readonly addressMatchingService: AddressMatchingService,
    ) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     */
    ngOnInit(): void {
        this.enrollmentMethod = this.store.selectSnapshot(EnrollmentState.GetEnrollmentMethod);
        if (
            this.enrollmentMethod === EnrollmentMethod.CALL_CENTER ||
            this.enrollmentMethod === EnrollmentMethod.HEADSET ||
            this.enrollmentMethod === EnrollmentMethod.PIN_SIGNATURE
        ) {
            this.displayConsent = true;
        }
        const user = this.store.selectSnapshot(TPIState.tpiSsoDetail).user;
        this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
        this.memberId = user.memberId;
        this.mpGroup = user.groupId.toString();
        const producerId = this.store.selectSnapshot(TPIState).tpiSSODetail.user.producerId;
        if (producerId) {
            this.getStatesList(producerId.toString());
        } else {
            this.staticService
                .getStates()
                .pipe(
                    takeUntil(this.unsubscribe$),
                    map((res) => res.filter((state) => state.abbreviation !== NEW_YORK_ABBR)),
                    tap((response) => {
                        response.sort((state1, state2) => (state1.abbreviation < state2.abbreviation ? -1 : 1));
                        this.states$ = response || [];
                    }),
                    switchMap((res) => this.getAddress()),
                )
                .subscribe();
        }
        this.getRegex();
        this.checkAGAccount();
        this.getConfig();
        this.enableBackButton(producerId);
        this.getMemberDependentCount();
    }
    /**
     * This method is used to check whether to enable / disable back button
     * @param producerId is producer id from tpi sso detail
     */
    enableBackButton(producerId: number): void {
        const listOfAgentAssistedProduct = this.store
            .selectSnapshot(TPIState.getOfferingState)
            ?.filter((filteredObj) => filteredObj.agentAssistanceRequired);
        if ((!listOfAgentAssistedProduct || listOfAgentAssistedProduct.length === 0) && !producerId) {
            this.hideBackButton = true;
        }
    }

    /**
     * Method to get list of states to display
     * @param producerId {string}
     */
    getStatesList(producerId: string): void {
        let states: CountryState[] = [];
        this.producerService
            .getProducerInformation(producerId)
            .pipe(
                takeUntil(this.unsubscribe$),
                map((producerInfo) => {
                    states = producerInfo.licenses.map((license) => license.state).filter((state) => state.abbreviation !== NEW_YORK_ABBR);
                    states.sort((state1, state2) => (state1.abbreviation < state2.abbreviation ? -1 : 1));
                    this.states$ = states || [];
                }),
                switchMap((res) => this.getAddress()),
            )
            .subscribe();
    }

    /**
     * Method to get address from service and create form
     */
    getAddress(): Observable<void> {
        this.isSpinnerLoading = true;
        return this.memberService.getMemberContact(this.memberId, ContactType.HOME, this.mpGroup).pipe(
            takeUntil(this.unsubscribe$),
            tap((memberContact) => {
                this.isSpinnerLoading = false;
                this.memberContact = memberContact.body;
                this.address = memberContact.body.address;
                if (this.address.state === NEW_YORK_ABBR) {
                    this.states$ = [{ name: NEW_YORK_CITY, abbreviation: NEW_YORK_ABBR }];
                }
                this.createForm();
            }),
            switchMap((resp) => this.memberService.getMember(this.memberId, true, this.mpGroup)),
            tap((memberData) => {
                this.isMemberCIF = !!memberData.body?.customerInformationFileNumber;
            }),
            catchError((error) => of(error)),
        );
    }

    /**
     * Method to fetch regex from store
     */
    getRegex(): void {
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });
    }

    /**
     * Method to create Form and populate values received from service
     */
    createForm(): void {
        const address1 = this.address.address1 ? this.address.address1 : "";
        const address2 = this.address.address2 ? this.address.address2 : "";
        const city = this.address.city ? this.address.city : "";
        this.addressForm = this.formBuilder.group({
            street1Control: [address1, [Validators.required, Validators.pattern(this.validationRegex.ADDRESS)]],
            street2Control: [address2, Validators.pattern(this.validationRegex.ADDRESS)],
            cityControl: [city, [Validators.required, Validators.pattern(this.validationRegex.CITY)]],
            stateControl: [this.address.state, Validators.required],
            zipControl: [this.address.zip, [Validators.required, Validators.pattern(this.validationRegex.ZIP_CODE)]],
            acknowledgeControl: [false, Validators.requiredTrue],
        });
    }

    /**
     * Method to fetch configurations
     */
    getConfig(): void {
        // Config to check if address validation and dependent address update modal is required
        this.staticUtilService
            .cacheConfigs([AddressConfig.ADDRESS_VALIDATION, AddressConfig.ENABLE_DEPENDENT_ADDRESS_MODAL])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([addressValidationSwitch, enableDependentUpdateAddressModal]) => {
                this.addressValidationSwitch = this.staticUtilService.isConfigEnabled(addressValidationSwitch);
                this.enableDependentUpdateAddressModal = this.staticUtilService.isConfigEnabled(enableDependentUpdateAddressModal);
            });

        // Config to check if Standalone Demographic Changes is enabled
        this.sharedService
            .getStandardDemographicChangesConfig()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((isStandaloneDemographicEnabled) => (this.isStandaloneDemographicEnabled = isStandaloneDemographicEnabled));
    }
    /**
     * Method to check if the account is an AG account
     */
    checkAGAccount(): void {
        this.accountService
            .getGroupAttributesByName([AG_ACCOUNT], +this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                if (resp.length > 0) {
                    this.isAGAccount = JSON.parse(resp[0].value);
                }
            });
    }

    /**
     * Method to navigate to next step
     */
    onSuccess(): void {
        if (this.enrollmentMethod === EnrollmentMethod.HEADSET || this.enrollmentMethod === EnrollmentMethod.CALL_CENTER) {
            this.store.dispatch(new SetEnrollmentState(this.memberContact.address.state));
        }
        this.router.navigate(["tpi/partial-census"]);
    }

    /**
     * Method invoked on click on confirm button in the form
     */
    onSubmit(): void {
        if (!this.displayConsent) {
            this.addressForm.controls.acknowledgeControl.clearValidators();
            this.addressForm.controls.acknowledgeControl.updateValueAndValidity();
        }
        this.zipMismatchError = false;
        if (this.addressForm.invalid) {
            this.showError = true;
        } else {
            this.showError = false;
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
                this.verifyAddressDetails();
            } else {
                this.isSpinnerLoading = true;
                this.nextAfterVerifyAddress()
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(() => (this.isSpinnerLoading = false));
            }
        }
    }

    /**
     * This function calls verify address api and deals with post verification actions
     */
    verifyAddressDetails(): void {
        this.isSpinnerLoading = true;
        const address = this.memberContact.address as PersonalAddress;
        this.memberService
            .verifyMemberAddress(address)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((verifiedAddress: VerifiedAddress) => {
                    this.addressResp = false;
                    this.isSpinnerLoading = false;
                    this.memberContact.addressValidationDate = new Date();
                }),
                switchMap((verifiedAddress: VerifiedAddress) => {
                    this.isSpinnerLoading = false;
                    if (verifiedAddress.matched) {
                        return this.nextAfterVerifyAddress();
                    }
                    return this.openModal(AppSettings.ADDRESS_BOTH_OPTION, address, verifiedAddress);
                }),
                catchError((error) => {
                    this.isSpinnerLoading = false;
                    this.addressMessages = [];
                    this.addressResp = true;
                    this.handleVerifyAddressError(error);
                    return of(error);
                }),
                switchMap((resp) => {
                    if (this.addressResp) {
                        if (this.isAGAccount) {
                            return this.nextAfterVerifyAddress();
                        }
                        return this.openModal(ADDRESS_OPTIONS.SINGLE, address, null, resp.status);
                    }
                    return of(null);
                }),
            )
            .subscribe();
    }

    /**
     * Method to handle verify address error response
     * @param err Error stack
     * @returns void
     */
    handleVerifyAddressError(err: Error): void {
        const error = err["error"];
        if (error.status === AppSettings.API_RESP_400) {
            this.memberContact.addressValidationDate = new Date();
            if (error.details) {
                this.addressMessages = error.details.map((item) => item.message);
            } else {
                this.addressMessages.push(this.language.fetchSecondaryLanguageValue("secondary.portal.directAccount.invalidAdressdata"));
            }
        } else if (error.status === AppSettings.API_RESP_500) {
            this.addressMessages.push(
                this.language.fetchSecondaryLanguageValue("secondary.portal.accountPendingEnrollments.internalServer"),
            );
        } else {
            this.addressMessages.push(this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code));
        }
    }

    /**
     * This function will be called when a next action is triggered in address verification modal
     * @param {{ isVerifyAddress: boolean; selectedAddress: string }} [modalData]
     * @param {VerifiedAddress} [resp]
     * @returns {Observable<{ isVerifyAddress: boolean; selectedAddress: string }>}
     */
    nextAfterVerifyAddress(
        modalData?: { isVerifyAddress: boolean; selectedAddress: string },
        resp?: VerifiedAddress,
    ): Observable<{ isVerifyAddress: boolean; selectedAddress: string }> {
        const validateStateZip$ = this.staticService.validateStateZip(
            this.addressForm.controls.stateControl.value,
            this.addressForm.controls.zipControl.value,
        );
        const continueWithAddress = modalData && modalData.selectedAddress !== AppSettings.SUGGESTED_ADDRESS && modalData.isVerifyAddress;
        const suggestedAddress = modalData && modalData.selectedAddress === AppSettings.SUGGESTED_ADDRESS && modalData.isVerifyAddress;
        if (suggestedAddress) {
            this.memberContact.address = resp.suggestedAddress;
        }
        if (continueWithAddress || suggestedAddress || !modalData) {
            const saveMemberContact$ = this.memberService
                .saveMemberContact(this.memberId, ContactType.HOME, this.memberContact, this.mpGroup)
                .pipe(catchError((_err) => of(undefined)));
            return forkJoin([validateStateZip$, saveMemberContact$]).pipe(
                filterNullValues(),
                tap(([_stateValidityResponse, saveMemberResponse]) => {
                    this.isSpinnerLoading = false;
                }),
                catchError((err) => {
                    this.isSpinnerLoading = false;
                    this.showError = true;
                    this.addressForm.get("zipControl").setErrors({ pattern: true });
                    return of(err);
                }),
            );
        }
        return of(null);
    }

    /**
     * This function will open address verification modal and deal with post closing modal actions
     * @param option response address options single/both
     * @param address user provided address
     * @param verifiedAddress suggested address from API
     * @param errorStatus API error status
     * @returns {Observable}
     */
    openModal(
        option: string,
        address: PersonalAddress,
        verifiedAddress?: VerifiedAddress,
        errorStatus?: number,
    ): Observable<{ isVerifyAddress: boolean; selectedAddress: string }> {
        const addressDialog = this.empoweredModalService.openDialog(AddressVerificationComponent, {
            data: {
                suggestedAddress: verifiedAddress ? verifiedAddress.suggestedAddress : null,
                providedAddress: address,
                addressResp: this.addressResp,
                addressMessage: this.addressMessages,
                option: option,
                errorStatus: errorStatus,
            },
        });
        return addressDialog.afterClosed().pipe(
            filterNullValues(),
            switchMap((elementData) => {
                if (
                    this.enableDependentUpdateAddressModal &&
                    this.dependentCount &&
                    this.addressMatchingService.hasAddressChanged(this.address, address)
                ) {
                    return this.openDependentAddressUpdateModal(address, +this.mpGroup).pipe(switchMap(() => of(elementData)));
                }
                return of(elementData);
            }),
            switchMap((elementData) => this.nextAfterVerifyAddress(elementData.data, verifiedAddress)),
        );
    }

    /**
     * Function called on click of 'Exit' button and is used to exit from TPI flow
     */
    onExit(): void {
        this.router.navigate(["tpi/exit"]);
    }

    /**
     * Function called on click of 'Back' button and is used to go to previous step in TPI flow
     */
    back(): void {
        if (this.enrollmentMethod === EnrollmentMethod.SELF_SERVICE) {
            this.router.navigate(["tpi/enrollment-initiate"]);
        } else {
            this.router.navigate(["tpi/enrollment-method"]);
        }
    }

    /**
     * If the address has been changed it will open the dependent address update modal
     * @param memberAddress - address entered at the form
     * @returns Observable<void | null>
     */
    openDependentAddressUpdateModal(memberAddress: PersonalAddress, mpGroupId: number): Observable<void | null> {
        return this.empoweredModalService
            .openDialog(DependentAddressUpdateModalComponent, {
                data: {
                    memberId: this.memberId,
                    memberAddress: memberAddress,
                    mpGroupId,
                },
            })
            .afterClosed();
    }

    /**
     * Sets the dependent count of the member
     */
    getMemberDependentCount() {
        this.memberService
            .getMemberDependents(this.memberId, false, +this.mpGroup)
            .pipe(
                catchError(() => EMPTY),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((dependents) => {
                this.dependentCount = dependents?.length ? dependents.length : 0;
            });
    }

    /**
     * ng life cycle hook
     * This method will execute before component is destroyed
     * To avoid memory leakage this will destroy all the subscription for the component
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
