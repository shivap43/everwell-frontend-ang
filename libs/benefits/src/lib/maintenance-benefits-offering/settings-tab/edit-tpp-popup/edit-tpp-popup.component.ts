import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { FormBuilder, Validators, FormGroup } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Router, ActivatedRoute } from "@angular/router";
import { AccountService, ThirdPartyPlatform, BenefitsOfferingService, BenefitOfferingSettingsInfo } from "@empowered/api";
import { AccountImportTypes } from "@empowered/constants";
import { takeUntil, switchMap } from "rxjs/operators";
import { Subject } from "rxjs";
import { BenefitOfferingHelperService } from "../../../benefit-offering-helper.service";
import { Store } from "@ngxs/store";
import { GetProductsPanel, SetAllEligiblePlans, SetPlanEligibility, SetUnapprovedPanel } from "@empowered/ngxs-store";

const TPP_PLANS = "tppPlans";
const ALL_PLANS = "allPlans";
const TPP_OPTION_SELECTED = "tppOptionSelected";
const SELECTED_THIRD_PARTY = "selectedThirdParty";

@Component({
    selector: "empowered-edit-tpp-popup",
    templateUrl: "./edit-tpp-popup.component.html",
    styleUrls: ["./edit-tpp-popup.component.scss"],
})
export class EditTppPopupComponent implements OnInit, OnDestroy {
    addTPPForm: FormGroup;
    isSpinnerLoading = false;
    thirdPartyPlatforms: Array<ThirdPartyPlatform>;
    private readonly unsubscribe$ = new Subject<void>();
    payload: BenefitOfferingSettingsInfo;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.settingsTab.thirdPartyTitle",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.choosePlans",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.tppAvailablePlans",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.tppName",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.tppAllPlans",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.tppInfoMessage",
        "primary.portal.maintenanceBenefitsOffering.settingsTab.tppAccountProfile",
        "primary.portal.common.save",
        "primary.portal.common.selectionRequired",
    ]);
    constructor(
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<EditTppPopupComponent>,
        private readonly accountService: AccountService,
        private readonly router: Router,
        private readonly benefitService: BenefitsOfferingService,
        private readonly benefitOfferingHelperService: BenefitOfferingHelperService,
        private readonly store: Store,
        @Inject(MAT_DIALOG_DATA) private readonly data: { route: ActivatedRoute; mpGroup: number },
    ) {}

    /**
     * Implements Angular OnInit Life Cycle hook on page load.
     * get third party platform and Call method to initalizing form.
     */
    ngOnInit(): void {
        this.isSpinnerLoading = true;
        this.accountService
            .getThirdPartyPlatforms()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.isSpinnerLoading = false;
                this.thirdPartyPlatforms = response;
            });
        this.createForm();
    }

    /**
     * Method to create form for TPP options
     */
    createForm(): void {
        this.addTPPForm = this.fb.group({
            tppOptionSelected: [],
            selectedThirdParty: [],
        });
        this.benefitOfferingHelperService
            .getThirdPartyPlatformRequirements()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                if (response.expectedThirdPartyPlatform) {
                    this.addTPPForm.get(TPP_OPTION_SELECTED).setValue(TPP_PLANS);
                    this.addTPPForm.get(SELECTED_THIRD_PARTY).setValue(response.expectedThirdPartyPlatform);
                    this.addTPPForm.get(SELECTED_THIRD_PARTY).setValidators(Validators.required);
                } else {
                    this.addTPPForm.get(TPP_OPTION_SELECTED).setValue(ALL_PLANS);
                }
            });
    }

    /**
     * Method called on value change of form value
     */
    onChange(): void {
        const optionSelected = this.addTPPForm.get(TPP_OPTION_SELECTED).value;
        if (optionSelected === TPP_PLANS) {
            this.addTPPForm.get(SELECTED_THIRD_PARTY).setValidators(Validators.required);
        } else if (optionSelected === ALL_PLANS) {
            this.addTPPForm.get(SELECTED_THIRD_PARTY).setValidators(null);
        }
        this.addTPPForm.get(SELECTED_THIRD_PARTY).updateValueAndValidity();
    }

    /**
     * Method invoked on click of save button
     */
    onSave(): void {
        const optionSelected = this.addTPPForm.get(TPP_OPTION_SELECTED).value;
        if (this.addTPPForm.valid && optionSelected === TPP_PLANS) {
            this.payload = {
                thirdPartyPlatformRequired: true,
                expectedThirdPartyPlatformId: this.addTPPForm.get(SELECTED_THIRD_PARTY).value.id,
            };
            this.saveTppServiceCall();
        } else if (optionSelected === TPP_PLANS && this.addTPPForm.get(SELECTED_THIRD_PARTY).invalid) {
            this.addTPPForm.get(SELECTED_THIRD_PARTY).markAsTouched();
        } else if (optionSelected === ALL_PLANS) {
            this.payload = {
                thirdPartyPlatformRequired: false,
                expectedThirdPartyPlatformId: null,
            };
            this.saveTppServiceCall();
        }
    }

    /**
     * Method called to make API call to save the TPP option selected
     */
    saveTppServiceCall(): void {
        this.isSpinnerLoading = true;
        this.benefitService
            .saveBenefitOfferingSettings(this.payload, this.data.mpGroup)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((response) => {
                    this.benefitOfferingHelperService.getThirdPartyPlatformRequirements(true);
                    return this.store.dispatch(new SetAllEligiblePlans([], AccountImportTypes.AFLAC_INDIVIDUAL));
                }),
                switchMap((plans) => this.store.dispatch(new SetPlanEligibility())),
                switchMap((plans) => this.store.dispatch(new GetProductsPanel())),
                switchMap((resp) => this.store.dispatch(new SetUnapprovedPanel())),
            )
            .subscribe((result) => {
                this.isSpinnerLoading = false;
                this.dialogRef.close(this.addTPPForm.get(TPP_OPTION_SELECTED).value);
            });
    }

    /**
     * Method to navigate to enrollment-options page
     */
    navigateToEnrollment(): void {
        this.router.navigate(["../../enrollment-options"], { relativeTo: this.data.route }).then(() => this.dialogRef.close(false));
    }

    /**
     * Method to close popup
     */
    closePopup(): void {
        this.dialogRef.close(false);
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
