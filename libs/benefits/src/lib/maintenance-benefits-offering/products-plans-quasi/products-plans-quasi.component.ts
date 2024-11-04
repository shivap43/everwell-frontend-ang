import { Component, OnInit, ViewChild, Inject, OnDestroy } from "@angular/core";
import { STEPPER_GLOBAL_OPTIONS } from "@angular/cdk/stepper";
import { ProductsPlansQuasiService } from "./services/products-plans-quasi.service";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { BenefitsOfferingState, OfferingSteps } from "@empowered/ngxs-store";
import { Store, Select } from "@ngxs/store";
import { MonDialogComponent } from "@empowered/ui";
import { AppSettings } from "@empowered/constants";
import { MatDialogRef, MatDialog } from "@angular/material/dialog";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Subject, Observable } from "rxjs";
import { takeUntil, filter, tap } from "rxjs/operators";
import { BenefitOfferingHelperService } from "../../benefit-offering-helper.service";
import { SideNavProductData } from "../../constants/side-nav-product-data.model";

@Component({
    selector: "empowered-products-plans-quasi",
    templateUrl: "./products-plans-quasi.component.html",
    styleUrls: ["./products-plans-quasi.component.scss"],
    providers: [
        {
            provide: STEPPER_GLOBAL_OPTIONS,
            useValue: { displayDefaultIndicatorType: false },
        },
    ],
})
export class ProductsPlansQuasiComponent implements OnInit, OnDestroy {
    step = 0;
    completedStep = 0;
    @ViewChild("progressIndicator") progressIndicator;
    @ViewChild("ulPlansList") ulPlansList;
    @Select(BenefitsOfferingState.getOfferingStepperData) MaintenanceOfferingSteps$: Observable<OfferingSteps>;
    showPlansList = false;
    productList: SideNavProductData[] = [];
    panelModel = [];
    showVasLinks: boolean;
    alertDialogRef: MatDialogRef<MonDialogComponent>;
    stepEvent = "";
    presentProductIndex;
    defaultStepPosition;
    stepperIndex: number;
    planYearChoice: boolean;
    private unsubscribe$ = new Subject<void>();
    productIdToBeNavigated: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.productsPlansQuasi.addProducts",
        "primary.portal.maintenanceBenefitsOffering.productsPlansQuasi.createNewPlanYear",
        "primary.portal.maintenanceBenefitsOffering.productsPlansQuasi.copyPlanYear",
        "primary.portal.maintenanceBenefitsOffering.productsPlansQuasi.products",
        "primary.portal.maintenanceBenefitsOffering.productsPlansQuasi.planYear",
        "primary.portal.maintenanceBenefitsOffering.productsPlansQuasi.plans",
        "primary.portal.maintenanceBenefitsOffering.productsPlansQuasi.coverageDates",
        "primary.portal.maintenanceBenefitsOffering.productsPlansQuasi.pricesAndEligibility",
        "primary.portal.maintenanceBenefitsOffering.productsPlansQuasi.copySettings",
        "primary.portal.maintenanceBenefitsOffering.productsPlansQuasi.setPrices",
        "primary.portal.maintenanceBenefitsOffering.productsPlansQuasi.carrierForms",
        "primary.portal.maintenanceBenefitsOffering.productsPlansQuasi.reviewAndSubmit",
        "primary.portal.maintenanceBenefitsOffering.productsPlansQuasi.managePlans",
        "primary.portal.common.close",
        "primary.portal.benefitsOffering.avaliablity",
    ]);
    productPlansSelected: string[] = [];

    constructor(
        private readonly quasiService: ProductsPlansQuasiService,
        private readonly store: Store,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<ProductsPlansQuasiComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly benefitOfferingHelperService: BenefitOfferingHelperService,
    ) {}

    ngOnInit(): void {
        if (this.data.opensFrom === "products" || this.data.planType === "true") {
            this.step = 1;
        } else if (this.data.planType === "false") {
            this.step = 2;
            this.stepChanged(2);
        }
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.quasiService.planChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((presentProductIndex) => {
            this.presentProductIndex =
                this.showVasLinks && presentProductIndex === this.productList.length ? presentProductIndex - 1 : presentProductIndex;
            this.productPlansSelected.push(this.productList[this.presentProductIndex]?.id);
        });
        this.quasiService.resetQuasiObservableValues();
        this.quasiService.defaultStepPositionChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((currentStep) => {
            this.defaultStepPosition = currentStep;
            this.progressIndicator.linear = false;
            if (this.data.opensFrom === "products" || this.data.planType === "true") {
                this.progressIndicator.selectedIndex = currentStep - 2;
            } else if (this.data.planType === "false") {
                this.progressIndicator.selectedIndex = currentStep - 3;
            } else {
                this.progressIndicator.selectedIndex = currentStep - 1;
            }
            this.progressIndicator.linear = true;
        });

        this.quasiService.planChoiceMade$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            if (this.productList.length && resp && resp.productIndex) {
                this.productList[resp.productIndex].completed = resp.completed;
            }
        });

        this.quasiService.changeProduct$
            .pipe(
                filter((actionFlag) => actionFlag !== undefined && actionFlag !== null && actionFlag === true),
                tap((actionFlag) => {
                    this.changeProduct(this.productIdToBeNavigated);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.quasiService.stepClicked$.pipe(takeUntil(this.unsubscribe$)).subscribe((step) => {
            if (step || step === 0) {
                this.stepEvent = "";
                if (this.progressIndicator) {
                    if (typeof step === "number") {
                        if (this.data.opensFrom === "products" || this.data.planType === "true") {
                            this.progressIndicator.selectedIndex = step - 1;
                        } else if (this.data.planType === "false") {
                            this.progressIndicator.selectedIndex = step - 2;
                        } else {
                            this.progressIndicator.selectedIndex = step;
                        }
                    } else {
                        this.stepEvent = step.state;
                        if (this.data.opensFrom === "products" || this.data.planType === "true") {
                            this.progressIndicator.selectedIndex = step.step - 1;
                        } else if (this.data.planType === "false") {
                            this.progressIndicator.selectedIndex = step.step - 2;
                        } else {
                            this.progressIndicator.selectedIndex = step.step;
                        }
                    }
                }
            }
        });
    }
    onStepChange(event: any): void {
        if (this.data.opensFrom === "products" || this.data.planType === "true") {
            event.previouslySelectedIndex += 1;
            event.selectedIndex += 1;
        } else if (this.data.planType === "false") {
            event.previouslySelectedIndex += 2;
            event.selectedIndex += 2;
        }
        if (event.previouslySelectedIndex === 6 && this.stepEvent === "" && event.previouslySelectedStep.interacted) {
            this.alertModal(event.selectedIndex);
        } else {
            this.stepChanged(event.selectedIndex);
        }
    }
    /**
     * triggers when step is changed
     * @param selectedIndex selected index
     */
    stepChanged(selectedIndex: number): void {
        this.step = selectedIndex;
        if (selectedIndex === 2) {
            if (this.defaultStepPosition <= selectedIndex + 1) {
                this.productPlansSelected = [];
            }
            this.getProductsData();
            if (this.productList.length > 0) {
                this.showPlansList = true;
                this.quasiService.updateSelectedProductId(this.productList[0].id);
            }
        } else if (selectedIndex >= 0 && selectedIndex <= 7) {
            this.showPlansList = false;
        }
    }
    /**
     * This method will execute when we close product-plans quasi modal
     */
    closeModal(): void {
        if (this.progressIndicator.selectedIndex === AppSettings.MAX_LENGTH_5) {
            this.alertModal();
        } else {
            this.quasiService.setQuasiClosedStatus(true);
            this.dialogRef.close();
            this.dialog.closeAll();
        }
    }
    alertModal(stepNumber?: number): void {
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
                this.quasiService.stepClicked$.next(6);
            }
        });
    }
    /**
     * This method will execute when we perform some actions on leave-page confirmation dialog
     * @param flag is the action representing whether the user has clicked on leave-page or is staying on the page
     * @param stepNumber is current step number in quasi modal
     */
    alert(flag: boolean, stepNumber?: number): void {
        if (flag) {
            if (stepNumber) {
                this.stepChanged(stepNumber);
            } else {
                this.quasiService.setQuasiClosedStatus(true);
                this.dialogRef.close();
                this.dialog.closeAll();
            }
        } else if (!flag) {
            this.quasiService.stepClicked$.next(6);
        }
    }
    getProductsData(): any {
        this.productList = [];
        this.planYearChoice = this.store.selectSnapshot(BenefitsOfferingState.GetNewPlanYearChoice);
        if (this.planYearChoice === null && this.data.opensFrom !== "plans") {
            this.panelModel = JSON.parse(JSON.stringify(this.store.selectSnapshot(BenefitsOfferingState.GetUnapprovedPanel)));
        } else {
            this.panelModel = JSON.parse(JSON.stringify(this.store.selectSnapshot(BenefitsOfferingState.GetNewPlanYearPanel)));
        }
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
                } else {
                    if (productData.productChoice.individual && productData.productChoice.group) {
                        this.addIndividualAndGroupLinks(productData, individualCompleted, groupCompleted);
                    } else {
                        this.productList.push({
                            id: productData.product.id,
                            name: productData.product.name,
                            completed: individualCompleted || groupCompleted,
                        });
                    }
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
     * changes product screen based on "this.productIdToBeNavigated" and other conditions
     * @param index - index of the product to be changed
     */
    changeProduct(index: string): void {
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
            this.quasiService.updateSelectedProductId(index);
        }
    }
    /**
     * initiates change product trigger
     * @param productId product Id to be navigated next
     */
    initiateChangeProduct(productId: string): void {
        this.productIdToBeNavigated = productId;
        this.quasiService.executePlanOnNext$.next(this.productIdToBeNavigated);
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
