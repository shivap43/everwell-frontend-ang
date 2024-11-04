import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { BenefitsOfferingService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { takeUntil, tap } from "rxjs/operators";
import { ModalDialogAction, ServerErrorResponseCode, ClientErrorResponseCode, ArgusEligibleEmployeeData } from "@empowered/constants";
import { Subject } from "rxjs";

@Component({
    selector: "empowered-update-argus-employee-count",
    templateUrl: "./update-argus-employee-count.component.html",
    styleUrls: ["./update-argus-employee-count.component.scss"],
})
export class UpdateArgusEmployeeCountComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.addSingleProducer.closeModal",
        "primary.portal.common.cancel",
        "primary.portal.benefitsOffering.aflac.ADVEnrollment",
        "primary.portal.common.update",
        "primary.portal.benefitsOffering.update.employee.argus.heading",
        "primary.portal.benefitsOffering.update.employee.argus.description",
        "primary.portal.benefitsOffering.errorMsg.refresh.accountRefreshFailure",
        "primary.portal.proposals.create.proposalDetails.warningMsg",
    ]);
    secondaryLanguage = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.benefitsOffering.setting.employeesRequired",
        "secondary.portal.benefitsOffering.setting.minError",
        "secondary.portal.benefitsOffering.setting.alphaError",
    ]);
    updateEmployeeCountForm: FormGroup;
    minEligibleADVEmpMsg: string;
    minArgusEmployeesCheck = false;
    mpGroup: string;
    updateArgusError: boolean;
    errorMessage: string;
    isProposal: boolean;
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly language: LanguageService,
        private readonly formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) private readonly dialogData: ArgusEligibleEmployeeData,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly dialogRef: MatDialogRef<UpdateArgusEmployeeCountComponent>,
    ) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     */
    ngOnInit(): void {
        this.updateEmployeeCountForm = this.formBuilder.group({
            eligibleADVEmp: [null, [Validators.required, Validators.min(1)]],
        });
        this.updateEmployeeCountForm.controls.eligibleADVEmp.setValue(this.dialogData.employeeCount);
        this.employeeADVCountChanged(this.dialogData.employeeCount);
        this.isProposal = !!this.dialogData.isProposal;
    }

    /**
     * This method is used to display employee eligiblity message for ADV plans in the settings page
     * @param employeeCount : contains current value of the input field
     */
    employeeADVCountChanged(employeeCount: number): void {
        this.minEligibleADVEmpMsg = this.languageStrings["primary.portal.benefitsOffering.aflac.ADVEnrollment"]
            .replace("##empMinCount##", String(this.dialogData.eligibleADVMinEmployeeCount))
            .replace("##empMaxCount##", String(this.dialogData.eligibleADVMaxEmployeeCount));
        this.minArgusEmployeesCheck = !(
            employeeCount >= this.dialogData.eligibleADVMinEmployeeCount && employeeCount <= this.dialogData.eligibleADVMaxEmployeeCount
        );
    }
    /**
     * Function to update the argus total eligible employee
     */
    onUpdateClick(): void {
        this.benefitsOfferingService
            .updateArgusTotalEligibleEmployees(this.updateEmployeeCountForm.controls.eligibleADVEmp.value, this.dialogData.mpGroup)
            .pipe(
                tap((updateStatus) => {
                    this.dialogRef.close({
                        action: ModalDialogAction.SAVED,
                        isRefresh: true,
                        eligibleADVEmp: this.updateEmployeeCountForm.controls.eligibleADVEmp.value,
                    });
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                () => {},
                (errorResp) => {
                    this.updateArgusError = true;
                    if (errorResp.error.details && errorResp.error.details.length) {
                        this.errorMessage = errorResp.error.details[0].message;
                    } else if (
                        errorResp.error.status === ClientErrorResponseCode.RESP_403 ||
                        errorResp.error.status === ServerErrorResponseCode.RESP_503 ||
                        errorResp.error.status === ServerErrorResponseCode.RESP_500
                    ) {
                        this.errorMessage = errorResp.error.message;
                    } else {
                        this.errorMessage = this.language.fetchSecondaryLanguageValue(
                            `secondary.api.${errorResp.status}.${errorResp.code}`,
                        );
                    }
                },
            );
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
