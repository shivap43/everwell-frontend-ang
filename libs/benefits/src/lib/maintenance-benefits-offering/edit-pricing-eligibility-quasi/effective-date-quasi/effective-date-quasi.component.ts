import { Component, OnInit } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { SideNavService } from "@empowered/ngxs-store";
import { ProductsPlansQuasiService } from "../../products-plans-quasi/services/products-plans-quasi.service";

@Component({
    selector: "empowered-effective-date-quasi",
    templateUrl: "./effective-date-quasi.component.html",
    styleUrls: ["./effective-date-quasi.component.scss"],
})
export class EffectiveDateQuasiComponent implements OnInit {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.effectiveDate.title",
        "primary.portal.maintenanceBenefitsOffering.effectiveDate.subTitle",
        "primary.portal.maintenanceBenefitsOffering.effectiveDate.effectiveDateLabel",
        "primary.portal.common.dateHint",
        "primary.portal.common.cancel",
        "primary.portal.common.next",
    ]);
    constructor(
        private readonly language: LanguageService,
        private readonly quasiService: ProductsPlansQuasiService,
        private readonly sideNavService: SideNavService,
    ) {}

    ngOnInit(): void {
        // this.quasiService.stepClicked$.next(1);
        this.sideNavService.stepClicked$.next(1);
    }
    onNext(): void {
        this.quasiService.defaultStepPositionChanged$.next(2);
    }
}
