import { Store, Select } from "@ngxs/store";
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { Subject, Observable } from "rxjs";
import { STEPPER_GLOBAL_OPTIONS } from "@angular/cdk/stepper";
import { AppSettings } from "@empowered/constants";
import { takeUntil, filter, tap } from "rxjs/operators";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MonDialogComponent } from "@empowered/ui";
import { LanguageService } from "@empowered/language";
import { BenefitOfferingHelperService } from "../../benefit-offering-helper.service";
import { BenefitsOfferingState, OfferingSteps, SideNavService, UtilService } from "@empowered/ngxs-store";
import { SideNavProductData } from "../../constants/side-nav-product-data.model";

@Component({
    selector: "empowered-side-nav",
    templateUrl: "./side-nav.component.html",
    styleUrls: ["./side-nav.component.scss"],
    providers: [
        {
            provide: STEPPER_GLOBAL_OPTIONS,
            useValue: { displayDefaultIndicatorType: false },
        },
    ],
})
export class SideNavComponent implements OnInit, OnDestroy {
    @ViewChild("progressIndicator") progressIndicator;
    @ViewChild("ulPlansList") ulPlansList;
    @Select(BenefitsOfferingState.getOfferingStepperData) InitialOfferingSteps$: Observable<OfferingSteps>;
    alertDialogRef: MatDialogRef<MonDialogComponent>;
    productList: SideNavProductData[] = [];
    panelModel = [];
    stepEvent = "";
    showPlansList;
    showVasLinks: boolean;
    presentProductIndex;
    defaultStepPosition;
    stepperIndex: number;
    productIdToBeNavigated: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.sidenav.settings",
        "primary.portal.sidenav.products",
        "primary.portal.sidenav.plans",
        "primary.portal.sidenav.coverageDates",
        "primary.portal.sidenav.pricesEligibility",
        "primary.portal.sidenav.carrierForms",
        "primary.portal.sidenav.reviewSubmit",
        "primary.portal.benefitsOffering.avaliablity",
        "primary.portal.sidenav.completedStepText",
    ]);

    private unsubscribe$ = new Subject<void>();
    initialOfferingSteps: OfferingSteps;
    productPlansSelected: string[] = [];

    constructor(
        private readonly sideNavService: SideNavService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly store: Store,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        private readonly benefitOfferingHelperService: BenefitOfferingHelperService,
    ) {}

    ngOnInit(): void {
        this.InitialOfferingSteps$.pipe(takeUntil(this.unsubscribe$)).subscribe((steps) => {
            this.initialOfferingSteps = steps;
        });
        this.sideNavService.stepClicked$.pipe(takeUntil(this.unsubscribe$)).subscribe((step) => {
            this.stepEvent = "";
            if (this.progressIndicator) {
                if (typeof step === "number") {
                    this.progressIndicator.selectedIndex = step;
                } else {
                    this.stepEvent = step.state;
                    this.progressIndicator.selectedIndex = step.step;
                }
            }
        });

        this.sideNavService.planChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((presentProductIndex) => {
            if (this.showVasLinks && presentProductIndex === this.productList.length) {
                this.presentProductIndex = presentProductIndex - 1;
            } else {
                this.presentProductIndex = presentProductIndex;
            }
            this.productPlansSelected.push(this.productList[this.presentProductIndex]?.id);
        });

        this.sideNavService.defaultStepPositionChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((currentStep) => {
            this.defaultStepPosition = currentStep;
            this.progressIndicator.linear = false;
            this.progressIndicator.selectedIndex = currentStep - 1;
            this.progressIndicator.linear = true;
        });

        this.sideNavService.planChoiceMade$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            if (resp && this.productList.length) {
                this.productList[resp.productIndex].completed = resp.completed;
            }
        });
        this.sideNavService.changeProduct$
            .pipe(
                filter((actionFlag) => actionFlag !== undefined && actionFlag !== null && actionFlag === true),
                tap((actionFlag) => {
                    this.changeProduct();
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    onStepChange(event: any): void {
        this.stepChanged(event.selectedIndex);
    }
    /**
     * triggers when step is changed
     * @param selectedIndex selected index
     */
    stepChanged(selectedIndex: number): void {
        if (selectedIndex !== 2 && selectedIndex >= 0 && selectedIndex <= 6) {
            const stepperData = this.store.selectSnapshot(BenefitsOfferingState.getOfferingStepperData);
            // Add offset to circumvent Prices and eligibility.
            const offset =
                !stepperData.PRICES_ELIGIBILITY &&
                (selectedIndex === stepperData.CARRIER_FORMS || selectedIndex === stepperData.REVIEW_SUBMIT)
                    ? 1
                    : 0;
            this.showPlansList = false;
            this.router.navigate(["./" + (selectedIndex + 1 + offset)], { relativeTo: this.route });
        } else if (selectedIndex === 2) {
            if (this.defaultStepPosition <= selectedIndex + 1) {
                this.productPlansSelected = [];
            }
            this.getProductsData();
            if (this.productList.length > 0) {
                this.showPlansList = true;
                this.router.navigate(["./3", this.productList[0].id], { relativeTo: this.route });
            }
        }
    }

    getProductsData(): any {
        this.productList = [];
        this.panelModel = this.utilService.copy(this.store.selectSnapshot(BenefitsOfferingState.getpanelProducts));
        this.showVasLinks = false;
        let vasCompleted = false;
        this.panelModel.forEach((productData) => {
            if (productData.productChoice && productData.product) {
                let individualCompleted = false;
                let groupCompleted = false;
                if (
                    productData.productChoice.individual &&
                    productData.plans
                        .filter((planData) => planData.planChoice)
                        .filter((planData) => planData.plan.policyOwnershipType.indexOf(AppSettings.INDIVIDUAL) >= 0).length
                ) {
                    individualCompleted = true;
                    if (productData.product.valueAddedService) {
                        vasCompleted = true;
                    }
                }
                if (
                    productData.productChoice.group &&
                    productData.plans
                        .filter((planData) => planData.planChoice)
                        .filter((planData) => planData.plan.policyOwnershipType.indexOf(AppSettings.GROUP) >= 0).length
                ) {
                    groupCompleted = true;
                    if (productData.product.valueAddedService) {
                        vasCompleted = true;
                    }
                }
                if (productData.product.valueAddedService) {
                    this.showVasLinks = true;
                } else if (productData.productChoice.individual && productData.productChoice.group) {
                    this.addIndividualAndGroupLinks(productData, individualCompleted, groupCompleted);
                } else {
                    this.productList.push({
                        id: productData.product.id,
                        name: productData.product.name,
                        completed: individualCompleted || groupCompleted,
                    });
                }
            }
        });
        if (this.showVasLinks) {
            this.productList.push({
                id: AppSettings.HQ,
                name: AppSettings.VAS,
                completed: vasCompleted,
            });
        }
    }

    alertModal(stepNumber: number): void {
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
                    buttonAction: this.alert.bind(this, true, stepNumber),
                },
                primaryButton: {
                    buttonTitle: this.language.fetchPrimaryLanguageValue("primary.portal.common.stayOnPage"),
                    buttonClass: "mon-btn-primary",
                    buttonAction: this.alert.bind(this, false, stepNumber),
                },
            },
        });
        this.alertDialogRef.afterClosed().subscribe((response) => {
            if (response === null || response === undefined) {
                this.sideNavService.stepClicked$.next(this.initialOfferingSteps.REVIEW_SUBMIT);
            }
        });
    }

    alert(flag: boolean, stepNumber: number): void {
        if (flag) {
            this.stepChanged(stepNumber);
        } else if (!flag) {
            this.sideNavService.stepClicked$.next(this.initialOfferingSteps.REVIEW_SUBMIT);
        }
    }

    addIndividualAndGroupLinks(productData: any, individualCompleted: boolean, groupCompleted: boolean): void {
        this.productList.push({
            id: productData.product.id + "i",
            name: productData.product.name + " " + AppSettings.DISPLAY_INDIVIDUAL,
            completed: individualCompleted,
        });
        this.productList.push({
            id: productData.product.id + "g",
            name: productData.product.name + " " + AppSettings.DISPLAY_GROUP,
            completed: groupCompleted,
        });
    }
    /**
     * initiates change product trigger
     * @param product Id product Id to be navigated next
     */
    initiateChangeProduct(productId: string): void {
        this.productIdToBeNavigated = productId;
        this.sideNavService.executePlanOnNext$.next(this.productIdToBeNavigated);
    }
    /**
     * changes product screen based on "this.productIdToBeNavigated" and other conditions
     */
    changeProduct(): void {
        if (
            this.productIdToBeNavigated &&
            this.benefitOfferingHelperService.isChangeProductValid(
                this.productList,
                this.presentProductIndex,
                this.productPlansSelected,
                this.productIdToBeNavigated,
                this.defaultStepPosition,
            )
        ) {
            this.productPlansSelected.push(this.productList[this.presentProductIndex]?.id);
            this.router.navigate(["../offering/3/" + this.productIdToBeNavigated], { relativeTo: this.route });
        }
    }

    ngOnDestroy(): void {
        this.sideNavService.defaultStepPositionChanged$.next(1);
        this.sideNavService.stepClicked$.next(0);
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
