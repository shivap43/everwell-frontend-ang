import { AflacService, MemberService } from "@empowered/api";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Component, OnInit, OnDestroy, Inject } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Store } from "@ngxs/store";
import { Subscription } from "rxjs";
import { DateFormats, MemberProfile } from "@empowered/constants";

@Component({
    selector: "empowered-import-policy-modal",
    templateUrl: "./import-policy-modal.component.html",
    styleUrls: ["./import-policy-modal.component.scss"],
})
export class ImportPolicyModalComponent implements OnInit, OnDestroy {
    form: FormGroup;
    formSuccess = false;
    policyNumberInvalid = false;
    memberInfo: MemberProfile;
    dateFormat = DateFormats.MONTH_DAY_YEAR;
    subscriptions: Subscription[] = [];
    isSpinnerLoading = false;
    showErrorMessage = false;
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.quoteShop.plansDisplay.importExistingPlan",
        "primary.portal.quoteShop.plansDisplay.toImportActivePlan",
        "primary.portal.quoteShop.plansDisplay.policyNumber",
        "primary.portal.quoteShop.plansDisplay.importPolicyError",
        "primary.portal.common.cancel",
        "primary.portal.quoteShop.plansDisplay.importPlan",
        "primary.portal.common.close",
        "primary.portal.quoteShop.plansDisplay.planImportedSuccessfully",
        "primary.portal.quoteShop.plansDisplay.importSuccessMsg",
        "primary.portal.common.gotIt",
        "primary.portal.quoteShop.plansDisplay.dob",
        "primary.portal.quoteShop.plansDisplay.policyNoError",
    ]);

    constructor(
        private readonly language: LanguageService,
        private readonly aflacService: AflacService,
        private readonly fb: FormBuilder,
        @Inject(MAT_DIALOG_DATA)
        readonly data: {
            mpGroup: number;
            memberId: number;
            productId: number;
            productName: string;
            enrollmentType: string;
            enrollmentStateAbbreviation: string;
        },
        private readonly dialogRef: MatDialogRef<ImportPolicyModalComponent>,
        private readonly store: Store,
        private readonly memberService: MemberService,
    ) {}

    /**
     * Responsible for initializing form and fetch member details on load
     * @memberof ImportPolicyModalComponent
     */
    ngOnInit(): void {
        this.initializeForm();
        this.getMemberInfo();
    }

    /**
     * Initializes the form used for policy number input
     * @memberof ImportPolicyModalComponent
     */
    initializeForm(): void {
        this.form = this.fb.group({
            policyNumber: ["", [Validators.required]],
        });
    }

    /**
     * Fetches member information to display member attributes
     * @memberof ImportPolicyModalComponent
     */
    getMemberInfo(): void {
        this.subscriptions.push(
            this.memberService.getMember(this.data.memberId, false, this.data.mpGroup.toString()).subscribe(
                (member) => {
                    this.memberInfo = member.body;
                },
                () => {
                    this.showErrorMessage = true;
                },
            ),
        );
    }

    /**
     * Invoked on submission of form and calls policy lookup api
     * @memberof ImportPolicyModalComponent
     */
    onSubmit(): void {
        const policyNumberValue = this.form.controls.policyNumber.value;
        if (policyNumberValue && this.form.valid) {
            this.isSpinnerLoading = true;
            this.subscriptions.push(
                this.aflacService.policyLookup(this.data.memberId, policyNumberValue, this.data.mpGroup, this.data.productId).subscribe(
                    () => {
                        this.formSuccess = true;
                        this.isSpinnerLoading = false;
                    },
                    () => {
                        this.isSpinnerLoading = false;
                        this.form.controls.policyNumber.setErrors({ policyNumberInvalid: true });
                    },
                ),
            );
        }
    }

    /**
     * Closes the dialog
     * @memberof ImportPolicyModalComponent
     */
    onCancel(): void {
        this.dialogRef.close(this.formSuccess);
    }

    /**
     * Destroys the component and unsubscribes api subscription
     * @memberof ImportPolicyModalComponent
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
}
