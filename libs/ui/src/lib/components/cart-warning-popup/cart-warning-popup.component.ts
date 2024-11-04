import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { ShoppingService } from "@empowered/api";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { DualPlanYearSettings, MemberQualifyingEvent } from "@empowered/constants";
import { Subscription } from "rxjs";
import { LanguageService } from "@empowered/language";

const SUCCESS = "SUCCESS";
const PLAN_YEAR = "##planYear##";
const EMPLOYEE_NAME = "##employeeName##";
const PLAN_YEAR_OE = "##planYearOe##";
const PLAN_YEAR_QLE = "##planYearQle##";
const SELECTED_PLAN_YEAR = "##selectedYear##";
const NEW_HIRE = "NEW_HIRE";

export interface DialogDataCart {
    oeYear: string;
    qleYear: string;
    memberName: string;
    memberId: number;
    groupId: number;
    selectedShop: string;
    memberPortal?: boolean;
    isQleAfterOE?: boolean;
    isQleDuringOE?: boolean;
    qleEventData?: MemberQualifyingEvent[];
}

@Component({
    selector: "empowered-cart-warning-popup",
    templateUrl: "./cart-warning-popup.component.html",
    styleUrls: ["./cart-warning-popup.component.scss"],
})
export class CartWarningPopupComponent implements OnInit, OnDestroy {
    subscriptions: Subscription[] = [];
    ShopEnum = DualPlanYearSettings;
    selectedYear: string;
    existingItemsPlanYear: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.shop.cartWarning.dualPlanYear.startLifeEventEnrollment",
        "primary.portal.shop.cartWarning.dualPlanYear.startOpenEnrollment",
        "primary.portal.shop.cartWarning.dualPlanYear.startLifeEventEnrollmentContent",
        "primary.portal.shop.cartWarning.dualPlanYear.startOpenEnrollmentContent",
        "primary.portal.shop.cartWarning.dualPlanYear.clearStartEnroll",
        "primary.portal.shop.cartWarning.dualPlanYear.startCurrentCoverageUpdates",
        "primary.portal.shop.cartWarning.dualPlanYear.startFutureCoverageUpdates",
        "primary.portal.shop.cartWarning.dualPlanYear.clearStartUpdates",
        "primary.portal.shop.cartWarning.dualPlanYear.qleCartWarning",
        "primary.portal.shop.cartWarning.dualPlanYear.oeCartWarning",
        "primary.portal.shop.cartWarning.dualPlanYear.startCoverageUpdates",
        "primary.portal.shop.cartWarning.dualPlanYear.clearStartEnrollLifeEvent",
        "primary.portal.shop.cartWarning.dualPlanYear.clearStartEnrollOpen",
        "primary.portal.shop.cartWarning.dualPlanYear.startOpenEnrollmentContentTwo",
        "primary.portal.shop.cartWarning.dualPlanYear.startLifeEventEnrollmentContentTwo",
        "primary.portal.shop.cartWarning.dualPlanYear.clearStartUpdates.current",
        "primary.portal.shop.cartWarning.dualPlanYear.clearStartUpdates.future",
        "primary.portal.shop.cartWarning.dualPlanYear.startAnotherYearContent.current",
        "primary.portal.shop.cartWarning.dualPlanYear.startAnotherYearContent.future",
        "primary.portal.shop.cartWarning.dualPlanYear.newHireQleStartCurrentCoverageUpdates",
        "primary.portal.shop.cartWarning.dualPlanYear.newHireQleStartFutureCoverageUpdates",
        "primary.portal.shop.cartWarning.dualPlanYear.newHireQleClearStartUpdates.current",
        "primary.portal.shop.cartWarning.dualPlanYear.newHireQleClearStartUpdates.future",
        "primary.portal.shop.cartWarning.dualPlanYear.newHireQleStartLifeEventEnrollmentContentTwo",
        "primary.portal.shop.cartWarning.dualPlanYear.newHireQleStartOpenEnrollmentContentTwo",
    ]);
    samePlanYear: boolean;
    newHireQle: MemberQualifyingEvent[];

    constructor(
        @Inject(MAT_DIALOG_DATA) readonly data: DialogDataCart,
        private readonly language: LanguageService,
        private readonly shoppingService: ShoppingService,
        private readonly dialogRef: MatDialogRef<CartWarningPopupComponent>,
    ) {}

    /**
     * ngOnInit function is one of an Angular component's life-cycle methods
     * This function is used to initialize all the values and functions at the time of component loading.
     */
    ngOnInit(): void {
        const planYearOe = this.data.oeYear;
        const planYearQle = this.data.qleYear;
        const planYear = this.data.selectedShop === DualPlanYearSettings.QLE_SHOP ? planYearQle : planYearOe;
        this.samePlanYear = this.data.qleYear === this.data.oeYear;
        this.existingItemsPlanYear = this.data.selectedShop !== DualPlanYearSettings.QLE_SHOP ? planYearQle : planYearOe;
        this.selectedYear = planYear;
        if (this.data.qleEventData && this.data.qleEventData.length) {
            this.newHireQle = this.data.qleEventData.filter((qleData) => qleData.type.code === NEW_HIRE);
        }
        this.languageStrings["primary.portal.shop.cartWarning.dualPlanYear.startLifeEventEnrollmentContent"] = this.languageStrings[
            "primary.portal.shop.cartWarning.dualPlanYear.startLifeEventEnrollmentContent"
        ]
            .replace(EMPLOYEE_NAME, this.data.memberName)
            .replace(PLAN_YEAR_OE, planYearOe)
            .replace(PLAN_YEAR_QLE, planYearQle);

        this.languageStrings["primary.portal.shop.cartWarning.dualPlanYear.startOpenEnrollmentContent"] = this.languageStrings[
            "primary.portal.shop.cartWarning.dualPlanYear.startOpenEnrollmentContent"
        ]
            .replace(EMPLOYEE_NAME, this.data.memberName)
            .replace(PLAN_YEAR_OE, planYearOe)
            .replace(PLAN_YEAR_QLE, planYearQle);

        this.languageStrings["primary.portal.shop.cartWarning.dualPlanYear.clearStartEnroll"] = this.languageStrings[
            "primary.portal.shop.cartWarning.dualPlanYear.clearStartEnroll"
        ].replace(PLAN_YEAR, planYear);

        this.languageStrings["primary.portal.shop.cartWarning.dualPlanYear.startLifeEventEnrollment"] = this.languageStrings[
            "primary.portal.shop.cartWarning.dualPlanYear.startLifeEventEnrollment"
        ].replace(PLAN_YEAR, planYear);

        this.languageStrings["primary.portal.shop.cartWarning.dualPlanYear.startOpenEnrollment"] = this.languageStrings[
            "primary.portal.shop.cartWarning.dualPlanYear.startOpenEnrollment"
        ].replace(PLAN_YEAR, planYear);

        this.languageStrings["primary.portal.shop.cartWarning.dualPlanYear.startCoverageUpdates"] = this.languageStrings[
            "primary.portal.shop.cartWarning.dualPlanYear.startCoverageUpdates"
        ].replace(SELECTED_PLAN_YEAR, planYear);

        this.languageStrings["primary.portal.shop.cartWarning.dualPlanYear.startCurrentCoverageUpdates"] = this.languageStrings[
            "primary.portal.shop.cartWarning.dualPlanYear.startCurrentCoverageUpdates"
        ].replace(SELECTED_PLAN_YEAR, planYear);
        this.languageStrings["primary.portal.shop.cartWarning.dualPlanYear.startFutureCoverageUpdates"] = this.languageStrings[
            "primary.portal.shop.cartWarning.dualPlanYear.startFutureCoverageUpdates"
        ].replace(SELECTED_PLAN_YEAR, planYear);
    }

    /**
     * This method will call clear shopping cart service.
     */
    clearCart(): void {
        this.subscriptions.push(
            this.shoppingService
                .clearShoppingCart(this.data.memberId, this.data.groupId, false)
                .subscribe(() => this.dialogRef.close(SUCCESS)),
        );
    }

    /**
     * Called once, before the instance is destroyed.
     * Add 'implements OnDestroy' to the class.
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
}
