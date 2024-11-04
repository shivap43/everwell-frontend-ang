import { Component, Input } from "@angular/core";
import { LanguageService } from "@empowered/language";

export interface ProductPricingData {
    member: string;
    plan: string;
    tobaccoStatus: string;
    benefitDollar: number;
    annualPremiumAmount: string;
    age: string;
}

@Component({
    selector: "empowered-ag-product-price-display-list",
    templateUrl: "./ag-product-price-display-list.component.html",
    styleUrls: ["./ag-product-price-display-list.component.scss"],
})
export class AgProductPriceDisplayListComponent {
    productDisplayedColumns: string[] = ["member", "tobaccoStatus", "age", "benefitDollar", "annualPremiumAmount"];
    @Input() productDataSource: ProductPricingData[];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.aflacGroup.offering.lblMember",
        "primary.portal.editCoverage.tobaccoStatus",
        "primary.portal.quickQuote.age",
        "primary.portal.agProductPrice.benefitDollar",
        "primary.portal.agProductPrice.annualPremiumAmount",
    ]);

    constructor(private readonly language: LanguageService) {}
}
