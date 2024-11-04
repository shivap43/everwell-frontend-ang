import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { Store, Select } from "@ngxs/store";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { EmpoweredModalService } from "@empowered/common-services";
import { Observable, Subscription, Subject, of } from "rxjs";

import {
    BenefitsOfferingState,
    SetBenefitsStateMPGroup,
    SetLandingFlag,
    SetAllEligiblePlans,
    GetProductsPanel,
    SetPlanEligibility,
    MakeStoreEmpty,
    SetThirdPartyPlatformRequirement,
    SetAccountThirdPartyPlatforms,
    SetVasExceptions,
    OfferingSteps,
    SideNavService,
    SetAllProducts,
    InitialBenefitsOfferingSteps,
    AccountInfoState,
    SharedState,
    SetRegex,
    StaticUtilService,
} from "@empowered/ngxs-store";
import { AccountDetails, BenefitsOfferingMode, BenefitsOfferingService, AccountService } from "@empowered/api";
import { UserService } from "@empowered/user";
import { tap, takeUntil, switchMap, filter } from "rxjs/operators";
import { SkipNonAgPopupComponent } from "../aflac-group-offering/skip-non-ag-popup/skip-non-ag-popup.component";
import { CarrierId, Permission, AccountImportTypes, AdminCredential } from "@empowered/constants";
import { BenefitOfferingHelperService } from "../benefit-offering-helper.service";

const OFFSET_WITH_PRICING_STEP = 1;
const OFFSET_WITHOUT_PRICING_STEP = 2;
const IBO_GROUP_ATTRIBUTE_NAME = "aflac_group_benefit_offering";
const FALSE = "false";

@Component({
    selector: "empowered-benefits-offering",
    templateUrl: "./benefits-offering.component.html",
    styleUrls: ["./benefits-offering.component.scss"],
})
export class BenefitsOfferingComponent implements OnInit, OnDestroy {
    // TODO - Hard coded default step position for now
    @Select(AccountInfoState.getAccountInfo) accountInfo$: Observable<AccountDetails>;
    defaultStepPosition = 1;
    showSpinner = true;
    hasError = false;
    display = true;
    restrictBOSetup = false;
    subscription: Subscription;
    hasAGProductError: boolean;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.benefitsOffering.title",
        "primary.portal.common.servertimeout",
        "primary.portal.maintenanceBenefitsOffering.title",
        "primary.portal.maintenanceBenefitsOffering.zeroState",
        "primary.portal.sharedCase.benefitsOffering.title",
        "primary.portal.benefitsOffering.skipNonAgSetup",
    ]);
    credentialDetails: AdminCredential;
    isSharedAccount = false;
    mpGroup: number;
    private readonly unsubscribe$ = new Subject<void>();
    initialOfferingSteps: OfferingSteps;
    constructor(
        private readonly sideNavService: SideNavService,
        private readonly router: Router,
        private readonly store: Store,
        private readonly route: ActivatedRoute,
        private readonly language: LanguageService,
        private readonly userService: UserService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly staticUtilService: StaticUtilService,
        private readonly accountService: AccountService,
        private readonly benefitOfferingHelperService: BenefitOfferingHelperService,
    ) {
        this.mpGroup = this.route.parent.snapshot.parent.parent.params.mpGroupId;
        if (this.mpGroup) {
            this.store.dispatch(new SetBenefitsStateMPGroup(this.mpGroup));
        }
        this.initialOfferingSteps = this.store.selectSnapshot(BenefitsOfferingState.getOfferingStepperData);
    }

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     */
    ngOnInit(): void {
        this.restrictBOSetup = this.store.selectSnapshot(SharedState.hasPermission(Permission.ACCOUNT_BO_RESTRICT_MANAGE_PLANS));
        this.store.dispatch(new SetVasExceptions());
        let editBOStep = false;
        this.route.queryParams.subscribe((params) => {
            editBOStep = params["edit"];
        });
        this.store.dispatch(new SetRegex());
        this.sideNavService.initializeStepperData(false);
        if (!editBOStep) {
            this.store.dispatch(new MakeStoreEmpty());
        }
        this.sideNavService.setBenefitsOfferingMode(BenefitsOfferingMode.INITIAL);
        this.sideNavService.updateFilterData(null); // reset filter data
        this.setAgOfferingPermissions();
        // This below lines of code is used to fetch logged in credential from userService
        this.userService.credential$
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((credential: AdminCredential) => {
                    this.credentialDetails = credential;
                    this.store.dispatch(new SetAccountThirdPartyPlatforms());
                    this.store.dispatch(new SetThirdPartyPlatformRequirement());
                }),
            )
            .subscribe();
        try {
            this.mpGroup = this.route.parent.snapshot.parent.parent.params.mpGroupId;
            if (this.mpGroup === undefined) {
                this.router.navigate(["../payroll"], { relativeTo: this.route });
            } else {
                this.store.dispatch(new SetBenefitsStateMPGroup(this.mpGroup));
                this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.*"));
                // The below if-else condition is used to loose couple the method calls when admin logs in
                if (this.credentialDetails && this.credentialDetails.adminId && this.restrictBOSetup) {
                    this.adminViewBenefitsOffering();
                } else {
                    let defaultStep = 0;
                    const currentAccount: AccountDetails = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
                    let REVIEW_STEP: number;
                    this.store
                        .dispatch(new SetAllProducts())
                        .pipe(
                            takeUntil(this.unsubscribe$),
                            switchMap((response) => this.store.dispatch(new SetLandingFlag())),
                            tap((response) => {
                                defaultStep = response.productOffering.defaultStep;
                                if (editBOStep) {
                                    defaultStep = +editBOStep;
                                }
                                if (defaultStep === this.initialOfferingSteps.SETTINGS + 1) {
                                    this.sideNavService.defaultStepPositionChanged$.next(defaultStep);
                                    this.showSpinner = false;
                                    this.router.navigate(["./" + defaultStep.toString()], {
                                        relativeTo: this.route,
                                    });
                                }
                                REVIEW_STEP = this.initialOfferingSteps.PRICES_ELIGIBILITY
                                    ? InitialBenefitsOfferingSteps.withPricing.REVIEW_SUBMIT + OFFSET_WITH_PRICING_STEP
                                    : InitialBenefitsOfferingSteps.withoutPricing.REVIEW_SUBMIT + OFFSET_WITHOUT_PRICING_STEP;
                            }),
                            filter((response) => defaultStep !== this.initialOfferingSteps.SETTINGS + 1),
                            switchMap((res) => this.store.dispatch(new SetAllEligiblePlans([], AccountImportTypes.AFLAC_INDIVIDUAL))),
                            switchMap((res) => this.store.dispatch(new SetPlanEligibility())),
                            switchMap((res) => this.store.dispatch(new GetProductsPanel())),
                            switchMap(() => {
                                // set up the carrier form data only if user has completed the carrier form step in earlier IBO setup
                                if (defaultStep > this.initialOfferingSteps.CARRIER_FORMS) {
                                    return this.benefitOfferingHelperService.setupCarrierFormDataToStore();
                                }
                                return of(null);
                            }),
                        )
                        .subscribe(
                            (result) => {
                                this.showSpinner = false;
                                // Added condition to pass defaultStepPositionChanged value based on Prices & Eligibility screen
                                this.sideNavService.defaultStepPositionChanged$.next(defaultStep);
                                if (defaultStep === this.initialOfferingSteps.PLANS + 1) {
                                    const productChoice = this.store
                                        .selectSnapshot(BenefitsOfferingState.getpanelProducts)
                                        .filter((panel) => panel.productChoice)[0].productChoice;
                                    const productId =
                                        productChoice.individual && productChoice.group ? productChoice.id + "i" : productChoice.id;
                                    this.router.navigate(["./" + defaultStep.toString() + "/" + productId.toString()], {
                                        relativeTo: this.route,
                                    });
                                } else if (
                                    currentAccount &&
                                    currentAccount.importType === AccountImportTypes.SHARED_CASE &&
                                    defaultStep === REVIEW_STEP
                                ) {
                                    this.router.navigate(["./ag-review"], {
                                        relativeTo: this.route,
                                    });
                                } else {
                                    this.router.navigate(["./" + defaultStep.toString()], {
                                        relativeTo: this.route,
                                    });
                                }
                            },
                            (error) => {
                                this.showSpinner = false;
                                this.hasError = true;
                            },
                        );
                }
            }
        } catch (Error) {
            this.showSpinner = false;
            this.router.navigate(["../payroll"], { relativeTo: this.route });
        }
    }

    /**
     * Method to set the permissions to display skip non AG button
     */
    setAgOfferingPermissions(): void {
        let agHardStopErrors: Array<string>;
        let accountInfo: AccountDetails;
        this.staticUtilService
            .cacheConfigValue("general.aflac_groups.benefit_offering.aflac_group_offering_error.hard_stop.values")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => (agHardStopErrors = response?.split(",")));
        this.accountInfo$
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((resp) => {
                    accountInfo = resp;
                    return this.accountService.getGroupAttributesByName([IBO_GROUP_ATTRIBUTE_NAME]);
                }),
                switchMap((result) => {
                    this.isSharedAccount = accountInfo.importType === AccountImportTypes.SHARED_CASE;
                    if (this.isSharedAccount && result.length && result[0].value === FALSE) {
                        return this.benefitsOfferingService.getOfferablePlans(
                            [accountInfo.situs.state.abbreviation],
                            accountInfo.id,
                            AccountImportTypes.AFLAC_GROUP,
                        );
                    }
                    return of(null);
                }),
            )
            .subscribe((plansResponse) => {
                if (plansResponse && plansResponse.aflacGroupOfferingError && plansResponse.aflacGroupOfferingError.error) {
                    const isNonSelfService = !!(
                        plansResponse.aflacGroupOfferingError.nonSelfServiceProducts &&
                        plansResponse.aflacGroupOfferingError.nonSelfServiceProducts.length &&
                        plansResponse.plans.some((plan) => plan.carrierId === CarrierId.AFLAC_GROUP)
                    );
                    const isHardStopError =
                        agHardStopErrors.findIndex((eachError) => eachError === plansResponse.aflacGroupOfferingError.error) !== -1;
                    this.hasAGProductError = isHardStopError || !isNonSelfService;
                }
            });
    }

    /**
     * This below method is used to execute when the logged user is admin and it will stops spinner
     */
    adminViewBenefitsOffering(): void {
        this.showSpinner = false;
    }

    /**
     * Method invoked on click of Skip-Non-AG setup
     */
    skipNonAg(): void {
        this.empoweredModalService
            .openDialog(SkipNonAgPopupComponent, {
                data: {
                    route: this.route,
                    mpGroup: this.mpGroup,
                },
            })
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((result) => result === true),
            )
            .subscribe((result) => {
                this.router.navigate(["../maintenance-offering"], {
                    queryParams: { initial: true },
                    relativeTo: this.route,
                });
            });
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
