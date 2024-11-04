import { Component, Input, OnChanges, OnDestroy } from "@angular/core";
import { PlanOfferingPanel, ProductOfferingPanel } from "@empowered/constants";
import { EmpoweredModalService } from "@empowered/common-services";
import { LanguageService } from "@empowered/language";
import { LeaveConfirmationDialogComponent } from "./leave-confirmation-dialog/leave-confirmation-dialog.component";
import { Subscription } from "rxjs";

@Component({
    selector: "empowered-aflac-pass-product",
    templateUrl: "./aflac-pass-product.component.html",
    styleUrls: ["./aflac-pass-product.component.scss"],
})
export class AflacPassProductComponent implements OnChanges, OnDestroy {
    @Input() productOffering: ProductOfferingPanel;
    productName: string;
    subscriptions: Subscription[] = [];
    isPlanExpanded: boolean;
    DEFAULT_PANEL_COLOR = "#c6c6c6";
    // Fetch required language strings and stored in string array
    languageStrings = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.shoppingExperience.selectplan",
        "primary.portal.shoppingExperience.visitsite",
    ]);

    constructor(private readonly languageService: LanguageService, private readonly empoweredModalService: EmpoweredModalService) {}

    /*
        Component Lifecycle hook
        OnChanges
        Setting the product name received from the Input decorator
    */
    ngOnChanges(): void {
        this.productName = this.productOffering.product.name;
    }

    /**
     * Method called on click of Visit site
     * Opens Leave Confirmation modal
     * On close of dialog:
     *  Continue clicked: "true" is received in response and new tab is opened which opens AflacPass website
     * Cancel clicked: "undefined" recievd in response. No action required.
     * @param planOffering of type PlanOfferingPanel.
     * Following properties of planOffering used:
     *  1. linkText: Button name to display
     *  2. link: contains AflacPass site link
     */
    openConfirmationModal(planOffering: PlanOfferingPanel): void {
        const dialogRef = this.empoweredModalService.openDialog(LeaveConfirmationDialogComponent, {
            data: {
                buttonTitle: planOffering["linkText"],
            },
        });
        // Push into subscription, so we can unsubscribe on component destruction
        this.subscriptions.push(
            dialogRef.afterClosed().subscribe((res) => {
                if (res) {
                    window.open(planOffering["link"]);
                }
            }),
        );
    }

    /**
     * setPlanExpanded: method to set card expansion property
     * @param expanded: boolean
     */
    setPlanExpanded(expanded: boolean): void {
        this.isPlanExpanded = expanded;
    }

    /**
     * Component Lifecycle hook
     * OnDestroy
     * called when component is destroyed
     * Unsubscribe all subscriptions during component destruction
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((x) => x.unsubscribe());
    }
}
