import { Component, OnInit, Input, Output, EventEmitter, OnChanges, ChangeDetectorRef, AfterViewChecked } from "@angular/core";
import { FormControl, FormBuilder } from "@angular/forms";
import { Store } from "@ngxs/store";
import { SetExitPopupStatus } from "@empowered/ngxs-store";
import { LanguageModel } from "@empowered/api";
import { LanguageService, LanguageState } from "@empowered/language";
import { Router } from "@angular/router";
import { TPI, CoverageLevel, PlanOfferingPricing, PlanOfferingPanel } from "@empowered/constants";

@Component({
    selector: "empowered-elimination-period-selection",
    templateUrl: "./elimination-period-selection.component.html",
    styleUrls: ["./elimination-period-selection.component.scss"],
})
export class EliminationPeriodSelectionComponent implements OnInit, OnChanges, AfterViewChecked {
    @Input() isRiderCoverage: boolean;
    @Input() planOfferingObj: PlanOfferingPanel;
    @Input() currentCoverageLevel: PlanOfferingPricing;
    @Input() productOfferingId: number;
    @Output() updateAmount = new EventEmitter<PlanOfferingPricing>();
    isLoading: boolean;
    data: CoverageLevel[];
    pricingData: PlanOfferingPricing[];
    currentCoverage: PlanOfferingPricing;
    isRiderCoverageFlag: boolean;
    coverageSelectInput: FormControl;
    eliminationSelectRadio: FormControl;
    riderCoverage: CoverageLevel;
    langStrings = {};
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    isTpi = false;
    languageStrings = {
        selectOption: this.language.fetchPrimaryLanguageValue("primary.portal.shoppingExperience.selectOption"),
    };

    constructor(
        private readonly store: Store,
        private readonly cd: ChangeDetectorRef,
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly router: Router,
    ) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
        if (this.router.url.includes(TPI.TPI)) {
            this.isTpi = true;
        }
    }
    getLanguageStrings(): void {
        this.langStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.shoppingExperience.eliminationPeriod",
            "primary.portal.shoppingExperience.eleminationPeriodRiderDescription",
        ]);
    }

    ngOnInit(): void {
        this.isLoading = false;
        this.eliminationSelectRadio.setValue("");
        this.isRiderCoverageFlag = false;
        this.getAllRequiredData();
        this.getLanguageStrings();
        if (!this.coverageSelectInput) {
            this.coverageSelectInput.setValue("");
        }
        this.setEliminationValueDropDown(this.currentCoverage);
        const tempdata = Array<any>();
        this.data.forEach((ele4) => {
            if (this.pricingData.filter((x) => x.coverageLevelId === ele4.id).length > 0) {
                tempdata.push(ele4);
            }
        });
        tempdata.sort((a, b) => (a.displayOrder > b.displayOrder ? 1 : -1));
        this.data = tempdata;
    }
    selectCoverage($event: any): void {
        this.currentCoverage = this.pricingData.filter((x) => x.coverageLevelId === $event)[0];
        if (!this.coverageSelectInput) {
            this.coverageSelectInput.setValue("");
        }
        this.setEliminationValueDropDown(this.currentCoverage);
        this.planOfferingObj.selectedPricing = this.currentCoverage;
        this.store.dispatch(new SetExitPopupStatus(true));
        this.updateAmount.emit(this.currentCoverage);
    }
    selectByDefaultCoverageLevel(): void {
        if (!this.currentCoverageLevel) {
            this.currentCoverage = this.pricingData[0];
            this.pricingData.forEach((element) => {
                if (this.currentCoverage.memberCost > element.memberCost) {
                    this.currentCoverage = element;
                }
            });
            this.updateAmount.emit(this.currentCoverage);
        } else {
            this.currentCoverage = this.currentCoverageLevel;
        }
    }
    getCoverageAmountById(id: number): number {
        if (this.pricingData.length) {
            const data = this.pricingData.filter((x) => x.coverageLevelId === id);
            if (data.length) {
                return data.reduce((x1: PlanOfferingPricing, y1: PlanOfferingPricing) => {
                    if (x1.memberCost > y1.memberCost) {
                        return y1;
                    }
                    return x1;
                }).memberCost;
            }
        }
        return 0;
    }
    getPlanOfferingPricingById(id: number): PlanOfferingPricing {
        return this.pricingData.filter((x) => x.coverageLevelId === id).pop();
    }
    getAllRequiredData(): void {
        if (this.planOfferingObj.coverageLevel) {
            this.planOfferingObj.coverageLevel.sort((a, b) => (a.displayOrder > b.displayOrder ? 1 : -1));
        }
        this.data = this.planOfferingObj.coverageLevel;
        this.pricingData = this.planOfferingObj.planPricing;
        if (!this.planOfferingObj.selectedPricing) {
            this.selectByDefaultCoverageLevel();
        } else {
            this.currentCoverage = this.planOfferingObj.selectedPricing;
        }
    }
    ngOnChanges(changes: import("@angular/core").SimpleChanges): void {
        if (!this.planOfferingObj.selectedPricing) {
            this.selectByDefaultCoverageLevel();
        }
        if (changes.currentCoverageLevel && changes.currentCoverageLevel.currentValue) {
            this.currentCoverage = changes.currentCoverageLevel.currentValue;
            if (!this.coverageSelectInput) {
                this.coverageSelectInput.setValue("");
            }
            this.setEliminationValueDropDown(this.currentCoverage);
        }
    }
    ngAfterViewChecked(): void {
        this.cd.detectChanges();
    }
    setEliminationValueDropDown(coverage: PlanOfferingPricing): void {
        if (this.currentCoverage) {
            this.coverageSelectInput.patchValue(this.currentCoverage.coverageLevelId);
        }
    }
    trimDays(eliminationName: string): string {
        return eliminationName.toLowerCase().replace("days", "");
    }
    isSingleRiderCoverage(): boolean {
        return this.data.filter((x) => x.id !== 2).length > 1;
    }
}
