import {
    Component,
    OnInit,
    Input,
    OnChanges,
    Output,
    EventEmitter,
    SimpleChanges,
    AfterViewChecked,
    ChangeDetectorRef,
} from "@angular/core";
import { Store } from "@ngxs/store";
import { PlanOfferingPricing, PlanOfferingPanel } from "@empowered/constants";
import { FormControl, FormBuilder, FormGroup } from "@angular/forms";
import { SetExitPopupStatus } from "@empowered/ngxs-store";
import { LanguageModel } from "@empowered/api";
import { LanguageService, LanguageState } from "@empowered/language";

@Component({
    selector: "empowered-benefit-amount-selection",
    templateUrl: "./benefit-amount-selection.component.html",
    styleUrls: ["./benefit-amount-selection.component.scss"],
})
export class BenefitAmountSelectionComponent implements OnInit, OnChanges, AfterViewChecked {
    @Input() isRiderBenefit: boolean;
    @Input() planOfferingObj: PlanOfferingPanel;
    @Input() currentCoverageLevel: PlanOfferingPricing;
    @Output() updateAmount = new EventEmitter<PlanOfferingPricing>();
    @Input() productOfferingId: number;
    selectedBenefitAmount: PlanOfferingPricing;
    benefitAmtSelect: FormControl;
    benefitSelectRadio: FormControl;
    benefitData: PlanOfferingPricing[];
    isLoading: boolean;
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    isSingleCoverage: boolean;
    languageStrings = {
        selectOption: this.language.fetchPrimaryLanguageValue("primary.portal.shoppingExperience.selectOption"),
    };
    benefitForm: FormGroup = this.fb.group({
        benefitAmtSelect: [""],
    });

    constructor(
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly cd: ChangeDetectorRef,
    ) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
        this.benefitAmtSelect.setValue("");
    }

    ngOnInit(): void {
        this.isSingleCoverage = false;
        this.benefitData = new Array<PlanOfferingPricing>();
        this.getRequiredData();
        if (this.currentCoverageLevel) {
            this.benefitForm.get("benefitAmtSelect").setValue(this.currentCoverageLevel.benefitAmount);
        }
        this.isSingleCoverageLevel();
    }
    getSelectedBenefitAmount($event: any): void {
        this.benefitData.forEach((b) => {
            if (b.benefitAmount === +$event) {
                this.currentCoverageLevel = b;
            }
        });
        this.updateAmount.emit(this.currentCoverageLevel);
    }
    selectByDefaultBenefitAmount(): void {
        this.currentCoverageLevel = this.benefitData[0];
        this.benefitData.forEach((element) => {
            if (this.currentCoverageLevel.memberCost > element.memberCost) {
                this.currentCoverageLevel = element;
            }
        });
        this.updateAmount.emit(this.currentCoverageLevel);
        this.store.dispatch(new SetExitPopupStatus(true));
    }
    getRequiredData(): void {
        const data = this.planOfferingObj.planPricing;
        if (!this.currentCoverageLevel) {
            this.currentCoverageLevel = data[0];
        }
        this.benefitData = [];
        data.forEach((element) => {
            if (element.coverageLevelId === this.currentCoverageLevel.coverageLevelId) {
                this.benefitData.push(element);
            }
        });
        if (!this.planOfferingObj.selectedPricing) {
            this.selectByDefaultBenefitAmount();
        } else {
            this.currentCoverageLevel = this.planOfferingObj.selectedPricing;
        }
    }
    getBenefitCost(bAmount: PlanOfferingPricing): string {
        if (bAmount) {
            return (
                bAmount.memberCost -
                this.planOfferingObj.planPricing
                    .filter((x) => x.coverageLevelId === this.planOfferingObj.selectedPricing.coverageLevelId)
                    .reduce((obj1: PlanOfferingPricing, obj2: PlanOfferingPricing) => (obj1.memberCost > obj2.memberCost ? obj2 : obj1))
                    .memberCost
            ).toFixed(2);
        }
        return (
            this.currentCoverageLevel.memberCost -
            this.planOfferingObj.planPricing
                .filter((x) => x.coverageLevelId === this.planOfferingObj.selectedPricing.coverageLevelId)
                .reduce((obj1: PlanOfferingPricing, obj2: PlanOfferingPricing) => (obj1.memberCost > obj2.memberCost ? obj2 : obj1))
                .memberCost
        ).toFixed(2);
    }
    isSingleCoverageLevel(): void {
        this.isSingleCoverage =
            Array.from(new Set(this.planOfferingObj.coverageLevel.filter((y) => y.name !== "Declined").map((x) => x.id))).length === 1;
    }
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.planOfferingObj) {
            this.planOfferingObj = changes.planOfferingObj.currentValue;
        }
        if (changes.currentCoverageLevel && changes.currentCoverageLevel.currentValue) {
            this.currentCoverageLevel = changes.currentCoverageLevel.currentValue;
            const data = this.planOfferingObj.planPricing;
            this.benefitData = [];
            data.forEach((element1) => {
                if (element1.coverageLevelId === this.currentCoverageLevel.coverageLevelId) {
                    this.benefitData.push(element1);
                }
            });
            if (this.benefitForm && this.benefitForm.get("benefitAmtSelect")) {
                this.benefitForm.get("benefitAmtSelect").setValue(this.currentCoverageLevel.benefitAmount);
            }
        } else {
            this.getRequiredData();
        }
    }
    getCoverageLevelCost(coverageLevel: any): number {
        let cost = 0;
        if (this.planOfferingObj && this.planOfferingObj.planPricing && this.planOfferingObj.planPricing.length) {
            if (!coverageLevel) {
                coverageLevel = this.currentCoverageLevel ? this.currentCoverageLevel : this.planOfferingObj.planPricing[0];
            }
            const temp = this.planOfferingObj.planPricing.find(
                (x) => x.coverageLevelId === coverageLevel.coverageLevelId && x.benefitAmount === coverageLevel.benefitAmount,
            );
            if (temp) {
                cost = temp.memberCost;
            }
        }
        return cost;
    }

    ngAfterViewChecked(): void {
        this.cd.detectChanges();
    }
}
