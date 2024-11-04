import { switchMap, tap, map, catchError, filter, takeUntil, take, finalize } from "rxjs/operators";

import {
    EnrollmentState,
    UpdateApplicationResponse,
    SharedState,
    RegexDataType,
    AppFlowService,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";

import { ClientErrorResponseCode } from "@empowered/constants";
import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { FormGroup, FormBuilder, Validators, AbstractControl } from "@angular/forms";
import { MatDialogConfig, MatDialog } from "@angular/material/dialog";
import { MatSelectChange } from "@angular/material/select";
import { MemberService, ShoppingCartDisplayService, StaticService } from "@empowered/api";
import { Select, Store } from "@ngxs/store";
import { forkJoin, Subscription, Observable, EMPTY, of, Subject, combineLatest, defer, iif } from "rxjs";
import { LanguageService } from "@empowered/language";

import {
    ConfigName,
    CarrierId,
    ProductId,
    ResponsePanel,
    ActiveStepDetails,
    BeneficiaryType,
    BeneficiaryModel,
    Name,
    ContactType,
    RiderCart,
    PolicyOwnershipType,
    BeneficiaryTypes,
    MemberBeneficiary,
    ApplicationResponse,
    MemberProfile,
    MemberDependent,
    MemberContact,
    StepType,
} from "@empowered/constants";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { TitleCasePipe } from "@angular/common";
import deepEqual from "fast-deep-equal";
import { BeneficiaryMissingInfoComponent, CustomValidation, BeneficiaryAddComponent } from "@empowered/ui";
import { EmpoweredSheetService } from "@empowered/common-services";

interface BeneficiaryMapModel {
    id: number;
    percent: number;
    type: string;
    relationshipToInsured?: string;
}

interface BeneficiaryFormMap {
    formName: string;
    selection: BeneficiaryModel;
}

const MAX_PERCENT = 100;
const PRIMARY_BENEFICIARY_TYPE = "Primary";
const ON_SUBMIT = "Submit";
const RELATIONSHIP_TO_INSURED = "relationshipToInsured";
const RELATIONSHIP_TO_PROPOSED_INSURED = "relationshipToProposedInsured";
const CONTROLS = "controls";
const VALUE = "value";
const RELATIONSHIP_TO_INSURED_MAX_LENGTH_DEFAULT = 20;
const SELF = "Self";
const SEVEN = 7;
const BENEFICIARY_FORM = "BeneficiaryForm";
const CHARITY = "CHARITY";

@Component({
    selector: "empowered-beneficiary",
    templateUrl: "./beneficiary.component.html",
    styleUrls: ["./beneficiary.component.scss"],
})
export class BeneficiaryComponent implements OnInit, OnDestroy {
    @Input() planObject;
    @Input() currentSectionIndex: number;
    @Input() currentStepIndex: number;

    planFlowId: number;
    planFlowStepId: number;
    isNotProduction$: Observable<boolean>;
    planId: number;
    beneficiaryCount = 1;
    beneficiaryTypes: string[] = [BeneficiaryTypes.PRIMARY, BeneficiaryTypes.SECONDARY];
    beneficiaryForms: FormGroup;
    selectedBeneficiaries: string[] = [];
    totalBeneficiary = 1;
    beneficiaryOptions: BeneficiaryModel[] = [];
    memberBeneficiaries: MemberBeneficiary[] = [];
    beneficiaryNameMap: BeneficiaryFormMap[] = [];
    beneficiaryToBePrepopulate = [];
    showSpinner = true;
    applicationResponsesChecked = false;
    beneficiarySelections: (BeneficiaryModel | MemberBeneficiary)[] = [];
    previousSelection: BeneficiaryModel | MemberBeneficiary;
    beneficiaryIds = [];
    primaryPercent = 0;
    secondaryPercent = 0;
    beneficiaryPrimaryLimit = 2;
    beneficiarySecondaryLimit = 2;
    primaryLimit = 0;
    secondaryLimit = 0;
    primaryLimitError = false;
    secondaryLimitError = false;
    primaryPercentError = false;
    secondaryPercentError = false;
    primaryError = false;
    beneficiaryTypeMap = [];
    beneficiaries = [];
    subscriptions: Subscription[] = [];
    hasError = false;
    errorMessage: string;
    cartId: number;
    stepId: number;
    direction: string;
    mpGroup: number;
    memberId: number;
    showContent = false;
    controlName: string;
    selectionIndex: number;
    deepBeneficiaryName = [];
    estateId: number;
    estate = "ESTATE";
    myEstate = "My estate";
    estateCreated: boolean;
    hasAflacAlways = false;
    fromDirect = false;
    hasEBSBilling = false;
    isAGPlan: boolean;
    memberDependents: MemberDependent[] = [];
    beneficiaryLimitNote = "";
    showAddBeneficiary = true;
    //  to check beneficiary type config value is primary or not
    isPrimaryBeneficiaryType$: Observable<boolean> = this.staticUtilService
        .cacheConfigValue(ConfigName.BENEFICIARY_TYPE_ALLOWED)
        .pipe(map((config) => config === "PRIMARY"));
    isMissingInfoCalled = false;
    memberInfo: MemberProfile;
    memberContactInfo: MemberContact[];
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    selectedBeneficiaryName: string;
    latestBeneficiarySelection: BeneficiaryModel;
    beneficiaryCreated: boolean;
    estateBeneficiaryFormControlName: string;

    // juvenile related variables
    insuredJuvenileDependentID: number;
    isJuvenilePlan = false;
    juvenileProposedInsuredName = {} as Name;
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    relationshipToInsuredValue: string;
    relationshipToInsuredMaxLength = RELATIONSHIP_TO_INSURED_MAX_LENGTH_DEFAULT;

    // flag to indicate whether CR MON-63034 changes are enabled
    relationshipToInsuredEnabled: boolean;
    nameWithSpacesAllowedRegex: string;

    /**
     * Get length and pattern restraints for relationship to insured field from database.
     */
    private readonly juvenileConfigs$: Observable<[string, RegexDataType]> = defer(() =>
        this.staticUtilService.cacheConfigEnabled(ConfigName.RELATIONSHIP_TO_INSURED_ENABLE).pipe(
            tap((enabled) => (this.relationshipToInsuredEnabled = enabled)),
            take(1),
            switchMap(() =>
                iif(
                    () => this.relationshipToInsuredEnabled,
                    combineLatest([
                        this.staticUtilService.cacheConfigValue(ConfigName.RELATIONSHIP_TO_INSURED_MAX_LENGTH),
                        this.regex$,
                    ]).pipe(
                        take(1),
                        tap(([relationshipToInsuredMaxLength, regex]) => {
                            this.relationshipToInsuredMaxLength = +relationshipToInsuredMaxLength;
                            this.nameWithSpacesAllowedRegex = regex ? regex.NAME_WITH_SPACE_ALLOWED : "";
                        }),
                    ),
                    of(null),
                ),
            ),
        ),
    );

    /**
     * If coverage is for a dependent, get their name after configs have been retrieved.
     */
    private readonly getJuvenileProposedInsuredName$ = combineLatest([
        this.appFlowService.updateCoveredDependentDetails$,
        this.juvenileConfigs$,
    ]).pipe(
        takeUntil(this.unsubscribe$),
        filter(([name]) => !!name),
        switchMap(([coveredDependentDetails]) => {
            [this.juvenileProposedInsuredName.firstName, this.juvenileProposedInsuredName.lastName] = coveredDependentDetails.split(" ");

            // spinner management
            this.spinnerObservables$.push(this.getMemberInfo());
            return this.spinnerManager$;
        }),
    );

    /**
     * Update active step details on beneficiary form value changes.
     */
    private readonly updateActiveStepDetailsOnValueChanges$ = defer(() =>
        this.beneficiaryForms.valueChanges.pipe(
            takeUntil(this.unsubscribe$),
            tap((change) => {
                if (
                    this.beneficiaryForms.dirty &&
                    !this.planObject.rider &&
                    this.planObject.currentSection.sectionId !== this.currentSectionIndex &&
                    this.planObject.currentStep !== this.currentStepIndex
                ) {
                    const activeStepDetails: ActiveStepDetails = {
                        currentSectionIndex: +this.planObject.currentSection.sectionId,
                        currentStepIndex: +this.planObject.currentStep,
                    };

                    if (this.planObject.reinstate) {
                        this.appFlowService.updateReinstateActiveStepDetails$.next(activeStepDetails);
                    } else {
                        this.appFlowService.updateActiveStepDetails$.next({
                            ...activeStepDetails,
                            planObject: this.planObject,
                        });
                    }
                }
            }),
        ),
    );

    /**
     * Track covered dependent selection.
     */
    private readonly getUpdatedCoveredDependentID$ = defer(() =>
        this.appFlowService.updateCoveredDependentID$.asObservable().pipe(
            takeUntil(this.unsubscribe$),
            filter<number>(Boolean),
            tap((coveredDependentID) => (this.insuredJuvenileDependentID = coveredDependentID)),
        ),
    );

    /**
     * Get configurations for max primary and secondary beneficiaries.
     */
    private readonly getMaxBeneficiariesConfigurations$ = defer(() =>
        this.staticUtilService
            .fetchConfigs([ConfigName.MAX_PRIMARY_BENEFICIARY_ALLOWED, ConfigName.MAX_SECONDARY_BENEFICIARY_ALLOWED], this.mpGroup)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap(([maxPrimaryBeneficiaries, maxSecondaryBeneficiaries]) => {
                    const [stepData] = this.planObject.steps;
                    this.beneficiaryPrimaryLimit = this.getMaxBeneficiaries(
                        stepData.type,
                        stepData.maxPrimary >= 0 ? +stepData.maxPrimary : +stepData.max,
                        +maxPrimaryBeneficiaries.value,
                    );
                    this.beneficiarySecondaryLimit = this.getMaxBeneficiaries(
                        stepData.type,
                        stepData.maxSecondary >= 0 ? +stepData.maxSecondary : +stepData.max,
                        +maxSecondaryBeneficiaries.value,
                    );
                    this.beneficiaryLimitNote = this.languageStrings["primary.portal.applicationFlow.beneficiary.limitNote"]
                        .replace("##primaryLimit##", this.beneficiaryPrimaryLimit.toString())
                        .replace("##secondaryLimit##", this.beneficiarySecondaryLimit.toString());
                }),
            ),
    );

    // Array of observables that cause the spinner to show.
    private spinnerObservables$: Observable<unknown>[] = [];

    /**
     * Shows spinner once subscribed, and, once all observables finish that caused
     * the spinner to show, hide spinner and empty array.
     */
    private readonly spinnerManager$: Observable<unknown[]> = defer(() => {
        this.showSpinner = true;
        const spinnerObservables = this.spinnerObservables$;
        this.spinnerObservables$ = [];

        return forkJoin(spinnerObservables).pipe(
            take(1),
            finalize(() => {
                this.showSpinner = false;
                // only switches from false to true after observables called during initialization complete
                this.showContent = true;
            }),
        );
    });

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.selectionRequired",
        "primary.portal.common.requiredField",
        "primary.portal.common.remove",
        "primary.portal.common.next",
        "primary.portal.applicationFlow.beneficiary.beneficiaryName",
        "primary.portal.applicationFlow.beneficiary.beneficiaryType",
        "primary.portal.applicationFlow.beneficiary.percentBenefit",
        "primary.portal.applicationFlow.beneficiary.newBeneficiary",
        "primary.portal.applicationFlow.beneficiary.addBeneficiary",
        "primary.portal.applicationFlow.beneficiary.percentCannotBeZero",
        "primary.portal.applicationFlow.beneficiary.primaryBeneficiaryLimit",
        "primary.portal.applicationFlow.beneficiary.secondaryBeneficiaryLimit",
        "primary.portal.applicationFlow.beneficiary.benefitPercentages",
        "primary.portal.applicationFlow.beneficiary.selectPrimaryBeneficiary",
        "primary.portal.applicationFlow.beneficiary.next",
        "primary.portal.applicationFlow.beneficiary.nextAflacAlways",
        "primary.portal.applicationFlow.beneficiary.nextBilling",
        "primary.portal.applicationFlow.beneficiary.nextFinishApplications",
        "primary.portal.applicationFlow.beneficiary.errorFetchingBeneficiaries",
        "primary.portal.applicationFlow.beneficiary.errorSavingResponse",
        "primary.portal.applicationFlow.beneficiary.errorGettingResponse",
        "primary.portal.applicationFlow.debug.planFlow",
        "primary.portal.applicationFlow.debug.planFlowStep",
        "primary.portal.applicationFlow.beneficiary.duplicateBeneficiary",
        "primary.portal.applicationFlow.beneficiaryType.primary.info",
        "primary.portal.applicationFlow.beneficiary.limitNote",
        "primary.portal.applicationFlow.beneficiary.relationshipToProposedInsurance",
    ]);

    constructor(
        private readonly appFlowService: AppFlowService,
        private readonly fb: FormBuilder,
        private readonly dialog: MatDialog,
        private readonly memberService: MemberService,
        private readonly store: Store,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly staticService: StaticService,
        private readonly utilService: UtilService,
        private readonly language: LanguageService,
        private readonly staticUtilService: StaticUtilService,
        private readonly empoweredSheetService: EmpoweredSheetService,
    ) {
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
    }

    /**
     * Filters out insured juvenile from beneficiary options.
     * @param beneficiary beneficiary to check
     * @returns beneficiary that is not the insured juvenile
     */
    filterInsuredJuvenile = (beneficiary: MemberBeneficiary | BeneficiaryModel) =>
        !(beneficiary.dependentId && beneficiary.dependentId === this.insuredJuvenileDependentID);

    /**
     * Implements Angular OnInit Life Cycle hook
     * loads data required for component like languages and form setting
     * used to call @method checkAflacAlways that checks if it is direct payment or aflac always
     */
    ngOnInit(): void {
        const customValidator = new CustomValidation();
        this.spinnerObservables$.push(this.getMaxBeneficiariesConfigurations$);

        this.getUpdatedCoveredDependentID$.subscribe();

        this.planId = this.planObject.application.appData.planId;
        this.isAGPlan = this.planObject.application.carrierId === CarrierId.AFLAC_GROUP;

        this.getStepId();

        this.isJuvenilePlan =
            this.planObject.application.productId === ProductId.JUVENILE_TERM_LIFE ||
            this.planObject.application.productId === ProductId.JUVENILE_WHOLE_LIFE;

        if (this.isJuvenilePlan) {
            this.spinnerObservables$.push(this.juvenileConfigs$);
            this.getJuvenileProposedInsuredName$.subscribe();
        } else {
            this.spinnerObservables$.push(this.getMemberBeneficiaries());
        }

        this.beneficiaryForms = this.fb.group({});

        this.updateActiveStepDetailsOnValueChanges$.subscribe();

        this.checkAflacAlways();

        this.planFlowId = this.planObject.application.appData.id;
        this.planFlowStepId = this.planObject.steps[0].id;
        this.isNotProduction$ = this.appFlowService.isNotProduction();

        this.spinnerManager$.subscribe();
    }

    /**
     * Get minimum valid limit of beneficiaries allowed.
     * @param type type of step in application process
     * @param maxFromPlan max determined by plan
     * @param maxFromConfigs default max stored in database
     * @returns minimum valid limit
     */
    getMaxBeneficiaries(type: string, maxFromPlan: number, maxFromConfigs: number): number {
        return type === StepType.BENEFICIARIES && maxFromPlan >= 0 && maxFromPlan < maxFromConfigs ? maxFromPlan : maxFromConfigs;
    }

    /**
     * Check store for direct payment / Aflac Always entries and set properties accordingly.
     */
    checkAflacAlways(): void {
        this.fromDirect = !!this.store.selectSnapshot(EnrollmentState.GetDirectPayment).length;
        this.hasAflacAlways = !!this.store.selectSnapshot(EnrollmentState.GetAflacAlways)?.length;
        this.hasEBSBilling = this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
    }

    /**
     * Method to get member and their beneficiaries' information.
     * @returns observable of MemberDependent array or void
     */
    getMemberInfo(): Observable<void | MemberDependent[]> {
        return forkJoin(
            this.memberService.getMember(this.memberId, true, this.mpGroup.toString()),
            this.memberService.getMemberContacts(this.memberId, this.mpGroup.toString()),
        ).pipe(
            takeUntil(this.unsubscribe$),
            switchMap(([memberInfo, memberContactInfo]) => {
                this.memberInfo = memberInfo.body;
                this.memberContactInfo = memberContactInfo;
                return this.getMemberBeneficiaries();
            }),
        );
    }

    /**
     * Get filtered beneficiaries based on product being enrolled and MON-63034 config.
     * @param beneficiaries beneficiaries from API request
     * @returns filtered list of beneficiaries
     */
    getFilteredBeneficiaries(beneficiaries: MemberBeneficiary[]): MemberBeneficiary[] {
        let filteredBeneficiaries = beneficiaries;

        if (this.isJuvenilePlan && this.juvenileProposedInsuredName) {
            filteredBeneficiaries = filteredBeneficiaries.filter(this.filterInsuredJuvenile);
        }

        return filteredBeneficiaries.filter((beneficiary) => this.isValidMemberBeneficiary(beneficiary));
    }

    /**
     * Get latest beneficiary selection and save as a BeneficiaryModel object.
     * @param memberBeneficiaries existing beneficiaries for subscriber
     * @returns latest beneficiary selection or previous selection (if not found)
     */
    getLatestBeneficiarySelection(memberBeneficiaries: MemberBeneficiary[]): BeneficiaryModel {
        const beneficiaryIDs = this.memberBeneficiaries.map((existingBeneficiary) => existingBeneficiary.id);
        const newBeneficiary = this.getFilteredBeneficiaries(memberBeneficiaries).find(
            (beneficiary) => !beneficiaryIDs.includes(beneficiary.id),
        );
        if (newBeneficiary) {
            this.processMemberBeneficiaries(memberBeneficiaries);
            const newBeneficiaryName =
                newBeneficiary.type === PolicyOwnershipType.INDIVIDUAL
                    ? (newBeneficiary.name && `${newBeneficiary.name.firstName} ${newBeneficiary.name.lastName}`) || ""
                    : (newBeneficiary.trustee && `${newBeneficiary.trustee.firstName} ${newBeneficiary.trustee.lastName}`) || "";
            const newBeneficiaryOption = this.beneficiaryOptions.find(
                (option) =>
                    option.name === newBeneficiaryName &&
                    (!(option.relation || newBeneficiary.relationshipToMember) ||
                        option.relation?.toLowerCase().includes(newBeneficiary.relationshipToMember?.toLowerCase())),
            );
            this.beneficiaryCreated = false;
            return { ...newBeneficiaryOption, id: newBeneficiary.id };
        }
        return this.latestBeneficiarySelection;
    }

    /**
     * This method is used to fetch member beneficiary details
     * @returns an observable of MemberDependent array or void
     */
    getMemberBeneficiaries(): Observable<void | MemberDependent[]> {
        return this.memberService.getMemberBeneficiaries(this.memberId, this.mpGroup, false).pipe(
            takeUntil(this.unsubscribe$),
            switchMap((memberBeneficiaries) => {
                if (this.beneficiaryCreated) {
                    this.latestBeneficiarySelection = this.getLatestBeneficiarySelection(memberBeneficiaries);
                }
                this.beneficiaryOptions = [];
                this.memberBeneficiaries = [];
                this.beneficiaryIds = [];
                if (!memberBeneficiaries.length) {
                    if (!this.estateCreated) {
                        return this.createEstateBeneficiary();
                    }
                    this.addEstateOption();
                    return of(null);
                }
                if (!this.applicationResponsesChecked) {
                    this.getApplicationResponse(memberBeneficiaries);
                }
                this.showAddBeneficiary = this.beneficiaryCount < this.beneficiaryPrimaryLimit + this.beneficiarySecondaryLimit;
                if (this.isJuvenilePlan && this.juvenileProposedInsuredName) {
                    memberBeneficiaries = memberBeneficiaries.filter(this.filterInsuredJuvenile);
                }
                memberBeneficiaries = memberBeneficiaries.filter((beneficiary) => this.isValidMemberBeneficiary(beneficiary));
                this.memberBeneficiaries = memberBeneficiaries;
                const estateFlag = this.processMemberBeneficiaries(memberBeneficiaries);
                if (!estateFlag && memberBeneficiaries.length) {
                    return this.createEstateBeneficiary();
                }
                return of(memberBeneficiaries);
            }),
            switchMap((memberBeneficiaries) => this.prePopulateSelection()),
            switchMap((memberBeneficiaries) => {
                this.beneficiaries = this.utilService.copy(this.beneficiaryOptions);
                return this.getMemberDependents();
            }),
            catchError((error: HttpErrorResponse) => {
                this.hasError = true;
                this.errorMessage = this.languageStrings["primary.portal.applicationFlow.beneficiary.errorFetchingBeneficiaries"];
                return EMPTY;
            }),
            finalize(
                () =>
                    (this.beneficiaryOptions = this.sortBeneficiaryOptions(this.beneficiaryOptions).map((beneficiaryOption) => ({
                        ...beneficiaryOption,
                        duplicateName: this.beneficiaryOptions.some(
                            (option) =>
                                (option.id !== beneficiaryOption.id || option.dependentId !== beneficiaryOption.dependentId) &&
                                option.name.toLowerCase() === beneficiaryOption.name.toLowerCase(),
                        ),
                    }))),
            ),
        );
    }

    /**
     * Validate beneficiary.
     * @param beneficiary beneficiary to be validated
     * @returns validity of beneficiary
     */
    isValidMemberBeneficiary(beneficiary: MemberBeneficiary): boolean {
        return (
            (this.isJuvenilePlan && this.relationshipToInsuredEnabled) ||
            (beneficiary.relationshipToMember || "").toLowerCase() !== SELF.toLowerCase()
        );
    }

    /**
     * Process beneficiaries according to type.
     * @param memberBeneficiaries beneficiaries to process
     * @returns boolean indicating if estate was added to beneficiary options
     */
    processMemberBeneficiaries(memberBeneficiaries: MemberBeneficiary[]): boolean {
        let estateFlag = false;
        memberBeneficiaries.forEach((item) => {
            if (item.type === PolicyOwnershipType.INDIVIDUAL) {
                if (item.relationshipToMember === SELF) {
                    const index = this.beneficiaryOptions.findIndex(
                        (beneficiary) => beneficiary.relation && beneficiary.relation === ` (${SELF.toLowerCase()})`,
                    );
                    if (index !== -1) {
                        this.beneficiaryOptions.splice(index, 1);
                    }
                }
                this.beneficiaryOptions.push({
                    id: item.id,
                    name: `${item.name.firstName} ${item.name.lastName}`,
                    birthDate: item.birthDate,
                    dependentId: item.dependentId,
                    address1: item.contact.address.address1,
                    city: item.contact.address.city || null,
                    address2: item.contact.address.address2,
                    state: item.contact.address.state,
                    zip: item.contact.address.zip,
                    ssn: item.ssn || null,
                    phone: item.contact.phoneNumbers.length ? item.contact.phoneNumbers[0].phoneNumber : null,
                    type: item.type,
                    relation: ` (${item.relationshipToMember.toLowerCase()})`,
                });
                this.beneficiaryIds.push({
                    name: `${item.name.firstName} ${item.name.lastName}`,
                    id: item.id,
                });
            } else if (item.type === this.estate) {
                estateFlag = true;
                this.estateId = item.id;
                this.addEstateOption();
            } else {
                this.beneficiaryOptions.push({
                    name: item.trustee
                        ? `${item.trustee.firstName} ${item.trustee.lastName}`
                        : item.type === CHARITY
                            ? `${item.name}`
                            : `${item.name?.firstName} ${item.name?.lastName}`,
                    dependentId: null,
                    type: item.type,
                    id: item.id,
                });
                this.beneficiaryIds.push({ name: item.trustee || item.name, id: item.id });
            }
        });
        return estateFlag;
    }

    /**
     * This method is used to fetch member dependent details
     * @returns an observable of MemberDependent array
     */
    getMemberDependents(): Observable<MemberDependent[]> {
        return this.memberService.getMemberDependents(this.memberId, false, this.mpGroup).pipe(
            tap((memberDependents) => {
                this.memberDependents = memberDependents;
                memberDependents.forEach((item) => {
                    const beneficiary = this.beneficiaryOptions.find(
                        (beneficiaryOption) =>
                            beneficiaryOption.dependentId === item.id ||
                            (`${item.name.firstName} ${item.name.lastName}`.toLowerCase() === beneficiaryOption.name.toLowerCase() &&
                                item.birthDate === beneficiaryOption.birthDate),
                    );
                    if (!(beneficiary || (this.isJuvenilePlan && item.id === this.insuredJuvenileDependentID))) {
                        const relation = this.appFlowService.dependentRelations.find((data) => data.id === item.dependentRelationId);
                        this.beneficiaryOptions.push({
                            name: `${item.name.firstName} ${item.name.lastName}`,
                            dependentId: item.id,
                            relation: relation ? ` (${relation.name.toLowerCase()})` : "",
                            type: PolicyOwnershipType.INDIVIDUAL,
                        });
                    }
                });
            }),
        );
    }

    /**
     * Sort beneficiary options for dropdown selection. Estate first, then rest alphabetically.
     * @param beneficiaries beneficiary options to sort
     * @returns sorted beneficiary options
     */
    sortBeneficiaryOptions(beneficiaries: BeneficiaryModel[]): BeneficiaryModel[] {
        // estate is always first. No need to compare.
        const estate = beneficiaries.splice(
            beneficiaries.findIndex((beneficiary) => this.getComparisonString(beneficiary.type) === BeneficiaryType.ESTATE.toLowerCase()),
            1,
        );

        beneficiaries.sort(
            (first, second) =>
                // compare names alphabetically
                this.getComparisonString(first.name).localeCompare(this.getComparisonString(second.name)) ||
                // if names match, compare relationships to subscriber alphabetically
                this.getComparisonString(first.relation).localeCompare(this.getComparisonString(second.relation)),
        );

        return (estate && [...estate, ...beneficiaries]) || beneficiaries;
    }

    /**
     * Get comparison string in lower case or empty string as default.
     * @param comparisonString string property used for comparison that may not exist
     * @returns lower case string property or empty string as default
     */
    getComparisonString(comparisonString: string): string {
        return (comparisonString && comparisonString.toLowerCase()) || "";
    }

    /**
     * Method to add estate option in beneficiary list dropdown
     */
    addEstateOption(): void {
        this.beneficiaryOptions.push({
            name: this.myEstate,
            dependentId: null,
            id: this.estateId,
            type: BeneficiaryType.ESTATE.toUpperCase(),
        });
        if (!this.memberBeneficiaries.map((beneficiary) => beneficiary.type).includes(BeneficiaryType.ESTATE)) {
            this.memberBeneficiaries.push({
                id: this.estateId,
                type: BeneficiaryType.ESTATE.toUpperCase(),
            });
        }
        this.beneficiaryIds.push({ name: this.myEstate, id: this.estateId });
        if (
            this.isJuvenilePlan &&
            this.relationshipToInsuredEnabled &&
            !this.beneficiaryOptions.some(
                (beneficiary) => beneficiary.relation && beneficiary.relation.toLowerCase().includes(SELF.toLowerCase()),
            )
        ) {
            const address = this.memberContactInfo.find((contact) => contact.contactType === ContactType.HOME).address;
            const contactInfo = this.memberContactInfo.find((contact) => Boolean(contact.phoneNumbers.length));
            this.beneficiaryOptions.push({
                id: null,
                name: `${this.memberInfo.name.firstName} ${this.memberInfo.name.lastName}`,
                dependentId: null,
                city: address.city || null,
                ssn: this.memberInfo.ssn || null,
                phone: contactInfo.phoneNumbers.length ? contactInfo.phoneNumbers[0].phoneNumber : null,
                type: PolicyOwnershipType.INDIVIDUAL,
                isMember: true,
                relation: ` (${SELF.toLowerCase()})`,
                address1: address.address1,
                address2: address.address2,
                state: address.state,
                zip: address.zip,
            });
        }
        if (!this.beneficiarySelections.length) {
            this.getApplicationResponse([]);
        }
    }

    /**
     * This method is used to create estate beneficiary
     * @returns an observable of HttpResponse of void
     */
    createEstateBeneficiary(): Observable<HttpResponse<void>> {
        const payload = {
            type: this.estate,
            name: this.myEstate,
        };
        return this.memberService.createMemberBeneficiary(this.memberId, this.mpGroup, payload).pipe(
            tap((memberBeneficiary) => {
                this.estateCreated = true;
                const id = memberBeneficiary.headers.get("location").split("/")[SEVEN];
                this.estateId = parseInt(id, 10);
                const beneficiaryFormGroup: FormGroup = this.beneficiaryForms.controls[this.estateBeneficiaryFormControlName] as FormGroup;
                if (beneficiaryFormGroup?.controls.name && !beneficiaryFormGroup.controls.name.value.id) {
                    beneficiaryFormGroup.controls.name.setValue({
                        ...beneficiaryFormGroup.controls.name.value,
                        id: this.estateId,
                    });
                }
                this.addEstateOption();
            }),
            catchError((error) => {
                this.hasError = true;
                this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.portal.common.serverTimedOut");
                return EMPTY;
            }),
        );
    }

    /**
     * This method is used to create member beneficiary
     * This method is used to get dependent contact and to save member beneficiary
     * @param beneficiary contains beneficiary details
     * @param selectedIndex is the selected beneficiary index
     */
    createBeneficiary(selectedBeneficiary: BeneficiaryModel, selectedIndex?: number): void {
        if (selectedBeneficiary.type.toLowerCase() !== BeneficiaryType.ESTATE.toLowerCase()) {
            const existingBeneficiary =
                selectedBeneficiary.id && this.beneficiaries.find((beneficiary) => beneficiary.id === selectedBeneficiary.id);
            if (!existingBeneficiary) {
                if (selectedBeneficiary.dependentId) {
                    this.selectionIndex = selectedIndex;
                    const dependent: MemberBeneficiary = {
                        type: PolicyOwnershipType.INDIVIDUAL,
                        dependentId: selectedBeneficiary.dependentId,
                    };
                    this.spinnerObservables$.push(
                        this.memberService
                            .getDependentContact(this.memberId, selectedBeneficiary.dependentId.toString(), this.mpGroup)
                            .pipe(
                                tap((dependentContact) => {
                                    dependent.contact = dependentContact;
                                }),
                                catchError((error: HttpErrorResponse) => this.handleContactError(dependent, error)),
                                filter(() => !!dependent.contact),
                                switchMap(() => this.createBeneficiaryOnContact(dependent)),
                            ),
                    );
                } else if (this.isJuvenilePlan && this.relationshipToInsuredEnabled) {
                    const memberBeneficiary = this.beneficiaryOptions.find(
                        (ben) => ben.isMember || (ben.relation && ben.relation.toLowerCase().includes(SELF.toLowerCase())),
                    );
                    this.selectionIndex = selectedIndex;
                    const beneficiary: MemberBeneficiary = this.getMemberAsBeneficiary(memberBeneficiary);
                    this.spinnerObservables$.push(
                        this.memberService.createMemberBeneficiary(this.memberId, this.mpGroup, beneficiary).pipe(
                            tap(() => (this.beneficiaryCreated = true)),
                            switchMap(() => this.getMemberBeneficiaries()),
                        ),
                    );
                }
                this.spinnerManager$.subscribe();
            }
        }
    }

    /**
     * handles dependent contact error
     * @param dependent dependent data
     * @param error error data
     */
    handleContactError(dependent: MemberBeneficiary, error: HttpErrorResponse): Observable<void | MemberDependent[]> {
        if (error && error.error && error.error.status === ClientErrorResponseCode.RESP_404) {
            return this.createBeneficiaryOnContact(dependent);
        }
        throw error;
    }

    /**
     * creates beneficiary based on dependent contact
     * @param dependent dependent data
     */
    createBeneficiaryOnContact(dependent: MemberBeneficiary): Observable<void | MemberDependent[]> {
        return this.memberService.createMemberBeneficiary(this.memberId, this.mpGroup, dependent).pipe(
            tap(() => (this.beneficiaryCreated = true)),
            switchMap(() => this.getMemberBeneficiaries()),
        );
    }

    /**
     * Return member as their own beneficiary.
     * @param member current member
     * @returns member as beneficiary
     */
    getMemberAsBeneficiary(member: BeneficiaryModel): MemberBeneficiary {
        return {
            type: PolicyOwnershipType.INDIVIDUAL,
            relationshipToMember: SELF,
            name: this.memberInfo.name,
            contact: this.memberContactInfo.find((contact) => contact.primary) || this.memberContactInfo[0],
            ssn: member ? member.ssn : null,
        };
    }

    /**
     * This method is used to pre-populate selected beneficiary
     * This method is used to check whether selected beneficiary has any missing-info or not using @method nameHashMapObservable
     * @returns MemberDependent data or null
     */
    prePopulateSelection(): Observable<string | void | MemberDependent[]> {
        if (this.controlName && !this.isMissingInfoCalled) {
            (this.beneficiaryForms.controls[`${this.controlName}`] as FormGroup).controls.name.setValue(
                this.latestBeneficiarySelection || this.beneficiaryOptions.find((option) => option.type === BeneficiaryType.ESTATE),
            );
            this.beneficiarySelections[this.selectionIndex] = this.latestBeneficiarySelection;
            return this.nameHashMapObservable(this.controlName, this.latestBeneficiarySelection, this.selectionIndex);
        }
        this.deepBeneficiaryName = this.utilService.copy(this.beneficiaryOptions);
        return of("");
    }

    /**
     * Find beneficiary section in application responses.
     * @param response application response section
     * @returns boolean indicating whether section is of type BENEFICIARIES
     */
    findBeneficiaryResponses = (response: ResponsePanel) => response.type === StepType.BENEFICIARIES && response.stepId === this.stepId;

    /**
     * Pre-populate existing selected beneficiary data or set default beneficiary
     * @param memberBeneficiaries beneficiaries already added to member's profile
     */
    getApplicationResponse(memberBeneficiaries: MemberBeneficiary[]): void {
        let beneficiaryFormName = `BeneficiaryForm${this.totalBeneficiary - 1}`;
        const appResponse = this.store.selectSnapshot(EnrollmentState.GetResponseItems);
        const planResponses = appResponse.find((application) => application.planId === this.planId);
        const beneficiaryResponses = planResponses && planResponses.response.find(this.findBeneficiaryResponses);

        let flag = false;
        if (beneficiaryResponses) {
            (beneficiaryResponses.value as BeneficiaryMapModel[]).forEach((beneficiary) => {
                const matchingBeneficiary = memberBeneficiaries.find((val) => val.id === beneficiary.id);
                if (matchingBeneficiary) {
                    this.relationshipToInsuredValue = this.isJuvenilePlan && beneficiary.relationshipToInsured;

                    const name =
                        (matchingBeneficiary.type === this.estate && this.myEstate) ||
                        (matchingBeneficiary.type === PolicyOwnershipType.INDIVIDUAL &&
                            `${matchingBeneficiary.name.firstName} ${matchingBeneficiary.name.lastName}`) ||
                        (matchingBeneficiary.trustee && `${matchingBeneficiary.trustee.firstName} ${matchingBeneficiary.trustee.lastName}`);

                    this.beneficiaryToBePrepopulate.push({
                        ...matchingBeneficiary,
                        name,
                    });

                    if (!this.selectedBeneficiaries.includes(beneficiaryFormName)) {
                        const title = new TitleCasePipe().transform(beneficiary.type);
                        this.addToBeneficiaryObjects(title, { id: beneficiary.id, name }, beneficiary.percent, beneficiaryFormName);

                        this.beneficiarySelections.push(matchingBeneficiary);
                    }

                    this.beneficiaryCount++;
                    this.totalBeneficiary++;
                    flag = true;
                    beneficiaryFormName = `BeneficiaryForm${this.totalBeneficiary - 1}`;
                }
            });

            if (flag) {
                this.beneficiaryCount--;
                this.totalBeneficiary--;
            } else {
                this.initializeForm();
            }
        } else if (!this.selectedBeneficiaries.includes(beneficiaryFormName)) {
            const estate = memberBeneficiaries.find((beneficiary) => beneficiary.type === this.estate);
            if (estate && estate.id) {
                this.estateId = estate.id;
            }
            this.addToBeneficiaryObjects(
                BeneficiaryTypes.PRIMARY,
                {
                    name: this.myEstate,
                    dependentId: null,
                    id: this.estateId,
                    type: BeneficiaryType.ESTATE.toUpperCase(),
                },
                MAX_PERCENT,
                beneficiaryFormName,
            );
            this.estateBeneficiaryFormControlName = beneficiaryFormName;
            this.beneficiarySelections.push({ name: this.myEstate, dependentId: null, id: this.estateId });
        }
        this.applicationResponsesChecked = true;
    }

    /**
     * Add beneficiary information to various related objects.
     * @param beneficiaryType type of beneficiary
     * @param name name of beneficiary
     * @param percent percent of benefit allocation
     * @param beneficiaryFormName name of beneficiary form name
     */
    addToBeneficiaryObjects(beneficiaryType: string, beneficiary: BeneficiaryModel, percent: number, beneficiaryFormName: string): void {
        this.beneficiaryForms.addControl(
            beneficiaryFormName,
            this.addBeneficiaryForm(beneficiary, beneficiaryType, percent, this.relationshipToInsuredValue),
        );

        this.beneficiaryNameMap.push({
            formName: beneficiaryFormName,
            selection: beneficiary,
        });

        this.beneficiaryTypeMap.push(beneficiaryType);
        this.selectedBeneficiaries.push(beneficiaryFormName);
    }

    initializeForm(): void {
        this.beneficiaryForms.addControl("BeneficiaryForm" + (this.totalBeneficiary - 1), this.addBeneficiaryForm());
        this.selectedBeneficiaries.push(`BeneficiaryForm${this.totalBeneficiary - 1}`);
    }

    /**
     * This method is used to open beneficiary-add modal
     * @param formName is the selected beneficiary form details
     * @param index is the selected beneficiary index
     */
    openModal(formName: string, index: number): void {
        this.controlName = formName;
        this.selectionIndex = index;
        const beneficiaryFormControl = this.beneficiaryForms.controls[`${this.controlName}`] as FormGroup;
        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = true;
        dialogConfig.minWidth = "100%";
        dialogConfig.height = "100%";
        dialogConfig.panelClass = "add-beneficiary";
        dialogConfig.data = {
            isJuvenilePlan: this.isJuvenilePlan,
            beneficaryName: this.juvenileProposedInsuredName,
        };
        const dialogRef = this.dialog.open(BeneficiaryAddComponent, dialogConfig);
        this.subscriptions.push(
            dialogRef
                .afterClosed()
                .pipe(
                    tap((response) => {
                        if (response !== ON_SUBMIT) {
                            beneficiaryFormControl.controls.name.setValue(beneficiaryFormControl.controls.oldName.value);
                        }
                    }),
                    filter((response) => response === ON_SUBMIT),
                    switchMap(() => {
                        this.beneficiaryCreated = true;
                        this.spinnerObservables$.push(this.getMemberBeneficiaries());
                        return this.spinnerManager$;
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * removes the form control and sets required values
     * @param value form name of beneficiary to be removed
     */
    removeBeneficiary(value: string): void {
        this.beneficiaryCount--;
        this.beneficiaryForms.removeControl(value);
        const hashIndex = this.beneficiaryNameMap.findIndex((item) => item.formName === value);
        if (hashIndex >= 0) {
            this.beneficiaryNameMap.splice(hashIndex, 1);
        }
        const index = this.selectedBeneficiaries.indexOf(value);
        this.selectedBeneficiaries.splice(index, 1);
        this.showAddBeneficiary = this.beneficiaryCount < this.beneficiaryPrimaryLimit + this.beneficiarySecondaryLimit;
    }

    /**
     * to add new form control on click of add beneficiary and set required values
     */
    addAnotherBeneficiary(): void {
        this.beneficiaryCount++;
        this.totalBeneficiary++;
        this.beneficiaryForms.addControl(
            "BeneficiaryForm" + (this.totalBeneficiary - 1),
            this.addBeneficiaryForm(undefined, PRIMARY_BENEFICIARY_TYPE),
        );
        this.selectedBeneficiaries.push(`BeneficiaryForm${this.totalBeneficiary - 1}`);
        this.beneficiaryTypeMap.push(PRIMARY_BENEFICIARY_TYPE);
        this.updateLimit(-1);
        this.showAddBeneficiary = this.beneficiaryCount < this.beneficiaryPrimaryLimit + this.beneficiarySecondaryLimit;
    }
    /**
     * Method to validate entered number
     * @param event Keyboard event
     */
    validateNumber(event: KeyboardEvent): boolean {
        this.primaryPercentError = this.secondaryPercentError = false;
        return event.charCode === 8 || event.charCode === 0 ? null : event.charCode >= 48 && event.charCode <= 57;
    }

    /**
     * Method to create beneficiary form
     * @param name beneficiary name
     * @param type beneficiary type
     * @param percent beneficiary percent value
     * @param relationshipToInsuredValue relationship to proposed insured value
     * @returns form Group
     */
    addBeneficiaryForm(beneficiary?: BeneficiaryModel, type?: string, percent?: number, relationshipToInsuredValue?: string): FormGroup {
        const formObject = {
            name: [beneficiary, Validators.required],
            type: [type, Validators.required],
            percent: [percent, [Validators.required, Validators.min(1)]],
            oldName: [beneficiary],
        };
        if (this.isJuvenilePlan && this.relationshipToInsuredEnabled) {
            formObject[RELATIONSHIP_TO_PROPOSED_INSURED] = [
                {
                    value: relationshipToInsuredValue,
                    disabled: beneficiary?.name === this.myEstate || this.beneficiarySelections[this.selectionIndex]?.type === "TRUST",
                },
                [
                    Validators.required,
                    Validators.pattern(new RegExp(this.nameWithSpacesAllowedRegex)),
                    CustomValidation.nameWithHyphensAndApostrophes,
                ],
            ];
        }
        return this.fb.group(formObject);
    }

    /**
     * This method is used to check whether selected beneficiary has any missing-info or not using @method nameHashMapObservable
     * @param formName is the selected beneficiary form details
     * @param selection is the selected beneficiary
     * @param index is the selected beneficiary index
     */
    nameHashMap(formName: string, selection: BeneficiaryModel, index?: number): void {
        if (selection) {
            this.latestBeneficiarySelection = selection;
        } else {
            selection = this.latestBeneficiarySelection;
        }
        this.isMissingInfoCalled = false;
        this.nameHashMapObservable(formName, selection, index, true).pipe(takeUntil(this.unsubscribe$)).subscribe();
    }
    /**
     * Get the selected beneficiary name
     * @param selectedBeneficiary selected beneficiary details
     * @returns beneficiary name
     */
    getSelectedBeneficiaryName(selectedBeneficiary: BeneficiaryModel): string {
        return (
            (selectedBeneficiary && selectedBeneficiary.name) ||
            (this.latestBeneficiarySelection && this.latestBeneficiarySelection.name) ||
            ""
        );
    }

    /**
     * This method is used to check whether selected beneficiary has any missing-info or not
     * If beneficiary has missing-info to be filled, then BeneficiaryMissingInfo modal will be opened
     * @param formName is the selected beneficiary form details
     * @param selectedBeneficiary is the selected beneficiary
     * @param selectedIndex is the selected beneficiary index
     * @param isSelection if beneficiary selected from drop down
     * @returns an observable of void or MemberDependent array
     */
    nameHashMapObservable(
        formName: string,
        selectedBeneficiary: BeneficiaryModel,
        selectedIndex?: number,
        isSelection: boolean = false,
    ): Observable<void | MemberDependent[]> {
        if (selectedBeneficiary) {
            this.updateRelationshipFieldValue(formName, selectedBeneficiary);
        }
        if (isSelection) {
            this.previousSelection = this.beneficiarySelections[selectedIndex];
        }
        this.controlName = formName;
        if (this.beneficiaryOptions.length) {
            selectedBeneficiary =
                selectedBeneficiary &&
                this.beneficiaryOptions.find(
                    (option) =>
                        (!(option.dependentId || selectedBeneficiary.dependentId) ||
                            option.dependentId === selectedBeneficiary.dependentId) &&
                        option.name === selectedBeneficiary.name &&
                        (!(option.relation && selectedBeneficiary.relation) ||
                            option.relation.toLowerCase().includes(selectedBeneficiary.relation.toLowerCase())),
                );
            this.selectedBeneficiaryName = this.getSelectedBeneficiaryName(selectedBeneficiary);
        }

        if (
            !selectedBeneficiary ||
            (selectedBeneficiary.type === PolicyOwnershipType.INDIVIDUAL && !this.findBeneficiary(selectedBeneficiary))
        ) {
            return of(null);
        }

        const oldNameControl = (this.beneficiaryForms.controls[`${this.controlName}`] as FormGroup).controls.oldName;
        const validBeneficiary = this.isBeneficiaryValid(selectedBeneficiary);

        if (
            !validBeneficiary &&
            (this.isJuvenilePlan || selectedBeneficiary.id) &&
            selectedBeneficiary.type === PolicyOwnershipType.INDIVIDUAL
        ) {
            return this.openBeneficiaryMissingInfoSheet(selectedBeneficiary, oldNameControl, selectedIndex, this.previousSelection);
        }
        if (
            validBeneficiary ||
            selectedBeneficiary.name === this.myEstate ||
            (selectedBeneficiary.type && selectedBeneficiary.type !== PolicyOwnershipType.INDIVIDUAL)
        ) {
            oldNameControl.setValue((this.beneficiaryForms.controls[`${this.controlName}`] as FormGroup).controls.name.value);
            const index: number = this.beneficiaryNameMap.findIndex((item) => item.formName === formName);
            if (index >= 0) {
                this.beneficiaryNameMap.splice(index, 1);
            }
            this.beneficiaryNameMap.push({
                formName,
                selection: selectedBeneficiary,
            });
        }
        return of(null);
    }

    /**
     * Check required beneficiary info to determine validity.
     * @param selectedBeneficiary selected beneficiary
     * @returns boolean indicating beneficiary validity
     */
    isBeneficiaryValid(selectedBeneficiary: BeneficiaryModel): boolean {
        return !!(
            selectedBeneficiary.city &&
            selectedBeneficiary.phone &&
            selectedBeneficiary.address1 &&
            selectedBeneficiary.state &&
            selectedBeneficiary.zip
        );
    }

    /**
     * Search for beneficiary using different criteria based on whether it is the member.
     * @param selectedBeneficiary beneficiary to find in array
     * @returns found beneficiary or undefined
     */
    findBeneficiary(selectedBeneficiary: BeneficiaryModel): MemberBeneficiary {
        return this.memberBeneficiaries.find(
            !(selectedBeneficiary.relation && selectedBeneficiary.relation.includes(SELF.toLowerCase()))
                ? (beneficiary) => beneficiary.id === selectedBeneficiary.id
                : (beneficiary) =>
                    beneficiary.isMember ||
                      (beneficiary.relationshipToMember && beneficiary.relationshipToMember.toLowerCase() === SELF.toLowerCase()),
        );
    }

    /**
     * Open beneficiary missing info popup.
     * @param selectedBeneficiary selected beneficiary
     * @param oldNameControl form control for beneficiary's old name
     * @param selectedIndex index of beneficiary in dropdown
     * @param previousSelection previously selected beneficiary
     * @returns observable of action to dismiss popup or member info/beneficiaries
     */
    openBeneficiaryMissingInfoSheet(
        selectedBeneficiary: BeneficiaryModel,
        oldNameControl: AbstractControl,
        selectedIndex: number,
        previousSelection: MemberBeneficiary | BeneficiaryModel,
    ): Observable<any> {
        return this.empoweredSheetService
            .openSheet(BeneficiaryMissingInfoComponent, {
                data: {
                    /**
                     * Pass in lambda function to find appropriate beneficiary based
                     * on the selected beneficiary's relationship to member.
                     */
                    beneficiary: this.memberBeneficiaries.find(
                        !(selectedBeneficiary.relation && selectedBeneficiary.relation.includes(SELF.toLowerCase()))
                            ? (beneficiary) => beneficiary.id === selectedBeneficiary.id
                            : (beneficiary) =>
                                beneficiary.isMember ||
                                  (beneficiary.relationshipToMember &&
                                      beneficiary.relationshipToMember.toLowerCase() === SELF.toLowerCase()),
                    ),
                    mpGroup: this.mpGroup,
                    memberId: +this.memberId,
                    dependentInformation: this.memberDependents.find((dependent) => dependent.id === selectedBeneficiary.dependentId),
                    isJuvenilePlan: this.isJuvenilePlan,
                    memberInfo: this.memberInfo,
                    memberContactInfo: this.memberContactInfo,
                },
            })
            .afterDismissed()
            .pipe(
                switchMap((res) => {
                    this.isMissingInfoCalled = !!res;
                    if (res) {
                        this.isMissingInfoCalled = false;
                        this.spinnerObservables$.push(this.isJuvenilePlan ? this.getMemberInfo() : this.getMemberBeneficiaries());
                        return this.spinnerManager$;
                    }
                    (this.beneficiaryForms.controls[`${this.controlName}`] as FormGroup).controls.name.setValue(oldNameControl.value);
                    this.updateSelection(selectedIndex, previousSelection);
                    return of(res);
                }),
            );
    }

    /**
     * Method to update the selection
     * @param index index value of selection to update
     * @param value selected beneficiary
     */
    updateSelection(index: number, value: BeneficiaryModel | MemberBeneficiary): void {
        this.selectionIndex = index;
        if (!value && index > -1) {
            this.beneficiarySelections.splice(index, 1);
            return;
        }
        if (!this.beneficiarySelections[index] && this.beneficiarySelections[index] !== null) {
            this.beneficiarySelections.push(value);
        } else {
            this.beneficiarySelections[index] = value;
        }
        const selectedFormControl = this.beneficiaryForms.controls[this.controlName][CONTROLS];
        if (selectedFormControl[RELATIONSHIP_TO_PROPOSED_INSURED]) {
            if (this.beneficiarySelections[index]?.name === this.myEstate || this.beneficiarySelections[index]?.type === "TRUST") {
                selectedFormControl[RELATIONSHIP_TO_PROPOSED_INSURED].disable();
            } else {
                selectedFormControl[RELATIONSHIP_TO_PROPOSED_INSURED].enable();
            }
        }

        const name = this.beneficiarySelections[index].name;
        this.selectedBeneficiaryName = name["firstName"] ? `${(name as Name).firstName} ${(name as Name).lastName}` : (name as string);
    }

    /**
     * This function is used to remove the beneficiary selection
     * @index index used in beneficiary type map
     */
    removeSelection(index: number): void {
        this.beneficiarySelections.splice(index, 1);
        this.beneficiaryTypeMap.splice(index, 1);
        this.updateLimit(-1);
        this.primaryPercentError = this.secondaryPercentError = false;
    }
    getBeneficiaryId(name: string): number {
        const index = this.beneficiaryIds.findIndex((item) => item.name === name);
        return this.beneficiaryIds[index].id;
    }

    getStepId(): void {
        if (this.planObject.steps.length) {
            this.stepId = this.planObject.steps[0].id;
            this.direction = this.planObject.steps[0].directions;
        }
        if (this.planObject.rider) {
            const ridercartDetails = this.getRiderCartDataFromCart();
            if (ridercartDetails && ridercartDetails.cartItemId) {
                this.cartId = ridercartDetails.cartItemId;
            } else {
                this.cartId = this.planObject.application.cartData.id;
            }
        } else {
            this.cartId = this.planObject.application.cartData.id;
        }
    }

    /**
     * This function is used to update the beneficiaries limit on addition based on business rules and selected beneficiary type
     * @index index used in beneficiary type map
     * @param event triggered on beneficiary type selection change
     */
    updateLimit(index: number, event?: MatSelectChange): void {
        this.primaryLimit = this.secondaryLimit = 0;
        this.primaryPercentError = this.secondaryPercentError = false;
        this.primaryLimitError = this.secondaryLimitError = this.primaryError = false;
        if (index !== -1) {
            this.beneficiaryTypeMap[index] = event.value;
        }
        this.beneficiaryTypeMap.forEach((type) => {
            if (type === "Primary") {
                this.primaryLimit++;
            } else {
                this.secondaryLimit++;
            }
        });
        if (this.primaryLimit > this.beneficiaryPrimaryLimit) {
            this.primaryLimitError = true;
            this.beneficiaryForms.setErrors({ primaryLimitError: true });
        } else if (this.secondaryLimit > this.beneficiarySecondaryLimit) {
            this.secondaryLimitError = true;
            this.beneficiaryForms.setErrors({ secondaryLimitError: true });
        }
    }

    /**
     * Get ID of selected beneficiary.
     * @param currentSelection currently selected beneficiary
     * @returns ID of beneficiary
     */
    getSelectedBeneficiaryID(currentSelection: BeneficiaryModel | MemberBeneficiary): number {
        let id = (currentSelection.name === this.myEstate && this.estateId) || currentSelection.id;
        if (!id) {
            const matchingBeneficiary =
                currentSelection.dependentId &&
                this.memberBeneficiaries.find(
                    (beneficiary) => beneficiary.dependentId && beneficiary.dependentId === currentSelection.dependentId,
                );
            id = matchingBeneficiary && matchingBeneficiary.id;
        }
        return id;
    }

    /**
     * Validate and submit selected beneficiary details
     */
    onNext(): void {
        this.primaryPercent = this.secondaryPercent = 0;
        this.hasError = false;
        if (this.beneficiaryForms.status === "VALID" && !this.primaryLimitError && !this.secondaryLimitError) {
            const beneficiariesToAdd = [];
            // To correctly sort the form, 'BeneficiaryForm' is removed from the form name and only numbers are used for comparing
            this.beneficiaryNameMap.sort((a, b) =>
                +a.formName.split(BENEFICIARY_FORM)[1] > +b.formName.split(BENEFICIARY_FORM)[1] ? 1 : -1,
            );
            this.beneficiaryNameMap.forEach((item, index) => {
                const currentBeneficiarySelection = this.beneficiarySelections[index];
                if (currentBeneficiarySelection) {
                    const id: number = this.getSelectedBeneficiaryID(currentBeneficiarySelection);
                    const formControls = this.beneficiaryForms.controls[`${item.formName}`][CONTROLS];
                    const relationshipToInsuredFormControl: AbstractControl = formControls[RELATIONSHIP_TO_PROPOSED_INSURED];

                    const percent: string = formControls["percent"]["value"];
                    const type: string = formControls["type"]["value"];

                    this.incrementPercentByType(type === "Primary", +percent);

                    const allocation = {
                        id: id,
                        dependentId: currentBeneficiarySelection.dependentId,
                        percent: +percent,
                        type: type.toUpperCase(),
                    };

                    if (
                        this.isJuvenilePlan &&
                        relationshipToInsuredFormControl &&
                        relationshipToInsuredFormControl[VALUE] &&
                        item.selection.name !== this.myEstate
                    ) {
                        allocation[RELATIONSHIP_TO_INSURED] = relationshipToInsuredFormControl[VALUE];
                    }
                    beneficiariesToAdd.push(allocation);
                }
            });
            const beneficiaryIDs = beneficiariesToAdd.map((valueInstance) => valueInstance.id);
            const isDuplicate = Array.from(new Set(beneficiaryIDs)).length !== beneficiaryIDs.length;
            const payload = { stepId: this.stepId, type: StepType.BENEFICIARIES, value: beneficiariesToAdd };
            this.saveApplicationOrSetErrors(payload, isDuplicate);
        }
    }

    /**
     * Increment allocation percents by provided percent.
     * @param isPrimaryType is allocation primary (false if secondary)
     * @param percent allocation percent
     */
    incrementPercentByType(isPrimaryType: boolean, percent: number): void {
        if (isPrimaryType) {
            this.primaryPercent += percent;
        } else {
            this.secondaryPercent += percent;
        }
    }

    /**
     * If no errors exist in beneficiary form, save application response.
     * @param payload payload sent through API request
     * @param isDuplicate duplicate beneficiaries exist
     */
    saveApplicationOrSetErrors(payload: ApplicationResponse, isDuplicate: boolean): void {
        const primaryBeneficiaries = (payload.value as BeneficiaryMapModel[]).filter(
            (allocation) => allocation.type.toLowerCase() === BeneficiaryTypes.PRIMARY.toLowerCase(),
        );
        const secondaryBeneficiaries = (payload.value as BeneficiaryMapModel[]).filter(
            (allocation) => allocation.type.toLowerCase() === BeneficiaryTypes.SECONDARY.toLowerCase(),
        );
        if (!isDuplicate) {
            if (!primaryBeneficiaries.length) {
                this.primaryError = true;
            } else if (
                primaryBeneficiaries.length &&
                primaryBeneficiaries.reduce((totalPercent, allocation) => totalPercent + allocation.percent, 0) !== MAX_PERCENT
            ) {
                this.primaryPercentError = true;
            } else if (
                secondaryBeneficiaries.length &&
                secondaryBeneficiaries.reduce((totalPercent, allocation) => totalPercent + allocation.percent, 0) !== MAX_PERCENT
            ) {
                this.secondaryPercentError = true;
            }
            if (!this.primaryError && !this.primaryPercentError && !this.secondaryPercentError) {
                this.spinnerObservables$.push(this.saveApplicationResponse(payload));
                this.spinnerManager$.subscribe();
            }
        } else {
            this.hasError = true;
            this.errorMessage = this.languageStrings["primary.portal.applicationFlow.beneficiary.duplicateBeneficiary"];
        }
    }

    /**
     * Make API request to save beneficiary application response.
     * @param payload save application response payload
     * @returns observable of application response
     */
    saveApplicationResponse(payload: ApplicationResponse): Observable<ApplicationResponse> {
        return this.shoppingCartService.saveApplicationResponse(this.memberId, this.cartId, this.mpGroup, [payload]).pipe(
            switchMap((saveApplicationResponse) =>
                this.store.dispatch(new UpdateApplicationResponse(this.memberId, this.cartId, this.mpGroup)).pipe(
                    tap((updateApplicationResponse) =>
                        this.appFlowService.onNextClick(this.planObject, this.planObject.currentStep, this.planObject.currentSection.title),
                    ),
                    catchError((storeError: HttpErrorResponse) =>
                        this.handleError(this.languageStrings["primary.portal.applicationFlow.beneficiary.errorSavingResponse"]),
                    ),
                ),
            ),
            catchError((apiError: HttpErrorResponse) =>
                this.handleError(this.languageStrings["primary.portal.applicationFlow.beneficiary.errorGettingResponse"]),
            ),
        );
    }

    /**
     * Set error variables accordingly.
     * @param errorString string for setting error message
     * @returns observable of null
     */
    handleError(errorString: string): Observable<null> {
        this.hasError = true;
        this.errorMessage = errorString;
        return of(null);
    }

    /**
     * will return rider cart data based on rider plan id.
     * @return: will return rider cart data of type RiderCart
     */
    getRiderCartDataFromCart(): RiderCart {
        let valueToReturn: RiderCart = null;
        if (this.planObject.application.cartData.riders && this.planObject.application.cartData.riders.length > 0) {
            valueToReturn = this.planObject.application.cartData.riders.filter((rider) => rider.planId === this.planId).pop();
        }
        return valueToReturn;
    }

    /**
     * to update value of relationship to insured field when beneficiary is changed
     * @param formName form name selected
     */
    updateRelationshipFieldValue(formName: string, selection: BeneficiaryModel): void {
        if (
            this.isJuvenilePlan &&
            this.relationshipToInsuredEnabled &&
            formName &&
            this.beneficiaryForms &&
            this.beneficiaryForms.controls
        ) {
            const selectedFormControl = this.beneficiaryForms.controls[formName][CONTROLS];
            if (selectedFormControl && selectedFormControl[RELATIONSHIP_TO_PROPOSED_INSURED]) {
                selectedFormControl[RELATIONSHIP_TO_PROPOSED_INSURED].setValue(this.getRelationshipToInsured(selection));
            }
        }
    }

    /**
     * Get beneficiary's relationship to insured.
     * @param selectedBeneficiary beneficiary whose relationship to the insured is retrieved
     * @returns beneficiary's relationship to insured, if found
     */
    getRelationshipToInsured(selectedBeneficiary: BeneficiaryModel): string {
        let matchingBeneficiary: BeneficiaryMapModel | MemberBeneficiary;

        // get responses for this plan's current application
        const currentPlanResponse = this.store
            .selectSnapshot(EnrollmentState.GetResponseItems)
            .find((element) => element.planId === this.planId);

        // SOURCE 1: check current application responses
        if (currentPlanResponse) {
            // find beneficiary responses
            const beneficiaryResponses = currentPlanResponse.response.find(
                (resp) => resp.type === StepType.BENEFICIARIES && resp.stepId === this.stepId,
            );

            if (beneficiaryResponses) {
                // find matching beneficiary based on whether selected beneficiary is the current member
                matchingBeneficiary = (beneficiaryResponses.value as BeneficiaryMapModel[]).find(
                    selectedBeneficiary.isMember
                        ? (beneficiary) => !!beneficiary.relationshipToInsured
                        : (beneficiary) => beneficiary.id === selectedBeneficiary.id,
                );

                if (matchingBeneficiary) {
                    return matchingBeneficiary.relationshipToInsured;
                }
            }
        }

        // SOURCE 2: check beneficiary allocations
        matchingBeneficiary = this.memberBeneficiaries.find(
            selectedBeneficiary.isMember
                ? (beneficiary) => beneficiary.isMember
                : (beneficiary) => beneficiary.dependentId === selectedBeneficiary.dependentId,
        );

        const matchingAllocation =
            matchingBeneficiary &&
            matchingBeneficiary.allocations &&
            matchingBeneficiary.allocations.find(
                (allocation) =>
                    /* using only populated name fields, compare names of the insured in matching
                    beneficiary's allocations with the name of the juvenile in current application */
                    allocation.nameOfInsured &&
                    (Object.entries(allocation.nameOfInsured) as [string, string][])
                        .filter(([, nameValue]) => nameValue)
                        .every(([key, value]) => this.juvenileProposedInsuredName[key] === value),
            );

        return (matchingAllocation && matchingAllocation.relationshipToInsured) || "";
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subs) => subs.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Compare function for mat select
     * @param first available beneficiary option
     * @param second selected beneficiary option
     * @returns boolean representing match
     */
    compareBeneficiary(first: BeneficiaryModel, second: BeneficiaryModel): boolean {
        return first && second && ((first.id && second.id && first.id === second.id) || deepEqual(first, second));
    }
}
