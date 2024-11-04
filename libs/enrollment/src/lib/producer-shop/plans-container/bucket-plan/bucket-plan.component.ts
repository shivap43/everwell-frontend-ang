import { combineLatest, Subject } from "rxjs";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { Observable } from "rxjs/internal/Observable";
import { Component, Input, OnInit, OnDestroy } from "@angular/core";
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { filter, map, mapTo, startWith, take, takeUntil, tap } from "rxjs/operators";
import { select } from "@ngrx/store";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { CharCode, EnrollmentEnums, PlanOfferingWithCartAndEnrollment, Enrollments } from "@empowered/constants";
import { ProductOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import { ROUND } from "./bucket-plan.model";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import { PlanPanelService } from "../../services/plan-panel/plan-panel.service";

@Component({
    selector: "empowered-bucket-plan",
    templateUrl: "./bucket-plan.component.html",
    styleUrls: ["./bucket-plan.component.scss"],
})
export class BucketPlanComponent implements OnInit, OnDestroy {
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;

    // default contribution to display on load
    readonly defaultContribution: number = 0;
    // applicable pay frequency for selected member
    readonly payFrequency$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberPayFrequency));
    form: FormGroup;

    // Calculated contribution amount based on payroll period
    contributionBasedOnPayrollFrequency$: Observable<number>;

    // Observable of range of contribution
    rangeOfContribution$: Observable<{
        minimumContributionAmount: number;
        maximumContributionAmount: number;
    }>;

    // Translations
    languageStrings: Record<string, string>;

    // Gets contribution limit
    private readonly selectedContributionLimit$ = this.ngrxStore.onAsyncValue(
        select(ProductOfferingsSelectors.getSelectedContributionLimitSet),
    );

    // Gets member dependent data
    private readonly dependentsData$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberDependents));

    private readonly unsubscriber$ = new Subject<void>();
    enrollmentPlan: Enrollments | null;
    private readonly onCancel$ = new Subject<void>();

    constructor(
        private readonly fb: FormBuilder,
        private readonly ngrxStore: NGRXStore,
        private readonly languageService: LanguageService,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly planPanelService: PlanPanelService,
    ) {}

    // Angular lifecycle hook for initializing the component
    ngOnInit() {
        this.languageStrings = this.getLanguageStrings();
        this.enrollmentPlan = this.planPanelService.getEnrollmentPlan(this.planPanel);
        // Range of contributions based on dependents availability
        this.rangeOfContribution$ = combineLatest([this.selectedContributionLimit$, this.dependentsData$]).pipe(
            map(([contributionLimit, memberDependents]) => {
                const isDependentsAvailable =
                    memberDependents?.length && EnrollmentEnums.productIds.HSA.includes(this.planPanel?.planOffering?.plan.product.id);
                return {
                    minimumContributionAmount: isDependentsAvailable
                        ? contributionLimit.minFamilyContribution
                        : contributionLimit.minContribution,
                    maximumContributionAmount: isDependentsAvailable
                        ? contributionLimit.maxFamilyContribution
                        : contributionLimit.maxContribution,
                };
            }),
        );

        this.form = this.fb.group({
            annualContributionValue: [{ value: null }, [Validators.required], [this.enableErrorMessage.bind(this)]],
        });

        this.prePopulateFromCartValue().pipe(takeUntil(this.unsubscriber$)).subscribe();
        // Calculated contribution amount based on payroll
        this.contributionBasedOnPayrollFrequency$ = combineLatest([
            this.form.controls.annualContributionValue.valueChanges.pipe(startWith(this.form.controls.annualContributionValue.value)),
            this.payFrequency$,
        ]).pipe(
            map(([annualContribution, payFrequency]) => {
                const panelIdentifiers = this.planPanelService.getPanelIdentifiers(this.planPanel);

                this.producerShopComponentStoreService.upsertAnnualContributionState({
                    annualContribution,
                    panelIdentifiers,
                    isValid: !this.form.controls.annualContributionValue.errors,
                });
                return Number((annualContribution / payFrequency?.payrollsPerYear).toFixed(ROUND.TWO));
            }),
        );

        this.onCancel$
            .pipe(
                tap(() => {
                    // remove the changes made to riders in edit coverage
                    const enrollment = this.planPanel.enrollment;
                    const enrollmentId = enrollment?.id;
                    this.producerShopComponentStoreService.setEnrollmentDetailsState({
                        enrollmentId,
                        enrollmentDetailsState: { edit: false },
                    });
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();
    }

    /**
     * Method on click of cancel.
     * Switches to enrollment view from bucket plan view.
     */
    onCancel(): void {
        this.onCancel$.next();
    }
    /**
     * Get a Record of translations using LanguageService
     *
     * @returns {Record<string, string>} Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.shoppingExperience.hsa",
            "primary.portal.common.star",
            "primary.portal.shoppingExperience.hsaPlanPara",
        ]);
    }

    /**
     * This function will pre populate the contribution value from cart item
     * @returns Observable<void>
     */
    prePopulateFromCartValue(): Observable<void> {
        return this.payFrequency$.pipe(
            filter(() => !!this.planPanel?.cartItemInfo || !!this.planPanel?.enrollment),
            tap((payFrequency) => {
                const panelIdentifiers = this.planPanelService.getPanelIdentifiers(this.planPanel);
                const memberCost = this.planPanel?.cartItemInfo?.memberCost ?? this.planPanel?.enrollment?.memberCostPerPayPeriod;
                const annualContribution = Number((memberCost * payFrequency.payrollsPerYear).toFixed(ROUND.TWO));
                this.form.controls.annualContributionValue.setValue(annualContribution);
                this.producerShopComponentStoreService.addAnnualContributionState({
                    annualContribution,
                    panelIdentifiers,
                });
            }),
            mapTo(null),
        );
    }
    /**
     * Check the control is valid or not
     */
    setErrorOnInvalidForm(): void {
        this.form.controls.annualContributionValue.updateValueAndValidity();
    }
    /**
     * Update the form control error based on entered amount
     * @param control control value of annual contribution
     * @returns Observable of ValidationErrors
     */
    enableErrorMessage(control: AbstractControl): Observable<ValidationErrors> {
        return this.rangeOfContribution$.pipe(
            map((rangeOfContribution) => {
                if (
                    control.value > rangeOfContribution.maximumContributionAmount ||
                    control.value < rangeOfContribution.minimumContributionAmount
                ) {
                    return {
                        invalid: true,
                    };
                }
                return null;
            }),
            take(1),
        );
    }

    /**
     * Restricts minus and plus sign in the input field
     * @param event holds the keypress event object
     */
    restrictNegativeValue(event: KeyboardEvent): void {
        if (event.charCode === CharCode.MINUS || event.charCode === CharCode.PLUS) {
            event.preventDefault();
        }
    }

    /**
     * Clean up rxjs subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
}
