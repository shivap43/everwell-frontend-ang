import { Component, OnInit, ViewChild, Inject, OnDestroy, ElementRef, DoCheck } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatStepper } from "@angular/material/stepper";
import { FormGroup, FormBuilder, Validators, AbstractControl, FormControl } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import {
    AG_IMPORT_LANG,
    CONTROLS,
    FILTER_PARAMS,
    PROPS,
    PAYLOAD,
    STEPS,
    EXTRACT_CONST,
    NAVIGATION,
    NEW_HIRE,
} from "./ag-import-form.constant";
import {
    AflacService,
    ProducerService,
    AccountService,
    AccountListService,
    CoverageStartType,
    AccountListResponse,
    SearchProducer,
    NewHiredetails,
} from "@empowered/api";
import { UserService } from "@empowered/user";
import { flatMap, take, tap, switchMap, catchError, takeUntil, filter } from "rxjs/operators";
import { HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { AddAccountList, AddGroup, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { of, Observable, Subject } from "rxjs";
import { Store } from "@ngxs/store";
import {
    Permission,
    ClientErrorResponseType,
    ClientErrorResponseDetailCodeType,
    CompanyCode,
    AppSettings,
    AccountProducer,
    ProducerCredential,
    Accounts,
} from "@empowered/constants";

const DEFAULT = "link";
const BAD_DATA = "badData";
const SHARED_CASE = "SHARED_CASE";
const PRODUCER_OPTION_ME = "me";
const BILL_MODE_INDEX = 4;
const FIRST_OF_THE_MONTH_AFTER_EVENT = "FIRST_OF_THE_MONTH_AFTER_EVENT";
const DAYS_BEFORE_COVERAGE_START_AG = 0;
const DAYS_TO_ENROLL_AG = 90;
const DEFAULT_FILTER = "type:CLIENT";

/**
 * This component is used for aflac group account import.
 */
@Component({
    selector: "empowered-ag-import-form",
    templateUrl: "./ag-import-form.component.html",
    styleUrls: ["./ag-import-form.component.scss"],
})
export class AgImportFormComponent implements OnInit, OnDestroy, DoCheck {
    // Stepper ref
    @ViewChild(MatStepper, { static: true }) matStepper: MatStepper;
    // logged in producer id
    producerId: number;
    // controls the step 1.
    stepOneForm: FormGroup;
    // controls step 2
    stepTwoForm: FormGroup;
    // Form Group for link account step.
    linkAccounts: FormGroup;
    // form group for new hire step
    agNewHireForm: FormGroup;
    // flag to check whether step is valid or not.
    isStepOneInValid = false;
    // true -> if account is partially setup.
    isPartialSetup = false;
    // Bad message for AI
    aiBadDataMessage: string;
    // Bad message for AG.
    agBadDataMessage: string;
    // if true -> show spinner. if false -> hide spinner.
    showSpinner = false;
    // holds aflac account ref.
    aflacAccount: Accounts;
    // Already existing account with same AI number.
    duplicateAI: Accounts;
    // true -> no matching found for AI.
    matchingAIError = false;
    // true -> no matching found for AG
    matchingAGError = false;
    // holds Ag group ref.
    aflacGroupNo: Accounts;
    // Already existing account with same AG id.
    duplicateAG: Accounts;
    // imported account
    importedAccount: Accounts;
    // primary producer of single existing AI.
    primaryProducer: AccountProducer[];
    // company code -> helps to get sit code and writing numbers.
    companyCode: CompanyCode;
    // list of producers.
    producerSearchList: SearchProducer[];
    // collection of all accounts which has same tax id.
    duplicateTaxAccountIds: number[] = [];
    // holds path for account. Picked from request header.
    accountLocation: string;
    // already imported account.
    alreadyImportedAccount: Accounts;
    // error codes with messages.
    errorCode: string;
    // flag for duplicate AG.
    isAgAlreadyExist = false;
    // flag for duplicate AI.
    isAiAlreadyExist = false;
    // flag to display tax Id mismatch warning
    taxIdMismatch: boolean;
    // flag to verify if Tax Id should be compared
    taxIdValidationSwitch: boolean;
    // flag to display situs state mismatch error
    situsMismatch: boolean;
    // flag for role 93
    isRole93: boolean;
    // flag to display alert message for Role93
    agRequiredError: boolean;
    // This property used to clear subscription.
    private readonly unsubscribe$: Subject<void> = new Subject();
    // This property holds all localized value of component.
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues(AG_IMPORT_LANG);
    @ViewChild("taxIdAlert") taxIdAlert: ElementRef;
    isTaxAlertAlreadyFocused: boolean;
    missingZip = false;
    forbiddenError = "";
    invalidZipError = false;

    /**
     * constructor of AgImportFormComponent
     * @param dialogRef :- Reference of angular material dialog
     * @param language : Ref of Language service [used to get localized value]
     * @param fb: form builder ref of angular package
     */
    constructor(
        private readonly dialogRef: MatDialogRef<AgImportFormComponent>,
        private readonly language: LanguageService,
        private readonly fb: FormBuilder,
        private readonly aflac: AflacService,
        private readonly producerService: ProducerService,
        private readonly userService: UserService,
        private readonly accountService: AccountService,
        private readonly router: Router,
        private readonly store: Store,
        private readonly accountListService: AccountListService,
        private readonly staticUtilService: StaticUtilService,
        @Inject(MAT_DIALOG_DATA) private readonly data: { route: ActivatedRoute },
    ) {}

    /**
     * Life cycle hook of angular. Called on initialization of component.
     */
    ngOnInit(): void {
        this.constructForm();
        this.getConfig();
        this.checkUserRole();
    }
    /**
     * ng life-cycle hook
     * This method will be called immediately after ngOnChanges() on every change detection run,
     * and immediately after ngOnInit() on the first run.
     *
     * Here this method is used to scroll to tax id alert
     */
    ngDoCheck(): void {
        if (this.taxIdAlert && !this.isTaxAlertAlreadyFocused) {
            this.taxIdAlert.nativeElement.scrollIntoView();
            this.isTaxAlertAlreadyFocused = true;
        }
    }
    /**
     * check if user role id is 93
     */
    checkUserRole(): void {
        this.isRole93 =
            this.store.selectSnapshot(SharedState.hasPermission(Permission.SHARED_CASE_CREATE_ACCOUNT)) &&
            !this.store.selectSnapshot(SharedState.hasPermission(Permission.AFLAC_ACCOUNT_CREATE));
        if (this.isRole93) {
            this.stepOneForm.controls.aflacGroupNumber.setValue(true);
        }
    }
    /**
     * This method will create form for steps.
     */
    constructForm(): void {
        const regex = this.store.selectSnapshot((state) => state.core.regex);
        this.stepOneForm = this.fb.group(
            {
                aflacIndividual: [false],
                aflacGroupNumber: [false],
            },
            {
                validator: Validators.compose([this.customValidator.bind(this)]),
            },
        );

        this.stepTwoForm = this.fb.group({
            producer: [PRODUCER_OPTION_ME],
            teamMember: [""],
            writingNumber: ["", Validators.required],
            sitCode: ["", Validators.required],
            sitCodeHierarchy: [null],
        });
        this.linkAccounts = this.fb.group({
            link: [DEFAULT, Validators.required],
        });
        this.agNewHireForm = this.fb.group({
            enrollmentPeriod: [null, [Validators.required]],
            coverageStartDate: [CoverageStartType.IMMEDIATELY],
            daysBeforeCoverageStart: [{ value: "", disabled: true }],
            monthsBeforeCoverageStart: [{ value: "", disabled: true }],
        });
        this.addControlConditionally(
            CONTROLS.aflacIndividual,
            CONTROLS.accountNumber,
            regex.GROUP_NUMBER,
            PROPS.aflacAccount,
            PROPS.duplicateAI,
            CONTROLS.matchingAIError,
        );
        this.addControlConditionally(
            CONTROLS.aflacGroupNumber,
            CONTROLS.groupNumber,
            regex.AFLAC_GROUP_NUMBER,
            PROPS.aflacGroupNo,
            PROPS.duplicateAG,
            CONTROLS.matchingAGError,
        );
    }
    /**
     * this method will add and remove mat-input[dependent] control depending on checkbox[independentField].
     * [add if checked. remove if unchecked]
     * @param independentField independent form control name.
     * @param dependentField dependent control name.
     * @param regex regular express for field.
     * @param accountRefName account reference name of property.
     * @param duplicateAccountRefName duplicate account reference name of property.
     * @param matchingError matching error reference of property.
     */
    addControlConditionally(
        independentField: string,
        dependentField: string,
        regex: string,
        accountRefName: string,
        duplicateAccountRefName: string,
        matchingError: string,
    ): void {
        this.stepOneForm
            .get(independentField)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((checked: boolean) => {
                if (checked) {
                    const dependentFormCtrl = this.fb.control("", {
                        validators: [Validators.required, Validators.pattern(new RegExp(regex))],
                    });
                    dependentFormCtrl.reset();
                    this.stepOneForm.addControl(dependentField, dependentFormCtrl);
                } else {
                    this.stepOneForm.removeControl(dependentField);
                    this[matchingError] = false;
                    this[accountRefName] = undefined;
                    this[duplicateAccountRefName] = undefined;
                    if (accountRefName === PROPS.aflacGroupNo) {
                        this.isAgAlreadyExist = false;
                    } else {
                        this.isAiAlreadyExist = false;
                    }
                    this.forbiddenError = "";
                }
            });
    }
    /**
     * This is custom validator for stepOneForm.
     * For more details refer [mockups]{@link https://app.moqups.com/G9D3MECfNr/view/page/a1a726ee7}
     * @param control: Ref of stepOneForm
     */
    customValidator(control: AbstractControl): { [key: string]: string } | null {
        const aflacIndividual = control.get(CONTROLS.aflacIndividual);
        const aflacGroupNumber = control.get(CONTROLS.aflacGroupNumber);
        if (!(aflacIndividual.value || aflacGroupNumber.value)) {
            return { checkBoxSelection: CONTROLS.required };
        }
        return null;
    }
    /**
     * This method is used to close Aflac group import popup.
     */
    closePopup(): void {
        this.dialogRef.close();
    }
    /**
     * Helps to get AG Individual account number from backend.
     */
    getAccountNumber(): void {
        const accountNumber = this.stepOneForm.get(CONTROLS.accountNumber);
        accountNumber.markAsTouched({ onlySelf: true });
        if (accountNumber.invalid) {
            return;
        }
        if (accountNumber.value) {
            this.showSpinner = true;
            this.duplicateAI = undefined;
            this.isAiAlreadyExist = false;
            this.taxIdMismatch = false;
            this.situsMismatch = false;
            this.forbiddenError = "";
            this.aflac
                .getAflacAccount(accountNumber.value)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => {
                        const account = response.body;
                        this.aflacAccount = account;
                        if (
                            this.aflacAccount &&
                            this.aflacGroupNo &&
                            this.aflacGroupNo.taxId !== this.aflacAccount.taxId &&
                            this.taxIdValidationSwitch
                        ) {
                            this.isTaxAlertAlreadyFocused = false;
                            this.taxIdMismatch = true;
                        }
                        this.situsMismatch = this.compareSitus();
                        this.showSpinner = false;
                        if (account.daysToEnroll) {
                            this.agNewHireForm.patchValue({ enrollmentPeriod: account.daysToEnroll });
                        }
                        this.companyCode = this.getCompanyCode(account);
                        this.matchingAIError = false;
                        this.stepOneForm.get(CONTROLS.accountNumber).setErrors(null);
                    },
                    (err) => {
                        this.aflacAccount = undefined;
                        this.showSpinner = false;
                        this.commonErrorHandler(
                            err,
                            PROPS.duplicateAI,
                            PROPS.aiBadDataMessage,
                            CONTROLS.matchingAIError,
                            CONTROLS.accountNumber,
                            accountNumber.value,
                        );
                    },
                );
        }
    }
    /**
     * This method takes response header and extracts account id.
     * @returns duplicate account id.
     * @param header - response header.
     */
    getAccountIDfromLocation(headers: HttpHeaders): string {
        return headers
            .get(EXTRACT_CONST.location)
            .split(EXTRACT_CONST.quest)[0]
            .split(EXTRACT_CONST.slash)
            .slice(EXTRACT_CONST.minusOne)[0];
    }
    /**
     * this method handles error scenario for AI and AG both.
     * @param err  - error response of API.
     * @param accountNameRef - property ref for account.
     * @param badMsg - property ref for bad message.
     * @param commonErrorRef - property ref for common error message.
     * @param formCtrlName - form control name of field.
     * @param groupName - searched group name
     */
    commonErrorHandler(
        err: HttpErrorResponse,
        accountNameRef: string,
        badMsg: string,
        commonErrorRef: string,
        formCtrlName: string,
        groupName?: string,
    ): void {
        switch (err.error.code) {
            case ClientErrorResponseType.FORBIDDEN:
                this.stepOneForm.get(formCtrlName).setErrors({ invalid: true });
                if (groupName) {
                    const errors = err.error.message.split(" ");
                    this.forbiddenError = this.languageStrings["primary.portal.importAccount.billModeForbiddenError"]
                        .replace("##billMode##", errors[BILL_MODE_INDEX].toLowerCase())
                        .replace("##accountName##", groupName);
                } else {
                    this.forbiddenError =
                        this.languageStrings["primary.portals.accounts.importAccount.errors.getAflacAccount.403.forbidden"];
                }
                break;
            case BAD_DATA:
                this[badMsg] = this.language.fetchSecondaryLanguageValue(
                    `secondary.api.importAccount.${err.error.status}.${err.error.code}`,
                );
                break;
            case ClientErrorResponseType.SELF_DUPLICATE:
                this.getAccountInfo(err, accountNameRef, formCtrlName, commonErrorRef);
                break;
            case ClientErrorResponseType.DUPLICATE:
                if (formCtrlName === CONTROLS.groupNumber) {
                    this.isAgAlreadyExist = true;
                } else {
                    this.isAiAlreadyExist = true;
                }
                this.getAccountInfo(err, accountNameRef, formCtrlName, commonErrorRef);
                break;
            case ClientErrorResponseType.INVALID_STATE:
                if (err.error.details[0].field === ClientErrorResponseDetailCodeType.ZIP_CODE) {
                    this.missingZip = true;
                } else {
                    this.isPartialSetup = true;
                }
                break;
            case ClientErrorResponseType.INVALID_ZIP:
                this.invalidZipError = true;
                break;
            case ClientErrorResponseType.INVALID_APPLICATION_STATE:
                this.stepOneForm.get(formCtrlName).setErrors({ invalidApplicationState: true });
                break;
            default: {
                const commonError = {};
                commonError[commonErrorRef] = true;
                this.stepOneForm.get(formCtrlName).setErrors(commonError);
                break;
            }
        }
    }

    /**
     * Method to get account information
     * @param err  - error response of API.
     * @param accountNameRef - property ref for account.
     * @param formCtrlName - form control name of field.
     * @param commonErrorRef - property ref for common error message.
     */
    getAccountInfo(err: HttpErrorResponse, accountNameRef: string, formCtrlName: string, commonErrorRef: string): void {
        if (err.headers.get(EXTRACT_CONST.location)) {
            const accountLocation = this.getAccountIDfromLocation(err.headers);
            if (accountLocation) {
                this.showSpinner = true;
                this.accountService
                    .getAccount(accountLocation)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (account) => {
                            this[accountNameRef] = account;
                            this.showSpinner = false;
                        },
                        (error) => {
                            this.showSpinner = false;
                            this.stepOneForm.get(formCtrlName).setErrors({ [commonErrorRef]: true });
                        },
                    );
            }
        }
    }

    /**
     * Helps to get Ag group number from backend.
     */
    getGroupNumber(): void {
        this.agRequiredError = false;
        const groupNumber = this.stepOneForm.get(CONTROLS.groupNumber);
        groupNumber.markAsTouched({ onlySelf: true });
        if (groupNumber.invalid) {
            return;
        }
        if (groupNumber.value) {
            this.showSpinner = true;
            this.duplicateAG = undefined;
            this.isAgAlreadyExist = false;
            this.matchingAGError = false;
            this.isPartialSetup = false;
            this.taxIdMismatch = false;
            this.situsMismatch = false;
            this.missingZip = false;
            this.invalidZipError = false;
            this.forbiddenError = "";
            this.aflac
                .getAflacGroup(groupNumber.value)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => {
                        const aflacGroup = response.body;
                        this.aflacGroupNo = aflacGroup;
                        if (
                            this.aflacAccount &&
                            this.aflacGroupNo &&
                            this.aflacGroupNo.taxId !== this.aflacAccount.taxId &&
                            this.taxIdValidationSwitch
                        ) {
                            this.isTaxAlertAlreadyFocused = false;
                            this.taxIdMismatch = true;
                        }
                        this.situsMismatch = this.compareSitus();
                        this.showSpinner = false;
                        this.companyCode = this.getCompanyCode(aflacGroup);
                        this.matchingAGError = false;
                        this.stepOneForm.get(CONTROLS.groupNumber).setErrors(null);
                    },
                    (err) => {
                        this.aflacGroupNo = undefined;
                        this.showSpinner = false;
                        this.commonErrorHandler(
                            err,
                            PROPS.duplicateAG,
                            PROPS.agBadDataMessage,
                            CONTROLS.matchingAGError,
                            CONTROLS.groupNumber,
                        );
                    },
                );
        }
    }
    /**
     * this method will help to get company code.
     * @param account the searched account
     * @returns company code of the account
     */
    getCompanyCode(account: Accounts): CompanyCode {
        if (account.companyCode && account.companyCode === CompanyCode.NY) {
            return CompanyCode.NY;
        }
        return CompanyCode.US;
    }
    /**
     * validate step and show validation messages if step is invalid.
     */
    validateStep(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((controlName) => {
            const control = formGroup.get(controlName);
            if (control instanceof FormControl && control.enabled) {
                control.markAsTouched({ onlySelf: true });
            }
        });
    }
    /**
     * This method will be called, if user tries to proceed for next step.
     * @param stepGroupName stepNumber
     * @param stepValidFlag flag to determine if form valid
     * @param nextIndex index number
     */
    onNext(stepGroupName: string, stepValidFlag: string, nextIndex: number): void {
        this.agRequiredError = false;
        if (this.isRole93 && !this.stepOneForm.controls.groupNumber.value && this.aflacAccount) {
            this.agRequiredError = true;
            return;
        }
        if (!this.situsMismatch && !this.missingZip) {
            const formValues = this.stepOneForm.value;
            const stepFormGroup: FormGroup = this[stepGroupName];
            if (stepFormGroup.invalid) {
                this.validateStep(stepFormGroup);
                this[stepValidFlag] = true;
                return;
            }
            if (!this.aflacAccount && formValues.aflacIndividual && formValues.accountNumber) {
                this.matchingAIError = true;
            }
            if (!this.aflacGroupNo && formValues.aflacGroupNumber && formValues.groupNumber) {
                this.matchingAGError = true;
            }
            if (this.matchingAIError || this.matchingAGError) {
                return;
            }
            if (this.aflacGroupNo && this.aflacGroupNo.importType === SHARED_CASE && !this.aflacAccount) {
                return;
            }
            this.getSubordinates();
        }
    }
    /**
     * link AG to AI.
     */
    linkIndividual(): void {
        const linkRadio = this.linkAccounts.get(DEFAULT).value;
        if (linkRadio === DEFAULT) {
            this.showSpinner = true;
            let individualAccount: number;
            if (
                this.aflacGroupNo &&
                this.aflacGroupNo.taxMatchedIndividualAccounts &&
                this.aflacGroupNo.taxMatchedIndividualAccounts.accessibleAccounts &&
                this.aflacGroupNo.taxMatchedIndividualAccounts.accessibleAccounts.length &&
                this.aflacGroupNo.taxMatchedIndividualAccounts.accessibleAccounts[0].accountId
            ) {
                individualAccount = this.aflacGroupNo.taxMatchedIndividualAccounts.accessibleAccounts[0].accountId;
            } else if (
                !this.aflacGroupNo &&
                this.aflacGroupNo.taxMatchedAflacGroupAccount &&
                this.aflacGroupNo.taxMatchedAflacGroupAccount.accessibleAccount &&
                this.aflacGroupNo.taxMatchedAflacGroupAccount.accessibleAccount.accountId
            ) {
                individualAccount = this.aflacAccount.taxMatchedAflacGroupAccount.accessibleAccount.accountId;
            } else {
                this.matStepper.selectedIndex = STEPS.FOUR;
            }
            this.router
                .navigate([`${individualAccount}${NAVIGATION.carriers}`], {
                    relativeTo: this.data.route,
                })
                .then(() => {
                    this.dialogRef.close();
                    this.showSpinner = false;
                });
        } else {
            this.matStepper.selectedIndex = STEPS.FOUR;
        }
    }
    /**
     * this method will decide upcoming step.
     */
    getNextStep(): void {
        if (this.aflacGroupNo && this.aflacAccount && this.aflacGroupNo.taxId === this.aflacAccount.taxId) {
            this.matStepper.selectedIndex = STEPS.FOUR;
            return;
        }
        if (
            this.aflacGroupNo &&
            this.aflacGroupNo.taxMatchedIndividualAccounts &&
            this.aflacGroupNo.taxMatchedIndividualAccounts.accessibleAccounts &&
            this.aflacGroupNo.taxMatchedIndividualAccounts.accessibleAccounts.length
        ) {
            this.duplicateTaxAccountIds = this.aflacGroupNo.taxMatchedIndividualAccounts.accessibleAccounts.map(
                (account) => account.accountId,
            );
            this.matStepper.selectedIndex = STEPS.THREE;
        } else if (
            !this.aflacGroupNo &&
            this.aflacAccount &&
            this.aflacAccount.taxMatchedAflacGroupAccount &&
            this.aflacAccount.taxMatchedAflacGroupAccount.accessibleAccount
        ) {
            this.duplicateTaxAccountIds = [this.aflacAccount.taxMatchedAflacGroupAccount.accessibleAccount.accountId];
            this.matStepper.selectedIndex = this.duplicateTaxAccountIds.length ? STEPS.THREE : STEPS.FOUR;
        } else if (
            (this.aflacGroupNo &&
                this.aflacGroupNo.taxMatchedIndividualAccounts &&
                this.aflacGroupNo.taxMatchedIndividualAccounts.inaccessibleAccountsFound) ||
            (this.aflacAccount &&
                this.aflacAccount.taxMatchedAflacGroupAccount &&
                this.aflacAccount.taxMatchedAflacGroupAccount.inaccessibleAccountFound)
        ) {
            this.duplicateTaxAccountIds = [];
            this.matStepper.selectedIndex = STEPS.THREE;
        } else {
            this.matStepper.selectedIndex = STEPS.FOUR;
        }
    }
    /**
     * this method will fetch reporting subordinates.
     */
    getSubordinates(): void {
        if (this.duplicateAI || this.duplicateAG) {
            return;
        }
        this.primaryProducer = [];
        this.duplicateTaxAccountIds = [];
        this.showSpinner = true;
        this.userService.credential$
            .pipe(
                takeUntil(this.unsubscribe$),
                flatMap((credential: ProducerCredential) => {
                    this.producerId = credential.producerId;
                    const params = {
                        supervisorProducerId: credential.producerId,
                    };
                    return this.producerService.producerSearch(params);
                }),
            )
            .subscribe(
                (response) => {
                    this.producerSearchList = response.content ? response.content : [];
                    this.showSpinner = false;
                    this.getNextStep();
                },
                (err) => {
                    this.showSpinner = false;
                },
            );
    }
    /**
     * This method will be called on click of next of step second.
     * @param nextStep index of upcoming step.
     */
    onNextOfStepSecond(nextStep: number): void {
        if (this.stepTwoForm.invalid) {
            this.validateStep(this.stepTwoForm);
            return;
        }
        this.matStepper.selectedIndex = nextStep;
    }
    /**
     * Checks form is valid or not then allow user.
     * if valid then allows user to import account.
     * @param stepForm form group of current step.
     */
    onImport(stepForm: FormGroup): void {
        const stepOneFormValue = this.stepOneForm.value;
        if (stepForm.invalid) {
            this.validateStep(stepForm);
            return;
        }
        if (stepOneFormValue.groupNumber && stepOneFormValue.accountNumber) {
            this.importAiWithAg();
        } else if (stepOneFormValue.accountNumber) {
            this.importAiOnly();
        } else if (stepOneFormValue.groupNumber) {
            this.importAgOnly();
        }
    }
    /**
     * Navigate to dashboard
     * @param url to navigate to particular route
     */
    navigateTo(url: string): void {
        this.showSpinner = true;
        this.store.dispatch(new AddGroup(this[PROPS.duplicateAG]));
        this.router
            .navigate([url], {
                relativeTo: this.data.route,
            })
            .then(() => {
                this.dialogRef.close();
                this.showSpinner = false;
            });
    }
    /**
     * Handling import error response for different error status.
     * @param importErrorResponse - Error response
     * @returns Observable of null
     */
    importErrorHandler(importErrorResponse: HttpErrorResponse): Observable<null> {
        switch (importErrorResponse.error.status) {
            case AppSettings.API_RESP_400:
            case AppSettings.API_RESP_409:
            case AppSettings.API_RESP_403:
            case AppSettings.API_RESP_500:
                this.errorCode = `errors.importAccount.${importErrorResponse.error.status}.${importErrorResponse.error.code}`;
                break;
            default:
                this.errorCode = "errors.importAccount.generic";
        }
        this.accountLocation = "";
        if (this.errorCode.endsWith(AppSettings.SELFDUPLICATE)) {
            this.accountLocation = this.getAccountIDfromLocation(importErrorResponse.headers);
            this.accountService
                .getAccount(this.accountLocation)
                .pipe(take(1))
                .subscribe(
                    (account) => {
                        this.alreadyImportedAccount = account;
                        this.importedAccount = account;
                    },
                    (error) => {
                        this.showSpinner = false;
                    },
                );
        }
        if (this.errorCode.endsWith(AppSettings.DUPLICATE)) {
            this.alreadyImportedAccount = undefined;
        }
        return of(null);
    }
    /**
     * navigate to dashboard of account once import is done.
     */
    navigateToAccount(): void {
        this.showSpinner = true;
        this.importedAccount.employeeCount = 0;
        this.importedAccount.productsCount = 0;
        this.store.dispatch(new AddGroup(this.importedAccount));
        this.router.navigate([this.accountLocation, NAVIGATION.dashboard], { relativeTo: this.data.route }).then(() => {
            this.dialogRef.close();
            this.showSpinner = false;
        });
    }

    /**
     * import the account.
     * @param payload { [key: string]: string } it refers to partial request data e.g {accountNumber: 710034}
     * @returns Observable of Accounts
     */
    importAccount(payload: { [key: string]: string }): Observable<Accounts> {
        this.showSpinner = true;
        this.errorCode = null;
        const stepTwoFormValue = this.stepTwoForm.value;
        const requestPayload = {
            adminSitCodeId: stepTwoFormValue.sitCode,
            ...payload,
        };
        return this.aflac.importAccount(requestPayload).pipe(
            take(1),
            tap((importAccountResponse) => {
                this.accountLocation = this.getAccountIDfromLocation(importAccountResponse.headers);
            }),
            catchError((importErrorResponse) => {
                this.showSpinner = false;
                return this.importErrorHandler(importErrorResponse);
            }),
            switchMap((importAccountResponse) => importAccountResponse && this.accountService.getAccount(this.accountLocation)),
            catchError((accountErrorResponse) => {
                this.showSpinner = false;
                return this.importErrorHandler(accountErrorResponse);
            }),
            tap((account) => {
                this.errorCode = null;
                this.importedAccount = account;
            }),
        );
    }
    /**
     * generate new hire request payload.
     * @returns request payload for new hire.
     */
    getNewHireReq(): NewHiredetails {
        const hireFormValue = this.agNewHireForm.getRawValue();
        const hireRequest = {
            daysToEnroll: hireFormValue.enrollmentPeriod,
            coverageStart: hireFormValue.coverageStartDate,
        };
        if (hireFormValue.daysBeforeCoverageStart) {
            hireRequest[NEW_HIRE.daysBeforeCoverageStart] = hireFormValue.daysBeforeCoverageStart;
        }
        if (hireFormValue.monthsBeforeCoverageStart) {
            hireRequest[NEW_HIRE.daysBeforeCoverageStart] = hireFormValue.monthsBeforeCoverageStart;
        }
        return hireRequest;
    }
    /**
     * common response handler for import Ai only, Ag only and Ai+AG only.
     * @param accountList used to update update list of account.
     */
    responseHandler(accountList: AccountListResponse): void {
        accountList.content.forEach((item) => {
            this.showSpinner = false;
            const primaryProducers = item.producers.filter((producer) => producer.primary === true);
            if (item.producers !== undefined && item.producers.length > 0 && primaryProducers.length > 0) {
                item[PAYLOAD.primaryProducer] = `${primaryProducers[0].firstName} ${primaryProducers[0].lastName}`;
            }
        });
        this.store.dispatch(new AddAccountList(accountList.content));
        this.navigateToAccount();
    }
    /**
     * This method helps to import Ai only.
     */
    importAiOnly(): void {
        this.alreadyImportedAccount = undefined;
        const stepOneFormValue = this.stepOneForm.value;
        if (stepOneFormValue.accountNumber) {
            this.importAccount({ accountNumber: stepOneFormValue.accountNumber })
                .pipe(
                    switchMap((account) => {
                        if (account) {
                            return this.aflac.addNewHireRule(this.getNewHireReq(), account.id);
                        }
                        return undefined;
                    }),
                    switchMap(() => {
                        FILTER_PARAMS.filter = `producers.id:${this.producerId}|${DEFAULT_FILTER}`;
                        return this.accountListService.getListAccounts(FILTER_PARAMS);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe((accountList: AccountListResponse) => {
                    this.responseHandler(accountList);
                });
        }
    }

    /**
     * This method import Ag account.
     */
    importAgOnly(): void {
        this.alreadyImportedAccount = undefined;
        const stepOneFormValue = this.stepOneForm.value;
        if (stepOneFormValue.groupNumber) {
            FILTER_PARAMS.filter = `producers.id:${this.producerId}|${DEFAULT_FILTER}`;
            this.importAccount({ aflacGroupNumber: stepOneFormValue.groupNumber })
                .pipe(
                    filter((res) => res !== null),
                    switchMap((res) => this.aflac.addNewHireRule(this.getNewHireReqAGOnly(), res.id)),
                    switchMap((res) => this.accountListService.getListAccounts(FILTER_PARAMS)),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe((accountList: AccountListResponse) => {
                    this.responseHandler(accountList);
                });
        }
    }
    /**
     * Method to get new hire rules for AG only account
     */
    getNewHireReqAGOnly(): NewHiredetails {
        return {
            coverageStart: FIRST_OF_THE_MONTH_AFTER_EVENT,
            daysBeforeCoverageStart: DAYS_BEFORE_COVERAGE_START_AG,
            daysToEnroll: DAYS_TO_ENROLL_AG,
        };
    }
    /**
     * This method import Ai account and links with AG.
     */
    importAiWithAg(): void {
        this.alreadyImportedAccount = undefined;
        const stepOneFormValue = this.stepOneForm.value;
        let accountId: number;
        this.importAccount({ accountNumber: stepOneFormValue.accountNumber })
            .pipe(
                tap((account) => {
                    accountId = account.id;
                }),
                filter(() => accountId !== undefined),
                switchMap(() => this.aflac.addNewHireRule(this.getNewHireReq(), accountId)),
                switchMap(() =>
                    this.aflac.linkAccount(false, stepOneFormValue.groupNumber, this.stepTwoForm.value.sitCode, accountId.toString()),
                ),
                switchMap(() => {
                    FILTER_PARAMS.filter = `producers.id:${this.producerId}|${DEFAULT_FILTER}`;
                    return this.accountListService.getListAccounts(FILTER_PARAMS);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((accountList: AccountListResponse) => {
                this.responseHandler(accountList);
            });
    }

    /**
     * Method to get tax Id comparition flag from config
     */
    getConfig(): void {
        this.staticUtilService
            .cacheConfigValue("general.aflac_groups.shared_accounts.tax_id_valiation_message.enable")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.taxIdValidationSwitch = resp && resp.toLowerCase() === AppSettings.TRUE.toLowerCase();
            });
    }

    /**
     * Method to compare situs state of AI & AG and display error message
     * @returns {boolean} returns true on match of situs state else returns false
     */
    compareSitus(): boolean {
        return (
            this.aflacAccount &&
            this.aflacGroupNo &&
            this.aflacAccount.situs.state.abbreviation !== this.aflacGroupNo.situs.state.abbreviation
        );
    }
    /**
     * Life cycle hook for angular.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
