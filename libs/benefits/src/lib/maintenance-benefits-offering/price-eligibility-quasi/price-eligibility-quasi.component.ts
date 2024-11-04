import { Component, Input } from "@angular/core";
import { ProductsPlansQuasiService } from "../products-plans-quasi/services/products-plans-quasi.service";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-price-eligibility-quasi",
    templateUrl: "./price-eligibility-quasi.component.html",
    styleUrls: ["./price-eligibility-quasi.component.scss"],
})
export class PriceEligibilityQuasiComponent {
    @Input() planChoiceId: any;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.cancel",
        "primary.portal.common.back",
        "primary.portal.common.save",
    ]);
    constructor(private readonly quasiService: ProductsPlansQuasiService, private readonly language: LanguageService) {}

    onBack(): void {
        this.quasiService.defaultStepPositionChanged$.next(2);
    }
}
