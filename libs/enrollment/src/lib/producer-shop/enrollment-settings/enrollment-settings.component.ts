import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { combineLatest, Observable, of, Subject } from "rxjs";

import { LanguageService } from "@empowered/language";
import { SettingsDropdownMeta } from "@empowered/ui";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { select } from "@ngrx/store";
import { EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { map, startWith, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";

import { ProducerShopComponentStoreService } from "../services/producer-shop-component-store/producer-shop-component-store.service";
import {
    ApplicantDetails,
    ProductCoverageDate,
    SpouseDetails,
} from "../services/producer-shop-component-store/producer-shop-component-store.model";

import { EmployerContributionsComponent } from "./employer-contributions/employer-contributions.component";
import { MatDialogRef } from "@angular/material/dialog";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { EmployerContributionsDialogData } from "./enrollment-settings.model";
import {
    CombinedOfferings,
    RiskClass,
    BackdropStyleInput,
    SettingsDropdownName,
    Gender,
    ConfigName,
    TobaccoInformation,
} from "@empowered/constants";
import { EmpoweredModalService } from "@empowered/common-services";
import { StaticUtilService } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

@Component({
    selector: "empowered-enrollment-settings",
    templateUrl: "./enrollment-settings.component.html",
    styleUrls: ["./enrollment-settings.component.scss"],
})
export class EnrollmentSettingsComponent implements OnInit, OnDestroy {
    @Input() backdropAnchor!: HTMLElement;
    @Input() coverageDateBoldConfigEnabled: boolean;

    readonly languageStrings = this.getLanguageStrings();

    locationPortalMeta!: SettingsDropdownMeta;
    enrollmentMethodPortalMeta!: SettingsDropdownMeta;
    coverageStartDatesPortalMeta!: SettingsDropdownMeta;
    occupationClassPortalMeta!: SettingsDropdownMeta;
    morePortalMeta!: SettingsDropdownMeta;
    applicantPortalMeta!: SettingsDropdownMeta;
    spousePortalMeta!: SettingsDropdownMeta;

    employerContributionsDialogRef: MatDialogRef<EmployerContributionsComponent>;

    readonly selectedEnrollmentMethod$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollmentMethodDetail));
    readonly selectedCountryState$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberEnrollmentState));

    readonly selectedProductCoverageDates$ = this.producerShopComponentStoreService.selectProductCoverageDatesOnAsyncValue();

    // #region values from NGRX store
    readonly combinedOfferings$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getSelectedCombinedOfferings));

    readonly coverageDatesLabel$ = combineLatest([this.combinedOfferings$, this.selectedProductCoverageDates$]).pipe(
        map(([combinedOfferings, selectedProductCoverageDates]) =>
            this.getCoverageDatesLabel(combinedOfferings, selectedProductCoverageDates),
        ),
        startWith(this.languageStrings["primary.portal.classes.default"]),
    );

    readonly selectedRiskClasses$ = this.producerShopComponentStoreService.selectRiskClassesOnAsyncValue();
    selectedApplicantDetails$ = this.producerShopComponentStoreService.selectApplicantDetailsOnAsyncValue();
    selectedSpouseDetails$ = this.producerShopComponentStoreService.selectSpouseDetailsOnAsyncValue();
    selectedTobaccoInformation$ = this.producerShopComponentStoreService.selectTobaccoInformationOnAsyncValue();

    // Get selected account data
    private readonly selectedAccount$ = this.ngrxStore.onAsyncValue(select(AccountsSelectors.getSelectedAccount));
    // Get selected member data
    private readonly selectedMemberData$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberProfile));
    // Get selected member flex dollars data (Employer contributions)
    private readonly selectedMemberFlexDollars$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberFlexDollars));
    // Get employer contribution excluded states from config
    private readonly employerContributionExcludedStates$ = this.ngrxStore.onAsyncValue(
        select(SharedSelectors.getEmployerContributionExcludedStates),
    );
    // Used to show/hide view employer contribution button.
    showEmployerContributions$!: Observable<boolean>;
    // Used to open employer contribution dialog
    private readonly openEmployerContributionsDialog$ = new Subject<void>();

    private unsubscriber$ = new Subject<void>();

    ageRepositionConfigEnabled$ = this.staticUtilService.cacheConfigEnabled(ConfigName.AGE_REPOSITION_CONFIG);

    spouseIsTobaccoUser: string;
    memberIsTobaccoUser: string;
    spouseInfo: string;
    memberInfo: string;

    constructor(
        private readonly languageService: LanguageService,
        private readonly ngrxStore: NGRXStore,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly staticUtilService: StaticUtilService,
        private readonly dateService: DateService,
    ) {}

    /**
     * Set all setting dropdown meta data.
     */
    ngOnInit(): void {
        this.enrollmentMethodPortalMeta = this.getMeta(
            SettingsDropdownName.METHOD,
            this.selectedEnrollmentMethod$.pipe(map((enrollmentMethod) => enrollmentMethod.description)),
            this.languageStrings["primary.portal.shared.drop-down-modal.opened"],
            `${this.languageStrings["primary.portal.members.contactLabel.method"]}:`,
        );

        this.locationPortalMeta = this.getMeta(
            SettingsDropdownName.LOCATION,
            this.selectedCountryState$.pipe(map((state) => state?.name)),
            this.languageStrings["primary.portal.shared.drop-down-modal.opened"],
            `${this.languageStrings["primary.portal.accounts.accountList.accountLocationColumn"]}:`,
        );

        const coveragStartDateLanguage = this.coverageDateBoldConfigEnabled
            ? `${this.languageStrings["primary.portal.sidenav.aflacCoverageStart"]}:`
            : `${this.languageStrings["primary.portal.sidenav.coverageDates"]}:`;

        this.coverageStartDatesPortalMeta = this.getMeta(
            SettingsDropdownName.DATES,
            this.coverageDatesLabel$,
            this.languageStrings["primary.portal.shared.drop-down-modal.opened"],
            coveragStartDateLanguage,
        );

        this.occupationClassPortalMeta = this.getMeta(
            SettingsDropdownName.OCCUPATION,
            this.selectedRiskClasses$.pipe(map((riskClasses) => this.getOccupationClassLabel(riskClasses as [RiskClass, RiskClass]))),
            this.languageStrings["primary.portal.shared.drop-down-modal.opened"],
            this.languageStrings["primary.portal.enrollment.enrollment-settings.occupation-class"],
        );

        this.morePortalMeta = this.getMeta(
            SettingsDropdownName.MORE,
            of(this.languageStrings["primary.portal.shopQuote.more"]),
            this.languageStrings["primary.portal.shared.drop-down-modal.opened"],
        );

        this.applicantPortalMeta = this.getMeta(
            SettingsDropdownName.APPLICANT,
            combineLatest([this.selectedApplicantDetails$, this.selectedTobaccoInformation$]).pipe(
                map(([selectedApplicantDetails, selectedTobaccoInformation]) =>
                    this.getApplicantOrSpouseInfo(
                        SettingsDropdownName.APPLICANT,
                        selectedApplicantDetails,
                        null,
                        selectedTobaccoInformation,
                    ),
                ),
            ),
            this.languageStrings["primary.portal.shared.drop-down-modal.opened"],
            `${this.languageStrings["primary.portal.pendedBusiness.resolveApplicationModal.applicant"]}:`,
        );

        this.spousePortalMeta = this.getMeta(
            SettingsDropdownName.SPOUSE,
            combineLatest([this.selectedSpouseDetails$, this.selectedTobaccoInformation$]).pipe(
                map(([selectedSpouseDetails, selectedTobaccoInformation]) =>
                    this.getApplicantOrSpouseInfo(SettingsDropdownName.SPOUSE, null, selectedSpouseDetails, selectedTobaccoInformation),
                ),
            ),
            this.languageStrings["primary.portal.shared.drop-down-modal.opened"],
            `${this.languageStrings["primary.portal.census.manualEntry.spouse"]}:`,
        );

        // Show/Hide view employer contribution button
        this.showEmployerContributions$ = combineLatest([
            this.selectedMemberFlexDollars$,
            this.employerContributionExcludedStates$,
            this.selectedCountryState$,
        ]).pipe(
            map(([memberFlexDollars, employerContributionExcludedStates, selectedState]) => {
                // Don't show view employer contribution button if there is no employer contribution available.
                if (!memberFlexDollars.length) {
                    return false;
                }
                // Don't show view employer contribution button if selected state is in excluded state list (from config).
                if (employerContributionExcludedStates.includes(selectedState.abbreviation)) {
                    return false;
                }
                return true;
            }),
        );

        // Create employer contribution dialog data and open dialog
        combineLatest([this.openEmployerContributionsDialog$, this.selectedMemberFlexDollars$])
            .pipe(
                withLatestFrom(this.selectedAccount$, this.selectedMemberData$),
                tap(([[, selectedMemberFlexDollars], selectedAccount, selectedMemberData]) => {
                    this.empoweredModalService.openDialog(EmployerContributionsComponent, {
                        hasBackdrop: true,
                        maxWidth: "667px",
                        minHeight: "478px",
                        data: {
                            accountName: selectedAccount.name,
                            employeeName: `${selectedMemberData.name.firstName} ${selectedMemberData.name.lastName}`,
                            selectedMemberFlexDollars: selectedMemberFlexDollars,
                        } as EmployerContributionsDialogData,
                    });
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();
    }

    /**
     * Get applicant or spouse details
     * @param memberOrSpouse {string} describes whether it is member or spouse
     * @param applicantDetails {ApplicantDetails} Applicant's details from state
     * @param spouseDetails {SpouseDetails} Spouse's details from state
     * @param tobaccoInformation {TobaccoInformation} Member's/Spouse's tobacco details from state
     * @returns {string} text to be displayed
     */
    getApplicantOrSpouseInfo(
        memberOrSpouse: string,
        applicantDetails: ApplicantDetails,
        spouseDetails: SpouseDetails,
        tobaccoInformation: TobaccoInformation,
    ): string {
        const spouseExists = !!spouseDetails?.spouseAge;
        if (memberOrSpouse !== SettingsDropdownName.APPLICANT && !spouseExists) {
            return this.languageStrings["primary.portal.activityHistory.none"];
        }
        if (memberOrSpouse === SettingsDropdownName.APPLICANT) {
            this.memberIsTobaccoUser = tobaccoInformation?.memberIsTobaccoUser
                ? SettingsDropdownName.TOBACCO
                : SettingsDropdownName.NON_TOBACCO;
            this.memberInfo = `${this.getGenderDisplay(applicantDetails?.memberGender)}, ${applicantDetails?.memberAge.toString()}, ${
                this.memberIsTobaccoUser
            }`;
        }
        if (memberOrSpouse !== SettingsDropdownName.APPLICANT && spouseExists) {
            this.spouseIsTobaccoUser = tobaccoInformation?.spouseIsTobaccoUser
                ? SettingsDropdownName.TOBACCO
                : SettingsDropdownName.NON_TOBACCO;
            this.spouseInfo = `${this.getGenderDisplay(spouseDetails?.spouseGender)}, ${spouseDetails?.spouseAge.toString()}, ${
                this.spouseIsTobaccoUser
            }`;
        }
        return memberOrSpouse === SettingsDropdownName.APPLICANT ? this.memberInfo : this.spouseInfo;
    }

    /**
     * Get display text for gender.
     * @param memberGender {Gender} gender of the user
     * @returns {string} gender text to be displayed
     */
    getGenderDisplay(memberGender: Gender): string {
        if (memberGender === Gender.FEMALE) {
            return this.languageStrings["primary.portal.register.personalInfo.female"];
        } else if (memberGender === Gender.MALE) {
            return this.languageStrings["primary.portal.register.personalInfo.male"];
        }
        return this.languageStrings["primary.portal.coverage.unknown"];
    }

    /**
     * Get meta data for a setting dropdown. Params are properties that change.
     * @param name {SettingsDropdownName} identifier for dropdown (used to close all other dropdowns with other name)
     * @param triggerValue {Observable<string>} dynamic value based on dropdown submission. Shows up after the triggerLabel if it is defined
     * @param portalTitle aria title triggered when opening dropdown
     * @param triggerLabel {string} (Optional) name of dropdown, optional because "More" doesn't follow standard.
     * @returns {SettingsDropdownMeta} setting dropdown meta data. Used to define behavior of modal wrapper
     */
    getMeta(
        name: SettingsDropdownName,
        triggerValue: Observable<string>,
        portalTitle: string,
        triggerLabel?: string,
    ): SettingsDropdownMeta {
        return {
            name,
            class: "enrollment-setting",
            trigger: {
                label: triggerLabel,
                value: triggerValue,
            },
            backdrop: {
                anchor: this.backdropAnchor,
                style: BackdropStyleInput.LIGHT,
            },
            portal: {
                class: `producer-shop ${name}`,
                title: portalTitle,
            },
            footer: {
                apply: this.languageStrings["primary.portal.common.apply"],
                reset: this.languageStrings["primary.portal.common.reset"],
            },
        };
    }

    /**
     * Get label for Coverage Dates dropdown anchor
     * @param combinedOfferings - Source of product coverage dates
     * @param selectedProductCoverageDates - Updated product coverage dates
     * @returns {string} The coverage start date if all products have the same start date, otherwise returns
     *     "Custom" if the source values don't match the updated values and "Default" if they do match
     */
    getCoverageDatesLabel(combinedOfferings: CombinedOfferings[], selectedProductCoverageDates: ProductCoverageDate[]): string {
        const atLeastOneProductHasCustomValue = combinedOfferings.some((combinedOffering) => {
            // If combined offering belongs to Non aflac carrier return false
            if (!combinedOffering.defaultCoverageStartDate) {
                return false;
            }
            const productId = combinedOffering.productOffering.product.id;
            const selectedCoverageDate =
                selectedProductCoverageDates.find((productCoverageDate) => productCoverageDate.productId === productId)?.date ?? null;
            return combinedOffering.defaultCoverageStartDate !== selectedCoverageDate;
        });

        if (!this.coverageDateBoldConfigEnabled) {
            return atLeastOneProductHasCustomValue
                ? this.languageStrings["primary.portal.enrollment.enrollment-settings.coverage-dates.label.custom"]
                : this.languageStrings["primary.portal.classes.default"];
        }
        let startDateArr = selectedProductCoverageDates?.map((value) => value.date);
        // Filtering the array if in case any undefined values are present
        startDateArr = startDateArr?.filter((startDate) => startDate);
        const isSameStartDate = startDateArr?.every((val) => val === startDateArr[0]);
        // Returns the coverage start date if all the start dates are the same for all products
        return isSameStartDate
            ? this.dateService.format(startDateArr[0], "MM/dd/yyyy")
            : this.languageStrings["primary.portal.enrollment.enrollment-settings.coverage-dates.label.custom"];
    }

    /**
     * Get RiskClass names sorted in alphaetical order.
     * If all RiskClasses have the same name, displays only one name.
     *
     * @param riskClasses {[RiskClass] | [RiskClass, RiskClass]} to get names from
     * @returns {string} RiskClass names
     */
    getOccupationClassLabel(riskClasses: [RiskClass] | [RiskClass, RiskClass]): string {
        // Exit early and return empty string if there are no RiskClasses
        if (!riskClasses?.length) {
            return "";
        }

        // Create a copy of array to avoid mutating orginal
        // Then sort RiskClasses to display them in alphabetical order
        const riskClassNames = riskClasses.map(({ name }) => name).sort((a, b) => a.localeCompare(b));

        // If both RiskClasses match, only show one name
        if (riskClassNames[0] === riskClassNames[1]) {
            return riskClassNames[0] ?? "";
        }

        // Display RiskClasses by name comma separated
        return riskClassNames.join(", ");
    }

    /**
     * Get a Record of translations using LanguageService
     *
     * @returns {Record<string, string>} Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.classes.default",
            "primary.portal.common.reset",
            "primary.portal.common.apply",
            "primary.portal.members.contactLabel.method",
            "primary.portal.accounts.accountList.accountLocationColumn",
            "primary.portal.sidenav.coverageDates",
            "primary.portal.sidenav.aflacCoverageStart",
            "primary.portal.shopQuote.more",
            "primary.portal.classes.default",
            "primary.portal.shoppingCart.quoteLevelSettings.footer.benefitBank",
            "primary.portal.shared.drop-down-modal.opened",
            "primary.portal.enrollment.enrollment-settings.coverage-dates.label.custom",
            "primary.portal.enrollment.enrollment-settings.occupation-class",
            "primary.portal.register.personalInfo.female",
            "primary.portal.register.personalInfo.male",
            "primary.portal.coverage.unknown",
            "primary.portal.census.manualEntry.spouse",
            "primary.portal.pendedBusiness.resolveApplicationModal.applicant",
            "primary.portal.activityHistory.none",
        ]);
    }

    /**
     * Open Employer Contributions Dialog
     */
    openEmployerContributionsDialog(): void {
        this.openEmployerContributionsDialog$.next();
    }

    /**
     * Clean up subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
}
