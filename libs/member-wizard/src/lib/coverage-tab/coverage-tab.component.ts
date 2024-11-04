import { Component, OnInit, OnDestroy } from "@angular/core";
import { Store, Select } from "@ngxs/store";
import { MemberService, AccountService, EnrollmentService, MemberFullProfile } from "@empowered/api";
import { Observable, Subscription, Subject, combineLatest } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { SetWizardMenuTab, MemberWizardState, SharedState, StaticUtilService, DualPlanYearService } from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";
import { Router } from "@angular/router";
import { takeUntil, map, pluck } from "rxjs/operators";
import { DatePipe } from "@angular/common";
import {
    DateFormats,
    ConfigName,
    PayFrequency,
    PayFrequencyObject,
    AppSettings,
    MEMBERWIZARD,
    TaxStatus,
    PolicyOwnershipType,
    Accounts,
    Characteristics,
    CarrierId,
} from "@empowered/constants";
import { PayrollFrequencyCalculatorPipe, PlanDetailsComponent } from "@empowered/ui";

const TWO = 2;

@Component({
    selector: "empowered-coverage-tab",
    templateUrl: "./coverage-tab.component.html",
    styleUrls: ["./coverage-tab.component.scss"],
})
export class CoverageTabComponent implements OnInit, OnDestroy {
    @Select(MemberWizardState.GetUserData) userData$: Observable<MemberFullProfile>;
    @Select(MemberWizardState.GetWizardTabMenu) wizardMenuTab$: Observable<any>;
    @Select(MemberWizardState.GetCoverageData) coverageData$: Observable<any>;
    @Select(MemberWizardState.GetPayFrequency) payFrequency$: Observable<any>;
    @Select(MemberWizardState.GetCurrentFlow) currentFlow$: Observable<MEMBERWIZARD>;
    userData: any;
    payFrequency: PayFrequency;
    coverageArray = [];
    isLoading: boolean;
    totalCost: number;
    prevTab: any;
    nextTab: any;
    tabs: any[];
    languageStrings: Record<string, string>;
    coverageData: any[];
    currentFlow: MEMBERWIZARD;
    CMEMBERWIZARD = MEMBERWIZARD;
    displayedColumns = ["benefit_type", "plan", "status", "eligible_for_update", "current_cost"];
    eligibleForUpdates: boolean;
    footerColumns = ["current_cost"];
    allSubscriptions: Subscription[];
    payFrequencyObject: PayFrequencyObject;
    accPayFrequencyId;
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    isBenefitDollarConfigEnabled: boolean;
    activeEmployee = true;
    private readonly unsubscribe$ = new Subject<void>();
    virginiaFeatureEnabledConfig$: Observable<boolean>;
    virginiaFeatureEnabled$: Observable<boolean>;
    ZERO = 0;

    constructor(
        private readonly store: Store,
        private readonly memberService: MemberService,
        private readonly language: LanguageService,
        private readonly dialog: MatDialog,
        private readonly router: Router,
        private readonly accService: AccountService,
        private readonly enrollmentsService: EnrollmentService,
        private readonly staticUtilService: StaticUtilService,
        private readonly datePipe: DatePipe,
        private readonly payrollFrequencyPipe: PayrollFrequencyCalculatorPipe,
        private readonly dualPlanYearService: DualPlanYearService,
    ) {}

    /**
     * Angular life cycle hook
     * Function used to get required information on initialization of component
     */
    ngOnInit(): void {
        // Virginia Connection configuration enabled/disabled
        this.virginiaFeatureEnabledConfig$ = this.staticUtilService.cacheConfigEnabled(ConfigName.FEATURE_ENABLE_VIRGINIA_OBJECTION);
        // Virginia Connection config
        this.virginiaFeatureEnabled$ = this.virginiaFeatureEnabledConfig$.pipe(
            map((virginiaConfig) =>
                // if virginia objection config is off, then disable feature
                !!virginiaConfig),
        );

        this.allSubscriptions = [];
        this.payFrequencyObject = {
            payFrequencies: [],
            pfType: "",
            payrollsPerYear: 0,
        };
        this.getLanguageStrings();
        this.payFrequency = this.store.selectSnapshot(MemberWizardState.GetPayFrequency);
        this.isLoading = false;
        this.allSubscriptions.push(
            this.wizardMenuTab$.subscribe((tabs) => {
                if (tabs) {
                    this.tabs = tabs;
                    const idx = tabs.findIndex((x) => x.label.toLowerCase() === "coverage");
                    this.nextTab = tabs[idx + 1];
                    this.prevTab = tabs[idx - 1];
                } else {
                    this.store.dispatch(new SetWizardMenuTab(this.memberService.getMemberWizardTabMenu()));
                }
            }),
        );
        this.allSubscriptions.push(
            this.userData$.subscribe((userData) => {
                if (userData) {
                    this.userData = userData;
                    if (Object.keys(userData.workInformation.termination).length !== 0) {
                        const terminationDate = new Date(
                            this.datePipe.transform(userData.workInformation.termination.terminationDate, DateFormats.YEAR_MONTH_DAY),
                        );
                        const today = new Date();
                        terminationDate.setHours(0, 0, 0);
                        today.setHours(0, 0, 0);
                        this.activeEmployee = terminationDate > today;
                    }
                }
                this.getPayFrequencyData();
            }),
        );
        this.staticUtilService
            .cacheConfigEnabled("general.feature.enable.benefitDollars")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                this.isBenefitDollarConfigEnabled = Boolean(result);
            });
        this.allSubscriptions.push(
            this.payFrequency$.subscribe((pdata) => {
                if (this.payFrequency) {
                    this.payFrequency = pdata;
                    this.accPayFrequencyId = this.payFrequency.id;
                }
            }),
        );
        this.allSubscriptions.push(
            this.coverageData$.subscribe((cdata) => {
                this.coverageData = cdata.map((coverage) => {
                    let ridersCost = 0;
                    let riderTotalCost = 0;
                    const coverageDateText = coverage.validity.expiresAfter
                        ? this.languageStrings["primary.portal.enrollmentWizard.coverageDates"]
                        : this.languageStrings["primary.portal.enrollmentWizard.coverageStartDate"];
                    const label = coverage.plan.characteristics.some(
                        (characteristic: string) => characteristic === Characteristics.COMPANY_PROVIDED,
                    )
                        ? this.languageStrings["primary.portal.coverage.adjustment"]
                        : this.languageStrings["primary.portal.expandedShoppingCart.employerContribution"];

                    if (coverage.enrollmentRiders?.length) {
                        coverage.enrollmentRiders.map((rCost) => {
                            ridersCost = ridersCost + this.payrollFrequencyPipe.transform(rCost.totalCost, this.payFrequencyObject);
                            riderTotalCost += rCost.totalCost;
                        });
                    }
                    const totalCostValue = ridersCost + coverage.totalCostPerPayPeriod;
                    return {
                        ...coverage,
                        // Adjustment is memberCost - totalCost, coverage.memberCost includes riderMemberCost too
                        adjustment: coverage.memberCost - (coverage.totalCost + riderTotalCost),
                        coverageDateText: coverageDateText,
                        memberCost: totalCostValue,
                        paymentLabel: label,
                    };
                });
            }),
        );
        this.totalCost = this.coverageData.reduce((total, current) => total + current.memberCost, 0);
        this.getRiderMemberCost();

        this.allSubscriptions.push(
            this.currentFlow$.subscribe((flow) => {
                this.currentFlow = flow;
                if (this.currentFlow !== MEMBERWIZARD.DUAL_ENROLLMENT_NOT_COMPLETED && this.currentFlow !== MEMBERWIZARD.DUAL_FIRST_VISIT) {
                    this.displayedColumns.splice(
                        this.displayedColumns.findIndex((x) => x === "status"),
                        1,
                    );
                }
                if (this.currentFlow === MEMBERWIZARD.ONLY_SEP_FIRST_VISIT || this.currentFlow === MEMBERWIZARD.ONLY_SEP_NOT_COMPLETED) {
                    this.eligibleForUpdates = true;
                } else {
                    this.displayedColumns.splice(
                        this.displayedColumns.findIndex((x) => x === "eligible_for_update"),
                        1,
                    );
                }
            }),
        );
    }
    /**
     * Method to get rider member cost
     */
    getRiderMemberCost(): void {
        this.totalCost = 0;
        this.coverageData = this.coverageData.map((data) => {
            let riderMemberCostPerPayPeriod = 0;
            if (data.enrollmentRiders?.length) {
                data.enrollmentRiders.map((riderData) => {
                    riderMemberCostPerPayPeriod += riderData.memberCostPerPayPeriod;
                });
            }
            riderMemberCostPerPayPeriod = Number(riderMemberCostPerPayPeriod.toFixed(TWO));
            const benefitAmount: number = data.memberCost - (data.memberCostPerPayPeriod + riderMemberCostPerPayPeriod);
            data.planLevelBenefitDollars = benefitAmount;
            const totalCost: number = data.memberCost - Number(benefitAmount.toFixed(TWO));
            data.memberCost = totalCost > 0 ? totalCost : 0;
            this.totalCost += data.memberCost;
            return {
                ...data,
            };
        });
    }
    getPayFrequencyData(): void {
        this.isLoading = true;
        this.allSubscriptions.push(
            this.memberService.getMember(this.userData.memberId, true, this.userData.groupId.toString()).subscribe(
                (member) => {
                    this.accPayFrequencyId = member.body.workInformation.payrollFrequencyId;
                    this.accService.getPayFrequencies(this.userData.groupId).subscribe(
                        (res) => {
                            this.payFrequencyObject.payFrequencies = [...res];
                            this.payFrequency = res.find((frequency) => frequency.id.toString() === this.accPayFrequencyId.toString());

                            this.payFrequencyObject.pfType = this.payFrequency.name;
                            const monthlypayFrequency = res.find((ele) => ele.frequencyType === "MONTHLY");
                            this.payFrequencyObject.payrollsPerYear = monthlypayFrequency.payrollsPerYear;
                            this.isLoading = false;
                        },
                        () => {
                            this.isLoading = false;
                        },
                    );
                },
                () => {
                    this.isLoading = false;
                },
            ),
        );
    }
    getLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.enrollmentWizard.currentCoverageTitle",
            "primary.portal.enrollmentWizard.ifAnythingChanged",
            "primary.portal.enrollmentWizard.yourPlanRenewAuto",
            "primary.portal.enrollmentWizard.yourRecentLifeQualifies",
            "primary.portal.enrollmentWizard.benefitType",
            "primary.portal.enrollmentWizard.plan",
            "primary.portal.enrollmentWizard.coverageDetail",
            "primary.portal.enrollmentWizard.yourFrequencyTotal",
            "primary.portal.enrollmentWizard.status",
            "primary.portal.enrollmentWizard.eligibleForUpdate",
            "primary.portal.enrollmentWizard.currentFrequencyCost",
            "primary.portal.enrollmentWizard.policyChanges",
            "primary.portal.enrollmentWizard.estimated",
            "primary.portal.planDetails.title",
            "primary.portal.enrollmentWizard.coverageDates",
            "primary.portal.enrollmentWizard.coverageStartDate",
            "primary.portal.expandedShoppingCart.employerContribution",
            "primary.portal.coverage.adjustment",
        ]);
    }
    /**
     * Function to display the Plan Details modal
     * @param plan plan to display details
     */
    showPlanDetailsPopup(plan: any): void {
        const memberGroupAccount: Accounts = this.store.selectSnapshot(SharedState.getState).memberMPGroupAccount;
        this.dialog.open(PlanDetailsComponent, {
            data: {
                planId: plan.id,
                planName: plan.name,
                states: [
                    {
                        abbreviation:
                            plan.policyOwnershipType === PolicyOwnershipType.GROUP && memberGroupAccount
                                ? memberGroupAccount.situs.state.abbreviation
                                : this.userData.contact.address.state,
                    },
                ],
                mpGroup: this.userData.groupId,
                productId: plan.productId,
                isCarrierOfADV: plan.carrierId === CarrierId.ADV,
                situsState: memberGroupAccount?.situs.state.abbreviation,
                referenceDate: this.dualPlanYearService.getReferenceDate(),
            },
        });
    }
    goToTab(tab: any): void {
        this.memberService.wizardCurrentTab$.next(this.tabs.findIndex((x) => x.label === tab.label));
        this.router.navigate(["member/" + tab.link]);
    }
    getTaxStatus(tax: TaxStatus | string): string {
        let taxStatus = "";
        if (tax === TaxStatus.POSTTAX) {
            taxStatus = "post-tax";
        }
        if (tax === TaxStatus.PRETAX) {
            taxStatus = "pre-tax";
        }
        return taxStatus;
    }
    ngOnDestroy(): void {
        this.allSubscriptions.forEach((sub) => sub.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
