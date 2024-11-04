import { Component, OnInit } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
    selector: "empowered-ag-ai-offering-setup-alert",
    templateUrl: "./ag-ai-offering-setup-alert.component.html",
    styleUrls: ["./ag-ai-offering-setup-alert.component.scss"],
})
export class AgAiOfferingSetupAlertComponent implements OnInit {
    languageStringsArray: Record<string, string>;
    /**
     * This method will be automatically invoked when an instance of the class is created.
     * @param language is instance of LanguageService
     * @param matDialogRef is dialogRef of AgAiOfferingSetupAlertComponent
     */
    constructor(
        private readonly language: LanguageService,
        private readonly matDialogRef: MatDialogRef<AgAiOfferingSetupAlertComponent>
    ) {}
    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     * This method is used to fetch primary language strings
     */
    ngOnInit(): void {
        this.languageStringsArray = this.language.fetchPrimaryLanguageValues([
            "primary.portal.aflacGroup.offering.offeringSetupComplete",
            "primary.portal.aflacGroup.offering.setupSubmit",
            "primary.portal.aflacGroup.offering.addNonAgBtn",
            "primary.portal.aflacGroup.offering.approvalText",
            "primary.portal.common.cancel",
        ]);
    }
    /**
     * This method will be called on click of submit offering button
     */
    onSubmitOffering(): void {
        this.matDialogRef.close(true);
    }
    /**
     * This method will be called on click of add non-ag plans
     */
    onNavigateToIBO(): void {
        this.matDialogRef.close(false);
    }
}
