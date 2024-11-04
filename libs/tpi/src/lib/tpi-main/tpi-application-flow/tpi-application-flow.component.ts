import { Component, OnInit, HostBinding, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { MatDialogConfig } from "@angular/material/dialog";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { Store } from "@ngxs/store";
import { TPIState, AppFlowService } from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";

import { TpiServices, EmpoweredModalService } from "@empowered/common-services";
import { ExitPopupModalComponent } from "@empowered/ui";
import { ConfirmationStepLabels, StaticStep, TpiSSOModel, AppSettings, EnrollmentMethod } from "@empowered/constants";

const SUBMIT_APP_FLOW_FORM = "submitAppFlowForm";
const PREVIOUS_FORM = "previousForm";
const BACK_TO_REVIEW = "BackToReview";
const NEXT_SIGNATURE = "NextSignature";

@Component({
    selector: "empowered-tpi-application-flow",
    templateUrl: "./tpi-application-flow.component.html",
    styleUrls: ["./tpi-application-flow.component.scss"],
})
export class TpiApplicationFlowComponent implements OnInit, OnDestroy {
    @HostBinding("class") classes = "tpi-content-wrapper";
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.tpiEnrollment.shopCoverage",
        "primary.portal.tpi.appFlow.backToReview",
        "primary.portal.applicationFlow.backToShop",
        "primary.portal.common.back",
        "primary.portal.applicationFlow.beneficiary.nextFinishApplications",
        "primary.portal.tpi.appFlow.nextProduct",
        "primary.portal.brandingModalExit.buttonExit",
        "primary.portal.common.submit.applicant",
        "primary.portal.applicationFlow.submit",
        "primary.portal.applicationFlow.backReview",
        "primary.portal.applicationFlow.nextSignature",
        "primary.portal.applicationFlow.planOption.nextAflacAlways",
        "primary.portal.applicationFlow.backToShop",
        "primary.portal.applicationFlow.confirmation.viewCoverageSummary",
        "primary.portal.applicationFlow.nextConfirmation",
        "primary.portal.applicationFlow.planOption.nextBilling",
        "primary.portal.enrollment.complete.exit",
        "primary.portal.applicationFlow.confirmation.viewMyCoverage",
        "primary.portal.applicationFlow.nextPreliminaryStatement",
    ]);
    tpiSSODetails: TpiSSOModel;
    showNextProductButton = false;
    staticStep: StaticStep;
    displayButtonName: string;
    displayProductButton = false;
    displayExitButton = true;
    displayBackButton = false;
    isSsoToPlan = false;
    isSsoToProduct = false;
    isSsoToShop = false;
    private readonly unsubscribe$ = new Subject<void>();
    hideBackButton = false;
    tpiLnlMode = false;
    isTpi = false;
    showPreliminaryStatement = false;
    hidePreliminaryStatement = false;

    constructor(
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly router: Router,
        private readonly appFlowService: AppFlowService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly tpiService: TpiServices,
    ) {}

    /**
     * Life cycle hook for angular to initialize the component.
     * This component is responsible for initiating the TPI application flow.
     */
    ngOnInit(): void {
        this.isTpi = this.router.url.indexOf(AppSettings.TPI) > 0;
        this.tpiSSODetails = this.store.selectSnapshot(TPIState.tpiSsoDetail);
        this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
        if (this.tpiSSODetails.planId) {
            this.isSsoToPlan = true;
        } else if (this.tpiSSODetails.productId) {
            this.isSsoToProduct = true;
        } else {
            this.isSsoToShop = true;
        }

        this.appFlowService.showPreliminaryStatementStep$.pipe(takeUntil(this.unsubscribe$)).subscribe((response) => {
            this.showPreliminaryStatement = response;
        });
        this.appFlowService.hidePreliminaryStatementStepTPI$.pipe(takeUntil(this.unsubscribe$)).subscribe((response) => {
            this.hidePreliminaryStatement = response;
        });
        this.initializeFooter();
    }

    /**
     * Function to initialize footer data
     */
    initializeFooter(): void {
        this.appFlowService.showNextProductFooter$.pipe(takeUntil(this.unsubscribe$)).subscribe((response) => {
            this.initializeValues(response.nextClick);
            switch (response.data) {
                case StaticStep.AFLAC_ALWAYS:
                    this.hidePreliminaryStatement = true;
                    this.displayButtonNames("primary.portal.applicationFlow.planOption.nextAflacAlways");
                    break;
                case StaticStep.BILLING:
                    this.hidePreliminaryStatement = true;
                    this.displayButtonNames("primary.portal.applicationFlow.planOption.nextBilling");
                    break;
                case StaticStep.ONE_SIGNATURE:
                    this.hidePreliminaryStatement = false;
                    this.displayButtonNames("primary.portal.applicationFlow.beneficiary.nextFinishApplications");
                    break;
                case EnrollmentMethod.HEADSET:
                    this.displayButtonNames("primary.portal.common.submit.applicant");
                    break;
                case EnrollmentMethod.FACE_TO_FACE:
                    this.displayButtonNames("primary.portal.applicationFlow.submit");
                    break;
                case BACK_TO_REVIEW:
                    this.displayBackButton = true;
                    break;
                case NEXT_SIGNATURE:
                    this.displayButtonNames("primary.portal.applicationFlow.nextSignature");
                    break;
                case StaticStep.PDA:
                    this.hideBackButton = true;
                    this.displayButtonNames("primary.portal.applicationFlow.nextConfirmation");
                    break;
                default:
                    this.initializeConfirmationPageButtons(response.data);
            }
        });
    }

    /**
     * Function to display buttons on confirmation screen footer
     * @param stepLabel Confirmation page button name
     */
    initializeConfirmationPageButtons(stepLabel: string): void {
        switch (stepLabel) {
            case ConfirmationStepLabels.EXIT_ENROLLMENT:
                this.hideBackButton = true;
                this.displayExitButton = true;
                break;
            case ConfirmationStepLabels.VIEW_COVERAGE_SUMMARY:
                this.displayExitButton = true;
                this.hideBackButton = true;
                this.displayButtonNames("primary.portal.applicationFlow.confirmation.viewCoverageSummary");
                break;
            case ConfirmationStepLabels.VIEW_MY_COVERAGE:
                this.displayExitButton = true;
                this.hideBackButton = true;
                this.displayButtonNames("primary.portal.applicationFlow.confirmation.viewMyCoverage");
                break;
            default:
                this.displayProductButton = true;
                this.displayButtonName = stepLabel;
        }
    }

    /**
     * Initialization of values
     * @param nextClick To check if the button needs to be displayed or not
     */
    initializeValues(nextClick: boolean): void {
        this.showNextProductButton = nextClick;
        this.displayBackButton = false;
        this.displayProductButton = false;
        this.displayExitButton = false;
        this.hideBackButton = false;
    }

    /**
     * To display the name of buttons in tpi footer
     * @param buttonName Name of the button from language
     */
    displayButtonNames(buttonName: string): void {
        this.displayButtonName = this.languageStrings[buttonName];
    }

    /**
     * Function triggered on click of 'Exit' button
     */
    onExit(): void {
        const dialogConfig = new MatDialogConfig();
        const modalData = {
            memberId: this.tpiSSODetails.user.memberId,
            groupId: this.tpiSSODetails.user.groupId,
            ssoToShop: this.isSsoToShop,
        };
        dialogConfig.data = modalData;
        this.empoweredModalService.openDialog(ExitPopupModalComponent, dialogConfig);
    }

    /**
     * Function to trigger the click event for Next Product
     */
    onClickEvent(): void {
        document.getElementById(SUBMIT_APP_FLOW_FORM).click();
    }

    /**
     * Function to trigger the back click event
     */
    onBackClickEvent(): void {
        document.getElementById(PREVIOUS_FORM).click();
    }

    /**
     * Function to route back to shop page
     */
    backToShop(): void {
        this.router.navigate(["tpi/shop"]);
    }

    /**
     * Function to close the modal and redirect to TPP home page
     */
    backToTPP(): void {
        this.router.navigate(["tpi/exit"]);
    }

    /**
     * Function to route back to Review and Apply page
     */
    backToReview(): void {
        this.router.navigate(["tpi/shop"], { queryParams: { review: true } });
    }

    /**
     * Function to unsubscribe all the subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
