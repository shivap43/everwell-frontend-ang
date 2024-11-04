import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";

interface DialogData {
    productName?: string;
    empName?: string;
    isDualPlanYear?: boolean;
    planEdit?: boolean;
    replacePlan?: boolean;
    planName?: string;
}
@Component({
    selector: "empowered-replace-plan-dialog",
    templateUrl: "./replace-plan-dialog.component.html",
    styleUrls: ["./replace-plan-dialog.component.scss"],
})
export class ReplacePlanDialogComponent implements OnInit {
    employeeName: string;
    productName: string;
    languageStrings = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.common.close",
        "primary.portal.common.cancel",
        "primary.portal.common.replace",
        "primary.portal.shoppingCart.addReplace",
        "primary.portal.shoppingCart.planSourceMessage",
        "primary.portal.replacingPlan.addAndReplace",
        "primary.portal.replacingPlan.planSettings",
        "primary.portal.replacingPlan.previousSelection",
        "primary.portal.replacingPlan.replacePreviousSelection",
        "primary.portal.replacingPlan.replacePlanSettings",
    ]);

    constructor(
        private readonly dialogRef: MatDialogRef<ReplacePlanDialogComponent>,
        private readonly languageService: LanguageService,
        @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
    ) {}

    /**
     * This lifecycle method is called automatically after constructor
     */
    ngOnInit(): void {
        this.employeeName = this.data.empName;
        this.productName = this.data.productName;
    }

    /**
     * Method to close the dialog with 'replace' action sent
     */
    onReplace(): void {
        this.dialogRef.close({ action: "replace" });
    }
}
