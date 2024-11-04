import { UndoRemoveBenefitDollarModalComponent } from "./unremove-benefit-dollar-modal/unremove-modal.component";
import { EditBenefitDollarModalComponent } from "./edit-benefit-dollar-modal/edit-benefit-dollar-modal.component";
import { Component, OnInit, Inject, ViewChild, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig, MatDialog } from "@angular/material/dialog";
import {
    BenefitDocument,
    BenefitsOfferingService,
    AccountService,
    ApprovalRequest,
    ApprovalRequestStatus,
    AccountDetails,
    SaveCarrierSetupStatus,
    CarrierFormSetupStatus,
    MemberService,
    AccountList,
    AflacService,
    PROCESS_MASTERAPP_ENUM,
    ApprovalItemObject,
    FlexDollar,
    ApprovalItemAction,
    ApprovalItem,
    BenefitOfferingSettingsInfo,
    CoreService,
    PlanDocument,
} from "@empowered/api";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Observable, Subject, forkJoin, EMPTY, combineLatest } from "rxjs";
import { RequestChangesDialogComponent } from "./request-changes-dialog/request-changes-dialog.component";
import { EmpoweredModalService } from "@empowered/common-services";
import {
    CarrierId,
    ConfigName,
    ClientErrorResponseCode,
    DateFormats,
    CompanyCode,
    AccountProducer,
    PlanChoice,
    CountryState,
    AdminCredential,
    ContributionType,
    VasFunding,
    AdminApprovalCaliforniaSteps,
    ProductId,
    PlanDocumentType,
} from "@empowered/constants";
import { Select, Store } from "@ngxs/store";
import { ViewDocumentDialogComponent } from "./view-document-dialog/view-document-dialog.component";
// TODO: MatVerticalStepper is deprecated https://material.angular.io/components/stepper/api#MatVerticalStepper
// This Component will be removed in an upcoming Angular release and receives breaking changes in Angular 13, please use MatStepper instead
import { MatStepper } from "@angular/material/stepper";
import { take, tap, catchError, takeUntil, filter, first } from "rxjs/operators";
import { SafeHtml, DomSanitizer } from "@angular/platform-browser";
import { RemoveBenefitDollarModalComponent } from "./remove-benefit-dollar-modal/remove-modal.component";
import { HttpErrorResponse } from "@angular/common/http";
import { DatePipe } from "@angular/common";
import { CarrierData } from "./model/carrier-date.model";
import { ViewDocumentDialogData } from "./model/view-document-dialog-data.model";
import { AccountListState, AccountInfoState, StaticUtilService, UtilService } from "@empowered/ngxs-store";

const CLOSE = "close";
const APPROVE = "APPROVE";
const RESEND_LANG = "primary.portal.admin.resend";
const EQUALS_SYMBOL = "=";
const VAS_AGREEMENT = "group.plan.acknowledgement1";
const EZ_SHIELD_AGREEMENT = "group.plan.fraudProtection.acknowledgement1";
const I_AGREE = "primary.portal.common.iAgree";
const AGREE_AND_FINISH = "primary.portal.dashboard.adminApprovalChecklist.agreeAndFinishSignoff";
const SERVER_TIMEOUT = "primary.portal.common.serverTimeout";
const CANCELLED_REQUEST = "primary.portal.dashboard.adminApprovalChecklist.cancelledRequest";
const EN_US = "en-US";
const EST_TIME_ZONE = "America/New_York";
interface ApprovedBenefitDollarData {
    id: number;
    amount?: number;
    contributionType?: ContributionType;
}

interface BenefitDollarStatusData {
    benefitDollarStatus: BenefitDollarStatus;
    benefitDollarData: ApprovedBenefitDollarData;
}

interface AdminReviewPlansConfig {
    agreementLanguageSpecification: string;
    planIds: string[];
}

enum BenefitDollarStatus {
    REMOVED = "REMOVED",
    EDITED = "EDITED",
    NOT_EDITED = "NOT_EDITED",
}

@Component({
    selector: "empowered-admin-approval-checklist",
    templateUrl: "./admin-approval-checklist.component.html",
    styleUrls: ["./admin-approval-checklist.component.scss"],
})
export class AdminApprovalChecklistComponent implements OnInit, OnDestroy {
    @ViewChild("verticalStepper") verticalStepper: MatStepper;
    private readonly unsubscribe$ = new Subject<void>();

    benefitDollarDataList: BenefitDollarStatusData[] = [];
    benefitDollarList: FlexDollar[] = [];
    BenefitDollarStatus = BenefitDollarStatus;
    buttonText: string;
    carrierData: CarrierData[] = [];
    censusDocuments: BenefitDocument[];
    companyCodeNY = CompanyCode.NY;
    companyName: string;
    contributionType = ContributionType;
    documentSignRequired: boolean;
    employeeCount: number;
    erisaMessage = this.langService.fetchPrimaryLanguageValue("primary.portal.benefitDollars.erisaMessage");
    erisaMessageHtml: SafeHtml;
    hasOnlyUnapprovedBenefitDollars: boolean;
    hasOnlyUnapprovedNonBenefitDollars: boolean;
    isBenefitDollarsEnabled = false;
    isFirst: boolean;
    isLimited: boolean;
    isLoading: boolean;
    settingsInfo: BenefitOfferingSettingsInfo;
    isProcessMasterApproved = true;
    isQ60FormPresent: boolean;
    isSitusState = false;
    languageStrings: Record<string, string>;
    agreementLanguageStrings: string[] = [];
    mostRecentDocument: BenefitDocument;
    mpGroup: number;
    processAlert: string;
    producer: AccountProducer;
    producerName: string;
    showErrorMessage: boolean;
    stepperIndex = 0;
    unapprovedRequestContainsBenefitDollars: boolean;
    hasSubmitApiError: boolean;
    allFormsSigned = false;
    errorMessage: string;
    situsStateIsCA = false;
    isDentalProduct = false;
    readonly SAVE = "save";
    readonly WELCOME_STEP = 0;
    readonly EMPLOYEE_CENSUS_STEP = 1;
    readonly BENEFIT_DOLLAR_ALONE_STEP = 1;
    readonly BENEFIT_DOLLAR_STEP = 2;
    readonly AGREEMENTS_WITHOUT_BENEFIT_DOLLAR_STEP = 2;
    readonly AGREEMENTS_WITH_BENEFIT_DOLLAR_STEP = 3;
    CARRIER_FORM_WITHOUT_BENEFIT_DOLLAR_STEP_OR_AGREEMENTS_STEP = 2;
    CARRIER_FORM_WITHOUT_BENEFIT_DOLLAR_STEP = 3;
    CARRIER_FORM_WITH_BENEFIT_DOLLAR_STEP = 4;
    readonly californiaRequirementSteps = AdminApprovalCaliforniaSteps;
    readonly LENGTH_ONE = 1;
    readonly LENGTH_TWO = 2;
    @Select(AccountInfoState.getAccountInfo) accountInfo$: Observable<AccountDetails>;
    benefitOfferingStates: CountryState[];
    excludedStateList: string[];
    validStates: CountryState[];
    invalidStates: string[] = [];
    stateNYorOH: boolean;
    agreementsPresent: boolean;
    vasAgreement: string;
    argusAgreement: string;
    agreeButtonText: string;
    agreementLanguageSpecifications: string[];
    planDocuments: PlanDocument[];

    constructor(
        private readonly dialog: MatDialog,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly dialogRef: MatDialogRef<AdminApprovalChecklistComponent>,
        private readonly accountService: AccountService,
        private readonly langService: LanguageService,
        private readonly store: Store,
        private readonly aflacService: AflacService,
        private readonly coreService: CoreService,
        @Inject(MAT_DIALOG_DATA)
        private readonly data: {
            admin: AdminCredential;
            mpGroup: number;
            approvalRequests: ApprovalRequest[];
            isLimited: boolean;
            carrierData: Array<CarrierData>;
            planChoices: PlanChoice[];
        },
        private readonly utilService: UtilService,
        private readonly memberService: MemberService,
        private readonly staticUtilService: StaticUtilService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly domSanitizer: DomSanitizer,
        private readonly datePipe: DatePipe,
    ) {
        this.accountInfo$.pipe(takeUntil(this.unsubscribe$)).subscribe((accountInfo) => {
            this.companyName = accountInfo ? accountInfo.name : "";
            this.isSitusState = accountInfo.situs.state.abbreviation === CompanyCode.NY;
            this.situsStateIsCA = accountInfo.situs.state.abbreviation === CompanyCode.CA;
        });

        this.staticUtilService
            .cacheConfigEnabled("general.feature.enable.benefitDollars")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((isBenefitDollarsEnabled) => {
                this.isBenefitDollarsEnabled = isBenefitDollarsEnabled;
            });
    }

    /**
     * Angular life-cycle hook: ngOnInit
     * Set the required data at component initialization
     */
    ngOnInit(): void {
        this.getBOStatesandExcludedStates();
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*")).subscribe(() => {
            this.processAlert = this.langService.fetchSecondaryLanguageValue(
                "secondary.portal.dashboard.adminApprovalChecklist.toProceedDesc",
            );
        });
        if (this.data && this.data.approvalRequests && this.data.approvalRequests.length) {
            this.mpGroup = this.data.mpGroup;
            this.isLimited = this.data.isLimited;
            this.carrierData = this.data.carrierData;
            this.documentSignRequired = this.carrierData.some((data) => !data.viewOnly);
            this.isQ60FormPresent = this.carrierData.some(
                (data) => data.carrier.id === CarrierId.AFLAC && data.carrierForms.some((form) => form.carrierFormId !== null),
            );
            this.getAgreementsConfig();

            const approvalReq = this.data.approvalRequests.find((data) => data.submittedProducerId != null);
            if (approvalReq) {
                this.getProducerDetails(approvalReq.submittedProducerId.toString());
            }
            if (!this.isLimited) {
                this.isFirst = !this.data.approvalRequests.some((x) => x.status === ApprovalRequestStatus.APPROVED);
                this.getCensusEstimate();
                // removed getDocuments() call as a part MON-35169, new API call added instead
            }
            this.setupBenefitDollar();
        }
        this.fetchLanguageData();
        this.buttonText = this.languageStrings[RESEND_LANG];
        const q60CarrierForm = this.carrierData.find(
            (carrier) => carrier.carrier.id === CarrierId.AFLAC && carrier.carrierForms.some((form) => form.carrierFormId !== null),
        );
        if (q60CarrierForm) {
            q60CarrierForm.isQ60 = true;
            this.isProcessMasterApproved = q60CarrierForm.carrierForms.some((form) => form.status === CarrierFormSetupStatus.APPROVED);
        }
        // Check if plan choices belongs to Dental LOB with ADV carrier
        this.isDentalProduct = this.data.planChoices.some((planChoice) =>
            this.isDentalLobFromADV(planChoice.plan.carrierId, planChoice.plan.productId),
        );

        if (this.situsStateIsCA && this.isDentalProduct) {
            // List out all plan ids belongs to Dental LOB with ADV carrier
            const planIds = this.data.planChoices
                .filter((planChoice) => this.isDentalLobFromADV(planChoice.plan.carrierId, planChoice?.plan?.productId))
                .map((planChoice) => planChoice.plan.id);
            // Retrieve all the plan documents belongs to Dental LOB with ADV carrier
            this.coreService
                .getPlanDocuments(planIds, CompanyCode.CA, this.mpGroup?.toString())
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((documents) => {
                    this.planDocuments = documents.filter((document) => document.type === PlanDocumentType.OTHER);
                });
            // Increasing the steps of Carrier Forms by one if CA requirement steps comes in picture
            this.CARRIER_FORM_WITHOUT_BENEFIT_DOLLAR_STEP_OR_AGREEMENTS_STEP = 3;
            this.CARRIER_FORM_WITHOUT_BENEFIT_DOLLAR_STEP = 4;
            this.CARRIER_FORM_WITH_BENEFIT_DOLLAR_STEP = 5;
        }
    }

    /**
     * Function to return true if LOB is dental with carrier Id as ADV
     * @param carrierId carrier Id
     * @param productId product Id
     * @returns boolean
     */
    isDentalLobFromADV(carrierId: number, productId: number): boolean {
        return carrierId === CarrierId.ADV && productId === ProductId.DENTAL;
    }
    /**
     * Loads config that specifies plans with agreements required and the language specifications
     * corresponding to them. After finding matches with the chosen plans, the agreements page
     * is added and its content is populated.
     */
    getAgreementsConfig(): void {
        combineLatest([
            this.staticUtilService.cacheConfigValue(ConfigName.ADMIN_REVIEW_PLANS),
            this.store.dispatch(new LoadSecondaryLandingLanguage("group.plan.*")),
        ])
            .pipe(
                tap(([configResponse]) => {
                    // organize config string into object array
                    const adminReviewPlansConfigs: AdminReviewPlansConfig[] = configResponse.split(",").map((config) => {
                        const indexOfEqualsSymbol = config.indexOf(EQUALS_SYMBOL);
                        return {
                            agreementLanguageSpecification: config.substring(0, indexOfEqualsSymbol),
                            planIds: config.substring(indexOfEqualsSymbol + 1).split(":"),
                        };
                    });
                    // extract language specifications from config that correspond with plan choices
                    this.agreementLanguageSpecifications = this.getAgreementLanguageSpecifications(adminReviewPlansConfigs);
                    this.addArgusAndVasAgreementsIfPresent();

                    // add agreements step and populate its content
                    if (this.agreementLanguageSpecifications.length) {
                        this.agreementsPresent = true;
                        this.agreementLanguageStrings = Object.values(
                            this.langService.fetchSecondaryLanguageValues(this.agreementLanguageSpecifications),
                        );
                        // if EZShield plan exists with language spec that requires keyword replacement, do so
                        const ezShieldIndex = this.agreementLanguageSpecifications.indexOf(EZ_SHIELD_AGREEMENT);
                        if (ezShieldIndex !== -1) {
                            this.agreementLanguageStrings[ezShieldIndex] = this.setFundingTypeForEzShield(
                                adminReviewPlansConfigs,
                                ezShieldIndex,
                            );
                        }
                        this.agreeButtonText = this.getAgreeButtonText();
                    }
                }),
            )
            .subscribe();
    }

    /**
     * Filter entries in config that correspond to chosen plans being reviewed.
     *
     * @param adminReviewPlansConfigs config containing plans requiring various agreements
     * @returns language specifications corresponding to matching plans
     */
    getAgreementLanguageSpecifications(adminReviewPlansConfigs: AdminReviewPlansConfig[]): string[] {
        return adminReviewPlansConfigs
            .filter((config) => this.data.planChoices.some((choice) => choice.plan && config.planIds.includes(`${choice.plan.id}`)))
            .map((config) => config.agreementLanguageSpecification);
    }

    /**
     * If an Argus 2020 and/or VAS plan is chosen, add their agreement language specifications.
     */
    addArgusAndVasAgreementsIfPresent(): void {
        if (this.carrierData.some((data) => data.carrier.id === CarrierId.ARGUS)) {
            this.agreementLanguageSpecifications.push("group.plan.argus.acknowledgement1");
        }
        if (
            this.carrierData.some((data) =>
                [
                    CarrierId.WAGEWORKS,
                    CarrierId.AFLAC_FRAUD_PROTECTION,
                    CarrierId.ME_MD,
                    CarrierId.COLLEGE_ADVISORY_SERVICES,
                    CarrierId.HEALTH_ADVOCATE,
                ].includes(data.carrier.id),
            ) ||
            this.data.planChoices.some((choice) =>
                [VasFunding.HQ, VasFunding.EMPLOYER, VasFunding.EMPLOYEE].includes(choice.plan.vasFunding),
            )
        ) {
            this.agreementLanguageSpecifications.push(VAS_AGREEMENT);
        }
    }

    /**
     * Replace {fundingType} keyword in language specification for EZShield.
     *
     * @param adminReviewPlansConfigs config containing plans requiring various agreements
     * @param ezShieldIndex index of EZShield config that has custom funding type
     * @returns updated language specification
     */
    setFundingTypeForEzShield(adminReviewPlansConfigs: AdminReviewPlansConfig[], ezShieldIndex: number): string {
        const fundingType =
            VasFunding[
                this.data.planChoices.find(
                    (choice) =>
                        choice.plan &&
                        choice.plan.vasFunding &&
                        adminReviewPlansConfigs[ezShieldIndex].planIds.includes(`${choice.plan.id}`),
                ).plan.vasFunding
            ];
        return this.agreementLanguageStrings[ezShieldIndex].split("{fundingType}").join(fundingType);
    }

    /**
     * Gets language specification for "Agree" button on agreements step depending on
     * whether it is the final step.
     *
     * @returns language specification value for button
     */
    getAgreeButtonText(): string {
        return this.languageStrings[
            this.unapprovedRequestContainsBenefitDollars || this.hasOnlyUnapprovedNonBenefitDollars ? I_AGREE : AGREE_AND_FINISH
        ];
    }

    /**
     * Fetches BO states and gets config value for excluded states
     */
    getBOStatesandExcludedStates(): void {
        /** Using take(1) as cache config value doesn't complete on its own and subscribe of forkjoin will not be executed*/
        forkJoin([
            this.staticUtilService.cacheConfigValue("general.enrollment.benefitDollar.excluded.state.list").pipe(first()),
            this.benefitOfferingService.getBenefitOfferingSettings(this.data.mpGroup),
        ]).subscribe(([stateList, benefitOfferingSettingsInfo]) => {
            this.settingsInfo = benefitOfferingSettingsInfo;
            this.benefitOfferingStates = this.settingsInfo.states;
            if (!this.employeeCount) {
                this.employeeCount = this.settingsInfo.totalEligibleEmployees;
            }
            this.excludedStateList = stateList.split(",");
            this.checkForExcludedStates(this.benefitOfferingStates);
        });
    }
    /**
     * Checks for states which are excluded from benefit dollars
     *
     * @param states - Snapshot of benefit offering state
     */
    checkForExcludedStates(states: CountryState[]): void {
        this.excludedStateList.forEach((excludedState) => {
            const matchedState = states.find((state) => state.abbreviation === excludedState);
            if (matchedState) {
                this.invalidStates.push(matchedState.name);
                this.stateNYorOH = true;
            }
        });
        this.validStates = states.filter((state) => !this.excludedStateList.find((excludedState) => excludedState === state.abbreviation));
    }

    /**
     * set up flags and get benefit dollars when necessary
     */
    setupBenefitDollar(): void {
        // there's only 1 approval request that's submitted at any given time
        const unapprovedApprovalRequest = this.data.approvalRequests
            .filter((x) => x.status === ApprovalRequestStatus.SUBMITTED_TO_HR)
            .pop();
        if (unapprovedApprovalRequest) {
            const unapprovedBenefitDollars = this.isBenefitDollarsEnabled
                ? unapprovedApprovalRequest.approvalItems.filter((item) => item.object === ApprovalItemObject.BENEFIT_DOLLARS)
                : [];
            const unapprovedNonBenefitDollars = unapprovedApprovalRequest.approvalItems.filter(
                (item) => item.object !== ApprovalItemObject.BENEFIT_DOLLARS,
            );
            this.unapprovedRequestContainsBenefitDollars = unapprovedBenefitDollars.length > 0 && unapprovedNonBenefitDollars.length > 0;
            this.hasOnlyUnapprovedNonBenefitDollars = unapprovedNonBenefitDollars.length > 0 && unapprovedBenefitDollars.length === 0;
            this.hasOnlyUnapprovedBenefitDollars = unapprovedBenefitDollars.length > 0 && unapprovedNonBenefitDollars.length === 0;
            if (unapprovedBenefitDollars.length > 0) {
                this.accountService
                    .getFlexDollars(this.mpGroup.toString(), "applicableProductId", true)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe((benefitDollars: FlexDollar[]) => {
                        this.setupBenefitDollarDataFromAPI(benefitDollars, unapprovedBenefitDollars);
                    });
                this.setupErisaContent();
            }
        }
    }

    /**
     * set up benefit dollar data from API
     * @param benefitDollars a list of benefit dollars to be approved from the API
     * @param unapprovedBenefitDollars a list of unapproved benefit dollars
     */
    setupBenefitDollarDataFromAPI(benefitDollars: FlexDollar[], unapprovedBenefitDollars: ApprovalItem[]): void {
        this.benefitDollarList = benefitDollars;
        this.benefitDollarList.sort((a, b) => (a.id > b.id ? 1 : b.id > a.id ? -1 : 0));
        benefitDollars.forEach((benefitDollar) => {
            const unapprovedRequestItem = unapprovedBenefitDollars.find((unapproved) => unapproved.objectId === benefitDollar.id);
            if (unapprovedRequestItem) {
                if (unapprovedRequestItem.action === ApprovalItemAction.DELETE) {
                    this.benefitDollarDataList.push({
                        benefitDollarStatus: BenefitDollarStatus.REMOVED,
                        benefitDollarData: {
                            id: benefitDollar.id,
                        },
                    });
                } else {
                    this.benefitDollarDataList.push({
                        benefitDollarStatus: BenefitDollarStatus.NOT_EDITED,
                        benefitDollarData: {
                            id: benefitDollar.id,
                        },
                    });
                }
            }
        });
    }

    /**
     * get ERISA content
     */
    setupErisaContent(): void {
        this.staticUtilService
            .cacheConfigValue("general.download.erisa.url")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((erisaCertFormLink) => {
                this.erisaMessage = this.erisaMessage
                    .replace("##anchorstart##", `<a target="_blank" href="${erisaCertFormLink}">`)
                    .replace("##anchorend##", "</a>");
                this.erisaMessage = this.erisaMessage.replace(/(##boldstart##)/g, "<b>").replace(/(##boldend##)/g, "</b>");
                this.erisaMessage = this.erisaMessage.replace(/(##underlinestart##)/g, "<u>").replace(/(##underlineend##)/g, "</u>");
                this.erisaMessageHtml = this.domSanitizer.bypassSecurityTrustHtml(this.erisaMessage);
            });
    }

    /**
     * Trust the given value to be a safe style URL
        @param url document location URL
        @return SafeHtml
     */
    downloadPdf(url: string): SafeHtml {
        return this.domSanitizer.bypassSecurityTrustResourceUrl(url);
    }

    /**
     * Moves to next step in checklist. Show error if applicable.
     */
    onNext(): void {
        ++this.stepperIndex;
        if (
            !this.hasOnlyUnapprovedBenefitDollars &&
            ((this.stepperIndex === this.CARRIER_FORM_WITHOUT_BENEFIT_DOLLAR_STEP && this.hasOnlyUnapprovedNonBenefitDollars) ||
                (this.stepperIndex === this.CARRIER_FORM_WITH_BENEFIT_DOLLAR_STEP && this.unapprovedRequestContainsBenefitDollars))
        ) {
            this.showErrorMessage = false;
        }
        if (this.verticalStepper.selected !== undefined) {
            this.verticalStepper.selected.completed = true;
        }
    }

    /**
     * Decrements the stepperIndex by 1 to move checklist to previous step.
     */
    onBack(): void {
        --this.stepperIndex;
    }

    closeModal(state: string): void {
        this.dialogRef.close(state);
    }

    getProducerDetails(id: string): void {
        this.isLoading = true;
        this.accountService
            .getAccountProducer(id, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.isLoading = false;
                    if (response) {
                        this.producer = response;
                        this.producerName = `${response.producer.name.firstName} ${response.producer.name.lastName}`;
                    }
                },
                (error) => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * This method is used to filter current account using mpGroup from AccountList
     *
     * When the user logged in manually and coming through accountList,
     * accountDetail contains content which has accountList data
     *
     * When the user logged in via email and directly landing on dashboard,
     * accountDetail will not contain content, accountDetail contains accountList
     */
    getCensusEstimate(): void {
        let currentAccount;
        const accountDetail = this.utilService.copy(this.store.selectSnapshot(AccountListState.getAccountList));
        if (accountDetail && accountDetail.content) {
            currentAccount = accountDetail.content.filter((accountData) => accountData.id.toString() === this.mpGroup).pop();
        } else if (accountDetail && accountDetail.length) {
            currentAccount = accountDetail.filter((accountData) => accountData.id.toString() === this.mpGroup).pop();
        }
        this.setEmployeeCount(currentAccount);
    }
    /**
     * This method is used to set the employee count from AccountList
     * @param currentAccount is filtered account from AccountList based on mpGroup
     */
    setEmployeeCount(currentAccount: AccountList): void {
        if (currentAccount && currentAccount.employeeCount > 0) {
            this.employeeCount = currentAccount.employeeCount;
        }
    }

    downloadDocument(): void {
        this.isLoading = true;
        this.memberService
            .downloadActiveMemberCensus()
            .pipe(take(1))
            .subscribe((data) => {
                const blob = new Blob([data], {
                    type: "application/vnd.ms-excel",
                });

                /*
                source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                Typescript won't know this is a thing, so we have to use Type Assertion
                */
                if ((window.navigator as any).msSaveOrOpenBlob) {
                    (window.navigator as any).msSaveOrOpenBlob(blob);
                } else {
                    const fileurl = URL.createObjectURL(blob);
                    window.open(fileurl, "_blank");
                }
                this.isLoading = false;
            });
    }

    /**
     * Open agreements or carrier forms change request modal.
     *
     * @param requestAgreementsChange indicates change request type: true = agreements, false = carrier forms
     */
    showRequestChangeModal(requestAgreementsChange: boolean): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.maxWidth = "600px";
        if (requestAgreementsChange) {
            dialogConfig.data = {
                isAgreementsChangeRequest: true,
            };
        }
        const dialogRef = this.dialog.open(RequestChangesDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((response) => {
            if (response) {
                this.requestChanges(response);
            }
        });
    }

    /**
     * request changes to approval request
     * @param changes the note HR admin has for the producer about the changes
     */
    requestChanges(changes: string): void {
        const payLoadObject = {
            action: "DECLINE",
            requestedChanges: changes,
            signature: this.data.admin.adminId,
            approvedFlexDollarOrIncentives: this.unapprovedRequestContainsBenefitDollars
                ? this.getApprovedBenefitDollarsForAPIRequest()
                : [],
        };
        this.submitRequest(payLoadObject);
        // override the refresh account behavior when HR admin requests for changes
        this.aflacService.refreshAccount(this.mpGroup.toString(), true).pipe(takeUntil(this.unsubscribe$)).subscribe();
    }

    /**
     * Function called when review is completed and all forms are view only.
     */
    finishReviewAndSignOff(): void {
        this.showErrorMessage = this.carrierData.some((data) => !data.documentViewed || !this.isProcessMasterApproved);
        if (!this.showErrorMessage) {
            const adminName = this.data.admin.username;
            const carrierFormMap = new Map();
            this.carrierData.forEach((carrier) => {
                const carrierForm = carrier.carrierForms.find((form) => form.approvedBy && form.approvedBy.name != null);
                const signature = carrierForm ? carrierForm.approvedBy.name : adminName;

                carrierFormMap.set(carrier.carrier.id.toString(), signature);
            });

            const signatures: string = JSON.stringify([...carrierFormMap]);
            const payLoadObject = {
                action: APPROVE,
                signatures: signatures,
                approvedFlexDollarOrIncentives: this.unapprovedRequestContainsBenefitDollars
                    ? this.getApprovedBenefitDollarsForAPIRequest()
                    : [],
            };
            this.submitRequest(payLoadObject);
            // override the refresh account behavior when HR admin approves the account
            this.aflacService.refreshAccount(this.mpGroup.toString(), true).pipe(takeUntil(this.unsubscribe$)).subscribe();
        }
    }

    /**
     * Send form data to server for processing.
     * @param payload parameters to be sent in http post request
     */
    submitRequest(payload: any): void {
        this.isLoading = true;
        this.benefitOfferingService
            .respondToApprovalRequest(this.mpGroup, payload)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.closeModal(this.SAVE);
                    this.isLoading = false;
                },
                (error) => {
                    this.isLoading = false;
                    this.displaySubmitError(error);
                },
            );
    }
    /**
     * This method is used to display submit error status and error code defined error messages
     * @param error is the HttpErrorResponse
     */
    displaySubmitError(error: HttpErrorResponse): void {
        this.hasSubmitApiError = true;
        if (error.status === ClientErrorResponseCode.RESP_409) {
            this.errorMessage = this.languageStrings[CANCELLED_REQUEST];
        } else {
            this.errorMessage = this.languageStrings[SERVER_TIMEOUT];
        }
    }
    /**
     * open the modal to remove benefit dollar
     * @param benefitDollar the flex dollar object to be removed
     * @param index the benefit dollar index
     */
    openRemoveBenefitDollarModal(benefitDollar: FlexDollar, index: number): void {
        const modalRef = this.empoweredModalService.openDialog(RemoveBenefitDollarModalComponent, {
            data: benefitDollar.name,
        });
        modalRef
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((resp) => resp === true),
            )
            .subscribe((resp) => {
                this.benefitDollarDataList[index].benefitDollarStatus = BenefitDollarStatus.REMOVED;
            });
    }

    /**
     * open the modal to edit benefit dollar
     * @param benefitDollar the flex dollar object to be edited
     * @param index the benefit dollar index
     */
    openEditBenefitDollarModal(benefitDollar: FlexDollar, index: number): void {
        const modalRef = this.empoweredModalService.openDialog(EditBenefitDollarModalComponent, {
            data: benefitDollar,
        });
        modalRef
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((resp) => resp !== undefined && resp !== null),
            )
            .subscribe((resp) => {
                this.benefitDollarDataList[index].benefitDollarStatus = BenefitDollarStatus.EDITED;
                this.benefitDollarDataList[index].benefitDollarData.amount = resp.amount;
                this.benefitDollarDataList[index].benefitDollarData.contributionType = resp.contributionType;
            });
    }

    /**
     * open the modal to undo removal benefit dollar
     * @param index the benefit dollar index
     */
    openUndoRemoveBenefitDollarModal(index: number): void {
        const modalRef = this.empoweredModalService.openDialog(UndoRemoveBenefitDollarModalComponent);
        modalRef
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((resp) => resp === true),
            )
            .subscribe((resp) => {
                this.benefitDollarDataList[index].benefitDollarStatus =
                    this.benefitDollarDataList[index].benefitDollarData.contributionType !== undefined
                        ? BenefitDollarStatus.EDITED
                        : BenefitDollarStatus.NOT_EDITED;
            });
    }

    /**
     * approve benefit dollars
     */
    approveBenefitDollars(): void {
        const payloadObject = {
            action: APPROVE,
            approvedFlexDollarOrIncentives: this.getApprovedBenefitDollarsForAPIRequest(),
        };
        this.isLoading = true;
        this.benefitOfferingService
            .respondToApprovalRequest(this.mpGroup, payloadObject)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.closeModal(this.SAVE);
                    this.isLoading = false;
                },
                (error) => {
                    this.isLoading = false;
                    this.displaySubmitError(error);
                },
            );
    }

    /**
     * prepare the list of approved benefit dollars for API call
     * @returns a list of benefit dollars to persist in the database
     */
    getApprovedBenefitDollarsForAPIRequest(): ApprovedBenefitDollarData[] {
        return this.benefitDollarDataList
            .filter((data) => data.benefitDollarStatus !== BenefitDollarStatus.REMOVED)
            .map((benefitDollarTobeSubmitted) => {
                const submittedData = {
                    id: benefitDollarTobeSubmitted.benefitDollarData.id,
                    amount: benefitDollarTobeSubmitted.benefitDollarData.amount,
                    contributionType: benefitDollarTobeSubmitted.benefitDollarData.contributionType,
                } as ApprovedBenefitDollarData;
                if (benefitDollarTobeSubmitted.benefitDollarStatus !== BenefitDollarStatus.EDITED) {
                    delete submittedData.amount;
                    delete submittedData.contributionType;
                }
                return submittedData;
            });
    }

    /**
     * Open ViewDocument modal on click of sign/review button of a carrier form
     * @param carrier : Carrier data
     */
    openDocument(carrier: CarrierData): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.width = "900px";
        const dialogData: ViewDocumentDialogData = {
            viewOnly: carrier.viewOnly,
            signatureRequired: carrier.signatureRequired,
            signingAdmin: carrier.carrierForms[0].approvedBy ? carrier.carrierForms[0].approvedBy.name : null,
            dateSigned: carrier.carrierForms[0].accountApprovalDate,
            approvedByAdminId: this.data.admin.adminId,
            carrier: carrier.carrier,
            mpGroup: this.mpGroup,
            isVAS: carrier.isVAS,
            isQ60: carrier.carrier.id === CarrierId.AFLAC && carrier.carrierForms.some((form) => form.carrierFormId !== null),
            vasContentTag: carrier.vasContentTag,
            formId: carrier.carrierForms[0].carrierFormId,
            planName: carrier.planName,
            carrierFormNames: carrier.carrierFormNames,
            documentViewed: carrier.documentViewed,
        };
        dialogConfig.data = dialogData;
        const dialogRef = this.dialog.open(ViewDocumentDialogComponent, dialogConfig);
        dialogRef.afterClosed().subscribe((response) => {
            // Don't call save carrier api on closing the document
            if (response && response.action === this.SAVE && !response.status) {
                this.saveCarrierSetupStatus(carrier, response.signature);
            } else if (response && response.action === CLOSE) {
                carrier.documentViewed = true;
            }
            if (response && response.status) {
                this.isProcessMasterApproved = response.status === PROCESS_MASTERAPP_ENUM.APPROVED;
                this.isLoading = false;
                carrier.carrierForms = carrier.carrierForms.map((form) => ({
                    ...form,
                    accountApprovalDate: this.datePipe.transform(
                        new Date().toLocaleString(EN_US, { timeZone: EST_TIME_ZONE }),
                        DateFormats.DATE_FORMAT_Y_M_D_TH_M_S,
                    ),
                    approvedBy: {
                        accountAdminId: this.data.admin.adminId,
                        name: response.signature,
                    },
                }));
                carrier.documentViewed = true;
                carrier.signatureRequired = false;
                this.allFormsSigned = this.carrierData.every((data) => data.documentViewed);
            }
        });
    }

    /**
     * Call processMasterApp API if there was a failure during carrier form submission
     */
    procesMasterApp(): void {
        this.aflacService
            .processMasterAppApprovals(this.mpGroup.toString())
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((resp) => {
                    if (resp === PROCESS_MASTERAPP_ENUM.APPROVED) {
                        this.isProcessMasterApproved = true;
                    } else if (resp === PROCESS_MASTERAPP_ENUM.DENIED) {
                        this.isProcessMasterApproved = false;
                        this.buttonText = this.languageStrings[RESEND_LANG];
                    }
                }),
                catchError((error) => {
                    this.isProcessMasterApproved = false;
                    this.buttonText = this.languageStrings[RESEND_LANG];
                    return EMPTY;
                }),
            )
            .subscribe();
    }

    /**
     * Api call to save carrier setup status after admin review
     * @param carrier: Carrier data
     * @param signature: admin signature
     */
    saveCarrierSetupStatus(carrier: CarrierData, signature: string): void {
        this.isLoading = true;
        const adminSignature = signature ? signature : this.data.admin.username;
        forkJoin(
            carrier.carrierForms.map((carrierForm) => {
                const setupPayload: SaveCarrierSetupStatus = {
                    accountApprovalDate: this.datePipe.transform(
                        new Date().toLocaleString(EN_US, { timeZone: EST_TIME_ZONE }),
                        DateFormats.DATE_FORMAT_Y_M_D_TH_M_S,
                    ),
                    approvedByAdminId: this.data.admin.adminId,
                    carrierFormId: carrierForm.carrierFormId,
                    status: CarrierFormSetupStatus.PENDING,
                    signature: adminSignature,
                };
                return this.benefitOfferingService.saveCarrierSetupStatus(this.mpGroup, carrier.carrier.id, setupPayload);
            }),
        )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.isLoading = false;
                    carrier.carrierForms = carrier.carrierForms.map((form) => ({
                        ...form,
                        accountApprovalDate: this.datePipe.transform(
                            new Date().toLocaleString(EN_US, { timeZone: EST_TIME_ZONE }),
                            DateFormats.DATE_FORMAT_Y_M_D_TH_M_S,
                        ),
                        approvedBy: {
                            accountAdminId: this.data.admin.adminId,
                            name: adminSignature,
                        },
                    }));
                    carrier.documentViewed = true;
                    carrier.signatureRequired = false;
                },
                () => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * fetching language strings
     */
    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.dashboard.adminApprovalChecklist.reviewSignoff",
            "primary.portal.dashboard.adminApprovalChecklist.AccountSetup",
            "primary.portal.dashboard.adminApprovalChecklist.welcome",
            "primary.portal.dashboard.adminApprovalChecklist.employeeCensus",
            "primary.portal.dashboard.adminApprovalChecklist.benefitDollars",
            "primary.portal.dashboard.adminApprovalChecklist.carrierForms",
            "primary.portal.dashboard.adminApprovalChecklist.logout",
            "primary.portal.common.back",
            "primary.portal.dashboard.adminApprovalChecklist.requestChanges",
            "primary.portal.dashboard.adminApprovalChecklist.getStarted",
            "primary.portal.common.next",
            "primary.portal.common.approve",
            "primary.portal.admin.resend",
            "primary.portal.admin.sending",
            "primary.portal.dashboard.adminApprovalChecklist.yourAccountReady",
            "primary.portal.dashboard.adminApprovalChecklist.yourAccountReadyDesc",
            "primary.portal.dashboard.adminApprovalChecklist.yourAccountUpdated",
            "primary.portal.dashboard.adminApprovalChecklist.yourAccountUpdatedDesc",
            "primary.portal.dashboard.adminApprovalChecklist.reviewYourEmployeeSensus",
            "primary.portal.dashboard.adminApprovalChecklist.reviewYourEmployeeSensusDesc",
            "primary.portal.dashboard.adminApprovalChecklist.estimatedEmployees",
            "primary.portal.dashboard.adminApprovalChecklist.employeeCensusTitle",
            "primary.portal.dashboard.adminApprovalChecklist.downloadMostRecent",
            "primary.portal.dashboard.adminApprovalChecklist.finalizeForms",
            "primary.portal.dashboard.adminApprovalChecklist.finalizeFormsDesc",
            "primary.portal.dashboard.adminApprovalChecklist.Review",
            "primary.portal.dashboard.adminApprovalChecklist.viewDetails",
            "primary.portal.dashboard.adminApprovalChecklist.sign",
            "primary.portal.dashboard.adminApprovalChecklist.viewSignedDocument",
            "primary.portal.dashboard.adminApprovalChecklist.submitSignedDoc",
            "primary.portal.dashboard.adminApprovalChecklist.approvalSubmit",
            "primary.portal.dashboard.adminApprovalChecklist.finishReview",
            "primary.portal.dashboard.adminApprovalChecklist.limitedAccess",
            "primary.portal.dashboard.adminApprovalChecklist.limitedAccessDesc",
            "primary.portal.dashboard.adminApprovalChecklist.gotIt",
            "primary.portal.dashboard.adminApprovalChecklist.processMasterAppError",
            "primary.portal.dashboard.adminApprovalChecklist.benefitDollars.headerMessage",
            "primary.portal.dashboard.adminApprovalChecklist.benefitDollars.employerContribution",
            "primary.portal.maintenanceBenefitsOffering.benefitDollar.notAvailableForEnrollments",
            "primary.portal.maintenanceBenefitsOffering.benefitDollar.statesNotAvailableForEnrollments",
            "primary.portal.maintenanceBenefitsOffering.benefitDollar.notAllowedInState",
            "primary.portal.maintenanceBenefitsOffering.benefitDollar.statesNotAllowed",
            "primary.portal.dashboard.adminApprovalChecklist.agreements",
            "primary.portal.dashboard.adminApprovalChecklist.agreementsSubtitle",
            AGREE_AND_FINISH,
            I_AGREE,
            EZ_SHIELD_AGREEMENT,
            VAS_AGREEMENT,
            "group.plan.adv.acknowledgement1",
            "group.plan.capEr.acknowledgement1",
            "group.plan.fraudProtection.acknowledgement2",
            "group.plan.telemedicine.acknowledgement1",
            "group.plan.wageworksHsa.acknowledgement1",
            CANCELLED_REQUEST,
            SERVER_TIMEOUT,
            "primary.portal.dashboard.adminApprovalChecklist.exit",
            "primary.portal.dashboard.adminApprovalChecklist.californiaRequirement",
            "primary.portal.dashboard.adminApprovalChecklist.californiaRequirement.download",
            "primary.portal.dashboard.adminApprovalChecklist.californiaRequirement.description",
        ]);
    }
    /**
     * function to check NY situs with RSLI carrier
     * @param carrierId selected carrierId
     * @returns true for NY situs with RSLI carrier
     */
    isSitusNyRSLI(carrierId: number): boolean {
        return this.isSitusState && carrierId === CarrierId.RSLI;
    }

    /**
     * Agree to Argus/VAS statements and move to next step or sign off.
     *
     * @param signOff indicates whether agreement is final step
     */
    agreeToStatements(signOff: boolean): void {
        if (signOff) {
            this.finishReviewAndSignOff();
        } else {
            this.onNext();
        }
    }

    /**
     * Update stepperIndex on valid step selection.
     *
     * @param selectedIndex index of selected step
     */
    stepperSelectionChange(selectedIndex: number): void {
        this.stepperIndex = selectedIndex;
    }

    /**
     * Unsubscribing the subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
