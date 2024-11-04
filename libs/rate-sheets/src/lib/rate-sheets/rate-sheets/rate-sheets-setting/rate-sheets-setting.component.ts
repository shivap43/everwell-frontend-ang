import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { BackdropStyleInput, SettingsDropdownName } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { SettingsDropdownMeta } from "@empowered/ui";
import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { RateSheetsComponentStoreService } from "../rate-sheets-component-store/rate-sheets-component-store.service";
import { TitleCasePipe } from "@angular/common";

@Component({
    selector: "empowered-rate-sheets-setting",
    templateUrl: "./rate-sheets-setting.component.html",
    styleUrls: ["./rate-sheets-setting.component.scss"],
})
export class RateSheetsSettingComponent implements OnInit {
    @Output() resetEvent = new EventEmitter();
    statePortalMeta!: SettingsDropdownMeta;
    channelPortalMeta!: SettingsDropdownMeta;
    paymentFrequencyPortalMeta!: SettingsDropdownMeta;
    jobClassPortalMeta!: SettingsDropdownMeta;
    moreSettingsPortalMeta!: SettingsDropdownMeta;
    readonly languageStrings = this.getLanguageStrings();
    showSpinner = false;

    constructor(
        private readonly languageService: LanguageService,
        private readonly rateSheetsComponentStoreService: RateSheetsComponentStoreService,
        private titleCasePipe: TitleCasePipe,
    ) {}

    /**
     * initializes the component
     */
    ngOnInit(): void {
        // setting up rate-sheet settings' dropdown portals meta
        this.statePortalMeta = this.getMeta(
            SettingsDropdownName.STATE,
            this.rateSheetsComponentStoreService.selectCountryStateOnAsyncValue().pipe(map((state) => state?.name)),
            this.languageStrings["primary.portal.shared.drop-down-modal.opened"],
            `${this.languageStrings["primary.portal.rateSheets.state"]}:`,
        );
        this.channelPortalMeta = this.getMeta(
            SettingsDropdownName.CHANNEL,
            this.rateSheetsComponentStoreService.selectChannelOnAsyncValue().pipe(map((channel) => this.titleCasePipe.transform(channel))),
            this.languageStrings["primary.portal.shared.drop-down-modal.opened"],
            `${this.languageStrings["primary.portal.rateSheets.channel"]}:`,
        );
        this.paymentFrequencyPortalMeta = this.getMeta(
            SettingsDropdownName.PAYMENT_FREQUENCY,
            this.rateSheetsComponentStoreService.selectPaymentFrequencyOnAsyncValue().pipe(map((payFrequency) => payFrequency?.name)),
            this.languageStrings["primary.portal.shared.drop-down-modal.opened"],
            `${this.languageStrings["primary.portal.rateSheets.payFrequency"]}:`,
        );
        this.jobClassPortalMeta = this.getMeta(
            SettingsDropdownName.JOB_CLASS,
            this.rateSheetsComponentStoreService.selectRiskClassOnAsyncValue().pipe(map((riskClass) => riskClass?.name)),
            this.languageStrings["primary.portal.shared.drop-down-modal.opened"],
            `${this.languageStrings["primary.portal.rateSheets.jobClass"]}:`,
        );
        this.moreSettingsPortalMeta = this.getMeta(
            SettingsDropdownName.MORE,
            of(this.languageStrings["primary.portal.rateSheets.more"]),
            this.languageStrings["primary.portal.shared.drop-down-modal.opened"],
        );
    }

    /**
     * Get meta data for a setting dropdown. Params are properties that change.
     * @param triggerValue dynamic value based on dropdown submission
     * @param portalTitle aria title triggered when opening dropdown
     * @param triggerLabel name of dropdown, optional because "More" doesn't follow standard
     * @returns setting dropdown meta data
     */
    getMeta(
        name: SettingsDropdownName,
        triggerValue: Observable<string>,
        portalTitle: string,
        triggerLabel?: string,
    ): SettingsDropdownMeta {
        return {
            name,
            class: "rate-sheet-setting",
            trigger: {
                label: triggerLabel,
                value: triggerValue,
            },
            backdrop: {
                anchor: null,
                style: BackdropStyleInput.LIGHT,
            },
            portal: {
                class: `rate-sheets ${name}`,
                title: portalTitle,
            },
            footer: {
                apply: this.languageStrings["primary.portal.common.apply"],
                reset: this.languageStrings["primary.portal.common.reset"],
            },
        };
    }

    /**
     * Gets language strings using language service
     * @returns language strings
     */
    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.common.reset",
            "primary.portal.common.apply",
            "primary.portal.rateSheets.state",
            "primary.portal.rateSheets.channel",
            "primary.portal.rateSheets.payFrequency",
            "primary.portal.rateSheets.jobClass",
            "primary.portal.rateSheets.more",
            "primary.portal.shared.drop-down-modal.opened",
        ]);
    }

    emitResetEvent(): void {
        this.resetEvent.emit();
    }
}
