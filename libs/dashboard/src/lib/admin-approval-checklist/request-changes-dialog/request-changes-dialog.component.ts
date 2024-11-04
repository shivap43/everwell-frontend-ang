import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-request-changes-dialog",
    templateUrl: "./request-changes-dialog.component.html",
    styleUrls: ["./request-changes-dialog.component.scss"],
})
export class RequestChangesDialogComponent implements OnInit {
    requestChangesForm: FormGroup;
    languageStrings: Record<string, string>;

    title: string;
    description: string;
    label: string;

    constructor(
        public dialogRef: MatDialogRef<RequestChangesDialogComponent>,
        private readonly fb: FormBuilder,
        private readonly langService: LanguageService,
        @Inject(MAT_DIALOG_DATA)
        private readonly data: { isAgreementsChangeRequest: boolean } = { isAgreementsChangeRequest: false }
    ) {
        this.requestChangesForm = this.fb.group(
            {
                changesText: ["", [Validators.required]],
            },
            { updateOn: "submit" }
        );
    }

    /**
     * Initialize language data and set to variables based on modal type.
     */
    ngOnInit(): void {
        this.fetchLanguageData();
        if (this.data && this.data.isAgreementsChangeRequest) {
            this.title =
                this.languageStrings[
                    "primary.portal.dashboard.adminApprovalChecklist.requestChangesForAgreementsDialog.title"
                ];
            this.description =
                this.languageStrings[
                    "primary.portal.dashboard.adminApprovalChecklist.requestChangesForAgreementsDialog.requestChangeDesc"
                ];
            this.label =
                this.languageStrings[
                    "primary.portal.dashboard.adminApprovalChecklist.requestChangesForAgreementsDialog.requestedCarrier"
                ];
        } else {
            this.title =
                this.languageStrings["primary.portal.dashboard.adminApprovalChecklist.requestChangesDialog.title"];
            this.description =
                this.languageStrings[
                    "primary.portal.dashboard.adminApprovalChecklist.requestChangesDialog.requestChangeDesc"
                ];
            this.label =
                this.languageStrings[
                    "primary.portal.dashboard.adminApprovalChecklist.requestChangesDialog.requestedCarrier"
                ];
        }
    }

    close(): void {
        this.dialogRef.close();
    }

    submit(): void {
        this.dialogRef.close(this.requestChangesForm.get("changesText").value);
    }

    /**
     * Load necessary language specifications from the store.
     */
    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.dashboard.adminApprovalChecklist.requestChangesDialog.title",
            "primary.portal.dashboard.adminApprovalChecklist.requestChangesDialog.requestChangeDesc",
            "primary.portal.dashboard.adminApprovalChecklist.requestChangesDialog.requestedCarrier",
            "primary.portal.dashboard.adminApprovalChecklist.requestChangesForAgreementsDialog.title",
            "primary.portal.dashboard.adminApprovalChecklist.requestChangesForAgreementsDialog.requestChangeDesc",
            "primary.portal.dashboard.adminApprovalChecklist.requestChangesForAgreementsDialog.requestedCarrier",
            "primary.portal.common.cancel",
            "primary.portal.common.submit",
            "primary.portal.common.close",
        ]);
    }
}
