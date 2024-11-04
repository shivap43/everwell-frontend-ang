import { EnrollmentState, AppFlowService, StaticUtilService } from "@empowered/ngxs-store";
import { Component, OnInit, Input, OnChanges, OnDestroy } from "@angular/core";
import { Store } from "@ngxs/store";
import { CoreService } from "@empowered/api";
import { Subject } from "rxjs";
import { LanguageService } from "@empowered/language";
import { takeUntil } from "rxjs/operators";
import {
    BasePlanApplicationPanel,
    RiderApplicationPanel,
    StepData,
    RiderDocument,
    StepType,
    ConfigName,
    ClientErrorResponseCode,
} from "@empowered/constants";
import { HttpErrorResponse } from "@angular/common/http";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
    selector: "empowered-riders",
    templateUrl: "./riders.component.html",
    styleUrls: ["./riders.component.scss"],
})
export class RidersComponent implements OnInit, OnChanges, OnDestroy {
    @Input() planObject: StepData;
    @Input() currentSectionIndex: number;
    @Input() riderSectionBlur: boolean;
    planId: number;
    riderApplications: RiderApplicationPanel[];
    stepType = StepType;
    stepCounter = 0;
    mpGroup;
    memberId;
    showSpinner = false;
    riderSequenceId: number;
    currentActiveRiderIndex;
    currentActiveRiderSectionIndex;
    currentActiveRiderStepIndex;
    riderSectionActive = false;
    riderSectionBlurFlag: boolean;
    sectionToScroll: string;
    pdfLinks: { planId: number; links: { url: string; pdfName: string }[] }[] = [];
    hasAflacAlways = false;
    hasEBSBilling = false;
    fromDirect = false;
    groupedDocs: RiderDocument[][] = [];
    protected hasError: boolean;
    protected errorMessage: string;
    private readonly unsubscribe$ = new Subject<void>();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.riders.rider",
        "primary.portal.applicationFlow.riders.noridersPlan",
        "primary.portal.applicationFlow.planOption.next",
        "primary.portal.applicationFlow.planOption.nextAflacAlways",
        "primary.portal.applicationFlow.planOption.nextBilling",
        "primary.portal.applicationFlow.planOption.nextApplications",
    ]);
    readonly COVERAGE_SELECTION_1 = "6 Months/0 Days";
    readonly COVERAGE_SELECTION_2 = "6 Months/7 Days";
    readonly COVERAGE_SELECTION_3 = "12 Months/0 Days";
    readonly COVERAGE_SELECTION_4 = "12 Months/7 Days";
    readonly DEFAULT_COVERAGE_SELECTION = "No Rider";
    readonly COVERAGE_SELECTION = "Coverage selection";
    readonly ADD_TO_PROFILE = "Add to profile";
    readonly MISSING_SALARY = "Salary is required for enrollment.";
    readonly SALARY_REQUIRED = "Salary required";

    constructor(
        private readonly appFlowService: AppFlowService,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly coreService: CoreService,
        private readonly staticUtilService: StaticUtilService,
        private readonly router: Router,
        private readonly activeRoute: ActivatedRoute,
    ) {}

    /**
     * Angular lifecycle hook to initialize component
     * Used to get the riders details and also get the footer steps details in TPI App flow
     * @returns void
     */
    ngOnInit(): void {
        this.riderSectionBlurFlag = this.riderSectionBlur;
        this.checkAflacAlways();
        this.appFlowService.ridersScroll$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            this.currentActiveRiderIndex = data.riderIndex;
            this.currentActiveRiderSectionIndex = data.sectionIndex;
            this.currentActiveRiderStepIndex = data.stepIndex;
            this.sectionToScroll = data.section;
            this.getLastStepForFooter(data.riderIndex, data.sectionIndex, data.stepIndex);
        });
        this.appFlowService.updateRiderActiveStepDetails$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            this.currentActiveRiderIndex = data.currentRiderIndex;
            this.currentActiveRiderSectionIndex = data.currentSectionIndex;
            this.currentActiveRiderStepIndex = data.currentStepIndex;
            this.riderSectionBlurFlag = true;
            this.riderSectionActive = true;
            if (this.planObject.reinstate) {
                this.appFlowService.updateReinstateActiveStepDetails$.next({
                    currentSectionIndex: this.planObject.currentSection.sectionId,
                    currentStepIndex: this.planObject.currentStep,
                });
            } else {
                this.appFlowService.updateActiveStepDetails$.next({
                    currentSectionIndex: this.planObject.currentSection.sectionId,
                    currentStepIndex: this.planObject.currentStep,
                    planObject: this.planObject,
                });
            }
        });
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        this.planId = this.planObject.application.planId;
        this.currentActiveRiderIndex = 0;
        this.currentActiveRiderSectionIndex = 0;
        this.currentActiveRiderStepIndex = 0;
        this.riderSequenceId = this.planObject.currentSection.sectionId;
        this.getRiderDocuments();
        this.initializeDatafromStore();
        this.getLastStepForFooter(0, 0, 0);

        this.appFlowService.stepChanged$.next({
            planObject: this.mapData(0, 0, 0),
            sectionIndex: this.planObject.currentSection.sectionId,
            stepIndex: -1,
        });
        const riders = this.planObject.application.riders;
        if (riders && riders.length) {
            this.setCurrentActiveRiderIndex();
        }

        // Fetch the config to get the details for min and max age allowed for child riders
        this.staticUtilService
            .fetchConfigs(
                [ConfigName.CHILD_MIN_AGE_ALLOWED_FOR_LIFE_IN_DAYS, ConfigName.CHILD_MAX_AGE_ALLOWED_FOR_LIFE_IN_YEARS],
                this.mpGroup,
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => {
                this.appFlowService.emitAgeLimitForChild({
                    minAge: +data.find((config) => config.name === ConfigName.CHILD_MIN_AGE_ALLOWED_FOR_LIFE_IN_DAYS).value.split(",")[0],
                    maxAge: +data.find((config) => config.name === ConfigName.CHILD_MAX_AGE_ALLOWED_FOR_LIFE_IN_YEARS).value.split(",")[0],
                });
            });
    }

    /**
     * Method to check next step
     */
    checkAflacAlways(): void {
        this.fromDirect = !!this.store.selectSnapshot(EnrollmentState.GetDirectPayment).length;
        this.hasAflacAlways = !!this.store.selectSnapshot(EnrollmentState.GetAflacAlways)?.length;
        this.hasEBSBilling = this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
    }
    ngOnChanges(): void {
        if (this.currentSectionIndex === this.planObject.currentSection.sectionId) {
            this.riderSectionActive = true;
        }
    }
    initializeDatafromStore(): void {
        this.riderApplications = this.planObject.application.riders ? this.planObject.application.riders : [];
    }
    /**
     * onBack() : method to perform action on click of back button.
     */
    onBack(): void {
        this.appFlowService.planChanged$.next({
            nextClicked: false,
            discard: false,
        });
    }

    /**
     * set current active rider index.
     * @returns void
     */
    setCurrentActiveRiderIndex(): void {
        this.currentActiveRiderIndex = this.planObject.application.riders.findIndex((rider) =>
            rider.appData.sections.some((section) => section.showSection),
        );
    }

    onNext(): void {
        this.appFlowService.onNextClick(this.planObject, this.planObject.currentStep, this.planObject.currentSection.title);
    }
    mapData(riderIndex: number, sectionIndex: number, stepIndex: number): StepData {
        return {
            index: `${riderIndex}${sectionIndex}${stepIndex}`,
            application: this.riderApplications[riderIndex],
            currentSection: this.riderApplications[riderIndex].appData.sections[sectionIndex],
            currentStep: stepIndex,
            steps: this.riderApplications[riderIndex].appData.sections[sectionIndex].steps[stepIndex].step,
            rider: {
                riderIndex: riderIndex,
                riderSectionIndex: sectionIndex,
                riderStepIndex: stepIndex,
                riderSequenceId: this.riderSequenceId,
            },
            lastStep:
                this.planObject.lastStep &&
                riderIndex === this.riderApplications.length - 1 &&
                (sectionIndex === this.riderApplications[riderIndex].appData.sections.length - 1
                    ? Boolean(this.riderApplications[riderIndex].appData.sections[sectionIndex].steps.length - 1 === stepIndex)
                    : false),
            basePlanId: this.planObject.basePlanId,
            nextProduct: this.planObject.nextProduct,
        };
    }
    getRiderStepId(riderIndex: number, sectionIndex: number, stepIndex: number): string {
        return `section_${this.riderSequenceId}_riders_${riderIndex}_${sectionIndex}_${stepIndex}`;
    }

    /**
     * @description: Function to call document API and to arrange the document links as per the riders
     */
    getRiderDocuments(): void {
        if (this.planObject.application.riders && this.planObject.application.riders.length > 0) {
            const planIds: number[] = [];
            this.planObject.application.riders.forEach((rider) => {
                planIds.push(rider.appData.planId);
            });
            this.coreService
                .getPlanDocuments(planIds, this.planObject.application.cartData.enrollmentState, this.mpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((planDocuments) => {
                    if (planDocuments.length > 0) {
                        planIds.forEach((id) => {
                            this.groupedDocs.push(this.getSameIdDocumets(planDocuments, id));
                        });
                        planDocuments.forEach((document) => {
                            this.groupedDocs.forEach((doc) => {
                                const details: { url: string; pdfName: string }[] = doc
                                    .filter((eachDoc: RiderDocument) => eachDoc.planId === document.planId)
                                    .map((res) => ({
                                        pdfName: res.name,
                                        url: res.location,
                                    }));
                                if (details.length && !this.pdfLinks.includes({ links: details, planId: document.planId })) {
                                    this.pdfLinks.push({
                                        links: details,
                                        planId: document.planId,
                                    });
                                }
                            });
                        });
                    }
                });
        }
    }

    /**
     * @description: Function to map the documents to the specific riders
     * @param planDocuments : All the plan Documents
     * @param id: The specific rider ID
     * @returns: it returns the arranged document under the specific rider
     */
    getSameIdDocumets(planDocuments: RiderDocument[], id: number): RiderDocument[] {
        return planDocuments.filter((document) => document.planId === id);
    }

    updateIndex(): void {
        this.currentActiveRiderIndex = this.planObject.application.riders.length - 1;
        this.currentActiveRiderSectionIndex = this.planObject.application.riders[this.currentActiveRiderIndex].appData.sections.length - 1;
        this.currentActiveRiderStepIndex =
            this.planObject.application.riders[this.currentActiveRiderIndex].appData.sections[this.currentActiveRiderSectionIndex].steps
                .length - 1;
    }
    openPdf(location: string): void {
        window.open(location, "_blank");
    }

    checkFlagToRenderRider(riderApplication: BasePlanApplicationPanel): boolean {
        let flagToReturn = false;
        for (const section of riderApplication.appData.sections) {
            if (section.showSection === true) {
                flagToReturn = true;
                break;
            }
        }
        return flagToReturn;
    }

    /**
     * To get the last step of the application for TPI footer
     * @param riderIndex Index of rider
     * @param sectionIndex Index of section
     * @param stepIndex Index of step
     */
    getLastStepForFooter(riderIndex: number, sectionIndex: number, stepIndex: number): void {
        const dataValue: StepData = this.mapData(riderIndex, sectionIndex, stepIndex);
        if (dataValue.lastStep) {
            const productName = this.appFlowService.onNextTPIButton(
                this.planObject.lastStep,
                this.planObject.nextProduct,
                this.hasAflacAlways,
                this.fromDirect,
                this.hasEBSBilling,
            );
            this.appFlowService.showNextProductFooter$.next({ nextClick: true, data: productName });
        } else {
            this.appFlowService.showNextProductFooter$.next({ nextClick: false, data: null });
        }
    }
    /**
     * unsubscribes/ cleans up before component is destroyed
     */
    ngOnDestroy(): void {
        this.hasError = false;
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Displays an info alert
     * @param errorResp - error log from API resp
     */

    handleError(errorResp: HttpErrorResponse) {
        if (errorResp.status === ClientErrorResponseCode.RESP_400 && errorResp.error.message === this.SALARY_REQUIRED) {
            this.hasError = true;
            this.errorMessage = this.MISSING_SALARY;
        }
    }

    /**
     * Handles navigate to profile/work tab
     * to include salary
     */

    routeToProfile() {
        this.router.navigate(["../../../../memberadd"], {
            relativeTo: this.activeRoute,
            queryParams: { tabId: 1 },
        });
    }
}
