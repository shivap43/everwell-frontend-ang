import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatRadioChange } from "@angular/material/radio";
import { County, StaticService } from "@empowered/api";
import { Select, Store } from "@ngxs/store";
import { MemberService } from "@empowered/api";
import {
    ClientErrorResponseCode,
    PortalType,
    ServerErrorResponseCode,
    AddressMatchModel,
    PersonalAddress,
    ContactType,
    CountryState,
    MemberContact,
} from "@empowered/constants";
import { Observable, of, Subscription, combineLatest, BehaviorSubject } from "rxjs";
import { catchError, filter, switchMap, take, tap } from "rxjs/operators";
import { StaticUtilService, SharedState, RegexDataType } from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";
import { HttpErrorResponse } from "@angular/common/http";
import { MembersBusinessService } from "../../services/members-business.service";
import { EmpoweredModalService, AddressMatchingService } from "@empowered/common-services";

const UPDATE_ADDRESS = "updateAddress";
const UPDATE_ADDRESS_NOT = "updateAddressNot";
const ZIP = "zip";
const ADDRESS_MAX_LENGTH = 100;

@Component({
    selector: "empowered-address-matching-prompt",
    templateUrl: "./address-matching-prompt.component.html",
    styleUrls: ["./address-matching-prompt.component.scss"],
})
export class AddressMatchingPromptComponent implements OnInit, OnDestroy {
    step1 = true;
    step2 = false;
    step3 = false;
    step4 = false;
    isAgent = new FormControl(false);
    isRelatedToAgent = new FormControl(false);
    isMPP = false;
    isMMP = false;
    isTpi: boolean;
    portal: string;
    mpGroupId: number;
    memberId: number;
    subscriptions: Subscription[] = [];
    isSpinnerLoading = false;
    addressChangeForm: FormGroup;
    states: CountryState[];
    updateAddressOption = new FormControl(UPDATE_ADDRESS);
    showUpdateAddressForm = true;
    isError = false;
    memberContactHomeData: MemberContact;
    @Select(SharedState?.regex) regex$: Observable<RegexDataType>;
    validationRegex: RegexDataType;
    countries: string[] = [];
    counties: County[] = [];
    updateAddress = UPDATE_ADDRESS;
    updateAddressNot = UPDATE_ADDRESS_NOT;
    private readonly stateControlValueSubject$: BehaviorSubject<string> = new BehaviorSubject("");
    readonly stateControlValue$: Observable<string> = this.stateControlValueSubject$.asObservable();
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.members.personalLabel.select",
    ]);
    addressVerifyMessage: string[] = [];
    hasCifNumber = true;

    constructor(
        private readonly dialogRef: MatDialogRef<AddressMatchingPromptComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: AddressMatchModel,
        private readonly store: Store,
        private readonly addressMatchingService: AddressMatchingService,
        private readonly staticService: StaticService,
        private readonly memberService: MemberService,
        private readonly fb: FormBuilder,
        private readonly languageService: LanguageService,
        private readonly staticUtilService: StaticUtilService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly membersBusinessService: MembersBusinessService,
    ) {
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.isTpi = data.isTPILnlAgentAssisted || data.isTPILnlSelfService;
        this.isMMP = this.portal === PortalType.MEMBER;
        this.isMPP = !this.isMMP && !this.data.isDirect && !this.isTpi;
    }

    /**
     * on init
     */
    ngOnInit(): void {
        this.regex$.pipe(take(1)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });
        this.initializeForm();
        this.loadDropDown();
        this.isAgent.setValue(false);
        this.isRelatedToAgent.setValue(false);
        this.mpGroupId = this.data.mpGroupId;
        this.memberId = this.data.memberId;
        this.subscriptions.push(
            this.memberService.getMemberContact(this.memberId, ContactType.HOME, this.mpGroupId.toString()).subscribe((response) => {
                this.memberContactHomeData = response.body;
            }),
        );
        this.getCifNumber();
    }

    /**
     * check if member has CIF number
     */
    getCifNumber(): void {
        this.subscriptions.push(
            this.memberService.getMember(this.memberId, true, this.mpGroupId.toString()).subscribe((profileData) => {
                this.hasCifNumber = !!profileData.body?.customerInformationFileNumber;
            }),
        );
    }

    /**
     * Initializes update address form
     */
    initializeForm(): void {
        this.addressChangeForm = this.fb.group({
            streetAddress1: [
                this.data.address.address1,
                [Validators.required, Validators.pattern(this.validationRegex.ADDRESS), Validators.maxLength(ADDRESS_MAX_LENGTH)],
            ],
            streetAddress2: [
                this.data.address.address2,
                [Validators.pattern(this.validationRegex.ADDRESS), Validators.maxLength(ADDRESS_MAX_LENGTH)],
            ],
            city: [
                this.data.address.city,
                [Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED), Validators.maxLength(ADDRESS_MAX_LENGTH)],
            ],
            state: [{ value: this.data.address.state, disabled: true }],
            zip: [this.data.address.zip, [Validators.required, Validators.pattern(this.validationRegex.ZIP_CODE)]],
            county: [],
            country: [],
        });

        this.subscriptions.push(
            this.addressChangeForm
                .get(ZIP)
                .valueChanges.pipe(tap(() => this.stateControlValueSubject$.next(this.data.address.state)))
                .subscribe(),
        );
    }

    /**
     * Loads drop down data for country and county
     */
    loadDropDown(): void {
        this.subscriptions.push(
            combineLatest([this.staticService.getCountries(), this.staticService.getCounties(this.data.address.state)]).subscribe(
                ([countries, counties]) => {
                    this.countries = countries;
                    this.counties = counties;
                },
            ),
        );
    }

    /**
     * determines the back step to be displayed
     */
    onBack(): void {
        if (this.step2) {
            this.step1 = true;
            this.step2 = false;
            this.isRelatedToAgent.setValue(false);
        } else if (this.step3 && this.isAgent.value) {
            this.step3 = false;
            this.step1 = true;
        } else if (this.step3 && this.isRelatedToAgent.value) {
            this.step3 = false;
            this.step2 = true;
        } else if (this.step4) {
            this.step4 = false;
            this.step2 = true;
        }
    }

    /**
     * determines the next step to be displayed
     */
    onNext(): void {
        if (this.step1) {
            this.step1 = !this.step1;
            this.step3 = this.isAgent.value;
            this.step2 = !this.step3;
        } else if (this.step2) {
            this.step3 = this.isRelatedToAgent.value;
            this.step4 = !this.isRelatedToAgent.value;
            this.step2 = false;
        }
    }

    /**
     * saves the decision of applicant on continue
     */
    onContinue(): void {
        this.isSpinnerLoading = true;
        if (this.isRelatedToAgent.value || this.isAgent.value) {
            this.subscriptions.push(
                this.addressMatchingService
                    .saveAccountContactOrAccountProducerConfirmation(this.mpGroupId, this.memberId, true)
                    .subscribe(() => {
                        this.isSpinnerLoading = false;
                        this.dialogRef.close({ routeToAppFlow: true });
                    }),
            );
        }
    }

    /**
     * send flag value routeToAppFlow as true on click
     * of got it button of update address required step
     */
    onGotIt(): void {
        this.isSpinnerLoading = true;
        // saveAccountContactOrAccountProducerConfirmation api flag set to false on not updating address
        this.subscriptions.push(
            this.addressMatchingService.saveAccountContactOrAccountProducerConfirmation(this.mpGroupId, this.memberId, false).subscribe(
                () => {
                    this.isSpinnerLoading = false;
                    this.dialogRef.close({ routeToAppFlow: true });
                },
                () => (this.isSpinnerLoading = false),
            ),
        );
    }

    /**
     * submits address form data
     */
    onSubmit(): void {
        if (this.updateAddressOption.value === UPDATE_ADDRESS_NOT) {
            this.isSpinnerLoading = true;
            // saveAccountContactOrAccountProducerConfirmation api flag set to false on not updating address
            this.subscriptions.push(
                this.addressMatchingService.saveAccountContactOrAccountProducerConfirmation(this.mpGroupId, this.memberId, false).subscribe(
                    () => {
                        this.isSpinnerLoading = false;
                        this.dialogRef.close({ routeToAppFlow: true });
                    },
                    () => (this.isSpinnerLoading = false),
                ),
            );
        } else if (this.addressChangeForm.valid) {
            this.isSpinnerLoading = true;
            this.memberContactHomeData.address.address1 = this.addressChangeForm.controls["streetAddress1"].value;
            this.memberContactHomeData.address.address2 = this.addressChangeForm.controls["streetAddress2"].value;
            this.memberContactHomeData.address.city = this.addressChangeForm.controls["city"].value;
            this.memberContactHomeData.address.state = this.addressChangeForm.controls["state"].value;
            this.memberContactHomeData.address.countyId = this.addressChangeForm.controls["county"].value;
            this.memberContactHomeData.address.country = this.addressChangeForm.controls["country"].value;
            this.memberContactHomeData.address.zip = this.addressChangeForm.controls["zip"].value;
            this.subscriptions.push(
                this.addressMatchingService
                    .validateAccountContactOrAccountProducerMatch(this.mpGroupId, this.memberId, this.memberContactHomeData.address)
                    .pipe(
                        switchMap((isAddressMatched) => {
                            this.isError = isAddressMatched;
                            this.isSpinnerLoading = !isAddressMatched;
                            return of(isAddressMatched);
                        }),
                        filter((isAddressMatched) => !isAddressMatched),
                        switchMap(() => this.verifyAddressDetails(this.memberContactHomeData.address)),
                    )
                    .subscribe(
                        () => {
                            this.isSpinnerLoading = false;
                            this.dialogRef.close({ routeToAppFlow: true, updatedAddress: this.memberContactHomeData.address });
                        },
                        () => (this.isSpinnerLoading = false),
                    ),
            );
        }
    }

    /**
     * displays or hides the update address form based on user's choice
     * @param event
     */
    onUpdateAddressFormChange(event: MatRadioChange): void {
        this.showUpdateAddressForm = event.value === UPDATE_ADDRESS;
        this.isError = false;
    }

    /**
     * This method will update the verified address.
     * @param providedAddress  user provided address.
     * @returns Observable of boolean depending on verifyAddress API response
     */
    verifyAddressDetails(providedAddress: PersonalAddress): Observable<void> {
        return this.membersBusinessService
            .verifyAddress(providedAddress, this.memberService, this.empoweredModalService, this.languageService, this.staticUtilService)
            .pipe(
                tap((result) => (this.isSpinnerLoading = Boolean(result))),
                filter(Boolean),
                switchMap(() =>
                    this.memberService.saveMemberContact(
                        this.memberId,
                        ContactType.HOME,
                        this.memberContactHomeData,
                        this.mpGroupId.toString(),
                    ),
                ),
                catchError((error) => {
                    this.handleError(error);
                    this.isSpinnerLoading = false;
                    return of(null);
                }),
            );
    }

    /**
     * Handles error
     * @param error
     */
    handleError(error: HttpErrorResponse): void {
        this.addressVerifyMessage = [];
        this.isSpinnerLoading = false;
        if (error.status === ClientErrorResponseCode.RESP_400) {
            if (error.error?.details) {
                error.error.details.map((item) => this.addressVerifyMessage.push(item.message));
            } else {
                this.addressVerifyMessage.push(
                    this.languageService.fetchSecondaryLanguageValue("secondary.portal.directAccount.invalidAdressdata"),
                );
            }
        } else if (error.status === ServerErrorResponseCode.RESP_500) {
            this.addressVerifyMessage.push(
                this.languageService.fetchSecondaryLanguageValue("secondary.portal.accountPendingEnrollments.internalServer"),
            );
        } else if (error.error?.details?.length) {
            this.addressVerifyMessage.push(error.error.details[0].message);
        }
    }

    /**
     * on destroy
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
}
