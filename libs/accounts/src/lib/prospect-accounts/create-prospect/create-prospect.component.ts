import { AccountService, AflacService, ProducerService, StaticService } from "@empowered/api";
import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Select, Store } from "@ngxs/store";
import { BehaviorSubject, merge, Observable, Subscription } from "rxjs";
import { UserService } from "@empowered/user";
import { startWith, map, tap, filter, catchError, switchMap } from "rxjs/operators";
import {
    ClientErrorResponseCode,
    ClientErrorResponseType,
    ClientErrorResponseDetailCodeType,
    PhoneNumber,
    ContactType,
    CountryState,
    ProducerCredential,
    Accounts,
} from "@empowered/constants";
import { ZipCodeInputComponent } from "@empowered/ui";
import { AccountListState, SharedState, RegexDataType } from "@empowered/ngxs-store";

const STATE_ZIP_MISMATCH = "zip.stateMismatch";
const SIC_IR_NUMBER_STEP = 1;
const ADD_PROSPECT_INFO_STEP = 2;
const ADD_CONTACT_INFO_STEP = 3;

export interface Option {
    name: string;
    email: string;
    writingNumbers: string[];
}

@Component({
    selector: "empowered-create-prospect",
    templateUrl: "./create-prospect.component.html",
    styleUrls: ["./create-prospect.component.scss"],
})
export class CreateProspectComponent implements OnInit, OnDestroy {
    // language
    languageSecondStringsArray = this.language.fetchSecondaryLanguageValues(["secondary.portal.prospect.createProspect.maxLength"]);
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.prospects.steponeofThreee",
        "primary.portal.prospects.createProspect",
        "primary.portal.prospects.sicirNo",
        "primary.portal.prospects.siclink",
        "primary.portal.prospects.accountPrimaryproducer",
        "primary.portal.prospects.me",
        "primary.portal.prospects.someonefromMyteam",
        "primary.portal.prospects.steptowofThree",
        "primary.portal.prospects.addProspectinfo",
        "primary.portal.prospects.companyName",
        "primary.portal.prospects.situsState",
        "primary.portal.prospects.situsZip",
        "primary.portal.prospects.sicCode",
        "primary.portal.prospects.partnerGroupno",
        "primary.portal.prospects.stepthreeofThree",
        "primary.portal.prospects.createProspect",
        "primary.portal.prospects.streetAddressone",
        "primary.portal.prospects.streetAddresstwo",
        "primary.portal.prospects.floorSuite",
        "primary.portal.prospects.city",
        "primary.portal.prospects.state",
        "primary.portal.prospects.zip",
        "primary.portal.prospects.addContactInfo",
        "primary.portal.prospects.contactPhone",
        "primary.portal.prospects.contactEmail",
        "primary.portal.common.cancel",
        "primary.portal.common.next",
        "primary.portal.common.select",
        "primary.portal.common.optional",
        "primary.portal.common.back",
        "primary.portal.census.manualEntry.zipErrorMsg",
        "primary.portal.prospects.producernameWriting",
        "primary.portal.common.close",
    ]);

    // template components/elements
    @ViewChild("situsZip") situsZipCodeInput: ZipCodeInputComponent;
    @ViewChild("zip") zipCodeInput: ZipCodeInputComponent;

    // regex
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    validationRegex: RegexDataType;

    // form groups
    sicIrForm: FormGroup;
    addProspectInfoForm: FormGroup;
    createProspectForm: FormGroup;

    // step
    currentStepIndex = 1;

    // input length
    minimumSearchLength = 2;
    maxLength100 = 100;
    maxLength200 = 200;
    readonly PHONE_NUMBER_MAX_LENGTH = PhoneNumber.MAX_LENGTH;

    // errors
    errorResp: boolean;
    errorMsg: string;
    zipErrorMsg: string;

    // general form data
    situsStates: CountryState[];
    zipFlag: boolean;
    accountData: any = {};
    memberInfo: ProducerCredential;
    accountsData: any;
    sicData: Accounts;

    // producer specific
    producerSearchList: any;
    options: Option[] = [];
    subProducerId: any;
    displaySubOrdinateForm = false;
    selectedSubproducer: any;
    filteredWritingNumbers: any[] = []; // TODO: set but not used anywhere
    filteredOptions: Observable<string[]>; // TODO: set as string array but used as object array in template

    // status flags
    dataLoadedFlag = false;
    showSpinner = true;
    hideCancelButton = false;

    // subscription array
    subscriptions: Subscription[] = [];

    // situs form country state (step 2)
    private readonly situsStateValueSubject$: BehaviorSubject<string> = new BehaviorSubject("");
    readonly situsStateValue$: Observable<string> = this.situsStateValueSubject$.asObservable();

    // contact info form country state (step 3)
    private readonly stateValueSubject$: BehaviorSubject<string> = new BehaviorSubject("");
    readonly stateValue$: Observable<string> = this.stateValueSubject$.asObservable();

    /**
     * Get current producer's ID to find all "sub"-producers to select from.
     */
    getProducerOptions$ = this.userService.credential$.pipe(
        tap((credential) => (this.memberInfo = credential as ProducerCredential)),
        switchMap(() =>
            this.producerService.producerSearch({
                supervisorProducerId: this.memberInfo.producerId,
            }),
        ),
        tap((producers) => {
            this.producerSearchList = producers;
            this.displaySubOrdinateForm = !!producers.content.length;
            this.showSpinner = false;
            this.dataLoadedFlag = true;
            this.callFilter();
            this.options = this.producerSearchList.content.map((producer) => ({
                name: `${producer.name.firstName} ${producer.name.lastName}`,
                email: producer.email as string,
                writingNumbers: producer.writingNumbers
                    .filter((writingNumber) => writingNumber && writingNumber.number)
                    .map((writingNumber) => writingNumber.number),
            }));
        }),
        catchError((error) => {
            this.showSpinner = false;
            return error;
        }),
    );

    constructor(
        private readonly fb: FormBuilder,
        private readonly staticService: StaticService,
        private readonly accountService: AccountService,
        private readonly language: LanguageService,
        private readonly aflacService: AflacService,
        private readonly matDialog: MatDialog,
        private readonly producerService: ProducerService,
        private readonly store: Store,
        private readonly userService: UserService,
        private readonly matDialogRef: MatDialogRef<CreateProspectComponent>,
    ) {}

    /**
     * This function is used to initialized all the values and functions at the time of component loading.
     */
    ngOnInit(): void {
        // collection of observables for initialization
        this.subscriptions.push(
            merge(
                this.staticService.getStates().pipe(tap((states) => (this.situsStates = states))),
                this.regex$.pipe(
                    filter((regex) => !!regex),
                    tap((regex) => (this.validationRegex = regex)),
                ),
                this.getProducerOptions$,
            ).subscribe(),
        );

        // get data from store
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.accountsData = this.store.selectSnapshot(AccountListState.getAccountList);

        // create form groups
        this.sicIrFormInitialization();
        this.addProspectInfoFormInitialization();
        this.createProspectFormInitialization();
    }

    /**
     * Close modal.
     */
    closeDialogue(): void {
        this.matDialog.closeAll();
    }

    /**
     * Initialize SIC IR form.
     */
    sicIrFormInitialization(): void {
        this.sicIrForm = this.fb.group({
            sicirNumber: ["", Validators.required],
            radioOptions: [""],
            searchProducer: [""],
        });
    }

    /**
     * Initialize add prospect info form. Prepopulate any existing work situs info.
     * @param companyName employing company name
     * @param situsState country state
     * @param situsZip zip code
     */
    addProspectInfoFormInitialization(companyName?: string, situsState?: string, situsZip?: string): void {
        this.addProspectInfoForm = this.fb.group({
            companyName: [
                companyName,
                [
                    Validators.required,
                    Validators.minLength(3),
                    Validators.maxLength(this.maxLength200),
                    Validators.pattern(this.validationRegex.ADDRESS),
                ],
            ],
            situsState: [situsState, [Validators.required]],
            situsZip: [situsZip, [Validators.required, Validators.pattern(this.validationRegex.ZIP_CODE)]],
            sicCode: [""],
            partnerGroupNumber: [""],
        });
        this.addProspectInfoForm.controls.sicCode.disable();
        this.addProspectInfoForm.controls.partnerGroupNumber.disable();
    }

    /**
     * Emit selected state value.
     * @param state selected state value (abbreviation)
     */
    onSitusStateChange(state: string): void {
        // Workaround. Ensures zip code validation errors show, if any.
        this.addProspectInfoForm.controls.situsZip.markAsTouched();
        this.situsZipCodeInput.zipCodeControl.markAsTouched();

        this.situsStateValueSubject$.next(state);
    }

    /**
     * Emit selected state value.
     * @param state selected state value (abbreviation)
     */
    onStateChange(state: string): void {
        // Workaround. Ensures zip code validation errors show, if any.
        this.createProspectForm.controls.zip.markAsTouched();
        this.zipCodeInput.zipCodeControl.markAsTouched();

        this.stateValueSubject$.next(state);
    }

    /**
     * Initialize create prospect form group. Prepopulate with any of member's existing values.
     * @param streetAddress1 street address
     * @param streetAddress2 apt #, room #, etc.
     * @param city city
     * @param state country state
     * @param zip zip code
     * @param contactPhone phone number
     * @param contactEmail email address
     */
    createProspectFormInitialization(
        streetAddress1?: string,
        streetAddress2?: string,
        city?: string,
        state?: string,
        zip?: string,
        contactPhone?: string,
        contactEmail?: any,
    ): void {
        this.createProspectForm = this.fb.group({
            streetAddress1: [
                streetAddress1,
                [Validators.required, Validators.maxLength(this.maxLength100), Validators.pattern(this.validationRegex.ADDRESS)],
            ],
            streetAddress2: [streetAddress2, [Validators.maxLength(this.maxLength100), Validators.pattern(this.validationRegex.ADDRESS)]],
            city: [
                city,
                [
                    Validators.required,
                    Validators.maxLength(this.maxLength100),
                    Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED),
                ],
            ],
            state: [state, Validators.required],
            zip: [zip, [Validators.required, Validators.pattern(this.validationRegex.ZIP_CODE)]],
            contactPhone: [contactPhone, [Validators.pattern(new RegExp(this.validationRegex.VALID_PHONE))]],
            contactEmail: [contactEmail, [Validators.required, Validators.pattern(this.validationRegex.EMAIL)]],
        });
    }

    /**
     * Prepare next step and update step index.
     */
    onClickNext(): void {
        if (this.currentStepIndex === SIC_IR_NUMBER_STEP && this.sicIrForm.valid) {
            this.validateSicIrNumber();
        } else if (this.currentStepIndex === ADD_PROSPECT_INFO_STEP && this.addProspectInfoForm.valid && !this.zipFlag) {
            this.currentStepIndex += 1;
        } else if (this.currentStepIndex === ADD_CONTACT_INFO_STEP && this.createProspectForm.valid) {
            this.createProspect();
        }
    }

    /**
     * Update step index and clear error status.
     */
    onClickBack(): void {
        this.currentStepIndex -= 1;
        this.errorResp = false;
    }

    /**
     * Close modal.
     */
    onClickCancel(): void {
        this.matDialog.closeAll();
    }

    /**
     * Get prospect account info and create it.
     */
    createProspect(): void {
        this.showSpinner = true;
        const createProspectFormControls = this.createProspectForm.controls;
        this.accountData = {
            name: this.addProspectInfoForm.controls.companyName.value,
            primaryContact: {
                address: {
                    address1: createProspectFormControls.streetAddress1.value,
                    address2: createProspectFormControls.streetAddress2.value,
                    city: createProspectFormControls.city.value,
                    state: createProspectFormControls.state.value,
                    zip: createProspectFormControls.zip.value,
                    countyId: 0,
                    country: "USA",
                },
                emailAddresses: [
                    {
                        email: createProspectFormControls.contactEmail.value,
                        type: "WORK",
                    },
                ],
                typeId: 1,
                primary: false,
            },
            situs: {
                state: {
                    abbreviation: this.addProspectInfoForm.controls.situsState.value,
                    name: this.sicData.situs.state.name,
                },
                zip: this.addProspectInfoForm.controls.situsZip.value,
            },
            type: this.sicData.type,
            sicIrNumber: this.sicIrForm.controls.sicirNumber.value,
            subordinateProducerId: this.subProducerId,
        };
        if (createProspectFormControls.contactPhone.value) {
            this.accountData.primaryContact["phoneNumbers"] = [
                {
                    phoneNumber: createProspectFormControls.contactPhone.value.replaceAll(/-/g, ""),
                    extension: "",
                    type: this.sicData.primaryContact.phoneNumbers.length
                        ? this.sicData.primaryContact.phoneNumbers[0].type
                        : ContactType.WORK,
                },
            ];
        }
        this.createAccount();
    }

    /**
     * Create account and close modal on success. Show error otherwise.
     */
    createAccount(): void {
        this.subscriptions.push(
            this.accountService
                .createAccount(this.accountData)
                .pipe(
                    tap((createAccountResponse) => {
                        this.showSpinner = false;
                        this.errorResp = false;
                        const location: string = createAccountResponse.headers.get("location");
                        const stringArray = location.split("/");
                        const mpGroup = Number(stringArray[stringArray.length - 1]);
                        this.close(mpGroup);
                    }),
                    catchError((error) => {
                        this.errorResp = true;
                        this.showSpinner = false;
                        this.setCreateAccountErrorMessage(error);
                        return error;
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * Set error message based on error response from create account endpoint call.
     * @param error error response
     */
    setCreateAccountErrorMessage(error: any): void {
        if (
            error.error &&
            error.error.status &&
            error.error.status === ClientErrorResponseCode.RESP_400 &&
            error.error.code === ClientErrorResponseType.BAD_PARAMETER
        ) {
            if (error.error.details && error.error.details.length) {
                if (error.error.details[0].code === STATE_ZIP_MISMATCH) {
                    this.errorMsg = this.language.fetchSecondaryLanguageValue("secondary.portal.prospect.createProspect.zipMismatch");
                } else if (error.error.details[0].code === ClientErrorResponseDetailCodeType.VALID_EMAIL) {
                    this.errorMsg = this.language.fetchPrimaryLanguageValue(error.error.details[0].message);
                } else {
                    this.errorMsg = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
                }
            } else {
                this.errorMsg = this.language.fetchSecondaryLanguageValue("secondary.portal.prospect.createProspect.duplicateSIC");
            }
        } else {
            this.errorMsg = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
        }
    }

    /**
     * Set error message based on error response from set SIC number endpoint call.
     * @param error endpoint response
     */
    setSICErrorMessage(error: any): void {
        if (
            error.error &&
            error.error.status &&
            ((error.error.status === ClientErrorResponseCode.RESP_400 && error.error.code === ClientErrorResponseType.BAD_PARAMETER) ||
                (error.error.status === ClientErrorResponseCode.RESP_404 && error.error.code === ClientErrorResponseType.NOT_FOUND))
        ) {
            this.errorMsg = this.language.fetchSecondaryLanguageValue("secondary.portal.prospect.createProspect.SIC");
        } else if (this.errorMsg && !this.errorMsg.length) {
            this.errorMsg = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }

    /**
     * Call endpoint to validate SIC IR number. Create forms on success. Display error.
     */
    validateSicIrNumber(): void {
        this.showSpinner = true;
        this.subscriptions.push(
            this.aflacService
                .getAflacAccount("", this.sicIrForm.controls.sicirNumber.value)
                .pipe(
                    tap((account) => {
                        const primaryContact = account.body.primaryContact;
                        const situs = account.body.situs;
                        this.sicData = account.body;
                        this.showSpinner = false;
                        this.addProspectInfoFormInitialization(account.body.name, situs.state.abbreviation, situs.zip);
                        this.createProspectFormInitialization(
                            primaryContact.address.address1,
                            primaryContact.address.address2,
                            primaryContact.address.city,
                            primaryContact.address.state,
                            primaryContact.address.zip,
                            primaryContact.phoneNumbers.length ? primaryContact.phoneNumbers[0].phoneNumber : null,
                        );
                        this.situsStateValueSubject$.next(situs.state.abbreviation);
                        this.stateValueSubject$.next(primaryContact.address.state);
                        this.errorResp = false;
                        this.currentStepIndex += 1;
                    }),
                    catchError((error) => {
                        this.sicIrForm.controls.sicirNumber.setErrors({ invalid: true });
                        this.errorResp = true;
                        this.hideCancelButton = true;
                        this.showSpinner = false;
                        this.setSICErrorMessage(error);
                        return error;
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * Update producer selection and related information.
     * @param event material autocomplete event
     */
    selectedProducerOption(event: any): void {
        this.selectedSubproducer = event.value;
        const result = event.viewValue.split(this.selectedSubproducer).pop();

        const matchingProducer = this.producerSearchList.content.find((producer) => producer && producer.email === result);
        if (matchingProducer) {
            this.subProducerId = matchingProducer.id;
        }
    }

    /**
     * Filter producer options based on user input. Set errors if invalid.
     * @param value user input to search for a producer
     */
    private filter(value: string): string[] {
        const filterValue = value.toLowerCase();
        let filteredStates = []; // TODO: rename to something more appropriate? 'filteredProducers'?
        const uniq = {};
        if (value.length > this.minimumSearchLength) {
            let writingNumbersFlag: boolean;

            const temp = this.options.reduce((acc, option) => {
                if (option.name.toLowerCase().includes(filterValue)) {
                    return [...acc, option];
                }
                if (option.writingNumbers.some((el) => el.toLowerCase().includes(filterValue))) {
                    writingNumbersFlag = true;
                    return [...acc, option];
                }
                return acc;
            }, []);

            // TODO: what does this do? Statements are not allowed in conditions.
            filteredStates = writingNumbersFlag ? temp.filter((obj) => !uniq[obj.email] && (uniq[obj.email] = true)) : temp;

            if (!filteredStates.length) {
                this.sicIrForm.controls.searchProducer.setErrors({ incorrect: true });
            }
        }
        return filteredStates;
    }

    /**
     * Set filter producers observable.
     */
    callFilter(): void {
        this.filteredOptions = this.sicIrForm.controls.searchProducer.valueChanges.pipe(
            startWith(""),
            map((value) => this.filter(value)),
        );
    }

    /**
     * Close modal upon successful prospect creation.
     * @param mpGroupId account ID
     */
    close(mpGroupId: number): void {
        this.matDialogRef.close(mpGroupId);
    }

    /**
     * Unsubscribe from all subscriptions.
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
}
