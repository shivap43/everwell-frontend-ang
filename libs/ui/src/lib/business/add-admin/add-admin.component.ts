import { Component, OnInit, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MatDialogRef } from "@angular/material/dialog";
import { FormControl, Validators, FormGroup } from "@angular/forms";
import { MemberService, BenefitsOfferingService, StaticService } from "@empowered/api";
import { Store } from "@ngxs/store";
import { Subscription, combineLatest } from "rxjs";
import { ConfigName, AppSettings } from "@empowered/constants";
import { BenefitSummaryService } from "@empowered/common-services";
import { AccountListState, BenefitsOfferingState, StaticUtilService } from "@empowered/ngxs-store";

const SPLIT_COMMA = ",";

@Component({
    selector: "empowered-add-admin",
    templateUrl: "./add-admin.component.html",
    styleUrls: ["./add-admin.component.scss"],
})
export class AddAdminComponent implements OnInit, OnDestroy {
    addAdminMethod: FormGroup;
    selectedOption: FormControl;
    showAddFromEmployee = false;
    mpGroup: number;
    isSpinnerLoading = false;
    subscription: Subscription[] = [];
    submittingEndCoverage: boolean;
    hrApprovalVasConfig: string[] = [];
    isAdminApprovalRequired: boolean;
    isVasApprovalRequired = true;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.benefitsOffering.reviewSubmit.addAdminTitle",
        "primary.portal.benefitsOffering.reviewSubmit.addAdminDescription",
        "primary.portal.administrators.addManually",
        "primary.portal.administrators.addFromEmployeeList",
        "primary.portal.benefitsOffering.reviewSubmit.importFromAccount",
        "primary.portal.common.close",
        "primary.portal.common.next",
        "primary.portal.common.cancel",
        "primary.portal.common.selectionRequired",
        "primary.portal.benefitsOffering.reviewSubmit.addAdminDescriptionForEndCoverage",
        "primary.portal.benefitsOffering.reviewSubmit.addAdminDescription.hqVas",
    ]);

    constructor(
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<AddAdminComponent>,
        private readonly memberService: MemberService,
        private readonly store: Store,
        private readonly benefitSummaryService: BenefitSummaryService,
        private readonly staticUtilService: StaticUtilService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly staticService: StaticService,
    ) {}

    /**
     * Initializes the component.
     * Sets required configurations.
     * @memberof AddAdminComponent
     */
    ngOnInit(): void {
        this.subscription.push(
            this.benefitSummaryService.getEndCoverageFlag().subscribe((data) => {
                this.submittingEndCoverage = data;
            }),
        );
        // To get mp-group
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        if (this.mpGroup === null) {
            this.mpGroup = this.store.selectSnapshot(AccountListState.getMpGroupId);
        }

        // calling method to check admin approval requirement
        this.checkAdminApproval();

        this.selectedOption = new FormControl(null, Validators.required);
        this.getCustomers();
    }

    /**
     * Method to check if admin approval required or not
     * @returns void
     */
    checkAdminApproval(): void {
        this.subscription.push(
            combineLatest([
                this.staticUtilService.cacheConfigValue(ConfigName.PLAN_YEAR_SETUP_HR_APPROVAL_FOR_VAS),
                this.staticService.getConfigurations(ConfigName.BROKER_NON_AFLAC_CARRIERS_PLAN_YEAR_APPROVAL, this.mpGroup),
                this.benefitOfferingService.getPlanChoices(true, false, this.mpGroup),
            ]).subscribe(([hrApprovalVasConfig, nonAflacHrApprovalConfig, unapprovedPlanChoice]) => {
                const hrApprovalConfig = hrApprovalVasConfig.split(SPLIT_COMMA);
                const carriersForApproval = nonAflacHrApprovalConfig[0].value.split(SPLIT_COMMA);

                // To check if admin approval required for non-aflac plans
                this.isAdminApprovalRequired = unapprovedPlanChoice.some(
                    (plans) => !plans.plan.rider && carriersForApproval.some((carrier) => +carrier === plans.plan.carrierId),
                );

                // To check if vas plans available in selected plans
                const isVasAvailable = unapprovedPlanChoice.some((plans) => plans.plan.vasFunding);

                if (!this.isAdminApprovalRequired && isVasAvailable) {
                    this.isVasApprovalRequired = unapprovedPlanChoice.some(
                        (plan) =>
                            !plan.plan.rider &&
                            plan.plan.vasFunding &&
                            hrApprovalConfig.some((vasConfig) => vasConfig === plan.plan.vasFunding),
                    );
                }
            }),
        );
    }
    /**
     * Method to get customers to display add admin from employee list option
     */
    getCustomers(): void {
        this.isSpinnerLoading = true;
        this.subscription.push(
            this.memberService.searchMembers({ payload: this.mpGroup }).subscribe(
                (customers) => {
                    if (customers.content.length > 0) {
                        this.showAddFromEmployee = true;
                    } else {
                        this.showAddFromEmployee = false;
                    }
                    this.isSpinnerLoading = false;
                },
                () => {
                    this.isSpinnerLoading = false;
                },
            ),
        );
    }

    chooseOption(value: string): void {
        this.selectedOption.setValue(value);
    }
    onNext(): void {
        if (this.selectedOption.valid) {
            this.dialogRef.close(this.selectedOption.value);
        } else {
            this.selectedOption.setErrors({ require: true });
        }
    }
    closePopup(): void {
        this.dialogRef.close(AppSettings.FALSE);
    }
    ngOnDestroy(): void {
        this.subscription.forEach((sub) => sub.unsubscribe());
    }
}
