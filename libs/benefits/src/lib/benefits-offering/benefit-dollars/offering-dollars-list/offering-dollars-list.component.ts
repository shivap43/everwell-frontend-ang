import { OnChanges, OnDestroy } from "@angular/core";
import { Component, Input, Output, EventEmitter } from "@angular/core";
import { BenefitDollars, FlexDollar, PayFrequencyObject } from "@empowered/api";
import { PayFrequency } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

const MONTHLY = "MONTHLY";
@Component({
    selector: "empowered-offering-dollars-list",
    templateUrl: "./offering-dollars-list.component.html",
    styleUrls: ["./offering-dollars-list.component.scss"],
})
export class OfferingDollarsListComponent implements OnChanges, OnDestroy {
    @Input() isApprovalPending: boolean;
    @Input() payFrequency: string;
    @Input() payFrequencies: PayFrequency[];
    @Output() emitViewAction = new EventEmitter<string>();
    @Output() emitEditAction = new EventEmitter<string>();
    @Output() emitRemoveAction = new EventEmitter<string>();
    @Input() offeringList: EventEmitter<FlexDollar[]>;
    dollarValue: string;
    percentageValue: string;
    dollarPrefix = BenefitDollars.DOLLAR;
    percentageSuffix = BenefitDollars.PERCENTAGE;
    amountPercentage = BenefitDollars.PERCENTAGE_AMOUNT;
    amountFlat = BenefitDollars.FLAT_AMOUNT;
    payFrequencyObject: PayFrequencyObject;
    benefitDollarOffering: FlexDollar[];
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.remove",
        "primary.portal.common.edit",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.pendingAdminApproval",
    ]);
    constructor(private readonly language: LanguageService) {}
    /**
     * @function ngOnChanges
     * @description To track changes of view benefit dollars
     */
    ngOnChanges(): void {
        this.payFrequencyObject = {
            payFrequencies: this.payFrequencies,
            pfType: this.payFrequency,
            payrollsPerYear: 0,
        };
        if (this.payFrequencyObject.payFrequencies) {
            const monthlyPayFrequency = this.payFrequencyObject.payFrequencies.find((ele) => ele.frequencyType === MONTHLY);
            this.payFrequencyObject.payrollsPerYear = monthlyPayFrequency.payrollsPerYear;
        }
        this.offeringList.pipe(takeUntil(this.unsubscribe$)).subscribe((offeringDetails) => {
            this.benefitDollarOffering = offeringDetails;
        });
    }
    /**
     * @function viewOffering
     * @description emit selected benefit dollar details
     * @param id benefit dollar id
     */
    viewOffering(id: string): void {
        this.emitViewAction.emit(id);
    }
    /**
     * @function editOffering
     * @description emit selected benefit dollar details for edit
     * @param id benefit dollar id
     */
    editOffering(id: string): void {
        this.emitEditAction.emit(id);
    }
    /**
     * @function viewOffering
     * @description emit selected benefit dollar details for remove
     * @param id benefit dollar id
     */
    removeOffering(id: string): void {
        this.emitRemoveAction.emit(id);
    }
    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
