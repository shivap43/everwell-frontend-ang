import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { MonDialogComponent, MonDialogData, DataFilter } from "@empowered/ui";
import {
    DateFormats,
    Permission,
    ClientErrorResponseCode,
    CarrierId,
    RESIDENT_STATE,
    ConfigName,
    AccountImportTypes,
    AppSettings,
    CompanyCode,
    SITCode,
    WritingNumberSitCode,
    WritingNumber,
    PartnerAccountType,
    ProducerCredential,
} from "@empowered/constants";
import { UnsentEnrollmentNotePopupComponent } from "./unsent-enrollment-note-popup/unsent-enrollment-note-popup.component";
import { SelectionModel } from "@angular/cdk/collections";
import { Component, ViewChild, OnDestroy, OnInit, Input } from "@angular/core";
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatSelectChange } from "@angular/material/select";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import {
    AflacService,
    BusinessEnrollments,
    BUSINESS_ENROLLMENT_TYPE,
    Configuration,
    AccountService,
    TRANSMITTAL_SCHEDULE,
    EnrollmentModel,
    SENT_UNSENT_LIST_COLUMNS,
    Situs,
    Enrollment,
    EnrollmentService,
    CommissionSplit,
    BenefitsOfferingService,
    AccountDetails,
    NotificationService,
    FilterObject,
    SitCode,
    StaticService,
    BusinessEnrollmentApplicationStatus,
    Rule,
} from "@empowered/api";
import { Subscription, forkJoin, Observable, Subject, combineLatest, of, iif } from "rxjs";
import { Select, Store } from "@ngxs/store";
import { EnrollmentsFiltersComponent } from "../enrollments-filters/enrollments-filters.component";
import { switchMap, filter, tap, first, takeUntil, finalize, take } from "rxjs/operators";
import { OldEAAEnrollmentModalComponent } from "./old-eaa-enrollment-modal/old-eaa-enrollment-modal.component";
import { UserService } from "@empowered/user";
import { ActivatedRoute, Router } from "@angular/router";

import {
    AddEnrollments,
    Business,
    BusinessState,
    AccountInfoState,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

export const EAA_URL = "general.download.eaa.url";
const BLANK = "_blank";
const RADIX_VALUE = 10;
const COMMISSION_SPLIT_ID = "commissionSplitId";
const COMMISSION_SPLIT = "commissionSplit";
const TRANSMITTAL_SCHEDULE_CONTROL = "transmittalSchedule";
const SENT_DATE = "sentDate";
const ENROLLMENTS = "enrollments";
const ENROLLMENT_ID = "enrollmentId";
const SEND = "SEND";
const CONTROLS = "controls";
const COMMISSION_SPLIT_PARAM = "commission-split";
const MINIMUM_PERCENT = 0;
const CARRIER = "CARRIER";

const SCHEDULE_SEND_OPTIONS_TO_DISPLAY = {
    NOW: "primary.portal.accountEnrollments.now",
    END_OF_OE: "primary.portal.accountEnrollments.endOfOE",
    END_OF_TODAY: "primary.portal.accountEnrollments.endOfToday",
    ONE_DAY_BEFORE: "primary.portal.accountEnrollments.oneDayBeforeEnrollmentSingle",
};
interface DisableEnrollmentObj {
    enrollId: number;
    isDisable: boolean;
}

@Component({
    selector: "empowered-unsent-enrollments",
    templateUrl: "./unsent-enrollments.component.html",
    styleUrls: ["./unsent-enrollments.component.scss"],
    providers: [DataFilter, DatePipe],
})
export class UnsentEnrollmentsComponent implements OnInit, OnDestroy {
    @Input()
    set isActive(setActive: boolean) {
        if (!setActive) {
            this.formSet = false;
        }
    }
    @Select(BusinessState) enrollmentState$: Observable<Business>;
    state: Business;
    memberId: number;
    mpGroupId: string;
    portal: string;
    isEnrolled: boolean;
    configurations: Configuration[];
    dataSource: MatTableDataSource<any>;
    displayedColumns: string[];
    selection = new SelectionModel(true, []);
    subscriptionList: Subscription[] = [];
    data: any[];
    unsentEnrollementData: BusinessEnrollments[];
    commissionSplitList: CommissionSplit[] = [];
    producersList: any[];
    numRows: number;
    isSaved = false;
    setStickyRow: any;
    sitCodes: SITCode[];
    unsentEnrollments: number;
    unsentAP: number;
    totalAP: number;
    unsentEnrollmentForm: FormGroup;
    enrollmentStatusObservables: Observable<Enrollment>[] = [];
    isAllPendingPda = false;
    hasPendingEAAEnrollments = false;
    emptyNoteHovered: boolean;
    formControlAdded: boolean;
    sendDateArr: SentSelectOption[][];
    isSpinnerLoading = false;
    enrollmentSuccessCount: number;
    enrollmentSentCount: number;
    noteMaxLength = 90;
    writingNumbers: WritingNumber[];
    businessEnrollments: BusinessEnrollments[] = [];
    errorMessage = null;
    NoDataOnFilterErrorMessage = "";
    successfulCalls: number;
    languageStrings: Record<string, string>;
    languageSecondStringsArray: Record<string, string>;
    showErrorMessage = false;
    companyCode: CompanyCode;
    situs: Situs;
    accountEAAFlag: boolean;
    isCrossBorderRulesEnabled: boolean;
    isPayrollAccount: boolean;
    isDirectAccount: boolean;
    isCrossBorderRuleEnabledForMd: boolean;
    isCrossBorderRuleEnabledForMo: boolean;
    memberIds: number[] = [];
    sendRejectModalStates: string[] = [];
    checkAlert = false;
    navigationFlag: boolean;
    allowNavigation: Subject<boolean>;
    allowMultiSelect = true;
    initialData: any[];
    hasBeenChanged = false;
    ENROLLMENT = "enrollment";
    enrollments: DisableEnrollmentObj[] = [];
    readonly INCOMPLETE_MISSING_EAA = BusinessEnrollmentApplicationStatus.INCOMPLETE_MISSING_EAA;
    readonly INCOMPLETE_PDA = BusinessEnrollmentApplicationStatus.INCOMPLETE_PENDING_PDA;
    readonly DECIMAL_2 = 2;
    @ViewChild(EnrollmentsFiltersComponent) filterComponant: EnrollmentsFiltersComponent;

    @ViewChild(MatSort) sort: MatSort;
    expiredSitCodes: WritingNumberSitCode[] = [];
    expiredSitCodesFiltered: WritingNumberSitCode[] = [];
    businessDisplayMessagesMaximum = 0;
    DUPLICATE_CHECK_ENABLE_CONFIG = "broker.commission_split.duplicate_check_enable";
    isDuplicateCheckEnabled: boolean;
    secondaryLanguageString: Record<string, string> = {};
    allWritingNumbers: WritingNumber[] = [];
    isProducer = this.store.selectSnapshot(SharedState.portal) === AppSettings.PORTAL_PRODUCER;
    selfEnrollmentFlag = false;
    private readonly unsubscribe$ = new Subject<void>();
    EAALink: string;
    isEfinancialAgent = false; // Same variable used for Stride Life Quote and Clearlink Call Centres
    rowSelection = false;
    isEnrollmentOpen = false;
    currentAccount: AccountDetails;
    accountImportType = AccountImportTypes;
    onlyArgusSelected = false;
    isRepairRequiredCommissionSplit = false;
    hasCommissionSplits = true;
    commissionSplitWarning = false;
    enrollmentWarnings: boolean[] = [];
    enrollmentWarningsState: string[] = [];
    enrollmentWarningsProducers: string[][] = [];
    formSet = false;
    filterString: string;
    isTranzactUser = false;
    commissionSplitError = false;
    disableWarningMessage = false;
    constructor(
        private readonly fb: FormBuilder,
        private readonly aflacService: AflacService,
        public dialog: MatDialog,
        private readonly accountService: AccountService,
        private readonly datePipe: DatePipe,
        private readonly store: Store,
        private readonly langService: LanguageService,
        private readonly enrollmentService: EnrollmentService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly staticUtilService: StaticUtilService,
        private readonly utilService: UtilService,
        private readonly sharedService: SharedService,
        private readonly user: UserService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly notificationService: NotificationService,
        private readonly staticService: StaticService,
        private readonly dateService: DateService,
    ) {
        this.getStateManagement();
        this.enrollmentSentCount = 0;
        this.enrollmentSuccessCount = 0;
        this.sharedService
            .checkAgentSelfEnrolled()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.selfEnrollmentFlag = response;
            });
    }
    /**
     * Life cycle hook to initialize the component,
     * Extracts config values for EAA,
     * Checks permissions for particular Call Centre,
     * Get language strings,
     * initializes the unsent enrollment form
     * */
    ngOnInit(): void {
        this.staticUtilService
            .cacheConfigValue(EAA_URL)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.EAALink = response;
            });
        this.fetchLanguageData();
        this.subscriptionList.push(
            this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*")).subscribe(() => {
                this.getSecondaryLanguageStrings();
            }),
        );
        this.checkCallCentrePermission();
        this.checkTranzactRole();
        this.initialize();
        this.data = [];
    }
    /**
     * This method is to download EAA file
     * */
    downloadFile(): void {
        window.open(this.EAALink, BLANK);
    }

    /**
     * This method checks for the permission of particular call centre.
     */
    checkCallCentrePermission(): void {
        this.subscriptionList.push(
            combineLatest([
                this.staticUtilService.hasPermission(Permission.AFLAC_E_FINANCE),
                this.staticUtilService.hasPermission(Permission.AFLAC_CLEAR_LINK),
                this.staticUtilService.hasPermission(Permission.AFLAC_STRIDE_LIFE_QUOTE),
            ]).subscribe(([aflacEFinance, aflacClearLink, aflacStrideLifeQuote]) => {
                if (aflacEFinance || aflacClearLink || aflacStrideLifeQuote) {
                    this.isEfinancialAgent = true;
                }
            }),
        );
    }

    /**
     * This method checks for the permission of tranzact roles.
     */
    checkTranzactRole(): void {
        this.subscriptionList.push(
            this.staticUtilService.hasPermission(Permission.TRANZACT_ROLE).subscribe((tranxactRole) => {
                if (tranxactRole) {
                    this.isTranzactUser = true;
                }
            }),
        );
    }

    /** This method is called in AccountEnrollmentsComponent component's ngOnInit()
     * This method extracts groupId, current portal, initializes the angular forms,
     * fetches the primary
     * and secondary language strings and gets the expired Sit Codes.
     * @returns void
     */
    initialize(): void {
        this.selection = new SelectionModel(true, []);
        this.currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        if (this.selfEnrollmentFlag) {
            this.user.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential) => {
                if ((credential as ProducerCredential).groupId) {
                    this.mpGroupId = (credential as ProducerCredential).groupId.toString();
                }
            });
        } else {
            this.mpGroupId = this.store.selectSnapshot(BusinessState.mpGroupId);
        }
        this.isSaved = false;
        this.getAccountInfo(this.mpGroupId);
        this.getAllWritingNumbers();
        this.enrollmentSentCount = 0;
        this.enrollmentSuccessCount = 0;
        this.checkAlert = true;
        this.initializeForm();
    }

    /**
     * function called on initial load to get static data and writing numbers
     * @returns void
     */
    onInitialLoad(): void {
        this.getStaticData();
        this.numRows = 0;
        this.unsentEnrollments = 0;
        this.emptyNoteHovered = false;
        this.formControlAdded = false;
    }

    setSelection(): void {
        this.selection = new SelectionModel<any>(this.allowMultiSelect, this.selection.selected);
    }

    /**
     * method to retrieve account related information
     * @param mpGroup: string, mpGroup id
     * @returns void
     */
    getAccountInfo(mpGroup: string): void {
        this.isSpinnerLoading = true;
        this.hideErrorAlertMessage();
        this.subscriptionList.push(
            this.accountService
                .getAccount(mpGroup)
                .pipe(
                    filter((response) => response !== undefined),
                    switchMap((response) => {
                        this.situs = response.situs;
                        this.accountEAAFlag = response.enrollmentAssistanceAgreement;
                        this.isPayrollAccount = response.partnerAccountType === PartnerAccountType.PAYROLL;
                        this.isDirectAccount = response.partnerAccountType === PartnerAccountType.DIRECT;
                        return this.benefitsOfferingService.getPlanYears(parseInt(this.mpGroupId, RADIX_VALUE), false, true);
                    }),
                    finalize(() => {
                        this.isSpinnerLoading = false;
                        this.onInitialLoad();
                    }),
                )
                .subscribe(
                    (response) => {
                        const currentDate = this.datePipe.transform(new Date(), DateFormats.YEAR_MONTH_DAY);
                        this.isEnrollmentOpen = this.isPayrollAccount
                            ? response.some(
                                  (value) =>
                                      value.enrollmentPeriod.expiresAfter >= currentDate &&
                                      value.enrollmentPeriod.effectiveStarting <= currentDate,
                              )
                            : false;
                    },
                    (error) => {
                        if (error) {
                            this.showErrorAlertMessage(error);
                        }
                    },
                ),
        );
    }

    /**
     * Subscriber for fetching state values
     * Also extracts config values
     * @returns void
     */
    getStateManagement(): void {
        this.subscriptionList.push(
            this.enrollmentState$.subscribe((state: Business) => {
                this.state = { ...state };
                this.memberId = +this.state.activeMemberId;
                this.mpGroupId = this.state.mpGroupId;
                this.configurations = this.state.configurations;
            }),
        );

        this.subscriptionList.push(
            this.staticUtilService
                .cacheConfigEnabled("general.feature.enable.cross_border_sales_rule")
                .pipe(
                    first(),
                    filter((isCrossBorderRulesEnabled) => {
                        this.isCrossBorderRulesEnabled = isCrossBorderRulesEnabled;
                        return isCrossBorderRulesEnabled === true;
                    }),
                    switchMap(() =>
                        forkJoin([
                            this.staticUtilService.cacheConfigValue("general.enrollment.states_requiring_eea_completion").pipe(first()),
                            this.staticUtilService
                                .cacheConfigEnabled("general.feature.enable.cross_border_sales_rule_for_state_md.payroll")
                                .pipe(first()),
                            this.staticUtilService
                                .cacheConfigEnabled("general.feature.enable.cross_border_sales_rule_for_state_mo.payroll")
                                .pipe(first()),
                        ]),
                    ),
                )
                .subscribe(([eaaStates, cbsEnabledMdPayroll, cbsEnabledMoPayroll]) => {
                    this.sendRejectModalStates = eaaStates ? eaaStates.split(",") : [];
                    this.isCrossBorderRuleEnabledForMd = cbsEnabledMdPayroll;
                    this.isCrossBorderRuleEnabledForMo = cbsEnabledMoPayroll;
                }),
        );
    }

    initializeForm(): void {
        this.unsentEnrollmentForm = this.fb.group({
            enrollments: this.fb.array([]),
        });
    }

    /** Pushes dynamically created form group into the form array*/
    setEnrollmentsForm(): void {
        this.clearFormArray();
        const userCtrl = this.enrollmentsFormArray;
        this.data.forEach((enrollment: any) => {
            userCtrl.push(this.setEnrollmentsFormArray(enrollment));
        });
        this.formSet = true;
    }

    /**
     * Creates form groups of business enrollments for dynamic rows
     * @param enrollment business enrollments.
     * @returns form groups which are created.
     */
    setEnrollmentsFormArray(enrollment: BusinessEnrollments): FormGroup {
        const commissionSplitId =
            !enrollment.commissionSplit || enrollment.commissionSplit.repairRequired ? [] : [enrollment.commissionSplitId[0]];
        const sendDate =
            !enrollment.commissionSplit || enrollment.commissionSplit.repairRequired
                ? [""]
                : [this.findSelectOption(enrollment.enrollmentId, enrollment.transmittalSchedule)];
        return this.fb.group({
            commissionSplitId: commissionSplitId,
            sentDate: sendDate,
            enrollmentId: [enrollment.enrollmentId],
        });
    }

    /**
     * Find a select option for a given enrollment and transmittal schedule
     * @param enrollmentId The enrollment id for the enrollment, isolates that enrollments options
     * @param transmittalSchedule The transmittal schedule to select
     * @returns sentSelectOption returns send date value based on given enrollment and transmittal schedule options.
     */
    findSelectOption(enrollmentId: number, transmittalSchedule: TRANSMITTAL_SCHEDULE): SentSelectOption {
        const sendDateOptions: SentSelectOption[] = this.sendDateArr.find(
            (dateOptions) => dateOptions.find((option) => option.enrollmentId === enrollmentId) !== undefined,
        );
        if (this.selfEnrollmentFlag && !this.rowSelection) {
            return sendDateOptions
                ? sendDateOptions.find((dateOption) => dateOption.type_literal === TRANSMITTAL_SCHEDULE.END_OF_DAY)
                : undefined;
        }
        return sendDateOptions ? sendDateOptions.find((dateOption) => dateOption.type_literal === transmittalSchedule) : undefined;
    }

    /** Return form array inside the form group */
    get enrollmentsFormArray(): FormArray {
        return this.unsentEnrollmentForm.get("enrollments") as FormArray;
    }

    /** Explicitly adds a form control inside the form array */
    addFormControl(): void {
        if (!this.formControlAdded) {
            const userCtrl = this.enrollmentsFormArray;
            userCtrl.insert(0, this.setEnrollmentsFormArray(this.setStickyRow));
            this.formControlAdded = true;
        }
    }

    /** Explicitly removes a form control inside the form array */
    removeFormControl(): void {
        if (this.formControlAdded) {
            const userCtrl = this.enrollmentsFormArray;
            userCtrl.removeAt(0);
            this.formControlAdded = false;
        }
    }

    /**
     * This method sets showWarning value from showWarningMessage() for every enrollment
     * to check If any of the enrollment has isDisable and commission split warning should be displayed
     * @param enrollmentId The enrollment id for the enrollment
     * @param showWarning show warning for the enrollment
     * @param commissionSplitValue Selected commission split value
     * @returns void
     */
    checkCommissionSplitWarning(enrollmentId: number, showWarning: boolean, commissionSplitValue: number): void {
        // If Multiple enrollments selected
        // here we are checking writing producer has zero percentage commission
        if (!enrollmentId) {
            this.businessEnrollments.forEach((businessEnrollment) => {
                const deletedCommission =
                    businessEnrollment.commissionSplit.id === commissionSplitValue &&
                    businessEnrollment.commissionSplit.assignments.some(
                        (producer) =>
                            businessEnrollment.producer.producerId === producer.producer.producerId && producer.percent === MINIMUM_PERCENT,
                    );
                const selectedCommission = this.unsentEnrollmentForm
                    .getRawValue()
                    .enrollments.some((enrollment) =>
                        this.commissionSplitList.some(
                            (commissionSplit) =>
                                commissionSplit.id === enrollment.commissionSplitId &&
                                businessEnrollment.enrollmentId === enrollment.enrollmentId &&
                                commissionSplit.assignments.some(
                                    (assignment) =>
                                        assignment.producer.producerId === businessEnrollment.producer.producerId &&
                                        assignment.percent === 0,
                                ),
                        ),
                    );

                if (deletedCommission || selectedCommission) {
                    this.enrollments.forEach((enrollmentData) => {
                        if (enrollmentData.enrollId === businessEnrollment.enrollmentId) {
                            enrollmentData.isDisable = true;
                        }
                    });
                } else {
                    this.enrollments.forEach((enrollmentData) => {
                        if (enrollmentData.enrollId === businessEnrollment.enrollmentId) {
                            enrollmentData.isDisable = false;
                        }
                    });
                }
            });
        } else if (!this.enrollments.some((enrollmentData) => enrollmentData.enrollId === enrollmentId || enrollmentId === undefined)) {
            // Adding record to the enrollments If enrollment record is not yet pushed
            const disableObj: DisableEnrollmentObj = {
                enrollId: enrollmentId,
                isDisable: showWarning,
            };
            if (disableObj.enrollId) {
                this.enrollments.push(disableObj);
            }
        } else {
            // modifying the existing record
            this.enrollments.forEach((enrollmentData) => {
                if (enrollmentData.enrollId === enrollmentId) {
                    enrollmentData.isDisable = showWarning;
                }
            });
        }
    }
    /**
     * API data for unsent erollments, commissions and misc
     * @returns : void
     */
    getStaticData(): void {
        this.isSpinnerLoading = true;
        this.hideErrorAlertMessage();
        this.companyCode = this.situs.state.abbreviation === CompanyCode.NY ? CompanyCode.NY : CompanyCode.US;
        this.subscriptionList.push(
            forkJoin([
                this.aflacService.getBusinessEnrollments(BUSINESS_ENROLLMENT_TYPE.UNSENT, this.mpGroupId),
                this.aflacService.getSitCodes(this.companyCode),
                this.aflacService.getCommissionSplits(this.mpGroupId),
            ])
                .pipe(
                    tap(([businessEnrs, writingNumbers, commSplitsList]) => {
                        this.businessEnrollments = businessEnrs;
                        this.writingNumbers = writingNumbers;
                        this.commissionSplitList = this.getCommissionSplitsWithEnrollmentState(
                            commSplitsList,
                            this.getAllSITCodesFromWritingNumbers(this.allWritingNumbers),
                        );
                        const allSitCodes: SITCode[] = [];
                        this.writingNumbers.forEach((writingNumber) => {
                            allSitCodes.push(...writingNumber.sitCodes);
                        });
                        this.sitCodes = allSitCodes;
                        this.setBusinessEnrollmentsData(this.businessEnrollments);
                        if (this.filterComponant) {
                            this.filterComponant.setFilterValues();
                        }
                    }),
                    switchMap(() =>
                        iif(
                            () => !this.selfEnrollmentFlag,
                            // If not self enrolled account then get account producers api gets invoked
                            this.accountService.getAccountProducers(this.mpGroupId),
                            // Otherwise emit empty array
                            of([]),
                        ),
                    ),
                    finalize(() => (this.isSpinnerLoading = false)),
                    tap((response) => {
                        this.producersList = response;
                        this.businessEnrollments.forEach((enrollment, index) => {
                            let deletedCommission = true;
                            this.commissionSplitList.forEach((commissionSplit) => {
                                if (this.initialData[index].commissionSplit.id === commissionSplit.id) {
                                    deletedCommission = false;
                                    this.commissionSplitChanged(commissionSplit.id, enrollment.enrollmentId, index);
                                }
                            });
                            if (deletedCommission) {
                                const showWarning = this.showWarningMessage(
                                    this.initialData[index].commissionSplit.id,
                                    enrollment.enrollmentId,
                                );
                                this.checkCommissionSplitWarning(enrollment.enrollmentId, showWarning, enrollment.commissionSplitId);
                            }
                        });
                        // Checking If any of the enrollments has isDisable value is true
                        this.disableWarningMessage = this.enrollments.some((enrollment) => enrollment.isDisable === true);
                    }),
                )
                .subscribe(
                    () => {},
                    (error) => {
                        this.showErrorAlertMessage(error);
                    },
                ),
        );
    }

    /**
     * Set the business enrollment transmittal schedule and set this array as the data source for displaying in html.
     * Iterate through business enrollments array to check the application status
     * used for determining if the enrollments are all pending or if any EAA enrollments are pending
     * @param businessEnrollments business enrollments
     */
    setBusinessEnrollmentsData(businessEnrollments: BusinessEnrollments[]): void {
        businessEnrollments = businessEnrollments.map((businessEnrollmentListItem) => {
            if (this.selfEnrollmentFlag || this.isTranzactUser) {
                businessEnrollmentListItem.transmittalSchedule = TRANSMITTAL_SCHEDULE.END_OF_DAY;
            }
            this.memberIds.push(businessEnrollmentListItem.member.id);
            return businessEnrollmentListItem;
        });
        this.setDataSource(businessEnrollments);
        this.setValueInStore();
        this.isRepairRequiredCommissionSplit = businessEnrollments.some(
            (enrollment) => enrollment.commissionSplit && enrollment.commissionSplit.repairRequired,
        );
        this.setEnrollmentsForm();
        this.isAllPendingPda = businessEnrollments.every(
            (enrollmentListItem) => enrollmentListItem.applicationStatus === BusinessEnrollmentApplicationStatus.INCOMPLETE_PENDING_PDA,
        );
        this.hasPendingEAAEnrollments = businessEnrollments.some(
            (enrollmentListItem) => enrollmentListItem.applicationStatus === BusinessEnrollmentApplicationStatus.INCOMPLETE_MISSING_EAA,
        );
    }

    /**
     * Creates a data-source from business enrollment data for mat-table
     * @param businessEnrollmentData business enrollment data
     */
    setDataSource(businessEnrollmentData: BusinessEnrollments[]): void {
        this.dataSource = new MatTableDataSource(
            businessEnrollmentData.map((row) => {
                const producerName = row.producer ? `${row.producer.fullName.lastName} ${row.producer.fullName.firstName}` : "";
                return {
                    enrollmentId: row.enrollmentId,
                    producerId: row.producer ? row.producer.producerId : undefined,
                    producerName: [producerName],
                    enrollmentDate: this.datePipe.transform(row.createDate, AppSettings.DATE_FORMAT_MM_DD_YYYY),
                    memberName: row.member.name,
                    productName: row.productName,
                    enrollmentComment: row.enrollmentComment,
                    commissionSplit:
                        row.commissionSplit && row.commissionSplit.archived
                            ? row.commissionSplit
                            : this.commissionSplitList.find((split) => split.id === row.commissionSplitId),
                    checkboxRequired: true,
                    isHeader: false,
                    readonly: false,
                    annualPremium: +row.annualPremium.toFixed(this.DECIMAL_2),
                    transmittalSchedule: row.transmittalSchedule,
                    commissionSplitId: [row.commissionSplitId],
                    state: row.state,
                    sentDate: this.setSendDateBySchedule(
                        row.transmittalSchedule,
                        this.datePipe.transform(row.coverageStartDate, AppSettings.DATE_FORMAT_MM_DD_YYYY),
                    ),
                    coverageDate: this.datePipe.transform(row.coverageStartDate, AppSettings.DATE_FORMAT_MM_DD_YYYY),
                    effectiveTooltip: `${
                        this.languageStrings["primary.portal.accountEnrollments.effectiveTitle"]
                    } ${this.datePipe.transform(row.coverageStartDate, AppSettings.DATE_FORMAT_MM_DD_YYYY)}`,
                    isChanged: false,
                    status: row.applicationStatus,
                    isArgus: [CarrierId.ARGUS, CarrierId.AFLAC_DENTAL_AND_VISION].includes(row.carrierId),
                };
            }),
        );
        this.afterSetDataSource();
    }
    /**
     * logic to be implemented after data source is set
     * setting displayed columns, initializing data etc.
     */
    afterSetDataSource(): void {
        this.data = this.dataSource.data;
        this.initialData = [...this.data];
        this.sortAnalyserHelper();
        this.displayedColumns = Object.values(SENT_UNSENT_LIST_COLUMNS);
        this.getValuesOfEnrollmentAP();
        this.setEndDateArray();
    }

    /** helper to retain sorting logic */
    sortAnalyserHelper(): void {
        if (this.dataSource) {
            this.dataSource.sortingDataAccessor = (item, property) => {
                if (property === this.ENROLLMENT) {
                    return new Date(item["enrollmentDate"]);
                }
                return item[property];
            };
            this.dataSource.sort = this.sort;
        }
    }

    /**
     * Pre-populate send date based upon transmittal schedule
     * @param transmittalSchedule Transmittal schedule option
     * @param createDate Created date
     * @return returning text value based on transmittal schedule option
     */
    setSendDateBySchedule(transmittalSchedule: string, createDate: string): string {
        switch (transmittalSchedule) {
            case TRANSMITTAL_SCHEDULE.IMMEDIATELY:
                return this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.NOW];
            case TRANSMITTAL_SCHEDULE.END_OF_OE:
                return this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.END_OF_OE];
            case TRANSMITTAL_SCHEDULE.END_OF_DAY:
                return this.datePipe.transform(new Date(), AppSettings.DATE_FORMAT_MM_DD_YYYY);
            case TRANSMITTAL_SCHEDULE.END_OF_DAY_PRIOR_TO_START:
                return this.dateFormatter(createDate);
            default:
                return null;
        }
    }

    /** Whether the number of selected elements matches the total number of rows.
     * @returns boolean true if all rows selected
     */
    isAllSelected(): boolean {
        const numSelected = this.selection.selected.length;
        this.numRows = this.dataSource
            ? this.dataSource.data.filter((x) => !x.isHeader && x.status !== BusinessEnrollmentApplicationStatus.INCOMPLETE_PENDING_PDA)
                  .length
            : null;
        this.isEnrolled = this.selection.selected.length > 0 ? true : false;
        return numSelected === this.numRows;
    }

    removeHeader(data: any[]): any[] {
        data.splice(0, 1);
        this.sendDateArr.splice(0, 1);
        this.removeFormControl();
        return data;
    }

    /**
     * Function to add header while selecting all option from checkbox
     * @param data array of unsent enrollment data for table column
     * @return array of enrollment data after making changes in date objects in select dropdown
     */
    addHeader(data: any[]): any[] {
        this.setStickyRow = this.setCalculatedHeader(this.selection.selected.length, this.getTotalAP());
        data.unshift(this.setStickyRow);
        const calculatedDateObjectArray = this.setCalculatedDateObj();
        this.sendDateArr.unshift(calculatedDateObjectArray);
        this.addFormControl();
        return data;
    }

    /** Selects all rows if they are not all selected; otherwise clear selection.
     * @returns void
     */
    masterToggle(): void {
        this.rowSelection = !this.rowSelection;
        let data = [...this.dataSource.data];
        const hasHeader = data.find((x) => x.isHeader);
        const isAllSelected = this.isAllSelected();
        if (isAllSelected) {
            if (hasHeader) {
                data = this.removeHeader(data);
            }
            this.selection.clear();
            this.setStickyRow = undefined;
        } else if (this.selection.selected.length > 0 && this.selection.selected.length !== data.length) {
            if (hasHeader) {
                data = this.removeHeader(data);
            }
            this.selection.clear();
            this.setStickyRow = undefined;
        } else {
            this.dataSource.data.forEach((row) => {
                if (row.status !== BusinessEnrollmentApplicationStatus.INCOMPLETE_PENDING_PDA) {
                    this.selection.select(row.enrollmentId);
                }
            });
            if (hasHeader) {
                data = this.removeHeader(data);
            }
            data = this.addHeader(data);
        }

        this.dataSource = new MatTableDataSource(data);
        this.sortAnalyserHelper();
    }

    /** Deselects all the rows from table */
    resetSelections(): void {
        if (this.dataSource) {
            let data = [...this.dataSource.data];
            const hasHeader = data.find((x) => x.isHeader);
            if (this.selection.selected.length > 0 && this.selection.selected.length !== data.length) {
                if (hasHeader) {
                    data = this.removeHeader(data);
                }

                this.selection.clear();
                this.setStickyRow = undefined;
                this.numRows--;
            } else if (this.selection.selected.length > 0 && this.selection.selected.length === data.length) {
                if (hasHeader) {
                    data = this.removeHeader(data);
                }
                data = this.addHeader(data);
            }
            this.dataSource = new MatTableDataSource(data);
            this.sortAnalyserHelper();
        }
    }

    /** The label for the checkbox on the passed row */
    checkboxLabel(row?: any): string {
        if (!row) {
            return this.isAllSelected()
                ? this.languageStrings["primary.portal.accountEnrollments.unsentBusiness.selectAll"]
                : this.languageStrings["primary.portal.accountEnrollments.unsentBusiness.deselectAll"];
        }
        return this.selection.isSelected(row.enrollmentId)
            ? this.languageStrings["primary.portal.accountEnrollments.unsentBusiness.deselectAll"].replace("#count", row.position + 1)
            : this.languageStrings["primary.portal.accountEnrollments.unsentBusiness.selectAll"].replace("#count", row.position + 1);
    }
    /**
     * function to select or deselect a row
     * @param row - the row to be selected or deselected
     */
    selectionRow(row: any): void {
        let data = this.dataSource.data;
        const hasHeader = data.find((x) => x.isHeader);
        this.isEnrolled = true;
        if (!this.isAllSelected()) {
            this.selection.toggle(row.enrollmentId);
            if (this.selection.selected.length > 0 && data.length > 0) {
                this.isEnrolled = true;
                this.rowSelection = true;
                if (hasHeader) {
                    data = this.removeHeader(data);
                }
                data = this.addHeader(data);
            } else {
                this.isEnrolled = false;
                this.rowSelection = false;
                if (hasHeader) {
                    data = this.removeHeader(data);
                }
                this.setStickyRow = undefined;
            }
        } else {
            this.rowSelection = true;
            this.isEnrolled = true;
            this.selection.toggle(row.enrollmentId);
            if (hasHeader) {
                data = this.removeHeader(data);
            }
            data = this.addHeader(data);
        }
        this.onlyArgusSelected = !this.selection.selected.some((selection) => {
            const selectedEnrollment = this.dataSource.data.find((rowItem) => rowItem.enrollmentId === selection);
            /* if selectedEnrollment is ever undefined, it is counted as an Argus enrollment to favor disabling
            the master "Send date" drop down */
            return selectedEnrollment && !selectedEnrollment.isArgus;
        });
        this.dataSource = new MatTableDataSource(data);
        this.sortAnalyserHelper();
    }

    /** Calculates the sticky row values below header */
    setCalculatedHeader(numRows: number, ap: string): any {
        return {
            producerName: numRows + " " + this.languageStrings["primary.portal.accountEnrollments.enrollmentsSelected"] + " - $" + ap,
            enrollmentDate: "",
            memberName: "",
            productName: "",
            annualPremium: 0,
            enrollmentComment: this.languageStrings["primary.portal.accountEnrollments.applyToSelected"],
            commissionSplit: "",
            sentDate: "",
            readonly: false,
            checkboxRequired: false,
            isHeader: true,
            enrollmentAP: "",
            commissionSplitId: [],
            coverageDate: null,
        };
    }

    /**
     * This function is used to setting date static dropdown values for Schedule and Send header
     * @returns SentSelectOption[]
     */
    setCalculatedDateObj(): SentSelectOption[] {
        const sendDateDropDownArr: SentSelectOption[] = [
            {
                type: this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.NOW],
                dateVal: null,
                value: this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.NOW],
                type_literal: TRANSMITTAL_SCHEDULE.IMMEDIATELY,
            },
            {
                type: this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.END_OF_OE],
                dateVal: null,
                value: this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.END_OF_OE],
                type_literal: TRANSMITTAL_SCHEDULE.END_OF_OE,
                hideOption: !this.isEnrollmentOpen,
            },
            {
                type: this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.END_OF_TODAY],
                dateVal: this.datePipe.transform(new Date(), DateFormats.MONTH_DAY_YEAR),
                value: this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.END_OF_TODAY],
                type_literal: TRANSMITTAL_SCHEDULE.END_OF_DAY,
            },
            {
                type: this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.ONE_DAY_BEFORE],
                dateVal: null,
                value: this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.ONE_DAY_BEFORE],
                type_literal: TRANSMITTAL_SCHEDULE.END_OF_DAY_PRIOR_TO_START,
            },
        ];

        if (this.isEfinancialAgent || this.selfEnrollmentFlag || this.isTranzactUser) {
            return sendDateDropDownArr.filter(
                (element) =>
                    element.type_literal === TRANSMITTAL_SCHEDULE.IMMEDIATELY || element.type_literal === TRANSMITTAL_SCHEDULE.END_OF_DAY,
            );
        }
        return sendDateDropDownArr;
    }

    /** Calculates the total annual premium of selected rows */
    getTotalAP(): string {
        this.totalAP = 0;
        for (const selectedRows of this.selection.selected) {
            if (selectedRows) {
                const enrollment = this.dataSource.data.find((x) => x.enrollmentId === selectedRows);
                this.totalAP += parseFloat(enrollment.annualPremium.toString());
            }
        }
        return this.totalAP.toFixed(this.DECIMAL_2);
    }

    /**
     * Method is used to save the changes in the enrollment
     */
    sendEnrollments(): void {
        this.successfulCalls = 0;
        this.enrollmentSuccessCount = 0;
        this.enrollmentSentCount = 0;
        this.errorMessage = null;
        this.hideErrorAlertMessage();
        this.setValidationsOnSelected();
        const unsentEnrollments = this.unsentEnrollmentForm.value.enrollments;
        const model = this.refactorRequestPayload(
            this.dataSource.data.filter((row) => row.isChanged),
            unsentEnrollments,
        );
        unsentEnrollments.forEach((unsentEnrollment) => {
            if (unsentEnrollment.sentDate.type === this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.NOW]) {
                this.enrollments.forEach((enrollment) => {
                    if (enrollment.enrollId === unsentEnrollment.enrollmentId) {
                        enrollment.isDisable = false;
                    }
                });
            }
        });
        this.disableWarningMessage = this.enrollments.some((enrollment) => enrollment.isDisable === true);
        if (!model.length) {
            return;
        }
        this.isSpinnerLoading = true;
        const DAYS_TO_DECIDE_SEND_OR_REJECT = 60;
        const enrollmentsForSendOrReject =
            this.isCrossBorderRulesEnabled && this.accountEAAFlag
                ? model.filter((reqObj) => {
                      const businessEnrollment = this.businessEnrollments.find(
                          (busEnrollment) => busEnrollment.enrollmentId === reqObj.enrollmentId,
                      );
                      const olderThanSixtyDays = businessEnrollment.customPdfSignedDate
                          ? this.dateService.getDifferenceInDays(
                                new Date(),
                                this.dateService.toDate(businessEnrollment.customPdfSignedDate || ""),
                            ) > DAYS_TO_DECIDE_SEND_OR_REJECT
                          : false;
                      const memberResidentState = businessEnrollment?.member?.state;
                      return (
                          olderThanSixtyDays &&
                          memberResidentState &&
                          this.sendRejectModalStates.includes(memberResidentState) &&
                          memberResidentState !== businessEnrollment.state &&
                          this.isPayrollAccount &&
                          ((memberResidentState !== RESIDENT_STATE.MARYLAND && memberResidentState !== RESIDENT_STATE.MISSOURI) ||
                              (memberResidentState === RESIDENT_STATE.MARYLAND && this.isCrossBorderRuleEnabledForMd) ||
                              (memberResidentState === RESIDENT_STATE.MISSOURI && this.isCrossBorderRuleEnabledForMo))
                      );
                  })
                : [];
        if (this.isCrossBorderRulesEnabled && this.accountEAAFlag && enrollmentsForSendOrReject.length) {
            const sendOlderEnrollmentsModalRef = this.empoweredModalService.openDialog(OldEAAEnrollmentModalComponent, {
                data: enrollmentsForSendOrReject.length,
            });
            this.subscriptionList.push(
                sendOlderEnrollmentsModalRef
                    .afterClosed()
                    .pipe(
                        filter((sendOrReject) => sendOrReject !== undefined && sendOrReject !== null),
                        switchMap((sendOrReject) => {
                            const enrollmentsNotForSendOrReject = model.filter(
                                (reqObj) => !enrollmentsForSendOrReject.map((enr) => enr.enrollmentId).includes(reqObj.enrollmentId),
                            );
                            if (sendOrReject === SEND) {
                                return forkJoin(this.sendBusinessEnrollments(model));
                            }
                            if (enrollmentsNotForSendOrReject.length > 0) {
                                return forkJoin(
                                    this.sendBusinessEnrollments(enrollmentsNotForSendOrReject).concat(
                                        this.rejectBusinessEnrollments(enrollmentsForSendOrReject),
                                    ),
                                );
                            }
                            return forkJoin(this.rejectBusinessEnrollments(enrollmentsForSendOrReject));
                        }),
                        finalize(() => {
                            this.isSpinnerLoading = false;
                        }),
                    )
                    .subscribe(
                        () => {
                            this.afterSuccessfulApiSubmitCalls(model);
                        },
                        (error) => {
                            if (error.status === ClientErrorResponseCode.RESP_404) {
                                this.errorMessage =
                                    this.secondaryLanguageString["secondary.portal.accountEnrollments.commissionSplitNotFound"];
                                this.showErrorMessage = true;
                            } else {
                                this.afterErrorFromApiSubmitCalls(error);
                            }
                        },
                    ),
            );
        } else {
            this.subscriptionList.push(
                forkJoin(this.sendBusinessEnrollments(model)).subscribe(
                    () => {
                        this.afterSuccessfulApiSubmitCalls(model);
                    },
                    (error) => {
                        if (error.status === ClientErrorResponseCode.RESP_404) {
                            this.errorMessage = this.secondaryLanguageString["secondary.portal.accountEnrollments.commissionSplitNotFound"];
                            this.showErrorMessage = true;
                            this.isSpinnerLoading = false;
                        } else {
                            this.afterErrorFromApiSubmitCalls(error);
                        }
                    },
                ),
            );
        }
    }

    /**
     * setting the page after successful api calls
     * @param model a list of enrollments that got sent successfully
     */
    afterSuccessfulApiSubmitCalls(model: EnrollmentModel[]): void {
        this.unsentEnrollmentForm.markAsPristine();
        this.enrollmentsFormArray.setErrors(null);
        this.isSpinnerLoading = false;
        if (this.successfulCalls === model.length) {
            this.isSpinnerLoading = true;
            this.selection.clear();
            this.removeFormControl();
            this.getStaticData();
            this.setStickyRow = undefined;
            this.isSaved = true;
            this.hasBeenChanged = false;
        }
    }

    /**
     * setting the page after errors from api calls
     * @param error used to display error detail
     */
    afterErrorFromApiSubmitCalls(error: Error): void {
        this.isSpinnerLoading = false;
        this.showErrorAlertMessage(error);
        this.unsentEnrollmentForm.markAsPristine();
    }

    /**
     * send selected enrollments to Aflac
     * @param enrollments list of enrollments to send
     * @return observables of the API calls
     */
    sendBusinessEnrollments(enrollments: EnrollmentModel[]): Observable<unknown>[] {
        return enrollments.map((reqObj) => {
            const enrollmentId = this.utilService.copy(reqObj.enrollmentId);
            delete reqObj.enrollmentId;
            return this.aflacService.updateBusinessEnrollment(enrollmentId, reqObj, this.mpGroupId).pipe(
                first(),
                tap(() => {
                    this.successfulCalls++;
                    if (reqObj.transmittalSchedule === TRANSMITTAL_SCHEDULE.IMMEDIATELY) {
                        this.enrollmentSentCount += 1;
                    } else {
                        this.enrollmentSuccessCount += 1;
                    }
                }),
            );
        });
    }

    /**
     * reject enrollments
     * @param enrollments list of enrollments to reject
     * @return observables of the API calls
     */
    rejectBusinessEnrollments(enrollments: EnrollmentModel[]): Observable<unknown>[] {
        return enrollments.map((reqObj) => {
            const enrollmentId = this.utilService.copy(reqObj.enrollmentId);
            const enrollmentObj = this.businessEnrollments.filter((enrollment) => (enrollment.enrollmentId = enrollmentId)).pop();
            delete reqObj.enrollmentId;
            return this.enrollmentService
                .updateEnrollmentStatus(
                    enrollmentObj.member.id,
                    enrollmentId,
                    {
                        status: "DENIED",
                        effectiveDate: this.datePipe.transform(new Date(), AppSettings.DATE_FORMAT),
                    },
                    +this.mpGroupId,
                )
                .pipe(
                    first(),
                    tap(() => this.successfulCalls++),
                );
        });
    }

    hideErrorAlertMessage(): void {
        this.showErrorMessage = false;
        this.errorMessage = null;
    }
    showErrorAlertMessage(err: Error): void {
        const error = err ? err["error"] : undefined;
        if (!error) {
            return;
        }
        this.showErrorMessage = true;
        const detailsLength = error["details"] && error["details"].length;
        if (error.status === AppSettings.API_RESP_400 && detailsLength) {
            for (const detail of error["details"]) {
                this.errorMessage = this.langService.fetchSecondaryLanguageValue(
                    "secondary.portal.enrollments.api." + error.status + "." + error.code + "." + detail.field,
                );
            }
        } else if (error.status === AppSettings.API_RESP_400 && !detailsLength) {
            this.errorMessage = this.langService.fetchSecondaryLanguageValue(
                "secondary.portal.enrollments.api." + error.status + "." + error.code,
            );
        } else {
            this.errorMessage = this.langService.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
        }
    }

    /**
     * refactoring payload data for Send business API
     * @param changedRows Datasource records in which changes are done
     * @param formData unsentEnrollment form data
     */
    refactorRequestPayload(changedRows: any[], formData: any[]): EnrollmentModel[] {
        return changedRows && changedRows.length > 0
            ? changedRows
                  .map((row) => {
                      const enrollment = formData.find((data) => data.enrollmentId === row.enrollmentId);
                      if (
                          enrollment &&
                          enrollment.enrollmentId &&
                          enrollment.commissionSplitId &&
                          enrollment.sentDate &&
                          enrollment.sentDate !== "" &&
                          enrollment.sentDate.type_literal
                      ) {
                          return {
                              enrollmentId: enrollment.enrollmentId,
                              commissionSplitId: enrollment.commissionSplitId,
                              enrollmentComment: row.enrollmentComment,
                              transmittalSchedule: enrollment.sentDate.type_literal,
                          };
                      }
                      return undefined;
                  })
                  .filter((enrollment) => !!enrollment)
            : [];
    }

    /**
     * Function triggers on send date selection change.
     * @param event Mat select change event
     * @param enrollmentId Enrollment id for which the send date has been changed
     */
    sentDateChanged(event: MatSelectChange, enrollmentId: number): void {
        if (!enrollmentId) {
            const headerRowControl = this.unsentEnrollmentForm.get("enrollments").get("0");
            const dateValue = headerRowControl.get(SENT_DATE).value.value;
            const typeLiteralOfDate = headerRowControl.get(SENT_DATE).value.type_literal;
            for (const selection of this.selection.selected) {
                if (selection) {
                    const userCtrl = this.enrollmentsFormArray.controls;
                    for (const control of userCtrl) {
                        if (control.get("enrollmentId").value === selection) {
                            let valToApply = "";
                            if (
                                typeLiteralOfDate === TRANSMITTAL_SCHEDULE.IMMEDIATELY ||
                                typeLiteralOfDate === TRANSMITTAL_SCHEDULE.END_OF_OE
                            ) {
                                valToApply = dateValue;
                            } else if (typeLiteralOfDate === TRANSMITTAL_SCHEDULE.END_OF_DAY) {
                                valToApply = this.datePipe.transform(new Date(), AppSettings.DATE_FORMAT_MM_DD_YYYY);
                            } else if (
                                dateValue === this.languageStrings["primary.portal.accountEnrollments.ondeDayBeforeEnrollment"] ||
                                dateValue === this.languageStrings["primary.portal.accountEnrollments.oneDayBeforeEnrollmentSingle"]
                            ) {
                                const enrollment = this.dataSource.data.find((x) => x.enrollmentId === selection);
                                valToApply = this.dateFormatter(enrollment.coverageDate);
                            }
                            this.unsentEnrollmentForm
                                .get("enrollments")
                                .get(userCtrl.indexOf(control).toString())
                                .get(SENT_DATE)
                                .setValue(this.findSelectOption(control.get("enrollmentId").value, event.value.type_literal));
                            const selectedEnrollment = this.dataSource.data.find((row) => row.enrollmentId === selection);
                            if (selectedEnrollment && !selectedEnrollment.isArgus) {
                                this.setDataInDataSource(selection, SENT_DATE, valToApply);
                                this.setDataInDataSource(selection, TRANSMITTAL_SCHEDULE_CONTROL, event.value.type_literal);
                            }
                            this.setDataInDataSource(enrollmentId, SENT_DATE, valToApply);
                            this.detectActualChanges(selection);
                        }
                    }
                }
            }
        } else {
            this.setDataInDataSource(enrollmentId, SENT_DATE, event.value.value);
            this.setDataInDataSource(enrollmentId, TRANSMITTAL_SCHEDULE_CONTROL, event.value.type_literal);
            this.detectActualChanges(enrollmentId);
        }
    }

    /**
     * Determine if specified enrollment has been changed and mark flag accordingly.
     * @param enrollmentId id to specify enrollment
     */
    detectActualChanges(enrollmentId: number): void {
        const initialEnrollment = this.initialData.find((x) => x.enrollmentId === enrollmentId);
        const currentEnrollment = this.dataSource.data.find((x) => x.enrollmentId === enrollmentId);
        this.dataSource.data.forEach((x) => {
            if (x.enrollmentId === enrollmentId) {
                x.isChanged = this.comparingEnrollments(initialEnrollment, currentEnrollment);
            }
        });

        this.hasBeenChanged = this.dataSource.data.some((x) => x.isChanged);
    }

    /**
     * Check properties that are modifiable by the user to determine whether any have been changed.
     * @param initialEnrollment most recent saved state of specified enrollment
     * @param currentEnrollment current state of specified enrollment (not yet saved)
     * @returns boolean indicating whether specified enrollment has been changed
     */
    comparingEnrollments(initialEnrollment: any, currentEnrollment: any): boolean {
        let isChanged = false;
        if (initialEnrollment && currentEnrollment) {
            if (initialEnrollment.commissionSplitId.length && currentEnrollment.commissionSplitId.length) {
                isChanged = initialEnrollment.commissionSplitId[0] !== currentEnrollment.commissionSplitId[0];
            } else if (
                (!initialEnrollment.commissionSplitId.length && currentEnrollment.commissionSplitId.length) ||
                (initialEnrollment.commissionSplitId.length && !currentEnrollment.commissionSplitId.length)
            ) {
                isChanged = true;
            }
            if (
                initialEnrollment.sentDate !== currentEnrollment.sentDate ||
                initialEnrollment.enrollmentComment !== currentEnrollment.enrollmentComment ||
                initialEnrollment.transmittalSchedule !== currentEnrollment.transmittalSchedule
            ) {
                isChanged = true;
            }
        }

        return isChanged;
    }
    /**
     * Event listener for mat-select option change for Commission split list
     * @param commissionSplitValue Selected commission split value
     * @param enrollmentId selected enrollment for which commission split value needs to be change.
     * @param rowIndex Row index of unsent table column
     */
    commissionSplitChanged(commissionSplitValue: number, enrollmentId: number, rowIndex: number): void {
        let producerIds = [];
        const commissionSplitOptions: CommissionSplit[] = this.getCommissionSplitOptions(enrollmentId);
        if (commissionSplitValue) {
            const commissionSplitSelected = commissionSplitOptions.find((x) => x.id === commissionSplitValue);
            producerIds = commissionSplitSelected
                ? commissionSplitSelected.assignments
                      .filter((producerObj) => producerObj.producer)
                      .map((producerObj) => producerObj.producer.producerId)
                : [];
            this.commissionSplitWarning = false;
            if (!enrollmentId) {
                const headerRowControl = this.unsentEnrollmentForm.get(ENROLLMENTS).get("0");
                const headerSelectedCommSplitId = headerRowControl.get(COMMISSION_SPLIT_ID).value;
                const headerSelectedCommSplit = commissionSplitOptions.find((x) => x.id === headerSelectedCommSplitId);
                for (const selection of this.selection.selected) {
                    this.data.forEach((enrollments) => {
                        if (
                            selection &&
                            selection === enrollments.enrollmentId &&
                            (producerIds.indexOf(enrollments.producerId) !== -1 || !enrollments.producerId)
                        ) {
                            this.setCommissionSplitValues(selection, headerSelectedCommSplit);
                            this.setDataInDataSource(enrollmentId, COMMISSION_SPLIT_ID, headerSelectedCommSplit);
                            this.setEnrollmentWarning(enrollments.enrollmentId, commissionSplitSelected, rowIndex);
                        }
                    });
                }
            } else {
                this.setCommissionSplitValues(enrollmentId, commissionSplitSelected);
                this.setEnrollmentWarning(enrollmentId, commissionSplitSelected, rowIndex);
            }
            this.commissionSplitWarning = this.enrollmentWarnings.some((warning) => warning);
        }
        //   If this.showWarningMessage() returns true for any of the unsent enrollments
        //   commission split warning message should be displayed
        const showWarning = this.showWarningMessage(commissionSplitValue, enrollmentId);
        this.checkCommissionSplitWarning(enrollmentId, showWarning, commissionSplitValue);
        this.disableWarningMessage = this.enrollments.some((enrollment) => enrollment.isDisable === true);
    }

    /**
     * Method to set warning if any there in selected row
     * @param enrollmentId selected enrollment for which commission split value needs to be change.
     * @param commissionSplitSelected Selected commission split value
     * @param rowIndex Row index of unsent table column
     */
    setEnrollmentWarning(enrollmentId: number, commissionSplitSelected: CommissionSplit, rowIndex: number): void {
        const matchingEnrollment = this.businessEnrollments.find((enrollment) => enrollment.enrollmentId === enrollmentId);
        const producers = commissionSplitSelected.assignments
            .filter(
                (assignment) =>
                    !this.producersList.some(
                        (producerInfo) =>
                            assignment.producer &&
                            producerInfo.producer.licensedStates &&
                            producerInfo.producer.id === assignment.producer.producerId &&
                            matchingEnrollment &&
                            producerInfo.producer.licensedStates.find(
                                (licensedState) => licensedState.abbreviation && licensedState.abbreviation === matchingEnrollment.state,
                            ),
                    ),
            )
            .map((assignment) => (assignment.producer && assignment.producer.name) || "");
        this.enrollmentWarningsState[rowIndex] = (matchingEnrollment && matchingEnrollment.state) || "";
        this.enrollmentWarnings[rowIndex] = !!(producers && producers.length);
        this.enrollmentWarningsProducers[rowIndex] = producers;
    }

    /**
     * Setting value of commission split in form group and datasource.
     * @param enrollmentId selected enrollment for which commission split value needs to be change.
     * @param commissionSplit commission split which needs to be update.
     */
    setCommissionSplitValues(enrollmentId: number, commissionSplit: CommissionSplit): void {
        const userCtrl = this.enrollmentsFormArray.controls;
        for (const control of userCtrl) {
            if (control.get(ENROLLMENT_ID).value === enrollmentId) {
                this.unsentEnrollmentForm
                    .get(ENROLLMENTS)
                    .get(userCtrl.indexOf(control).toString())
                    .get(COMMISSION_SPLIT_ID)
                    .setValue(commissionSplit.id);
                this.setDataInDataSource(enrollmentId, COMMISSION_SPLIT_ID, commissionSplit);
                this.detectActualChanges(enrollmentId);
            }
        }
    }
    /**
     * Update property in an element (row) in dataSource.
     * @param enrollmentId number to specify element (row)
     * @param key property that is being modified
     * @param value value with which property is updated
     */
    setDataInDataSource(enrollmentId: number, key: string, value: any): void {
        let index: number;
        const data = [...this.dataSource.data];
        for (const val of data) {
            if (val.enrollmentId === enrollmentId) {
                index = data.indexOf(val);
            }
        }
        if (index > -1) {
            const dataValue = {
                ...data[index],
            };
            if (key === COMMISSION_SPLIT_ID) {
                dataValue[COMMISSION_SPLIT_ID] = [value.id];
                dataValue[COMMISSION_SPLIT] = value;
            } else {
                dataValue[key] = value;
            }
            data[index] = {
                ...dataValue,
            };
            this.dataSource = new MatTableDataSource(data);
            this.sortAnalyserHelper();
        }
    }

    /** Helper function to check if any row is selected */
    checkForSelectedRows(): boolean {
        if (this.selection && this.selection.selected.length > 0) {
            return true;
        }
        return false;
    }

    /**
     * Opens model to pend enrollment and add a note.
     * @param rowData row in which clicked note icon belongs
     */
    editNote(rowData: any): void {
        const dialogRef = this.dialog.open(UnsentEnrollmentNotePopupComponent, {
            width: "667px",
            data: {
                title: this.languageStrings["primary.portal.accountEnrollments.applyToSelected"],
                editRowData: rowData,
                maxLength: this.noteMaxLength,
            },
        });
        this.subscriptionList.push(
            dialogRef.afterClosed().subscribe((elementData) => {
                if (this.isSaved) {
                    this.isSaved = false;
                }
                let index = 0;
                this.isSpinnerLoading = false;
                const data = [...this.dataSource.data];
                if (elementData) {
                    for (const val of data) {
                        if (val.enrollmentId === elementData.data.enrollmentId) {
                            index = data.indexOf(val);
                        }
                    }
                    const dataValue = { ...data[index] };
                    dataValue["enrollmentComment"] = elementData.data.enrollmentComment;
                    data[index] = { ...dataValue };
                }
                this.dataSource = new MatTableDataSource(data);
                this.sortAnalyserHelper();
                this.detectActualChanges(elementData.data.enrollmentId);
            }),
        );
    }

    /** Undo form changes */
    revertForm(): void {
        this.isSpinnerLoading = true;
        this.hasBeenChanged = false;
        this.selection.clear();
        this.removeFormControl();
        this.getStaticData();
        this.setStickyRow = undefined;
        this.unsentEnrollmentForm.markAsPristine();
        this.unsentEnrollmentForm.setErrors(null);
        this.isSaved = false;
    }

    /**
     * Filter transforms data source for table after application
     * @param data filters applied object
     */
    afterFilterApply(data: FilterObject): void {
        this.filterString = data.filter ? data.filter : "";
        this.NoDataOnFilterErrorMessage = `${this.langService.fetchPrimaryLanguageValue(
            "primary.portal.accountEnrollments.unsentBusiness.noFilterResult",
        )} ${data.selectedFilter}`;
        const businessEnrollments$ = this.aflacService.getBusinessEnrollments(
            BUSINESS_ENROLLMENT_TYPE.UNSENT,
            this.mpGroupId,
            data.selectedFilter ? data.filter : undefined,
        );
        this.isSpinnerLoading = true;
        this.subscriptionList.push(
            businessEnrollments$.subscribe((dataValue) => {
                this.businessEnrollments = dataValue;
                this.isRepairRequiredCommissionSplit = this.businessEnrollments.some(
                    (enrollment) => enrollment.commissionSplit && enrollment.commissionSplit.repairRequired,
                );
                this.setBusinessEnrollmentsData(this.businessEnrollments);
                const deSelectionArray = [];
                this.selection.selected.forEach((selectionElement) => {
                    const dataSourceData = this.dataSource.data.find((dataElement) => dataElement.enrollmentId === selectionElement);
                    if (!dataSourceData) {
                        deSelectionArray.push(selectionElement);
                    }
                });
                deSelectionArray.forEach((element) => {
                    this.selection.deselect(element);
                });
                this.isSpinnerLoading = false;
                this.checkHeader();
                this.enrollments = [];
                this.unsentEnrollmentForm.getRawValue().enrollments.forEach((enrollment) => {
                    const showWarning = this.showWarningMessage(enrollment.commissionSplitId, enrollment.enrollmentId);
                    this.checkCommissionSplitWarning(enrollment.enrollmentId, showWarning, enrollment.commissionSplitValue);
                });
                this.disableWarningMessage = this.enrollments.some((enrollment) => enrollment.isDisable);
            }),
        );
    }

    /**
     * Method used to check for sorting selection in the header
     */
    checkHeader(): void {
        let data = this.dataSource ? [...this.dataSource.data] : [];
        const headerData = data.find((res) => res.isHeader);
        if (!headerData && this.selection.selected.length > 0) {
            data = this.addHeader(data);
            this.dataSource = new MatTableDataSource(data);
            this.sortAnalyserHelper();
        }
    }

    /** Gets Annual Premium Sum */
    getValuesOfEnrollmentAP(): void {
        this.unsentAP = this.dataSource.data.reduce((sum, item: any) => sum + parseFloat(item.annualPremium), 0).toFixed(this.DECIMAL_2);
        this.unsentEnrollments = this.dataSource.data.length;
    }

    /**
     * This function is used setting date static dropdown values
     * @returns void
     */
    setEndDateArray(): void {
        this.sendDateArr = [];
        for (const data of this.data) {
            if (this.isEfinancialAgent || this.selfEnrollmentFlag || this.isTranzactUser) {
                const dateDropDownArr: SentSelectOption[] = [
                    {
                        enrollmentId: data.enrollmentId,
                        type: this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.NOW],
                        dateVal: null,
                        value: this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.NOW],
                        type_literal: TRANSMITTAL_SCHEDULE.IMMEDIATELY,
                    },
                    {
                        enrollmentId: data.enrollmentId,
                        type: this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.END_OF_TODAY],
                        dateVal: this.datePipe.transform(new Date(), DateFormats.MONTH_DAY_YEAR),
                        value: this.datePipe.transform(new Date(), DateFormats.MONTH_DAY_YEAR),
                        type_literal: TRANSMITTAL_SCHEDULE.END_OF_DAY,
                    },
                ];
                this.sendDateArr.push(dateDropDownArr);
            } else {
                const objArray: SentSelectOption[] = [
                    {
                        enrollmentId: data.enrollmentId,
                        type: this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.NOW],
                        dateVal: null,
                        value: this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.NOW],
                        type_literal: TRANSMITTAL_SCHEDULE.IMMEDIATELY,
                    },
                    {
                        enrollmentId: data.enrollmentId,
                        type: this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.END_OF_OE],
                        dateVal: null,
                        value: this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.END_OF_OE],
                        type_literal: TRANSMITTAL_SCHEDULE.END_OF_OE,
                        hideOption: !this.isEnrollmentOpen,
                    },
                    {
                        enrollmentId: data.enrollmentId,
                        type: this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.END_OF_TODAY],
                        dateVal: this.datePipe.transform(new Date(), DateFormats.MONTH_DAY_YEAR),
                        value: this.datePipe.transform(new Date(), DateFormats.MONTH_DAY_YEAR),
                        type_literal: TRANSMITTAL_SCHEDULE.END_OF_DAY,
                    },
                    {
                        enrollmentId: data.enrollmentId,
                        type: this.languageStrings[SCHEDULE_SEND_OPTIONS_TO_DISPLAY.ONE_DAY_BEFORE],
                        dateVal: this.dateFormatter(data.coverageDate),
                        value: this.dateFormatter(data.coverageDate),
                        type_literal: TRANSMITTAL_SCHEDULE.END_OF_DAY_PRIOR_TO_START,
                        hideOption: this.dateService.isBeforeOrIsEqual(this.dateService.toDate(data.coverageDate), new Date()),
                    },
                ];
                this.sendDateArr.push(objArray);
            }
        }
    }

    /** Sets Data in Store */
    setValueInStore(): void {
        const enrollments = [...this.data];
        const commissionSplitList = [...this.commissionSplitList];
        const sitCodes = [...this.sitCodes];
        this.store.dispatch(
            new AddEnrollments(
                {
                    unsentEnrollments: enrollments,
                    commissionList: commissionSplitList,
                    mpGroupId: this.mpGroupId,
                    sitCodes: sitCodes,
                },
                BUSINESS_ENROLLMENT_TYPE.UNSENT,
            ),
        );
    }

    /** Formats the seefective date */
    dateFormatter(date: string): any {
        if (date && date !== "") {
            let sendDate = this.dateService
                .toDate(date)
                .setDate(this.dateService.toDate(date).getDate() - 1)
                .toString();
            return (sendDate = this.datePipe.transform(sendDate, AppSettings.DATE_FORMAT_MM_DD_YYYY));
        }
    }

    /**
     * Setting validations on form for selected rows
     */
    setValidationsOnSelected(): void {
        for (const selection of this.selection.selected) {
            if (selection) {
                for (const control of this.enrollmentsFormArray.controls) {
                    if (control.get(ENROLLMENT_ID).value === selection && control[CONTROLS]) {
                        this.setValidationOnControl(control[CONTROLS]);
                    }
                }
            }
        }
        for (const control of this.enrollmentsFormArray.controls) {
            if (control[CONTROLS]) {
                this.setValidationOnControl(control[CONTROLS]);
            }
        }
    }

    /**
     * setting validations on form control
     * @param control form control
     */
    setValidationOnControl(control: FormControl): void {
        for (const subField in control) {
            if (subField) {
                if (control[subField].validator) {
                    control[subField].setValidators([Validators.required, control[subField].validator]);
                } else {
                    control[subField].setValidators([Validators.required]);
                }
                control[subField].updateValueAndValidity();
            }
        }
    }

    /** Cleans the form array */
    clearFormArray(): void {
        while (this.enrollmentsFormArray.length !== 0) {
            this.enrollmentsFormArray.removeAt(0);
        }
    }

    /**
     * Maps SIT code and returns value
     * @param producerId has the producer id
     * @param sitCodeId is the sitcode id
     * @returns the sitcode based on writing numbers of the producer
     */
    mapSitCode(producerId: number, sitCodeId: number): string {
        const producerDetails = this.producersList
            ? this.producersList.find((producerObj) => producerObj.producer.id === producerId)
            : null;
        let sitCode = "";
        if (producerDetails) {
            producerDetails.producer.writingNumbers.filter((writingNum) => {
                const sitcodeObj = writingNum.sitCodes.find((sitcode) => sitcode.id === sitCodeId);
                if (sitcodeObj) {
                    sitCode = sitcodeObj.code;
                }
            });
        }
        return sitCode;
    }

    /** Returns the value for mat-select-trigger
     * validating dataSource data empty or not than validating val coming from param present in dataSource
     * and returning find dataSource string
     * @param rowIndex: { number } Row index of unsent table column
     * @param list: { any } Commission split list data
     * @param type: { boolean } validating whether commissionId name or enrollmentId sentDate
     * @param val: { string } commissionId or enrollmentId
     * @returns { string } commission name or enrollment sentDate
     */
    fetchTrimmedData(rowIndex: number, list: any, type?: boolean, val?: string): string {
        let returnStr = "";
        const rowData = this.dataSource.data[rowIndex];
        const enrollmentId = rowData.enrollmentId ? rowData.enrollmentId : null;
        const formValues = this.unsentEnrollmentForm.getRawValue();
        const row = formValues.enrollments.find((x) => x.enrollmentId === enrollmentId);
        if (type && row && row.commissionSplitId && val) {
            const commissionId = val;
            returnStr = list.find((x) => commissionId === x.id) ? list.find((x) => commissionId === x.id).name : "";
        } else if (row && row.sentDate) {
            returnStr = this.dataSource.data
                ? this.dataSource.data.find((x) => x.enrollmentId === val)
                    ? this.dataSource.data.find((x) => x.enrollmentId === val).sentDate
                    : ""
                : "";
        } else {
            returnStr = this.languageStrings["primary.portal.common.select"];
        }
        return returnStr || this.languageStrings["primary.portal.common.select"];
    }
    /**
     * Method called to display warning message for zero percent commission
     * @param commissionSplitValue Selected commission split value
     * @param enrollmentId selected enrollment for which commission split value needs to be change
     * @returns boolean
     */
    showWarningMessage(commissionSplitValue: number, enrollmentId: number): boolean {
        return this.businessEnrollments.some(
            (businessEnrollment) =>
                // If commission split is deleted after enrollment or for default commission
                // here we are checking writing producer has zero percentage commission
                (businessEnrollment.commissionSplit.id === commissionSplitValue &&
                    businessEnrollment.enrollmentId === enrollmentId &&
                    businessEnrollment.commissionSplit.assignments.some(
                        (producer) => businessEnrollment.producer.producerId === producer.producer.producerId && producer.percent === 0,
                    )) ||
                // If commission split is not deleted and by default writing producer has non zero percentage commission
                //  or manually selected commission then here we are checking zero percent commission for writing producer
                this.commissionSplitList.some(
                    (commissionSplit) =>
                        commissionSplit.id === commissionSplitValue &&
                        businessEnrollment.enrollmentId === enrollmentId &&
                        commissionSplit.assignments.some(
                            (assignment) =>
                                assignment.producer.producerId === businessEnrollment.producer.producerId &&
                                assignment.percent === MINIMUM_PERCENT,
                        ),
                ),
        );
    }

    /**
     * Method called to get commission splits using producerId to display commission
     * split options in Commission Split column in unsent enrollments tab.
     *
     * @param producerId string, id of the producer
     * @param enrollmentCommissionSplit the commission split for the enrollment
     * @param rowIndex (optional) rowIndex for which we are fetching commission splits.
     * @param state (optional) enrollment state
     * @returns list of commission splits to be displayed
     */
    getCommissionSplitsByProducerId(
        producerId: string,
        enrollmentCommissionSplit?: CommissionSplit,
        rowIndex?: number,
        state?: string,
        enrollmentId?: number,
    ): CommissionSplit[] {
        const splitComCode = state === CompanyCode.NY ? CompanyCode.NY : CompanyCode.US;
        const commissionSplitsWithoutPartnerCarrierSplits: CommissionSplit[] = this.getCommissionSplitsExceptPartnerCarriers(
            this.commissionSplitList,
        );
        if (producerId) {
            let commissionSplitOptions = enrollmentCommissionSplit
                ? commissionSplitsWithoutPartnerCarrierSplits.filter(
                      (commissionSplit) => enrollmentCommissionSplit && enrollmentCommissionSplit.id !== commissionSplit.id,
                  )
                : commissionSplitsWithoutPartnerCarrierSplits;
            if (enrollmentCommissionSplit) {
                commissionSplitOptions.push(enrollmentCommissionSplit);
            }
            const enrollment: Enrollment = this.data.find((enrollmentData) => enrollmentData.enrollmentId === enrollmentId);
            if (
                enrollment &&
                enrollment.commissionSplit &&
                enrollment.commissionSplit.archived &&
                !commissionSplitOptions.find((split) => split.id === enrollment.commissionSplit.id)
            ) {
                commissionSplitOptions.push(enrollment.commissionSplit);
            }

            if (commissionSplitOptions.length) {
                commissionSplitOptions = commissionSplitOptions.filter(
                    (commissionSplit) =>
                        commissionSplit.assignments &&
                        commissionSplit.assignments.some(
                            (assignment) => assignment.producer.producerId === +producerId && assignment.percent >= MINIMUM_PERCENT,
                        ),
                );
            }
            this.checkCommissionSplitControlErrors(commissionSplitOptions, enrollmentCommissionSplit, rowIndex, splitComCode);
            return commissionSplitOptions.filter(
                (split) => !split.repairRequired && (split.enrollmentState === splitComCode || split.archived),
            );
        }
        if (this.selection.selected.length) {
            let splitcomCodeList: CompanyCode[] = this.businessEnrollments
                .filter((enrollment) => this.selection.selected.includes(enrollment.enrollmentId))
                .map((enroll) => (enroll.state === CompanyCode.NY ? CompanyCode.NY : CompanyCode.US));
            splitcomCodeList = [...new Set(splitcomCodeList)];
            const producerIds = this.data
                .filter((enrollments) => this.selection.selected.indexOf(enrollments.enrollmentId) !== -1 && enrollments.producerId)
                .map((enrollments) => enrollments.producerId);
            const commissionSplitOptions: CommissionSplit[] = this.getCommissionSplitsExceptPartnerCarriers(
                this.getCommissionSplitOptions(),
            );
            return producerIds.length
                ? commissionSplitOptions.filter(
                      (commissionSplit) =>
                          commissionSplit.assignments &&
                          commissionSplit.assignments.some(
                              (assignment) =>
                                  producerIds.indexOf(assignment.producer.producerId) !== -1 &&
                                  !this.isSitCodeExpired(assignment.sitCodeId),
                          ) &&
                          !commissionSplit.repairRequired &&
                          (splitcomCodeList.includes(commissionSplit.enrollmentState) || commissionSplit.archived),
                  )
                : commissionSplitOptions.filter(
                      (split) => !split.repairRequired && (splitcomCodeList.includes(split.enrollmentState) || split.archived),
                  );
        }
        return commissionSplitsWithoutPartnerCarrierSplits.filter(
            (split) => !split.repairRequired && split.enrollmentState === splitComCode,
        );
    }
    /**
     * gets commission split list without partner carrier's commission splits
     * @param commissionSplits - list of commission splits
     * @returns commission splits except partner carrier's commission splits
     */
    getCommissionSplitsExceptPartnerCarriers(commissionSplits: CommissionSplit[]): CommissionSplit[] {
        return commissionSplits.filter((commissionSplit) => {
            const carrierRule: Rule = commissionSplit.rules.find((rule) => rule.type === CARRIER);
            return carrierRule
                ? carrierRule.carrierId === CarrierId.AFLAC_DENTAL_AND_VISION || carrierRule.carrierId === CarrierId.AFLAC
                : true;
        });
    }
    /**
     * gets commission split options by adding archived split if required
     * @param enrollmentId - enrollment id
     * @returns commission splits
     */
    getCommissionSplitOptions(enrollmentId?: number): CommissionSplit[] {
        const commissionSplitOptions: CommissionSplit[] = [...this.commissionSplitList];
        if (enrollmentId) {
            const enrollment: Enrollment = this.data.find((enrollmentData) => enrollmentData.enrollmentId === enrollmentId);
            if (
                enrollment &&
                enrollment.commissionSplit &&
                enrollment.commissionSplit.archived &&
                !commissionSplitOptions.find((split) => split.id === enrollment.commissionSplit.id)
            ) {
                commissionSplitOptions.push(enrollment.commissionSplit);
            }
        } else {
            const selectedEnrollments = this.data.filter((enrollments) => this.selection.selected.indexOf(enrollments.enrollmentId) !== -1);
            const isSameArchiviedSplit = selectedEnrollments.every(
                (enrollment, index, enrollments) =>
                    enrollment.commissionSplit &&
                    enrollment.commissionSplit.archived &&
                    enrollments[0].commissionSplit &&
                    enrollment.commissionSplit.id === enrollments[0].commissionSplit.id,
            );
            if (isSameArchiviedSplit) {
                commissionSplitOptions.push(selectedEnrollments[0].commissionSplit);
            }
        }
        return commissionSplitOptions;
    }

    /**
     * Set form control errors based on valid commission splits
     * @param commissionSplitOptions Array of commission splits
     * @param enrollmentCommissionSplit Selected commission split of the enrollment
     * @param rowIndex index of commission split row
     * @param splitComCode US or NY
     */
    checkCommissionSplitControlErrors(
        commissionSplitOptions: CommissionSplit[],
        enrollmentCommissionSplit?: CommissionSplit,
        rowIndex?: number,
        splitComCode?: CompanyCode,
    ): void {
        const validCommissionSplitList = commissionSplitOptions.filter(
            (split) => !split.repairRequired && (split.enrollmentState === splitComCode || split.archived),
        );
        const invalidCommissionSplitList = commissionSplitOptions.filter(
            (split) => split.repairRequired && (split.enrollmentState === splitComCode || split.archived),
        );
        /**
         * the commissionSplitError is set to true for producer having only invalidcommissionSplits count is >=1.
         * the commissionSplitError is set to false for producer having both validCommissionSplits amd invalidCommissionSplits count>=1.
         */
        this.commissionSplitError = !(validCommissionSplitList.length >= 1 && invalidCommissionSplitList.length >= 0);
        if (!isNaN(rowIndex)) {
            const enrollmentsControl = this.unsentEnrollmentForm.controls.enrollments;
            const commissionSplitControl =
                enrollmentsControl && enrollmentsControl.get(`${rowIndex}`)
                    ? enrollmentsControl.get(`${rowIndex}`).get(COMMISSION_SPLIT_ID)
                    : undefined;
            if (commissionSplitControl) {
                const validGivenCommSplit =
                    commissionSplitControl.value &&
                    enrollmentCommissionSplit &&
                    commissionSplitControl.value.toString() === enrollmentCommissionSplit.id.toString();
                if (
                    validCommissionSplitList.length === 0 &&
                    ((this.commissionSplitList.length > 0 && !validGivenCommSplit) || this.commissionSplitList.length === 0)
                ) {
                    this.hasCommissionSplits = false;
                    commissionSplitControl.markAsTouched();
                    commissionSplitControl.setValue(null);
                    commissionSplitControl.setErrors({ invalid: true });
                } else if (
                    validCommissionSplitList.length > 0 &&
                    this.commissionSplitList.length > 0 &&
                    validCommissionSplitList.length < this.commissionSplitList.length &&
                    !validGivenCommSplit
                ) {
                    commissionSplitControl.markAsTouched();
                    commissionSplitControl.setValue(null);
                    commissionSplitControl.setErrors({ required: true });
                }
            }
            this.unsentEnrollmentForm.updateValueAndValidity();
        }
    }

    /**
     * method called to know if sit code is expired or not
     * @param sitCodeId: number, the sit code id of the commission split
     * @returns boolean, returns if the sit code is expired or not
     */
    isSitCodeExpired(sitCodeId: number): boolean {
        return this.expiredSitCodes.filter((expiredSitCode) => expiredSitCode.sitCodeId === sitCodeId).length > 0;
    }

    /**
     * Function is for fetching language values
     */
    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.accountEnrollments.now",
            "primary.portal.accountEnrollments.endOfToday",
            "primary.portal.accountEnrollments.endOfOE",
            "primary.portal.accountEnrollments.ondeDayBeforeEnrollment",
            "primary.portal.accountEnrollments.enrollmentsSelected",
            "primary.portal.accountEnrollments.applyToSelected",
            "primary.portal.accountEnrollments.addNote",
            "primary.portal.accountEnrollments.enrollmentSent",
            "primary.portal.accountEnrollments.enrollmentsSent",
            "primary.portal.accountEnrollments.enrollmentUpdated",
            "primary.portal.accountEnrollments.enrollmentsUpdated",
            "primary.portal.accountEnrollments.leaveWithoutSave.title",
            "primary.portal.accountEnrollments.leaveWithoutSave.desc",
            "primary.portal.accountEnrollments.leaveWithoutSave.button",
            "primary.portal.accountEnrollments.effectiveTitle",
            "primary.portal.accountEnrollments.incompleteMissingEAAMessage",
            "primary.portal.accountEnrollments.incompleteMissingEAAMessage.anchor",
            "primary.portal.common.cancel",
            "primary.portal.common.select",
            "primary.portal.accountEnrollments.unsentBusiness.title",
            "primary.portal.accountEnrollments.unsentBusiness.description",
            "primary.portal.accountEnrollments.sentUnsentBusiness.columnNote",
            "primary.portal.common.save",
            "primary.portal.common.saved",
            "primary.portal.common.undoChanges",
            "primary.portal.accountEnrollments.sentUnsentBusiness.annually",
            "primary.portal.accountEnrollments.unsentBusiness.unsentEnrollments",
            "primary.portal.accountEnrollments.sentUnsentBusiness.columnEnrollment",
            "primary.portal.accountEnrollments.sentUnsentBusiness.columnCommissionSplit",
            "primary.portal.accountEnrollments.sentUnsentBusiness.columnSendDate",
            "primary.portal.accountEnrollments.unsentBusiness.unsentAP",
            "primary.portal.accountEnrollments.sentUnsentBusiness.columnProducer",
            "primary.portal.accountEnrollments.unsentBusiness.noResultFound",
            "primary.portal.accountEnrollments.unsentBusiness.selectAll",
            "primary.portal.accountEnrollments.unsentBusiness.deselectAll",
            "primary.portal.accountEnrollments.unsentBusiness.selectRowCount",
            "primary.portal.accountEnrollments.unsentBusiness.deselectRowCount",
            "primary.portal.accountEnrollments.oneDayBeforeEnrollmentSingle",
            "primary.portal.enrollments.eaaRequiredStatus",
            "primary.portal.accountEnrollments.unsentBusiness.selfEnrollmentDescription",
            "primary.portal.accountEnrollments.sentUnsentBusiness.selfEnroll",
            "primary.portal.accountEnrollments.agBusinessNotInList",
            "primary.portal.commissionSplit.repairRequires.errorMsg",
            "primary.portal.commissionSplit.repairRequires.goToCommissionSendSchedule",
            "primary.portal.commissionSplit.repairRequires.invalidError",
            "primary.portal.accountEnrollments.pendingPDACompletion",
            "primary.portal.accountEnrollments.unsentBusiness.commissionSplitWarning",
            "primary.portal.accountEnrollments.unsentBusiness.enrollmentWarning",
        ]);
        this.languageSecondStringsArray = this.langService.fetchSecondaryLanguageValues([
            "secondary.portal.accountEnrollments.selectionRequired",
        ]);
    }

    /**
     * method to initialize all the secondary language strings
     * @returns void
     */
    getSecondaryLanguageStrings(): void {
        this.secondaryLanguageString = this.langService.fetchSecondaryLanguageValues([
            "secondary.portal.commissionSplit.expiredSitCodes.singleRecord",
            "secondary.portal.commissionSplit.expiredSitCodes.multipleRecordsHeader",
            "secondary.portal.commissionSplit.expiredSitCodes.multipleRecords",
            "secondary.portal.accountEnrollments.commissionSplitNotFound",
        ]);
    }

    openAlert(): void {
        if (this.unsentEnrollmentForm.dirty) {
            this.checkAlert = false;
            const dialogData: MonDialogData = {
                title: this.languageStrings["primary.portal.accountEnrollments.leaveWithoutSave.title"],
                content: this.languageStrings["primary.portal.accountEnrollments.leaveWithoutSave.desc"],
                primaryButton: {
                    buttonTitle: this.languageStrings["primary.portal.accountEnrollments.leaveWithoutSave.button"],
                    buttonAction: this.onConfirmDialogAction.bind(this, true),
                    buttonClass: "mon-btn-primary",
                },
                secondaryButton: {
                    buttonTitle: this.languageStrings["primary.portal.common.cancel"],
                    buttonAction: this.onConfirmDialogAction.bind(this, false),
                },
            };

            this.dialog.open(MonDialogComponent, {
                width: "667px",
                data: dialogData,
            });
        }
    }

    onConfirmDialogAction(isSave: boolean): void {
        this.checkAlert = true;
        this.navigationFlag = true;
        if (!isSave) {
            this.navigationFlag = false;
            this.allowNavigation.next(this.navigationFlag);
            this.allowNavigation.complete();
        } else {
            this.allowNavigation.next(this.navigationFlag);
            this.allowNavigation.complete();
        }
    }

    /**
     * Method to extract all the writing numbers
     * in order to extract all the expired and inactive sit codes.
     * @returns void
     */
    getAllWritingNumbers(): void {
        this.isSpinnerLoading = true;
        this.allWritingNumbers = [];
        this.subscriptionList.push(
            forkJoin([
                this.aflacService.getSitCodes(CompanyCode.US, true, true, this.mpGroupId.toString()),
                this.aflacService.getSitCodes(CompanyCode.NY, true, true, this.mpGroupId.toString()),
                this.staticService.getConfigurations(ConfigName.BUSINESS_DISPLAY_MESSAGES_MAXIMUM, +this.mpGroupId),
            ]).subscribe(
                ([writingNumbersUS, writingNumbersNY, businessMaximumMessage]) => {
                    if (writingNumbersUS && writingNumbersUS.length) {
                        this.allWritingNumbers.push(...writingNumbersUS);
                    }
                    if (writingNumbersNY && writingNumbersNY.length) {
                        this.allWritingNumbers.push(...writingNumbersNY);
                    }
                    this.businessDisplayMessagesMaximum = +businessMaximumMessage[0].value;
                    this.getExpiredSitCodes();
                    this.isSpinnerLoading = false;
                },
                () => {
                    this.isSpinnerLoading = false;
                },
            ),
        );
    }

    /**
     * Method to extract all the expired sit codes.
     * @returns void
     */
    getExpiredSitCodes(): void {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        this.expiredSitCodes = [];
        this.expiredSitCodesFiltered = [];
        if (this.allWritingNumbers.length) {
            this.allWritingNumbers.forEach((writingNumber) => {
                this.expiredSitCodes.push(
                    ...writingNumber.sitCodes
                        .filter((sitCode) => {
                            const expirationDate = this.dateService.toDate(
                                this.datePipe.transform(sitCode.expirationDate, DateFormats.MONTH_DAY_YEAR),
                            );
                            expirationDate.setHours(0, 0, 0, 0);
                            return (sitCode.expirationDate !== undefined && todayDate > expirationDate) || !sitCode.active;
                        })
                        .map((sitCode) => {
                            const sitCodeObject: WritingNumberSitCode = {
                                writingNumber: writingNumber.number,
                                sitCodeId: sitCode.id,
                                sitCode: sitCode.code,
                                active: sitCode.active,
                            };
                            if (!sitCode.active) {
                                return sitCodeObject;
                            }
                            return {
                                writingNumber: writingNumber.number,
                                sitCodeId: sitCode.id,
                                sitCode: sitCode.code,
                                expirationDate: this.datePipe.transform(sitCode.expirationDate, DateFormats.MONTH_DAY_YEAR),
                            };
                        }),
                );
                this.expiredSitCodesFiltered =
                    this.expiredSitCodes.length > this.businessDisplayMessagesMaximum
                        ? this.expiredSitCodes.slice(0, this.businessDisplayMessagesMaximum)
                        : this.expiredSitCodes;
            });
        }
    }

    /**
     * Returns commission splits with info about the enrollment state
     * @param commissionSplits list of commission splits
     * @param sitCodes list of all SIT codes
     *
     * @returns list of commission splits with info about the enrollment state
     */
    getCommissionSplitsWithEnrollmentState(commissionSplits: CommissionSplit[], sitCodes: SITCode[]): CommissionSplit[] {
        return commissionSplits.map((commissionSplit) => {
            const sitCode = sitCodes.find((sitCodeObj) => sitCodeObj.id === commissionSplit.assignments[0].sitCodeId);
            if (sitCode) {
                return { ...commissionSplit, enrollmentState: sitCode.companyCode };
            }
            return commissionSplit;
        });
    }

    /**
     * Gets all SIT codes from a list of writing numbers
     * @param writingNumbers list of writing numbers
     *
     * @returns list of SIT codes
     */
    getAllSITCodesFromWritingNumbers(writingNumbers: WritingNumber[]): SitCode[] {
        return writingNumbers.map((writingNumber) => writingNumber.sitCodes).reduce((acc, curr) => [...acc, ...curr], []);
    }
    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.checkAlert = false;
        this.store
            .select(SharedState.portal)
            .pipe(
                switchMap((portal) => this.notificationService.getNotifications(portal, +this.mpGroupId)),
                take(1),
            )
            .subscribe();
        if (this.allowNavigation) {
            this.allowNavigation.unsubscribe();
        }
        this.subscriptionList.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }

    /**
     * Hide the alert box once click on close icon
     * @returns void
     */
    hideAlertBox(): void {
        this.enrollmentSentCount = 0;
    }
    /**
     * Comparitor function used to determine if the sent select has this option selected. Without it, there is no visual
     * cue that something has been selected.
     *
     * @param optionOne First selected option
     * @param optionTwo Second selected option
     */
    sentSelectCompareWith(optionOne: SentSelectOption, optionTwo: SentSelectOption): boolean {
        return (!optionOne && !optionTwo) || (optionOne && optionTwo && optionOne.type === optionTwo.type);
    }

    /**
     * Navigates to commission split tab in Commission page
     */
    navigateToCommissionSplit(): void {
        const routePath = this.isProducer ? "../../commissions" : "../commissions";
        this.router.navigate([routePath], {
            queryParams: { page: COMMISSION_SPLIT_PARAM },
            relativeTo: this.route,
        });
    }
}

interface SentSelectOption {
    enrollmentId?: number;
    type: string;
    dateVal: string | null;
    value: string | null;
    type_literal: TRANSMITTAL_SCHEDULE;
    hideOption?: boolean;
}
