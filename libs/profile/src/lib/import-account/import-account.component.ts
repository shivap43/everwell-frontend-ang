import { Component, OnInit, ViewChild, OnDestroy, Inject } from "@angular/core";
import { Validators, FormBuilder, FormGroup } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatStepper } from "@angular/material/stepper";

import { Router, ActivatedRoute } from "@angular/router";
import {
    AflacService,
    AccountService,
    AccountListService,
    ProducerService,
    InputResponseValidationFormat,
    CoverageStartType,
    NewHiredetails,
    ProducerSearchResponse,
    AccountListResponse,
    AccountDetails,
    DashboardService,
    NewHireRule,
} from "@empowered/api";
import { HttpHeaders, HttpErrorResponse } from "@angular/common/http";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Store, Select } from "@ngxs/store";
import { Subscription, Observable, of, Subject } from "rxjs";
import { take, startWith, map, tap, catchError, switchMap, filter } from "rxjs/operators";
import { UserService } from "@empowered/user";
import { MatSelectChange } from "@angular/material/select";
import { MatRadioChange } from "@angular/material/radio";
import { MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";

import {
    ClientErrorResponseType,
    ClientErrorResponseDetailCodeType,
    ROLE,
    CompanyCode,
    SITCode,
    WritingNumber,
    AccountProducer,
    UserPermissionList,
    AppSettings,
    ProducerCredential,
    Accounts,
} from "@empowered/constants";

import { AddAccountList, AccountInfoState, AddAccountInfo, SharedState, RegexDataType, StaticUtilService } from "@empowered/ngxs-store";

// Component Level Constants
const BLANK = "";
const STEP_ZERO = 0;
const STEP_ONE = 1;
const TWO = 2;
const THREE = 3;
const FORTY_EIGHT = 48;
const FIFTY_SEVEN = 57;
const BADDATA = "badData";
const ME = "me";
const LINK = "link";
const CREATE = "create";
const STEP_4 = 4;
const STEP_5 = 5;

@Component({
    selector: "empowered-import-account",
    templateUrl: "./import-account.component.html",
    styleUrls: ["./import-account.component.scss"],
})
export class ImportAccountComponent implements OnInit, OnDestroy {
    @ViewChild(MatStepper, { static: true }) matStepper: MatStepper;
    subscribObj: Subscription;
    stepOneForm: FormGroup;
    stepTwoForm: FormGroup;
    stepThreeForm: FormGroup;
    isCoverageStartsDate = false;
    isCoverageStartsMonth = false;
    isDisabled = true;
    isCoverageStartsDisabled = true;
    isAfterEvent = true;
    isFirstOfTheMonethAfter = true;
    isEnrollmentPeriodValid = true;
    mpGroup: number;
    isRole20 = false;
    subscriptions: Subscription[] = [];
    NUMBER_REGEX = new RegExp(InputResponseValidationFormat.NUMERIC);
    coverageType = CoverageStartType.IMMEDIATELY;
    writingNumberSubscription: Subscription;
    groupNumberSubscription: Subscription;
    prodSearchSubscription: Subscription;
    accountSearched = true;
    showSpinner = false;
    aflacAccount: Accounts;
    companyCode: CompanyCode;
    newHireDetails: NewHiredetails = {
        coverageStart: BLANK,
        daysToEnroll: 0,
    };
    sitCodes: SITCode[];
    writingNumbers: WritingNumber[];
    accountLocation: string;
    errorCode: string;
    admniSitCode: number;
    errorMessage: string;
    enrollmentPeriodValue = 30;
    importAccountLanguagePath = "primary.portals.accounts.importAccount";
    primaryPortalCommonPath = "primary.portal.common";
    primaryPortalProducer = "primary.portal.producerFilter";
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.placeholderSelect",
        "primary.portal.common.close",
        "primary.portal.common.cancel",
        "primary.portal.common.back",
        "primary.portal.common.next",
        "primary.portal.common.search",
        "primary.portals.accounts.importAccount.accountNo",
        "primary.portals.accounts.importAccount.step1.groupNumber",
        "primary.portals.accounts.importAccount.viewAccount",
        "primary.portals.accounts.importAccount.step2.import",
        "primary.portals.accounts.importAccount.about.startNASSA",
        "primary.portals.accounts.importAccount.about.learnMoreNASSA",
        "primary.portals.accounts.importAccount.errors.searchFirst",
        "primary.portals.accounts.importAccount.about.precallWorksheet.link",
        "primary.portals.accounts.importAccount.about.NASSA.link",
        "primary.portals.accounts.importAccount.about.NASSA.infoPart2",
        "primary.portals.accounts.importAccount.NASSA.email",
        "primary.portals.accounts.importAccount.NASSA.email.subject",
        "primary.portal.producerFilter.me",
        "primary.portal.producerFilter.someonefromMyteam",
        "primary.portal.producerFilter.searchbyProducer",
        "primary.portal.producerFilter.producernotFound",
        "primary.portals.accounts.importAccount.step1.aboutLink",
        "primary.portals.accounts.importAccount.about.precallWorksheetView",
        "primary.portals.accounts.importAccount.step1.subtitle",
        "primary.portals.accounts.importAccount.step2.subtitle",
        "primary.portals.accounts.importAccount.about.title",
        "primary.portal.prospects.stepThreeOfThree",
        "primary.portals.accounts.importAccount.newhireEligibility",
        "primary.portals.accounts.importAccount.settingsDetermine",
        "primary.portals.accounts.importAccount.enrollmentPeriod",
        "primary.portals.accounts.importAccount.newEmployees",
        "primary.portals.accounts.importAccount.daystoEnroll",
        "primary.portals.accounts.importAccount.coveragestartDate",
        "primary.portals.accounts.importAccount.immediatelySigned",
        "primary.portals.accounts.importAccount.immediatelyAfter",
        "primary.portals.accounts.importAccount.daysofEmployment",
        "primary.portals.accounts.importAccount.firstDay",
        "primary.portal.prospects.stepOneOfThree",
        "primary.portal.prospects.stepTwoOfThree",
        "primary.portal.common.requiredField",
        "primary.portal.common.selectOption",
        "primary.portals.accounts.importAflacAccount.step1.subtitle",
        "primary.portal.aflacgroup.importaccount.primaryProducer",
        "primary.portal.aflacgroup.importaccount.aflacGroupNo",
        "primary.portal.aflacgroup.importaccount.importAflacGroup",
        "primary.portal.aflacgroup.importaccount.individual.choice",
        "primary.portal.aflacgroup.importaccount.individual.linkIndividualToGroup",
        "primary.portal.aflacgroup.importaccount.individual.createAccount",
        "primary.portal.aflacgroup.importaccount.individual.cantLinkAflacgroup",
        "primary.portal.aflacgroup.importaccount.individual.contact",
        "primary.portal.aflacgroup.importaccount.individual.linkWarning",
        "primary.portal.aflacgroup.importaccount.individual.contactIndividual",
        "primary.portal.aflacgroup.importaccount.individual.linkWarningGroup",
        "primary.portal.aflacgroup.importaccount.aflacGroupWarning",
        "primary.portal.aflacgroup.importaccount.dangerInfo",
        "primary.portals.accounts.importAccount.errors.invalidAflacGroupNumber",
        "primary.portals.accounts.importAccount.errors.invalidGroupNumber",
        "primary.portal.aflacgroup.importaccount.invalidGroupNumber",
        "primary.portal.aflacgroup.importaccount.taxIdMismatchSingle",
        "primary.portal.aflacgroup.importaccount.individual.agGroupTitle",
        "primary.portal.aflacgroup.importaccount.individual.linkAflacGroup",
        "primary.portal.aflacgroup.importaccount.individual.aflacGroupLinkWarning",
        "primary.portal.aflacgroup.importaccount.individual.aflacGroupNewAccount",
        "primary.portal.aflacgroup.importaccount.importAflacAccount",
        "primary.portals.accounts.importAccount.errors.getAflacAccount.409.duplicate",
        "primary.portal.aflacgroup.importaccount.groupNumberInUse",
        "primary.portal.aflacgroup.importaccount.accountNumberInUse",
        "primary.portal.aflacgroup.importaccount.aflacIndividualWarning",
        "primary.portals.accounts.importAccount.errors.getAflacAccount.409.invalidState",
        "primary.portal.common.slash",
        "primary.portal.aflacgroup.importaccount.situsMismatchIndividual",
        "primary.portal.aflacgroup.importaccount.situsMismatchGroup",
        "primary.portal.aflacgroup.importaccount.missingZip",
        "primary.portals.accounts.importAccount.step1.errors.required.aflacGroupNumber",
    ]);
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    GROUPNUMBER: string;
    MemberInfo: ProducerCredential;
    producerSearchList: ProducerSearchResponse;
    options = [];
    filteredOptions: Observable<string[]>;
    searchLength = 2;
    selectedRadioButton = ME;
    searchForm: FormGroup;
    subordinateFlag = false;
    wnFlag = false;
    isStepThreeFormValid = false;
    inlineErrorCodePattern = AppSettings.IMPORT_ACCOUNT_INLINE_ERROR_CODE_PATTERN;
    isDuplicate = false;
    linkOption = LINK;
    isImport = false;
    newHireErrorMessage: string;
    linkAccountErrorMessage: string;
    isTaxIdMatched = false;
    private readonly unsubscribe$ = new Subject<void>();
    hasAccessToAccount = false;
    primaryProducer: ProducerCredential[];
    taxIdValidationSwitch: boolean;
    situsStateError: string;
    currentAccount: AccountDetails;
    missingZipError = "";
    hireRulesId: number;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly dialogRef: MatDialogRef<ImportAccountComponent>,
        private readonly router: Router,
        private readonly aflac: AflacService,
        private readonly accountService: AccountService,
        private readonly accountListService: AccountListService,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly producerService: ProducerService,
        private readonly userService: UserService,
        private readonly staticUtilService: StaticUtilService,
        @Inject(MAT_DIALOG_DATA) readonly data: { route: ActivatedRoute; isGroup: boolean; mpGroup: number },
        private readonly dashboardService: DashboardService,
    ) {}

    /**
     * @description Implements Angular's OnInit Life Cycle hook
     * @memberof ImportAccountComponent
     */
    ngOnInit(): void {
        if (this.data.isGroup) {
            const regex = this.store.selectSnapshot((state) => state.core.regex);
            this.GROUPNUMBER = regex.AFLAC_GROUP_NUMBER;
            this.constructForm();
        } else {
            this.regex$.pipe(take(TWO)).subscribe((data) => {
                if (data) {
                    this.GROUPNUMBER = data.GROUP_NUMBER;
                    this.constructForm();
                }
            });
        }
        this.subscriptions.push(
            this.aflac.getNewHireRules().subscribe((resp) => {
                this.hireRulesId = resp && resp.length ? resp[0].id : null;
            }),
        );
        this.currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        this.subscriptions.push(
            this.staticUtilService
                .cacheConfigValue("general.aflac_groups.shared_accounts.tax_id_valiation_message.enable")
                .subscribe((resp) => {
                    this.taxIdValidationSwitch = resp && resp.toLowerCase() === AppSettings.TRUE.toLowerCase();
                }),
        );
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.userService.credential$.pipe(take(1)).subscribe((response: ProducerCredential) => {
            this.MemberInfo = response;
        });
        this.writingNumberSubscription = this.stepTwoForm.controls.writingNumber.valueChanges.subscribe((selectedWritingNumber) => {
            const sitCodeControl = this.stepTwoForm.controls.sitCode;
            if (selectedWritingNumber && this.selectedRadioButton === ME) {
                this.getSitCodesfromWritingNumber(selectedWritingNumber);
                const sitCodes = this.sitCodes;
                // Prepopulate dropdown if there is just one value.
                if (sitCodes.length === 1) {
                    sitCodeControl.setValue(sitCodes[0].id);
                }
            }
        });
        // This is so as not to show errors/info on input
        this.groupNumberSubscription = this.stepOneForm.valueChanges.subscribe(() => {
            this.resetData();
            this.accountLocation = BLANK;
            this.errorCode = BLANK;
        });
        const params = {
            supervisorProducerId: this.MemberInfo.producerId,
        };
        this.prodSearchSubscription = this.producerService.producerSearch(params).subscribe((resp) => {
            this.producerSearchList = resp;
            if (this.producerSearchList && this.producerSearchList.content.length > 0) {
                this.subordinateFlag = true;
            }
            this.producerSearchList.content.forEach((ele) => {
                const wn = [];
                ele.writingNumbers.forEach((el) => {
                    wn.push(el.number);
                });
                this.options.push({
                    name: `${ele.name.firstName} ${ele.name.lastName}`,
                    email: ele.email,
                    wn: wn,
                });
            });
        });
    }

    /**
     * @description Function to construct form
     * @memberof ImportAccountComponent
     */
    constructForm(): void {
        this.stepOneForm = this.formBuilder.group(
            {
                groupNumber: [BLANK, [Validators.required, Validators.pattern(new RegExp(this.GROUPNUMBER))]],
            },
            { updateOn: "blur" },
        );
        this.stepTwoForm = this.formBuilder.group(
            {
                writingNumber: [null, Validators.required],
                sitCode: [null, Validators.required],
                writingNumberOther: [null, Validators.required],
                sitCodeOther: [null, Validators.required],
            },
            { updateOn: "blur" },
        );
        this.searchForm = this.formBuilder.group({
            searchControl: ["", Validators.required],
        });
        this.filteredOptions = this.searchForm.controls.searchControl.valueChanges.pipe(
            startWith(""),
            map((value) => this.filter(value)),
        );
        // step 3 form is being set in getWritingNumbers() method
    }

    /**
     * @description Disable the input fields
     * @memberof ImportAccountComponent
     */
    disableInputField(): void {
        this.stepThreeForm.get("daysBeforeCoverageStart").disable();
        this.stepThreeForm.get("monthsBeforeCoverageStart").disable();
    }

    /**
     * @description Function to perform number validation on user input
     * @param {KeyboardEvent} event
     * @memberof ImportAccountComponent
     */
    numberValidation(event: KeyboardEvent): void {
        if (
            event.type === "keypress" &&
            !(event.key.toString().charCodeAt(0) <= FIFTY_SEVEN && event.key.toString().charCodeAt(0) >= FORTY_EIGHT)
        ) {
            event.preventDefault();
        }
    }

    /**
     * @description Function to search account by groupnumber
     * @memberof ImportAccountComponent
     */
    searchAccountbyGroupNumber(): void {
        this.resetData();
        this.errorMessage = null;
        this.accountLocation = BLANK;
        this.showSpinner = true;
        this.isTaxIdMatched = true;
        this.situsStateError = "";
        this.missingZipError = "";
        if (this.data.isGroup) {
            this.aflac
                .getAflacGroup(this.stepOneForm.controls.groupNumber.value)
                .pipe(take(1))
                .subscribe(
                    (getAflacAccountResponse) => {
                        this.accountSearched = true;
                        this.showSpinner = false;
                        if (getAflacAccountResponse.status === AppSettings.API_RESP_200) {
                            this.aflacAccount = getAflacAccountResponse.body;
                            this.errorCode = null;
                            this.compareSitus();
                            if (this.taxIdValidationSwitch) {
                                if (
                                    this.aflacAccount.taxMatchedIndividualAccounts &&
                                    this.aflacAccount.taxMatchedIndividualAccounts.accessibleAccounts
                                ) {
                                    this.isTaxIdMatched = this.aflacAccount.taxMatchedIndividualAccounts.accessibleAccounts.some(
                                        (account) => account.accountId === this.data.mpGroup,
                                    );
                                } else {
                                    this.isTaxIdMatched = false;
                                }
                            }
                        }
                    },
                    (getAflacErrorResponse) => {
                        this.handleAflacAccountError(getAflacErrorResponse);
                    },
                );
        } else {
            this.aflac
                .getAflacAccount(this.stepOneForm.controls.groupNumber.value)
                .pipe(
                    take(1),
                    catchError((getAflacErrorResponse) => this.handleAflacAccountError(getAflacErrorResponse)),
                    switchMap((getAflacAccountResponse) => {
                        if (getAflacAccountResponse) {
                            return this.handlegetAflacSuccessResponse(getAflacAccountResponse);
                        }
                        return of(null);
                    }),
                )
                .subscribe(
                    (response) => {
                        if (response !== null) {
                            this.showSpinner = false;
                            this.primaryProducer = response.filter((producer) => producer.role === ROLE.PRIMARY_PRODUCER);
                            this.hasAccessToAccount = this.primaryProducer.some(
                                (producer) => producer.producerId === this.MemberInfo.producerId,
                            );
                        }
                    },
                    (error) => {
                        this.showSpinner = false;
                    },
                );
        }
    }

    /**
     * Method to handle getAflacSuccess response
     * @param getAflacAccountResponse {status: number,body: Accounts} getAflacAccount service success response
     * @return {Observable<ProducerCredential[]>} Producer Information
     */
    handlegetAflacSuccessResponse(getAflacAccountResponse: { status: number; body: Accounts }): Observable<null | ProducerCredential[]> {
        const returnedResult = of(null);
        this.accountSearched = true;
        this.showSpinner = false;
        if (getAflacAccountResponse.status === AppSettings.API_RESP_200) {
            if (getAflacAccountResponse.body.daysToEnroll) {
                this.enrollmentPeriodValue = getAflacAccountResponse.body.daysToEnroll;
            }
            const account = getAflacAccountResponse.body;
            this.aflacAccount = account;
            this.compareSitus();
            if (this.taxIdValidationSwitch) {
                if (
                    this.aflacAccount.taxMatchedAflacGroupAccount &&
                    this.aflacAccount.taxMatchedAflacGroupAccount.accessibleAccount &&
                    this.aflacAccount.taxMatchedAflacGroupAccount.accessibleAccount.accountId &&
                    this.aflacAccount.taxMatchedAflacGroupAccount.accessibleAccount.accountId === this.currentAccount.id
                ) {
                    this.isTaxIdMatched = true;
                } else {
                    this.isTaxIdMatched = false;
                }
            }
            this.companyCode = CompanyCode.US;
            if (account.situs && account.situs.state.abbreviation === CompanyCode.NY) {
                this.companyCode = CompanyCode.NY;
            }
            this.errorCode = null;
        }
        return returnedResult;
    }

    /**
     * @description Function to handle AflacAccount API Error
     * @param getAflacErrorResponse : HttpErrorResponse
     * @return Observable - returns null observable after handling the AflacAccount API error
     * @memberof ImportAccountComponent
     */
    handleAflacAccountError(getAflacErrorResponse: HttpErrorResponse): Observable<null> {
        this.accountSearched = true;
        this.showSpinner = false;
        this.isDuplicate = false;
        if (getAflacErrorResponse.error.code === BADDATA) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.api.importAccount.${getAflacErrorResponse.error.status}.${getAflacErrorResponse.error.code}`,
            );
        }
        if (
            getAflacErrorResponse.error.status === AppSettings.API_RESP_400 ||
            getAflacErrorResponse.error.status === AppSettings.API_RESP_403 ||
            getAflacErrorResponse.error.status === AppSettings.API_RESP_404 ||
            getAflacErrorResponse.error.status === AppSettings.API_RESP_409
        ) {
            if (getAflacErrorResponse.error.status === AppSettings.API_RESP_404) {
                this.stepOneForm.controls.groupNumber.setErrors({ invalid: true });
            }
            this.errorCode = `errors.getAflacAccount.${getAflacErrorResponse.error.status}.${getAflacErrorResponse.error.code}`;
            if (this.errorCode.endsWith(ClientErrorResponseType.SELF_DUPLICATE)) {
                this.stepOneForm.controls.groupNumber.setErrors({ selfDuplicate: true });
            }
            if (this.errorCode.endsWith(`.${ClientErrorResponseType.DUPLICATE}`)) {
                this.stepOneForm.controls.groupNumber.setErrors({ duplicate: true });
            }
            if (this.errorCode.endsWith(`.${ClientErrorResponseType.INVALID_STATE}`)) {
                if (getAflacErrorResponse.error.details[0].field === ClientErrorResponseDetailCodeType.ZIP_CODE) {
                    this.missingZipError = this.languageStrings["primary.portal.aflacgroup.importaccount.missingZip"];
                    this.stepOneForm.controls.groupNumber.setErrors({ missingZipError: true });
                } else {
                    this.stepOneForm.controls.groupNumber.setErrors({ notSetUp: true });
                }
            } else if (this.errorCode.endsWith(`.${ClientErrorResponseType.INVALID_APPLICATION_STATE}`)) {
                this.stepOneForm.controls.groupNumber.setErrors({
                    invalidApplicationState: true,
                });
            }
        } else {
            this.errorCode = "errors.getAflacAccount.generic";
        }
        this.resetData();
        return of(null);
    }

    /**
     * @description Function call to import account
     * @memberof ImportAccountComponent
     */
    onClickImport(): void {
        if (this.stepThreeForm.valid) {
            this.setNewHireDetails();
            if (this.isImport) {
                this.importAccount();
            } else {
                this.importAccountServiceCall(!this.data.isGroup);
            }
        }
    }

    /**
     * @description Function to import account
     * @memberof ImportAccountComponent
     */
    importAccount(): void {
        this.showSpinner = true;
        this.aflac
            .importAccount({
                accountNumber: this.aflacAccount.accountNumber,
                adminSitCodeId: this.admniSitCode,
            })
            .pipe(
                take(1),
                tap((importAccountResponse) => {
                    this.accountLocation = this.getAccountIDfromLocation(importAccountResponse.headers);
                }),
                catchError((importErrorResponse) => {
                    this.showSpinner = false;
                    this.errorCode = this.handleImportAccountError(importErrorResponse);
                    return of(null);
                }),
                switchMap((importAccountResponse) => importAccountResponse && this.getAccount(this.accountLocation)),
                tap((account) => {
                    this.errorCode = null;
                    this.aflacAccount = account;
                }),
                switchMap((account) => {
                    this.showSpinner = false;
                    if (account) {
                        this.mpGroup = account.id;
                        let addNewHireObservable;
                        if (this.mpGroup !== null) {
                            addNewHireObservable = this.aflac.addNewHireRule(this.newHireDetails, this.mpGroup);
                        }
                        return addNewHireObservable;
                    }
                }),
                switchMap(() => {
                    const filterParams = {
                        filter: "",
                        search: "",
                        property: "",
                        page: "1",
                        size: "1000",
                        value: "",
                    };
                    return this.accountListService.getListAccounts(filterParams);
                }),
            )
            .subscribe((accountList) => {
                this.showSpinner = false;
                this.handleImportAccountSuccess(accountList);
            });
    }

    /**
     * @description Function to set newhire details before importing
     * @memberof ImportAccountComponent
     */
    setNewHireDetails(): void {
        this.newHireDetails.daysToEnroll = this.stepThreeForm.get("enrollmentPeriod").value;
        this.newHireDetails.coverageStart = this.coverageType;
        if (this.isCoverageStartsDate) {
            this.newHireDetails.daysBeforeCoverageStart = this.stepThreeForm.value.daysBeforeCoverageStart;
        }
        if (this.isCoverageStartsMonth) {
            this.newHireDetails.daysBeforeCoverageStart = this.stepThreeForm.value.monthsBeforeCoverageStart;
        }
    }

    /**
     * @description Function to handle importAccount API success Response
     * @param {AccountListResponse} accountList
     * @memberof ImportAccountComponent
     */
    handleImportAccountSuccess(accountList: AccountListResponse): void {
        accountList.content.forEach((item) => {
            // condition to check whether producers array is empty or not
            const primaryProducer = item.producers.find((producer) => producer.primary);
            if (item.producers && item.producers.length && primaryProducer) {
                item["primaryProducer"] = `${primaryProducer.firstName} ${primaryProducer.lastName}`;
            }
        });
        this.store.dispatch(new AddAccountList(accountList.content));
        this.dialogRef.close();
        this.navigateToAccount();
    }

    /**
     * @description Funtion to handle importAccount API Error
     * @param {HttpErrorResponse} importErrorResponse
     * @memberof ImportAccountComponent
     */
    handleImportAccountError(importErrorResponse: HttpErrorResponse): string {
        let errorMessage: string;
        switch (importErrorResponse.error.status) {
            case AppSettings.API_RESP_400:
            case AppSettings.API_RESP_409:
            case AppSettings.API_RESP_500:
                errorMessage = `errors.importAccount.${importErrorResponse.error.status}.${importErrorResponse.error.code}`;
                break;
            default:
                errorMessage = "errors.importAccount.generic";
        }
        this.accountLocation = BLANK;
        if (errorMessage.endsWith(AppSettings.SELFDUPLICATE)) {
            this.accountLocation = this.getAccountIDfromLocation(importErrorResponse.headers);
            this.getAccount(this.accountLocation)
                .pipe(take(1))
                .subscribe((account) => {
                    this.aflacAccount = account;
                });
        }
        return errorMessage;
    }

    /**
     * @description Function to decide which step to display
     * @param step : number - the current step number
     * @memberof ImportAccountComponent
     */
    goToStep(step: number): void {
        // This prevents jumping from step 1 to step 2 without first searching for an account.
        if (
            this.matStepper.selectedIndex === 0 &&
            step === STEP_ONE &&
            (!this.aflacAccount ||
                (this.errorCode && this.errorCode.includes("getAflacAccount")) ||
                this.situsStateError ||
                this.missingZipError)
        ) {
            this.setFormError();
        } else if (this.matStepper.selectedIndex === STEP_ONE && step === THREE) {
            this.setStepTwoDetails();
            if (this.stepTwoForm.valid) {
                this.matStepper.selectedIndex = TWO;
            }
        } else if (this.data.isGroup && step === STEP_ONE) {
            this.matStepper.selectedIndex = TWO;
            this.matStepper.selected.interacted = false;
            if (step === STEP_ONE && !this.writingNumbers) {
                this.stepTwoForm.reset();
                this.getWritingNumbers();
            }
        } else if (this.checkStepFourCondition(step)) {
            this.matStepper.selectedIndex = STEP_4;
            this.matStepper.selected.interacted = false;
        } else if (this.checkStepFiveCondition(step)) {
            this.matStepper.selectedIndex = STEP_5;
            this.matStepper.selected.interacted = false;
        } else {
            this.matStepper.selectedIndex = step;
            this.matStepper.selected.interacted = false;
            if (step === STEP_ONE && !this.writingNumbers) {
                this.stepTwoForm.reset();
                this.getWritingNumbers();
            }
        }
    }

    /**
     * Function to check if a user can jump from step 1 to step 4
     * @param {number} step
     * @returns {boolean}
     */
    checkStepFourCondition(step: number): boolean {
        return this.matStepper.selectedIndex === 0 && step === STEP_ONE && this.isTaxIdMatched && this.hasAccessToAccount;
    }

    /**
     * Function to check if a user can jump from step 1 to step 5
     * @param {number} step
     * @returns {boolean}
     */
    checkStepFiveCondition(step: number): boolean {
        return this.matStepper.selectedIndex === 0 && step === STEP_ONE && this.isTaxIdMatched && !this.hasAccessToAccount;
    }

    /**
     * @description Function to set appropriate error for form control group number
     * @memberof ImportAccountComponent
     */
    setFormError(): void {
        this.accountSearched = false;
        if (this.stepOneForm.controls.groupNumber.value === BLANK) {
            this.accountSearched = true;
            this.stepOneForm.controls.groupNumber.markAsTouched();
        } else if (this.aflacAccount === undefined || this.aflacAccount === null) {
            this.errorMessage = this.data.isGroup
                ? this.languageStrings["primary.portal.aflacgroup.importaccount.aflacGroupWarning"]
                : this.languageStrings["primary.portal.aflacgroup.importaccount.aflacIndividualWarning"];
        }
        this.aflacAccount = null;
        this.matStepper.selectedIndex = STEP_ZERO;
    }

    /**
     * @description Function to setup Step 2 data
     * @memberof ImportAccountComponent
     */
    setStepTwoDetails(): void {
        if (this.selectedRadioButton === ME) {
            this.stepTwoForm.controls.writingNumberOther.setValue({ valid: true });
            this.stepTwoForm.controls.sitCodeOther.setValue({ valid: true });
        } else {
            this.stepTwoForm.controls.writingNumber.setValue({ valid: true });
            this.stepTwoForm.controls.sitCode.setValue({ valid: true });
        }
        if (this.stepTwoForm.valid) {
            this.showSpinner = true;
            if (this.selectedRadioButton === ME) {
                this.admniSitCode = this.stepTwoForm.controls.sitCode.value;
                this.showSpinner = false;
            } else {
                this.admniSitCode = this.stepTwoForm.controls.sitCodeOther.value;
                this.showSpinner = false;
            }
        }
    }

    /**
     * @description Function to Handle CoverageStart imput field
     * @param {HTMLInputElement} coverageStartTime
     * @memberof ImportAccountComponent
     */
    onClickCoverageStart(coverageStartTime: HTMLInputElement): void {
        if (coverageStartTime.value === CoverageStartType.IMMEDIATELY) {
            this.isCoverageStartsDate = false;
            this.isCoverageStartsMonth = false;
            this.stepThreeForm.get("daysBeforeCoverageStart").disable();
            this.stepThreeForm.get("monthsBeforeCoverageStart").disable();
            this.stepThreeForm.get("daysBeforeCoverageStart").reset();
            this.stepThreeForm.get("monthsBeforeCoverageStart").reset();
            this.coverageType = CoverageStartType.IMMEDIATELY;
        } else if (coverageStartTime.value === CoverageStartType.AFTER_EVENT) {
            this.isAfterEvent = false;
            this.isCoverageStartsDate = true;
            this.isCoverageStartsMonth = false;
            this.stepThreeForm.get("monthsBeforeCoverageStart").reset();
            this.stepThreeForm.get("daysBeforeCoverageStart").enable();
            this.stepThreeForm.get("monthsBeforeCoverageStart").disable();
            this.newHireDetails.daysBeforeCoverageStart = this.stepThreeForm.get("daysBeforeCoverageStart").value;
            this.stepThreeForm.controls["daysBeforeCoverageStart"].setErrors({ required: true });
            this.coverageType = CoverageStartType.AFTER_EVENT;
        } else if (coverageStartTime.value === CoverageStartType.FIRST_OF_THE_MONTH_AFTER_EVENT) {
            this.isAfterEvent = true;
            this.isCoverageStartsDate = false;
            this.isCoverageStartsMonth = true;
            this.stepThreeForm.get("daysBeforeCoverageStart").reset();
            this.stepThreeForm.get("daysBeforeCoverageStart").disable();
            this.stepThreeForm.get("monthsBeforeCoverageStart").enable();
            this.coverageType = CoverageStartType.FIRST_OF_THE_MONTH_AFTER_EVENT;
            this.newHireDetails.daysBeforeCoverageStart = this.stepThreeForm.get("monthsBeforeCoverageStart").value;
            this.stepThreeForm.controls["monthsBeforeCoverageStart"].setErrors({ required: true });
        }
    }

    /**
     * @description Function to get writing number from API
     * @memberof ImportAccountComponent
     */
    getWritingNumbers(): void {
        this.showSpinner = true;
        this.subscriptions.push(
            this.store.select(SharedState.hasPermission(UserPermissionList.ACCOUNTLIST_ROLE_20)).subscribe((response) => {
                this.isRole20 = Boolean(response);
            }),
        );
        this.setStepThreeForm();
        this.aflac
            .getSitCodes(this.companyCode)
            .pipe(take(1))
            .subscribe(
                (writingNumbers) => {
                    this.showSpinner = false;
                    const allSitCodes: SITCode[] = [];
                    writingNumbers.forEach((writingNumber) => {
                        allSitCodes.push(...writingNumber.sitCodes);
                    });
                    this.writingNumbers = writingNumbers;
                    this.sitCodes = allSitCodes;
                    this.errorCode = null;
                    const writingNumberControl = this.stepTwoForm.controls.writingNumber;
                    // Prepopulate dropdown if there is just one value.
                    if (writingNumbers.length === 1) {
                        writingNumberControl.setValue(writingNumbers[0].number);
                    }
                },
                (writingNumbersErrorResponse) => {
                    this.showSpinner = false;
                    this.resetData();
                    this.accountLocation = BLANK;
                    this.errorCode = `getSitCodes.${writingNumbersErrorResponse.error.code}`;
                },
            );
    }

    /**
     * @description Function to set step 3 form
     * @memberof ImportAccountComponent
     */
    setStepThreeForm(): void {
        this.stepThreeForm = this.formBuilder.group({
            enrollmentPeriod: [this.enrollmentPeriodValue, [Validators.required]],
            coverageStartDate: [CoverageStartType.IMMEDIATELY],
            daysBeforeCoverageStart: ["", Validators.required],
            monthsBeforeCoverageStart: ["", Validators.required],
        });
        this.isStepThreeFormValid = true;
        this.disableEnrollmentPeriod();
        this.disableInputField();
    }

    /**
     * @description Function to disable enrollment period
     * @memberof ImportAccountComponent
     */
    disableEnrollmentPeriod(): void {
        if (!this.isRole20) {
            this.stepThreeForm.get("enrollmentPeriod").disable();
        }
    }

    /**
     * @description Function to navigate to account dashboard page
     * @memberof ImportAccountComponent
     */
    navigateToAccount(): void {
        this.router.navigate([`../../../../${this.accountLocation}`, "dashboard"], { relativeTo: this.data.route });
    }

    /**
     * @description Funtion to get Account Id from API Header Response
     * @param {HttpHeaders} headers
     * @returns {string}
     * @memberof ImportAccountComponent
     */
    getAccountIDfromLocation(headers: HttpHeaders): string {
        return headers.get("location").split("?")[0].split("/").slice(-1)[0];
    }

    /**
     * @description Funtion to get sitcode from writing number
     * @param {string} writingNumber
     * @memberof ImportAccountComponent
     */
    getSitCodesfromWritingNumber(writingNumber: string): void {
        const allSitCodes = this.writingNumbers.find((writingNum) => writingNum.number === writingNumber).sitCodes;
        this.sitCodes = allSitCodes;
    }

    /**
     * @description Funtion to get Account by ID
     * @param {string} id
     * @returns {Observable<Accounts>}
     * @memberof ImportAccountComponent
     */
    getAccount(id: string): Observable<Accounts> {
        return this.accountService.getAccount(id);
    }

    /**
     * @description Funtion to reset data
     * @memberof ImportAccountComponent
     */
    resetData(): void {
        if (!this.data.isGroup) {
            this.writingNumbers = null;
            this.sitCodes = null;
        }
        this.aflacAccount = null;
        this.accountSearched = true;
    }

    /**
     * @description Funtion to close popup on cancel
     * @memberof ImportAccountComponent
     */
    onCancelClick(): void {
        this.dialogRef.close();
    }

    /**
     * @description Funtion to handle Step 2 Radio button
     * @param {MatRadioChange} event
     * @memberof ImportAccountComponent
     */
    getRadioValue(event: MatRadioChange): void {
        this.selectedRadioButton = event.value;
        if (event.value === ME) {
            this.getWritingNumbers();
        } else {
            this.searchForm.controls.searchControl.setValue("");
            this.writingNumbers = [];
            this.sitCodes = [];
        }
    }

    /**
     * @description Function to filter accounts by entered value. Since we have to perform many validations it is
     * not possible to address 'Cognitive Complexity' sonar violation for this funtion
     * @private
     * @param {string} value
     * @returns {string[]}
     * @memberof ImportAccountComponent
     */
    private filter(value: string): string[] {
        let filterValue;
        const uniq = {};
        if (value) {
            filterValue = value.toLowerCase();
        }
        let filteredStates = [];
        const temp = [];
        if (value.length === 0) {
            this.writingNumbers = [];
            this.sitCodes = [];
        }
        if (value.length > this.searchLength) {
            this.options.forEach((option) => {
                if (option.name.toLowerCase().includes(filterValue)) {
                    temp.push(option);
                } else {
                    option.wn.filter((el) => {
                        if (el.toLowerCase().includes(filterValue)) {
                            this.wnFlag = true;
                            temp.push(option);
                        }
                    });
                }
            });
            if (!this.wnFlag) {
                filteredStates = temp;
            } else {
                filteredStates = temp.filter((obj) => !uniq[obj.email] && (uniq[obj.email] = true));
            }
            if (filteredStates.length <= 0) {
                this.searchForm.controls.searchControl.setErrors({ incorrect: true });
            }
        }
        return filteredStates;
    }

    /**
     * @description Funtion to get selected subproducer
     * @param {MatAutocompleteSelectedEvent} event
     * @memberof ImportAccountComponent
     */
    selectedSubproducer(event: MatAutocompleteSelectedEvent): void {
        this.writingNumbers = [];
        const writingNo = [];
        this.sitCodes = [];
        const prod = event.option.value;
        const writingNumberControl = this.stepTwoForm.controls.writingNumberOther;

        const id = this.producerSearchList.content.filter((el) => `${el.name.firstName} ${el.name.lastName}` === prod).map((ele) => ele.id);

        this.producerSearchList.content.forEach((pro) => {
            if (pro.id === id[0]) {
                pro.writingNumbers.forEach((wn) => {
                    wn.sitCodes.forEach((sit) => {
                        if (sit.companyCode === this.companyCode && !(writingNo.indexOf(wn) > -1)) {
                            writingNo.push(wn);
                        }
                    });
                });
            }
            this.writingNumbers = writingNo;
        });
        if (this.writingNumbers.length === 1) {
            writingNumberControl.setValue(this.writingNumbers[0].number);
            this.getSitCodeOptions(null, this.writingNumbers[0].number);
        }
    }

    /**
     * @description Function to get sitcode options
     * @param {MatSelectChange} event
     * @param {string} [flag]
     * @memberof ImportAccountComponent
     */
    getSitCodeOptions(event: MatSelectChange, flag?: string): void {
        this.sitCodes = [];
        let wn = "";
        if (flag) {
            wn = flag;
        } else {
            wn = event.value;
        }
        this.producerSearchList.content.forEach((pro) => {
            pro.writingNumbers.forEach((wnum) => {
                if (wnum.number === wn) {
                    wnum.sitCodes.forEach((sit) => {
                        if (sit.companyCode === this.companyCode) {
                            this.sitCodes.push(sit);
                        }
                    });
                }
            });
        });
        const sitCodeControl = this.stepTwoForm.controls.sitCodeOther;
        // Prepopulate dropdown if there is just one value.
        if (this.sitCodes.length === 1) {
            sitCodeControl.setValue(this.sitCodes[0].id);
        }
    }

    /**
     * @description Function to reset step 2 form
     * @memberof ImportAccountComponent
     */
    resetStepTwoForm(): void {
        if (!this.data.isGroup) {
            this.stepTwoForm.reset();
            this.searchForm.reset();
        }
    }

    /**
     * Method to import group account
     * On successfull import close popup and return account number
     */
    importGroupAccount(): void {
        if (this.stepOneForm.valid) {
            this.errorMessage = null;
            if (this.stepOneForm.controls.groupNumber.value === BLANK) {
                this.accountSearched = true;
                this.stepOneForm.controls.groupNumber.markAsTouched();
            } else if (this.aflacAccount === undefined || this.aflacAccount === null) {
                this.errorMessage = this.languageStrings["primary.portal.aflacgroup.importaccount.aflacGroupWarning"];
            } else {
                // service call
                this.importAccountServiceCall(false);
            }
        }
    }

    /**
     * @description Function to import account
     * @param {boolean} isIndividual
     * @memberof ImportAccountComponent
     */
    importAccountServiceCall(isIndividual: boolean): void {
        const groupNumber = this.stepOneForm.controls.groupNumber.value;
        this.mpGroup = this.data.mpGroup;
        this.showSpinner = true;
        this.aflac
            .linkAccount(isIndividual, groupNumber, this.admniSitCode, this.mpGroup.toString())
            .pipe(
                switchMap((res) => this.dashboardService.getAccount(this.mpGroup.toString())),
                tap((accountDetails) => {
                    this.store.dispatch(
                        new AddAccountInfo({
                            accountInfo: accountDetails,
                            mpGroupId: this.mpGroup.toString(),
                        }),
                    );
                }),
                switchMap((res) => {
                    if (!this.data.isGroup) {
                        return this.updateNewHire();
                    }
                    return of(null);
                }),
                filter((res) => this.data.isGroup),
            )
            .subscribe(
                (_linkAccountResponse) => {
                    this.dialogRef.close({ altGroupNumber: groupNumber });
                },
                (linkAccountErrorResponse) => {
                    this.showSpinner = false;
                    this.errorMessage = this.handleLinkAccountError(linkAccountErrorResponse);
                },
            );
    }

    /**
     * @description Funtion to handle linkAccount API Error
     * @param {HttpErrorResponse} linkErrorResponse
     * @returns {string} error_message
     */
    handleLinkAccountError(linkErrorResponse: HttpErrorResponse): string {
        let errorMessage: string;
        switch (linkErrorResponse.error.status) {
            case AppSettings.API_RESP_400:
            case AppSettings.API_RESP_503:
                errorMessage = `primary.portals.accounts.importAccount.errors.linkAccount.
                ${linkErrorResponse.error.status}.${linkErrorResponse.error.code}`;
                break;
            default:
                errorMessage = "primary.portals.accounts.importAccount.errors.linkAccount.generic";
        }
        return this.language.fetchPrimaryLanguageValue(errorMessage);
    }

    /**
     * @description Method to make new hire service call
     * @returns observable of httpResponse of type void
     */
    updateNewHire(): Observable<NewHireRule> {
        return this.aflac.updateNewHireRule(this.hireRulesId, this.newHireDetails, this.mpGroup).pipe(
            tap(
                (response) => {
                    this.showSpinner = false;
                    this.dialogRef.close({ isIndividualLinkSuccess: this.stepOneForm.controls.groupNumber.value });
                },
                (errorResponse) => {
                    this.showSpinner = false;
                    this.errorMessage = errorResponse.error.message;
                },
            ),
        );
    }

    /**
     * @description Function handle Matching Tax ID
     * @memberof ImportAccountComponent
     */
    onNextMatchingTaxId(): void {
        this.isImport = this.linkOption === CREATE;
        this.goToStep(STEP_ONE);
    }

    /**
     * Function to check whether the Logged in producer has access to existing AG account
     * @param {number} mpGroup
     * @returns {ProducerCredential}
     */
    hasAccessOfAccount(mpGroup: number): Observable<ProducerCredential[]> {
        this.showSpinner = true;
        return this.accountService.getAccountProducers(mpGroup.toString());
    }
    /**
     * Method to compare situs state of AI & AG and display error message
     */
    compareSitus(): void {
        if (this.aflacAccount && this.aflacAccount.situs.state.abbreviation !== this.currentAccount.situs.state.abbreviation) {
            this.situsStateError = this.data.isGroup
                ? this.languageStrings["primary.portal.aflacgroup.importaccount.situsMismatchGroup"]
                : this.languageStrings["primary.portal.aflacgroup.importaccount.situsMismatchIndividual"];
            this.stepOneForm.get("groupNumber").setErrors({ situsStateError: true });
        }
    }

    /**
     * @description Implements Angular's OnDestroy Life Cycle hook
     * @memberof ImportAccountComponent
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscribe) => {
            if (subscribe) {
                subscribe.unsubscribe();
            }
        });
        if (this.writingNumberSubscription) {
            this.writingNumberSubscription.unsubscribe();
        }
        if (this.groupNumberSubscription) {
            this.groupNumberSubscription.unsubscribe();
        }
        if (this.subscribObj) {
            this.subscribObj.unsubscribe();
        }
        if (this.prodSearchSubscription) {
            this.prodSearchSubscription.unsubscribe();
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
