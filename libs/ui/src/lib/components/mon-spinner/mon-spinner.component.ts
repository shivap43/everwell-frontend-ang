import { Component, OnInit, Input } from "@angular/core";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-mon-spinner",
    templateUrl: "./mon-spinner.component.html",
    styleUrls: ["./mon-spinner.component.scss"],
})
export class MonSpinnerComponent implements OnInit {
    @Input() enableSpinner = false;
    @Input() backdrop = true;
    @Input() wait = 0;
    @Input() inputClass = "mon-spinner";
    displaySpinner = false;
    languageStrings;

    constructor(private readonly language: LanguageService) {}

    ngOnInit(): void {
        // delay to show spinner
        if (this.enableSpinner) {
            setTimeout(() => {
                this.displaySpinner = true;
                this.languageStrings = this.language.fetchPrimaryLanguageValue("primary.portal.common.loading");
            }, this.wait);
        } else {
            this.displaySpinner = false;
        }
    }
}
