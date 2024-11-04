import { BrandingColorFormat, RGBRatio, COLOR_TO_STRING, STRING_TO_COLOR } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { Validators, FormGroup, FormBuilder } from "@angular/forms";
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from "@angular/core";
import { Observable, Subscription, merge, combineLatest } from "rxjs";
import { tap, debounceTime, startWith, map, distinctUntilChanged, shareReplay, filter } from "rxjs/operators";
import { BrandingDomainType, DereferencedBrandingModel, ColorControlService } from "@empowered/ngxs-store";

const RGB_MIN = 0;
const RGB_MAX = 255;
const FORMAT_REGEX = "(HEX|RGB)";
const RGB_REGEX = "^[0-9]{1,3}$";
const HEX_REGEX = "^[0-9a-fA-F]{6}$";
const USER_DEBOUNCE = 300;
const INPUT_HEX_DEFAULT = "HEX";

@Component({
    selector: "empowered-branding-color-form",
    templateUrl: "./branding-color-form.component.html",
    styleUrls: ["./branding-color-form.component.scss"],
})
export class BrandingColorFormComponent implements OnInit, OnDestroy {
    @Input() currentBranding$: Observable<DereferencedBrandingModel>;
    @Input() groupName$: Observable<string>;
    @Input() domainType$: Observable<BrandingDomainType>;

    @Output() colorChange: EventEmitter<ColorFormat> = new EventEmitter();

    sampleHex$: Observable<string>;

    // Variable to store true of false depends on browser is Internet Explorer or not
    isIE = false;

    formatForm: FormGroup = this.builder.group({
        format: [INPUT_HEX_DEFAULT, Validators.compose([Validators.required, Validators.pattern(FORMAT_REGEX)])],
    });

    format$: Observable<string> = this.formatForm.controls["format"].valueChanges.pipe(
        startWith(this.formatForm.controls["format"].value),
        shareReplay(1),
    );

    colorValueForm: FormGroup = this.builder.group({
        hexValue: [undefined, Validators.compose([Validators.required, Validators.pattern(HEX_REGEX)])],
        rValue: [
            0,
            Validators.compose([Validators.required, Validators.min(RGB_MIN), Validators.max(RGB_MAX), Validators.pattern(RGB_REGEX)]),
        ],
        gValue: [
            0,
            Validators.compose([Validators.required, Validators.min(RGB_MIN), Validators.max(RGB_MAX), Validators.pattern(RGB_REGEX)]),
        ],
        bValue: [
            0,
            Validators.compose([Validators.required, Validators.min(RGB_MIN), Validators.max(RGB_MAX), Validators.pattern(RGB_REGEX)]),
        ],
    });

    // Value changes of the hex input
    hexValueChange$: Observable<string> = this.colorValueForm.controls["hexValue"].valueChanges.pipe(
        debounceTime(USER_DEBOUNCE),
        filter((hexValue) => this.colorValueForm.controls["hexValue"].valid),
        distinctUntilChanged(),
        tap((hexValue) => {
            const rgbEquivalent: RGBRatio = this.colorService.hexToRGB(hexValue);
            this.setRGBInputs(rgbEquivalent);
            this.colorChange.emit({
                type: BrandingColorFormat.HEX,
                value: COLOR_TO_STRING(BrandingColorFormat.HEX, hexValue),
            });
        }),
    );

    // Value Changes of the RGB Inputs
    rgbValueChange$: Observable<RGBRatio> = merge(
        this.colorValueForm.controls["rValue"].valueChanges.pipe(debounceTime(USER_DEBOUNCE)),
        this.colorValueForm.controls["gValue"].valueChanges.pipe(debounceTime(USER_DEBOUNCE)),
        this.colorValueForm.controls["bValue"].valueChanges.pipe(debounceTime(USER_DEBOUNCE)),
    ).pipe(
        filter(
            (value) =>
                this.colorValueForm.controls["rValue"].valid &&
                this.colorValueForm.controls["gValue"].valid &&
                this.colorValueForm.controls["bValue"].valid,
        ),
        map((value) => ({
            r: this.colorValueForm.controls["rValue"].value,
            g: this.colorValueForm.controls["gValue"].value,
            b: this.colorValueForm.controls["bValue"].value,
        })),
        distinctUntilChanged((prev, curr) => prev.r === curr.r && prev.g === curr.g && prev.b === curr.b),
        tap((value) => {
            const hexEquivalent: string = this.colorService.rgbToHex(value);
            this.setHexInput(hexEquivalent);
            this.colorChange.emit({
                type: BrandingColorFormat.RGB,
                value: COLOR_TO_STRING(BrandingColorFormat.RGB, value),
            });
        }),
    );

    content$: Observable<string>;
    overview$: Observable<string>;

    subscriptions: Subscription[] = [];

    rInputAriaLabel: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.branding.aria.r_input");
    gInputAriaLabel: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.branding.aria.g_input");
    bInputAriaLabel: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.branding.aria.b_input");
    formatInputAriaLabel: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.branding.aria.input_color_format");

    constructor(
        private readonly builder: FormBuilder,
        private readonly colorService: ColorControlService,
        private readonly languageService: LanguageService,
    ) {}

    /**
     * Initialize subscriptions
     */
    ngOnInit(): void {
        // Check whether browser is Internet Explorer or not
        const agent = window.navigator.userAgent.toLowerCase();
        if (agent.indexOf("trident") > -1) {
            this.isIE = true;
        }

        this.subscriptions.push(
            this.currentBranding$
                .pipe(
                    filter((branding) => branding != null),
                    // Update the color inputs based ont he branding
                    tap((branding) => this.updateInputs(branding)),
                )
                .subscribe(),
        );

        // Update the sampleHex with the branding
        this.sampleHex$ = this.currentBranding$.pipe(
            filter((branding) => branding != null),
            map((branding) => {
                switch (branding.colorFormat) {
                    case BrandingColorFormat.HEX:
                        return STRING_TO_COLOR(branding.colorFormat, branding.colorCode) as string;
                    case BrandingColorFormat.RGB:
                        return this.colorService.rgbToHex(STRING_TO_COLOR(branding.colorFormat, branding.colorCode) as RGBRatio);
                }
            }),
            map((color) => (color && color.length > 0 && color.charAt(0) === "#" ? color : `#${color}`)),
        );
        // Generate copy for the page
        this.content$ = this.groupName$.pipe(startWith(""));

        // Generate the copy for the page and replace the name
        this.overview$ = combineLatest([this.content$, this.domainType$]).pipe(
            map(([content, domainName]) => {
                const brokerageContent: string = this.languageService.fetchPrimaryLanguageValue(
                    "primary.portal.brandingColorForm.brokerage.content",
                );
                const accountContent: string = this.languageService
                    .fetchPrimaryLanguageValue("primary.portal.brandingColorForm.content")
                    .replace("<CompanyName>", content);
                return domainName === "BROKERAGE" ? brokerageContent : accountContent;
            }),
        );

        // Subscribe to observables that are not subscribed to in the template
        this.subscriptions.push(this.hexValueChange$.subscribe());
        this.subscriptions.push(this.rgbValueChange$.subscribe());
    }

    /**
     * Unsubscribe from the observables
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe);
    }

    /**
     * Update the inputs based on the branding in (observable pipe function)
     *
     * @param branding The branding to analyze for input updates
     */
    private updateInputs(branding: DereferencedBrandingModel): void {
        this.formatForm.controls["format"].setValue(branding.colorFormat);
        switch (branding.colorFormat) {
            case BrandingColorFormat.HEX: {
                const hexColor: string = STRING_TO_COLOR(branding.colorFormat, branding.colorCode) as string;
                this.setHexInput(hexColor);
                this.setRGBInputs(this.colorService.hexToRGB(hexColor));
                break;
            }
            case BrandingColorFormat.RGB: {
                const rgbColor: RGBRatio = STRING_TO_COLOR(branding.colorFormat, branding.colorCode) as RGBRatio;
                this.setRGBInputs(rgbColor);
                this.setHexInput(this.colorService.rgbToHex(rgbColor));
                break;
            }
        }
    }

    /**
     * Update the RGB inputs with a new set of values, used by the hex value changes to keep the inputs in sync
     *
     * @param rgb the new ratio to set the inputs to
     */
    private setRGBInputs(rgb: RGBRatio): void {
        this.colorValueForm.controls["rValue"].setValue(rgb.r, { emitEvent: false });
        this.colorValueForm.controls["bValue"].setValue(rgb.b, { emitEvent: false });
        this.colorValueForm.controls["gValue"].setValue(rgb.g, { emitEvent: false });
    }

    /**
     * Update the Hex input with a new values, used by the RGB value changes to keep the inputs in sync
     *
     * @param hexValue the new Hex value set the inputs to
     */
    private setHexInput(hexValue: string): void {
        this.colorValueForm.controls["hexValue"].setValue(hexValue, { emitEvent: false });
    }
}

/**
 * Helper interface to qualify a color value
 */
interface ColorFormat {
    type: BrandingColorFormat;
    value: string;
}
