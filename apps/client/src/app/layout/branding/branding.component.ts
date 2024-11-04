import { Component, Input, EventEmitter, Output, OnDestroy, OnInit } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { Observable, combineLatest, Subject } from "rxjs";
import { BrandingService } from "@empowered/branding";
import { SharedService, PortalType } from "@empowered/common-services";
import { filter, map, shareReplay, switchMap, takeUntil, tap } from "rxjs/operators";
import { Store } from "@ngxs/store";
import { LogoSize } from "@empowered/api";
import { RouterState } from "@ngxs/router-plugin";
import { UserService } from "@empowered/user";
import { DereferencedBrandingModel } from "@empowered/ngxs-store";

const PORTAL_PUBLIC = "public";
const PORTAL_MEMBER = "member";
const URL_SHOP = "/shop";
const URL_MEMBER_WIZARD = "/member/wizard";
const URL_MEMBER_SUPPORT = "/member/support";
const URL_MEMBER_NOTIFICATION_PREFERENCES = "/member/settings/notificationPreferences";

const PORTAL_PRODUCER = "producer";

@Component({
    selector: "empowered-branding",
    templateUrl: "./branding.component.html",
    styleUrls: ["./branding.component.scss"],
})
export class BrandingComponent implements OnDestroy, OnInit {
    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    @Input() logo;
    @Input() color;
    @Input() showMe;
    @Input() sideNavOpen: any;
    @Output() logoClicked: EventEmitter<any> = new EventEmitter<any>();
    languageStrings = this.language.fetchPrimaryLanguageValues(["primary.portal.branding.logo"]);

    isAuthenticated$ = this.userService.isAuthenticated$;

    authenticatedPortal$: Observable<PortalType> = this.shared.userPortal$.pipe(
        filter((userPortal) => userPortal.type !== PORTAL_PUBLIC),
        map((portal) => portal.type as PortalType),
        shareReplay(1),
    );
    inShop$: Observable<boolean> = this.store.select(RouterState.url).pipe(
        map(
            (url) =>
                url &&
                (url.indexOf(URL_SHOP) !== -1 ||
                    url.indexOf(URL_MEMBER_WIZARD) !== -1 ||
                    url.indexOf(URL_MEMBER_SUPPORT) !== -1 ||
                    url.indexOf(URL_MEMBER_NOTIFICATION_PREFERENCES) !== -1),
        ),
        takeUntil(this.unsubscribe$),
        shareReplay(1),
    );
    customBranding$: Observable<DereferencedBrandingModel> = this.isAuthenticated$.pipe(
        filter((isAuth) => isAuth),
        switchMap(() => this.brandingService.customBrandingObservable$),
        shareReplay(1),
    );
    brandingSize$: Observable<LogoSize> = combineLatest([this.authenticatedPortal$, this.inShop$]).pipe(
        map(([portal, inShop]) => (portal === PORTAL_MEMBER && !inShop ? LogoSize.LARGE : LogoSize.SMALL)),
        shareReplay(1),
    );

    constructor(
        private readonly language: LanguageService,
        private readonly shared: SharedService,
        private readonly store: Store,
        private readonly brandingService: BrandingService,
        private readonly userService: UserService,
    ) {}

    /**
     * This Method is used to check if User is Authenticated or not
     */
    ngOnInit(): void {
        this.isAuthenticated$
            .pipe(
                filter((isAuth) => isAuth),
                switchMap(() => this.brandingService.groupBrandingRefresh$),
                takeUntil(this.unsubscribe$),
                shareReplay(1),
            )
            .subscribe();
    }
    /**
     * Unsubscribes from observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    onLogoClicked(): any {
        this.logoClicked.emit();
    }
}
