import { Component, OnInit, Inject } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { UtilService } from "@empowered/ngxs-store";
import { moveItemInArray, CdkDragDrop } from "@angular/cdk/drag-drop";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PlanOrderElement } from "@empowered/constants";
import { Subject } from "rxjs";
import { EmpoweredModalService } from "@empowered/common-services";

@Component({
    selector: "empowered-edit-plan-order",
    templateUrl: "./edit-plan-order.component.html",
    styleUrls: ["./edit-plan-order.component.scss"],
})
export class EditPlanOrderComponent implements OnInit {
    languageStrings: Record<string, string>;
    plans: PlanOrderElement[];

    constructor(
        @Inject(MAT_DIALOG_DATA) readonly planOrder: PlanOrderElement[],
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        private readonly dialogRef: MatDialogRef<EditPlanOrderComponent>,
    ) {}

    /**
     * ng life cycle hook
     */
    ngOnInit(): void {
        this.initializeLanguageStrings();
        this.plans = this.utilService.copy(this.planOrder);
    }

    /**
     * function to fetch primary languages
     */
    initializeLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.rateSheets.editPlanOrder",
            "primary.portal.rateSheets.dragAndDrop",
            "primary.portal.rateSheets.savePlanOrder",
        ]);
    }

    /**
     * function to handle drag and drop action
     * updates plans array element order
     */
    onDrop(event: CdkDragDrop<string[]>): void {
        moveItemInArray(this.plans, event.previousIndex, event.currentIndex);
    }

    /**
     * This method will be called on click of save button
     * Passes updated plans array to CreateRateSheet component
     */
    savePlanOrder(): void {
        this.dialogRef.close(this.plans);
    }
}
