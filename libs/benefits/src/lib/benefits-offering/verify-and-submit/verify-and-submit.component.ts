import { BenefitOfferingHelperService } from "./../../benefit-offering-helper.service";
import { MatDialogConfig } from "@angular/material/dialog";
import { EmpoweredModalService } from "@empowered/common-services";
import {
    MonDialogComponent,
    AddUpdateContactInfoComponent,
    BenefitOfferingUtilService,
    AgRefreshService,
    AgOfferingSubmitPopupComponent,
    AgRefreshComponent,
} from "@empowered/ui";
import { Component, OnInit, HostListener, OnDestroy, ViewChild } from "@angular/core";
import { Store } from "@ngxs/store";
import {
    Carrier,
    BenefitsOfferingService,
    coverageStartFunction,
    CarrierFormWithCarrierInfo,
    StaticService,
    CarrierFormSetupStatus,
    AdminService,
    AccountList,
    AccountContacts,
    AccountService,
    AccountDetails,
    PartyType,
    AflacService,
    EligiblePlans,
} from "@empowered/api";
import { SharedState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { DomSanitizer } from "@angular/platform-browser";
import { DatePipe } from "@angular/common";
import { Router, ActivatedRoute } from "@angular/router";
import { Subject, iif, of, combineLatest, Observable } from "rxjs";
import { takeUntil, switchMap, tap, filter, catchError } from "rxjs/operators";
import {
    ClientErrorResponseCode,
    ServerErrorResponseCode,
    DateFormats,
    ClientErrorResponseType,
    ConfigName,
    AccountImportTypes,
    PanelModel,
    PlanPanelModel,
    AppSettings,
    CarrierId,
    AflacGroupOfferingError,
    TaxStatus,
    PlanYearType,
    CountryState,
    Product,
    Admin,
    PlanYear,
    AddUpdateContactDialogData,
    Plan,
} from "@empowered/constants";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { SideNavService, BenefitsOfferingState, AccountListState, AddGroup, AccountInfoState } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

const BACK_BUTTON = "Back";
const ACCOUNT = "ACCOUNT";
const VERIFY_SUBMIT_GROUP_ATTRIBUTE_VALUE = "7";
const SPLIT_COMMA = ",";

@Component({
    selector: "empowered-verify-and-submit",
    templateUrl: "./verify-and-submit.component.html",
    styleUrls: ["./verify-and-submit.component.scss"],
})
export class VerifyAndSubmitComponent implements OnInit, OnDestroy {
    statesList: any[] = [];
    stateValues: any[] = [];
    state = "";
    employee: number;
    accountContactTypeIds = {
        PRIMARY: 1,
        BILLING: 2,
    };
    contactInfoBilling: AccountContacts[];
    mpGroup: any;
    panelProducts: PanelModel[] = [];
    isLoading: boolean;
    enableIndividualPlan = false;
    productChoices: any[];
    displayedProduct: PanelModel[] = [];
    planChoiceLength: number;
    planChoiceLengthArray: number[] = [];
    carriers: Carrier[] = [];
    coveragePeriodPRPlansPanelList: any[] = [];
    coveragePeriodContinuousPlansPanelList: any[] = [];
    isAutoApproved = true;
    planYearDetails: PlanYear[] = [];
    planYearDetail: PlanYear[];
    displayedColumns: string[] = ["plan", "state", "taxStatus", "agentAssitanceRequired"];
    panelOpenState = false;
    allFormsComplete: boolean;
    languageString: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.reviewSubmit.continousPlan",
        "primary.portal.common.edit",
        "primary.portal.reviewSubmit.mainTitle",
        "primary.portal.reviewSubmit.mainHRTitle",
        "primary.portal.reviewSubmit.subTitle",
        "primary.portal.reviewSubmit.subHRTitle",
        "primary.portal.reviewSubmit.settings",
        "primary.portal.reviewSubmit.benefitsOffered",
        "primary.portal.reviewSubmit.benefitsOfferedSection",
        "primary.portal.reviewSubmit.benefitsOffered.products",
        "primary.portal.reviewSubmit.benefitsOffered.plans",
        "primary.portal.reviewSubmit.benefitsOffered.coverageDates",
        "primary.portal.reviewSubmit.planCount",
        "primary.portal.reviewSubmit.planCountOne",
        "primary.portal.reviewSubmit.titlePrice",
        "primary.portal.reviewSubmit.carrierForms",
        "primary.portal.reviewSubmit.submitToHR.title",
        "primary.portal.reviewSubmit.submitToHR.subTitle",
        "primary.portal.reviewSubmit.submitOffering",
        "primary.portal.reviewSubmit.submitHRAdmin",
        "primary.portal.reviewSubmit.complete",
        "primary.portal.reviewSubmit.incomplete",
        "primary.portal.common.back",
        "primary.portal.reviewSubmit.submitHRAdmin",
        "primary.portal.reviewSubmit.submitOffering",
        "primary.portal.reviewSubmit.plan",
        "primary.portal.common.gotIt",
        "primary.portal.reviewSubmit.submitToHR.title",
        "primary.portal.reviewSubmit.submitToHR.subTitle",
        "primary.portal.common.close",
        "primary.portal.administrators.addAdmin",
        "primary.portal.benefitsOffering.reviewSubmit.addAdminTitle",
        "primary.portal.benefitsOffering.reviewSubmit.addAdminDescription",
        "primary.portal.common.cancel",
        "primary.portal.benefitsOffering.taxStatus",
        "primary.portal.benefitsOffering.bothTax",
        "primary.portal.benefitsOffering.both",
        "primary.portal.benefitsOffering.postTax",
        "primary.portal.benefitsOffering.preTax",
        "primary.portal.reviewSubmit.titlePlan",
        "primary.portal.reviewSubmit.titleStates",
        "primary.portal.reviewSubmit.titleAgentAssistanceRequired",
        "primary.portal.reviewSubmit.reviewSubmitBo",
        "primary.portal.reviewSubmit.aflacGroupProducts",
        "primary.portal.reviewSubmit.noMoreChanges",
        "primary.portal.reviewSubmit.nonAflacGroupProducts",
        "primary.portal.reviewSubmit.isSharedAccountProducts",
        "primary.portal.benefitOffering.enrollmentDates",
        "primary.portal.coverage.coverageDates",
        "primary.portal.common.dates",
        "primary.portal.dashboard.hyphen",
        "primary.portal.aflacGroup.reviewSubmit.planCount",
        "primary.portal.aflacGroup.reviewSubmit.planCountOne",
        "primary.portal.reviewSubmit.submitToAdmin",
    ]);
    planYearDatesTooltip: any;
    planYearDatesTooltipContinuous: any;
    alertFlag = true;
    isAlert: boolean;
    isQ60Present: boolean;
    stepNumber: number;
    isAlertEnabled: boolean;
    coverageStartDateOptions = [];
    carrierFormStatus: any[] = [];
    errorResponse = false;
    errorMessage: string[] = [];
    private unsubscribe$ = new Subject<void>();
    @ViewChild("submitToHR", { static: true }) submitToHR;
    isBillingContactAdded = false;
    enableEditPrice = false;
    portal: any;
    carrierFormsFromStore: CarrierFormWithCarrierInfo[];
    carriersForApproval: any[];
    allAdmins: Admin[];
    allowNavigation$: Subject<boolean>;
    alertDialogRef: MatDialogRef<MonDialogComponent>;
    initialOfferingSteps = this.store.selectSnapshot(BenefitsOfferingState.getOfferingStepperData);
    account: AccountList;
    isNavigationAllowed = false;
    isAccountDeactivated: boolean;
    TaxStatus = TaxStatus;
    benefitDollarCount = 0;
    productsObj: Product[];
    isSharedAccount = false;
    aflacGroupPlansDataSource: {
        product: Product;
        carrier: Carrier;
        plans: Plan[];
        planYear?: PlanYear;
        planYearTooltip?: string;
    }[] = [];
    accountDetails: AccountDetails;
    agHardStopErrors: string[];
    showSpinner = false;
    hrApprovalVasConfig: string[] = [];
    isApprovalRequiredForVas: boolean;
    isNonAflacPlansRequiredApproval: boolean;
    disableSubmitButton = false;

    constructor(
        private readonly dialog: MatDialog,
        private readonly sideNavService: SideNavService,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly benefitsService: BenefitsOfferingService,
        private readonly domSanitizer: DomSanitizer,
        private readonly datePipe: DatePipe,
        private readonly router: Router,
        private readonly staticService: StaticService,
        private readonly adminService: AdminService,
        private readonly accountService: AccountService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly benefitService: BenefitOfferingHelperService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly utilService: UtilService,
        private readonly aflacService: AflacService,
        private readonly agRefreshService: AgRefreshService,
        private readonly staticUtilService: StaticUtilService,
        private readonly benefitOfferingUtilService: BenefitOfferingUtilService,
        private readonly dateService: DateService,
    ) {
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
    }

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     */
    ngOnInit(): void {
        this.accountDetails = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        if (this.accountDetails && this.accountDetails.importType === AccountImportTypes.SHARED_CASE) {
            this.isSharedAccount = true;
        }
        this.store
            .select(AccountListState.getGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.account = res;
            });
        if (this.isSharedAccount) {
            this.refreshOffering();
        }
        this.allFormsComplete = true;
        this.isLoading = true;
        this.isAlertEnabled = true;
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.portal = "/" + this.portal.toLowerCase();
        if (this.mpGroup) {
            this.errorMessage = [];
            this.errorResponse = false;
            this.enableEditPrice = false;
            this.setCoverageStartValues();
            this.getConfigurationSpecifications();
        } else {
            this.isLoading = false;
        }
        this.staticUtilService
            .cacheConfigValue(ConfigName.PLAN_YEAR_SETUP_HR_APPROVAL_FOR_VAS)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((config) => {
                this.hrApprovalVasConfig = config.split(SPLIT_COMMA);
            });
        this.accountService
            .getAccountContacts("typeId")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                // For Billing contacts as they will always have id 2
                this.contactInfoBilling = resp.filter((contact) => contact.type && contact.type.id === this.accountContactTypeIds.BILLING);
            });
        this.sideNavService
            .updateGroupBenefitOfferingStep(VERIFY_SUBMIT_GROUP_ATTRIBUTE_VALUE)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
    }
    /**
     * This method checks if refresh ag popup has to be opened
     */
    refreshOffering(): void {
        this.showSpinner = true;
        let eligiblePlansDetails: EligiblePlans;
        combineLatest([
            this.benefitsService.getOfferablePlans(
                [this.accountDetails.situs.state.abbreviation],
                this.accountDetails.id,
                AccountImportTypes.AFLAC_GROUP,
            ),
            this.aflacService.getAflacGroupPartyInformation([PartyType.CLIENT_SPECIALIST, PartyType.BROKER_SALES], this.accountDetails.id),
            this.benefitsService.getPlanYears(this.mpGroup, false),
        ])
            .pipe(
                takeUntil(this.unsubscribe$),
                tap(([eligiblePlans, aflacAgentInformation, approvedPlanYears]) => {
                    eligiblePlansDetails = eligiblePlans;
                    if (approvedPlanYears && approvedPlanYears.length) {
                        this.arrangeAGPlanInformation(approvedPlanYears, eligiblePlansDetails);
                    }
                }),
                switchMap(([eligiblePlans, aflacAgentInformation, approvedPlanYears]) => {
                    this.showSpinner = false;
                    const currentDate = new Date();
                    currentDate.setHours(0, 0, 0, 0);
                    if (
                        (eligiblePlans.aflacGroupOfferingError &&
                            eligiblePlans.aflacGroupOfferingError.error &&
                            eligiblePlans.aflacGroupOfferingError.error !== AflacGroupOfferingError.AFLAC_API_ERROR &&
                            eligiblePlans.aflacGroupOfferingError.error !== AflacGroupOfferingError.COVERAGE_PERIOD_PAST_DATE) ||
                        (eligiblePlans.aflacGroupPlanYear &&
                            eligiblePlans.aflacGroupPlanYear.enrollmentPeriod &&
                            eligiblePlans.aflacGroupPlanYear.enrollmentPeriod.expiresAfter &&
                            this.dateService.isBefore(
                                this.dateService.toDate(eligiblePlans.aflacGroupPlanYear.enrollmentPeriod.expiresAfter),
                                currentDate,
                            ))
                    ) {
                        return this.empoweredModalService
                            .openDialog(AgRefreshComponent, {
                                data: {
                                    eligiblePlans: this.utilService.copy(eligiblePlans),
                                    aflacAgentInformation: this.utilService.copy(aflacAgentInformation),
                                    isInitialOffering: true,
                                    isRenewal: false,
                                },
                            })
                            .afterClosed();
                    }
                    return of(null);
                }),
                filter((result) => result && result.isPlanYearUpdated === true),
                switchMap(() => this.benefitsService.getPlanYears(this.mpGroup, false)),
                filter((unapprovedPlanYearDetails) => unapprovedPlanYearDetails !== undefined && unapprovedPlanYearDetails.length > 0),
            )
            .subscribe(
                (unapprovedPlanYearDetails) => {
                    this.arrangeAGPlanInformation(unapprovedPlanYearDetails, eligiblePlansDetails);
                },
                (error) => {
                    this.showSpinner = false;
                },
            );
    }

    getConfigurationSpecifications(): void {
        this.staticService
            .getConfigurations("broker.non_aflac_carriers_that_require_planyear_approval", this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => {
                this.carriersForApproval = data[0].value.split(",");
                this.arrangeData();
            });
    }

    /**
     * @description Arrange set of data
     * @returns {void}
     */
    arrangeData(): void {
        this.benefitsService
            .getPlanYears(this.mpGroup, true)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.planYearDetails = response;
                    this.getValuesFromStore();
                    this.setCensusEstimate();
                    this.panelProducts = this.store
                        .selectSnapshot(BenefitsOfferingState.getpanelProducts)
                        .filter((pannel) => pannel.productChoice != null);
                    this.carriers = this.store.selectSnapshot(BenefitsOfferingState.getAllCarriers);
                    this.setProductInformation();
                    this.setFinalProductsList();
                },
                (error) => {
                    this.errorMessage.push(
                        this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.unableToLoadPlan"),
                    );
                    this.errorResponse = true;
                    this.isLoading = false;
                },
            );
    }
    /**
     * This method is used to arrange AG plan information object
     * @param approvedPlanYears is array of approved plan years
     * @param eligiblePlansDetails array of plans and AG plan error
     */
    arrangeAGPlanInformation(approvedPlanYears: PlanYear[], eligiblePlansDetails: EligiblePlans): void {
        this.aflacGroupPlansDataSource = [];
        const allProducts: Product[] = this.store.selectSnapshot(BenefitsOfferingState.getAllProducts);
        const allCarriers: Carrier[] = this.store.selectSnapshot(BenefitsOfferingState.getAllCarriers);
        const agPlanYear: PlanYear = approvedPlanYears.filter((eachPlanYear) => eachPlanYear.type === PlanYearType.AFLAC_GROUP).pop();
        const dateTooltip = `<strong>${agPlanYear.name} ${this.languageString["primary.portal.common.dates"]}
            </strong><br>${this.languageString["primary.portal.benefitOffering.enrollmentDates"]}${this.datePipe.transform(
            agPlanYear.enrollmentPeriod.effectiveStarting,
            DateFormats.MONTH_DAY_YEAR,
        )}${this.languageString["primary.portal.dashboard.hyphen"]}${this.datePipe.transform(
            agPlanYear.enrollmentPeriod.expiresAfter,
            DateFormats.MONTH_DAY_YEAR,
        )}<br>${this.languageString["primary.portal.coverage.coverageDates"]}${this.datePipe.transform(
            agPlanYear.coveragePeriod.effectiveStarting,
            DateFormats.MONTH_DAY_YEAR,
        )}${this.languageString["primary.portal.dashboard.hyphen"]}${this.datePipe.transform(
            agPlanYear.coveragePeriod.expiresAfter,
            DateFormats.MONTH_DAY_YEAR,
        )}`;
        const allAGPlans: Plan[] = this.benefitService.getAflacGroupPlans(
            allProducts,
            this.store.selectSnapshot(BenefitsOfferingState.getAllCarriers),
            this.utilService.copy(eligiblePlansDetails.plans),
        );
        allAGPlans.forEach((plan) => {
            plan.stateTooltipInfo = this.displayValues(plan.planEligibility.allowedStates.map((planStates) => planStates.state));
        });
        allProducts.forEach((product) => {
            const agProductCarrierSpecificPlans: Plan[] = allAGPlans.filter((eachPlan) => eachPlan.productId === product.id);
            if (agProductCarrierSpecificPlans.length) {
                this.aflacGroupPlansDataSource.push({
                    product: product,
                    carrier: allCarriers.filter((eachCarrier) => eachCarrier.id === CarrierId.AFLAC_GROUP).pop(),
                    plans: agProductCarrierSpecificPlans,
                    planYear: agPlanYear,
                    planYearTooltip: dateTooltip,
                });
            }
        });
    }

    getValuesFromStore(): void {
        this.carrierFormsFromStore = this.store.selectSnapshot(BenefitsOfferingState.getAllCarrierForms);
        this.statesList = this.store.selectSnapshot(BenefitsOfferingState.getBenefitOfferingStates);
        this.statesList.forEach((state) => {
            if (this.state === "") {
                this.state = state.name;
            } else {
                this.state = this.state + ", " + state.name;
            }
        });
        this.fetchAccountStatus();
    }

    // Set Product Information
    setProductInformation(): void {
        this.panelProducts.forEach((productPannelItem) => {
            productPannelItem.carrier.forEach((specificCarrier) => {
                const carrierSpecificPRPlans = productPannelItem.plans.filter(
                    (plan) => plan.planChoice != null && plan.planChoice.continuous === false && plan.plan.carrierId === specificCarrier.id,
                );
                this.planYearDatesTooltip = [];
                if (carrierSpecificPRPlans.length !== 0) {
                    this.setSpecificPRPlans(carrierSpecificPRPlans, specificCarrier, productPannelItem);
                }
                const carrierSpecificContinuousPlans = productPannelItem.plans.filter(
                    (plan) => plan.planChoice != null && plan.planChoice.continuous === true && plan.plan.carrierId === specificCarrier.id,
                );
                if (carrierSpecificContinuousPlans.length !== 0) {
                    this.setSpecificContinousPlans(carrierSpecificContinuousPlans, specificCarrier, productPannelItem);
                }
            });
        });
    }
    /**
     * Set census estimate
     */
    setCensusEstimate(): void {
        this.benefitsService
            .getBenefitOfferingSettings(this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (eligibleEmployee) => {
                    this.employee = eligibleEmployee.totalEligibleEmployees;
                    this.isLoading = false;
                },
                (error) => {
                    this.isLoading = false;
                    // TODO Hardcode values should come from langauges
                    this.errorMessage.push(
                        this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.unableToLoadEmpEstimate"),
                    );
                    this.errorResponse = true;
                },
            );
    }

    // Set Continuous Plans
    setSpecificContinousPlans(
        carrierSpecificContinuousPlans: PlanPanelModel[],
        specificCarrier: Carrier,
        productPannelItem: PanelModel,
    ): void {
        let coverageDate: any;
        this.coverageStartDateOptions.forEach((carrier) => {
            if (carrier.value === carrierSpecificContinuousPlans[0].planChoice.coverageStartFunction) {
                coverageDate = carrier.viewValue;
            }
        });
        const dateTooltipContinuous =
            // TODO Hardcode values should come from langauges
            "<strong> Continuous plan dates </strong>" +
            "<br>" +
            "Enrollment start date: " +
            this.datePipe.transform(
                carrierSpecificContinuousPlans[0].planChoice.enrollmentPeriod.effectiveStarting,
                AppSettings.DATE_FORMAT_MM_DD_YYYY,
            ) +
            "<br>" +
            "Coverage start date: " +
            coverageDate;
        this.planYearDatesTooltipContinuous = this.domSanitizer.bypassSecurityTrustHtml(`${dateTooltipContinuous}`);
        this.coveragePeriodContinuousPlansPanelList.push({
            carrier: specificCarrier,
            plans: carrierSpecificContinuousPlans,
            product: productPannelItem.product,
            planYearDatesTooltip: this.planYearDatesTooltipContinuous,
            policyOwnershipType: carrierSpecificContinuousPlans[0].plan.policyOwnershipType,
        });
        this.carrierFormsStatus(specificCarrier);
    }

    // Carrier Forms status
    carrierFormsStatus(specificCarrier: Carrier): void {
        this.checkPricesEdiatable();
        // TODO Hardcode values should come from langauges
        const carrierForm = this.carrierFormStatus.filter(
            (form) => form === specificCarrier.name + " complete" || form === specificCarrier.name + " incomplete",
        );
        this.isQ60Present = Boolean(this.carrierFormsFromStore.find((form) => form.carrierId === CarrierId.AFLAC && form.id !== null));
        if (carrierForm.length === 0) {
            // TODO Hardcode values should come from langauges
            this.carrierFormsFromStore.forEach((forms) => {
                const carrierForms = this.carrierFormStatus.filter(
                    (form) => form === forms.formName + " complete" || form === forms.formName + " incomplete",
                );
                if (!carrierForms.length) {
                    if (forms.formStatus === CarrierFormSetupStatus.INCOMPLETE || forms.formStatus === CarrierFormSetupStatus.NOT_STARTED) {
                        this.isAutoApproved = false;
                        this.carrierFormStatus.push(
                            this.languageString["primary.portal.reviewSubmit.incomplete"].replace("##form##", forms.formName),
                        );
                    } else if (forms.formStatus === CarrierFormSetupStatus.PENDING) {
                        this.isAutoApproved = false;
                        this.carrierFormStatus.push(
                            this.languageString["primary.portal.reviewSubmit.complete"].replace("##form##", forms.formName),
                        );
                    } else if (forms.formStatus === CarrierFormSetupStatus.APPROVED) {
                        this.isAutoApproved = true;
                        this.carrierFormStatus.push(
                            this.languageString["primary.portal.reviewSubmit.complete"].replace("##form##", forms.formName),
                        );
                    }
                }
            });
        }
    }

    checkPricesEdiatable(): void {
        if (this.coveragePeriodContinuousPlansPanelList.length > 0) {
            this.coveragePeriodContinuousPlansPanelList.forEach((item) => {
                this.carriersForApproval.forEach((car) => {
                    if (car && item.carrier.id === Number(car)) {
                        this.isAutoApproved = false;
                    }
                });
                if (item.product.valueAddedService) {
                    this.isAutoApproved = false;
                }
                item.plans.forEach((plan) => {
                    if (plan.plan.pricingEditable) {
                        this.enableEditPrice = true;
                    }
                });
            });
        }
        if (this.coveragePeriodPRPlansPanelList.length > 0) {
            this.coveragePeriodPRPlansPanelList.forEach((item) => {
                this.carriersForApproval.forEach((car) => {
                    if (car && item.carrier.id === Number(car)) {
                        this.isAutoApproved = false;
                    }
                });

                this.isApprovalRequiredForVas = item.plans.some((plan) =>
                    this.hrApprovalVasConfig.some((config) => plan.plan.vasFunding === config),
                );

                if ((item.product.valueAddedService && this.isApprovalRequiredForVas) || this.isQ60Present) {
                    this.isAutoApproved = false;
                }
                item.plans.forEach((plan) => {
                    if (plan.plan.pricingEditable) {
                        this.enableEditPrice = true;
                    }
                });
            });
        }
    }

    /**
     * to set Plan-Year plans for benefit offering
     * @param carrierSpecificPRPlans {PlanPanelModel[]}
     * @param specificCarrier {Carrier}
     * @param productPannelItem {PanelModel}
     * @returns {void}
     */
    setSpecificPRPlans(carrierSpecificPRPlans: PlanPanelModel[], specificCarrier: Carrier, productPannelItem: PanelModel): void {
        carrierSpecificPRPlans.forEach((plan) => {
            const year = this.planYearDetails.filter((planYear) => planYear.id === plan.planChoice.planYearId);
            this.planYearDetail = year;
        });
        const dateTooltip =
            // TODO Hardcode values should come from langauges
            "<strong>" +
            this.planYearDetail[0].name +
            " " +
            "dates" +
            "</strong>" +
            "<br>" +
            "Enrollment dates: " +
            this.datePipe.transform(this.planYearDetail[0].enrollmentPeriod.effectiveStarting, AppSettings.DATE_FORMAT_MM_DD_YYYY) +
            " - " +
            this.datePipe.transform(this.planYearDetail[0].enrollmentPeriod.expiresAfter, AppSettings.DATE_FORMAT_MM_DD_YYYY) +
            "<br>" +
            "Coverage dates: " +
            this.datePipe.transform(this.planYearDetail[0].coveragePeriod.effectiveStarting, AppSettings.DATE_FORMAT_MM_DD_YYYY) +
            " - " +
            this.datePipe.transform(this.planYearDetail[0].coveragePeriod.expiresAfter, AppSettings.DATE_FORMAT_MM_DD_YYYY);
        this.planYearDatesTooltip = this.domSanitizer.bypassSecurityTrustHtml(`${dateTooltip}`);
        this.coveragePeriodPRPlansPanelList.push({
            carrier: specificCarrier,
            plans: carrierSpecificPRPlans,
            product: productPannelItem.product,
            planYear: this.planYearDetail,
            planYearTooltip: this.planYearDatesTooltip,
            policyOwnershipType: carrierSpecificPRPlans[0].plan.policyOwnershipType,
        });
        this.carrierFormsStatus(specificCarrier);
    }

    // Fetching coverage Start function values from database
    setCoverageStartValues(): void {
        this.coverageStartDateOptions = [
            {
                value: coverageStartFunction.DAY_AFTER,
                viewValue: this.language.fetchPrimaryLanguageValue(
                    "primary.portal.benefitsOffering.continuousPlans.ContinuousStartDate.DAY_AFTER",
                ),
            },
            {
                value: coverageStartFunction.NEXT_FIRST_OF_MONTHNEXT_FIRST_OF_MONTH,
                viewValue: this.language.fetchPrimaryLanguageValue(
                    "primary.portal.benefitsOffering.continuousPlans.ContinuousStartDate.NEXT_FIRST_OF_MONTHNEXT_FIRST_OF_MONTH",
                ),
            },
            {
                value: coverageStartFunction.NEXT_FIRST_OR_FIFTEENTH_OF_MONTH,
                viewValue: this.language.fetchPrimaryLanguageValue(
                    "primary.portal.benefitsOffering.continuousPlans.ContinuousStartDate.NEXT_FIRST_OR_FIFTEENTH_OF_MONTH",
                ),
            },
        ];
    }

    // Checking whether user reloading or closing the tab
    @HostListener("window:beforeunload", ["$event"])
    beforeunloadHandler(event: any): boolean {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    /**
     * This method is used to filter all states information with eligiblePlans states information and forms state tooltip info
     * @param values contains array of eligible plans state information
     * @returns state tooltip information
     */
    displayValues(values: CountryState[]): string {
        this.stateValues = [];
        let displayValue = "";
        if (!this.statesList.length) {
            this.statesList = [this.accountDetails.situs.state];
        }
        values.forEach((eachState) => {
            if (this.statesList.filter((storeState) => storeState.abbreviation === eachState.abbreviation).length > 0) {
                this.statesList
                    .filter((storeState) => storeState.abbreviation === eachState.abbreviation)
                    .forEach((stateKey) => {
                        this.stateValues.push(stateKey);
                    });
            }
        });
        if (this.stateValues.length < 5) {
            this.stateValues.forEach((value) => {
                if (displayValue === "") {
                    displayValue = value.abbreviation;
                } else {
                    displayValue = displayValue + ", " + value.abbreviation;
                }
            });
        } else {
            // TODO Hardcode values should come from langauges
            displayValue = this.stateValues.length + " states";
        }
        return displayValue;
    }

    /**
     * @description setFinalProductsList is to filter products based on plan choice
     * @returns {void}
     */
    setFinalProductsList(): void {
        const products: Product[] = this.coveragePeriodPRPlansPanelList
            .concat(this.coveragePeriodContinuousPlansPanelList)
            .map((ele) => ele.product);
        const finalProducts: Product[] = products.filter((value, id) => products.indexOf(value) === id);
        this.productsObj = finalProducts;
        this.benefitService.changeProductSelected(this.productsObj);
    }

    // Step returning an object when we click on edit
    stepChangeOnEdit(stepNumber: number): any {
        const stepChange = {
            step: stepNumber,
            state: "edit",
        };
        return stepChange;
    }

    /**
     * This method will execute on click of edit products
     * This method is used to navigate user to products step
     */
    editProducts(): void {
        this.navigateToRespectiveStep(this.initialOfferingSteps.PRODUCTS);
    }
    /**
     * This method is used to navigate user to specific step
     * @param stepToNavigate is step to navigate user
     * @param isCarrierForms represents whether clicked on edit carrier-forms or not
     */
    navigateToRespectiveStep(stepToNavigate: number, isCarrierForms: boolean = false): void {
        if (!this.isSharedAccount) {
            this.sideNavService.stepClicked$.next(this.stepChangeOnEdit(stepToNavigate));
        } else {
            if (isCarrierForms) {
                stepToNavigate = this.initialOfferingSteps.PRICES_ELIGIBILITY ? stepToNavigate : stepToNavigate + 1;
            }
            this.router.navigate(["../" + (stepToNavigate + 1).toString()], {
                relativeTo: this.activatedRoute,
                queryParams: { edit: stepToNavigate + 1 },
            });
        }
    }
    /**
     * This method will execute on click of edit plans
     * This method is used to navigate user to plans step
     */
    editPlans(): void {
        this.navigateToRespectiveStep(this.initialOfferingSteps.PLANS);
    }

    /**
     * This method will execute on click of edit coverage-dates
     * This method is used to navigate user to coverage-dates step
     */
    editCoverageDates(): void {
        this.navigateToRespectiveStep(this.initialOfferingSteps.COVERAGE_DATES);
    }

    /**
     * This method will execute on click of edit pricing & eligibility
     * This method is used to navigate user to pricing & eligibility step
     */
    editPrices(): void {
        this.navigateToRespectiveStep(this.initialOfferingSteps.PRICES_ELIGIBILITY);
    }

    /**
     * This method will execute on click of edit carrier-forms
     * This method is used to navigate user to carrier-forms step
     */
    editCarrierForms(): void {
        this.navigateToRespectiveStep(this.initialOfferingSteps.CARRIER_FORMS, true);
    }

    // navigate back to carrier-forms step
    onBack(): void {
        this.sideNavService.stepClicked$.next(this.initialOfferingSteps.CARRIER_FORMS);
    }
    /**
     * get benefit dollar length
     * @param event offering list length
     */
    getBenefitDollarCount(event: number): void {
        this.benefitDollarCount = event;
    }

    /**
     * Method to check if admin approval require for non-aflac plans
     * @returns boolean true if admin approval require
     */
    checkIsAdminApprovalRequired(): boolean {
        return this.coveragePeriodPRPlansPanelList.some((plans) =>
            this.carriersForApproval.some((carrier) => +carrier === plans.carrier.id),
        );
    }

    /**
     * to submit benefit offering
     */
    onSubmit(): void {
        this.disableSubmitButton = true;
        this.isLoading = true;
        const isVas = this.coveragePeriodPRPlansPanelList?.some((panelList) => panelList.product.valueAddedService);

        // To check if non-aflac plans require admin approval
        this.isNonAflacPlansRequiredApproval = this.checkIsAdminApprovalRequired();

        if (this.benefitDollarCount !== 0) {
            this.checkBillingContact();
        } else if (!this.isApprovalRequiredForVas && isVas) {
            this.onSubmitToHR();
        } else {
            this.isNavigationAllowed = true;
            if (this.areAllFormsComplete()) {
                this.isLoading = true;
                const cloneAccountStore = { ...this.account };
                cloneAccountStore.productsCount = this.panelProducts.length;
                this.saveAflacGroupOffering()
                    .pipe(
                        takeUntil(this.unsubscribe$),
                        switchMap((res) => this.benefitsService.submitApprovalRequest(this.mpGroup, true)),
                        tap((res) => {
                            this.store.dispatch(new AddGroup(cloneAccountStore));
                        }),
                        switchMap((res) => {
                            if (this.isSharedAccount && this.aflacGroupPlansDataSource.length) {
                                this.isLoading = false;
                                this.disableSubmitButton = false;
                                return this.empoweredModalService
                                    .openDialog(AgOfferingSubmitPopupComponent, {
                                        data: {
                                            isSharedAccount: this.isSharedAccount,
                                            isAutoApproved: this.isAutoApproved,
                                        },
                                    })
                                    .afterClosed();
                            }
                            return of(null);
                        }),
                    )
                    .subscribe(
                        () => {
                            this.isLoading = true;
                            this.disableSubmitButton = false;
                            this.router.navigate([`${this.portal}/payroll/${this.mpGroup}/dashboard/benefits/maintenance-offering`], {
                                queryParams: { initial: true },
                            });
                        },
                        (error) => {
                            this.isLoading = false;
                            this.disableSubmitButton = false;
                            this.errorResponse = true;
                            if (error.status === ClientErrorResponseCode.RESP_409) {
                                if (error.error.code === AppSettings.INVALIDSTATE) {
                                    this.errorMessage.push(
                                        this.language.fetchSecondaryLanguageValue(
                                            "secondary.portal.benefitsOffering.reviewSubmit.invalidState",
                                        ),
                                    );
                                } else if (error.error.code === AppSettings.CONFLICT) {
                                    this.errorMessage.push(
                                        this.language.fetchSecondaryLanguageValue(
                                            "secondary.portal.benefitsOffering.reviewSubmit.conflict",
                                        ),
                                    );
                                } else if (error.error.code === AppSettings.LOCKED) {
                                    this.errorMessage.push(
                                        this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.locked"),
                                    );
                                }
                            } else if (error.status === ServerErrorResponseCode.RESP_500) {
                                this.errorMessage.push(this.agRefreshService.getServerErrorMessageForAg(error));
                            } else if (error.status === ClientErrorResponseCode.RESP_403) {
                                this.errorMessage.push(
                                    this.language.fetchSecondaryLanguageValue(
                                        "secondary.portal.benefitsOffering.reviewSubmit.forbiddenError",
                                    ),
                                );
                            }
                        },
                    );
            }
        }
    }

    /**
     * Check if billing contact is present, else add one for Q60
     */
    checkBillingContact(): void {
        this.disableSubmitButton = true;
        this.isLoading = true;
        if (this.isQ60Present && !this.contactInfoBilling.length && !this.isBillingContactAdded) {
            this.addBillingContact();
        } else {
            this.onSubmitToHR();
        }
    }

    /**
     * Add billing contact
     */
    addBillingContact(): void {
        this.isLoading = true;
        const data: AddUpdateContactDialogData = {
            parentMode: ACCOUNT,
            isAdd: true,
            isPrimary: this.contactInfoBilling.length > 0 ? false : true,
            mpGroupId: this.mpGroup.toString(),
            showType: true,
            allowEditingAddress: false,
            allowEditingContactName: false,
            allowEditingPhoneNumber: false,
            allowEditingEmailAddress: false,
        };
        const dialogConfig: MatDialogConfig = {
            data: data,
        };
        const dialogRef = this.empoweredModalService.openDialog(AddUpdateContactInfoComponent, dialogConfig);
        dialogRef
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((resp) => {
                    if (resp) {
                        this.isBillingContactAdded = true;
                        this.onSubmitToHR();
                    }
                }),
            )
            .subscribe(() => {
                this.isLoading = false;
                this.disableSubmitButton = false;
            });
    }

    /**
     * This function is for submitting benefit offering to HR.
     */
    onSubmitToHR(): void {
        this.isNavigationAllowed = true;

        // To check if non-aflac plans require admin approval
        this.isNonAflacPlansRequiredApproval = this.checkIsAdminApprovalRequired();

        if (this.areAllFormsComplete()) {
            this.isLoading = true;
            // check admins
            this.adminService
                .getAccountAdmins(this.mpGroup, "roleId,reportsToId")
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap((response) => {
                        this.allAdmins = response;
                        if (this.allAdmins.length === 0) {
                            this.isLoading = false;
                            this.disableSubmitButton = false;
                            // if there is no admin inform user to add admin
                            return this.benefitOfferingUtilService.addAdminPopUp().pipe(
                                switchMap((status: string) =>
                                    iif(
                                        () => status !== null && status !== undefined && status !== AppSettings.FALSE,
                                        of(status).pipe(
                                            tap((data) => {
                                                this.isLoading = false;
                                                this.disableSubmitButton = false;
                                                // if user wants to add admin open addAdminManually popup
                                                this.addAdmin(status);
                                            }),
                                        ),
                                        of(status).pipe(
                                            tap((obj) => {
                                                this.isLoading = false;
                                                this.disableSubmitButton = false;
                                            }),
                                        ),
                                    ),
                                ),
                            );
                        }
                        return this.submitServiceCall();
                    }),
                )
                .subscribe();
        }
    }
    /**
     * Method to open addAdmin popup
     */
    addAdmin(choice: string): void {
        this.benefitOfferingUtilService
            .addAdmin(this.allAdmins, choice)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((status) =>
                    iif(
                        () => status === true,
                        of(true).pipe(
                            switchMap((data) => {
                                this.isLoading = false;
                                // service call to submit offering if admin is added
                                return this.submitServiceCall();
                            }),
                        ),
                        of(status).pipe(
                            tap((obj) => {
                                this.isLoading = false;
                            }),
                        ),
                    ),
                ),
            )
            .subscribe((val) => {
                if (val === BACK_BUTTON) {
                    this.onSubmitToHR();
                }
            });
    }
    /**
     * service call to submit the offering
     * @returns {Observable<void>}
     */
    private submitServiceCall(): Observable<void> {
        this.isLoading = true;
        return this.saveAflacGroupOffering().pipe(
            takeUntil(this.unsubscribe$),
            tap((res) => (this.isLoading = true)),
            switchMap((res) => this.benefitsService.submitApprovalRequest(this.mpGroup, true)),
            tap((res) => (this.isLoading = false)),
            switchMap((res) => {
                // check if admin exist and only hq vas available, then do not open below pop-up
                if (!this.isApprovalRequiredForVas && this.allAdmins.length && !this.isNonAflacPlansRequiredApproval) {
                    return of(null);
                }
                return this.empoweredModalService
                    .openDialog(AgOfferingSubmitPopupComponent, {
                        data: {
                            isSharedAccount: this.isSharedAccount,
                            isAutoApproved: this.isAutoApproved,
                            isAdminApprovalRequired: this.isNonAflacPlansRequiredApproval || this.isApprovalRequiredForVas,
                        },
                    })
                    .afterClosed();
            }),
            tap(() => {
                this.router.navigate([`${this.portal}/payroll/${this.mpGroup}/dashboard/benefits/maintenance-offering`], {
                    queryParams: { initial: true },
                });
            }),
            catchError((error) => {
                this.isLoading = false;
                this.errorResponse = true;
                this.displayErrorMessage(error);
                return of(null);
            }),
        );
    }
    /**
     * This method will execute on click of edit settings
     * This method is used to navigate user to settings step
     */
    editSettings(): void {
        this.navigateToRespectiveStep(this.initialOfferingSteps.SETTINGS);
    }

    closeModal(): void {
        this.dialog.closeAll();
        this.router.navigate([`${this.portal}/payroll/${this.mpGroup}/dashboard/benefits/maintenance-offering`], {
            queryParams: { initial: true },
        });
    }
    areAllFormsComplete(): boolean {
        const incompleteForms = this.carrierFormsFromStore.filter((form) =>
            [CarrierFormSetupStatus.INCOMPLETE, CarrierFormSetupStatus.NOT_STARTED].includes(form.formStatus as CarrierFormSetupStatus),
        );
        this.allFormsComplete = incompleteForms.length === 0;
        if (!this.allFormsComplete) {
            this.errorMessage.push(
                this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.carrierforms.errors.incompleteForms"),
            );
            this.errorResponse = true;
        }
        return this.allFormsComplete;
    }

    // function to display permission alert before moving out from the page
    alertModal(): void {
        this.alertDialogRef = this.dialog.open(MonDialogComponent, {
            hasBackdrop: true,
            width: "700px",
            data: {
                title: this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.sideNav.leavePageTitle"),
                content:
                    this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.sideNav.leavePageContent1") +
                    " " +
                    this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.sideNav.leavePageContent2"),
                secondaryButton: {
                    buttonTitle: this.language.fetchPrimaryLanguageValue("primary.portal.common.leavePage"),
                    buttonAction: this.onConfirmDialogAction.bind(this, true),
                },
                primaryButton: {
                    buttonTitle: this.language.fetchPrimaryLanguageValue("primary.portal.common.stayOnPage"),
                    buttonClass: "mon-btn-primary",
                    buttonAction: this.onConfirmDialogAction.bind(this, false),
                },
            },
        });
        this.alertDialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                if (response === null || response === undefined) {
                    this.sideNavService.stepClicked$.next(this.initialOfferingSteps.REVIEW_SUBMIT);
                }
            });
    }
    // function to define popup button action
    onConfirmDialogAction(isSave: boolean): void {
        let flag = true;
        if (!isSave) {
            flag = false;
            this.sideNavService.stepClicked$.next(this.initialOfferingSteps.REVIEW_SUBMIT);
        }
        this.allowNavigation$.next(flag);
        this.allowNavigation$.complete();
    }

    // function to call before page unload
    @HostListener("window:beforeunload")
    canDeactivate(): Observable<boolean> | boolean {
        if (!this.isNavigationAllowed) {
            this.allowNavigation$ = new Subject<boolean>();
            this.alertModal();
            return this.allowNavigation$.asObservable();
        }
        return true;
    }

    // This method is used to check the account status
    fetchAccountStatus(): void {
        this.isAccountDeactivated = this.sideNavService.fetchAccountStatus();
    }
    /**
     * This method is used to save aflac group offering
     * @returns Observable of void or empty array to follow the series of api calls after saving the offering
     */
    saveAflacGroupOffering(): Observable<HttpResponse<void>> {
        if (this.isSharedAccount && this.aflacGroupPlansDataSource.length) {
            return this.benefitsService
                .saveAflacGroupBenefitOffering("", this.mpGroup)
                .pipe(switchMap((resp) => this.agRefreshService.checkCarrierStatus()));
        }
        return of(null);
    }

    /**
     * Function will map the error dynamically from DB based on the API error code and status
     * @param error error HttpErrorResponse instance return in case of failure of API
     */
    displayErrorMessage(error: HttpErrorResponse): void {
        if (error.status === ClientErrorResponseCode.RESP_409) {
            if (error.error.code === ClientErrorResponseType.INVALID_STATE) {
                this.errorMessage.push(
                    this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.invalidState"),
                );
            } else if (error.error.code === ClientErrorResponseType.CONFLICT) {
                this.errorMessage.push(
                    this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.conflict"),
                );
            } else if (error.error.code === ClientErrorResponseType.LOCKED) {
                this.errorMessage.push(this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.locked"));
            }
        } else if (error.error.status === ServerErrorResponseCode.RESP_500) {
            this.errorMessage.push(this.agRefreshService.getServerErrorMessageForAg(error));
        } else if (error.error.status === ClientErrorResponseCode.RESP_403) {
            this.errorMessage.push(
                this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.forbiddenError"),
            );
        }
    }
    /**
     * ng life cycle hook
     * This method will execute before component is destroyed
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
