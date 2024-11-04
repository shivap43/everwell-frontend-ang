import { FormGroup, FormBuilder, Validators, FormArray, FormControl, ValidatorFn, AbstractControl } from "@angular/forms";
import { Store, Select } from "@ngxs/store";

import {
    EnrollmentState,
    UpdateApplicationResponse,
    UpdateConstraintValues,
    UpdateHashKeys,
    UpdateCartData,
    SharedState,
    EnrollmentMethodState,
    AppFlowService,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";

import { Component, OnInit, Input, AfterContentChecked, OnDestroy, Output, EventEmitter } from "@angular/core";
import { ShoppingCartDisplayService, ShoppingService, InputType, StaticService } from "@empowered/api";
import { Observable, forkJoin, Subject, combineLatest, of } from "rxjs";
import { UserService } from "@empowered/user";
import { LanguageService } from "@empowered/language";
import { takeUntil, map, tap, switchMap, filter } from "rxjs/operators";
import { Router } from "@angular/router";
import {
    Permission,
    ConfigName,
    ResponsePanel,
    BasePlanApplicationPanel,
    CustomSection,
    StepConstraints,
    HashKeys,
    StepData,
    KnockoutData,
    BucketCoverageType,
    HideUnlessConstraint,
    KnockoutType,
    Type,
    Option,
    Question,
    AppSettings,
    EnrollmentMethod,
    RiderCart,
    AddCartItem,
    GetCartItems,
    ProducerCredential,
    ApplicationResponse,
    StepType,
    ContraintsType,
    StepTitle,
} from "@empowered/constants";
import { HttpResponse } from "@angular/common/http";
import { DateService } from "@empowered/date";
import { ViewportScroller } from "@angular/common";

const MINUTE_IN_MILLISECONDS = 60000;
const DECIMALS_TO_RESTRICT = 4;
const DEFAULT_CART_VALUE = 0;
const REPLACE_TEXT = "replace";
const ADV_RN = "ADV_Exter_RN";
const INVALID_STATE = "ME_TPNR_State";
const CONTINGENT_REPLACEMENT_QUESTION = "INSURER NAME AND ADDRESS";
const COMPANY_NAME_ADDRESS = "Company Name & Address #1";
const NAME_INSURER_HOME_OFFICE_LOCATION = "Name of Insurer including Home Office Location #1";
// Below title and form type are defined to identify the step in app flow
// for NY68000 Life product DOB step for child rider as suggested by product team
const DOB_TITLE = "Date of Birth";
const FORM_TYPE = "Supplemental Form";
const REPLACEMENT = "Replacement";
const GI = "GI";
@Component({
    selector: "empowered-question",
    templateUrl: "./question.component.html",
    styleUrls: ["./question.component.scss"],
})
export class QuestionComponent implements OnInit, AfterContentChecked, OnDestroy {
    @Input() planObject: StepData;
    @Input() currentSectionIndex: number;
    @Input() currentStepIndex: number;
    maxAgeAllowedForChild: number;
    minAgeAllowedForChild: number;
    @Input() riderIndex: number;
    @Output() discardReinstateDialog = new EventEmitter();
    planFlowId: number;
    planFlowStepId: number;
    isNotProduction$: Observable<boolean>;
    private readonly unsubscribe$ = new Subject<void>();
    dateType = Type;
    planId: number;
    applications = [];
    stepsData = [];
    currentStep = 0;
    form: FormGroup;
    inputType = InputType;
    itemId: number;
    showError = false;
    appResponse: any;
    knockOutOptions: { question: Question; option: Option }[] = [];
    isKnockout = false;
    isSpouseKnockout = false;
    isChildKnockOut = false;
    validationRegex: any;
    showSpinner = false;
    mpGroup: number;
    memberId: number;
    stepResponses: ResponsePanel[] = [];
    application: BasePlanApplicationPanel;
    todaysDate = new Date();
    inputDate: Date = new Date();
    todayDate: Date = new Date();
    replaceGlossary = AppSettings.REPLACE_GLOSSARY;
    replaceSalary = AppSettings.REPLACE_SALARY;
    phoneMaxLength = AppSettings.PHONE_NUM_MAX_LENGTH;
    salary: string;
    riderCartData: RiderCart;
    cartData: GetCartItems;
    hashKeyValues: HashKeys[];
    basePlanHashKeys: HashKeys[];
    hasAflacAlways = false;
    hasEBSBilling = false;
    fromDirect = false;
    enrollmentMethod: string;
    isArbitrary: boolean;
    isHeadSet: boolean;
    initialsPlaceholder = "Initials";
    customerInitial: string;
    @Select(SharedState.regex) regex$: Observable<any>;
    showPin: boolean;
    phoneFormat = AppSettings.PHONE_FORMAT;
    hasApiError = false;
    pinFlag = false;
    pin: string;
    enterPin: string;
    errorMessage: string;
    sectionToScroll: string;
    readonly QUESTION: string = "QUESTION";
    callCenterPinQuestion: Question;
    applicationQuestionIds: number[] = [];
    updatedAppResponses: ResponsePanel[] = [];
    isTpi = true;
    knockoutDataList: KnockoutData[] = [];
    knockoutHeading: string;
    payFrequency = this.store.selectSnapshot(EnrollmentState.GetPayFrequency);
    isAdditionalContribution = false;
    additionalContributionMaxLimit: number;
    additionalContributionMinLimit: number;
    monthlyContribution: string;
    preExistingAdditionalContributionAmount = 0;
    readonly question: string = "question";
    divId: string;
    readonly enrollmentMethods = EnrollmentMethod;
    constraintValue: StepConstraints;
    policyNumber = "";
    isPolicyPopulated = false;
    policyPrepopulateStatusCheck = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.planOption.next",
        "primary.portal.applicationFlow.planOption.nextAflacAlways",
        "primary.portal.applicationFlow.planOption.nextBilling",
        "primary.portal.applicationFlow.planOption.nextApplications",
        "primary.portal.applicationFlow.debug.planFlow",
        "primary.portal.applicationFlow.debug.planFlowStep",
        "primary.portal.applicationFlow.planOption.discardAndContinue",
        "primary.portal.applicationFlow.payments.enterPin",
        "primary.portal.applicationFlow.bucketPlanFlow.betweenLimit",
        "primary.portal.applicationFlow.bucketPlanFlow.mustBeBetweenLimit",
        "primary.portal.common.requiredField",
        "primary.portal.applicationFlow.nextPreliminaryStatement",
        "primary.portal.applicationFlow.planOption.removeAndContinue",
        "primary.portal.applicationFlow.planOption.removeAndReturnToShop",
    ]);
    languageSecondStringsArray: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.applicationFlow.question.selectionRequired",
        "secondary.portal.applicationFlow.question.invalidFormat",
        "secondary.portal.applicationFlow.question.minimumLength",
        "secondary.portal.applicationFlow.question.cannotExceed",
        "secondary.portal.applicationFlow.question.customerLater",
        "secondary.portal.applicationFlow.question.pastDate",
        "secondary.portal.applicationFlow.question.futureDate",
        "secondary.portal.applicationFlow.demographics.removeSpouse",
        "secondary.portal.applicationFlow.demographics.removeChild",
        "secondary.portal.applicationFlow.knockoutQuestions.knockoutHeading",
        "secondary.portal.applicationFlow.knockoutQuestions.knockoutHeadingSpouse",
        "secondary.portal.applicationFlow.knockoutQuestions.knockoutHeadingChild",
    ]);
    queryString = [
        "input.ng-invalid",
        "mat-radio-group.ng-invalid > mat-radio-button",
        "textarea.ng-invalid, mat-select.ng-invalid",
        "mat-selection-list.ng-invalid > mat-list-option",
    ].join(",");
    spouseKnockoutOption: Option[];
    maxDateForAge: Date;
    restrictionForDateOfBirth: boolean;
    showPreliminaryStatement: boolean;
    selfServiceQuestionKnockOut: string[];
    selfServiceReplacementButtonText = false;
    selfServiceReplacementBtnReturnToShop = false;
    /**
     * inject services
     */
    constructor(
        private readonly fb: FormBuilder,
        private readonly appFlowService: AppFlowService,
        private readonly store: Store,
        private readonly shoppingCartDisplayService: ShoppingCartDisplayService,
        private readonly shoppingService: ShoppingService,
        private readonly userService: UserService,
        private readonly staticService: StaticService,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        private readonly router: Router,
        private readonly staticUtil: StaticUtilService,
        private readonly dateService: DateService,
        private readonly Viewportscroller: ViewportScroller,
    ) {}
    /**
     * on component initialization getting data from store,calling functions and initializing variables
     */
    ngOnInit(): void {
        this.getQuestionIDsForSelfServiceEnrollment();
        this.divId = this.question + this.planObject.index.toString();
        if (this.planObject.currentSection.title === "Additional Contribution") {
            this.isAdditionalContribution = true;
            this.setAdditionalContributionLimits();
        }
        this.cartData = this.getCartDataFromStore();
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        this.hashKeyValues = this.getHashKeyValues();
        this.basePlanHashKeys = this.getBasePlanHashValues();
        this.planId = this.planObject.application.appData.planId;
        this.enterPin = this.languageStrings["primary.portal.applicationFlow.payments.enterPin"];
        this.planFlowStepId = this.planObject.steps[0].id;
        this.riderCartData = this.cartData.riders
            ? this.planObject.application.cartData.riders.length > 0
                ? this.planObject.application.cartData.riders.filter((rider) => rider.planId === this.planId).pop()
                : null
            : null;
        const salaryAmount: number = this.appFlowService.getMemberSalary(this.cartData.coverageEffectiveDate);
        this.salary = salaryAmount ? salaryAmount.toString() : "";
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((regexData) => {
            if (regexData) {
                this.validationRegex = regexData;
            }
        });
        this.applicationQuestionIds = this.appFlowService.getApplicationQuestionIds(this.planObject.application);
        this.checkArbitrary();
        this.checkAflacAlways();
        this.createStepData();
        this.createForm();
        this.hideAndShowQuestions(true);
        this.subscribeToCartData();
        this.planFlowId = this.planObject.application.appData.id;
        this.isNotProduction$ = this.appFlowService.isNotProduction();
        this.appFlowService.showPreliminaryStatementStep$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => (this.showPreliminaryStatement = response));
    }
    /**
     * @description sets the limits for additional contribution amount
     */
    setAdditionalContributionLimits(): void {
        const maxLimit$ = this.staticUtil.cacheConfigValue(ConfigName.ADDITIONAL_CONTRIBUTION_HSA_MAX_LIMIT);
        const minLimit$ = this.staticUtil.cacheConfigValue(ConfigName.ADDITIONAL_CONTRIBUTION_HSA_MIN_LIMIT);
        combineLatest([maxLimit$, minLimit$])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([maxLimit, minLimit]) => {
                this.additionalContributionMaxLimit = +maxLimit;
                this.additionalContributionMinLimit = +minLimit;
            });
    }
    /**
     * @description sets monthly contribution amount.
     * @param questionId {number} the id of the question in consideration
     */
    getMonthlyContribution(questionId: number): void {
        if (this.form.value[questionId].additionalContribution !== "") {
            const totalContributionAmount = (+(
                parseFloat(this.form.value[questionId].additionalContribution) / this.payFrequency.payrollsPerYear
            )).toString();
            this.monthlyContribution = parseFloat(totalContributionAmount).toFixed(DECIMALS_TO_RESTRICT).toString();
        } else {
            this.monthlyContribution = "";
        }
    }
    /**
     * @description checks the min and max limit for the additional contribution amount and sets appropriate errors
     * @param control {FormControl} the form control of the additional contribution input
     * @returns null | {limitError?: boolean, required?: boolean} if error return the validation object else null
     */
    checkMinMaxLimit(control: FormControl): null | { limitError?: boolean; required?: boolean } {
        let validationResult = null;
        if (control.value) {
            if (isNaN(control.value)) {
                validationResult = { required: true };
            }
            if (!(this.additionalContributionMinLimit <= control.value && control.value <= this.additionalContributionMaxLimit)) {
                validationResult = { limitError: true };
            }
        }
        return validationResult;
    }
    /**
     * Hides next section on form data changes.
     */
    hideNextSectionsOnChangeOfForm(): void {
        this.form.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((change) => {
            if (
                this.form.dirty &&
                !this.planObject.rider &&
                (this.planObject.currentSection.sectionId !== this.currentSectionIndex ||
                    this.planObject.currentStep !== this.currentStepIndex)
            ) {
                if (this.planObject.reinstate) {
                    this.appFlowService.updateReinstateActiveStepDetails$.next({
                        currentSectionIndex: this.planObject.currentSection.sectionId,
                        currentStepIndex: this.planObject.currentStep,
                    });
                } else {
                    this.appFlowService.updateActiveStepDetails$.next({
                        currentSectionIndex: this.planObject.currentSection.sectionId,
                        currentStepIndex: this.planObject.currentStep,
                        planObject: this.planObject,
                    });
                }
            }
            if (
                this.form.dirty &&
                this.planObject.rider &&
                (this.planObject.rider.riderIndex !== this.riderIndex ||
                    this.planObject.currentSection.sectionId !== this.currentSectionIndex ||
                    this.planObject.currentStep !== this.currentStepIndex)
            ) {
                this.appFlowService.updateRiderActiveStepDetails$.next({
                    currentRiderIndex: this.planObject.rider.riderIndex,
                    currentSectionIndex: this.planObject.rider.riderSectionIndex,
                    currentStepIndex: this.planObject.rider.riderStepIndex,
                });
            }
        });
    }

    /**
     * Method to update cartData on change of data in store
     */
    subscribeToCartData(): void {
        this.store
            .select((store) => store.enrollment.cartItems)
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((cartItems) => cartItems && cartItems.length > 0),
                map((cartItems) => cartItems.filter((cartItem) => cartItem.id === this.planObject.application.cartData.id).pop()),
                filter((cartData) => cartData),
            )
            .subscribe((cartData: GetCartItems) => {
                this.cartData = this.utilService.copy(cartData);
                this.hashKeyValues = this.getHashKeyValues();
                if (!this.isAdditionalContribution) {
                    this.createForm();
                }
                this.hideAndShowQuestions(true);
            });
    }
    /**
     * gets previous application hash key values from store
     * @returns list of Hash Key data
     */
    getHashKeyValues(): HashKeys[] {
        return this.store
            .selectSnapshot(EnrollmentState.GetHashKeys)
            .filter((resp) => resp.cartItemId !== this.planObject.application.cartData.id);
    }

    /**
     * gets previous application hash key values from store which matches plan flow id
     * @returns list of Hash Key data
     */
    getBasePlanHashValues(): HashKeys[] {
        return this.store
            .selectSnapshot(EnrollmentState.GetHashKeys)
            .filter((resp) => resp.planFlowId === this.planObject.application.appData.id);
    }
    /**
     * This method checks for the Arbitrary value.
     */
    checkArbitrary(): void {
        if (this.planObject && this.planObject.steps) {
            this.planObject.steps.forEach((step) => {
                if (step.question && step.question["placeholderText"] === this.initialsPlaceholder) {
                    this.isArbitrary = true;
                }
            });
        }
        if (this.isArbitrary) {
            combineLatest([this.userService.credential$, this.staticUtil.hasPermission(Permission.HYBRID_USER)])
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(([credential, hybridUserPermission]: [ProducerCredential, boolean]) => {
                    if (credential.producerId) {
                        const enrollment = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
                        if (enrollment) {
                            this.enrollmentMethod = enrollment.enrollmentMethod;
                        }
                        if (this.enrollmentMethod === EnrollmentMethod.HEADSET) {
                            this.isHeadSet = true;
                            this.getConfigurationSpecifications();
                        } else if (this.enrollmentMethod === EnrollmentMethod.VIRTUAL_FACE_TO_FACE) {
                            this.getConfigurationSpecifications();
                        }
                    }
                    if (
                        this.enrollmentMethod === EnrollmentMethod.CALL_CENTER ||
                        this.enrollmentMethod === EnrollmentMethod.PIN_SIGNATURE
                    ) {
                        this.showPin = true;
                    }
                });
        }
    }

    getConfigurationSpecifications(): void {
        forkJoin([this.staticService.getConfigurations("user.enrollment.telephone_initial_placeholder", this.mpGroup)])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => {
                if (data.length && data[0].length) {
                    this.customerInitial = data[0][0].value.split(",")[0];
                }
            });
    }

    /**
     * Method to check next step
     */
    checkAflacAlways(): void {
        this.fromDirect = !!this.store.selectSnapshot(EnrollmentState.GetDirectPayment).length;
        this.hasAflacAlways = !!this.store.selectSnapshot(EnrollmentState.GetAflacAlways)?.length;
        this.hasEBSBilling = this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
    }
    createStepData(): void {
        this.itemId = this.planObject.application.cartData ? this.planObject.application.cartData.id : null;
        const cartId: number = this.planObject.rider ? this.riderCartData.cartItemId : this.itemId;
        // get responses based on cartItemId & planId if not reinstate
        this.appResponse = this.store
            .selectSnapshot(EnrollmentState.GetResponseItems)
            .filter(
                (resp) => resp.application.planId === this.planId && (resp.application.cartItemId === cartId || this.planObject.reinstate),
            )
            .pop();
        this.planObject.steps.forEach((step) => {
            this.stepsData.push({
                step: step,
                showStep: true,
            });
        });
        if (this.appResponse && this.stepsData.length) {
            this.stepResponses = this.appResponse.response.filter((resp) => resp.stepId === this.stepsData[0].step.id);
        }
    }

    /**
     * Method used to initialize the question form.
     */
    createForm(): void {
        this.resetValues();
        this.form = this.fb.group({});
        this.hideNextSectionsOnChangeOfForm();
        this.stepsData.forEach((stepData) => {
            stepData.showStep = this.checkQuestionConstraints(stepData);
            const stepDataCopy = this.utilService.copy(stepData);
            if (
                stepData.step.question.inputType === InputType.CHECKBOX ||
                stepData.step.question.inputType === InputType.RADIO ||
                stepData.step.question.inputType === InputType.SELECT ||
                stepData.step.question.inputType === InputType.MULTISELECT
            ) {
                stepDataCopy.step.question.options.map((option) => {
                    option.showOption = this.checkOptionConstraints(option);
                });
            }
            stepData.step = stepDataCopy.step;
            if (stepData.showStep && stepData.step.question.inputType !== InputType.TEXT) {
                let previousResponse;
                if (stepData.step.question.prepopulateQuestionId) {
                    previousResponse = this.appResponse.response.find(
                        (resp) => resp.planQuestionId === stepData.step.question.prepopulateQuestionId,
                    );
                } else if (this.stepResponses) {
                    previousResponse = this.stepResponses.find((resp) => resp.planQuestionId === stepData.step.question.id);
                }
                const previousValue = this.getPreviousValue(previousResponse, stepData);
                // To restrict the child age for Whole Life NY68000
                // title will be date of birth with input type as date picker and form type would be supplemental
                if (
                    stepData.step.title === FORM_TYPE &&
                    stepData.step.question.inputType === InputType.DATEPICKER &&
                    stepData.step.question.text === DOB_TITLE
                ) {
                    this.restrictionForDateOfBirth = true;
                    this.setAgeRestriction();
                }
                this.form.addControl(
                    stepData.step.question.id,
                    this.addQuestionGroup(stepData.step.question.required, previousValue, stepData.step.question),
                );
                if (this.showPin && stepData.step.question.placeholderText === this.initialsPlaceholder) {
                    stepData.step.question.placeholderText = this.enterPin;
                    this.callCenterPinQuestion = stepData.step.question;
                    this.pin = this.appFlowService.getcallCenterPin();
                    if (this.pin) {
                        this.form.controls[stepData.step.question.id].patchValue({
                            element: this.pin,
                        });
                    }
                    const callCenterPinValue = this.form.controls[stepData.step.question.id].value;
                    if (callCenterPinValue && callCenterPinValue.element && callCenterPinValue.element.length > 0) {
                        this.appFlowService.setcallCenterPin(callCenterPinValue.element);
                        this.form.controls[stepData.step.question.id].disable();
                        this.pinFlag = true;
                    }
                }
            }
        });
    }
    /**
     * Method to get the previous value for a question
     *
     * @param previousResponse
     * @param stepData
     * @returns previous value - could be any type
     */
    private getPreviousValue(previousResponse: any, stepData: any): string | boolean | number {
        let previousValue = null;
        if (previousResponse) {
            previousValue = previousResponse.value;
        } else {
            const previousHashKeyValue = this.hashKeyValues.find((resp) => resp.key === stepData.step.question.key);
            if (
                previousHashKeyValue &&
                ((stepData.step.question.name &&
                    !stepData.step.question.name.includes(REPLACE_TEXT) &&
                    !stepData.step.question.name.includes(ADV_RN)) ||
                    !stepData.step.question.name)
            ) {
                previousValue = previousHashKeyValue.value;
            }
        }
        // previousValue is reassigned in this if block only when the value is not assigned in previous if-else.
        if (!previousValue && this.planObject.reinstate) {
            const previousHashKeyValue = this.basePlanHashKeys.find((resp) => resp.key === stepData.step.question.key);
            if (previousHashKeyValue) {
                previousValue = previousHashKeyValue.value;
            }
        }
        return previousValue;
    }

    /**
     * resets error and knockout values
     */
    resetValues(): void {
        this.isKnockout = false;
        this.isSpouseKnockout = false;
        this.isChildKnockOut = false;
        this.showError = false;
        this.knockoutDataList = [];
        this.selfServiceReplacementButtonText = false;
        this.selfServiceReplacementBtnReturnToShop = false;
    }

    checkQuestionConstraints(stepData: any): boolean {
        return stepData.step.question.constraints.length
            ? this.appResponse
                ? !this.appFlowService.checkAndOrConstraints(
                      stepData.step.question.constraints,
                      this.appResponse.response,
                      AppSettings.OR,
                      this.cartData,
                      this.planObject,
                  )
                : true
            : true;
    }

    checkOptionConstraints(option: any): boolean {
        return option.constraints.length
            ? this.appResponse
                ? !this.appFlowService.checkAndOrConstraints(
                      option.constraints,
                      this.appResponse.response,
                      AppSettings.OR,
                      this.cartData,
                      this.planObject,
                  )
                : true
            : true;
    }

    createCheckBoxGroup(required: boolean, value: any, question: Question): FormGroup {
        let formCheckBoxArray;
        if (required) {
            formCheckBoxArray = this.fb.array([], this.checkBoxValidation.bind(this));
        } else {
            formCheckBoxArray = this.fb.array([]);
        }
        question.options.forEach((option) => {
            if (option.showOption) {
                formCheckBoxArray.push(
                    this.fb.control(value && value.length ? (value[0] ? (value.indexOf(option.value) >= 0 ? true : false) : false) : false),
                );
            }
        });

        return this.fb.group({
            element: formCheckBoxArray,
        });
    }

    /**
     * @description creates the date picker group
     * @param required {boolean} the required value of particular question
     * @param value the value to be set for the form group
     * @param question {Question} the question for which the form group has to be created
     * @returns {FormGroup} the form group created
     */

    createDatePickerGroup(required: boolean, value: any, question: Question): FormGroup {
        let formGroup: FormGroup;
        if (required) {
            formGroup = this.fb.group({
                element: [
                    value && value.length ? this.dateService.toDate(value.length === 1 ? value[0] : value) : "",
                    [Validators.required, question.type === Type.FUTURE ? this.checkFutureDate.bind(this) : this.checkPastDate.bind(this)],
                ],
            });
        } else {
            formGroup = this.fb.group({
                element: [
                    value && value.length ? this.dateService.toDate(value.length === 1 ? value[0] : value) : "",
                    [question.type === Type.FUTURE ? this.checkFutureDate.bind(this) : this.checkPastDate.bind(this)],
                ],
            });
        }
        return formGroup;
    }
    /**
     * @description creates the form group for other groups
     * @param required {boolean} the required value of the particular question
     * @param value the value to be set for the form group
     * @param question {Question} the question for which the form group has to be created
     * @returns {FormGroup} the form group created
     */
    createOtherGroup(required: boolean, value: number[] | string[], question: Question): FormGroup {
        if (
            question.inputType === InputType.SELECT &&
            (!value || !value.length) &&
            question.options &&
            question.options.length &&
            !question.text.includes(CONTINGENT_REPLACEMENT_QUESTION) &&
            !question.text.includes(COMPANY_NAME_ADDRESS) &&
            !question.text.includes(NAME_INSURER_HOME_OFFICE_LOCATION)
        ) {
            value = [question.options[0].value];
        }
        if (question.inputType === InputType.RADIO) {
            this.spouseKnockoutOption = question.options.filter((option) => option.knockoutType === KnockoutType.SPOUSE_KNOCKOUT);
            if (
                this.spouseKnockoutOption &&
                this.spouseKnockoutOption.length &&
                this.spouseKnockoutOption[0] &&
                value &&
                value.length &&
                this.spouseKnockoutOption[0].value === value[0]
            ) {
                this.updatePlanOptions(KnockoutType.SPOUSE_KNOCKOUT);
            }
        }
        return this.createOtherFormGroup(required, value, question);
    }
    /**
     * @description creates the form group for other groups
     * @param required {boolean} the required value of the particular question
     * @param value the value to be set for the form group
     * @param question {Question} the question for which the form group has to be created
     * @returns {FormGroup} the form group created
     */
    createOtherFormGroup(required: boolean, value: number[] | string[], question: Question): FormGroup {
        let formGroup: FormGroup;
        const isVf2f = this.enrollmentMethod === EnrollmentMethod.VIRTUAL_FACE_TO_FACE;
        if (question.placeholderText === this.initialsPlaceholder && (this.isHeadSet || isVf2f)) {
            formGroup = this.fb.group({ element: [null] });
            formGroup.disable();
        } else if (this.showPin && (question.placeholderText === this.initialsPlaceholder || question.placeholderText === this.enterPin)) {
            formGroup = this.fb.group({
                element: [
                    value && value.length ? (value.length === 1 ? value[0] : value) : null,
                    [
                        Validators.required,
                        Validators.maxLength(25),
                        Validators.minLength(3),
                        Validators.pattern(this.validationRegex.ALPHANUMERIC_WITH_UNDERSCORE),
                    ],
                ],
            });
        } else {
            formGroup = this.createNonInitialOtherFormGroup(required, value, question);
        }
        return formGroup;
    }
    /**
     * @description creates the form group for other non initial fields
     * @param required {boolean} the required value of the particular question
     * @param value the value to be set for the form group
     * @param question {Question} the question for which the form group has to be created
     * @returns {FormGroup} the form group created
     */
    createNonInitialOtherFormGroup(required: boolean, value: number[] | string[], question: Question): FormGroup {
        let formGroup: FormGroup;
        let questionFormat: string;
        const isMultiSelect = question.inputType === InputType.MULTISELECT;
        if (question.format && question.placeholderText !== this.initialsPlaceholder) {
            questionFormat = this.updateFormat(question.format);
        } else {
            questionFormat = question.format;
        }
        if (required && question.format) {
            formGroup = this.fb.group({
                element: [
                    this.getValue(value, isMultiSelect),
                    [Validators.required, Validators.pattern(new RegExp(this.validationRegex[questionFormat]))],
                ],
            });
        } else if (!required && question.format) {
            formGroup = this.fb.group({
                element: [this.getValue(value, isMultiSelect), [Validators.pattern(new RegExp(this.validationRegex[questionFormat]))]],
            });
        } else if (required) {
            formGroup = this.fb.group({
                element: [this.getValue(value, isMultiSelect), [Validators.required, this.customValidator(INVALID_STATE)]],
            });
        } else {
            formGroup = this.setFormControlForAdditionalContribution(value, isMultiSelect);
        }
        return formGroup;
    }
    /**
     * @description get the value for field
     * @param value the value to be set for the form group
     * @param isMultiSelect  indicates whether it is a multi select field or not
     * @returns {FormGroup} the form group created
     */
    getValue(value: number[] | string[], isMultiSelect: boolean): string | number | string[] | number[] {
        return value && value.length ? (value.length === 1 && !isMultiSelect ? value[0] : value) : null;
    }

    /**
     * @description creates the form group for multi inputs
     * @param required {boolean} the required value of the particular question
     * @param value the value to be set for the form group
     * @param question {Question} the question for which the form group has to be created
     * @returns {FormGroup} the form group created
     */
    createMultiInputGroup(required: boolean, value: any, question: Question): FormGroup {
        const formMultiInputArray = this.fb.array([]);
        question.inputs.forEach((input, index) => {
            let questionFormat: string;
            if (input.format && input.placeholderText !== this.initialsPlaceholder) {
                questionFormat = this.updateFormat(input.format);
            } else {
                questionFormat = question.format;
            }

            // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
            required && input.format
                ? formMultiInputArray.push(
                      this.fb.control(value && value.length ? value[index] : null, [
                          Validators.required,
                          Validators.pattern(new RegExp(this.validationRegex[questionFormat])),
                      ]),
                  )
                : !required && question.format
                ? formMultiInputArray.push(
                      this.fb.control(value && value.length ? value[index] : null, [
                          Validators.pattern(new RegExp(this.validationRegex[questionFormat])),
                      ]),
                  )
                : required
                ? formMultiInputArray.push(
                      this.fb.control(value && value.length ? value[index] : null, [
                          Validators.required,
                          this.customValidator(INVALID_STATE),
                      ]),
                  )
                : formMultiInputArray.push(this.fb.control(value && value.length ? value[index] : null));
        });

        return this.fb.group({
            element: formMultiInputArray,
        });
    }

    /**
     * This is custom validator function. It validates the form against some restricted value.
     * @param restrictedValue - restricted value of field.
     * @returns validator function
     */
    customValidator(restrictedValue: string): ValidatorFn {
        return (control: AbstractControl): { [key: string]: string | boolean } | null =>
            restrictedValue === control.value ? { required: true } : null;
    }

    /**
     * @description function to set the form control for additional contribution
     * @param value {Array<number> | Array<string>} the value that is to be pre populated
     * @param isMultiSelect indicates whether it is a multi select field or not
     * @returns {FormGroup} the created form group
     */
    setFormControlForAdditionalContribution(value: Array<number> | Array<string>, isMultiSelect: boolean): FormGroup {
        let additionalContributionAmount: Array<number> | Array<string> | number | string = 0;
        if (value && value.length) {
            if (value.length === 1 && !isMultiSelect) {
                additionalContributionAmount = value[0];
            } else {
                additionalContributionAmount = value;
            }
        }
        if (this.isAdditionalContribution) {
            if (value && value.length === 1) {
                this.monthlyContribution = (parseFloat((+value[0]).toString()) / this.payFrequency.payrollsPerYear)
                    .toFixed(DECIMALS_TO_RESTRICT)
                    .toString();
                this.preExistingAdditionalContributionAmount = +this.monthlyContribution;
            }
            return this.fb.group({
                additionalContribution: [additionalContributionAmount, [Validators.required, this.checkMinMaxLimit.bind(this)]],
            });
        }
        return this.fb.group({
            element: [value && value.length ? additionalContributionAmount : null],
        });
    }

    updateFormat(questionFormat: string): string {
        let format = questionFormat;
        if (format === "ALPHA") {
            format = "ALPHA_WITH_SPACES";
        }
        return format;
    }

    /**
     * Method for adding controls for different groups such as radio, input, select, multi inputs.
     * @param required {boolean} the required value of the particular question
     * @param value the value to be set for the form group
     * @param question {Question} the question for which the form group has to be created
     */
    addQuestionGroup(required: boolean, value: any, question: Question): FormGroup {
        let formGroup: FormGroup;
        // FIXME - Need to create control based on question input type
        if (question.inputType === InputType.CHECKBOX) {
            formGroup = this.createCheckBoxGroup(required, value, question);
        } else if (question.inputType === InputType.DATEPICKER && question.type !== Type.ALL) {
            formGroup = this.createDatePickerGroup(required, value, question);
        } else if (question.inputType === InputType.MULTI_INPUT) {
            formGroup = this.createMultiInputGroup(required, value, question);
        } else {
            formGroup = this.createOtherGroup(required, value, question);
        }
        return formGroup;
    }

    // the below method validates the input date to be greater than current date
    checkFutureDate(control: FormControl): any {
        if (control.value) {
            let validationResult = null;
            this.getDates(control);
            if (this.inputDate && this.inputDate < this.todayDate) {
                validationResult = { future: true };
            }
            return validationResult;
        }
    }
    // the below method validates the input date to be greater than current date
    checkPastDate(control: FormControl): any {
        if (control.value) {
            let validationResult = null;
            this.getDates(control);
            if (this.inputDate && this.inputDate > this.todayDate) {
                validationResult = { past: true };
            }
            return validationResult;
        }
    }

    /**
     * Function to set the age restriction for date picker
     * @returns void
     */
    setAgeRestriction(): void {
        this.appFlowService.getAgeLimitForChild$.pipe(takeUntil(this.unsubscribe$)).subscribe((ageLimit) => {
            this.maxDateForAge = new Date(new Date().setFullYear(new Date().getFullYear() - (ageLimit?.maxAge + 1)));
            // setting the date for less than max age of minority with one day before
            // for example - If current date is 7/10/2023 and max age is 17, then we should allow till 17 years 364 days
            this.maxDateForAge.setDate(this.maxDateForAge.getDate() + 1);
            this.todaysDate = this.dateService.subtractDays(new Date(), ageLimit?.minAge);
        });
    }

    getDates(control: FormControl): void {
        const inputDate = this.dateService.toDate(control.value);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        inputDate.setHours(0, 0, 0, 0);
    }

    getShowedOptions(options: Option[]): Option[] {
        return options.filter((option) => option.showOption);
    }

    checkBoxValidation(formArray: FormArray): any {
        const totalSelected = formArray.controls.filter((control) => control.value);
        return totalSelected.length >= 1 ? null : { required: true };
    }

    // TODO: It will be used later during Back functionality
    onBack(): void {
        this.appFlowService.planChanged$.next({
            nextClicked: false,
            discard: false,
        });
    }
    /**
     * function to check validation and save data on click of next
     */
    onNext(): void {
        this.knockOutOptions = [];
        const responses: ApplicationResponse[] = this.getResponses(true);
        this.checkKnockOutData();
        if (!this.isKnockout) {
            if (!this.form.invalid) {
                if (this.callCenterPinQuestion && this.form.controls[this.callCenterPinQuestion.id]) {
                    this.appFlowService.setcallCenterPin(this.form.controls[this.callCenterPinQuestion.id].value.element);
                }
                if (responses.length === 0) {
                    this.appFlowService.onNextClick(this.planObject, this.planObject.currentStep, this.planObject.currentSection.title);
                } else {
                    this.showSpinner = true;
                    this.saveApplicationResponses(responses);
                }
            } else {
                this.showError = true;
            }
        }
    }
    /**
     * saves application responses and updates store
     * @param responses list of responses
     */
    saveApplicationResponses(responses: ApplicationResponse[]): void {
        this.shoppingCartDisplayService
            .saveApplicationResponse(
                this.memberId,
                this.planObject.rider ? this.riderCartData.cartItemId : this.itemId,
                this.mpGroup,
                responses,
            )
            .pipe(
                takeUntil(this.unsubscribe$),
                tap(
                    (resp) => {
                        const bucketResponse: ApplicationResponse = responses
                            .filter(
                                (response) =>
                                    (response.value as string[]).indexOf(BucketCoverageType.SINGLE) >= 0 ||
                                    (response.value as string[]).indexOf(BucketCoverageType.FAMILY) >= 0,
                            )
                            .pop();
                        if (bucketResponse && bucketResponse.value && bucketResponse.value.length) {
                            this.store.dispatch(
                                new UpdateConstraintValues(
                                    ContraintsType.BUCKET_COVERAGE_LEVEL,
                                    bucketResponse.value[0],
                                    this.planObject.application.appData.id,
                                ),
                            );
                            this.appFlowService.updateBucketCoverageLevel$.next(bucketResponse.value[0].toString());
                        }
                        this.showSpinner = false;
                        this.getUpdatedResponses();
                        const hashKeys: HashKeys[] = responses.map((response) => ({
                            key: response.key,
                            value: response.value as string[],
                            planFlowId: this.planObject.application.appData.id,
                            cartItemId: this.planObject.application.cartData.id,
                        }));
                        this.store.dispatch(new UpdateHashKeys(hashKeys));
                    },
                    (error) => {
                        this.showSpinner = false;
                        this.showError = true;
                        this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
                    },
                ),
                switchMap(() => {
                    if (this.isAdditionalContribution && +this.monthlyContribution !== this.preExistingAdditionalContributionAmount) {
                        return this.updateCostInCart();
                    }
                    return of(null);
                }),
            )
            .subscribe();
    }
    /**
     * @description Method to update cost of a plan in cart
     * @returns {Observable<HttpResponse<unknown>>}
     */
    updateCostInCart(): Observable<HttpResponse<unknown>> {
        const cartData: AddCartItem = {
            memberCost: this.monthlyContribution
                ? parseFloat(
                      (
                          +this.monthlyContribution +
                          parseFloat((this.cartData.memberCost - this.preExistingAdditionalContributionAmount).toString())
                      ).toString(),
                  )
                : DEFAULT_CART_VALUE,
            totalCost: this.monthlyContribution
                ? parseFloat(
                      (
                          +this.monthlyContribution +
                          parseFloat((this.cartData.totalCost - this.preExistingAdditionalContributionAmount).toString())
                      ).toString(),
                  )
                : DEFAULT_CART_VALUE,
            dependentAge: this.planObject.application.cartData.dependentAge ? this.planObject.application.cartData.dependentAge : null,
            enrollmentMethod: this.planObject.application.cartData.enrollmentMethod,
            enrollmentState: this.planObject.application.cartData.enrollmentState,
            enrollmentCity: this.planObject.application.cartData?.enrollmentCity,
            planOfferingId: this.planObject.application.cartData.planOffering.id,
            coverageLevelId: this.planObject.application.cartData.coverageLevelId,
            assistingAdminId: this.appFlowService.mapAssistingAdminId(this.planObject.application.cartData.assistingAdminId),
        };
        return this.shoppingService.updateCartItem(this.memberId, this.mpGroup, this.itemId, cartData).pipe(
            tap(
                (response) => {
                    this.showSpinner = false;
                    this.appFlowService.updateCost$.next(
                        parseFloat(
                            (
                                +this.monthlyContribution +
                                (this.cartData.totalCost - this.preExistingAdditionalContributionAmount)
                            ).toString(),
                        )
                            .toFixed(DECIMALS_TO_RESTRICT)
                            .toString(),
                    );
                    this.appFlowService.emitAdditionalContributionAmount(this.monthlyContribution);
                    this.store.dispatch([new UpdateCartData(this.itemId, cartData.planOfferingId)]);
                    this.preExistingAdditionalContributionAmount = +this.monthlyContribution;
                },
                (error) => {
                    this.showSpinner = false;
                    this.hasApiError = true;
                    this.errorMessage = this.languageSecondStringsArray["secondary.portal.common.errorUpdatingCart"];
                },
            ),
        );
    }

    /**
     * This method checks whether default initials is required or not based on enrollment methods.
     * @param placeholderText Placeholder of field
     * @returns condition for default initials
     */
    isDefaultInitialsRequired(placeholderText: string): boolean {
        const isVf2f = this.enrollmentMethod === EnrollmentMethod.VIRTUAL_FACE_TO_FACE;
        const isItInitialPlaceholder = placeholderText === this.initialsPlaceholder;
        return isItInitialPlaceholder && (this.isHeadSet || isVf2f);
    }

    /**
     * This function is used to get response for steps
     * @param onNext is used to determine if this function is called on next button click
     * @returns array of application responses
     */
    getResponses(onNext: boolean): any {
        const responses = [];
        this.stepsData.forEach((stepData) => {
            let value = [];
            if (
                stepData.showStep &&
                (stepData.step.question.inputType === InputType.CHECKBOX ||
                stepData.step.question.inputType === InputType.RADIO ||
                stepData.step.question.inputType === InputType.SELECT ||
                stepData.step.question.inputType === InputType.MULTISELECT
                    ? stepData.step.question.options.length && stepData.step.question.options[0].value
                    : true)
            ) {
                if (stepData.step.question.inputType === InputType.CHECKBOX) {
                    const showedOptions = stepData.step.question.options.filter((option) => option.showOption);
                    this.form.value[stepData.step.question.id].element.forEach((selectedValue, i) => {
                        if (selectedValue) {
                            value.push(showedOptions[i].value);
                            this.addKnockoutOption(showedOptions[i], onNext, stepData.step.question);
                        }
                    });
                } else if (stepData.step.question.inputType === InputType.MULTI_INPUT) {
                    this.form.value[stepData.step.question.id].element.forEach((inputValue: string) => {
                        if (inputValue) {
                            value.push(inputValue);
                        }
                    });
                } else if (stepData.step.question.inputType === InputType.MULTISELECT) {
                    value = this.form.value[stepData.step.question.id].element;
                    if (value && value.length) {
                        value.forEach((option) => {
                            this.addKnockoutOption(option, onNext, stepData.step.question);
                        });
                    }
                } else if (stepData.step.question.inputType === InputType.DATEPICKER) {
                    if (this.form.value[stepData.step.question.id].element) {
                        const date = this.dateService.toDate(this.form.value[stepData.step.question.id].element);
                        const finalDate = this.dateService
                            .toDate(date.getTime() - date.getTimezoneOffset() * MINUTE_IN_MILLISECONDS)
                            .toISOString();
                        value.push(finalDate);
                    }
                } else if (this.isAdditionalContribution) {
                    value.push(this.form.value[stepData.step.question.id].additionalContribution);
                } else {
                    if (
                        this.form.value[stepData.step.question.id] &&
                        this.form.value[stepData.step.question.id].element &&
                        this.form.value[stepData.step.question.id].element !== INVALID_STATE
                    ) {
                        value.push(this.form.value[stepData.step.question.id].element.replace("$", ""));
                    }
                    this.addKnockOutForOther(stepData.step.question, value, onNext);
                }
                if (this.isDefaultInitialsRequired(stepData.step.question.placeholderText)) {
                    value = [];
                    value.push(this.customerInitial);
                }
            }
            const response: ApplicationResponse = {
                stepId: stepData.step.id,
                value: value,
                key: stepData.step.question.key,
                type: ContraintsType.QUESTION,
                planQuestionId: stepData.step.question.id,
            };
            responses.push(response);
        });
        return responses;
    }
    // Adding knock out option for Radio and Select options
    addKnockOutForOther(question: Question, value: string[], onNext: boolean): void {
        if ((question.inputType === InputType.RADIO || question.inputType === InputType.SELECT) && value.length) {
            const selectedOption = question.options.filter((option) => option.value === value[0]);
            if (
                onNext &&
                selectedOption.length &&
                selectedOption[0].knockoutType &&
                selectedOption[0].knockoutType !== KnockoutType.NOT_APPLICABLE
            ) {
                this.knockOutOptions.push({ question: question, option: selectedOption[0] });
            }
        }
    }

    addKnockoutOption(option: Option, onNext: boolean, question: Question): void {
        if (onNext && option.knockoutType && option.knockoutType !== KnockoutType.NOT_APPLICABLE) {
            // TODO Need to add moment and datapie logic after api changes are done
            this.knockOutOptions.push({ question: question, option: option });
        }
    }

    getUpdatedResponses(): void {
        // dispatch is subscribed because this action has to be processed before other events
        this.store
            .dispatch(
                new UpdateApplicationResponse(
                    this.memberId,
                    this.planObject.rider ? this.riderCartData.cartItemId : this.itemId,
                    this.mpGroup,
                ),
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    const cartId: number = this.planObject.rider ? this.riderCartData.cartItemId : this.itemId;
                    // filter responses based on cartItemId & planId if not reinstate
                    this.appResponse = res.enrollment.appResponseItems
                        .filter(
                            (resp) =>
                                resp.application.planId === this.planId &&
                                (resp.application.cartItemId === cartId || this.planObject.reinstate),
                        )
                        .pop();
                    this.checkKnockOutData();
                    const haveKnockoutQuestions = this.planObject.steps.filter((step) => {
                        const question = step.question as Question;
                        return question &&
                            question.options &&
                            question.options.length &&
                            question.options.filter((option) => option.knockoutType === KnockoutType.SPOUSE_KNOCKOUT).pop()
                            ? true
                            : false;
                    });
                    if (this.isSpouseKnockout) {
                        this.updatePlanOptions(KnockoutType.SPOUSE_KNOCKOUT);
                    } else if (haveKnockoutQuestions.length) {
                        this.updatePlanOptions(KnockoutType.NOT_APPLICABLE);
                    }
                    // FIXME add condition for spouse knockout false conditon
                    if (!(this.isKnockout || this.isChildKnockOut)) {
                        this.appFlowService.onNextClick(this.planObject, this.planObject.currentStep, this.planObject.currentSection.title);
                    }
                },
                (error) => {
                    this.hasApiError = true;
                    this.errorMessage = this.languageStrings["secondary.api." + error.status + "." + error.code];
                },
            );
    }

    onKnockOutBack(): void {
        this.resetValues();
        this.scrollToTop();
    }
    /**
     * for checking the knockout data and knockout type
     * @returns void
     */
    checkKnockOutData(): void {
        this.resetValues();
        let heading: string;
        const cartItems = this.store.selectSnapshot(EnrollmentState.GetCartItem);
        const cartItemsLength = cartItems.filter((data) => data.id)?.length;
        for (const knockoutOption of this.knockOutOptions) {
            const knockoutData: KnockoutData = {
                text: knockoutOption.option.knockoutText,
            };
            if (knockoutOption.option.backToStepLink) {
                knockoutData.stepLink = knockoutOption.option.backToStepLink;
                knockoutData.step = knockoutOption.option.backToStepElement;
            }
            if (
                this.selfServiceQuestionKnockOut?.includes(knockoutOption?.question?.id?.toString()) &&
                this.cartData?.enrollmentMethod === EnrollmentMethod.SELF_SERVICE &&
                cartItemsLength === 1
            ) {
                this.selfServiceReplacementBtnReturnToShop = true;
            }
            if (
                this.selfServiceQuestionKnockOut?.includes(knockoutOption?.question?.id?.toString()) &&
                this.cartData?.enrollmentMethod === EnrollmentMethod.SELF_SERVICE &&
                cartItemsLength > 1
            ) {
                this.selfServiceReplacementButtonText = true;
            }
            switch (knockoutOption.option.knockoutType) {
                case KnockoutType.KNOCKOUT:
                    this.isKnockout = true;
                    if (!heading) {
                        heading = this.languageSecondStringsArray["secondary.portal.applicationFlow.knockoutQuestions.knockoutHeading"];
                    }
                    break;
                case KnockoutType.SPOUSE_KNOCKOUT:
                    this.isSpouseKnockout = true;
                    if (!heading) {
                        heading =
                            this.languageSecondStringsArray["secondary.portal.applicationFlow.knockoutQuestions.knockoutHeadingSpouse"];
                    }
                    break;
                case KnockoutType.CHILD_KNOCKOUT:
                    if (!heading) {
                        heading =
                            this.languageSecondStringsArray["secondary.portal.applicationFlow.knockoutQuestions.knockoutHeadingChild"];
                    }
                    this.isChildKnockOut = true;
                    break;
            }
            if (
                !this.knockoutDataList.some((existingKnockoutData) => {
                    if (knockoutData.step && existingKnockoutData.step) {
                        return existingKnockoutData.text === knockoutData.text && existingKnockoutData.step === knockoutData.step;
                    }
                    return existingKnockoutData.text === knockoutData.text;
                })
            ) {
                this.knockoutDataList.push(knockoutData);
            }
        }
        this.knockoutHeading = heading;
        if (this.isKnockout || this.isSpouseKnockout || this.isChildKnockOut) {
            this.scrollToSection(this.getKnockOutId());
        }
    }
    /**
     *@description To get Rider section index number
     *@returns number: rider section index
     */
    getRiderSectionIndex(): number {
        const riderSection: CustomSection = this.application.appData.sections.filter((section) => section.title === StepTitle.RIDERS).pop();
        if (riderSection) {
            return riderSection.sectionId;
        }
        return null;
    }
    /**
     * for handling the functionality of knockout button
     * @returns void
     */
    handleKnockOut(): void {
        if (this.isKnockout) {
            if (!this.planObject.rider) {
                this.appFlowService.discardApplication(this.planObject.application.cartData.id, this.planObject);
            } else {
                this.appFlowService.discardApplication(
                    this.planObject.application.cartData.id,
                    this.planObject,
                    this.riderCartData.cartItemId,
                );
            }
            if (this.planObject.reinstate) {
                this.discardReinstateDialog.emit();
            }
        } else {
            // Route to dependents
            this.router.navigate([`/producer/payroll/${this.mpGroup}/member/${this.memberId}/dependents`]);
        }
    }
    /**
     * handles knockout back to step logic
     * @param knockoutData knockout data to handle
     */
    handleBackToStepLink(knockoutData: KnockoutData): void {
        const applicationPanel: BasePlanApplicationPanel[] = this.store.selectSnapshot(EnrollmentState.GetApplicationPanel);
        applicationPanel.forEach((application) => {
            if (application.cartData.cartItemId === this.planObject.application.cartData.cartItemId) {
                this.application = application;
            }
        });
        if (this.planObject.rider && knockoutData.step === StepType.RIDERS) {
            const rider: number = this.planObject.rider.riderIndex;
            this.application.appData.sections.forEach((section) => {
                section.steps.forEach((customSteps, index) => {
                    customSteps.step.forEach((step) => {
                        if (step.type === knockoutData.step) {
                            document
                                .getElementById(`section_${this.getRiderSectionIndex()}_riders_${rider}_${section.sectionId}_${index}`)
                                .scrollIntoView();
                        }
                    });
                });
            });
        } else if (knockoutData.stepLink.includes(REPLACEMENT)) {
            this.Viewportscroller.scrollToAnchor("replace_existing_insurance");
        } else if (knockoutData.stepLink.includes(GI)) {
            this.Viewportscroller.scrollToAnchor("Aflac_Life_GI");
        } else {
            this.application.appData.sections.forEach((section) => {
                section.steps.forEach((customSteps, index) => {
                    customSteps.step.forEach((step) => {
                        if (step.type === knockoutData.step) {
                            document.getElementById(`section_${section.sectionId}_step_${index}`).scrollIntoView();
                        }
                    });
                });
            });
        }
    }
    /**
     * to get updated responses from current step and previous steps
     * @returns updated response panel
     */
    getUpdatedAppResponses(): ResponsePanel[] {
        this.stepResponses = this.getResponses(false).filter((response) => response.value);
        let previousStepResponses: ResponsePanel[] = [];
        if (this.appResponse) {
            previousStepResponses = this.appResponse.response.filter((resp) => resp.stepId !== this.stepsData[0].step.id);
        }
        return previousStepResponses.concat(this.stepResponses);
    }
    /**
     * logic to hide or show questions based on other question responses
     * @param formCreated indicates if function is called after creating form
     */
    hideAndShowQuestions(formCreated?: boolean): void {
        this.updatedAppResponses = this.getUpdatedAppResponses();
        const stepDataArray = this.stepsData.filter((steps) => steps.step?.question?.readOnly === true);
        stepDataArray.forEach((stepData) => {
            const preselectedOption = stepData.step?.question?.options?.filter((opt) => opt.preselected === true);
            if (preselectedOption?.length) {
                const response = this.updatedAppResponses.find((resp) => resp.planQuestionId === stepData.step?.question?.id);
                response.value = preselectedOption[0].value;
            }
        });
        this.stepsData.forEach((stepData) => {
            let previousResponse;
            if (this.stepResponses) {
                previousResponse = this.stepResponses.filter((resp) => resp.planQuestionId === stepData.step.question.id).pop();
            }
            let previousValue = null;
            if (previousResponse) {
                previousValue = previousResponse.value;
            }
            let showStep = stepData.showStep;
            if (stepData.step && stepData.step.question) {
                showStep = this.checkShowStep(stepData.step.question, showStep);
                const questionShow = this.checkQuestionConstraints(stepData);
                if (showStep && !questionShow) {
                    showStep = false;
                }
            }
            if (
                stepData.step.question.inputType === InputType.CHECKBOX ||
                stepData.step.question.inputType === InputType.RADIO ||
                stepData.step.question.inputType === InputType.SELECT ||
                stepData.step.question.inputType === InputType.MULTISELECT
            ) {
                stepData.step.question.options.map((option) => {
                    option.showOption = this.checkOptionConstraints(option);
                });
            }
            let required = stepData.step.question.required;
            if (stepData.step && stepData.step.question) {
                required = this.checkRequiredConstraint(stepData.step.question, required);
            }
            if (showStep !== stepData.showStep || required !== stepData.step.question.required) {
                stepData.showStep = showStep;
                stepData.step.question.required = required;
                if (!stepData.showStep) {
                    previousValue = null;
                    this.stepResponses.forEach((resp) => {
                        if (resp.planQuestionId === stepData.step.question.id) {
                            resp.value = null;
                        }
                    });
                }
                this.form.removeControl(stepData.step.question.id);
                if (stepData.showStep && stepData.step.question.inputType !== InputType.TEXT) {
                    this.form.addControl(
                        stepData.step.question.id,
                        this.addQuestionGroup(stepData.step.question.required, previousValue, stepData.step.question),
                    );
                }
            }
        });
    }
    /**
     * checks logic for showing or hiding a question/ step
     * @param question Question data
     * @param showStep initial value of showStep
     * @returns if question/ step is to be shown or not
     */
    checkShowStep(question: Question, showStep: boolean): boolean {
        if (question.hideUnlessConstraint && question.hideUnlessConstraint.length) {
            const aloneConstraints = question.hideUnlessConstraint.filter((constraint) => constraint.aloneSatisfies);
            const andConstraints = question.hideUnlessConstraint.filter((constraint) => !constraint.aloneSatisfies);
            showStep = this.checkAloneAndConstraints(aloneConstraints, andConstraints, showStep);
        }
        return showStep;
    }
    /**
     * checks logic for making a question/ step mandatory
     * @param question Question data
     * @param required initial value of required
     * @returns if question/ step is mandatory or not
     */
    checkRequiredConstraint(question: Question, required: boolean): boolean {
        if (question.requiredConstraint && question.requiredConstraint.length) {
            const aloneConstraints = question.requiredConstraint.filter((constraint) => constraint.aloneSatisfies);
            const andConstraints = question.requiredConstraint.filter((constraint) => !constraint.aloneSatisfies);
            required = this.checkAloneAndConstraints(aloneConstraints, andConstraints, required);
        }
        return required;
    }
    /**
     * checks logic for Alone and And constraints
     * @param aloneConstraints alone constraints of question
     * @param andConstraints and constraints of question
     * @param constraintValue initial constraint Value
     * @returns if constraints are passed or not
     */
    checkAloneAndConstraints(
        aloneConstraints: HideUnlessConstraint[],
        andConstraints: HideUnlessConstraint[],
        constraintValue: boolean,
    ): boolean {
        if (aloneConstraints.length) {
            constraintValue = this.checkAloneConstraints(aloneConstraints);
        }
        if (((!constraintValue && aloneConstraints.length) || !aloneConstraints.length) && andConstraints.length) {
            constraintValue = !this.checkAndConstraints(andConstraints);
        }
        return constraintValue;
    }
    /**
     * Checks logic for alone constraints of question
     * @param aloneConstraints alone constraints to check
     * @returns if alone constraints are passed or not
     */
    checkAloneConstraints(aloneConstraints: HideUnlessConstraint[]): boolean {
        let constraintPass = false;
        const filteredConstraints: HideUnlessConstraint[] = aloneConstraints.filter((constraint) =>
            this.applicationQuestionIds.some((questionId) => questionId === constraint.questionId),
        );
        for (const constraint of filteredConstraints) {
            const answered = this.updatedAppResponses.filter((response) => response.planQuestionId === constraint.questionId);
            if (this.checkConstraint(constraint, answered)) {
                constraintPass = true;
                break;
            }
        }
        return constraintPass;
    }
    /**
     * Checks logic for and constraints of question
     * @param andConstraints and constraints to check
     * @returns if and constraints are passed or not
     */
    checkAndConstraints(andConstraints: HideUnlessConstraint[]): boolean {
        let constraintFailed = false;
        const filteredConstraints: HideUnlessConstraint[] = andConstraints.filter((constraint) =>
            this.applicationQuestionIds.some((questionId) => questionId === constraint.questionId),
        );
        if (filteredConstraints.length) {
            for (const constraint of filteredConstraints) {
                const answered = this.updatedAppResponses.filter((response) => response.planQuestionId === constraint.questionId);
                if (!this.checkConstraint(constraint, answered)) {
                    constraintFailed = true;
                    break;
                }
            }
        } else {
            constraintFailed = true;
        }
        return constraintFailed;
    }
    /**
     * checks the logic for each constraint
     * @param constraint constraint data
     * @param answered answered response of question
     * @returns if constraint is passed or not
     */
    checkConstraint(constraint: any, answered: any): boolean {
        let returnVal = false;
        if (answered && answered.length && answered[0].value && answered[0].value.length) {
            returnVal =
                constraint.response === ""
                    ? answered[0].value[0] && answered[0].value[0].length
                    : answered[0].value.indexOf(constraint.response) >= 0;
        }
        return returnVal;
    }
    scrollToTop(): void {
        if (
            this.planObject.rider &&
            document.getElementById(
                // eslint-disable-next-line max-len
                `section_${this.planObject.rider.riderSequenceId}_riders_${this.planObject.rider.riderIndex}_${this.planObject.rider.riderSectionIndex}_${this.planObject.rider.riderStepIndex}`,
            )
        ) {
            document
                .getElementById(
                    // eslint-disable-next-line max-len
                    `section_${this.planObject.rider.riderSequenceId}_riders_${this.planObject.rider.riderIndex}_${this.planObject.rider.riderSectionIndex}_${this.planObject.rider.riderStepIndex}`,
                )
                .scrollIntoView();
        } else if (
            !this.planObject.rider &&
            document.getElementById(`section_${this.planObject.currentSection.sectionId}_step_${this.planObject.currentStep}`)
        ) {
            document
                .getElementById(`section_${this.planObject.currentSection.sectionId}_step_${this.planObject.currentStep}`)
                .scrollIntoView();
        }
    }
    regEx(stringVal: string): any {
        return new RegExp(stringVal, "g");
    }
    updatePlanOptions(type: string): void {
        this.appFlowService.knockoutTrigger(type);
    }
    scrollToSection(id: string): void {
        this.sectionToScroll = id;
    }

    ngAfterContentChecked(): void {
        if (document.getElementById(this.sectionToScroll)) {
            document.getElementById(this.sectionToScroll).scrollIntoView();
            this.sectionToScroll = "";
        }
    }
    /**
     * gets step index id
     * @param stepIndex step index
     * @returns step index id as string
     */
    getStepDataIndex(stepIndex: number): string {
        return `${this.divId}${stepIndex}`;
    }
    getKnockOutId(): string {
        return "knockout" + this.planObject.index.toString();
    }

    numberValidation(event: any): void {
        if (event.type === "keypress" && !(event.keyCode <= 57 && event.keyCode >= 48)) {
            event.preventDefault();
        }
    }
    getCartDataFromStore(): GetCartItems {
        const cartItems = this.store.selectSnapshot(EnrollmentState.GetCartItem);
        if (cartItems && cartItems.length > 0) {
            return cartItems.filter((data) => data.id === this.planObject.application.cartData.id).pop();
        }
        return null;
    }

    getQuestionIDsForSelfServiceEnrollment() {
        this.staticUtil
            .cacheConfigValue(ConfigName.MEMBER_SELFSERVICE_POLICYREPLACE_KNOCKOUTQUESTIONID)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((questionIds) => {
                this.selfServiceQuestionKnockOut = questionIds?.split(",");
            });
    }
    /**
     * unsubscribes/ cleans up before component is destroyed
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
