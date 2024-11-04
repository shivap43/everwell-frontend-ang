import { LanguageService } from "@empowered/language";
import { BrandingModalReplaceComponent } from "./../../modals/branding-modal-replace/branding-modal-replace.component";
import { Validators, FormGroup, FormBuilder } from "@angular/forms";
import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter, OnDestroy } from "@angular/core";
import { Observable, combineLatest, iif, BehaviorSubject, of, fromEvent, defer, Subject } from "rxjs";
import { filter, tap, map, shareReplay, withLatestFrom, switchMap, distinctUntilChanged, takeUntil } from "rxjs/operators";
import { LogoSize, BrandingType, FIELD_CUSTOM_LOGO, FIELD_STANDARD_LOGOS } from "@empowered/api";
import { Store } from "@ngxs/store";
import { SafeUrl } from "@angular/platform-browser";

import { NgxDropzoneChangeEvent } from "ngx-dropzone";
import { RejectedFile } from "ngx-dropzone/lib/ngx-dropzone.service";
import { MPGroupAccountService, EmpoweredModalService } from "@empowered/common-services";
import {
    StaticUtilService,
    BrandingState,
    BrandingDomainType,
    LoadStandardLogoData,
    DereferencedBrandingModel,
    COMPARE_BRANDING_DATA,
} from "@empowered/ngxs-store";

const INPUT_LOGO_TYPE_DEFAULT = "STANDARD";
const INPUT_LOGO_TYPE_REGEX = "(STANDARD|CUSTOM)";
const MAX_CUSTOM_LOGO_WIDTH = 200;
const MAX_CUSTOM_LOGO_HEIGHT = 60;
const LANGUAGE_INVALID_FILE = "primary.portal.branding.error.invalid_file";

@Component({
    selector: "empowered-branding-logo-form",
    templateUrl: "./branding-logo-form.component.html",
    styleUrls: ["./branding-logo-form.component.scss"],
})
export class BrandingLogoFormComponent implements OnInit, OnDestroy {
    @Input() currentBranding$: Observable<DereferencedBrandingModel>;
    @Input() domainType$: Observable<BrandingDomainType>;

    @Output() logoChange: EventEmitter<DereferencedBrandingModel> = new EventEmitter();

    @ViewChild("testImage", { static: true }) testImage: ElementRef;

    // errorMsgSubject$ is BehaviorSubject of type string
    private readonly errorMsgSubject$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

    @Input() errorMsg$: Observable<string>;

    // Logo type selection
    logoTypeForm: FormGroup = this.builder.group({
        logoType: [INPUT_LOGO_TYPE_DEFAULT, Validators.compose([Validators.required, Validators.pattern(INPUT_LOGO_TYPE_REGEX)])],
    });

    // Image data
    private readonly customLogoDataSubject: BehaviorSubject<SafeUrl | string> = new BehaviorSubject(null);
    private readonly validCustomLogoDataSubject: BehaviorSubject<SafeUrl | string> = new BehaviorSubject(null);

    // Helpers
    smallLogoSize$: Observable<LogoSize> = of(LogoSize.SMALL).pipe(shareReplay(1));
    largeLogoSize$: Observable<LogoSize> = of(LogoSize.LARGE).pipe(shareReplay(1));

    // Display Branding models
    customBrandingModel$: Observable<DereferencedBrandingModel>;
    hasCustomBrandingLogo$: Observable<boolean>;
    standardBrandingModel$: Observable<DereferencedBrandingModel>;

    customLogoData$: Observable<SafeUrl | string> = this.customLogoDataSubject.asObservable().pipe(shareReplay(1));

    showReplaceWarning = false;
    errorMessageUpload: string;

    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    /**
     * areBrandingConfigsEnabled$ is observable of type boolean used to check whether standard and custom brandings are enabled or not
     * @returns boolean value
     */
    areBrandingConfigsEnabled$: Observable<boolean> = combineLatest(
        this.staticUtilService.cacheConfigEnabled("general.branding.standard.setUp_flag"),
        this.staticUtilService.cacheConfigEnabled("general.branding.custom.setUp_flag"),
    ).pipe(map(([standard, custom]) => standard && custom));

    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.branding.standard.account.logo.sample",
        "primary.portal.branding.standard.text.logo",
        "primary.portal.branding.custom.image.logo",
        "primary.portal.branding.custom.logo.file.upload",
        "primary.portal.branding.custom.account.logo.employee.portal",
        "primary.portal.branding.custom.account.logo.admin.portal",
        "primary.portal.branding.select.logo.type",
    ]);

    constructor(
        private readonly builder: FormBuilder,
        private readonly languageService: LanguageService,
        private readonly store: Store,
        private readonly modalService: EmpoweredModalService,
        private readonly mpGroup: MPGroupAccountService,
        private readonly staticUtilService: StaticUtilService,
    ) {}

    /**
     * OnInit, initialize all the observables, because they rely on an input observable,
     * they cannot be initialized like fields
     */
    ngOnInit(): void {
        // Input observable is used often, make it shareable
        this.currentBranding$ = this.currentBranding$.pipe(shareReplay(1));
        this.domainType$ = this.domainType$.pipe(shareReplay(1));
        // Combine data models from parent with internal "current" image data
        this.customBrandingModel$ = this.initCustomBrandingModel(this.currentBranding$, this.validCustomLogoDataSubject.asObservable());
        // Determine if the custom branding has logo data to display or not
        this.hasCustomBrandingLogo$ = this.customBrandingModel$.pipe(
            map((customBranding) =>
                Boolean(customBranding && FIELD_CUSTOM_LOGO in customBranding && customBranding[FIELD_CUSTOM_LOGO].logoData),
            ),
        );

        this.standardBrandingModel$ = this.initStandardBrandingModel(this.currentBranding$);

        // Emit latest valid models (color change when standard is selected, valid upload when custom is selected)
        this.logoTypeForm.controls["logoType"].valueChanges
            .pipe(
                distinctUntilChanged(),
                switchMap((value) =>
                    iif(
                        () => value === BrandingType.STANDARD,
                        defer(() => this.standardBrandingModel$),
                        // When CUSTOM is selected, emit on new valid image upload or on type value change
                        defer(() => this.customBrandingModel$),
                    ),
                ),
                // Only emit if the updated model is different from the incoming model
                withLatestFrom(this.currentBranding$),
                filter(
                    ([outbound, inbound]) =>
                        !COMPARE_BRANDING_DATA(outbound, inbound) ||
                        (outbound.type === BrandingType.CUSTOM &&
                            outbound[FIELD_CUSTOM_LOGO] &&
                            outbound[FIELD_CUSTOM_LOGO].logoData &&
                            typeof outbound[FIELD_CUSTOM_LOGO].logoData === "string" &&
                            outbound[FIELD_CUSTOM_LOGO].logoData !== inbound[FIELD_CUSTOM_LOGO].logoData),
                ),
                map(([outbound]) => outbound),
                // Emit when a value comes through
                tap((updatedBranding) => {
                    this.logoChange.emit(updatedBranding);
                }),
                takeUntil(this.unsubscribe$.asObservable()),
            )
            .subscribe();

        // Detects if a new test image has loaded and handles appropriately
        this.initOnTestImageLoad(this.customLogoData$, this.unsubscribe$.asObservable()).subscribe();

        // On init, if the current branding is custom, set up the valid data
        this.initCustomLogoDataObserver(this.currentBranding$, this.unsubscribe$.asObservable()).subscribe();
    }

    /**
     * OnDestroy clean up all the observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Combine the data model from the parent component with the custom logo upgrades to generate a new internal model
     *
     * @param currentBranding$ the parent's branding
     * @param validCustomLogoData$ the latest custom image data
     * @returns the new combined model
     */
    private initCustomBrandingModel(
        currentBranding$: Observable<DereferencedBrandingModel>,
        validCustomLogoData$: Observable<string | SafeUrl>,
    ): Observable<DereferencedBrandingModel> {
        return currentBranding$.pipe(
            // Only emit if there is branding to be had
            filter((branding) => Boolean(branding)),
            // Do not emit if it is the same data
            distinctUntilChanged((prev, curr) =>
                Boolean(
                    FIELD_CUSTOM_LOGO in prev &&
                        prev[FIELD_CUSTOM_LOGO] &&
                        FIELD_CUSTOM_LOGO in curr &&
                        curr[FIELD_CUSTOM_LOGO] &&
                        prev[FIELD_CUSTOM_LOGO].logoData === curr[FIELD_CUSTOM_LOGO].logoData,
                ),
            ),
            // Custom model does not need to be updated from external sources
            switchMap((branding) => validCustomLogoData$),
            withLatestFrom(currentBranding$),
            // Map the data to the latest branding model with the internal logo data
            map(([customLogoData, currentBranding]) => {
                // Remove the Standard logo data if it exists
                const newBranding: DereferencedBrandingModel = { ...currentBranding };
                if (FIELD_STANDARD_LOGOS in newBranding) {
                    delete newBranding[FIELD_STANDARD_LOGOS];
                }
                newBranding.type = BrandingType.CUSTOM;
                newBranding[FIELD_CUSTOM_LOGO] = { logoData: customLogoData };
                return newBranding;
            }),
            shareReplay(1),
        );
    }

    /**
     * Combine the parent's branding data model with the internal standard logo data
     *
     * @param currentBranding$ the parent's branding model
     * @returns the new combined model
     */
    private initStandardBrandingModel(currentBranding$: Observable<DereferencedBrandingModel>): Observable<DereferencedBrandingModel> {
        return currentBranding$.pipe(
            // Make sure there is branding
            filter((branding) => Boolean(branding)),
            withLatestFrom(this.domainType$, this.mpGroup.mpGroupAccount$.pipe(map((account) => (account ? account.id : undefined)))),
            // dispatch a request to load the standard previews
            switchMap(([branding, domainType, accountId]) =>
                this.store.dispatch(new LoadStandardLogoData(domainType, branding.colorFormat, branding.colorCode, accountId)).pipe(
                    switchMap((state) =>
                        // get both the large and the small previews
                        combineLatest([
                            this.store.select(
                                BrandingState.getLogoData(domainType, branding.colorFormat, branding.colorCode, LogoSize.SMALL, accountId),
                            ),
                            this.store.select(
                                BrandingState.getLogoData(domainType, branding.colorFormat, branding.colorCode, LogoSize.LARGE, accountId),
                            ),
                        ]).pipe(
                            // Map the to be the current branding, but with the latest internal data model
                            map(([smallLogoData, largeLogoData]) => {
                                // Delete the custom data if it is present
                                const newBranding: DereferencedBrandingModel = { ...branding };
                                if (FIELD_CUSTOM_LOGO in newBranding) {
                                    delete newBranding[FIELD_CUSTOM_LOGO];
                                }
                                newBranding.type = BrandingType.STANDARD;

                                newBranding[FIELD_STANDARD_LOGOS] = {
                                    smallLogo: { logoData: smallLogoData },
                                    largeLogo: { logoData: largeLogoData },
                                };
                                return newBranding;
                            }),
                        ),
                    ),
                ),
            ),
            shareReplay(1),
        );
    }

    /**
     * Validates that loaded images match the given file format restrictions
     *
     * @param customLogoData$ custom logo data to be evaluated
     */
    private initOnTestImageLoad(customLogoData$: Observable<string | SafeUrl>, unsubscribe$: Observable<void>): Observable<unknown> {
        return fromEvent(this.testImage.nativeElement, "load").pipe(
            // Introduce the data that was loaded
            withLatestFrom(customLogoData$),
            switchMap(([event, customLogoData]) =>
                iif(
                    // Determine if the sizing is correct
                    () => {
                        const uploadHeight = Number(this.testImage.nativeElement.naturalHeight);
                        const uploadWidth = Number(this.testImage.nativeElement.naturalWidth);
                        return uploadHeight > MAX_CUSTOM_LOGO_HEIGHT || uploadWidth > MAX_CUSTOM_LOGO_WIDTH;
                    },
                    // Sizing is not correct, throw error
                    of(event).pipe(
                        tap(
                            (staticEvent) =>
                                (this.errorMessageUpload = this.languageService.fetchPrimaryLanguageValue(LANGUAGE_INVALID_FILE)),
                        ),
                    ),
                    // Upload successful
                    of(event).pipe(
                        // Clear out and error messaging for successful uploads
                        tap((staticEvent) => (this.errorMessageUpload = null)),
                        switchMap((staticEvent) =>
                            iif(
                                // Determine if the replacement warning should be shown
                                () => Boolean(this.showReplaceWarning),
                                // Show the message, capture the response, and show it here
                                defer(() => this.canReplaceCustomImage(customLogoData)),
                                // If there is no saved data being replaced, just replace it
                                defer(() =>
                                    of(event).pipe(
                                        tap((unusedEvent) => {
                                            this.validCustomLogoDataSubject.next(customLogoData);
                                        }),
                                    ),
                                ),
                            ),
                        ),
                    ),
                ),
            ),
            takeUntil(unsubscribe$),
        );
    }

    /**
     * Prompts the user to validate if the custom logo can be replaced with the new one
     *
     * @param customLogoData the new data to replace the old data
     */
    private canReplaceCustomImage(customLogoData: SafeUrl | string): Observable<boolean> {
        return this.modalService
            .openDialog(BrandingModalReplaceComponent)
            .afterClosed()
            .pipe(
                tap((canReplace: boolean) => {
                    // If we can replace, emit the new valid logo data
                    if (canReplace) {
                        this.showReplaceWarning = false;
                        this.validCustomLogoDataSubject.next(customLogoData);
                    } else {
                        // Otherwise clear the currently loaded invalid data
                        this.customLogoDataSubject.next(null);
                    }
                }),
            );
    }

    /**
     * Monitors the incoming data model for new custom logos and then loads the data on change
     *
     * @param currentBranding$ the parent data model
     * @param unsubscribe$ the unsubscribe trigger
     */
    private initCustomLogoDataObserver(
        currentBranding$: Observable<DereferencedBrandingModel>,
        unsubscribe$: Observable<void>,
    ): Observable<DereferencedBrandingModel> {
        return currentBranding$.pipe(
            tap(
                (branding) =>
                    (this.showReplaceWarning =
                        branding.type === BrandingType.CUSTOM &&
                        branding[FIELD_CUSTOM_LOGO] &&
                        branding[FIELD_CUSTOM_LOGO].logoData &&
                        typeof branding[FIELD_CUSTOM_LOGO] === "object"),
            ),
            tap((branding) => this.logoTypeForm.controls["logoType"].setValue(branding.type)),
            filter((branding) => Boolean(branding.type === BrandingType.CUSTOM && branding[FIELD_CUSTOM_LOGO].logoData)),
            tap((branding) => {
                this.showReplaceWarning = true;
                this.validCustomLogoDataSubject.next(branding[FIELD_CUSTOM_LOGO].logoData);
            }),

            takeUntil(unsubscribe$),
        );
    }

    /**
     * When a new file uploads, load the test data into a hidden element to test the dimensions
     * @param changeEvent NgxDropzoneChangeEvent will have Added files, Rejected files properties
     */
    onFileUpload(changeEvent: NgxDropzoneChangeEvent): void {
        this.errorMsgSubject$.next("");
        this.errorMsg$ = this.errorMsgSubject$.asObservable();

        if (changeEvent.addedFiles.length) {
            changeEvent.addedFiles.forEach((file: File) => {
                const fileReader = new FileReader();
                fileReader.onload = (progressEvent: ProgressEvent) => {
                    this.customLogoDataSubject.next((progressEvent.target as FileReader).result as string);
                };
                fileReader.readAsDataURL(file);
            });
        }

        if (
            changeEvent.rejectedFiles.length &&
            changeEvent.rejectedFiles.some((rejectedFile: RejectedFile) => rejectedFile.reason === "type")
        ) {
            this.errorMessageUpload = this.languageService.fetchPrimaryLanguageValue(LANGUAGE_INVALID_FILE);
        }
    }

    /**
     * Remove the uploaded custom image data
     */
    clearCustomImage(): void {
        this.customLogoDataSubject.next(null);
        this.validCustomLogoDataSubject.next(null);
    }
}
