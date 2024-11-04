import { Component, OnInit } from "@angular/core";
import { Validators, FormBuilder, FormGroup } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
    selector: "empowered-request-changes-dialog",
    templateUrl: "./request-changes-dialog.component.html",
    styleUrls: ["./request-changes-dialog.component.scss"],
})
export class RequestChangesDialogComponent implements OnInit {
    requestChangesForm: FormGroup;
    languageStrings: Record<string, string>;

    /**
     * This method will be automatically invoked when an instance of the class is created.
     * @param dialogRef is matDialogRef of RequestChangesDialogComponent
     * @param formBuilder is instance of FormBuilder
     * @param langService is instance of LanguageService
     */
    constructor(
        private readonly dialogRef: MatDialogRef<RequestChangesDialogComponent>,
        private readonly formBuilder: FormBuilder,
        private readonly langService: LanguageService
    ) {
        this.requestChangesForm = this.formBuilder.group(
            {
                requestedChanges: ["", [Validators.required]],
            },
            { updateOn: "blur" }
        );
    }

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     */
    ngOnInit(): void {
        this.fetchLanguageData();
    }

    /**
     * This method will execute on click of submit
     */
    submit(): void {
        if (this.requestChangesForm.valid) {
            this.dialogRef.close(this.requestChangesForm.controls.requestedChanges.value);
        }
    }

    /**
     * This method is used to fetch language strings from language service
     */
    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.requestChanges.requestOfferingChanges",
            "primary.portal.requestChanges.description",
            "primary.portal.requestChanges.requestChanges",
            "primary.portal.maintenanceBenefitsOffering.addEditOffering.description.maxChar",
            "primary.portal.common.requiredField",
            "primary.portal.common.submit",
        ]);
    }
}
