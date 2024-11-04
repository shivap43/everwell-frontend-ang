import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-proposal-no-plans-selected",
    templateUrl: "./proposal-no-plans-selected.component.html",
    styleUrls: ["./proposal-no-plans-selected.component.scss"],
})
export class ProposalNoPlansSelectedComponent {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.close",
        "primary.portal.benefitsOffering.plansNotSelectedTitle",
        "primary.portal.proposals.plansNotSelectedSubTitle",
        "primary.portal.benefitsOffering.setting.licensedModal.gotIt",
    ]);

    constructor(
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<ProposalNoPlansSelectedComponent>
    ) {}

    // This method will close the modal.
    closeModal(): void {
        this.dialogRef.close();
    }
}
