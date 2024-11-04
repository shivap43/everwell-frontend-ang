import { Component, OnInit, OnDestroy } from "@angular/core";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { UserService } from "@empowered/user";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { LanguageService } from "@empowered/language";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { StaticUtilService } from "@empowered/ngxs-store";
import { EmpoweredModalService, RouteInterceptorService } from "@empowered/common-services";
import { Observable, combineLatest, Subject } from "rxjs";
import { BrandingService } from "@empowered/branding";
import { takeUntil } from "rxjs/operators";
import { ExitSiteComponent } from "./exit-site/exit-site.component";
import { ConfigName } from "@empowered/constants";
import { DereferencedBrandingModel } from "@empowered/ngxs-store";

/**
 * Footer component used to define footer throughout the application with specific field
 * @param customBranding$ is observable of type DereferencedBrandingModel used to check whether the branding type
 * @param currentRoute is of type string and used to get current route
 * @param smallFooterRoutes id of type string used to get route
 * @param supportMailID is of type string and used to get aflac support mail id
 * @param phoneNumber is of type string and used to get support phone number
 * @param unsubscribe$ is subscribe of type void and used to unsubscribe the observable
 * @param customBrandingColor is observable of type string used to get branding color
 */
@Component({
    selector: "empowered-footer",
    templateUrl: "./footer.component.html",
    styleUrls: ["./footer.component.scss"],
})
export class FooterComponent implements OnInit, OnDestroy {
    currentRoute = "";
    smallFooterRoutes = [];
    isAuthenticated;
    supportMailID = "";
    phoneNumber = "";
    logoPublic = "assets/images/logo.png";
    showAccessibility = true;
    accessibilityLink: string;
    private readonly unsubscribe$: Subject<void> = new Subject();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.footer.phone",
        "primary.portal.footer.email",
        "primary.portal.footer.contact",
        "primary.portal.everwell.support",
        "primary.portal.accessibilityStatement.title",
    ]);

    customBranding$: Observable<DereferencedBrandingModel> = this.brandingService.customBrandingObservable$;

    customBrandingColor$: Observable<string> = this.brandingService.customBrandingColor$;

    constructor(
        private readonly ri: RouteInterceptorService,
        private readonly user: UserService,
        private readonly language: LanguageService,
        private readonly staticUtil: StaticUtilService,
        private readonly brandingService: BrandingService,
        private readonly empoweredModal: EmpoweredModalService,
    ) {
        this.smallFooterRoutes = ["login"];
    }

    ngOnInit(): void {
        this.ri.currentRoute$.pipe(takeUntil(this.unsubscribe$)).subscribe((route) => {
            this.currentRoute = route;
        });

        this.user.isAuthenticated$.pipe(takeUntil(this.unsubscribe$)).subscribe((res) => {
            this.isAuthenticated = res;
        });
        combineLatest([
            this.staticUtil.cacheConfigValue("general.partner.support_email"),
            this.staticUtil.cacheConfigValue("support.phone_number"),
            this.staticUtil.cacheConfigValue(ConfigName.PRIMARY_PORTAL_FOOTER_ACCESSIBILITY_LINK),
            this.staticUtil.cacheConfigEnabled(ConfigName.GENERAL_FOOTER_SHOW_ACCESSIBILITY_STATEMENT),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([email, phoneNumber, link, config]) => {
                this.supportMailID = email;
                this.phoneNumber = phoneNumber;
                this.accessibilityLink = link;
                this.showAccessibility = config;
            });
    }
    /**
     * This function is calls the modal component and opens the modal popup when the accessibility link is clicked in the footer.
     */
    onAccessibilityLinkClick(): void {
        this.empoweredModal.openDialog(ExitSiteComponent, {
            data: { link: this.accessibilityLink },
        });
    }

    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
