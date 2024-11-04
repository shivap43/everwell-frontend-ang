import { Component, OnInit, HostListener, OnDestroy, ViewChild, Inject } from "@angular/core";
import { Store } from "@ngxs/store";
import {
    BenefitsOfferingState,
    OfferingSteps,
    SetNewPlanYearValue,
    SetSubmitApprovalToasterStatus,
    StaticUtilService,
} from "@empowered/ngxs-store";
import {
    Carrier,
    BenefitsOfferingService,
    coverageStartFunction,
    CarrierFormWithCarrierInfo,
    StaticService,
    CarrierFormSetupStatus,
    AdminService,
    AccountContacts,
    AccountService,
} from "@empowered/api";
import { AddUpdateContactInfoComponent, BenefitOfferingUtilService } from "@empowered/ui";
import { LanguageService } from "@empowered/language";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DomSanitizer } from "@angular/platform-browser";
import { DatePipe } from "@angular/common";
import { Subject, of, iif, Observable } from "rxjs";
import { takeUntil, tap, switchMap, catchError, filter } from "rxjs/operators";
import { ProductsPlansQuasiComponent } from "../products-plans-quasi.component";
import { ProductsPlansQuasiService } from "../services/products-plans-quasi.service";
import {
    CarrierId,
    ClientErrorResponseType,
    ConfigName,
    PanelModel,
    PlanPanelModel,
    AppSettings,
    PlanChoice,
    TaxStatus,
    CountryState,
    Admin,
    PlanYear,
    AddUpdateContactDialogData,
} from "@empowered/constants";
import { EmpoweredModalService } from "@empowered/common-services";

const SAVE_BENEFITS_OFFERING = "save";
const ACCOUNT = "ACCOUNT";
const BILLING = 2;
const SPLIT_COMMA = ",";
const ROLE_ID_REPORTS_TO_ID = "roleId,reportsToId";
@Component({
    selector: "empowered-review-submit-quasi",
    templateUrl: "./review-submit-quasi.component.html",
    styleUrls: ["./review-submit-quasi.component.scss"],
})
export class ReviewSubmitQuasiComponent implements OnInit, OnDestroy {
    statesList: any[] = [];
    stateValues: any[] = [];
    state = "";
    employee: number;
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
    languageString: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.reviewSubmit.continousPlan",
        "primary.portal.reviewSubmit.plan",
        "primary.portal.reviewSubmit.sendForApproval",
        "primary.portal.reviewSubmit.plansAndCoverageDates",
        "primary.portal.common.gotIt",
        "primary.portal.reviewSubmit.submitToHR.title",
        "primary.portal.reviewSubmit.submitToHR.subTitle",
        "primary.portal.reviewSubmit.mainTitle",
        "primary.portal.reviewSubmit.subTitle",
        "primary.portal.reviewSubmit.mainHRTitle",
        "primary.portal.reviewSubmit.subHRTitle",
        "primary.portal.reviewSubmit.benefitsOffered.products",
        "primary.portal.reviewSubmit.benefitsOffered.coverageDates",
        "primary.portal.reviewSubmit.benefitsOffered.plans",
        "primary.portal.reviewSubmit.titlePrice",
        "primary.portal.common.edit",
        "primary.portal.reviewSubmit.carrierForms",
        "primary.portal.reviewSubmit.complete",
        "primary.portal.reviewSubmit.incomplete",
        "primary.portal.common.close",
        "primary.portal.reviewSubmit.submitOffering",
        "primary.portal.common.save",
        "primary.portal.common.back",
        "primary.portal.reviewSubmit.benefitsOffered",
        "primary.portal.reviewSubmit.benefitsOfferedSection",
        "primary.portal.benefitsOffering.reviewSubmit.addAdminTitle",
        "primary.portal.benefitsOffering.reviewSubmit.addAdminDescription",
        "primary.portal.common.cancel",
        "primary.portal.administrators.addAdmin",
        "primary.portal.benefitsOffering.taxStatus",
        "primary.portal.benefitsOffering.bothTax",
        "primary.portal.benefitsOffering.both",
        "primary.portal.benefitsOffering.postTax",
        "primary.portal.benefitsOffering.preTax",
        "primary.portal.reviewSubmit.hQVas.adminAdded.message",
    ]);
    planYearDatesTooltip: any;
    planYearDatesTooltipContinuous: any;
    alertFlag = true;
    isAlert: boolean;
    stepNumber: number;
    isAlertEnabled: boolean;
    coverageStartDateOptions = [];
    carrierFormStatus: any[] = [];
    errorResponse = false;
    errorMessage: string[] = [];
    TaxStatus = TaxStatus;
    private unsubscribe$ = new Subject<void>();
    @ViewChild("submitToHR", { static: true }) submitToHR;
    @ViewChild("submitOffering", { static: true }) submitOffering;
    enableEditPrice = false;
    planYearChoice: boolean;
    carrierFormsFromStore: CarrierFormWithCarrierInfo[];
    carriersForApproval: any[];
    allAdmins: Admin[];
    offeringStepperData: OfferingSteps;
    contactInfoBilling: AccountContacts[];
    billingAdded = false;
    hrApprovalVasConfig: string[] = [];
    isApprovalRequiredForVas: boolean;

    constructor(
        private readonly dialog: MatDialog,
        private readonly quasiService: ProductsPlansQuasiService,
        private readonly dialogRef: MatDialogRef<ProductsPlansQuasiComponent>,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly staticService: StaticService,
        private readonly benefitsService: BenefitsOfferingService,
        private readonly domSanitizer: DomSanitizer,
        private readonly datePipe: DatePipe,
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly adminService: AdminService,
        private readonly accountService: AccountService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly staticUtilService: StaticUtilService,
        private readonly benefitOfferingUtilService: BenefitOfferingUtilService,
    ) {}

    /**
     * Angular life-cycle hook: ngOnInit
     * Load required data on component initialization
     */
    ngOnInit(): void {
        this.offeringStepperData = this.store.selectSnapshot(BenefitsOfferingState.getOfferingStepperData);
        this.isLoading = true;
        this.isAlertEnabled = true;
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.planYearChoice = this.store.selectSnapshot(BenefitsOfferingState.GetNewPlanYearChoice);
        this.accountService
            .getAccountContacts()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.contactInfoBilling = resp.filter((contact) => contact.typeId === BILLING);
            });
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
    }

    getConfigurationSpecifications(): void {
        this.staticService.getConfigurations("broker.non_aflac_carriers_that_require_planyear_approval", this.mpGroup).subscribe((data) => {
            this.carriersForApproval = data[0].value.split(",");
            this.arrangeData();
        });
    }

    // Arrange set of data
    arrangeData(): void {
        this.benefitsService
            .getPlanYears(this.mpGroup, true)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.planYearDetails = response;
                    if (this.data.planYears && this.data.planYears.length) {
                        this.planYearDetails.push(...this.data.planYears);
                    }
                    this.getValuesFromStore();
                    if (this.planYearChoice === null && this.data.opensFrom !== "plans") {
                        this.panelProducts = this.store
                            .selectSnapshot(BenefitsOfferingState.GetUnapprovedPanel)
                            .filter((pannel) => pannel.productChoice != null);
                    } else {
                        this.panelProducts = this.store
                            .selectSnapshot(BenefitsOfferingState.GetNewPlanYearPanel)
                            .filter((pannel) => pannel.productChoice != null);
                    }

                    this.carriers = this.store.selectSnapshot(BenefitsOfferingState.getAllCarriers);
                    this.setProductInformation();
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
    }

    /**
     * Set product information
     * @returns void
     */
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
                this.isLoading = false;
            });
        });
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
        });
        this.carrierFormsStatus(specificCarrier);
    }
    /**
     * @description Carrier Forms status
     * @param specificCarrier {Carrier} the carrier form
     */
    carrierFormsStatus(specificCarrier: Carrier): void {
        this.checkPricesEdiatable();
        // TODO Hardcode values should come from langauges
        const carrierForm = this.carrierFormStatus.filter(
            (form) => form === specificCarrier.name + " complete" || form === specificCarrier.name + " incomplete",
        );
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
                    } else {
                        this.isAutoApproved = forms.formStatus === CarrierFormSetupStatus.APPROVED;
                        this.carrierFormStatus.push(
                            this.languageString["primary.portal.reviewSubmit.complete"].replace("##form##", forms.formName),
                        );
                    }
                }
            });
        }
        this.isLoading = false;
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
                if (item.product.valueAddedService && this.isApprovalRequiredForVas) {
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

    // Set PR Plans
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

    // Setting up states in accordion
    displayValues(values: CountryState[]): any {
        this.stateValues = [];
        let displayValue = "";
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

    // Step returning an object when we click on edit
    stepChangeOnEdit(stepNumber: number): any {
        const stepChange = {
            step: stepNumber,
            state: "edit",
        };
        return stepChange;
    }

    // Edit products redirects to products step
    editProducts(): void {
        this.quasiService.stepClicked$.next(this.stepChangeOnEdit(1));
    }

    // Edit plans redirects to plans step
    editPlans(): void {
        this.quasiService.stepClicked$.next(this.stepChangeOnEdit(2));
    }

    // Edit coverage-dates redirects to coverage-dates step
    editCoverageDates(): void {
        this.quasiService.stepClicked$.next(this.stepChangeOnEdit(3));
    }

    // Edit prices redirects to prices & eligiblity step
    editPrices(): void {
        this.quasiService.stepClicked$.next(this.stepChangeOnEdit(4));
    }

    // Edit carrier-forms redirects to carrier-forms step
    editCarrierForms(): void {
        this.quasiService.stepClicked$.next(this.stepChangeOnEdit(this.offeringStepperData.CARRIER_FORMS));
    }

    // navigate back to carrier-forms step
    onBack(): void {
        this.quasiService.stepClicked$.next(this.offeringStepperData.CARRIER_FORMS);
    }
    /**
     * check condition on submit of benefit offering
     * @param isAdminApprovalRequired check for admin approval
     * @returns void
     */
    onSaveBenefitsOffering(isAdminApprovalRequired: boolean): void {
        const unApprovedPlanChoices: PlanChoice[] = this.store.selectSnapshot(BenefitsOfferingState.getUnapprovedPlanChoices);
        this.store.dispatch(new SetNewPlanYearValue(false));
        const isVas = this.coveragePeriodPRPlansPanelList?.some((panelList) => panelList.product.valueAddedService);
        if (unApprovedPlanChoices.length) {
            this.adminService
                .getAccountAdmins(this.mpGroup, ROLE_ID_REPORTS_TO_ID)
                .pipe(
                    tap((admin) => {
                        this.allAdmins = admin;
                        const isQ60 = this.carrierFormsFromStore.some(
                            (carrierForm) => carrierForm.carrierId === CarrierId.AFLAC && !!carrierForm.id,
                        );
                        if (
                            isAdminApprovalRequired ||
                            (!this.isApprovalRequiredForVas && isVas && !this.allAdmins.length) ||
                            // billing pop up should appear for Q60 plan
                            isQ60
                        ) {
                            if (isQ60 && !this.contactInfoBilling.length && !this.billingAdded) {
                                this.addBillingContact();
                            } else {
                                this.onSubmitToHR();
                            }
                        } else {
                            this.onSubmit();
                        }
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        } else {
            this.onSubmit();
        }
    }
    /**
     * This method will execute when user clicked on submit benefits offering
     */
    onSubmit(): void {
        this.isLoading = true;
        this.benefitsService
            .submitApprovalRequest(this.mpGroup, false)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.isLoading = false;
                    this.quasiService.setQuasiClosedStatus(true);
                    this.dialogRef.close(SAVE_BENEFITS_OFFERING);
                },
                (error) => {
                    this.isLoading = false;
                    this.errorResponse = true;
                    if (error.status === AppSettings.API_RESP_409) {
                        if (error.error.code === "invalidState") {
                            this.errorMessage.push(
                                this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.invalidState"),
                            );
                        } else if (error.error.code === "conflict") {
                            this.errorMessage.push(
                                this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.conflict"),
                            );
                        } else if (error.error.code === "locked") {
                            this.errorMessage.push(
                                this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.locked"),
                            );
                        }
                    } else if (error.status === AppSettings.API_RESP_500) {
                        this.dialogRef.close("save");
                        this.errorMessage.push(
                            this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.internalServerError"),
                        );
                    } else if (error.status === AppSettings.API_RESP_403) {
                        this.errorMessage.push(
                            this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.forbiddenError"),
                        );
                    }
                },
            );
    }
    /**
     * This function is for submitting benefit offering to HR.
     */
    onSubmitToHR(): void {
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
                        // if there is no admin inform user to add admin
                        return this.benefitOfferingUtilService.addAdminPopUp().pipe(
                            switchMap((status: string) =>
                                iif(
                                    () => status !== null && status !== undefined && status !== AppSettings.FALSE,
                                    of(true).pipe(
                                        tap((data) => {
                                            this.isLoading = false;
                                            // if user wants to add admin open addAdminManually popup
                                            this.addAdmin(status);
                                        }),
                                    ),
                                    of(false).pipe(
                                        tap((obj) => {
                                            this.isLoading = false;
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

    // Method to open addAdmin popup
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
                                // serice call to submit offering if admin is added
                                return this.submitServiceCall();
                            }),
                        ),
                        of(false).pipe(
                            tap((obj) => {
                                this.isLoading = false;
                            }),
                        ),
                    ),
                ),
            )
            .subscribe();
    }
    /**
     * service call to submit the offering
     * @returns {Observable<void>}
     */
    submitServiceCall(): Observable<void> {
        return this.benefitsService.submitApprovalRequest(this.mpGroup, true).pipe(
            takeUntil(this.unsubscribe$),
            tap(() => {
                this.isLoading = false;
                if (this.isAutoApproved) {
                    this.dialog.open(this.submitOffering);
                    this.quasiService.setQuasiClosedStatus(true);
                    this.dialogRef.close(SAVE_BENEFITS_OFFERING);
                } else {
                    this.dialog.open(this.submitToHR);
                    this.store.dispatch(new SetSubmitApprovalToasterStatus({ mpGroup: this.mpGroup, isSubmitToasterClosed: false }));
                }
            }),
            catchError((error) => {
                this.isLoading = false;
                this.errorResponse = true;
                if (error.status === AppSettings.API_RESP_409) {
                    if (error.error.code === ClientErrorResponseType.INVALID_STATE) {
                        this.errorMessage.push(
                            this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.invalidState"),
                        );
                    } else if (error.error.code === ClientErrorResponseType.CONFLICT) {
                        this.errorMessage.push(
                            this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.conflict"),
                        );
                    } else if (error.error.code === ClientErrorResponseType.LOCKED) {
                        this.errorMessage.push(
                            this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.locked"),
                        );
                    }
                } else if (error.status === AppSettings.API_RESP_500) {
                    this.dialogRef.close(SAVE_BENEFITS_OFFERING);
                    this.errorMessage.push(
                        this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.internalServerError"),
                    );
                } else if (error.status === AppSettings.API_RESP_403) {
                    this.errorMessage.push(
                        this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.reviewSubmit.forbiddenError"),
                    );
                }
                return of(null);
            }),
        );
    }
    /**
     * This method will execute when we close product-plans quasi modal
     */
    closeModal(): void {
        this.quasiService.setQuasiClosedStatus(true);
        this.dialogRef.close(SAVE_BENEFITS_OFFERING);
        this.dialog.closeAll();
    }

    areAllFormsComplete(): boolean {
        const incompleteForms = this.carrierFormsFromStore.filter((form) =>
            [CarrierFormSetupStatus.INCOMPLETE, CarrierFormSetupStatus.NOT_STARTED].includes(form.formStatus as CarrierFormSetupStatus),
        );
        return incompleteForms.length === 0;
    }

    /**
     * Add billing contact
     */
    addBillingContact(): void {
        const data: AddUpdateContactDialogData = {
            parentMode: ACCOUNT,
            isAdd: true,
            isPrimary: this.contactInfoBilling.length === 0,
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
                filter((response) => response),
            )
            .subscribe(() => {
                this.billingAdded = true;
                this.onSubmitToHR();
            });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
