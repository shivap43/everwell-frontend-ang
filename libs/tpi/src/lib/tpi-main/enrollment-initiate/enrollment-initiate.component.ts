import { takeUntil } from "rxjs/operators";
import { Store } from "@ngxs/store";
import { LanguageService } from "@empowered/language";
import { Component, OnInit, OnDestroy, HostBinding } from "@angular/core";
import { Validators, FormControl } from "@angular/forms";
import { AccountService, EnrollmentService } from "@empowered/api";
import { Subject } from "rxjs";
import { TpiSSOModel, AppSettings, EnrollmentMethod, PlanOffering } from "@empowered/constants";
import { TPIState } from "@empowered/ngxs-store";
import { Router } from "@angular/router";
import { SetEnrollmentMethod } from "@empowered/ngxs-store";
import { TpiServices } from "@empowered/common-services";

const EXIT = "exit";
const SELF_SERVICE = "selfService";
const NPN_SEARCH = "npn-search";
const CONFIRM_ADDRESS = "confirm-address";
const PRIMARY_PRODUCER = "PRIMARY_PRODUCER";
const ERROR = "error";
const DETAILS = "details";
const STEP_ONE = 1;
const STEP_TWO = 2;
const STEP_THREE = 3;
const COVERAGE_SUMMARY_ROUTE = "/tpi/coverage-summary";

@Component({
    selector: "empowered-enrollment-initiate",
    templateUrl: "./enrollment-initiate.component.html",
    styleUrls: ["./enrollment-initiate.component.scss"],
})
export class EnrollmentInitiateComponent implements OnInit, OnDestroy {
    stepId = STEP_ONE;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.tpiEnrollment.enrollingMyself",
        "primary.portal.tpiEnrollment.enrollingAnEmployee",
        "primary.portal.tpiEnrollment.helpEnrollment",
        "primary.portal.tpiEnrollment.helpProducts",
        "primary.portal.tpiEnrollment.enrollProducts",
        "primary.portal.tpiEnrollment.at",
        "primary.portal.tpiEnrollment.or",
        "primary.portal.tpiEnrollment.exit",
        "primary.portal.common.continue",
        "primary.portal.tpiEnrollment.back",
        "primary.portal.tpiEnrollment.whoEnrolling",
        "primary.portal.tpiEnrollment.welcome",
        "primary.portal.tpiEnrollment.viewExistingCoverage",
        "primary.portal.tpiEnrollment.helpProduct",
        "primary.portal.tpiEnrollment.enrollProduct",
    ]);
    @HostBinding("class") classes = "tpi-content-wrapper";
    selectedOption: FormControl;
    ssoAuthData: TpiSSOModel;
    listOfAgentAssistedProduct: PlanOffering[] = [];
    listOfSelfServiceProduct: PlanOffering[] = [];
    planOffered: PlanOffering[] = [];
    subHeading: string;
    private readonly unsubscribe$: Subject<void> = new Subject();
    errorMessage: string;
    selfAssistedProductArray: string[];
    agentAssistedProductArray: string[];
    primaryProducerEmail: string;
    primaryProducerMobile: string;
    primaryProducerFirstName: string;
    primaryProducerLastname: string;
    isSpinnerLoading = false;
    stepperOne = STEP_ONE;
    stepperTwo = STEP_TWO;
    stepperThree = STEP_THREE;
    secondaryHeaderInfo: string;
    existingCoverageSummaryFlag = false;
    covergaeSummaryButtonText: string;
    helpProducts: string;
    enrollProducts: string;
    tpiLnlMode = false;
    constructor(
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly tpiService: TpiServices,
        private readonly accountService: AccountService,
        private readonly router: Router,
        private readonly enrollmentsService: EnrollmentService,
    ) {}
    /**
     * Implements Angular's OnInit Life Cycle hook
     */
    ngOnInit(): void {
        this.covergaeSummaryButtonText = this.languageStrings["primary.portal.tpiEnrollment.exit"];
        this.setSecondaryHeader();
        this.ssoAuthData = this.store.selectSnapshot(TPIState.tpiSsoDetail);
        this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
        this.planOffered = this.store.selectSnapshot(TPIState.getOfferingState);
        this.getPrimaryProducer();
        this.listOfAgentAssistedProduct = this.planOffered.filter((filteredObj) => filteredObj.agentAssistanceRequired);
        this.listOfSelfServiceProduct = this.planOffered.filter((filteredObj) => !filteredObj.agentAssistanceRequired);
        this.tpiService.step$.pipe(takeUntil(this.unsubscribe$)).subscribe((step) => {
            if (!step) {
                this.tpiService.setStep(this.stepId);
            } else {
                this.stepId = step;
            }
        });
        this.selectedOption = new FormControl(SELF_SERVICE, Validators.required);
        this.getProductsList();
    }

    /**
     * Method to set secondary header for showing title
     */
    setSecondaryHeader(): void {
        const welcomeString = this.languageStrings["primary.portal.tpiEnrollment.welcome"];
        this.tpiService.step$.pipe(takeUntil(this.unsubscribe$)).subscribe((step) => {
            if (step === STEP_ONE) {
                this.secondaryHeaderInfo = this.languageStrings["primary.portal.tpiEnrollment.whoEnrolling"];
            } else {
                this.secondaryHeaderInfo = `${welcomeString}
                ${this.store.selectSnapshot(TPIState.tpiSsoDetail).user.name.firstName}`;
            }
        });
    }

    /**
     * Method to differentiate self assisted and agent assisted products
     */
    getProductsList(): void {
        this.selfAssistedProductArray = [...new Set(this.listOfSelfServiceProduct.map((item) => item.plan.product.name))];
        if (this.selfAssistedProductArray.length === 1) {
            this.enrollProducts = this.languageStrings["primary.portal.tpiEnrollment.enrollProduct"];
        } else if (this.selfAssistedProductArray.length > 1) {
            this.enrollProducts = this.languageStrings["primary.portal.tpiEnrollment.enrollProducts"];
        }

        this.agentAssistedProductArray = [...new Set(this.listOfAgentAssistedProduct.map((item) => item.plan.product.name))];
        if (this.agentAssistedProductArray.length === 1) {
            this.helpProducts = this.languageStrings["primary.portal.tpiEnrollment.helpProduct"];
        } else if (this.agentAssistedProductArray.length > 1) {
            this.helpProducts = this.languageStrings["primary.portal.tpiEnrollment.helpProducts"];
        }
    }

    /**
     * This will populate the selection from user
     * @param value comes from radio button selection whether agent assisted or self service
     */
    chooseOption(value: string): void {
        this.selectedOption.setValue(value);
    }

    /**
     * Once user click on continue it will redirect the user to further screen
     */
    proceedFurther(): void {
        if (this.selectedOption.value === SELF_SERVICE) {
            if (this.stepId === STEP_THREE) {
                this.redirectToResidentialPage();
            } else if (this.planOffered.length === this.listOfAgentAssistedProduct.length) {
                // error screen
                this.isSpinnerLoading = true;
                this.enrollmentsService
                    .searchMemberEnrollments(this.ssoAuthData.user.memberId, this.ssoAuthData.user.groupId)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (enrollData) => {
                            this.isSpinnerLoading = false;
                            if (enrollData.length > 0) {
                                this.covergaeSummaryButtonText = this.languageStrings["primary.portal.tpiEnrollment.viewExistingCoverage"];
                                this.existingCoverageSummaryFlag = true;
                            }
                        },
                        (error) => {
                            this.isSpinnerLoading = false;
                            this.showErrorAlertMessage(error);
                        },
                    );
                this.stepId = STEP_TWO;
            } else if (this.ssoAuthData.productId) {
                this.redirectToResidentialPage();
            } else {
                // product page view
                this.getProductsList();
                this.stepId = STEP_THREE;
            }
            this.tpiService.setStep(this.stepId);
        } else {
            // Redirect to NPN Search route
            this.stepId = STEP_THREE;
            this.router.navigate([`tpi/${NPN_SEARCH}`]);
        }
    }

    /**
     * Function to redirect flow to residential page
     */
    redirectToResidentialPage(): void {
        this.store.dispatch(new SetEnrollmentMethod(EnrollmentMethod.SELF_SERVICE));
        this.router.navigate([`tpi/${CONFIRM_ADDRESS}`]);
    }

    /**
     * Function to get the primary producer information
     */
    getPrimaryProducer(): void {
        this.isSpinnerLoading = true;
        this.accountService
            .getAccountProducers(this.ssoAuthData.user.groupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (producer) => {
                    this.isSpinnerLoading = false;
                    const primaryProducer = producer.filter((primary) => primary.role === PRIMARY_PRODUCER)[0].producer;
                    this.primaryProducerMobile = primaryProducer.phoneNumber;
                    this.primaryProducerFirstName = primaryProducer.name.firstName;
                    this.primaryProducerLastname = primaryProducer.name.lastName;
                    this.primaryProducerEmail = primaryProducer.emailAddress;
                    this.subHeading = `${this.primaryProducerFirstName} ${this.primaryProducerLastname}
            ${this.languageStrings["primary.portal.tpiEnrollment.at"]} ${this.primaryProducerMobile}
             ${this.languageStrings["primary.portal.tpiEnrollment.or"]} ${this.primaryProducerEmail}`;
                },
                (error) => {
                    this.isSpinnerLoading = false;
                    this.showErrorAlertMessage(error);
                },
            );
    }

    /**
     * Function will map the error dynamically from DB based on the API error code and status
     * @param err error object return in case of failure of API
     */
    showErrorAlertMessage(err: Error): void {
        const error = err[ERROR];
        if (error.status === AppSettings.API_RESP_400 && error[DETAILS].length > 0) {
            for (const detail of error[DETAILS]) {
                this.errorMessage = this.language.fetchSecondaryLanguageValue(
                    `secondary.portal.commission.api.${error.status}.${error.code}.${detail.field}`,
                );
            }
        } else if (error.code === AppSettings.DUPLICATE) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.portal.commission.api.${error.status}.${error.code}`);
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }

    /**
     * Function called on click of 'Exit' button
     */
    onExit(): void {
        if (this.existingCoverageSummaryFlag && this.stepId === STEP_TWO) {
            this.router.navigate([COVERAGE_SUMMARY_ROUTE]);
        } else {
            this.router.navigate([`tpi/${EXIT}`]);
        }
    }
    /**
     * Function called on click of 'Exit' button
     */
    onBack(): void {
        this.stepId = STEP_ONE;
        this.tpiService.setStep(this.stepId);
    }

    /**
     * To avoid memory leakage this will destroy all the subscription for the component
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
