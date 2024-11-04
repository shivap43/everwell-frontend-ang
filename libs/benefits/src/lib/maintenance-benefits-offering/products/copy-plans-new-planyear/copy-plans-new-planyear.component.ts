import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { FormGroup, FormBuilder } from "@angular/forms";

import { LanguageService } from "@empowered/language";
import { MatDialogRef } from "@angular/material/dialog";
import { AccountService, BenefitsOfferingService } from "@empowered/api";
import { ProductsPlansQuasiService } from "../../products-plans-quasi/services/products-plans-quasi.service";
import { Store } from "@ngxs/store";
import { EMPTY, of, Subject } from "rxjs";
import { catchError, switchMap, takeUntil, tap } from "rxjs/operators";
import {
    BenefitsOfferingState,
    GetProductsPanel,
    SetMaintenanceRequiredData,
    SetNewPlanYearSelection,
    SetUnapprovedPanel,
    UpdateNewPlanYearChoice,
} from "@empowered/ngxs-store";
import { DateFormats, AppSettings, PlanYearType } from "@empowered/constants";
import { DatePipe } from "@angular/common";

const YES = "yes";
const NO = "no";
const PRODUCTS_STEP = 2;

@Component({
    selector: "empowered-copy-plans-new-planyear",
    templateUrl: "./copy-plans-new-planyear.component.html",
    styleUrls: ["./copy-plans-new-planyear.component.scss"],
})
export class CopyPlansNewPlanyearComponent implements OnInit, OnDestroy {
    @Input() mpGroup;
    isLoading = false;
    copyPlansForm: FormGroup;
    isDifferentPlanYearSelected = false;
    currentPlanYearSelected: string;
    previousPlanYearSelected: string;
    appSettings = AppSettings;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.cancel",
        "primary.portal.common.save",
        "primary.portal.maintenanceBenefitsOffering.copyNewPlanYear.title",
        "primary.portal.maintenanceBenefitsOffering.copyNewPlanYear.subTitle",
        "primary.portal.common.selectOption",
        "primary.portal.maintenanceBenefitsOffering.copyNewPlanYear.optionYes",
        "primary.portal.maintenanceBenefitsOffering.copyNewPlanYear.optionNo",
        "primary.portal.common.next",
    ]);
    planYearOptions = [];
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    userChoice: boolean;
    selectedPlanYearId: number;

    constructor(
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly dialog: MatDialogRef<CopyPlansNewPlanyearComponent>,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly quasiService: ProductsPlansQuasiService,
        private readonly store: Store,
        private readonly accountService: AccountService,
        private readonly datePipe: DatePipe,
    ) {}

    /**
     * life cycle hook that runs on initialization
     * gets data and initializes form
     */
    ngOnInit(): void {
        this.isLoading = true;
        this.userChoice = this.store.selectSnapshot(BenefitsOfferingState.GetNewPlanYearChoice);
        this.selectedPlanYearId = this.store.selectSnapshot(BenefitsOfferingState.GetPlanYearId);
        this.previousPlanYearSelected = this.store.selectSnapshot(BenefitsOfferingState.getNewPlanYearSelection);
        this.initializeFormFields();
        this.getPlanYears();
    }

    /**
     * to initialize form field
     */
    initializeFormFields(): void {
        this.copyPlansForm = this.fb.group({
            selectPlanYearOption: [],
            copyPlanOption: [],
        });
    }
    /**
     * to change plans option on plan year change
     */
    onCopyPlanOptionSelectionChange(): void {
        if (this.copyPlansForm.controls.copyPlanOption.value === NO) {
            this.copyPlansForm.controls.selectPlanYearOption.disable();
        } else {
            this.copyPlansForm.controls.selectPlanYearOption.enable();
        }
    }
    /**
     * function to save data on submit
     */
    onSubmit(): void {
        this.currentPlanYearSelected = this.copyPlansForm.controls.copyPlanOption.value;
        this.store.dispatch(new SetNewPlanYearSelection(this.currentPlanYearSelected));
        this.isDifferentPlanYearSelected = this.previousPlanYearSelected !== this.currentPlanYearSelected;
        if (this.previousPlanYearSelected != null && this.isDifferentPlanYearSelected) {
            this.accountService.clearPendingElements(this.mpGroup).pipe(takeUntil(this.unsubscribe$)).subscribe();
            this.resetPanelProducts();
        }

        if (this.copyPlansForm.controls.copyPlanOption.value === YES) {
            const id = this.copyPlansForm.controls.selectPlanYearOption.value;
            const index = this.planYearOptions.findIndex((py) => py.value === id);
            this.store
                .dispatch(new UpdateNewPlanYearChoice(true, id, this.planYearOptions[index].detail))
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((response) => {
                    this.quasiService.defaultStepPositionChanged$.next(2);
                });
        } else {
            this.store
                .dispatch(new UpdateNewPlanYearChoice(false, null, null))
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((response) => {
                    this.quasiService.defaultStepPositionChanged$.next(2);
                });
        }
    }
    /**
     * This method is used to clear store and clear product, plans variables in service
     */
    resetPanelProducts(): void {
        this.quasiService.resetQuasiObservableValues();
        this.quasiService.resetQuasiStoreValues();
        this.reinitiateServiceCalls();
    }
    /**
     * This method is used to recall all service calls and dispatch actions
     */
    reinitiateServiceCalls(): void {
        this.isLoading = true;
        this.store
            .dispatch(new SetMaintenanceRequiredData())
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((res) => this.store.dispatch(new GetProductsPanel())),
                switchMap((resp) => this.store.dispatch(new SetUnapprovedPanel())),
            )
            .subscribe();
    }
    cancel(): void {
        this.dialog.close();
    }
    /**
     * This method is used to get plan years from API service
     */
    getPlanYears(): void {
        const currentDate = this.datePipe.transform(new Date(), DateFormats.YEAR_MONTH_DAY);
        this.benefitsOfferingService
            .getPlanYears(this.mpGroup, false, false)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((result) => {
                    const data = result.filter(
                        (planYear) =>
                            planYear.type === PlanYearType.AFLAC_INDIVIDUAL && planYear.coveragePeriod.expiresAfter >= currentDate,
                    );
                    if (data.length) {
                        data.forEach((planYear) => {
                            this.planYearOptions.push({
                                value: planYear.id,
                                viewValue: planYear.name,
                                detail: planYear,
                            });
                        });
                        this.copyPlansForm.controls.selectPlanYearOption.patchValue(
                            this.selectedPlanYearId ? this.selectedPlanYearId : data[0].id,
                        );
                        this.copyPlansForm.controls.copyPlanOption.patchValue(this.userChoice ? YES : NO);
                        this.onCopyPlanOptionSelectionChange();
                        this.isLoading = false;
                    } else {
                        this.copyPlansForm.controls.copyPlanOption.patchValue(NO);
                        return this.store
                            .dispatch(new UpdateNewPlanYearChoice(false, null, null))
                            .pipe(tap(() => this.quasiService.defaultStepPositionChanged$.next(PRODUCTS_STEP)));
                    }
                    this.isLoading = false;
                    return of("");
                }),
                catchError((error) => {
                    this.isLoading = false;
                    return EMPTY;
                }),
            )
            .subscribe();
    }
    /**
     * ng life cycle hook
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
