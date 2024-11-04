import { AflacBusinessService } from "@empowered/api-service";
import { Component, OnInit, ViewChild, OnDestroy, Inject } from "@angular/core";
import { Validators, FormBuilder, FormGroup } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatStepper } from "@angular/material/stepper";
import { AddGroup, AddAccountList, SharedState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { Router, ActivatedRoute } from "@angular/router";
import {
    AflacService,
    AccountService,
    AccountListService,
    ProducerService,
    InputResponseValidationFormat,
    CoverageStartType,
    NewHiredetails,
} from "@empowered/api";
import { HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Store, Select } from "@ngxs/store";
import { Subscription, Observable, of, Subject } from "rxjs";
import { take, startWith, map, tap, catchError, switchMap, filter, takeUntil } from "rxjs/operators";
import { UserService } from "@empowered/user";
import {
    ClientErrorResponseCode,
    ClientErrorResponseType,
    PaginationConstants,
    CompanyCode,
    SITCode,
    WritingNumber,
    AppSettings,
    Accounts,
} from "@empowered/constants";
import { EXTRACT_CONST } from "../ag-import-form/ag-import-form.constant";

const BLANK = "";
const IMPORT_ACCOUNT = 2;
const BILL_MODE_INDEX = 4;
const WRITING_NUMBER = "Writing Number";

@Component({
    selector: "empowered-import-account-form",
    templateUrl: "./import-account-form.component.html",
    styleUrls: ["./import-account-form.component.scss"],
})
export class ImportAccountFormComponent implements OnInit, OnDestroy {
    @ViewChild(MatStepper, { static: true }) matStepper: MatStepper;
    stepOneForm: FormGroup;
    stepTwoForm: FormGroup;
    stepThreeForm: FormGroup;
    enableSitCodeHierarchy: boolean;
    isCoverageStartsDate = false;
    isCoverageStartsMonth = false;
    isAfterEvent = true;
    isFirstOfTheMonethAfter = true;
    mpGroup: number;
    NUMBER_REGEX = new RegExp(InputResponseValidationFormat.NUMERIC);
    coverageType = CoverageStartType.IMMEDIATELY;
    accountSearched = true;
    showSpinner = false;
    aflacAccount: Accounts;
    companyCode: CompanyCode;
    newHireDetails: NewHiredetails = {
        coverageStart: "",
        daysToEnroll: 0,
    };
    sitCodes: SITCode[];
    writingNumbers: WritingNumber[];
    accountLocation: string;
    errorCode: string;
    adminSitCode: number;
    errorMessage: string;
    badData = "badData";
    sitCodeHierarchy = "sitCodeHierarchy";
    sitCodeHierarchyOther = "sitCodeHierarchyOther";
    enrollmentPeriodValue = 30;
    importAccountLanguagePath = "primary.portals.accounts.importAccount";
    primaryPortalCommonPath = "primary.portal.common";
    primaryPortalProducer = "primary.portal.producerFilter";
    aflacErrorMessage: string;
    forbiddenError = "";
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
        "primary.portals.accounts.importAccount.about.NASSA.infoPart2",
        "primary.portals.accounts.importAccount.about.NASSA.infoPart1",
        "primary.portals.accounts.importAccount.NASSA.email",
        "primary.portals.accounts.importAccount.NASSA.email.subject",
        "primary.portals.accounts.importAccount.errors.searchFirst",
        "primary.portals.accounts.importAccount.about.precallWorksheet.link",
        "primary.portals.accounts.importAccount.about.NASSA.link",
        "primary.portal.producerFilter.me",
        "primary.portal.producerFilter.someonefromMyteam",
        "primary.portal.producerFilter.searchbyProducer",
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
        "primary.portal.commissionSplit.addUpdate.column.sitCode",
        "primary.portal.commissionSplit.addUpdate.noHierarchyError",
        "primary.portal.commissionSplit.addUpdate.column.producer",
        "primary.portal.commissionSplit.addUpdate.column.level",
        "primary.portal.commissionSplit.addUpdate.column.writingNumber",
        "primary.portal.importAccount.billModeForbiddenError",
        "primary.portal.accounts.primaryProducer",
    ]);
    @Select(SharedState.regex) regex$: Observable<any>;
    GROUPNUMBER: string;
    MemberInfo: any;
    producerSearchList: any;
    options = [];
    filteredOptions: Observable<string[]>;
    searchLength = 2;
    me = "me";
    SITCodeHierarchyList = "";
    selectedRadioButton = this.me;
    searchForm: FormGroup;
    subordinateFlag = false;
    wnFlag = false;
    isStepThreeFormValid = false;
    inlineErrorCodePattern = AppSettings.IMPORT_ACCOUNT_INLINE_ERROR_CODE_PATTERN;
    isSelfDuplicate = false;
    serviceUnavailableErrorMessage: string;
    invalidWritingNumberResponse: boolean;
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly dialogRef: MatDialogRef<ImportAccountFormComponent>,
        private readonly router: Router,
        private readonly aflac: AflacService,
        private readonly accountService: AccountService,
        private readonly accountListService: AccountListService,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly producerService: ProducerService,
        private readonly userService: UserService,
        private readonly staticUtilService: StaticUtilService,
        private readonly aflacBusinessService: AflacBusinessService,
        @Inject(MAT_DIALOG_DATA) private readonly data: { route: ActivatedRoute },
        private readonly utilService: UtilService,
    ) {}
    /**
     * Fetches config and regex validation,Set form data.
     * @memberof ImportAccountFormComponent
     */
    ngOnInit(): void {
        this.staticUtilService
            .cacheConfigEnabled("general.enable.sit_code.hierarchy")
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((enableSitCodeHierarchy) => {
                    this.enableSitCodeHierarchy = enableSitCodeHierarchy;
                }),
            )
            .subscribe();
        this.regex$.pipe(take(2)).subscribe((data) => {
            if (data) {
                this.GROUPNUMBER = data.GROUP_NUMBER;
                this.constructForm();
            }
        });
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        // This changes SIT codes according to the selected writing number.
        this.setSitCodeValue();
        // This is so as not to show errors/info on input
        this.stepOneForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
            this.resetData();
            this.accountLocation = BLANK;
            this.errorCode = BLANK;
            this.isSelfDuplicate = false;
        });
        this.userService.credential$.pipe(take(1)).subscribe((response) => {
            this.MemberInfo = response;
        });
        const params = {
            supervisorProducerId: this.MemberInfo.producerId,
        };
        this.producerService
            .producerSearch(params)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
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
                        name: ele.name.firstName + " " + ele.name.lastName,
                        email: ele.email,
                        wn: wn,
                    });
                });
            });
    }
    /**
     * This changes SIT codes according to the selected writing number
     */
    setSitCodeValue(): void {
        this.stepTwoForm.controls.writingNumber.valueChanges
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((selectedWritingNumber) => selectedWritingNumber && this.selectedRadioButton === this.me),
                tap((response) => {
                    this.getSitCodesFromWritingNumber(response);
                }),
                filter(() => this.sitCodes.length === 1),
                switchMap(() => {
                    const sitCode = this.sitCodes[0].id;
                    this.stepTwoForm.controls.sitCode.setValue(sitCode);
                    if (sitCode && this.enableSitCodeHierarchy) {
                        this.showSpinner = true;
                        return this.aflacBusinessService.getSitCodeHierarchy(sitCode);
                    }
                    return undefined;
                }),
            )
            .subscribe((SITCodeHierarchyList) => {
                this.stepTwoForm.get(this.sitCodeHierarchy).setValue(SITCodeHierarchyList);
                this.showSpinner = false;
            });
    }
    /**
     * Sets the forms for step 1 and 2 in import account popup
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
                sitCodeHierarchy: [null],
                writingNumberOther: [null, Validators.required],
                sitCodeOther: [null, Validators.required],
                sitCodeHierarchyOther: [null],
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

    disableInputField(): void {
        this.stepThreeForm.get("daysBeforeCoverageStart").disable();
        this.stepThreeForm.get("monthsBeforeCoverageStart").disable();
    }

    numberValidation(event: KeyboardEvent): void {
        if (event.type === "keypress" && !(event.key.toString().charCodeAt(0) <= 57 && event.key.toString().charCodeAt(0) >= 48)) {
            event.preventDefault();
        }
    }

    /**
     * get the aflac account and set error messages based on the error status
     * Called during step 1 and 2.
     */
    searchAccountbyGroupNumber(): void {
        const adminSicNumber =
            this.stepTwoForm.controls.sitCode.value || this.stepTwoForm.controls.sitCodeOther.value ? this.adminSitCode : null;
        if (!adminSicNumber) {
            this.resetData();
            this.accountLocation = BLANK;
        }
        this.showSpinner = true;
        this.errorMessage = "";
        this.forbiddenError = "";
        this.aflac
            .getAflacAccount(this.stepOneForm.controls.groupNumber.value, null, adminSicNumber)
            .pipe(take(1))
            .subscribe(
                (getAflacAccountResponse) => {
                    this.aflacErrorMessage = null;
                    this.showSpinner = false;
                    if (!adminSicNumber) {
                        this.accountSearched = true;
                        if (getAflacAccountResponse.status === AppSettings.API_RESP_200) {
                            if (getAflacAccountResponse.body.daysToEnroll) {
                                this.enrollmentPeriodValue = getAflacAccountResponse.body.daysToEnroll;
                            }

                            const account = getAflacAccountResponse.body;
                            this.aflacAccount = account;
                            this.companyCode = account.companyCode
                                ? account.companyCode === CompanyCode.NY
                                    ? CompanyCode.NY
                                    : CompanyCode.US
                                : CompanyCode.US;
                            this.errorCode = null;
                        }
                    } else if (adminSicNumber && this.stepTwoForm.valid) {
                        this.matStepper.selectedIndex = IMPORT_ACCOUNT;
                    }
                },
                (getAflacErrorResponse: HttpErrorResponse) => {
                    this.accountSearched = true;
                    this.showSpinner = false;
                    if (getAflacErrorResponse.error.code === this.badData) {
                        this.errorMessage = this.language.fetchSecondaryLanguageValue(
                            "secondary.api.importAccount." + getAflacErrorResponse.error.status + "." + getAflacErrorResponse.error.code,
                        );
                    }
                    switch (getAflacErrorResponse.error.status) {
                        case ClientErrorResponseCode.RESP_403:
                            this.handleGetAflacAccountForbiddenError(getAflacErrorResponse);
                            break;
                        case ClientErrorResponseCode.RESP_400:
                        case ClientErrorResponseCode.RESP_404:
                            this.stepOneForm.controls.groupNumber.setErrors({ invalid: true });
                        // eslint-disable-next-line no-fallthrough
                        case ClientErrorResponseCode.RESP_409:
                            // eslint-disable-next-line max-len
                            this.errorCode = `errors.getAflacAccount.${getAflacErrorResponse.error.status}.${getAflacErrorResponse.error.code}`;
                            if (
                                this.errorCode.endsWith(ClientErrorResponseType.SELF_DUPLICATE) ||
                                this.errorCode.endsWith(`.${ClientErrorResponseType.DUPLICATE}`)
                            ) {
                                this.isSelfDuplicate = true;
                                if (getAflacErrorResponse.headers.get(EXTRACT_CONST.location)) {
                                    this.accountLocation = this.getAccountIDfromLocation(getAflacErrorResponse.headers);
                                    this.showSpinner = true;
                                    this.getAccount(this.accountLocation)
                                        .pipe(take(1))
                                        .subscribe(
                                            (account) => {
                                                this.showSpinner = false;
                                                this.aflacAccount = account;
                                            },
                                            () => (this.showSpinner = false),
                                        );
                                }
                            }
                            if (this.errorCode.endsWith(`.${AppSettings.DUPLICATE}`)) {
                                if (this.accountLocation) {
                                    this.stepOneForm.controls.groupNumber.setErrors({ duplicate: true });
                                } else {
                                    this.stepOneForm.controls.groupNumber.setErrors({ invalid: true });
                                }
                            }
                            if (this.errorCode.endsWith(ClientErrorResponseType.INVALID_ZIP)) {
                                this.stepOneForm.controls.groupNumber.setErrors({ invalidZipError: true });
                            }
                            break;
                        case AppSettings.API_RESP_503:
                            if (adminSicNumber) {
                                this.aflacErrorMessage = getAflacErrorResponse.error.message;
                            } else {
                                this.errorCode = "errors.getAflacAccount.generic";
                                this.serviceUnavailableErrorMessage = getAflacErrorResponse.error.message;
                            }
                            break;
                        default:
                            this.errorCode = "errors.getAflacAccount.generic";
                    }
                    if (this.matStepper.selectedIndex === 0) {
                        this.resetData();
                    }
                },
            );
    }

    /**
     * Check step and mark appropriate form controls as invalid to show error.
     * @param forbiddenErrorResponse response from GetAflacAccount API
     */
    handleGetAflacAccountForbiddenError(forbiddenErrorResponse: HttpErrorResponse): void {
        if (this.matStepper.selectedIndex === 0) {
            this.stepOneForm.controls.groupNumber.setErrors({ invalid: true });
            const errors = forbiddenErrorResponse.error.message.split(" ");
            this.forbiddenError = this.languageStrings["primary.portal.importAccount.billModeForbiddenError"]
                .replace("##billMode##", errors[BILL_MODE_INDEX].toLowerCase())
                .replace("##accountName##", this.stepOneForm.controls.groupNumber.value);
        } else {
            this.invalidWritingNumberResponse = forbiddenErrorResponse.error.message.includes(WRITING_NUMBER);
            this.stepTwoForm.controls[this.selectedRadioButton === this.me ? "writingNumber" : "writingNumberOther"].setErrors({
                invalid: true,
            });
        }
    }

    onClickImport(): void {
        if (this.stepThreeForm.valid) {
            this.importAccount();
        }
    }
    /**
     * @description this function is used to import account
     * @memberof ImportAccountComponent
     */
    importAccount(): void {
        this.showSpinner = true;
        this.newHireDetails.daysToEnroll = this.stepThreeForm.get("enrollmentPeriod").value;
        this.newHireDetails.coverageStart = this.coverageType;
        if (this.isCoverageStartsDate) {
            this.newHireDetails.daysBeforeCoverageStart = this.stepThreeForm.value.daysBeforeCoverageStart;
        }
        if (this.isCoverageStartsMonth) {
            this.newHireDetails.daysBeforeCoverageStart = this.stepThreeForm.value.monthsBeforeCoverageStart;
        }
        this.aflac
            .importAccount({
                accountNumber: this.stepOneForm.controls.groupNumber.value,
                adminSitCodeId: this.adminSitCode,
            })
            .pipe(
                take(1),
                tap((importAccountResponse) => {
                    this.accountLocation = this.getAccountIDfromLocation(importAccountResponse.headers);
                }),
                catchError((importErrorResponse) => {
                    this.showSpinner = false;
                    switch (importErrorResponse.error.status) {
                        case AppSettings.API_RESP_400:
                        case AppSettings.API_RESP_409:
                        case AppSettings.API_RESP_500:
                            this.errorCode = `errors.importAccount.${importErrorResponse.error.status}.${importErrorResponse.error.code}`;
                            break;
                        default:
                            this.errorCode = "errors.importAccount.generic";
                    }
                    this.accountLocation = BLANK;
                    if (this.errorCode.endsWith(AppSettings.SELFDUPLICATE)) {
                        this.accountLocation = this.getAccountIDfromLocation(importErrorResponse.headers);
                        this.getAccount(this.accountLocation)
                            .pipe(take(1))
                            .subscribe((account) => {
                                this.aflacAccount = account;
                            });
                    }
                    return of(null);
                }),
                switchMap((importAccountResponse) => importAccountResponse && this.getAccount(this.accountLocation)),
                tap((account) => {
                    this.errorCode = null;
                    this.aflacAccount = account;
                }),
                switchMap((account) => {
                    if (account) {
                        this.mpGroup = account.id;
                        let addNewHireObservable;
                        if (this.mpGroup !== null) {
                            addNewHireObservable = this.aflac.addNewHireRule(this.newHireDetails, this.mpGroup);
                        }
                        return addNewHireObservable;
                    }
                    return of(null);
                }),
                switchMap(() => {
                    const producerFilter = `producers.id:${this.MemberInfo.producerId}`;
                    const filterParams = {
                        filter: producerFilter,
                        search: "",
                        property: "",
                        page: PaginationConstants.PAGE,
                        size: PaginationConstants.SIZE,
                        value: "",
                    };
                    return this.accountListService.listAccounts(filterParams);
                }),
            )
            .subscribe((accountList: any) => {
                const importedAccount: Accounts = this.utilService.copy(this.aflacAccount);
                importedAccount.employeeCount = 0;
                importedAccount.productsCount = 0;
                this.store.dispatch(new AddGroup(importedAccount));
                accountList.content.map((item) => {
                    // condition to check whether producers array is empty or not
                    this.showSpinner = false;
                    if (
                        item.producers !== undefined &&
                        item.producers.length > 0 &&
                        item.producers.filter((producer) => producer.primary === true).length > 0
                    ) {
                        item["primaryProducer"] =
                            item.producers.filter((producer) => producer.primary === true)[0].firstName +
                            " " +
                            item.producers.filter((producer) => producer.primary === true)[0].lastName;
                    }
                });
                this.store.dispatch(new AddAccountList(accountList));
                this.navigateToAccount();
            });
    }

    goToStep(step: number): void {
        // This prevents jumping from step 1 to step 2 without first searching for an account.
        if (
            this.matStepper.selectedIndex === 0 &&
            step === 1 &&
            (!this.aflacAccount || (this.errorCode && this.errorCode.includes("getAflacAccount")))
        ) {
            this.accountSearched = false;
            if (this.stepOneForm.controls.groupNumber.value === BLANK) {
                this.accountSearched = true;
                this.stepOneForm.controls.groupNumber.markAsTouched();
            }
            this.aflacAccount = null;
            this.matStepper.selectedIndex = 0;
        } else if (this.matStepper.selectedIndex === 1 && step === 3) {
            this.setStepTwoDetails();
        } else {
            this.matStepper.selectedIndex = step;
            this.matStepper.selected.interacted = false;
            if (step === 1 && !this.writingNumbers) {
                this.stepTwoForm.reset();
                this.getWritingNumbers();
            }
        }
    }

    setStepTwoDetails(): void {
        if (this.selectedRadioButton === this.me) {
            this.stepTwoForm.controls.writingNumberOther.setValue({ valid: true });
            this.stepTwoForm.controls.sitCodeOther.setValue({ valid: true });
        } else {
            this.stepTwoForm.controls.writingNumber.setValue({ valid: true });
            this.stepTwoForm.controls.sitCode.setValue({ valid: true });
        }
        if (this.stepTwoForm.valid) {
            this.showSpinner = true;
            if (this.selectedRadioButton === this.me) {
                this.adminSitCode = this.stepTwoForm.controls.sitCode.value;
                this.showSpinner = false;
            } else {
                this.adminSitCode = this.stepTwoForm.controls.sitCodeOther.value;
                this.showSpinner = false;
            }
            this.searchAccountbyGroupNumber();
        }
    }

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

    getWritingNumbers(): void {
        this.showSpinner = true;
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

    setStepThreeForm(): void {
        this.stepThreeForm = this.formBuilder.group({
            enrollmentPeriod: [this.enrollmentPeriodValue, [Validators.required]],
            coverageStartDate: [CoverageStartType.IMMEDIATELY],
            daysBeforeCoverageStart: ["", Validators.required],
            monthsBeforeCoverageStart: ["", Validators.required],
        });
        this.isStepThreeFormValid = true;
        this.disableInputField();
    }

    navigateToAccount(): void {
        this.aflacAccount.employeeCount = 0;
        this.aflacAccount.productsCount = 0;
        this.store.dispatch(new AddGroup(this.aflacAccount));
        this.router.navigate([this.accountLocation, "dashboard"], { relativeTo: this.data.route }).then(() => {
            this.dialogRef.close();
        });
    }
    /**
     * returns the location based on the header
     * @param headers http header of the api response
     * @returns {string} the location from the header
     */
    getAccountIDfromLocation(headers: HttpHeaders): string {
        return headers.get("location").split("?")[0].split("/").slice(-1)[0];
    }
    /**
     * Get the SIT codes for the selected writing number
     * @param writingNumber selected writing number
     */
    getSitCodesFromWritingNumber(writingNumber: string): void {
        const allSitCodes = this.writingNumbers.find((writingNum) => writingNum.number === writingNumber).sitCodes;
        this.sitCodes = allSitCodes;
    }
    getAccount(id: string): Observable<Accounts> {
        return this.accountService.getAccount(id);
    }
    resetData(): void {
        this.writingNumbers = null;
        this.sitCodes = null;
        this.aflacAccount = null;
        this.accountSearched = true;
    }

    onCancelClick(): void {
        this.dialogRef.close();
    }
    getRadioValue(event: any): void {
        this.selectedRadioButton = event.value;
        if (event.value === "me") {
            this.getWritingNumbers();
        } else {
            this.searchForm.controls.searchControl.setValue("");
            this.writingNumbers = [];
            this.sitCodes = [];
        }
    }
    private filter(value: string): string[] {
        let filterValue;
        const uniq = {};

        if (value) {
            filterValue = value.toLowerCase();
        }
        let filteredStates;
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
        } else {
            filteredStates = [];
        }
        return filteredStates;
    }
    selectedSubproducer(event: any): void {
        this.writingNumbers = [];
        const writingNo = [];
        this.sitCodes = [];
        const prod = event.value;
        const writingNumberControl = this.stepTwoForm.controls.writingNumberOther;

        const id = this.producerSearchList.content.filter((el) => el.name.firstName + " " + el.name.lastName === prod).map((ele) => ele.id);

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
            this.getSitCodeOptions(this.writingNumbers[0].number, "fromMethod");
        }
    }
    getSitCodeOptions(event: any, flag: string): void {
        this.sitCodes = [];
        let wn = "";
        if (flag === "fromMethod") {
            wn = event;
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
            this.loadSitCodeHierarchy(this.sitCodes[0].id, this.sitCodeHierarchyOther);
        }
    }
    resetStepTwoForm(): void {
        this.stepTwoForm.reset();
        this.searchForm.reset();
    }
    /**
     * Set SIT code hierarchy value for the tooltip
     * @param sitCode is SIT code number
     * @param sitCodeListControl control to set sit code hierarchy
     * @memberof ImportAccountFormComponent
     */
    loadSitCodeHierarchy(sitCode: number, sitCodeListControl: string): void {
        if (sitCode && this.enableSitCodeHierarchy) {
            this.showSpinner = true;
            this.aflacBusinessService
                .getSitCodeHierarchy(sitCode)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    tap((SITCodeHierarchyList) => {
                        this.stepTwoForm.get(sitCodeListControl).setValue(SITCodeHierarchyList);
                        this.showSpinner = false;
                    }),
                )
                .subscribe();
        }
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
