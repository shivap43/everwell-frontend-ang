import { Component, Optional, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { TitleCasePipe } from "@angular/common";

@Component({
    selector: "empowered-cannot-remove-modal",
    templateUrl: "./cannot-remove-modal.component.html",
    styleUrls: ["./cannot-remove-modal.component.scss"],
})
export class CannotRemoveModalComponent {
    readonly REPLACE_PATTERN = "<FirstLastname>";

    header = this.languageService
        .fetchPrimaryLanguageValue("primary.portal.administrators.remove.subordinateModalHeader")
        .replace(this.REPLACE_PATTERN, this.titleCase.transform(`${this.data.admin.name.firstName} ${this.data.admin.name.lastName}`));
    body: string;

    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) private readonly data: { admin: any; errorLanguage: string },
        private readonly languageService: LanguageService,
        private readonly titleCase: TitleCasePipe,
    ) {
        this.body = this.languageService.fetchPrimaryLanguageValue(this.data.errorLanguage);
        if (this.body.indexOf(this.REPLACE_PATTERN)) {
            this.body = this.body.replace(
                this.REPLACE_PATTERN,
                this.titleCase.transform(`${this.data.admin.name.firstName} ${this.data.admin.name.lastName}`),
            );
        }
    }
}
