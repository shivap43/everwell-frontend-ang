import { BenefitDollars, PendingActionType } from "@empowered/api";
import { PayFrequency, PayFrequencyObject } from "@empowered/constants";
import { Component, Output, EventEmitter, Input, OnChanges } from "@angular/core";
import { LanguageService } from "@empowered/language";
@Component({
    selector: "empowered-offering-list",
    templateUrl: "./offering-list.component.html",
    styleUrls: ["./offering-list.component.scss"],
})
export class OfferingListComponent implements OnChanges {
    @Input() offeringList: any;
    @Input() isEditRemoveNotAllowed: boolean;
    @Input() isVestedAgent: boolean;
    @Input() payFrequency: string;
    @Input() payFrequencies: PayFrequency[];
    @Output() emitViewAction = new EventEmitter<string>();
    @Output() emitEditAction = new EventEmitter<string>();
    @Output() emitRemoveAction = new EventEmitter<string>();
    MONTHLY = "MONTHLY";
    PendingActionType = PendingActionType;
    dollarValue: string;
    percentageValue: string;
    dollarPrefix = BenefitDollars.DOLLAR;
    percentageSuffix = BenefitDollars.PERCENTAGE;
    amountPercentage = BenefitDollars.PERCENTAGE_AMOUNT;
    amountFlat = BenefitDollars.FLAT_AMOUNT;
    payFrequencyObject: PayFrequencyObject;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.remove",
        "primary.portal.common.edit",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.removed",
    ]);
    pendingAdminApprovalMessage = this.language.fetchPrimaryLanguageValue(
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.pendingAdminApproval",
    );
    removalPendingAdminApprovalMessage = this.language.fetchPrimaryLanguageValue(
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.removalPendingAdminApproval",
    );
    constructor(private readonly language: LanguageService) {}

    /**
     * @function ngOnChanges
     * @description To track changes of view benefit dollars
     * @returns {void}
     * @memberof OfferingListComponent
     */
    ngOnChanges(): void {
        this.payFrequencyObject = {
            payFrequencies: this.payFrequencies,
            pfType: this.payFrequency,
            payrollsPerYear: 0,
        };
        if (this.payFrequencyObject.payFrequencies) {
            const monthlyPayFrequency = this.payFrequencyObject.payFrequencies.find((ele) => ele.frequencyType === this.MONTHLY);
            this.payFrequencyObject.payrollsPerYear = monthlyPayFrequency.payrollsPerYear;
        }
    }

    viewOffering(id: string): void {
        this.emitViewAction.emit(id);
    }

    editOffering(id: string): void {
        this.emitEditAction.emit(id);
    }

    removeOffering(id: string): void {
        this.emitRemoveAction.emit(id);
    }
}
