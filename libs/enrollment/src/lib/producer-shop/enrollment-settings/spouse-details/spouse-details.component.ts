import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { DropDownPortalComponent, SettingsDropdownComponentStore, SettingsDropdownContent } from "@empowered/ui";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import { AppFlowService } from "@empowered/ngxs-store";
import { NGRXStore } from "@empowered/ngrx-store";
import { Router } from "@angular/router";
import { LanguageService } from "@empowered/language";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AsyncStatus, Gender, SettingsDropdownName, TobaccoInformation } from "@empowered/constants";
import { Observable, Subject, combineLatest } from "rxjs";
import { select } from "@ngrx/store";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";
import { map, mapTo, startWith, takeUntil, tap } from "rxjs/operators";
import { UrlFlow } from "../../producer-shop.model";
import { SpouseDetails } from "../../services/producer-shop-component-store/producer-shop-component-store.model";
import { DisplayGender } from "../more-settings/more-settings.model";

@Component({
    selector: "empowered-spouse-details",
    templateUrl: "./spouse-details.component.html",
    styleUrls: ["./spouse-details.component.scss"],
})
export class SpouseDetailsComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() portalRef!: DropDownPortalComponent;

    spouseExists: boolean;

    genderDisplays$ = this.ngrxStore
        .onAsyncValue(select(SharedSelectors.getAllGenders))
        .pipe(map((genders) => this.getGenderDisplays(genders)));

    mpGroup$ = this.ngrxStore.pipe(select(AccountsSelectors.getSelectedMPGroup));

    selectedSpouseDetails$ = this.producerShopComponentStoreService.selectSpouseDetailsOnAsyncValue();
    selectedTobaccoInformation$ = this.producerShopComponentStoreService.selectTobaccoInformationOnAsyncValue();

    existingTobaccoInformation: TobaccoInformation;

    // Config to enable the tobacco status in more settings
    private readonly isTobaccoFormEnabled$ = this.ngrxStore.onAsyncValue(select(SharedSelectors.getTobaccoConfigValue));

    // FormControls are being created since we have nested FormGroups (Main form and Tobacco form)
    // To better set the each FormControl to the correct FormGroup,
    // FormControls are created separately from when FormGroups are created
    spouseAge = this.fb.control("");
    spouseGender = this.fb.control("", Validators.required);
    spouseIsTobaccoUser = this.fb.control(false, Validators.required);

    // All FormControls that don't involve tobacco
    mainForm: FormGroup = this.fb.group({
        spouseAge: this.spouseAge,
        spouseGender: this.spouseGender,
    });

    // All FormControls that involves tobacco
    tobaccoForm = this.fb.group({
        spouseIsTobaccoUser: this.spouseIsTobaccoUser,
    });

    // form has two FormGroups to better handle disabling tobacco FormControls vs non-tobacco FormControls
    form: FormGroup = this.fb.group({
        mainForm: this.mainForm,
        tobaccoForm: this.tobaccoForm,
    });

    // Disabled form message that shows when mainForm is disabled
    disabledFormMessage: string;

    // Translations
    languageStrings: Record<string, string>;

    // Used to clean up rxjs subscriptions
    private readonly unsubscriber$ = new Subject<void>();

    // Used to detect when to revert FormGroup
    private readonly onRevert$ = new Subject<void>();
    // Used to detect when to reset FormGroup
    private readonly onReset$ = new Subject<void>();
    // Used to detect when to apply FormGroup
    private readonly onApply$ = new Subject<void>();
    // Used to detect when to show FormGroup
    private readonly onShow$ = new Subject<void>();
    showResetButton$!: Observable<boolean>;

    constructor(
        protected readonly settingsDropdownStore: SettingsDropdownComponentStore,
        private readonly fb: FormBuilder,
        private readonly languageService: LanguageService,
        private readonly router: Router,
        private readonly ngrxStore: NGRXStore,
        private readonly appFlowService: AppFlowService,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
    ) {
        super(settingsDropdownStore, SettingsDropdownName.SPOUSE);
        // Translations
        this.languageStrings = this.getLanguageStrings();

        // Disabled form message that shows when mainForm is disabled
        this.disabledFormMessage = this.getDisabledFormMessage(this.languageStrings);

        combineLatest([
            // Enable / disable main form (everything except tobacco related FormControls)
            // Based on whether or not there is a selected mpGroup
            this.mpGroup$,
            this.selectedSpouseDetails$.pipe(map(({ spouseAge }) => !!spouseAge)),
            this.isTobaccoFormEnabled$,
        ])
            .pipe(
                tap(([mpGroup, spouseExists, isTobaccoFormEnabled]) => {
                    this.spouseExists = spouseExists;
                    this.setFormDisabledState(!mpGroup, mpGroup && spouseExists, isTobaccoFormEnabled);
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Listen for values from NGRX store to populate forms.
        // Handle initializing / reverting form
        combineLatest([
            // Reset happens on hidden instead of shown since form change animations might show during the dropdown rendering
            // Reset form whenever revert button is clicked
            this.onRevert$.pipe(mapTo(true), startWith(false)),
            this.selectedSpouseDetails$,
            this.selectedTobaccoInformation$,
        ])
            .pipe(
                // Ignore first value since we don't case about the value emitted by onRevert$
                tap(([revert, spouseDetails, tobaccoInformation]) => {
                    this.initializeForm(spouseDetails, tobaccoInformation);
                    this.existingTobaccoInformation = tobaccoInformation;

                    if (revert) {
                        // Then mark form as pristine to remove dirty flag
                        this.form.markAsPristine();
                    }
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();
    }

    ngOnInit(): void {
        super.onInit();
        this.showResetButton$ = this.settingsDropdownStore.showResetButtonOnDirty(this.form, this.onRevert$, this.onReset$, this.onApply$);
    }

    /**
     * Get a Record of translations using LanguageService
     *
     * @returns {Record<string, string>} Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.common.placeholderSelect",
            "primary.portal.accountPendingEnrollments.employee",
            "primary.portal.customer.title.single",
            "primary.portal.shopQuote.specificPersonDisabledQuoteSettingsMessage",
            "primary.portal.coverage.unknown",
            "primary.portal.register.personalInfo.male",
            "primary.portal.register.personalInfo.female",
            "primary.portal.shopQuote.specificPersonDisabledAgeAndGenderMessage",
        ]);
    }

    /**
     * Uses a Languages Record to get which disabled form message to show based on url
     *
     * @param languageStrings source of translations
     * @returns {string} Disabled message for mon-alert when main form is disabled
     */
    getDisabledFormMessage(languageStrings: Record<string, string>): string {
        // If url relates to payroll, user is an Employee. Else user is a Customer
        const translationBasedOnUrl = this.router.url.includes(UrlFlow.PAYROLL)
            ? languageStrings["primary.portal.accountPendingEnrollments.employee"]
            : languageStrings["primary.portal.customer.title.single"];

        // Return message to prompt user to go to settings for <type> profile based on url
        return languageStrings["primary.portal.shopQuote.specificPersonDisabledAgeAndGenderMessage"].replace(
            "#type",
            translationBasedOnUrl.toLowerCase(),
        );
    }

    /**
     * Set the state of FormGroup
     *
     * @param spouseDetails {SpouseDetails} - initializes main form
     * @param tobaccoInformation {TobaccoInformation} - initalizes tobacco form
     */
    initializeForm(spouseDetails: SpouseDetails, tobaccoInformation: TobaccoInformation): void {
        this.mainForm.setValue({
            spouseAge: this.spouseExists ? spouseDetails?.spouseAge : null,
            spouseGender: spouseDetails?.spouseGender ?? null,
        });

        this.tobaccoForm.setValue({
            spouseIsTobaccoUser: tobaccoInformation?.spouseIsTobaccoUser,
        });
    }

    /**
     * Enables / disables main form
     *
     * @param enableMainForm {boolean} that determines if main form is enabled (excluding tobacco checkboxes)
     * @param spouseExists {boolean}
     * @param isTobaccoFormEnabled {boolean} if true, enable spouse tobacco form
     */
    setFormDisabledState(enableMainForm: boolean, spouseExists: boolean, isTobaccoFormEnabled: boolean): void {
        if (enableMainForm) {
            this.mainForm.enable();
        } else {
            this.mainForm.disable();
        }
        if (isTobaccoFormEnabled) {
            this.tobaccoForm.enable();
            if (!spouseExists) {
                this.spouseIsTobaccoUser.disable();
            }
        } else {
            this.tobaccoForm.disable();
        }
    }

    /**
     * Provides language strings for each known gender enum value.
     * Falls back to enum value if no known translation is found.
     *
     * @params genders {Gender[]} - gender values that come from static endpoint
     */
    getGenderDisplays(genders: Gender[]): DisplayGender[] {
        const displayMap = {
            [Gender.MALE]: this.languageStrings["primary.portal.register.personalInfo.male"],
            [Gender.FEMALE]: this.languageStrings["primary.portal.register.personalInfo.female"],
            [Gender.UNKNOWN]: this.languageStrings["primary.portal.coverage.unknown"],
        };

        return genders.map((gender) => ({
            gender,
            display: displayMap[gender] ?? gender,
        }));
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     *
     * Is used for reverting FormGroup on hide.
     */
    onHide(): void {
        this.onRevert();
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     * We are required to provide this method since SettingsDropdownContent is an abstract class.
     *
     * Not used.
     */
    onShow(): void {
        this.onShow$.next();
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     *
     * Is used to emit when to revert FormGroup
     */
    onRevert(): void {
        this.onRevert$.next();
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     *
     * Is used to emit when to reset FormGroup
     */
    onReset(): void {
        this.onRevert();
        this.portalRef?.hide();
    }

    /**
     * Uses form value to set latest tobacco status. Should close dropdown.
     */
    onApply(): void {
        // Trigger for validity and render error messages
        this.form.markAllAsTouched();

        if (!this.form.valid) {
            return;
        }

        if (!this.mainForm.disabled) {
            const spouseDetails: SpouseDetails = {
                spouseAge: this.mainForm.value.spouseAge,
                spouseGender: this.mainForm.value.spouseGender,
            };

            this.producerShopComponentStoreService.setSpouseDetails({
                status: AsyncStatus.SUCCEEDED,
                value: spouseDetails,
                error: null,
            });
        }

        if (!this.tobaccoForm.disabled) {
            const tobaccoInformation: TobaccoInformation = {
                memberIsTobaccoUser: this.existingTobaccoInformation?.memberIsTobaccoUser,
                spouseIsTobaccoUser: this.tobaccoForm.value.spouseIsTobaccoUser ?? false,
            };

            this.producerShopComponentStoreService.setTobaccoInformation({
                status: AsyncStatus.SUCCEEDED,
                value: tobaccoInformation,
                error: null,
            });

            // Handle state outside of the rewrite for tobacco information
            this.appFlowService.setLatestTobaccoStatus({
                tobaccoUser: this.existingTobaccoInformation?.memberIsTobaccoUser,
                spouseTobaccoUser: this.spouseIsTobaccoUser.value,
                spouseTobaccoUpdated: this.spouseIsTobaccoUser.dirty,
            });
        }

        this.portalRef?.hide();

        this.onApply$.next();
    }

    /**
     * Returns unique identifier for DisplayGender.
     * trackBy for *ngFor involving DisplayGender used to improve performance.
     *
     * @param index {number} index of the iteration
     * @param displayGender {DisplayGender} current DisplayGender in iteration
     * @returns unique identifier for DisplayGender
     */
    trackByDisplayGenderDisplay(index: number, displayGender: DisplayGender): string {
        return displayGender.display;
    }

    /**
     * Call base class instance's ngOnDestroy.
     *
     * Clean up subscriptions.
     */
    ngOnDestroy(): void {
        super.ngOnDestroy();

        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
}
