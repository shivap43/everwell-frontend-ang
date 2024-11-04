import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Component, OnInit, Inject } from "@angular/core";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-delete-proposal",
    templateUrl: "./delete-proposal.component.html",
    styleUrls: ["./delete-proposal.component.scss"],
})
export class DeleteProposalComponent implements OnInit {
    deleteQuestion: string;

    constructor(
        @Inject(MAT_DIALOG_DATA) private readonly data: DialogData,
        private readonly language: LanguageService
    ) {}

    // generate prompt question
    ngOnInit(): void {
        this.deleteQuestion =
            this.language.fetchPrimaryLanguageValue("primary.portal.proposals.delete.question") +
            this.data.name +
            this.language.fetchPrimaryLanguageValue("primary.portal.proposals.delete.questionMark");
    }
}

export interface DialogData {
    name: string;
}
