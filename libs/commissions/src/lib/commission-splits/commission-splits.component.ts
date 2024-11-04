import { Component, OnInit, OnDestroy } from "@angular/core";
import {
    AflacService,
    CommissionSplit,
    CommissionSplitOperation,
    RULE_CONSTANT,
    AccountService,
    StaticService,
    BenefitsOfferingService,
    CommonRule,
    ProducerSearch,
    AccountDetails,
    Situs,
    CoverageDetails,
} from "@empowered/api";
import { UserService } from "@empowered/user";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { MatDialog } from "@angular/material/dialog";
import { CommissionsState, AccountInfoState, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { Store, Select } from "@ngxs/store";
import { Observable, forkJoin, Subscription, Subject, of } from "rxjs";
import { takeUntil, map, tap, catchError, switchMap, filter } from "rxjs/operators";
import { DatePipe } from "@angular/common";
import {
    ClientErrorResponseCode,
    DateFormats,
    Permission,
    PagePrivacy,
    AccountImportTypes,
    ROLE,
    CompanyCode,
    SITCode,
    WritingNumberSitCode,
    WritingNumber,
    AccountProducer,
    AppSettings,
    CarrierId,
    ProducerCredential,
} from "@empowered/constants";
import { PhoneFormatConverterPipe, MonDialogData, MonDialogComponent, State } from "@empowered/ui";
import { MPGroupAccountService, SharedService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

const DEFAULT_US = "default US";
const DEFAULT_US_SELF_ENROLL = "US";
const NAME = "##name##";
const EMAIL = "##email##";
const PHONE = "##phone##";

@Component({
    selector: "empowered-commission-splits",
    templateUrl: "./commission-splits.component.html",
    styleUrls: ["./commission-splits.component.scss"],
})
export class CommissionSplitsComponent implements OnInit, OnDestroy {
    loggedInProducerId: number;
    loggedInProducerRole: string;
    mpGroup: any;
    commissionSplits: CommissionSplit[];
    addCommissionSplit: CommissionSplit;
    getSitCodesSubscribers: Subscription;
    expandedView: boolean;
    displayedColumns: string[] = ["percent", "producer", "sitCodeId", "writingNumber"];
    companyCode: CompanyCode;
    rulesList: any[];
    producerList: ProducerSearch[];
    stateList: State[];
    languageStrings: Record<string, string>;
    operation = {
        ADD: "ADD",
        EDIT: "EDIT",
    };
    companyCodes = {
        NY: CompanyCode.NY,
        US: CompanyCode.US,
        MI: CompanyCode.MI,
    };
    role: string;
    editView = false;
    allWritingNumbers: WritingNumber[] = [];
    sitCodes: SITCode[];
    activeSitCodes: WritingNumberSitCode[] = [];
    expiredSitCodes: WritingNumberSitCode[] = [];
    addView = false;
    view: any;
    edit: any;
    delete: any;
    add: any;
    DISABLE = "disable";
    ENABLE = "enable";
    errorMessage: string;
    errorMessageArray = [];
    ERROR = "error";
    DETAILS = "details";
    isDirect: boolean;
    userCompanycode: string;
    @Select(CommissionsState) commissionState$: Observable<any>;
    commissionstateSubscriber: Subscription;
    getAccountProducerSubscriber: Subscription;
    getStateSubscriber: Subscription;
    deleteCommissionSplitSubscriber: Subscription;
    checkExpiredPlanYearForCarrierSubscriber: Subscription;
    isSpinnerLoading = false;
    nonEligibleCarriersForSplit: number[] = [];
    CARRIER_APPROVAL_CONFIG = "broker.non_aflac_carriers_that_require_planyear_approval";
    PAYROLL = "PAYROLL";
    carriersForApproval: string[];
    isEnrollerRole: boolean;
    loggedInProducerIsReportingManager: boolean;
    reportingManagersOf: AccountProducer[];
    secondaryLanguageString: Record<string, string>;
    isPayrollGroup: Observable<boolean> = this.mpGroupAccountService.mpGroupAccount$.pipe(
        map((account) => account.partnerAccountType === this.PAYROLL),
    );
    isProducer = false;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    subscriptions: Subscription[] = [];
    DUPLICATE_CHECK_ENABLE_CONFIG = "broker.commission_split.duplicate_check_enable";
    isDuplicateCheckEnabled: boolean;
    DAYS_BEFORE_EXPIRATION_CONFIG = "broker.commission_split.sit_codes_warnings.days_before_expiration";
    daysBeforeExpiration: number;
    selfEnrollmentFlag = false;
    eFinancePermission = false;
    stateDisplayTextNY: string;
    stateDisplayTextMI: string;
    currentAccount: AccountDetails;
    accountImportType = AccountImportTypes;
    situs: Situs;
    isRepairRequiredCommissionSplit = false;
    repairRequiredEnrollerError: string;
    producerId: number;
    isEnroller: boolean;
    isPrivacyOnForEnroller: boolean;
    constructor(
        private readonly aflac: AflacService,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly dialog: MatDialog,
        private readonly accountService: AccountService,
        private readonly staticService: StaticService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly datePipe: DatePipe,
        private readonly staticUtilService: StaticUtilService,
        private readonly mpGroupAccountService: MPGroupAccountService,
        private readonly sharedService: SharedService,
        private readonly userService: UserService,
        private readonly dateService: DateService,
    ) {
        this.expandedView = false;
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((memberInfo: ProducerCredential) => {
            this.producerId = memberInfo.producerId;
        });
        this.sharedService
            .checkAgentSelfEnrolled()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.selfEnrollmentFlag = response;
            });
        this.staticUtilService
            .cacheConfigValue(this.CARRIER_APPROVAL_CONFIG)
            .pipe(takeUntil(this.unsubscribe$.asObservable()))
            .subscribe((carriersForApproval) => {
                this.carriersForApproval = carriersForApproval.split(",");
            });
        this.subscriptions.push(
            this.staticUtilService.cacheConfigValue(this.DAYS_BEFORE_EXPIRATION_CONFIG).subscribe((response) => {
                this.daysBeforeExpiration = Number(response);
            }),
        );
        this.isEnroller = this.store.selectSnapshot(SharedState.getPrivacyForEnroller);
        if (this.isEnroller) {
            this.isPrivacyOnForEnroller = this.sharedService.getPrivacyConfigforEnroller(PagePrivacy.COMMISSIONS_SPLIT);
        }
    }

    /**
     * Life cycle hook to initialize the component.
     * Get company code and sit code details
     * Get values from commission store
     * Get producer and state details
     * Get language strings
     * Initialize add commission split form
     */
    ngOnInit(): void {
        this.currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        this.getLanguageStrings();
        this.subscriptions.push(
            this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*")).subscribe(() => {
                this.getSecondaryLanguageStrings();
            }),
        );
        this.getCompanyCode();
        this.getEFinancePermission();
        this.commissionstateSubscriber = this.commissionState$.subscribe((state: any) => {
            this.mpGroup = state.groupId;
            this.loggedInProducerId = state.role && state.role.id;
            this.loggedInProducerRole = state.role && state.role.name;
            this.loggedInProducerIsReportingManager = state.role && state.role.isReportingManager;
            this.reportingManagersOf = state.role && state.role.reportingManagerOf;
            this.isDirect = state.isDirect;
            this.isEnrollerRole = this.loggedInProducerRole === ROLE.ENROLLER;
        });
        this.getSitCodes();
        this.loadProducers();
        this.loadStates();
        this.initializeAddForm();
        this.loadRulesList();
        this.isProducer = this.store.selectSnapshot(SharedState.portal) === AppSettings.PORTAL_PRODUCER;
    }

    /**
     * Function to initialize the add form.
     * Commission Split object gets initialized.
     * @returns void
     */
    initializeAddForm(): void {
        this.addCommissionSplit = {
            name: "",
            assignments: [],
            rules: [],
            conversion: false,
        };
    }
    /**
     * method to initialize all the primary language strings
     * @returns void
     */
    getLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.commissionSplit.addUpdate.ruleWritingProducer",
            "primary.portal.commissionSplit.addUpdate.ruleProduct",
            "primary.portal.commissionSplit.addUpdate.ruleState",
            "primary.portal.commissionSplit.addUpdate.ruleDate",
            "primary.portal.commissionSplit.addUpdate.ruleCarrier",
            "primary.portal.commissionSplit.addUpdate.ruleEnrollMethod",
            "primary.portal.commissionSplit.commission.RemoveTitle",
            "primary.portal.common.remove",
            "primary.portal.common.cancel",
            "primary.portal.common.edit",
            "primary.portal.common.and",
            "primary.portal.commissionSplit.commission.title",
            "primary.portal.commissionSplit.commission.description",
            "primary.portal.commissionSplit.commission.addCustomized",
            "primary.portal.commissionSplit.commission.splitSection",
            "primary.portal.commissionSplit.commission.AppliedWhen",
            "primary.portal.commissionSplit.commission.overriddenMessage",
            "primary.portal.commissionSplit.addUpdate.add.header",
            "primary.portal.commissionSplit.addUpdate.edit.header",
            "primary.portal.direct.commissionSplit.commission.description",
            "primary.portal.commissionSplit.commission.anyExcept",
            "primary.portal.commissionSplit.addUpdate.partnerCarrier.editTooltip",
            "primary.portal.accountEnrollments.commissionSplitNotApplicable",
            "primary.portal.commissionSplit.repairRequires.error",
            "primary.portal.commissionSplit.repairRequires.enrollerError",
        ]);
    }

    /**
     * method to initialize all the secondary language strings
     * @returns void
     */
    getSecondaryLanguageStrings(): void {
        this.secondaryLanguageString = this.language.fetchSecondaryLanguageValues([
            "secondary.portal.commissionSplit.activeSitCodes.singleRecord",
            "secondary.portal.commissionSplit.activeSitCodes.multipleRecordsHeader",
            "secondary.portal.commissionSplit.activeSitCodes.multipleRecords",
            "secondary.portal.commissionSplit.expiredSitCodes.singleRecord",
            "secondary.portal.commissionSplit.expiredSitCodes.multipleRecordsHeader",
            "secondary.portal.commissionSplit.expiredSitCodes.multipleRecords",
        ]);
    }

    /**
     * Get state of company situs.
     */
    getCompanyCode(): void {
        const companyCode = this.store.selectSnapshot(CommissionsState.companyCode);
        if (companyCode) {
            this.companyCode = companyCode === CompanyCode.NY ? CompanyCode.NY : CompanyCode.US;
        } else {
            this.situs = this.store.selectSnapshot(CommissionsState.situs);
            if (this.situs) {
                this.companyCode = this.situs.state?.abbreviation === CompanyCode.NY ? CompanyCode.NY : CompanyCode.US;
            }
        }
    }

    /**
     * method to get all sit codes
     * @returns void
     */
    getSitCodes(): void {
        this.getSitCodesSubscribers = forkJoin([
            this.aflac.getSitCodes(this.companyCodes.US, true, true, this.mpGroup?.toString()),
            this.aflac.getSitCodes(this.companyCodes.NY, true, true, this.mpGroup?.toString()),
        ]).subscribe((response) => {
            let userCompanyCodes = "";
            if (response && response.length === 2) {
                const allSitCodes: SITCode[] = [];
                this.allWritingNumbers = [];
                this.expiredSitCodes = [];
                if (response[0] && response[0].length) {
                    userCompanyCodes = userCompanyCodes + this.companyCodes.US;
                    this.allWritingNumbers.push(...response[0]);
                    response[0].forEach((writingNumber) => {
                        allSitCodes.push(...writingNumber.sitCodes);
                    });
                }
                if (response[1] && response[1].length) {
                    userCompanyCodes = userCompanyCodes + this.companyCodes.NY;
                    this.allWritingNumbers.push(...response[1]);
                    response[1].forEach((writingNumber) => {
                        allSitCodes.push(...writingNumber.sitCodes);
                    });
                }
                this.sitCodes = allSitCodes;
                this.getActiveAndExpiredSitCodes();
            }
            this.userCompanycode = userCompanyCodes;
        });
    }
    /**
     * Method to get the company code.
     * @param element list of commission split details.
     * @returns companyCode
     */
    getCompanyCodeforSplit(element: any): string {
        let companyCode = "";
        const splitName = this.selfEnrollmentFlag ? DEFAULT_US_SELF_ENROLL : DEFAULT_US;
        if (
            element.assignments.length &&
            element.assignments[0].sitCodeId &&
            element.assignments[0].producer.producerId &&
            (!element.rules.length || (element.rules.length && !element.rules[0].states))
        ) {
            const producerDetails = this.producerList.find(
                (producerObj) => producerObj.producer.id === element.assignments[0].producer.producerId,
            );
            if (producerDetails) {
                producerDetails.producer.writingNumbers.forEach((writingNum) => {
                    const sitcodeObj = writingNum.sitCodes.find((sitcode) => sitcode.id === element.assignments[0].sitCodeId);
                    // TODO: add condition for direct groups, need to speak with BA about this
                    const defaultNY = this.sitCodes.find(
                        (sitCode) =>
                            sitCode.id === element.assignments[0].sitCodeId && sitCode.companyCode === CompanyCode.NY && !sitCode.active,
                    );
                    if (sitcodeObj) {
                        companyCode = sitcodeObj.companyCode;
                    } else if (defaultNY && element.defaultFor) {
                        companyCode = defaultNY.companyCode;
                    } else if (!companyCode.length && !sitcodeObj) {
                        companyCode = this.companyCode === CompanyCode.NY ? CompanyCode.NY : CompanyCode.US;
                    }
                });
            }
        } else if (
            element.assignments.length &&
            element.assignments[0].sitCodeId &&
            element.assignments[0].producer.producerId &&
            element.rules[0].states &&
            this.eFinancePermission
        ) {
            companyCode = this.companyCodes.MI;
        }
        return companyCode;
    }

    /**
     * Method to get the commission splits and also set the text to be displayed for MI and NY.
     *
     * @returns observable with an array of CommissionSplit results
     */
    getCommissionSplits(): Observable<CommissionSplit[]> {
        return this.aflac.getCommissionSplits(this.mpGroup).pipe(
            tap((Response) => {
                this.isSpinnerLoading = false;
                this.commissionSplits = Response;

                this.isRepairRequiredCommissionSplit = Boolean(
                    this.commissionSplits.some((commissionSplit) => commissionSplit.repairRequired),
                );

                this.stateDisplayTextNY = this.getDisplayTextOfStates(this.companyCodes.NY);
                this.stateDisplayTextMI = this.getDisplayTextOfStates(this.companyCodes.MI);

                this.commissionSplits.forEach((element) => {
                    element.splitCompanyCode = this.getCompanyCodeforSplit(element);
                    element.isDefault = Boolean(element.defaultFor);
                    element.isPartnerCarrierSplit = Boolean(
                        element.rules.find((rule) => rule.type === RULE_CONSTANT.CARRIER && rule.carrierId !== CarrierId.AFLAC),
                    );
                    if (element.isPartnerCarrierSplit) {
                        const carrierRule = element.rules.find((rule) => rule.type === RULE_CONSTANT.CARRIER);
                        const carrierId = carrierRule.carrierId;
                        if (this.nonEligibleCarriersForSplit.indexOf(carrierId) === -1) {
                            this.nonEligibleCarriersForSplit.push(carrierId);
                        }
                        this.checkExpiredPlanYearForCarrierSubscriber = this.checkExpiredPlanYearForCarrier(carrierId).subscribe((flag) => {
                            element.disablePartnerCarrierSplit = flag === this.DISABLE;
                            element["editButtonTooltipText"] =
                                flag === this.DISABLE
                                    ? this.languageStrings["primary.portal.commissionSplit.addUpdate.partnerCarrier.editTooltip"]
                                    : "";
                        });
                    }
                    element = this.setEditRemoveViewOperations(element);
                    element.expandedView = false;
                });
            }),
            catchError((httpError) => {
                this.isSpinnerLoading = false;
                this.showErrorAlertMessage(httpError);
                return of([]);
            }),
        );
    }

    /**
     * Set edit, remove and view flags to commission split based on logged in user role
     * @param commission commission split object
     * @returns commissionSplit object
     */
    setEditRemoveViewOperations(commission: CommissionSplit): CommissionSplit {
        commission.defaultSplit = {
            view: false,
            edit: false,
            remove: false,
        };
        commission.customSplit = {
            view: false,
            edit: false,
            remove: false,
        };
        const isSplitDefaultProducer = commission.defaultFor && commission.defaultFor.producerId === this.loggedInProducerId;
        const createdByLoggedInUser =
            this.loggedInProducerId === commission["createdById"] ||
            (this.loggedInProducerIsReportingManager &&
                this.reportingManagersOf.filter((producer) => producer.producer.id === commission["createdById"]).length > 0);
        if (this.loggedInProducerRole === ROLE.PRIMARY_PRODUCER) {
            commission.defaultSplit.view = true;
            commission.defaultSplit.edit = true;
            commission.defaultSplit.remove = false;
            commission.customSplit.view = true;
            commission.customSplit.edit = createdByLoggedInUser;
            commission.customSplit.remove = createdByLoggedInUser;
        } else if (
            this.loggedInProducerRole === ROLE.HQ_EXCHANGE_TEAM_SUPPORT ||
            this.loggedInProducerRole === ROLE.MANAGING_PRODUCER ||
            this.loggedInProducerRole === ROLE.CASE_BUILDER
        ) {
            commission.defaultSplit.view = true;
            commission.defaultSplit.edit = true;
            commission.defaultSplit.remove = false;
            commission.customSplit.view = true;
            commission.customSplit.edit = true;
            commission.customSplit.remove = true;
        } else if (this.loggedInProducerRole === ROLE.WRITING_PRODUCER || this.loggedInProducerRole === ROLE.ENROLLER) {
            commission.defaultSplit.remove = false;
            commission.customSplit.edit = createdByLoggedInUser;
            commission.customSplit.remove = createdByLoggedInUser;
            if (createdByLoggedInUser || (isSplitDefaultProducer && this.loggedInProducerRole === ROLE.WRITING_PRODUCER)) {
                commission.defaultSplit.view = true;
                commission.defaultSplit.edit = true;
                commission.customSplit.view = true;
            } else {
                for (const assignment of commission.assignments) {
                    if (
                        assignment.producer.producerId === this.loggedInProducerId ||
                        (this.loggedInProducerIsReportingManager &&
                            this.reportingManagersOf.filter((producer) => producer.producer.id === assignment.producer.producerId).length >
                                0)
                    ) {
                        commission.defaultSplit.view = true;
                        commission.customSplit.view = true;
                        break;
                    }
                    commission.defaultSplit.view = false;
                    commission.customSplit.view = false;
                    commission.defaultSplit.edit = false;
                }
            }
        }
        commission["showEditButton"] = this.checkForEdit(commission);
        commission["showRemoveButton"] = this.checkForRemove(commission);
        return commission;
    }

    /**
     * API call to getCarrierCoverageDetails to get carrier coverage details and check enrollment period expiry
     * @param carrierId Carrier id
     * @returns Observable of string to enable or disable a commission split edit
     */
    checkExpiredPlanYearForCarrier(carrierId: number): Observable<string> {
        const returnFlag = new Subject<string>();
        // edit button should be disabled for all other partner carriers except ADV
        this.carriersForApproval = this.carriersForApproval.filter((id) => id !== CarrierId.ADV.toString());
        const approvalCarrier = this.carriersForApproval.find((id) => id === carrierId.toString());
        if (approvalCarrier) {
            this.benefitOfferingService
                .getCarrierCoverageDetails(carrierId, true)
                .pipe(
                    tap((coverageDetails) => {
                        returnFlag.next(this.isEnrollmentPeriodOver(coverageDetails) ? this.ENABLE : this.DISABLE);
                    }),
                    filter((data) => data.length === 0),
                    switchMap(() => this.benefitOfferingService.getCarrierCoverageDetails(carrierId, false)),
                    tap((coverageDetails) => {
                        returnFlag.next(this.isEnrollmentPeriodOver(coverageDetails) ? this.ENABLE : this.DISABLE);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        } else {
            returnFlag.next(this.ENABLE);
        }
        return returnFlag.asObservable();
    }

    /**
     * Determine whether the carrier enrollment period is over
     * @param coverageDetails Carrier specific Coverage Details
     * @returns boolean, true if enrollment period is over
     */
    isEnrollmentPeriodOver(coverageDetails: CoverageDetails[]): boolean {
        return (
            !coverageDetails.length ||
            coverageDetails.some(
                (details) =>
                    details.enrollmentEndDate &&
                    this.dateService.isBeforeOrIsEqual(new Date().setHours(0, 0, 0, 0), this.dateService.toDate(details.enrollmentEndDate)),
            )
        );
    }

    /**
     * Function to add customized commission Split
     */
    addCustmizedSplit(): void {
        if (this.isDirect || !this.currentAccount || this.currentAccount.importType !== AccountImportTypes.AFLAC_GROUP) {
            this.expandedView = true;
        }
    }

    /**
     * Getting error message for invalid commission split for enroller role
     */
    getErrorMessageForEnroller(): void {
        const primaryProducer = this.producerList.find((producer) => producer.role === ROLE.PRIMARY_PRODUCER);
        if (primaryProducer) {
            this.repairRequiredEnrollerError = this.languageStrings["primary.portal.commissionSplit.repairRequires.enrollerError"]
                .replace(NAME, `${primaryProducer.producer.name.firstName} ${primaryProducer.producer.name.lastName}`)
                .replace(EMAIL, primaryProducer.producer.emailAddress)
                .replace(PHONE, new PhoneFormatConverterPipe().transform(primaryProducer.producer.phoneNumber));
        }
    }

    /**
     * This function is used for setting the Producers and also get the commission splits based on the producers data
     * @returns void
     */
    loadProducers(): void {
        this.isSpinnerLoading = true;
        const producerSearchObservable$: Observable<AccountProducer | AccountProducer[]> =
            this.selfEnrollmentFlag && this.producerId
                ? this.accountService.getAccountProducer(this.producerId.toString(), this.mpGroup)
                : this.accountService.getAccountProducers(this.mpGroup);
        this.getAccountProducerSubscriber = producerSearchObservable$
            .pipe(
                switchMap((response) => {
                    this.producerList = Array.isArray(response) ? response : Array.of(response);
                    this.getErrorMessageForEnroller();
                    return this.getCommissionSplits();
                }),
                catchError((error) => {
                    this.isSpinnerLoading = false;
                    this.showErrorAlertMessage(error);
                    return of([]);
                }),
            )
            .subscribe();
    }

    loadStates(): void {
        this.getStateSubscriber = this.staticService.getStates().subscribe(
            (Response) => {
                this.stateList = Response;
            },
            (Error) => {
                this.showErrorAlertMessage(Error);
            },
        );
    }
    getDisplayTextOfStates(abbreviation: string): string | undefined {
        const state = this.stateList.find((x) => x.abbreviation === abbreviation);
        if (state && state.name) {
            return state.name;
        }
        return undefined;
    }
    // Confirmation Dialog for Remove commission Split
    removeCommissionSplit(commission: CommissionSplit): void {
        const dialogData: MonDialogData = {
            title: this.languageStrings["primary.portal.commissionSplit.commission.RemoveTitle"].replace("#name", commission.name),
            content: "",
            primaryButton: {
                buttonTitle: this.languageStrings["primary.portal.common.remove"],
                buttonAction: this.onConfirmRemoveCommissionSplit.bind(this, commission),
            },
            secondaryButton: {
                buttonTitle: this.languageStrings["primary.portal.common.cancel"],
            },
        };
        this.dialog.open(MonDialogComponent, {
            data: dialogData,
            width: "40rem",
        });
    }
    // after Confirmation of Remove commission Split action
    onConfirmRemoveCommissionSplit(commission: CommissionSplit): void {
        this.deleteCommissionSplitSubscriber = this.aflac.deleteCommissionSplit(this.mpGroup, commission.id).subscribe(
            (response) => {
                this.ngOnInit();
                this.commissionSplits.forEach((element) => {
                    element.expandedView = false;
                });
                this.editView = false;
            },
            (error) => {
                if (error) {
                    this.showErrorAlertMessage(error);
                } else {
                    this.errorMessage = null;
                }
            },
        );
    }
    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS].length > 0) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.commission.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }
    // Edit commission Split
    editCommissionSplit(index: number): void {
        this.expandedView = false;
        this.commissionSplits.forEach((element) => {
            element.expandedView = false;
        });
        this.commissionSplits[index].expandedView = !this.commissionSplits[index].expandedView;
        this.editView = true;
    }
    /**
     * Method to determine the operation after the commission split is edited or deleted
     * @param data index number and the operation of the commission split added or edited or deleted
     */
    cancelEditCustmizedSplit(data: CommissionSplitOperation): void {
        if (data.operation === this.operation.EDIT) {
            this.commissionSplits[data.index].expandedView = !this.commissionSplits[data.index].expandedView;
            this.editView = false;
            this.getSitCodes();
        } else {
            this.expandedView = !this.expandedView;
        }
        this.loadProducers();
    }
    /**
     * Get writing number by sit code and Producer id
     * @param id producer id
     * @param sitCodeId sit code id
     * @returns writing number
     */
    getWritingNumberBySitCode(id: string, sitCodeId: number): string {
        let num: string;
        if (id && sitCodeId && this.producerList) {
            const producerItem = this.producerList.find((x) => x.producer.id === parseInt(id, 10));
            if (producerItem && producerItem.producer.writingNumbers.length > 0) {
                producerItem.producer.writingNumbers.forEach((item) => {
                    if (item.sitCodes.find((x) => x.id === sitCodeId)) {
                        num = item.number;
                    }
                });
                if (!num) {
                    num = this.getWritingNumberForExpiredSitCode(sitCodeId);
                }
            }
        }
        return num;
    }
    /**
     * Get writing number by sit code when sit code expired
     * @param sitCodeId sit code id
     * @returns writing number
     */
    getWritingNumberForExpiredSitCode(sitCodeId: number): string {
        const writingNumber = this.allWritingNumbers.find((writingNum) => writingNum.sitCodes.some((sitCode) => sitCode.id === sitCodeId));
        return writingNumber && writingNumber.number;
    }
    /**
     * Get sit code by producer id
     * @param id producer id
     * @param sitCodeId sit code id
     * @returns writing number
     */
    getSitCodeBySitCodeIdProducerId(id: string, sitCodeId: number): string {
        let code: string;
        if (id && sitCodeId && this.producerList) {
            const producerItem = this.producerList.find((x) => x.producer.id === parseInt(id, 10));
            if (producerItem && producerItem.producer.writingNumbers.length > 0) {
                producerItem.producer.writingNumbers.forEach((item) => {
                    const sitcodeObj = item.sitCodes.find((x) => x.id === sitCodeId);
                    if (sitcodeObj) {
                        code = sitcodeObj.code;
                    }
                });
                if (!code) {
                    code = this.getExpiredSitCode(sitCodeId);
                }
            }
        }
        return code;
    }
    /**
     * Get sit code of producer when sit code expired
     * @param sitCodeId sit code id
     * @returns sit code
     */
    getExpiredSitCode(sitCodeId: number): string {
        const sitCode = this.allWritingNumbers
            .reduce((acc, writingNumber) => [...acc, ...writingNumber.sitCodes], [])
            .find((code: SITCode) => code.id === sitCodeId);
        return sitCode && sitCode.code;
    }
    /**
     * Load rules list
     */
    loadRulesList(): void {
        this.rulesList = [
            {
                type: RULE_CONSTANT.WRITING_PRODUCER,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleWritingProducer"],
            },
            {
                type: RULE_CONSTANT.PRODUCT,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleProduct"],
            },
            {
                type: RULE_CONSTANT.STATES,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleState"],
            },
            {
                type: RULE_CONSTANT.DATE_WRITTEN,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleDate"],
            },
            {
                type: RULE_CONSTANT.CARRIER,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleCarrier"],
            },
            {
                type: RULE_CONSTANT.ENROLLMENT_METHOD,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleEnrollMethod"],
            },
        ];
    }
    getRuleDisplayText(type: string): string | undefined {
        const rule = this.rulesList.find((x) => x.type === type);
        if (rule) {
            return rule.name;
        }
        return undefined;
    }
    getRuleDisplayList(commission: any): any {
        const rulesObj = {
            [RULE_CONSTANT.WRITING_PRODUCER]: [],
            [RULE_CONSTANT.PRODUCT]: [],
            [RULE_CONSTANT.STATES]: [],
            [RULE_CONSTANT.DATE_WRITTEN]: [],
            [RULE_CONSTANT.CARRIER]: [],
            [RULE_CONSTANT.ENROLLMENT_METHOD]: [],
        };

        commission.rules.forEach((item) => {
            switch (item.type) {
                case RULE_CONSTANT.WRITING_PRODUCER:
                    rulesObj[RULE_CONSTANT.WRITING_PRODUCER].push("<b>" + item.name + "</b>");
                    break;
                case RULE_CONSTANT.PRODUCT:
                    rulesObj[RULE_CONSTANT.PRODUCT].push("<b>" + item.name + "</b>");
                    break;
                case RULE_CONSTANT.STATES:
                    item.states.forEach((state) => {
                        rulesObj[RULE_CONSTANT.STATES].push("<b>" + state + "</b>");
                    });

                    break;
                case RULE_CONSTANT.DATE_WRITTEN:
                    rulesObj[RULE_CONSTANT.DATE_WRITTEN].push("<b>" + item.written.effectiveStarting + "</b>");
                    break;
                case RULE_CONSTANT.CARRIER:
                    rulesObj[RULE_CONSTANT.CARRIER].push("<b>" + item.name + "</b>");
                    break;
                case RULE_CONSTANT.ENROLLMENT_METHOD:
                    rulesObj[RULE_CONSTANT.ENROLLMENT_METHOD].push("<b>" + item.enrollmentMethod + "</b>");
                    break;
            }
        });
        let text = "";
        let isNotFirstRecord = true;
        if (rulesObj[RULE_CONSTANT.WRITING_PRODUCER].length > 0) {
            text = text + "<div>";
            if (!isNotFirstRecord) {
                text = text + "<b>and</b>&nbsp;";
            } else {
                isNotFirstRecord = false;
            }
            text =
                text +
                this.getRuleDisplayText(RULE_CONSTANT.WRITING_PRODUCER) +
                " = " +
                rulesObj[RULE_CONSTANT.WRITING_PRODUCER].join(" OR ") +
                "</div>";
        }
        if (rulesObj[RULE_CONSTANT.PRODUCT].length > 0) {
            text = text + "<div>";
            if (!isNotFirstRecord) {
                text = text + "<b>and</b>&nbsp;";
            } else {
                isNotFirstRecord = false;
            }
            text = text + this.getRuleDisplayText(RULE_CONSTANT.PRODUCT) + " = " + rulesObj[RULE_CONSTANT.PRODUCT].join(" OR ") + "</div>";
        }
        if (rulesObj[RULE_CONSTANT.STATES].length > 0) {
            text = `${text}<div>`;
            if (!isNotFirstRecord) {
                text = `${text}<b>${this.languageStrings["primary.portal.common.and"]}</b> `;
            } else {
                isNotFirstRecord = false;
            }
            if (this.isDirect && commission.splitCompanyCode === this.companyCodes.NY) {
                text = `${text} ${this.getRuleDisplayText(RULE_CONSTANT.STATES)} = ${this.getDisplayTextOfStates(
                    this.companyCodes.NY,
                )}</div>`;
            } else {
                text = `${text} ${this.getRuleDisplayText(RULE_CONSTANT.STATES)} = ${rulesObj[RULE_CONSTANT.STATES].join(" OR ")}</div>`;
            }
        } else if (this.isDirect && rulesObj[RULE_CONSTANT.STATES].length === 0) {
            text = `${text}<div>`;
            if (!isNotFirstRecord) {
                text = `${text}<b>${this.languageStrings["primary.portal.common.and"]}</b> `;
            } else {
                isNotFirstRecord = false;
            }
            text =
                commission.splitCompanyCode === this.companyCodes.US
                    ? `${text} ${this.getRuleDisplayText(RULE_CONSTANT.STATES)} = <b>${
                        this.languageStrings["primary.portal.commissionSplit.commission.anyExcept"]
                    } ${this.getDisplayTextOfStates(this.companyCodes.NY)}</b></div>`
                    : `${text} ${this.getRuleDisplayText(RULE_CONSTANT.STATES)} = <b>${this.getDisplayTextOfStates(
                        this.companyCodes.NY,
                    )}</b></div>`;
        }
        if (rulesObj[RULE_CONSTANT.DATE_WRITTEN].length > 0) {
            text = text + "<div>";
            if (!isNotFirstRecord) {
                text = text + "<b>and</b>&nbsp;";
            } else {
                isNotFirstRecord = false;
            }
            text =
                text +
                this.getRuleDisplayText(RULE_CONSTANT.DATE_WRITTEN) +
                " = " +
                rulesObj[RULE_CONSTANT.DATE_WRITTEN].join(" OR ") +
                "</div>";
        }
        if (rulesObj[RULE_CONSTANT.CARRIER].length > 0) {
            text = text + "<div>";
            if (!isNotFirstRecord) {
                text = text + "<b>and</b>&nbsp;";
            } else {
                isNotFirstRecord = false;
            }
            text = text + this.getRuleDisplayText(RULE_CONSTANT.CARRIER) + " = " + rulesObj[RULE_CONSTANT.CARRIER].join(" OR ") + "</div>";
        }
        if (rulesObj[RULE_CONSTANT.ENROLLMENT_METHOD].length > 0) {
            text = text + "<div>";
            if (!isNotFirstRecord) {
                text = text + "<b>and</b>&nbsp;";
            } else {
                isNotFirstRecord = false;
            }
            text =
                text +
                this.getRuleDisplayText(RULE_CONSTANT.ENROLLMENT_METHOD) +
                " = " +
                rulesObj[RULE_CONSTANT.ENROLLMENT_METHOD].join(" OR ") +
                "</div>";
        }

        return text;
    }
    getRuleDisplayValue(rules: CommonRule[], ruleType: string): string {
        let displayValue = "";
        const rule = rules.filter((x) => x.type === ruleType);
        if (rule && rule.length > 0) {
            displayValue = rule.map((x) => x.name).join(" OR ");
        }
        return displayValue;
    }

    /**
     * function to allow the display of Edit button
     * @param commission: CommissionSplit, current Commission Split record
     * @returns boolean, display the Edit button if true or else don't
     */
    checkForEdit(commission: CommissionSplit): boolean {
        return (
            commission &&
            !commission.expandedView &&
            ((commission.isDefault && commission.defaultSplit && commission.defaultSplit.edit) ||
                (!commission.isDefault && commission.customSplit && commission.customSplit.edit) ||
                (commission.isPartnerCarrierSplit && commission.defaultSplit && commission.defaultSplit.edit))
        );
    }

    /**
     * function to allow the display of Remove button
     * @param commission: CommissionSplit, current Commission Split record
     * @returns boolean, display the Remove button if true or else don't
     */
    checkForRemove(commission: CommissionSplit): boolean {
        return (
            commission &&
            !commission.isPartnerCarrierSplit &&
            ((commission.isDefault && commission.defaultSplit && commission.defaultSplit.remove) ||
                (!commission.isDefault && commission.customSplit && commission.customSplit.remove)) &&
            !commission.conversion
        );
    }

    /**
     * method to get active and expired sit codes' lists
     * @returns void
     */
    getActiveAndExpiredSitCodes(): void {
        if (this.allWritingNumbers.length) {
            this.allWritingNumbers.forEach((writingNumber) => {
                writingNumber.sitCodes.forEach((sitCode) => {
                    this.fetchActiveAndExpiredSitCodes(sitCode, writingNumber.number);
                });
            });
        }
    }

    /**
     * Get active and expired sit codes.
     * @param sitCode: SITCode, current sit code of the list
     * @param writingNumber: string, current writing number of the list
     * @returns void
     */
    fetchActiveAndExpiredSitCodes(sitCode: SITCode, writingNumber: string): void {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const writingNumberSitCode: WritingNumberSitCode = {
            writingNumber: writingNumber,
            sitCodeId: sitCode.id,
            sitCode: sitCode.code,
            active: sitCode.active,
        };
        if (!sitCode.active) {
            this.expiredSitCodes.push(writingNumberSitCode);
        } else if (sitCode.expirationDate) {
            writingNumberSitCode.expirationDate = this.datePipe.transform(sitCode.expirationDate, DateFormats.MONTH_DAY_YEAR);
            const expirationDate = this.dateService.toDate(writingNumberSitCode.expirationDate);
            expirationDate.setHours(0, 0, 0, 0);
            if (expirationDate >= todayDate) {
                const validityDate = this.dateService.toDate(writingNumberSitCode.expirationDate);
                validityDate.setDate(validityDate.getDate() - this.daysBeforeExpiration);
                validityDate.setHours(0, 0, 0, 0);
                if (todayDate >= validityDate) {
                    this.activeSitCodes.push(writingNumberSitCode);
                }
            } else {
                this.expiredSitCodes.push(writingNumberSitCode);
            }
        }
    }
    /**
     * Method to get the EFinancial permission.
     */
    getEFinancePermission(): void {
        this.subscriptions.push(
            this.staticUtilService
                .hasPermission(Permission.AFLAC_E_FINANCE)
                .subscribe((aflacEFinance) => (this.eFinancePermission = aflacEFinance)),
        );
    }

    /**
     * Life cycle hook to unsubscribe the subscribed subscriptions
     * @returns: void
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();

        if (this.commissionstateSubscriber) {
            this.commissionstateSubscriber.unsubscribe();
        }
        if (this.getSitCodesSubscribers) {
            this.getSitCodesSubscribers.unsubscribe();
        }
        if (this.getAccountProducerSubscriber) {
            this.getAccountProducerSubscriber.unsubscribe();
        }
        if (this.getStateSubscriber) {
            this.getStateSubscriber.unsubscribe();
        }
        if (this.deleteCommissionSplitSubscriber) {
            this.deleteCommissionSplitSubscriber.unsubscribe();
        }
        if (this.checkExpiredPlanYearForCarrierSubscriber) {
            this.checkExpiredPlanYearForCarrierSubscriber.unsubscribe();
        }

        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}
