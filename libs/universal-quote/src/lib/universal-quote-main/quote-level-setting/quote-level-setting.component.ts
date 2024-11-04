import { Component, OnInit, Output, EventEmitter, OnDestroy, ViewChild, ElementRef, Input } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { ResetModalComponent } from "../reset-modal/reset-modal.component";
import { Subject } from "rxjs";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { first, takeUntil, tap } from "rxjs/operators";
import { UniversalService, QuoteLevelSetting } from "../universal.service";
import { AdminPreferenceQuoteSetting, CountryState } from "@empowered/constants";
import { Store } from "@ngxs/store";

import {
    UniversalQuoteState,
    RestictedConfigurations,
    QuoteSettingsSchema,
    SetQuoteLevelSetting,
    RemovePlanPricing,
    SetQuickQuotePlans,
    ResetQuoteLevelSettingZipCode,
    SetAdminPreference,
    UtilService,
} from "@empowered/ngxs-store";
import { DropDownPortalComponent } from "@empowered/ui";
import { OverlayRef, Overlay, OverlayConfig, OverlayPositionBuilder } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { MoreSettingsComponent } from "../more-settings/more-settings.component";
import { UserService } from "@empowered/user";
import { CredentialProperties, QuickQuotePlanDetails } from "@empowered/constants";

@Component({
    selector: "empowered-quote-level-setting",
    templateUrl: "./quote-level-setting.component.html",
    styleUrls: ["./quote-level-setting.component.scss"],
})
export class QuoteLevelSettingComponent implements OnInit, OnDestroy {
    resetButtonDialogRef: MatDialogRef<ResetModalComponent>;
    @Output() settingChanged: EventEmitter<any> = new EventEmitter();
    @Input() backdropAnchor: HTMLElement;
    languageStrings: Record<string, string>;
    allStates: CountryState[];
    channels: string[];
    allRiskClasses = [];
    allPaymentFrequency = [];
    paymentFrequency = [];
    riskClasses = [];
    aflacCarrierId = 1;
    settingForm: FormGroup;
    preferenceConstant = ["state", "channel", "pay_frequency", "job_class"];
    payrollDirectBillConstant = "PAYROLLDIRECTBILL";
    payrollConstant = "PAYROLL";
    payrollDirectBillConstantWithSpace = "PAYROLL DIRECT BILL";
    riskClassConstant = "riskClass";
    payFrequencyConstant = "payFrequency";
    configurations: RestictedConfigurations[];
    matSelectPanel: QuoteLevelSetting;
    adminPreference: QuoteLevelSetting;
    adminResidenceState: string;
    genders: string[];
    overlayRef: OverlayRef;
    showSpinner: boolean;
    settingsPortalIsOpen: boolean;
    settingsApplied: boolean;
    settingsChanged = false;
    @ViewChild("statePanel", { read: DropDownPortalComponent, static: true }) statePanel: DropDownPortalComponent;
    @ViewChild("channelPanel", { read: DropDownPortalComponent, static: true }) channelPanel: DropDownPortalComponent;
    @ViewChild("frequencyPanel", { read: DropDownPortalComponent, static: true })
    frequencyPanel: DropDownPortalComponent;
    @ViewChild("riskClassPanel", { read: DropDownPortalComponent, static: true })
    riskClassPanel: DropDownPortalComponent;
    @ViewChild("expandedViewOrigin", { static: true }) expandedViewOrigin: ElementRef;

    private readonly unsubscribe$ = new Subject<void>();
    adminId: number;
    updateSettingForm: QuoteLevelSetting;
    adminPreferenceQuoteSetting = AdminPreferenceQuoteSetting;
    constructor(
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly universalService: UniversalService,
        private readonly store: Store,
        private readonly utilService: UtilService,
        private readonly fb: FormBuilder,
        private readonly userService: UserService,
        private readonly overlay: Overlay,
        private readonly overlayPositionBuilder: OverlayPositionBuilder,
        private readonly elementref: ElementRef,
    ) {}

    /**
     * Get latest admin contact and preferences and apply each preference to its appropriate form.
     */
    ngOnInit(): void {
        this.getLanguageStrings();
        this.universalService.levelSettingUpdated$.pipe(takeUntil(this.unsubscribe$)).subscribe((updated) => {
            if (updated) {
                this.patchRequiredData();
            }
        });
        this.initializeSettingForm();
        this.matSelectPanel = { state: null, channel: null, payFrequency: null, riskClass: null };
        this.universalService.adminPreferenceUpdated$.pipe(takeUntil(this.unsubscribe$)).subscribe((isUpdated) => {
            if (isUpdated) {
                const preferences = this.store.selectSnapshot(UniversalQuoteState.GetAdminPreferences);
                const stateIndex = preferences.findIndex((key) => key.name === this.preferenceConstant[0]);
                const channelIndex = preferences.findIndex((key) => key.name === this.preferenceConstant[1]);
                const freqIndex = preferences.findIndex((key) => key.name === this.preferenceConstant[2]);
                const riskClassIndex = preferences.findIndex((key) => key.name === this.preferenceConstant[3]);
                const stateName = stateIndex > -1 ? this.getStateName(preferences[stateIndex].value) : null;
                const channelName =
                    channelIndex > -1
                        ? preferences[channelIndex].value.replace(this.payrollDirectBillConstant, this.payrollDirectBillConstantWithSpace)
                        : this.payrollConstant;
                const frequencyName = freqIndex > -1 ? preferences[freqIndex].value : null;
                const riskClassName = riskClassIndex > -1 ? preferences[riskClassIndex].value : null;
                this.initializeSettingForm(stateName, channelName, frequencyName, riskClassName);
                this.updateConfigurations();
                this.adminPreference = {
                    state: this.settingForm.value.state,
                    channel: this.settingForm.value.channel,
                    payFrequency: this.settingForm.value.payFrequency,
                    riskClass: this.settingForm.value.riskClass,
                };
                this.updateSelectedSettings();
            }
        });
        this.universalService.adminContactUpdated$.pipe(takeUntil(this.unsubscribe$)).subscribe((result) => {
            if (result.updated) {
                this.initializeSettingForm(this.getStateName(result.state), this.payrollConstant);
                this.adminResidenceState = result.state;
                if (this.paymentFrequency.length && this.riskClasses.length) {
                    this.adminPreference = {
                        state: result.state,
                        channel: this.payrollConstant,
                        payFrequency: this.paymentFrequency[0].name,
                        riskClass: this.riskClasses[0].name,
                    };
                }
                this.updateConfigurations();
                this.updateSelectedSettings();
            }
        });
        this.universalService.zeroState$.pipe(takeUntil(this.unsubscribe$)).subscribe((updated) => {
            if (updated && this.allStates.length && this.paymentFrequency.length && this.riskClasses.length) {
                this.initializeSettingForm(
                    this.allStates[0].name,
                    this.payrollConstant,
                    this.paymentFrequency[0].name,
                    this.riskClasses[0].name,
                );
                this.adminPreference = {
                    state: this.allStates[0].name,
                    channel: this.payrollConstant,
                    payFrequency: this.paymentFrequency[0].name,
                    riskClass: this.riskClasses[0].name,
                };
                this.updateConfigurations();
                this.updateSelectedSettings();
            }
        });
        this.universalService.cdkSelectionUpdate$.pipe(takeUntil(this.unsubscribe$)).subscribe((action) => {
            if (action) {
                this.overlayRef.dispose();
            }
        });
        this.getAdminId();
    }
    /**
     * Reset all settings and quick quote plans.
     */
    resetButton(): void {
        this.resetButtonDialogRef = this.dialog.open(ResetModalComponent, {
            backdropClass: "backdrop-blur",
            maxWidth: "600px", // 600px max-width based on the definition in abstract.
            panelClass: "reset-account",
        });
        this.resetButtonDialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                if (resp.action === "reset") {
                    this.resetSetting("state");
                    this.resetSetting("channel");
                    this.resetSetting("payFrequency");
                    this.resetSetting("riskClass");
                    this.settingChanged.emit({ eligibleSubscribers: undefined });
                    const setting = this.store.selectSnapshot(UniversalQuoteState.GetQuoteLevelSettings);
                    const stateName = this.getAbbreviation(setting.state);
                    this.showSpinner = true;
                    this.store
                        .dispatch(
                            new SetQuickQuotePlans(stateName, setting.channel, setting.payFrequency, setting.riskClass, [
                                QuickQuotePlanDetails.MIN_ELIGIBLE_SUBSCRIBERS,
                                QuickQuotePlanDetails.MAX_ELIGIBLE_SUBSCRIBERS,
                            ]),
                        )
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((response) => {
                            this.showSpinner = false;
                            this.universalService.planSelectionUpdated$.next(true);
                        });
                }
            });
    }
    // Function to initialize the quote level setting form
    initializeSettingForm(state?: string, channel?: string, payFrequency?: string, riskClass?: string): void {
        this.settingForm = this.fb.group({
            state: [state, Validators.required],
            channel: [channel, Validators.required],
            payFrequency: [payFrequency, Validators.required],
            riskClass: [riskClass, Validators.required],
        });
        this.updateSettingForm = this.getUpdatedSettingFormValue();
    }
    // Function to get the name of the states
    getStateName(stateAbbreviation: string): string {
        const index = this.allStates.findIndex((states) => states.abbreviation === stateAbbreviation);
        return this.allStates[index].name;
    }
    // Function to get the abbreviation of the state
    getAbbreviation(stateName: string): string {
        const index = this.allStates.findIndex((states) => states.name === stateName);
        return this.allStates[index].abbreviation;
    }
    // Function to patch the required data to global variables
    patchRequiredData(): void {
        const payload = this.store.selectSnapshot(UniversalQuoteState.GetLevelSettings);
        this.channels = this.store.selectSnapshot(UniversalQuoteState.GetChannels);
        this.configurations = this.store.selectSnapshot(UniversalQuoteState.GetConfigurations);
        this.allStates = payload.states;
        this.paymentFrequency = payload.payFrequency;
        this.riskClasses = payload.riskClasses;
        this.allPaymentFrequency = payload.payFrequency;
        this.allRiskClasses = payload.riskClasses;
    }
    // Function to update quote level setting based on channel
    updateConfigurations(): void {
        const channel = this.settingForm.value.channel;
        const index = this.configurations.findIndex((config) => config.channel.toUpperCase() === channel);
        if (index > -1) {
            const classes = this.utilService.copy(this.allRiskClasses);
            const frequency = this.utilService.copy(this.allPaymentFrequency);
            this.riskClasses = classes.filter((risk) => this.configurations[index].allowedRiskValues.includes(risk.name));
            this.paymentFrequency = frequency.filter((freq) => this.configurations[index].allowedPayFrequency.includes(freq.frequencyType));
            const selectedFrequency = this.settingForm.value.payFrequency;
            const selectedJobClass = this.settingForm.value.riskClass;
            if (this.paymentFrequency.findIndex((freq) => freq.name === selectedFrequency) === -1 && this.paymentFrequency.length) {
                this.settingForm.controls.payFrequency.setValue(this.paymentFrequency[0].name);
            }
            if (this.riskClasses.findIndex((jobClass) => jobClass.name === selectedJobClass) === -1 && this.riskClasses.length) {
                this.settingForm.controls.riskClass.setValue(this.riskClasses[0].name);
            }
        }
        const setting: QuoteSettingsSchema = {
            state: this.settingForm.value.state,
            channel: this.settingForm.value.channel.replace(/\s/g, ""),
            riskClass: this.settingForm.value.riskClass,
            payFrequency: this.settingForm.value.payFrequency,
        };
        this.updateSettingToStore(setting);
    }

    /**
     * Apply the setting upon submission.
     * @param settingName setting that has been modified and submitted
     */
    applySetting(settingName: string): void {
        this.settingsChanged = true;
        this.updateSettingForm = this.getUpdatedSettingFormValue();
        this.settingForm.controls[settingName].setValue(this.settingForm.value[settingName]);
        if (settingName === AdminPreferenceQuoteSetting.STATE) {
            this.clearZipOnNewStateSelection(this.settingForm.value.state);
        }
        this.updateConfigurations();
        this.panelOperation();
        this.universalService.updateEliminationPeriod({});
    }
    // Function to update selected settings
    updateSelectedSettings(): void {
        this.matSelectPanel.state = this.settingForm.value.state;
        this.matSelectPanel.channel = this.settingForm.value.channel;
        this.matSelectPanel.payFrequency = this.settingForm.value.payFrequency;
        this.matSelectPanel.riskClass = this.settingForm.value.riskClass;
    }
    // Function to emit data to parent component
    updateParent(payload: QuoteLevelSetting): void {
        const formData: QuoteLevelSetting = this.utilService.copy(payload);
        formData.state = this.getAbbreviation(payload.state);
        if (formData.channel) {
            formData.channel = formData.channel.replace(/ /g, "");
        }
        this.settingChanged.emit(formData);
        this.updateSettingToStore(payload);
        this.updateConfigurations();
    }
    /**
     * Function to close the drop down portal
     */
    closePanel(): void {
        this.statePanel.hide();
        this.channelPanel.hide();
        this.frequencyPanel.hide();
        this.riskClassPanel.hide();
    }
    // Function to update form control values to default if user select any values but not click on apply
    panelChange(isOpen: boolean, settingName: string): void {
        if (!isOpen) {
            this.settingForm.controls[settingName].setValue(this.matSelectPanel[settingName]);
        }
    }
    resetSetting(settingName: string): void {
        // resets the form-control so that form-control is not dirty on click of reset
        this.settingForm.controls[settingName].reset();
        if (settingName === this.payFrequencyConstant) {
            if (
                this.paymentFrequency.findIndex((freq) => freq.name === this.adminPreference[settingName]) === -1 &&
                this.paymentFrequency.length
            ) {
                this.settingForm.controls.payFrequency.setValue(this.paymentFrequency[0].name);
            } else {
                this.settingForm.controls[settingName].setValue(this.adminPreference[settingName]);
            }
        } else if (settingName === this.riskClassConstant) {
            if (
                this.riskClasses.findIndex((jobClass) => jobClass.name === this.adminPreference[settingName]) === -1 &&
                this.riskClasses.length
            ) {
                this.settingForm.controls.riskClass.setValue(this.riskClasses[0].name);
            } else {
                this.settingForm.controls[settingName].setValue(this.adminPreference[settingName]);
            }
        } else {
            this.settingForm.controls[settingName].setValue(this.adminPreference[settingName]);
        }
        this.panelOperation();
    }
    /**
     *  Function to update changed setting
     */
    panelOperation(): void {
        this.updateSelectedSettings();
        this.updateParent(this.settingForm.value);
        this.updateSettingForm = this.getUpdatedSettingFormValue();
        if (this.settingsPortalIsOpen) {
            this.closePanel();
        }
    }

    /**
     * Get administrator's ID.
     */
    getAdminId(): void {
        this.userService.credential$
            .pipe(
                tap((credential) => {
                    if (CredentialProperties.PRODUCER_ID in credential) {
                        this.adminId = credential[CredentialProperties.PRODUCER_ID];
                    } else if (CredentialProperties.ADMIN_ID in credential) {
                        this.adminId = credential[CredentialProperties.ADMIN_ID];
                    }
                    this.store.dispatch(new SetAdminPreference(this.adminId));
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Update UniversalQuoteState in two places (quoteSetting & adminPreference) with new settings.
     * @param payload quote level settings that align with admin preferences
     */
    updateSettingToStore(payload: QuoteLevelSetting): void {
        const setting: QuoteSettingsSchema = {
            state: payload.state,
            channel: payload.channel,
            riskClass: payload.riskClass,
            payFrequency: payload.payFrequency,
        };
        this.store.dispatch(new SetQuoteLevelSetting(setting, false, true));
        this.store.dispatch(new SetAdminPreference(this.adminId));
        this.store.dispatch(new RemovePlanPricing());
    }

    /**
     * Clear zip code in store if new state has been selected.
     *
     * @param state new state selected
     */
    clearZipOnNewStateSelection(state: string): void {
        const store = this.store.selectSnapshot(UniversalQuoteState.GetQuoteLevelSettings);
        if (state && store && store.state && state !== store.state) {
            this.store.dispatch(new ResetQuoteLevelSettingZipCode());
        }
    }

    /**
     * Initialize configurations and data for more settings modal. Pass along emission
     * of eligible employees value (only emits when modified) for proper plan filtering.
     */
    openMoreSetting(): void {
        const bodyElement = document.querySelector("body");
        bodyElement.classList.add("negate-blur");

        const positionStrategy = this.overlayPositionBuilder
            .flexibleConnectedTo(this.elementref)
            .withPositions([
                {
                    originX: "end",
                    originY: "bottom",
                    overlayX: "end",
                    overlayY: "top",
                },
            ])
            .withLockedPosition(true)
            .setOrigin(this.expandedViewOrigin);

        const overlayConfig = new OverlayConfig({
            hasBackdrop: true,
            positionStrategy,
            scrollStrategy: this.overlay.scrollStrategies.reposition(),
            width: 450,
            height: 520,
            backdropClass: "expanded-card-view",
            panelClass: "quick-quote-settings-view",
        });

        const popupComponentPortal = new ComponentPortal(MoreSettingsComponent);
        this.overlayRef = this.overlay.create(overlayConfig);
        const ref = this.overlayRef.attach(popupComponentPortal);
        ref.instance.eligibleSubscribersChanged
            .asObservable()
            .pipe(
                tap((change) => this.settingChanged.emit({ eligibleSubscribers: change })),
                first(),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.overlayRef.backdropClick().subscribe(() => {
            this.overlayRef.dispose();
            bodyElement.classList.remove("negate-blur");
        });
    }
    // Function to fetch the language string from DB
    getLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.quickQuote.resetnote",
            "primary.portal.quickQuote.planName",
            "primary.portal.quickQuote.title",
            "primary.portal.quickQuote.settings",
            "primary.portal.quickQuote.Channel",
            "primary.portal.quickQuote.payroll",
            "primary.portal.quickQuote.benefit",
            "primary.portal.quickQuote.rider",
            "primary.portal.quickQuote.method",
            "primary.portal.quickQuote.facetoface",
            "primary.portal.quickQuote.state",
            "primary.portal.quickQuote.georgia",
            "primary.portal.quickQuote.jobClass",
            "primary.portal.quickQuote.more",
            "primary.portal.quickQuote.annual",
            "primary.portal.quickQuote.reset",
            "primary.portal.quickQuote.accident",
            "primary.portal.quickQuote.includedInQuote",
            "primary.portal.quickQuote.details",
            "primary.portal.quickQuote.invidualsp",
            "primary.portal.quickQuote.invidual",
            "primary.portal.quickQuote.oneParent",
            "primary.portal.quickQuote.twoParent",
            "primary.portal.quickQuote.total",
            "primary.portal.quickQuote.perMonth",
            "primary.portal.quickQuote.payFrequency",
            "primary.portal.common.apply",
            "primary.portal.common.select",
        ]);
    }
    /**
     * Method to close and reset the settings dropdown
     * @param open: boolean indicating whether portal is open (shown)
     * @param settingName: string indicating selected setting name
     */
    settingsOpened(open: boolean, settingName: string): void {
        this.settingsPortalIsOpen = open;
        if (!open && !this.settingsApplied && !this.settingsChanged) {
            // if value is changed in dropdown and not click on apply button and click outside dropdown
            // then reset dropdown value to its previous selected value
            this.resetSettingFormValue(settingName);
        } else if (open) {
            this.settingsChanged = false;
            this.settingsApplied = false;
        }
    }

    /**
     * Method to reset value in settingForm according to selected settingName
     * @param settingName: string indicating selected setting name
     */
    resetSettingFormValue(settingName: string): void {
        // resets the form-control so that form-control is not dirty after clicking outside dropdown
        this.settingForm.controls[settingName].reset();
        if (settingName === AdminPreferenceQuoteSetting.STATE) {
            this.settingForm.controls[settingName].setValue(this.updateSettingForm.state);
        } else if (settingName === AdminPreferenceQuoteSetting.CHANNEL) {
            this.settingForm.controls[settingName].setValue(this.updateSettingForm.channel);
        } else if (settingName === AdminPreferenceQuoteSetting.JOB_CLASS) {
            this.settingForm.controls[settingName].setValue(this.updateSettingForm.riskClass);
        } else if (settingName === AdminPreferenceQuoteSetting.PAY_FREQUENCY) {
            this.settingForm.controls[settingName].setValue(this.updateSettingForm.payFrequency);
        }
        this.panelOperation();
    }
    /**
     * Method to get updated setting form value
     * @returns updated settingForm value
     */
    getUpdatedSettingFormValue(): QuoteLevelSetting {
        const updateSettingFormValue: QuoteLevelSetting = {
            state: this.settingForm.value.state,
            payFrequency: this.settingForm.value.payFrequency,
            riskClass: this.settingForm.value.riskClass,
            channel: this.settingForm.value.channel,
        };
        return updateSettingFormValue;
    }
    // ng life cycle hook
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
