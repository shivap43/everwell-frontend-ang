import { Component, OnInit, Inject, ChangeDetectorRef, AfterViewChecked } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MigratePricing } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";
import { BenefitsOfferingState } from "@empowered/ngxs-store";

interface DialogData {
    employeeCategoryCombinations: any[];
    newEmployeeCategoryCombinations: any[];
    action: string;
    choiceId: string;
}

const action = {
    UPDATE: "update",
    REMOVED: "removed",
    EMPTY: "empty",
};

@Component({
    selector: "empowered-pricing-popup",
    templateUrl: "./pricing-popup.component.html",
    styleUrls: ["./pricing-popup.component.scss"],
})
export class PricingPopupComponent implements OnInit, AfterViewChecked {
    priceCategoryForm: FormGroup;
    newCombinations = [];
    priviousCombinations = [];
    updatedCombinations = [];
    migratedCombinationArray: MigratePricing[] = [];
    title: string;
    subtitle: string;
    actionStatus: string;
    MpGroup: number;
    planchoiceId: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.pricingPopup.title",
        "primary.portal.pricingPopup.instructions",
        "primary.portal.pricingPopup.previouslyPriced",
        "primary.portal.pricingPopup.newCategories",
        "primary.portal.pricingPopup.undoChanges",
        "primary.portal.pricingPopup.saveChanges",
        "primary.portal.pricingPopup.copyPrices",
        "primary.portal.pricingPopup.autoMapped",
        "primary.portal.pricingPopup.makeAdjustments",
        "primary.portal.pricingPopup.choosePrice",
        "primary.portal.pricingPopup.stillMakeEdits",
        "primary.portal.pricingPopup.selectYourPrice",
        "primary.portal.pricingPopup.youCanChange",
        "primary.portal.common.cancel",
        "primary.portal.common.close",
    ]);
    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<PricingPopupComponent>,
        @Inject(MAT_DIALOG_DATA) private readonly data: DialogData,
        private readonly store: Store,
        private readonly cdRef: ChangeDetectorRef,
    ) {
        this.MpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.planchoiceId = this.data.choiceId;
        this.getUpdatedCombinationData();
    }

    ngOnInit(): void {
        if (this.data && this.data.action === action.UPDATE) {
            this.actionStatus = action.UPDATE;
            this.title = this.languageStrings["primary.portal.pricingPopup.title"];
            this.subtitle =
                this.languageStrings["primary.portal.pricingPopup.autoMapped"] +
                this.languageStrings["primary.portal.pricingPopup.makeAdjustments"];
        } else if (this.data && this.data.action === action.REMOVED) {
            this.actionStatus = action.REMOVED;
            this.title = this.languageStrings["primary.portal.pricingPopup.choosePrice"];
            this.subtitle = this.languageStrings["primary.portal.pricingPopup.stillMakeEdits"];
        } else if (this.data && this.data.action === action.EMPTY) {
            this.actionStatus = action.EMPTY;
            this.title = this.languageStrings["primary.portal.pricingPopup.selectYourPrice"];
            this.subtitle = this.languageStrings["primary.portal.pricingPopup.youCanChange"];
        }
    }

    ngAfterViewChecked(): void {
        this.cdRef.detectChanges();
    }

    getUpdatedCombinationData(): void {
        if (this.data.newEmployeeCategoryCombinations) {
            this.newCombinations = this.data.newEmployeeCategoryCombinations.map((newCombination) => {
                const regionName = newCombination.regions[0] && newCombination.regions[0].name ? `${newCombination.regions[0].name}` : "";
                const className = newCombination.classes[0] && newCombination.classes[0].name ? `${newCombination.classes[0].name}` : "";
                return {
                    id: newCombination.id,
                    name: `${regionName}${regionName.length && className.length ? "," : ""}${className}`,
                };
            });
        }
        if (this.data.employeeCategoryCombinations) {
            const tempPrevComb = this.data.employeeCategoryCombinations.filter((prevComb) => prevComb.priceOrRates.length);
            this.priviousCombinations = tempPrevComb.map((prevCombination) => {
                const prevRegionName =
                    prevCombination.regions[0] && prevCombination.regions[0].name ? `${prevCombination.regions[0].name}` : "";
                const prevClassName =
                    prevCombination.classes[0] && prevCombination.classes[0].name ? `${prevCombination.classes[0].name}` : "";
                return {
                    id: prevCombination.id,
                    name: `${prevRegionName}${prevRegionName.length && prevClassName.length ? "," : ""}${prevClassName}`,
                };
            });
        }

        this.priceCategoryForm = this.createGroup();
    }

    createGroup = () => {
        const group = this.formBuilder.group({});
        this.newCombinations.forEach((control, index) => {
            group.addControl(`prevCombination${index}`, this.formBuilder.control("", [Validators.required]));
            const updateCombinationObj = {
                previousCombinationId: this.mapDefaultPossibleCombination(control),
                newlyCreatedCombinationId: control.id,
            };
            this.migratedCombinationArray.push(updateCombinationObj);
            group.get("prevCombination" + index).setValue(this.mapDefaultPossibleCombination(control));
        });
        return group;
    };
    mapDefaultPossibleCombination(newCombination: any): number {
        const prevMatchCombination = this.priviousCombinations.filter(
            (prevComb) =>
                prevComb.name.split(", ")[0] === newCombination.name.split(", ")[0] ||
                prevComb.name.split(", ")[1] === newCombination.name.split(", ")[1],
        )[0];
        return prevMatchCombination && prevMatchCombination.id;
    }

    updateCombinations(updatedCombination: any, rowIndex: number): void {
        const index = this.migratedCombinationArray.findIndex((x) => x.newlyCreatedCombinationId === updatedCombination.id);
        const prevCombinationID = this.priceCategoryForm.controls[`prevCombination${rowIndex}`].value;
        this.migratedCombinationArray[index].previousCombinationId = prevCombinationID;
    }

    onSubmit(performAction: string): void {
        if (this.priceCategoryForm.valid) {
            const updateCombinationObj = {
                action: performAction,
                updatedCombinations: this.migratedCombinationArray,
            };
            this.dialogRef.close(updateCombinationObj);
        }
    }

    onCancelClick(cancelAction: string): void {
        this.dialogRef.close({ cancelAction: cancelAction });
    }
}
