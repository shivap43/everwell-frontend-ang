import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy } from "@angular/core";
import { LogoSize, BrandingType, FIELD_CUSTOM_LOGO, FIELD_STANDARD_LOGOS } from "@empowered/api";
import { Observable, iif, combineLatest, BehaviorSubject, of, defer, Subject } from "rxjs";
import { map, switchMap, shareReplay, filter, startWith, withLatestFrom, takeUntil } from "rxjs/operators";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { StaticUtilService, ColorControlService, DereferencedBrandingModel } from "@empowered/ngxs-store";

enum BrandingOrientation {
    WIDE = "wide",
    TALL = "tall",
    NONE = "none",
}
const CONVERT_TO_REM: ([stringLength, fontBase]: string[]) => string = ([stringLength, fontBase]: string[]) =>
    `${Number(stringLength) / Number(fontBase)}rem`;
const WHITE_HEX = "#FFFFFF";
const LANGUAGE_FONT_SIZE = "general.base_font_size";

/**
 * Branding header for custom white labeling
 */
@Component({
    selector: "empowered-branding-logo",
    templateUrl: "./branding-logo.component.html",
    styleUrls: ["./branding-logo.component.scss"],
})
export class BrandingLogoComponent implements OnInit, AfterViewInit, OnDestroy {
    // Branding to be displayed
    @Input() set brandingInput(brandingInput: DereferencedBrandingModel) {
        this.brandingSubj.next(brandingInput);
    }
    private brandingSubj = new BehaviorSubject<DereferencedBrandingModel>({} as DereferencedBrandingModel);
    branding$ = this.brandingSubj.asObservable();
    // Size that the branding should be
    @Input() set sizeInput(sizeInput: LogoSize) {
        this.sizeSubj.next(sizeInput);
    }
    private sizeSubj = new BehaviorSubject<LogoSize>(LogoSize.SMALL);
    size$ = this.sizeSubj.asObservable();

    // Logo data for the element
    @ViewChild("customLogo") customLogo: ElementRef;

    // Helper observable to determine if the branding is custom or not
    isCustomBranding$: Observable<boolean>;
    logoData$: Observable<SafeUrl | string>;
    private readonly loadedLogoAspectRatio$: BehaviorSubject<number> = new BehaviorSubject<number>(null);

    // Observables that determine the layout of the containers and logo
    customLogoOrientation$: Observable<BrandingOrientation>;
    logoInnerHeight$: Observable<string>;
    logoInnerWidth$: Observable<string>;
    logoOuterHeight$: Observable<string>;
    logoOuterWidth$: Observable<string>;
    backgroundColor$: Observable<string>;

    // Subject to track if the view has initializes
    private readonly hasViewInit$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    constructor(
        private readonly staticUtil: StaticUtilService,
        private readonly sanitizer: DomSanitizer,
        private readonly colorService: ColorControlService,
    ) {}

    /**
     * Initialize all of the different observables used in the display that rely on input data
     */
    ngOnInit(): void {
        this.isCustomBranding$ = this.branding$.pipe(
            map((branding) => (branding ? FIELD_CUSTOM_LOGO in branding : undefined)),
            shareReplay(1),
        );
        this.logoData$ = this.initLogoData(this.isCustomBranding$);

        const sizeAndType$: Observable<[LogoSize, boolean]> = combineLatest([this.size$, this.isCustomBranding$]).pipe(shareReplay(1));
        const logoInnerHeightPx$: Observable<string> = sizeAndType$.pipe(
            switchMap(([size, isCustom]) =>
                this.staticUtil.cacheConfigValue(
                    this.buildConfigName(isCustom ? BrandingType.CUSTOM : BrandingType.STANDARD, size, true, true),
                ),
            ),
        );
        this.logoInnerHeight$ = logoInnerHeightPx$.pipe(
            withLatestFrom(this.staticUtil.cacheConfigValue(LANGUAGE_FONT_SIZE)),
            map(CONVERT_TO_REM),
            shareReplay(1),
        );
        const logoInnerWidthPx$: Observable<string> = sizeAndType$.pipe(
            switchMap(([size, isCustom]) =>
                this.staticUtil.cacheConfigValue(
                    this.buildConfigName(isCustom ? BrandingType.CUSTOM : BrandingType.STANDARD, size, true, false),
                ),
            ),
        );
        this.logoInnerWidth$ = logoInnerWidthPx$.pipe(
            withLatestFrom(this.staticUtil.cacheConfigValue(LANGUAGE_FONT_SIZE)),
            map(CONVERT_TO_REM),
            shareReplay(1),
        );

        this.logoOuterHeight$ = this.initLogoOuterHeight(sizeAndType$);
        this.logoOuterWidth$ = this.initLogoOuterWidth(sizeAndType$);

        this.customLogoOrientation$ = this.initCustomLogoOrientation(
            this.branding$,
            this.hasViewInit$.asObservable(),
            logoInnerWidthPx$,
            logoInnerHeightPx$,
            this.loadedLogoAspectRatio$.asObservable(),
        );

        this.backgroundColor$ = this.initBackgroundColor(this.size$, this.branding$);
    }

    /**
     * Unsubscribe from the observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Once the view initializes, track it
     */
    ngAfterViewInit(): void {
        this.hasViewInit$.next(true);
    }

    /**
     * Determines the outer height of the logo
     * @param sizeAndType$ the logo's size and type
     * @return the logo's outer height
     */
    initLogoOuterHeight(sizeAndType$: Observable<[LogoSize, boolean]>): Observable<string> {
        return sizeAndType$.pipe(
            switchMap(([size, isCustom]) =>
                this.staticUtil.cacheConfigValue(
                    this.buildConfigName(isCustom ? BrandingType.CUSTOM : BrandingType.STANDARD, size, false, true),
                ),
            ),
            withLatestFrom(this.staticUtil.cacheConfigValue(LANGUAGE_FONT_SIZE)),
            map(CONVERT_TO_REM),
        );
    }

    /**
     * Determine the outer width of the logo
     * @param sizeAndType$ the logo's size and type
     * @returns the logo's outer width
     */
    initLogoOuterWidth(sizeAndType$: Observable<[LogoSize, boolean]>): Observable<string> {
        return sizeAndType$.pipe(
            switchMap(([size, isCustom]) =>
                this.staticUtil.cacheConfigValue(
                    this.buildConfigName(isCustom ? BrandingType.CUSTOM : BrandingType.STANDARD, size, false, false),
                ),
            ),
            withLatestFrom(this.staticUtil.cacheConfigValue(LANGUAGE_FONT_SIZE)),
            map(CONVERT_TO_REM),
        );
    }

    /**
     * Initialize the custom logo orientation, used to define the css on which side is longer
     *
     * @param branding$ Branding to orient
     * @param hasViewInit$ if the view has initialized
     * @param logoInnerWidthPx$ the inner width
     * @param logoInnerHeightPx$ the outer width
     * @param loadedLogoAspectRatio$ the image's aspect ratio
     * @return an observable that defines the orientation of the logo for the branding
     */
    initCustomLogoOrientation(
        branding$: Observable<DereferencedBrandingModel>,
        hasViewInit$: Observable<boolean>,
        logoInnerWidthPx$: Observable<string>,
        logoInnerHeightPx$: Observable<string>,
        loadedLogoAspectRatio$: Observable<number>,
    ): Observable<BrandingOrientation> {
        return combineLatest([
            branding$,
            hasViewInit$,
            // Calculate the inner container aspect ratio
            combineLatest([logoInnerWidthPx$, logoInnerHeightPx$]).pipe(map(([width, height]) => Number(width) / Number(height))),
            // Calculate the current image's aspect ratio
            loadedLogoAspectRatio$.pipe(filter((aspectRatio) => Boolean(aspectRatio))),
        ]).pipe(
            filter(([branding, hasViewInit]) => Boolean(branding && FIELD_CUSTOM_LOGO in branding && hasViewInit)),
            map(([, , supposedRatio, observedRatio]) =>
                observedRatio > supposedRatio ? BrandingOrientation.WIDE : BrandingOrientation.TALL,
            ),
            startWith(BrandingOrientation.NONE),
        );
    }

    /**
     * Initializes the background color based on the size and the branding
     *
     * @param size$ The size the logo should be
     * @param branding$ The branding to show
     * @returns The observable for the background color
     */
    initBackgroundColor(size$: Observable<LogoSize>, branding$: Observable<DereferencedBrandingModel>): Observable<string> {
        return size$.pipe(
            switchMap((size) =>
                iif(
                    // If the size is large...
                    () => size === LogoSize.LARGE,
                    // ...the background is always white
                    defer(() => of(WHITE_HEX)),
                    // ...otherwise get the branding color
                    defer(() =>
                        branding$.pipe(
                            filter((branding) => Boolean(branding)),
                            map((branding) => this.colorService.accountBrandingToHex(branding)),
                            map((color) => (color && color.length > 0 && color.charAt(0) === "#" ? color : `#${color}`)),
                        ),
                    ),
                ),
            ),
        );
    }

    /**
     * Initializes the observable for the logo image data to display
     *
     * @param isCustomBranding$ The observable for if the branding is custom
     * @returns The image data for the logo
     */
    initLogoData(isCustomBranding$: Observable<boolean>): Observable<SafeUrl | string> {
        // Whenever there is new logo data..
        return isCustomBranding$.pipe(
            switchMap((isCustomBranding) =>
                // ... map the branding to a Boolean
                defer(() => {
                    if (isCustomBranding === undefined) {
                        return of(undefined);
                    }
                    if (isCustomBranding) {
                        return this.branding$.pipe(map((branding) => branding[FIELD_CUSTOM_LOGO].logoData));
                    }
                    return this.size$.pipe(
                        switchMap((size) =>
                            this.branding$.pipe(
                                map(
                                    (branding) =>
                                        branding[FIELD_STANDARD_LOGOS][size === LogoSize.LARGE ? "largeLogo" : "smallLogo"].logoData,
                                ),
                            ),
                        ),
                        filter((blob) => Boolean(blob)),
                    );
                }),
            ),
            takeUntil(this.unsubscribe$.asObservable()),
        );
    }

    /**
     * Whenever the logo data loads, push the aspect ratio through its subject
     */
    onLoadLogo(): void {
        this.loadedLogoAspectRatio$.next(this.customLogo.nativeElement.offsetWidth / this.customLogo.nativeElement.offsetHeight);
    }

    /**
     * Get the config name for the desired dimension
     *
     * @param type the type of the banding
     * @param size the size of the logo
     * @param isInnerContainer if the container is inner or not
     * @param isHeight if the desired dimension is the height
     */
    buildConfigName(type: BrandingType, size: LogoSize, isInnerContainer: boolean, isHeight: boolean): string {
        return (
            `general.branding.${type.toString().toLowerCase()}_logo.${size.toString().toLowerCase()}` +
            `.${isInnerContainer ? "inner" : "outer"}.max_${isHeight ? "height" : "width"}`
        );
    }
}
