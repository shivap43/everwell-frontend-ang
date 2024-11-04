import { Component, OnInit } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MatDialogRef } from "@angular/material/dialog";
import { Store } from "@ngxs/store";
import { DualPlanYearSettings } from "@empowered/constants";
import { DualPlanYearState, QleOeShopModel } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-shop-qle-coverage-popup",
    templateUrl: "./shop-qle-coverage-popup.component.html",
    styleUrls: ["./shop-qle-coverage-popup.component.scss"],
})
export class ShopQleCoveragePopupComponent implements OnInit {
    OPEN_ENROLLMENT = DualPlanYearSettings.OE_SHOP;
    QLE = DualPlanYearSettings.QLE_SHOP;
    NEW_PY_QLE = DualPlanYearSettings.NEW_PY_QLE_SHOP;
    oePlanYear: string;
    qlePlanYear: string;
    dualPlanYearData: QleOeShopModel;
    isQleAfterOeEnrollment: boolean;
    languageStrings: Record<string, string> = this.langService.fetchPrimaryLanguageValues([
        "primary.portal.members.shop.dualPlanYear.shopBenefits",
        "primary.portal.members.shop.dualPlanYear.shopFirst",
        "primary.portal.members.shop.dualPlanYear.updateFirst",
        "primary.portal.members.shop.dualPlanYear.startCoverageUpdates",
        "primary.portal.members.shop.dualPlanYear.updateBenefits",
        "primary.portal.members.shop.dualPlanYear.updateFirst.future",
    ]);

    constructor(
        private readonly langService: LanguageService,
        private readonly matDialogRef: MatDialogRef<ShopQleCoveragePopupComponent>,
        private readonly store: Store,
    ) {}

    /**
     * on component initialization setting up the variables
     */
    ngOnInit(): void {
        this.dualPlanYearData = this.store.selectSnapshot(DualPlanYearState);
        if (this.dualPlanYearData && this.dualPlanYearData.isDualPlanYear) {
            this.oePlanYear = this.dualPlanYearData.oeYear;
            this.qlePlanYear = this.dualPlanYearData.qleYear;
            this.isQleAfterOeEnrollment = this.dualPlanYearData.isQleAfterOeEnrollment;
        }
    }

    /**
     * @description closing pop up and passing selected shop
     * @param shopSelected selected shop
     */
    shopCoverage(shopSelected: string): void {
        this.matDialogRef.close(shopSelected);
    }
}
