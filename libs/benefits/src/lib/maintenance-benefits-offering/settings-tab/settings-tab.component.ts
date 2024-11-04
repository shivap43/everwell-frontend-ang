import { Component, OnInit, Output, EventEmitter, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import {
    BenefitsOfferingService,
    StaticService,
    ProducerService,
    AppTakerService,
    AccountService,
    AccountDetails,
    AflacService,
} from "@empowered/api";
import { takeUntil, catchError, tap, filter, switchMap } from "rxjs/operators";
import { Subject, forkJoin, of, Observable, combineLatest } from "rxjs";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { EditStatesPopUpComponent } from "./edit-states-pop-up/edit-states-pop-up.component";
import { EditEmployeesPopUpComponent } from "./edit-employees-pop-up/edit-employees-pop-up.component";
import { Store } from "@ngxs/store";

import {
    BenefitsOfferingState,
    SetNewPlanYearPanel,
    SetMaintenanceRequiredData,
    GetProductsPanel,
    SetEligibleEmployees,
    SetAllEligiblePlans,
    SetProductPlanChoices,
    SetUnapprovedPanel,
    SetPlanEligibility,
    AccountInfoState,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { EditPlanYearComponent } from "./edit-plan-year/edit-plan-year.component";
import { DatePipe } from "@angular/common";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { ProductsPlansQuasiComponent } from "../products-plans-quasi/products-plans-quasi.component";
import { ProductsPlansQuasiService } from "../products-plans-quasi/services/products-plans-quasi.service";
import { EmployeeMinimunPopupComponent } from "./employee-minimun-popup/employee-minimun-popup.component";
import { BenefitOfferingHelperService } from "../../benefit-offering-helper.service";
import { EditTppPopupComponent } from "./edit-tpp-popup/edit-tpp-popup.component";
import { MonDialogComponent, UpdateArgusEmployeeCountComponent } from "@empowered/ui";
import {
    Permission,
    DateFormats,
    ArgusConfig,
    ModalDialogAction,
    ServerErrorResponseCode,
    PagePrivacy,
    PlanPanelModel,
    AccountImportTypes,
    AppSettings,
    ArgusEligibleEmployeeData,
    CompanyCode,
    PlanChoice,
    PlanYearType,
    CountryState,
    Accounts,
    StatusType,
    ConfigName,
    PlanYear,
    PlanYearModel,
    Account,
} from "@empowered/constants";
import { RemovePlanYearComponent } from "./remove-plan-year/remove-plan-year.component";
import { EditAgPlanYearComponent } from "./edit-ag-plan-year/edit-ag-plan-year.component";
import { InforceReportUploadComponent } from "./inforce-report-upload/inforce-report-upload.component";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";
import { AccountsActions } from "@empowered/ngrx-store/ngrx-states/accounts";
import { getSelectedAccount } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.selectors";
import { select } from "@ngrx/store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";

const PLAN_YEAR = "planYear";
const ENROLLMENT_DATE = "enrollmentDate";
const COVERAGE_DATES = "coverageDates";
const STATUS = "status";
const MANAGE = "manage";
const IN_FORCE_REPORT = "inForceReport";
const TPP_PLANS = "tppPlans";
const ALL_PLANS = "allPlans";
const PLAN_YEAR_START_DATE = "plan_year_start_date";
const PLAN_YEAR_END_DATE = "plan_year_end_date";
const COMPANY_CODE_ATTRIBUTE = "company_code";
const COMPANY_CODE = "CompanyCode";
const ERROR = "error";
const VIEW = "view";
const EDIT = "edit";

interface PlanYearDetailTable {
    planYearEditable: boolean;
    enrollmentEditable: boolean;
    enrollAndCoverageEditable: boolean;
    planYearDetails: PlanYear;
    removablePlan: boolean;
    approvalStatus: StatusType;
    pendingApprovalContent: string;
}

@Component({
    selector: "empowered-settings-tab",
    templateUrl: "./settings-tab.component.html",
    styleUrls: ["./settings-tab.component.scss"],
})
export class SettingsTabComponent implements OnInit, OnDestroy {
    settingsDisplayedColumns: string[];
    mpGroup: any;
    isSettingUpdated: boolean;
    isLoading: boolean;
    unsubscribe$ = new Subject<void>();
    recentCensusDetails: any = null;
    benefitOfferingStateDetails: CountryState[] = [];
    producerLicensedStateDetails: CountryState[] = [];
    staticStateDetails: CountryState[] = [];
    censusEstimate: any;
    argusTotalEligibleEmployees: number;
    state = "";
    editStateDialogRef: MatDialogRef<EditStatesPopUpComponent>;
    editPlanYearEstimateDialogRef: MatDialogRef<EditPlanYearComponent>;
    planYearDetails: any[] = [];
    isRole20User = false;
    planYearData: any[] = [];
    planChoices: PlanChoice[] = [];
    approvedPlanChoices: PlanChoice[] = [];
    unApprovedPlanChoices: PlanChoice[] = [];
    alertDialogRef: MatDialogRef<MonDialogComponent>;
    removePyDialogRef: MatDialogRef<RemovePlanYearComponent>;
    approvalRequests = [];
    unApprovedPlanYears = [];
    isRequestPending: boolean;
    approvalRequestStatusArray: any;
    approvalStatusPending = false;
    @Output() emitUnApprovedSettings = new EventEmitter<unknown>();
    @Output() planYearEnding = new EventEmitter<number>();
    approvedProductChoices = [];
    latestPlanYear: PlanYear;
    dateFormat = DateFormats.MONTH_DAY_YEAR;
    companyCode: string;
    isArgusEligibleEmployeeUpdated = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.settingsTab.settingsUpdated",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.servicedStates",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.editServicedStates",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.eligibleEmployees",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.editEligibleEmployees",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.planYearDetails",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.planYearDetailsDescription",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.planYearDetailsDescNonZero",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.newPlanYear",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.planYear",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.enrollmentDate",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.coverageDates",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.status",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.manage",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.viewDetails",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.viewOrEditdDetails",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.removePlanYear",
        "primary.portal.common.edit",
        "primary.portal.common.ariaShowMenu",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.thirdPartyTitle",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.tppAvailablePlans",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.tppAllPlans",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.removePlanYearContent",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.notReady",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.hqPendingAdminApproval",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.pendingAdminApproval",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.uploadReport",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.inforceReport",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.nonAgNewPlanYear",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.eligible.employee.heading",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.aflac.dentalVision.eligible",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.estimated.eligible",
        "primary.portal.benefitsOffering.aflac.ADVEnrollment",
        "primary.portal.benefitsOffering.note",
        "primary.portal.planDetails.view",
    ]);
    currentAccount: AccountDetails;
    accountLocked: boolean;
    constantSave = "save";
    account: Accounts;
    isSitusNY: boolean;
    NEW_YORK = "NY";
    censusEstimateOld: number;
    isAdmin: boolean;
    isActiveTPP = false;
    role20DeletePermission = false;
    showDeletionDetails = false;
    disableNewPlanYears = false;
    isAGOnly = false;
    planYearTypes = PlanYearType;
    permissionEnum = Permission;
    // checks the users associated upload permission
    hasUploadPermission$: Observable<boolean> = this.staticUtilService.hasPermission(Permission.IN_FORCE_REPORT_UPLOAD);
    isHQIntAdmin = false;
    accountImportTypes = AccountImportTypes;
    isVestedAgent: boolean;
    canEditOEEndDate = false;
    canEditCoverageEndDate = false;
    isCafeteriaPlan = false;
    eligibleADVMinEmployeeCount: number;
    eligibleADVMaxEmployeeCount: number;
    isRefreshInProgress = false;
    isSuccess: boolean;
    isError: boolean;
    isServerError: boolean;
    isAccountRefreshFailure: boolean;
    disableEditLink: boolean;
    unpluggedAccessAllowed = true;
    checkedOut = false;
    maintainanceLock = true;
    view = VIEW;
    edit = EDIT;
    validZip = true;
    enableGIEligibleDateMessage$: Observable<boolean>;
    isEnroller: boolean;
    isPrivacyOnForEnroller: boolean;
    giEnrollmentDefaultEndDate: string;
    account$: Observable<Account>;
    constructor(
        private readonly route: ActivatedRoute,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly staticService: StaticService,
        private readonly producerService: ProducerService,
        private readonly dialog: MatDialog,
        private readonly store: Store,
        private readonly datepipe: DatePipe,
        private readonly language: LanguageService,
        private readonly appTakerService: AppTakerService,
        private readonly utilService: UtilService,
        private readonly quasiService: ProductsPlansQuasiService,
        private readonly accountService: AccountService,
        private readonly benefitsOfferingHelperService: BenefitOfferingHelperService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly staticUtilService: StaticUtilService,
        private readonly empoweredModal: EmpoweredModalService,
        private readonly aflacService: AflacService,
        private readonly sharedService: SharedService,
        private readonly dateService: DateService,
        private readonly ngrxStore: NGRXStore,
    ) {
        this.isEnroller = this.store.selectSnapshot(SharedState.getPrivacyForEnroller);
        if (this.isEnroller) {
            this.isPrivacyOnForEnroller = this.sharedService.getPrivacyConfigforEnroller(PagePrivacy.BENEFIT_OFFERING_MANAGE_SETTINGS);
        }
    }

    /**
     * Implements Angular OnInit Life Cycle hook on page load.
     * check if logged-in user is Admin,get company code and get AccountInfo from store
     * function calls to get the plan year data, plan choices and check for active TPP
     * It also checks for cafeteria plans
     */
    ngOnInit(): void {
        this.mpGroup = this.route.parent.snapshot.parent.parent.params.mpGroupId;
        this.ngrxStore.dispatch(AccountsActions.setSelectedMPGroup({ mpGroup: this.mpGroup }));
        this.account$ = this.ngrxStore.onAsyncValue(select(getSelectedAccount));
        this.account$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            this.companyCode = resp.companyCode;
        });
        this.sharedService.currentUnpluggedDetails$.pipe(takeUntil(this.unsubscribe$)).subscribe((unpluggedDetails) => {
            this.checkedOut = unpluggedDetails.isCheckedOut;
            this.maintainanceLock = unpluggedDetails.hasMaintenanceLock;
            this.unpluggedAccessAllowed = unpluggedDetails.allowAccess;
        });
        this.store.select(SharedState.hasPermission(Permission.UPDATE_PLAN_COVERAGE_DATE)).subscribe((res) => {
            this.isRole20User = res;
        });
        this.isAdmin = this.quasiService.isAdminLoggedIn();
        this.getCredential();
        this.isSettingUpdated = false;
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        this.staticUtilService.hasPermission(Permission.DELETE_PLAN_YEAR).subscribe((role20DeletePermission) => {
            this.role20DeletePermission = role20DeletePermission;
        });

        combineLatest([
            this.staticUtilService.cacheConfigValue(ArgusConfig.ELIGIBLE_EMPLOYEES_MIN_VALUE),
            this.staticUtilService.cacheConfigValue(ArgusConfig.ELIGIBLE_EMPLOYEES_MAX_VALUE),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([argusMinValue, argusMaxValue]) => {
                this.eligibleADVMinEmployeeCount = Number(argusMinValue);
                this.eligibleADVMaxEmployeeCount = Number(argusMaxValue);
            });

        this.serviceCalls();
        this.checkActiveTPP();
        this.currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        this.isAGOnly = this.currentAccount && this.currentAccount.importType === AccountImportTypes.AFLAC_GROUP;
        this.checkForVestedAgents();
        combineLatest([
            this.staticUtilService.hasPermission(Permission.BENEFIT_OFFERING_UPDATE_COVERAGE_END_DATE),
            this.staticUtilService.hasPermission(Permission.BENEFIT_OFFERING_UPDATE_OE_END_DATE),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([coverageEndDate, enrollmentEndDate]) => {
                this.canEditCoverageEndDate = coverageEndDate;
                this.canEditOEEndDate = enrollmentEndDate;
            });
        this.checkForCafeteriaPlan();

        this.utilService
            .validateZip(this.currentAccount.situs.state.abbreviation, this.currentAccount.situs.zip)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.validZip = resp;
            });
        this.staticUtilService
            .cacheConfigValue(ConfigName.DEFAULT_GI_ENROLLMENT_END_DATE)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((defaultGIEnrollmentEndDate) => {
                this.giEnrollmentDefaultEndDate = defaultGIEnrollmentEndDate;
            });
    }
    /**
     * To check if it is cafeteria plan
     */
    checkForCafeteriaPlan(): void {
        combineLatest([
            this.accountService.getGroupAttributesByName([PLAN_YEAR_START_DATE]),
            this.accountService.getGroupAttributesByName([PLAN_YEAR_END_DATE]),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([startDate, endDate]) => {
                this.isCafeteriaPlan =
                    this.dateService.isValid(this.dateService.toDate(startDate[0].value || "")) &&
                    this.dateService.isValid(this.dateService.toDate(endDate[0].value || ""));
            });
    }
    /**
     * This method is to check for role 71 and make readonly
     * @returns void
     */
    checkForVestedAgents(): void {
        combineLatest([
            this.staticUtilService.hasPermission(Permission.BO_SETTINGS_UPDATE),
            this.staticUtilService.hasPermission(Permission.CENSUS_ESTIMATE_UPDATE),
            this.staticUtilService.hasPermission(Permission.BO_PLAN_YEAR_CREATE),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([settingUpdate, censusEstimate, planYear]) => {
                this.isVestedAgent = !settingUpdate && !censusEstimate && !planYear;
            });
    }
    /**
     * Get the plan choices
     * service calls for required data
     */
    serviceCalls(): void {
        if (!this.isArgusEligibleEmployeeUpdated) {
            this.store.dispatch(new SetAllEligiblePlans([], AccountImportTypes.AFLAC_INDIVIDUAL));
        } else {
            this.isArgusEligibleEmployeeUpdated = false;
        }
        this.approvedPlanChoices = this.store.selectSnapshot(BenefitsOfferingState.getPlanChoices);
        this.unApprovedPlanChoices = this.store.selectSnapshot(BenefitsOfferingState.getUnapprovedPlanChoices);
        this.planChoices = [...this.approvedPlanChoices];
        this.planChoices.push(...this.unApprovedPlanChoices);
        this.benefitOfferingStateDetails = [];
        this.planYearDetails = [];
        this.planYearData = [];
        this.producerLicensedStateDetails = [];
        this.staticStateDetails = [];
        this.state = "";
        this.isLoading = true;
        this.getRequiredInformation().subscribe();
    }
    /**
     * function to get the required information
     * @returns Observable<CountryState[]>
     */
    getRequiredInformation(): Observable<CountryState[]> {
        this.planYearDetails = [];
        return forkJoin([
            this.benefitsOfferingService.getRecentCensusConflict(this.mpGroup),
            this.producerService.getAllProducersLicensedStates(this.mpGroup),
            this.staticService.getStates(),
            this.benefitsOfferingService.getBenefitOfferingSettings(this.mpGroup),
            this.benefitsOfferingService.getPlanYears(this.mpGroup, false, false, true),
            this.benefitsOfferingService.getPlanYears(this.mpGroup, true, false, true),
            this.benefitsOfferingService.getApprovalRequests(this.mpGroup),
            this.benefitsOfferingService.getProductChoices(this.mpGroup, false),
            this.accountService.getAccount(this.mpGroup.toString()),
        ]).pipe(
            takeUntil(this.unsubscribe$),
            tap(
                ([
                    recentCensusDetails,
                    producerLicensedStateDetails,
                    staticStateDetails,
                    benefitOfferningSettings,
                    planYearDetails,
                    unApprovedPlanYears,
                    approvalRequests,
                    approvedProductChoices,
                    account,
                ]: any) => {
                    // resp is taking type of first response data. Hence, adding 'any' for different reponse types.
                    this.recentCensusDetails = recentCensusDetails;
                    this.producerLicensedStateDetails = producerLicensedStateDetails;
                    this.staticStateDetails = staticStateDetails;
                    this.censusEstimate = benefitOfferningSettings.totalEligibleEmployees;
                    this.benefitsOfferingService.setBenefitOfferingSettingsData(benefitOfferningSettings);
                    this.argusTotalEligibleEmployees = benefitOfferningSettings.argusTotalEligibleEmployees;
                    this.benefitOfferingStateDetails = benefitOfferningSettings.states;
                    this.planYearDetails = planYearDetails;
                    this.unApprovedPlanYears = unApprovedPlanYears;
                    this.approvalRequests = [...approvalRequests];
                    this.approvalRequestStatusArray = [...approvalRequests];
                    this.approvedProductChoices = [...approvedProductChoices];
                    this.account = account;
                    this.arrangeData();
                    this.getAccountMainntanaceLockstatus();
                    this.checkPlanYearEnding();
                    this.getPlanYearDetails();
                },
            ),
        );
    }
    /**
     * function to upload in-force report
     * @param planYear: PlanYearModel - the current plan year
     */
    uploadReport(planYear: PlanYearModel): void {
        this.empoweredModalService
            .openDialog(InforceReportUploadComponent, {
                data: {
                    lastUploadedFileDate:
                        planYear.inForceFileDetails && planYear.inForceFileDetails.uploadDate
                            ? planYear.inForceFileDetails.uploadDate
                            : null,
                    lastUploadFileName:
                        planYear.inForceFileDetails && planYear.inForceFileDetails.fileName ? planYear.inForceFileDetails.fileName : null,
                    uploadedAdminName:
                        planYear.inForceFileDetails && planYear.inForceFileDetails.uploadAdmin
                            ? planYear.inForceFileDetails.uploadAdmin.name
                            : null,
                    planYearId: planYear.id,
                    mpGroup: this.mpGroup,
                },
            })
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap(() => {
                    this.state = "";
                    this.isLoading = true;
                    return this.getRequiredInformation();
                }),
            )
            .subscribe();
    }
    /**
     * function to check plan year will be ending within 90 days
     */
    checkPlanYearEnding(): void {
        const allPlanYears: PlanYear[] = this.planYearDetails.concat(this.unApprovedPlanYears);
        const planYearEndingCounts: number = this.quasiService.checkPlanYearEnding(
            this.approvedPlanChoices,
            this.unApprovedPlanChoices,
            allPlanYears,
        );
        this.planYearEnding.emit(planYearEndingCounts);
    }
    /**
     * checking for NY account for dropdown states
     */
    filterDropdownStates(): void {
        if (this.account && this.account.situs && this.account.situs.state && this.account.situs.state.abbreviation) {
            this.staticStateDetails = this.staticStateDetails.filter(
                (state) =>
                    (this.companyCode === CompanyCode.NY && state.abbreviation === this.NEW_YORK) ||
                    (this.companyCode === CompanyCode.US && state.abbreviation !== this.NEW_YORK),
            );
            this.isSitusNY =
                (this.account.situs.state.abbreviation === this.NEW_YORK && this.companyCode !== CompanyCode.US) ||
                (this.account.situs.state.abbreviation !== this.NEW_YORK && this.companyCode === CompanyCode.NY);
        }
    }

    getAccountMainntanaceLockstatus(): void {
        this.isLoading = true;
        this.appTakerService
            .getMaintananceLock(this.mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.accountLocked = !response;
                    this.isLoading = false;
                    this.setIsRequestPendingFlag();
                },
                () => {
                    this.isLoading = false;
                    this.setIsRequestPendingFlag();
                },
            );
    }
    /**
     * This method is used to set approval request pending alert
     */
    setIsRequestPendingFlag(): void {
        const recentApprovalRequest = this.approvalRequests.pop();
        this.isRequestPending = false;
        if (
            (recentApprovalRequest && recentApprovalRequest.status === StatusType.SUBMITTED_TO_HQ) ||
            (recentApprovalRequest && recentApprovalRequest.status === StatusType.SUBMITTED_TO_HR) ||
            (this.currentAccount && this.currentAccount.status && this.currentAccount.locked && this.accountLocked) ||
            (this.currentAccount && this.currentAccount.status && this.currentAccount.status === AppSettings.INACTIVE)
        ) {
            this.isRequestPending = true;
        }
    }

    arrangeData(): void {
        this.benefitOfferingStateDetails.forEach((state) => {
            if (this.state === "") {
                this.state = state.name;
            } else {
                this.state = this.state + ", " + state.name;
            }
        });
        this.arrangePlanYearInformation(this.planYearDetails, StatusType.APPROVED);
        this.arrangePlanYearInformation(this.unApprovedPlanYears, StatusType.PENDING);
        this.setSettingStatus();
    }
    /**
     * Set the plan year information based on the approvals and permissions
     * @param planYearDetails all plan years
     * @param approvalStatus approval status of the plan years
     */
    arrangePlanYearInformation(planYearDetails: any[], approvalStatus?: any): void {
        const planYearPlans = this.planChoices.filter((plan) => plan.continuous === false);
        planYearDetails.forEach((year) => {
            const planYears = this.utilService.copy(this.planYearData);
            planYears.forEach((data, index) => {
                if (data.planYearDetails.id === year.id) {
                    this.planYearData.splice(index, 1);
                }
            });
        });
        planYearDetails.forEach((eachPlanYear: PlanYear) => {
            let planYearEditable = true,
                enrollmentEditable = true,
                enrollAndCoverageEditable = true,
                removablePlan = true;
            const today = this.datepipe.transform(new Date(), AppSettings.DATE_FORMAT_MM_DD_YYYY);
            const plans = planYearPlans.filter((choice) => choice.planYearId === eachPlanYear.id);
            if (plans.length && !this.role20DeletePermission) {
                removablePlan = false;
            }
            this.showDeletionDetails = plans.length && this.role20DeletePermission;
            if (
                this.dateService.toDate(
                    this.datepipe.transform(eachPlanYear.coveragePeriod.effectiveStarting, AppSettings.DATE_FORMAT_MM_DD_YYYY),
                ) < this.dateService.toDate(today)
            ) {
                planYearEditable = false;
            }
            if (
                this.dateService.toDate(
                    this.datepipe.transform(eachPlanYear.enrollmentPeriod.effectiveStarting, AppSettings.DATE_FORMAT_MM_DD_YYYY),
                ) <= this.dateService.toDate(today) ||
                !this.canEditOEEndDate
            ) {
                enrollmentEditable = false;
            }
            if (
                this.dateService.toDate(
                    this.datepipe.transform(eachPlanYear.coveragePeriod.effectiveStarting, DateFormats.MONTH_DAY_YEAR),
                ) < this.dateService.toDate(today) &&
                this.dateService.toDate(eachPlanYear.enrollmentPeriod.effectiveStarting) < this.dateService.toDate(today) &&
                !(
                    this.isRole20User &&
                    this.dateService.toDate(
                        this.datepipe.transform(eachPlanYear.coveragePeriod.expiresAfter, DateFormats.MONTH_DAY_YEAR),
                    ) >= this.dateService.toDate(today)
                ) &&
                !this.canEditCoverageEndDate
            ) {
                enrollAndCoverageEditable = false;
            }
            const adminTooltipContent =
                eachPlanYear.type !== PlanYearType.AFLAC_GROUP
                    ? this.languageStrings["primary.portal.maintenanceBenefitsOffering.settingsTab.pendingAdminApproval"]
                    : this.languageStrings["primary.portal.maintenanceBenefitsOffering.settingsTab.hqPendingAdminApproval"];
            // eslint-disable-next-line max-len
            const pendingApprovalContent = `<b>${this.languageStrings["primary.portal.maintenanceBenefitsOffering.settingsTab.notReady"]}</b><br>${adminTooltipContent}`;
            const planYears: PlanYearDetailTable = {
                planYearEditable: planYearEditable,
                enrollmentEditable: enrollmentEditable,
                enrollAndCoverageEditable: enrollAndCoverageEditable,
                planYearDetails: eachPlanYear,
                removablePlan: removablePlan,
                approvalStatus: approvalStatus,
                pendingApprovalContent: pendingApprovalContent,
            };
            this.planYearData.push(planYears);
        });
        if (this.planYearData.filter((planYear) => planYear.approvalStatus === StatusType.PENDING).length > 0) {
            this.disableNewPlanYears = true;
        }
        this.isLoading = false;
    }
    /**
     * Open the popup to remove the plan year and set the plans and products choices
     * @param planYear the plan year to be removed
     */
    removePlan(planYear: any): void {
        this.removePyDialogRef = this.empoweredModalService.openDialog(RemovePlanYearComponent, {
            data: {
                planYear: planYear.planYearDetails.name,
                showDeletionDetails: this.showDeletionDetails,
            },
        });
        this.removePyDialogRef
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((remove) => remove === true && remove !== undefined),
                switchMap(() => this.benefitsOfferingService.deletePlanYear(this.mpGroup, planYear.planYearDetails.id)),
                switchMap(() => this.store.dispatch(new SetProductPlanChoices())),
                switchMap(() => this.store.dispatch(new SetAllEligiblePlans([], AccountImportTypes.AFLAC_INDIVIDUAL))),
            )
            .subscribe(() => {
                this.store.dispatch(new GetProductsPanel());
                this.store.dispatch(new SetUnapprovedPanel());
                this.serviceCalls();
                this.isSettingUpdated = true;
            });
    }
    /**
     * This method is used to open edit states pop-up
     */
    goToEditStates(): void {
        if (this.maintainanceLock && this.unpluggedAccessAllowed) {
            const benefitStates = this.benefitOfferingStateDetails;
            this.filterDropdownStates();
            this.editStateDialogRef = this.dialog.open(EditStatesPopUpComponent, {
                hasBackdrop: true,
                width: "700px",
                panelClass: "edit-state",
                data: {
                    states: [...benefitStates],
                    staticStates: this.staticStateDetails,
                    recentcensusData: this.recentCensusDetails,
                    licensedStates: this.producerLicensedStateDetails,
                    mpGroup: this.mpGroup,
                    isSitusNY: this.isSitusNY,
                    groupSitusState: this.account.situs.state.name,
                },
            });
            this.editStateDialogRef
                .afterClosed()
                .pipe(
                    takeUntil(this.unsubscribe$),
                    filter((data) => data === this.constantSave),
                    tap(() => {
                        this.isLoading = true;
                    }),
                    switchMap(() => this.store.dispatch(new SetAllEligiblePlans([], AccountImportTypes.AFLAC_INDIVIDUAL))),
                    switchMap(() => this.store.dispatch(new SetPlanEligibility())),
                    tap(() => {
                        this.store.dispatch(new GetProductsPanel());
                        this.store.dispatch(new SetUnapprovedPanel());
                        this.state = "";
                    }),
                    switchMap(() => this.getRequiredInformation()),
                )
                .subscribe((data) => {
                    this.isSettingUpdated = true;
                });
        }
    }

    /**
     * Method to open edit Employee popup to edit estimate number of employees
     * @param updateOldFlag boolean flag to store information whether the Estimate needs update.
     */
    goToEditEstimate(updateOldFlag: boolean): void {
        if (this.maintainanceLock && this.unpluggedAccessAllowed) {
            if (updateOldFlag) {
                this.censusEstimateOld = this.censusEstimate;
            }
            const editEstimateDialogRef = this.dialog.open(EditEmployeesPopUpComponent, {
                hasBackdrop: true,
                width: "700px",
                panelClass: "edit-estimate",
                data: {
                    totalEligible: this.censusEstimate,
                    recentcensusData: this.recentCensusDetails,
                    mpGroup: this.mpGroup,
                    states: this.benefitOfferingStateDetails.map((state) => state.abbreviation),
                },
            });
            editEstimateDialogRef
                .afterClosed()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((status) => {
                    if (status === true) {
                        this.censusEstimate = this.store.selectSnapshot(BenefitsOfferingState.geteligibleEmployees);
                        this.censusEstimateOld = this.censusEstimate;
                        this.serviceCalls();
                        this.isSettingUpdated = true;
                    } else if (status !== AppSettings.CANCEL) {
                        this.minEmployeePopup(status);
                    } else if (status === AppSettings.CANCEL) {
                        const updatedCensusInfo = {
                            totalEligibleEmployees: this.censusEstimateOld,
                        };
                        this.benefitsOfferingService
                            .saveBenefitOfferingSettings(updatedCensusInfo, this.mpGroup)
                            .pipe(takeUntil(this.unsubscribe$))
                            .subscribe((res) => {
                                this.store.dispatch(new SetEligibleEmployees(this.censusEstimateOld));
                                this.censusEstimate = this.censusEstimateOld;
                            });
                    }
                });
        }
    }
    /**
     * function to open dialog for update argus employee count
     */
    openArgusDialogOnEdit(): void {
        if (this.maintainanceLock && this.unpluggedAccessAllowed) {
            const dialogData: ArgusEligibleEmployeeData = {
                eligibleADVMinEmployeeCount: this.eligibleADVMinEmployeeCount,
                eligibleADVMaxEmployeeCount: this.eligibleADVMaxEmployeeCount,
                employeeCount: this.argusTotalEligibleEmployees,
                mpGroup: this.mpGroup,
            };
            this.empoweredModal
                .openDialog(UpdateArgusEmployeeCountComponent, {
                    data: dialogData,
                })
                .afterClosed()
                .pipe(
                    tap((argusEmployeeCountResp) => {
                        if (argusEmployeeCountResp && argusEmployeeCountResp.action === ModalDialogAction.SAVED) {
                            this.isRefreshInProgress = argusEmployeeCountResp.isRefresh;
                            this.isSuccess = false;
                            this.isServerError = false;
                            this.isAccountRefreshFailure = false;
                            this.argusTotalEligibleEmployees = +argusEmployeeCountResp.eligibleADVEmp;
                        } else {
                            this.isRefreshInProgress = false;
                        }
                    }),
                    filter((result) => result && result.action === ModalDialogAction.SAVED),
                    // override the refresh account behavior upon updating argus eligible employee count
                    switchMap(() => this.aflacService.refreshAccount(this.mpGroup.toString(), true)),
                    switchMap(() => {
                        this.isArgusEligibleEmployeeUpdated = true;
                        return this.store
                            .dispatch(new SetAllEligiblePlans([], AccountImportTypes.AFLAC_INDIVIDUAL))
                            .pipe(tap(() => this.resetPanelProducts()));
                    }),
                )
                .subscribe(
                    () => {
                        this.isRefreshInProgress = false;
                        this.isSuccess = true;
                    },
                    (error) => {
                        this.isRefreshInProgress = false;
                        this.accountRefreshErrorAlertMessage(error);
                    },
                );
        }
    }

    /**
     * function to show error message for account refresh
     */
    accountRefreshErrorAlertMessage(err: Error): void {
        if (err[ERROR] && err[ERROR].status === ServerErrorResponseCode.RESP_503) {
            this.isServerError = true;
        } else {
            this.isAccountRefreshFailure = true;
        }
    }
    /**
     * Method opens Employee Minimun Popup Component
     * @param status response received on close of dialog
     */
    private minEmployeePopup(status: {
        ineligiblePlans: PlanPanelModel[];
        eligibleEmployeeInformation: unknown;
        recentEstimate: number;
    }): void {
        this.censusEstimate = this.store.selectSnapshot(BenefitsOfferingState.geteligibleEmployees);
        const employeeMinimumDialogRef = this.dialog.open(EmployeeMinimunPopupComponent, {
            backdropClass: "backdrop-blur",
            maxWidth: "600px",
            panelClass: "employee-minimum",
            data: {
                ineligiblePlans: status.ineligiblePlans,
                eligibleEmployeeInformation: status.eligibleEmployeeInformation,
                recentEstimate: status.recentEstimate,
            },
        });
        employeeMinimumDialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                if (response === true) {
                    this.serviceCalls();
                    this.isSettingUpdated = true;
                } else if (response === AppSettings.CANCEL) {
                    const updatedCensusInfo = {
                        totalEligibleEmployees: this.censusEstimateOld,
                    };
                    this.benefitsOfferingService
                        .saveBenefitOfferingSettings(updatedCensusInfo, this.mpGroup)
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((res) => {
                            this.store.dispatch(new SetEligibleEmployees(this.censusEstimateOld));
                            this.censusEstimate = this.censusEstimateOld;
                        });
                    this.dialog.closeAll();
                } else if (!response) {
                    // edit employee popup should open
                    this.goToEditEstimate(false);
                }
            });
    }
    /**
     * This method is used to set approval request pending alert
     */
    setSettingStatus(): void {
        if (
            this.approvalRequestStatusArray.length &&
            (this.approvalRequestStatusArray[this.approvalRequestStatusArray.length - 1].status === StatusType.SUBMITTED_TO_HQ ||
                this.approvalRequestStatusArray[this.approvalRequestStatusArray.length - 1].status === StatusType.SUBMITTED_TO_HR)
        ) {
            this.approvalStatusPending = true;
            const plansCount: number = this.benefitsOfferingHelperService.getPlansCountToDisplayInPendingAlert(
                this.approvalRequestStatusArray[this.approvalRequestStatusArray.length - 1],
            );
            this.emitUnApprovedSettings.emit({
                status: this.approvalRequestStatusArray[this.approvalRequestStatusArray.length - 1].status,
                plans: plansCount,
            });
        }
    }
    /**
     * method to open edit plan year pop-up
     * @param planYearDetails selected plan year details
     * @param openMode if edit plan year pop-up  is only view or edit
     */
    editPlanYearDetails(planYearDetails: PlanYearDetailTable, openMode: string): void {
        const planYearPlans = this.planChoices.filter(
            (eachPlan) => eachPlan && planYearDetails && eachPlan.planYearId && eachPlan.planYearId === planYearDetails.planYearDetails.id,
        );
        const isQ60 = planYearPlans.some((plan) => plan.plan.policySeries.includes("Q60"));
        this.enableGIEligibleDateMessage$ = this.benefitsOfferingHelperService.enableGIEligibleDateMessage(this.mpGroup.toString());
        this.editPlanYearEstimateDialogRef = this.dialog.open(EditPlanYearComponent, {
            hasBackdrop: true,
            width: "700px",
            data: {
                planYear: planYearDetails,
                openMode: openMode,
                mpGroup: this.mpGroup,
                plans: planYearPlans,
                isActive: planYearDetails.planYearDetails.activeEnrollments,
                isQ60Selected: isQ60,
                enableGIEligibleDateMessage$: this.enableGIEligibleDateMessage$,
                giEnrollmentDefaultEndDate: this.giEnrollmentDefaultEndDate,
            },
        });
        this.editPlanYearEstimateDialogRef.afterClosed().subscribe((data) => {
            if (data === this.constantSave) {
                this.serviceCalls();
                this.isSettingUpdated = true;
            }
        });
    }
    /**
     * This method is used to open edit/view planYear modal
     * @param planYearDetails is the planYear which has to be edited / viewed
     * @param isEditable represents whether planYear is editable or not
     */
    editAgPlanYear(planYearDetails: PlanYear, isEditable: boolean): void {
        this.empoweredModalService
            .openDialog(EditAgPlanYearComponent, {
                data: {
                    planYear: planYearDetails,
                    isEditable: isEditable,
                    mpGroup: this.mpGroup,
                    latestPlanYear: this.latestPlanYear,
                    latestApprovalRequest: this.utilService.copy(this.approvalRequestStatusArray).pop(),
                },
            })
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((isUpdated) => isUpdated),
                switchMap((res) =>
                    combineLatest([
                        this.benefitsOfferingService.getPlanYears(this.mpGroup, false),
                        this.benefitsOfferingService.getPlanYears(this.mpGroup, true),
                    ]),
                ),
                tap(([approvedPlanYears, unapprovedPlanYears]) => {
                    this.planYearDetails = approvedPlanYears;
                    this.unApprovedPlanYears = unapprovedPlanYears;
                    this.isSettingUpdated = true;
                    this.planYearData = [];
                    this.arrangePlanYearInformation(this.planYearDetails, StatusType.APPROVED);
                    this.arrangePlanYearInformation(this.unApprovedPlanYears, StatusType.PENDING);
                }),
            )
            .subscribe();
    }
    /**
     * This method will execute on click of create new plan year button
     */
    loadNewPlanYearQuasi(): void {
        this.isLoading = true;
        this.store
            .dispatch(new SetNewPlanYearPanel())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.isLoading = false;
            });
        const newPlanYearDialogRef = this.dialog.open(ProductsPlansQuasiComponent, {
            minWidth: "100%",
            height: "100%",
            panelClass: "add-products",
            backdropClass: "backdrop-blur",
            data: {
                route: this.route,
                opensFrom: "copyNewPlanYear",
                mpGroup: this.mpGroup,
                planYears: this.planYearData.filter((planYear) => planYear.type === PlanYearType.AFLAC_INDIVIDUAL),
            },
        });
        this.afterDialogClosed(newPlanYearDialogRef);
    }
    /**
     * This method will execute once after the quasi modal is closed
     * @param dialogRef is current dialogRef of quasi modal
     */
    afterDialogClosed(dialogRef: MatDialogRef<ProductsPlansQuasiComponent>): void {
        dialogRef
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((resp) => {
                    dialogRef.close();
                    this.isLoading = true;
                    if (resp === this.constantSave) {
                        this.resetPanelProducts();
                    }
                }),
                filter((resp) => resp !== this.constantSave),
                switchMap((resp) => {
                    const deletePlanChoices: Observable<void>[] = this.quasiService.getDeletePlanChoices();
                    return this.quasiService.checkAndCreateObservable(deletePlanChoices);
                }),
                switchMap((resp) => {
                    const planChoices: Observable<void>[] = this.quasiService.getPlanChoices();
                    return this.quasiService.checkAndCreateObservable(planChoices);
                }),
                switchMap((resp) => {
                    const productChoices: Observable<void>[] = this.quasiService.getProducts();
                    return this.quasiService.checkAndCreateObservable(productChoices);
                }),
                switchMap((resp) => {
                    const planYears: Observable<void>[] = this.quasiService.getCreatedPlanYears();
                    return this.quasiService.checkAndCreateObservable(planYears);
                }),
                switchMap((resp) => this.accountService.clearPendingElements(this.mpGroup).pipe(takeUntil(this.unsubscribe$))),
                catchError((error) => of(error)),
            )
            .subscribe(
                () => {
                    this.resetPanelProducts();
                },
                (error) => {
                    this.resetPanelProducts();
                },
            );
    }

    // This method is used to clear store and clear product, plans variables in service
    resetPanelProducts(): void {
        this.quasiService.resetQuasiStoreValues();
        this.quasiService.resetQuasiObservableValues();
        this.reinitiateServiceCalls();
    }

    // This methos is used to recall all service calls and dispatch actions
    reinitiateServiceCalls(): void {
        this.isLoading = true;
        this.store.dispatch(new SetMaintenanceRequiredData()).subscribe((res) => {
            this.store.dispatch(new GetProductsPanel()).subscribe(() => {
                this.serviceCalls();
            });
        });
    }
    /**
     * This method is used to assign display columns in accordion based on logged in user
     */
    getCredential(): void {
        this.hasUploadPermission$
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((res) => {
                    this.isHQIntAdmin = res;
                }),
            )
            .subscribe();

        if (this.isAdmin) {
            this.settingsDisplayedColumns = [PLAN_YEAR, ENROLLMENT_DATE, COVERAGE_DATES, MANAGE];
        } else if (this.isHQIntAdmin) {
            this.settingsDisplayedColumns = [PLAN_YEAR, ENROLLMENT_DATE, COVERAGE_DATES, STATUS, IN_FORCE_REPORT, MANAGE];
        } else {
            this.settingsDisplayedColumns = [PLAN_YEAR, ENROLLMENT_DATE, COVERAGE_DATES, STATUS, MANAGE];
        }
    }

    /**
     * Method to check for active TPP
     */
    checkActiveTPP(): void {
        this.benefitsOfferingHelperService
            .getThirdPartyPlatformRequirements()
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((res) => {
                    this.isActiveTPP = Boolean(
                        (res.applicableThirdPartyPlatforms && res.applicableThirdPartyPlatforms.length) ||
                            (res.expectedThirdPartyPlatform && res.expectedThirdPartyPlatform.id),
                    );
                }),
            )
            .subscribe();
    }

    /**
     * Method to open edit TPP popup
     */
    openEditTPP(): void {
        if (this.maintainanceLock && this.unpluggedAccessAllowed) {
            this.empoweredModalService
                .openDialog(EditTppPopupComponent, {
                    data: {
                        route: this.route,
                        mpGroup: this.mpGroup,
                    },
                })
                .afterClosed()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((optionSelected) => {
                    if (optionSelected === TPP_PLANS) {
                        this.isActiveTPP = true;
                    } else if (optionSelected === ALL_PLANS) {
                        this.isActiveTPP = false;
                    }
                });
        }
    }
    /**
     * Method to get latest group plan year details
     */
    getPlanYearDetails(): void {
        const allPlanYears: PlanYear[] = this.planYearDetails;
        allPlanYears.push(...this.unApprovedPlanYears);
        this.latestPlanYear = this.utilService
            .copy(allPlanYears)
            .filter((planYear: PlanYear) => planYear.type === PlanYearType.AFLAC_GROUP)
            .sort(
                (a: PlanYear, b: PlanYear) =>
                    this.dateService.toDate(a.coveragePeriod.expiresAfter).getTime() -
                        this.dateService.toDate(b.coveragePeriod.expiresAfter).getTime() || a.id - b.id,
            )
            .pop();
    }
    /**
     * ng life cycle hook
     * used to unsubscribe all subscription
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
