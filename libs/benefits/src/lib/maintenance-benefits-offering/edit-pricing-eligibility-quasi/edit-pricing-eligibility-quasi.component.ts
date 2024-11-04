import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { MonDialogComponent } from "@empowered/ui";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { ProductsPlansQuasiService } from "../products-plans-quasi/services/products-plans-quasi.service";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-edit-pricing-eligibility-quasi",
    templateUrl: "./edit-pricing-eligibility-quasi.component.html",
    styleUrls: ["./edit-pricing-eligibility-quasi.component.scss"],
})
export class EditPricingEligibilityQuasiComponent implements OnInit, OnDestroy {
    alertDialogRef: MatDialogRef<MonDialogComponent>;
    step = 0;
    completedStep = 0;
    stepEvent = "";
    defaultStepPosition;
    @ViewChild("progressIndicator", { static: true }) progressIndicator;
    private unsubscribe$ = new Subject<void>();

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.editPricingQuasi.planNameCoverageDates",
        "primary.portal.maintenanceBenefitsOffering.editPricingQuasi.editPricesEligibility",
        "primary.portal.maintenanceBenefitsOffering.editPricingQuasi.copySettings",
        "primary.portal.maintenanceBenefitsOffering.editPricingQuasi.effectiveDate",
        "primary.portal.maintenanceBenefitsOffering.editPricingQuasi.setPrices",
        "primary.portal.common.close",
    ]);

    constructor(
        private readonly quasiService: ProductsPlansQuasiService,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
    ) {}

    ngOnInit(): void {
        this.step = 1;
        this.completedStep = 1;

        this.quasiService.defaultStepPositionChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((currentStep) => {
            this.defaultStepPosition = currentStep;
            this.progressIndicator.linear = false;
            this.progressIndicator.selectedIndex = currentStep - 1;
            this.progressIndicator.linear = true;
        });
    }
    // closeModal(): void {
    //     this.alertModal();
    // }
    alertModal(): void {
        this.alertDialogRef = this.dialog.open(MonDialogComponent, {
            hasBackdrop: true,
            width: "700px",
            data: {
                title: "Are you sure you want to leave?",
                content: "Your changes haven't been saved",
                secondaryButton: {
                    buttonTitle: "Cancel",
                    buttonAction: this.alert.bind(this, false),
                },
                primaryButton: {
                    buttonTitle: "Leave without saving",
                    buttonClass: "mon-btn-primary",
                    buttonAction: this.alert.bind(this, true),
                },
            },
        });
    }
    alert(flag: boolean): void {
        if (flag) {
            this.dialog.closeAll();
        }
    }
    onStepChange(event: any): void {
        this.step = event.selectedIndex + 1;
        if (event.previouslySelectedIndex === 4 && this.stepEvent === "" && event.previouslySelectedStep.interacted) {
        } else {
            this.stepChanged(event.selectedIndex);
        }
    }
    stepChanged(selectedIndex: any): void {}
    ngOnDestroy(): void {}
}
