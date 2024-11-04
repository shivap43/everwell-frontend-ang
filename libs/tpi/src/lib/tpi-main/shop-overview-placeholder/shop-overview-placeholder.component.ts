import { Component, OnInit, HostBinding } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { AppSettings } from "@empowered/constants";
import { Router } from "@angular/router";
import { map } from "rxjs/operators";
import { Observable, Subject } from "rxjs";
import { TpiServices } from "@empowered/common-services";

@Component({
    selector: "empowered-shop-overview-placeholder",
    templateUrl: "./shop-overview-placeholder.component.html",
    styleUrls: ["./shop-overview-placeholder.component.scss"],
})
export class ShopOverviewPlaceholderComponent implements OnInit {
    isTpi = false;
    tpiLnlMode = false;
    @HostBinding("class") classes = "tpi-content-wrapper";
    languageStrings = this.language.fetchPrimaryLanguageValues(["primary.portal.tpi.shopReview.selectBenefits"]);
    // to hide header if user not eligible for enrollment due to age limit
    isValidAgeForEnrollment$: Observable<boolean> = this.tpiService.isAgeError$.pipe(map((isAgeError) => !isAgeError));
    private readonly unsubscribe$: Subject<void> = new Subject();
    constructor(private readonly language: LanguageService, private readonly router: Router, private readonly tpiService: TpiServices) {}

    /**
     * Life cycle hook for angular to initialize the component
     */
    ngOnInit(): void {
        this.isTpi = this.router.url.indexOf(AppSettings.TPI) > 0;
        if (this.isTpi) {
            this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
        }
    }
}
