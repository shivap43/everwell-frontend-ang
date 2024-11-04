import { VoidCoverageComponent } from "./void-coverage/void-coverage.component";
import { Component, OnInit, Optional, Inject, ViewChild, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { NgxMaskPipe } from "ngx-mask";
import { FormGroup, FormBuilder, FormArray, Validators } from "@angular/forms";

import { MatTableDataSource } from "@angular/material/table";
import { forkJoin, Subscription } from "rxjs";
import { DatePipe } from "@angular/common";
import {
    EnrollmentService,
    EnrollmentStatusType,
    MemberService,
    ShoppingService,
    CoverageChangingFields,
    CoreService,
    ApplicableProductIdsForBeneficiaries,
} from "@empowered/api";
import { CoverageChangingComponent } from "./coverage-changing/coverage-changing.component";
import { SelectionModel } from "@angular/cdk/collections";
import { ManageDependentComponent } from "./manage-dependent/manage-dependent.component";
import { LanguageService } from "@empowered/language";
import { Router } from "@angular/router";
import { Store } from "@ngxs/store";
import { Permission, AppSettings, TaxStatus, PolicyOwnershipType, TobaccoStatus, MemberProfile } from "@empowered/constants";
import { MonDialogComponent, MonDialogData } from "@empowered/ui";
import { SharedState, UtilService } from "@empowered/ngxs-store";

interface EditCoverageDialogData {
    enrollData: any;
    payFrequency: string;
    mpGroup: number;
    memberId: number;
    memberEnrollments: any[];
    enrollmentState: string;
    memberInfo: MemberProfile;
}

interface Dependents {
    dependentId?: number;
    validity?: {
        effectiveStarting?: string;
        expiresAfter?: string;
    };
}

@Component({
    selector: "empowered-edit-coverage",
    templateUrl: "./edit-coverage.component.html",
    styleUrls: ["./edit-coverage.component.scss"],
})
export class EditCoverageComponent implements OnInit, OnDestroy {
    isData = { Current: false, Past: false, Future: false };
    noDataFound = false;
    coverageForm: FormGroup;
    dataSource = new MatTableDataSource<any>();
    benefitDetailsDataSource = new MatTableDataSource<any>();
    incentivesDataSouce = new MatTableDataSource<any>();
    displayedColumns = ["RiderName", "Cost"];
    benefitDisplayedColumns = ["field", "values"];
    incentiveDisplayedColumns = ["name", "amount"];
    beneficiaryType = ["Primary", "Secondary"];
    beneficiary = [];
    beneficiaryArray = [];
    noBeneficaryDataFound = false;
    benefitDetailsData = [];
    tobaccoStatus = Object.values(TobaccoStatus);
    taxStatus = Object.values(TaxStatus);
    isLoading = false;
    incentivesData: any[] = [];
    dataChange: any[] = [];
    isDataChange = false;
    isIncentiveData = false;
    initialSelection = [];
    allowMultiSelect = true;
    selection: any;
    selectedRiders: any[] = [];
    existingBeneficiaryData: any[] = [];
    @ViewChild(ManageDependentComponent) dependentInfo: ManageDependentComponent;
    selectedIncentives: any[] = [];
    dependentObjectArray: Dependents[] = [];
    dependentMsg = "";
    baseCost = 0;
    isContinous = false;
    isFuture = false;
    benefitAmounts: any[] = [];
    payrollFrequencyLabel: string;
    totalCostPerPayPeriod: number;
    benefitAmount: any;
    beneficiaryNameIndex: any[] = [];
    updateCoverageRequest: any;
    isBeneFiciaryChange = true;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.editCoverage.edit",
        "primary.portal.editCoverage.coverage",
        "primary.portal.editCoverage.coverageDate",
        "primary.portal.editCoverage.planPending",
        "primary.portal.editCoverage.pendingEnrollments",
        "primary.portal.editCoverage.voidCoverage",
        "primary.portal.editCoverage.coverageDetails",
        "primary.portal.editCoverage.coverageLevel",
        "primary.portal.editCoverage.startDate",
        "primary.portal.editCoverage.endDate",
        "primary.portal.editCoverage.benefitDetails",
        "primary.portal.editCoverage.incentivesSurcharges",
        "primary.portal.editCoverage.riders",
        "primary.portal.editCoverage.beneficiaries",
        "primary.portal.editCoverage.beneficiaryName",
        "primary.portal.editCoverage.beneficiaryType",
        "primary.portal.editCoverage.precentageBenefit",
        "primary.portal.editCoverage.remove",
        "primary.portal.editCoverage.addbeneficiary",
        "primary.portal.editCoverage.newemployeeCost",
        "primary.portal.editCoverage.nocoverageFound",
        "primary.portal.editCoverage.cancel",
        "primary.portal.editCoverage.save",
        "primary.portal.editCoverage.benefitamount",
        "primary.portal.editCoverage.taxStatus",
        "primary.portal.editCoverage.tobaccoStatus",
        "primary.portal.editCoverage.employerContribution",
        "primary.portal.editCoverage.payrollFrequencyCost",
        "primary.portal.editCoverage.beneficiaryPercentError",
        "primary.portal.editCoverage.zeroPercent",
        "primary.portal.editCoverage.firstPrimaryBeneficiary",
        "primary.portal.editCoverage.required",
        "primary.portal.editCoverage.leaveTitle",
        "primary.portal.editCoverage.leaveContent",
        "primary.portal.editCoverage.leavePrimaryButton",
        "primary.portal.editCoverage.leaveSecondaryButton",
        "primary.portal.editCoverage.modalTitle",
        "primary.portal.editCoverage.modalContent",
        "primary.portal.editCoverage.modalPrimaryButton",
        "primary.portal.editCoverage.modalSecondaryButton",
        "primary.portal.editCoverage.dependentMsg",
        "primary.portal.editCoverage.select",
        "primary.portal.editCoverage.benefitDetails.coverageEndDate.validation",
        "primary.portal.editCoverage.primaryBeneficiary.validation",
        "primary.portal.common.close",
        "primary.portal.common.search",
        "primary.portal.editCoverage.payFrequencyCost",
    ]);
    isDisable = false;
    showBeneficiaryData = false;
    isDependentChange = false;
    zero = 0;
    beneficiaryPercentage: any;
    changeFields = [];
    memeberTotalCost: any;
    mustBePrimaryBeneficiaryFirst: boolean;
    todayDate = new Date();
    minDate: Date;
    subscription: Subscription;
    portal: any;
    memberInfo: MemberProfile;
    mpGroupId: number;
    UserPermissions = Permission;

    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: EditCoverageDialogData,
        private readonly matDialogRef: MatDialogRef<EditCoverageComponent>,
        private readonly maskPipe: NgxMaskPipe,
        private readonly fb: FormBuilder,
        private readonly memberService: MemberService,
        private readonly dialog: MatDialog,
        private readonly datepipe: DatePipe,
        private readonly enrollmentsService: EnrollmentService,
        private readonly shoppingService: ShoppingService,
        private readonly language: LanguageService,
        private readonly coreService: CoreService,
        private readonly router: Router,
        private readonly store: Store,
        private readonly utilService: UtilService,
    ) {
        this.selection = new SelectionModel<any>(this.allowMultiSelect, this.initialSelection);
        this.selection.selected.riders = [];
        this.selection.selected.incentive = [];
    }

    ngOnInit(): void {
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.portal = "/" + this.portal.toLowerCase();
        this.minDate = this.todayDate;
        this.memberInfo = this.data.memberInfo;
        this.mpGroupId = +this.data.mpGroup;
        this.subscription = new Subscription();
        this.coverageForm = this.fb.group({
            coverageDate: [""],
            coverageStartDate: [
                {
                    value: "",
                    disabled: true,
                },
            ],
            coverageEndDate: [
                {
                    value: "",
                    disabled: true,
                },
            ],
            beneficiaryForms: this.fb.array([]),
            riderCost: [""],
            tobaccoStatus: [""],
            taxStatus: [""],
            payFrequencyCost: [
                {
                    value: "",
                    disabled: true,
                },
            ],
            benefitAmount: [""],
            employeeContribution: [
                {
                    value: "",
                    disabled: true,
                },
            ],
        });

        this.updateCoverageRequest = {
            enrollment: {
                coverageLevelId: 0,
                memberCost: 0,
                totalCost: 0,
                benefitAmount: 0,
                validity: {
                    effectiveStarting: null,
                    expiresAfter: null,
                },
                taxStatus: "",
                tobaccoStatus: "",
                salaryMultiplier: 0,
            },
            dependents: [],
            riderIds: [],
            beneficiaries: [],
            reason: "",
            description: "",
            effectiveDate: "",
        };

        this.data.memberEnrollments.forEach((data) => {
            if (data.id === this.data.enrollData.id) {
                this.data.enrollData = this.utilService.copy(data);
                this.memeberTotalCost = this.data.enrollData.totalCost;
            }
        });

        this.noBeneficaryDataFound = true;
        this.selectedRiders = this.utilService.copy(this.selection.selected.riders);
        this.selectedIncentives = this.utilService.copy(this.selection.selected.incentive);
        this.beneficiaryPercentage = AppSettings.BENEFICIARY_PERCENTAGE;

        this.subscription.add(
            this.memberService.getMemberBeneficiaries(this.data.memberId, this.data.mpGroup, true).subscribe((data) => {
                this.beneficiaryArray = data;
                this.getBeneficiariesData();
            }),
        );

        if (this.data.enrollData) {
            this.minDate =
                this.data.enrollData.validity.effectiveStarting >
                this.datepipe.transform(this.todayDate, AppSettings.DATE_FORMAT_YYYY_MM_DD)
                    ? this.data.enrollData.validity.effectiveStarting
                    : this.todayDate;
            this.coverageForm.get("coverageDate").setValue(this.data.enrollData.validity.effectiveStarting);
            this.decidePlanStatus();
            this.checkForShowBeneficiary();
            this.getBenefitDetailsData();
            this.getCoverageLevelData();
            this.getRidersData();
            this.getIncentivesData();
            this.baseCost = this.data.enrollData.totalCost;
        }
    }

    decidePlanStatus(): void {
        if (
            this.data.enrollData.plan.policyOwnershipType === PolicyOwnershipType.INDIVIDUAL &&
            this.data.enrollData.taxStatus === TaxStatus.POSTTAX
        ) {
            this.isContinous = true;
        } else if (this.data.enrollData.validity.expiresAfter !== undefined || this.data.enrollData.validity.expiresAfter !== null) {
            this.coverageForm.get("coverageEndDate").setValue(this.data.enrollData.validity.expiresAfter);
            if (
                (this.coverageForm.get("coverageEndDate").value && this.coverageForm.get("coverageEndDate").value > this.todayDate) ||
                this.data.enrollData.status === this.convertToCamelCase(EnrollmentStatusType.APPROVED)
            ) {
                this.isFuture = true;
                this.coverageForm.get("coverageEndDate").enable();
            }
        }
        if (this.data.enrollData.status === this.convertToCamelCase(EnrollmentStatusType.APPROVED)) {
            this.isData.Current = true;
        } else if (
            this.data.enrollData.status === this.convertToCamelCase(EnrollmentStatusType.ENDED) ||
            this.data.enrollData.status === this.convertToCamelCase(EnrollmentStatusType.LAPSED) ||
            this.data.enrollData.status === this.convertToCamelCase(EnrollmentStatusType.DECLINED) ||
            this.data.enrollData.status === this.convertToCamelCase(EnrollmentStatusType.TERMINATED)
        ) {
            this.isData.Past = true;
        } else {
            this.isData.Future = true;
        }
    }

    checkForShowBeneficiary(): void {
        this.subscription.add(
            this.coreService.getProducts().subscribe((prd) => {
                prd.forEach((prod) => {
                    if (
                        (prod.id === ApplicableProductIdsForBeneficiaries.accidentProductId ||
                            prod.id === ApplicableProductIdsForBeneficiaries.wholeLife ||
                            prod.id === ApplicableProductIdsForBeneficiaries.termLife ||
                            prod.id === ApplicableProductIdsForBeneficiaries.basicLife ||
                            prod.id === ApplicableProductIdsForBeneficiaries.JuvenileTermLife ||
                            prod.id === ApplicableProductIdsForBeneficiaries.JuvenileWholeLife) &&
                        prod.id === this.data.enrollData.plan.product.id
                    ) {
                        this.showBeneficiaryData = true;
                    }
                });
            }),
        );
    }

    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }

    onCancelClick(data?: any): void {
        if (this.isDataChange === true) {
            const dialogData: MonDialogData = {
                title: this.languageStrings["primary.portal.editCoverage.leaveTitle"],
                content: this.languageStrings["primary.portal.editCoverage.leaveContent"],
                secondaryButton: {
                    buttonTitle: this.languageStrings["primary.portal.editCoverage.leavePrimaryButton"],
                    buttonAction: this.close.bind(this, this.dialog, "cancel"),
                    buttonClass: "mon-btn-secondary editcoverage-back-btn",
                },
                primaryButton: {
                    buttonTitle: this.languageStrings["primary.portal.editCoverage.leaveSecondaryButton"],
                    buttonAction: this.close.bind(this, this.dialog),
                    buttonClass: "mon-btn-primary",
                },
            };
            this.dialog.open(MonDialogComponent, {
                data: dialogData,
                width: "40rem",
            });
        } else if (data !== undefined) {
            this.matDialogRef.close();
        } else {
            this.matDialogRef.close(CoverageChangingFields.cancel);
        }
    }

    getBeneficiaryName(beneficiary: any): string | undefined {
        if ((beneficiary.allocationType || beneficiary.type) === PolicyOwnershipType.INDIVIDUAL) {
            return this.convertToCamelCase(`${beneficiary.name.firstName} ${beneficiary.name.lastName}`);
        } else if ((beneficiary.allocationType || beneficiary.type) === CoverageChangingFields.estate) {
            return this.convertToCamelCase(beneficiary.type);
        } else if ((beneficiary.allocationType || beneficiary.type) === CoverageChangingFields.charity) {
            const name = beneficiary.name !== undefined ? beneficiary.name : beneficiary.type;
            return this.convertToCamelCase(name);
        } else if ((beneficiary.allocationType || beneficiary.type) === CoverageChangingFields.trust) {
            return this.convertToCamelCase(`${beneficiary.trustee.firstName} ${beneficiary.trustee.lastName}`);
        }
        return undefined;
    }

    getCostValue(event: any, element: any, type: string): void {
        if (event.checked === true) {
            if (type === CoverageChangingFields.riders) {
                this.selection.selected.riders.push(element.id);
            } else {
                this.selection.selected.incentive.push(element.id);
            }

            this.data.enrollData.totalCost =
                type === CoverageChangingFields.riders
                    ? this.data.enrollData.totalCost + element.memberCost
                    : this.data.enrollData.totalCost + element.amount;
            this.checkAmountChanged();
        } else {
            if (type === CoverageChangingFields.riders) {
                this.selection.selected.riders.splice(this.selection.selected.riders.indexOf(element.id), 1);
            } else {
                this.selection.selected.incentive.splice(this.selection.selected.incentive.indexOf(element.id), 1);
            }
            this.data.enrollData.totalCost =
                type === CoverageChangingFields.riders
                    ? Math.round((this.data.enrollData.totalCost - element.memberCost) * 100) / 100
                    : this.data.enrollData.totalCost - element.amount;
        }
        this.checkForChanges(type);
    }

    addBeneficaryForm(name?: string, type?: string, percent?: number): FormGroup {
        if (name !== undefined || type !== undefined || percent !== undefined) {
            return this.fb.group({
                beneficiaryName: [name],
                beneficiaryType: [type],
                beneficiaryPercent: [percent],
            });
        }
        return this.fb.group({
            beneficiaryName: ["", Validators.required],
            beneficiaryType: ["", Validators.required],
            beneficiaryPercent: ["", Validators.required],
        });
    }

    checkForBeneficiary(): void {
        let existingBeneficiary = this.data.enrollData["beneficiaries"];
        const updatedBeneficiary = this.coverageForm.value["beneficiaryForms"];
        const updateBeneificiaryRecord = [];
        if (existingBeneficiary.length && updatedBeneficiary.length) {
            existingBeneficiary = existingBeneficiary.map((beneficiary) => {
                updateBeneificiaryRecord.push({
                    beneficiaryName: beneficiary.beneficiary.id,
                    beneficiaryType: this.convertToCamelCase(beneficiary.allocationType),
                    beneficiaryPercent: beneficiary.percent,
                });
                return updateBeneificiaryRecord;
            });
            this.isBeneFiciaryChange = JSON.stringify(updatedBeneficiary) === JSON.stringify(updateBeneificiaryRecord) ? true : false;
            this.checkForChanges();
        }
        if (existingBeneficiary.length !== updatedBeneficiary.length) {
            this.isBeneFiciaryChange = false;
            this.checkForChanges();
        }
        if (this.changeFields.length) {
            this.isDataChange = true;
        } else {
            this.isDataChange = this.isBeneFiciaryChange ? false : true;
        }
    }

    addAnotherBeneficiary(): void {
        this.beneficiaryFormsArray.push(this.addBeneficaryForm());
        this.checkForBeneficiary();
    }

    checkForSingleBeneficiary(): number {
        return this.beneficiaryFormsArray.value.filter((beneficiary) => beneficiary.beneficiaryType === AppSettings.PRIMARY).length;
    }

    removeBeneficiary(index: number): void {
        this.beneficiaryFormsArray.controls.splice(index, 1);
        this.beneficiaryFormsArray.value.splice(index, 1);
        this.checkForBeneficiary();
        this.checkForAllBeneficiaryPercentages();
    }

    isShowRemoveOption(type: string): boolean {
        if (this.beneficiaryFormsArray.length > 0) {
            if (type === AppSettings.PRIMARY) {
                if (this.checkForSingleBeneficiary() !== 1) {
                    return true;
                }
            } else {
                return true;
            }
        }
        if (this.beneficiaryFormsArray.length === 1 && type === AppSettings.PRIMARY) {
            return true;
        }
        return false;
    }

    voidCoverage(planName: number): void {
        const voidCoverageDialog = this.dialog.open(VoidCoverageComponent, {
            width: "700px",
            data: {
                planName: planName,
                mpGroup: this.data.mpGroup,
                memberId: this.data.memberId,
                enrollId: this.data.enrollData.id,
            },
        });

        voidCoverageDialog.afterClosed().subscribe((data) => {
            if (data !== undefined) {
                this.onCancelClick(data);
            }
        });
    }

    searchEnrollment(): any {
        if (this.isDataChange === true) {
            this.showModal();
        } else {
            this.search();
        }
    }

    getIncentivesData(): void {
        this.subscription.add(
            this.memberService.getMemberIncentives(this.data.memberId, this.data.mpGroup).subscribe((data) => {
                if (data.status === AppSettings.API_RESP_200) {
                    data.body.forEach((incentive) => {
                        if (incentive.applicableProductIds && incentive.applicableProductIds.length > 0) {
                            incentive.applicableProductIds.forEach((prdId) => {
                                if (prdId === this.data.enrollData.plan.product.id) {
                                    this.incentivesData.push({
                                        id: incentive.id,
                                        name: incentive.name,
                                        amount: incentive.amount,
                                    });
                                }
                            });
                        }
                    });
                    this.isIncentiveData = this.incentivesData.length > 0 ? true : false;
                    this.incentivesData.forEach((incentive) => {
                        this.selection.selected.incentive.push(incentive.id);
                    });
                    this.selectedIncentives = this.selection.selected.incentive;
                    this.selectedIncentives.forEach((incentive) => {
                        this.selection.selected.incentive.forEach((element) => {
                            if (element === incentive) {
                                const index = this.incentivesData.findIndex((x) => x.id === element);
                                if (index > -1) {
                                    this.incentivesData[index].checked = true;
                                }
                            }
                        });
                    });
                    this.incentivesDataSouce.data = this.isIncentiveData === true ? this.incentivesData : null;
                }
            }),
        );
    }

    unchangedData(type: string): void {
        if (this.changeFields.indexOf(type) !== -1) {
            this.changeFields.splice(this.changeFields.indexOf(type), 1);
        }
    }

    addChangeField(changeField: string): void {
        if (!this.changeFields.find((field) => field === changeField)) {
            this.changeFields.push(changeField);
        }
    }

    checkForChanges(type?: any): void {
        if (this.coverageForm.value["tobaccoStatus"]) {
            if (this.data.enrollData["tobaccoStatus"] !== this.coverageForm.value["tobaccoStatus"]) {
                this.addChangeField(CoverageChangingFields.tobaccoStatus);
            } else {
                this.unchangedData(CoverageChangingFields.tobaccoStatus);
            }
        }

        if (this.coverageForm.value["taxStatus"]) {
            if (this.data.enrollData["taxStatus"] !== this.coverageForm.value["taxStatus"]) {
                this.addChangeField(CoverageChangingFields.taxStatus);
            } else {
                this.unchangedData(CoverageChangingFields.taxStatus);
            }
        }

        if (!this.isBeneFiciaryChange) {
            this.addChangeField(CoverageChangingFields.beneficiarry);
        } else {
            this.unchangedData(CoverageChangingFields.beneficiarry);
        }

        this.checkForBenefitAmount();
        this.checkForBaseCost(type);
        this.isDataChange = this.changeFields.length > 0 ? true : false;
    }

    checkForBenefitAmount(): void {
        if (this.data.enrollData["benefitAmount"] && this.coverageForm.value["benefitAmount"]) {
            if (this.data.enrollData["benefitAmount"] !== this.coverageForm.value["benefitAmount"]) {
                this.addChangeField(CoverageChangingFields.benefitAmount);
            } else {
                this.unchangedData(CoverageChangingFields.benefitAmount);
            }
        }
    }

    checkForBaseCost(type: string): void {
        if (this.baseCost !== this.data.enrollData.totalCost) {
            if (type === CoverageChangingFields.riders) {
                this.addChangeField(CoverageChangingFields.riders);
            } else {
                this.addChangeField(CoverageChangingFields.incentives);
            }
        } else {
            this.unchangedData(CoverageChangingFields.riders);
            this.unchangedData(CoverageChangingFields.incentives);
        }
    }

    openCoverageChanging(): void {
        this.validateAllFormFields(this.coverageForm);
        this.updateDependents();
        this.setUpdatedCoverageData();
        if (this.coverageForm.valid && !this.mustBePrimaryBeneficiaryFirst) {
            const coverageChangingDialog = this.dialog.open(CoverageChangingComponent, {
                width: "1000px",
                data: {
                    enrollData: this.data.enrollData,
                    memberId: this.data.memberId,
                    changedFields: this.changeFields,
                    mpGroup: this.data.mpGroup,
                    updateCoverageRequest: this.updateCoverageRequest,
                },
            });

            coverageChangingDialog.afterClosed().subscribe((data) => {
                if (data !== undefined && data.status === 204) {
                    this.matDialogRef.close();
                }
            });
        }
    }

    setEnrollData(data: any): void {
        this.subscription.add(
            forkJoin(
                this.enrollmentsService.getEnrollmentBeneficiaries(this.data.memberId, data.id, this.data.mpGroup),
                this.enrollmentsService.getEnrollmentRiders(this.data.memberId, data.id, this.data.mpGroup),
                this.enrollmentsService.getEnrollmentDependents(this.data.memberId, data.id, this.data.mpGroup),
            ).subscribe((response) => {
                if (response[0].length > 0) {
                    this.data.enrollData.enrollmentBeneficiaries = response[0];
                }
                if (response[1].length > 0) {
                    this.data.enrollData.enrollmentRiders = response[1];
                }
                if (response[2].length > 0) {
                    this.data.enrollData.enrollmentDependents = response[2];
                }
            }),
        );
        this.isLoading = true;
        this.isData.Current = data.status === EnrollmentStatusType.APPROVED ? true : false;
        this.coverageForm.get("coverageStartDate").setValue(data.validity.effectiveStarting);
        this.coverageForm.get("coverageEndDate").setValue(data.validity.expiresAfter);
        this.isLoading = false;
    }

    getBenefitDetailsData(): void {
        let benefitDetails: any[] = [];
        this.subscription.add(
            this.enrollmentsService.getEnrollmentsWithPerPayCosts(this.data.memberId, this.data.mpGroup, true).subscribe((data) => {
                benefitDetails = data;
                if (benefitDetails.length > 0) {
                    this.getBenefitAmount(benefitDetails);
                }
            }),
        );
    }

    getCoverageLevelData(): void {
        if (this.data.enrollData.coverageLevel) {
            this.coverageForm.get("coverageStartDate").setValue(this.data.enrollData.validity.effectiveStarting);
            this.coverageForm.get("coverageEndDate").setValue(this.data.enrollData.validity.expiresAfter);
        }
    }

    getBeneficiariesData(): void {
        if (this.data.enrollData.beneficiaries && this.data.enrollData.beneficiaries.length > 0) {
            this.noBeneficaryDataFound = false;
            this.addFormControls(this.data.enrollData.beneficiaries);
        }
    }

    getRidersData(): void {
        if (this.data.enrollData.enrollmentRiders && this.data.enrollData.enrollmentRiders.length > 0) {
            this.data.enrollData.enrollmentRiders.forEach((rider) => {
                this.selection.selected.riders.push(rider.id);
            });
            this.selectedRiders = this.selection.selected.riders;
            this.selectedRiders.forEach((rider) => {
                this.selection.selected.riders.forEach((element) => {
                    if (element === rider) {
                        const index = this.data.enrollData.enrollmentRiders.findIndex((x) => x.id === element);
                        if (index > -1) {
                            this.data.enrollData.enrollmentRiders[index].checked = true;
                        }
                    }
                });
            });
            this.dataSource.data = this.data.enrollData.enrollmentRiders;
        }
    }

    setBeneFiciary(): any {
        const beneficiaryArray = [];
        this.coverageForm.value.beneficiaryForms.forEach((beneficiary) => {
            beneficiaryArray.push({
                beneficiaryId: beneficiary.beneficiaryName,
                allocationType: beneficiary.beneficiaryType.toUpperCase(),
                percent: beneficiary.beneficiaryPercent,
            });
        });
        return beneficiaryArray;
    }

    setUpdatedCoverageData(): void {
        this.updateCoverageRequest["beneficiaries"] = this.coverageForm.value.beneficiaryForms.length ? this.setBeneFiciary() : undefined;
        this.updateCoverageRequest["riderIds"] = this.selection.selected["riders"];
        this.updateCoverageRequest.enrollment.coverageLevelId =
            this.data.enrollData.coverageLevel.id !== undefined ? this.data.enrollData.coverageLevel.id : undefined;
        this.updateCoverageRequest.enrollment.memberCost =
            this.data.enrollData.memberCost !== undefined ? Number(this.data.enrollData.memberCost.toFixed(2)) : undefined;
        this.updateCoverageRequest.enrollment.totalCost = Number(this.data.enrollData["totalCost"].toFixed(2));
        this.updateCoverageRequest.enrollment.taxStatus = this.coverageForm.value["taxStatus"];
        this.updateCoverageRequest.enrollment.tobaccoStatus = this.coverageForm.value["tobaccoStatus"];
        this.updateCoverageRequest.enrollment.benefitAmount = this.data.enrollData["benefitAmount"];
        this.updateCoverageRequest.enrollment.validity.effectiveStarting = this.datepipe.transform(
            this.data.enrollData.validity.effectiveStarting,
            AppSettings.DATE_FORMAT_YYYY_MM_DD,
        );
        this.updateCoverageRequest.enrollment.validity.expiresAfter = this.coverageForm.value["coverageEndDate"]
            ? this.datepipe.transform(this.coverageForm.value["coverageEndDate"], AppSettings.DATE_FORMAT_YYYY_MM_DD)
            : undefined;
    }

    close(ele: any, type: string): any {
        if (type === CoverageChangingFields.cancel) {
            ele.close();
        } else {
            this.matDialogRef.close(CoverageChangingFields.cancel);
        }
    }

    showModal(): void {
        const dialogData: MonDialogData = {
            title: this.languageStrings["primary.portal.editCoverage.modalTitle"],
            content: this.languageStrings["primary.portal.editCoverage.modalContent"].replace("#planName", this.data.enrollData.plan.name),
            secondaryButton: {
                buttonTitle: this.languageStrings["primary.portal.editCoverage.modalPrimaryButton"],
                buttonAction: this.setPreviousDate(),
                buttonClass: "mon-btn-link editcoverage-btn-hover",
            },
            primaryButton: {
                buttonTitle: this.languageStrings["primary.portal.editCoverage.modalSecondaryButton"],
                buttonAction: this.close.bind(this, this.dialog),
                buttonClass: "mon-btn-primary",
            },
        };
        this.dialog.open(MonDialogComponent, {
            data: dialogData,
            width: "40rem",
        });
    }

    setPreviousDate(): any {
        const date = this.datepipe.transform(this.coverageForm.get("coverageDate").value, AppSettings.DATE_FORMAT);
        if (this.data.enrollData.validity.effectiveStarting !== date) {
            this.coverageForm.get("coverageDate").setValue(this.data.enrollData.validity.effectiveStarting);
        }
    }

    updateDependents(): void {
        if (!this.noDataFound && this.dependentInfo.dependentsFormArray.length > 0) {
            let dependentObject: Dependents = {
                dependentId: null,
                validity: {
                    effectiveStarting: null,
                    expiresAfter: null,
                },
            };
            this.data.enrollData.enrollmentDependents.forEach((element) => {
                dependentObject.dependentId = element.dependentId;
                dependentObject.validity.effectiveStarting = this.datepipe.transform(
                    element.validity.effectiveStarting,
                    AppSettings.DATE_FORMAT,
                );
                if (element.validity.expiresAfter) {
                    dependentObject.validity.expiresAfter = element.validity.expiresAfter
                        ? this.datepipe.transform(element.validity.expiresAfter, AppSettings.DATE_FORMAT)
                        : null;
                } else {
                    dependentObject.validity.expiresAfter = null;
                }
                this.dependentObjectArray.push(dependentObject);
            });
            this.dependentInfo.dependentsFormArray.value.forEach((element) => {
                dependentObject = {
                    dependentId: null,
                    validity: {
                        effectiveStarting: null,
                        expiresAfter: null,
                    },
                };
                if (element.dependentId !== "" && element.operation === null) {
                    this.isDependentChange = true;
                    dependentObject.dependentId = element.dependentId;
                    dependentObject.validity.effectiveStarting = this.datepipe.transform(element.startDate, AppSettings.DATE_FORMAT);
                    dependentObject.validity.expiresAfter = element.endDate
                        ? this.datepipe.transform(element.endDate, AppSettings.DATE_FORMAT)
                        : null;
                    this.dependentObjectArray.push(dependentObject);
                }
            });
            if (this.dependentObjectArray.length > 0 && this.dependentInfo.dependentsFormArray.length > 0 && this.isDependentChange) {
                if (this.dataChange.indexOf(CoverageChangingFields.dependent) < 0) {
                    this.dataChange.push(CoverageChangingFields.dependent);
                }
                this.updateCoverageRequest["dependents"] = this.dependentObjectArray;
            } else {
                this.updateCoverageRequest["dependents"] = undefined;
            }
        }
    }

    updateBeneficiary(): void {
        if (this.dataChange.indexOf(CoverageChangingFields.dependent) < 0) {
            this.dataChange.push(CoverageChangingFields.beneficiarry);
        }
        const beneficiaries = [];
        this.coverageForm.value.beneficiaryForms.forEach((element) => {
            const beneficiary = this.beneficiaryArray.find(
                (beneficiaryRecord) => beneficiaryRecord.beneficiaryName === element.beneficiaryName,
            );
            beneficiaries.push({
                beneficiaryId: beneficiary.id,
                allocationType: beneficiary,
                percent: beneficiary,
            });
        });
    }

    checkAmountChanged(): void {
        if (this.dependentObjectArray.length > 0 && this.data.enrollData.totalCost > this.baseCost) {
            const amount = Math.round((this.data.enrollData.totalCost - this.baseCost) * 100) / 100;
            this.dependentMsg = this.languageStrings["primary.portal.editCoverage.dependentMsg"]
                .replace("#payFrequency", this.data.payFrequency)
                .replace("#amount", String(amount));
        }
    }

    convertToCamelCase(str: string): string {
        return str[0].toUpperCase() + str.substr(1).toLowerCase();
    }

    get beneficiaryFormsArray(): FormArray {
        return this.coverageForm.get("beneficiaryForms") as FormArray;
    }

    addFormControls(beneficiaryData?: any): void {
        if (beneficiaryData !== undefined && beneficiaryData.length > 0) {
            beneficiaryData.forEach((beneficiary) => {
                this.beneficiaryFormsArray.push(
                    this.addBeneficaryForm(
                        beneficiary.beneficiary.id,
                        this.convertToCamelCase(beneficiary.allocationType),
                        beneficiary.percent,
                    ),
                );
            });
        } else {
            this.beneficiaryFormsArray.push(this.addBeneficaryForm());
            this.noBeneficaryDataFound = false;
            this.checkForBeneficiary();
        }
    }
    getBenefitAmount(benefitDetails: any): void {
        this.subscription.add(
            this.shoppingService
                .getPlanOfferingPricing(
                    this.data.enrollData.planOfferingId,
                    this.data.enrollData.plan.policyOwnershipType === PolicyOwnershipType.INDIVIDUAL
                        ? this.data.enrollData.this.data.enrollmentState
                        : null,
                    null,
                    this.data.memberId,
                    this.data.mpGroup,
                )
                .subscribe((list) => {
                    if (list.length > 0) {
                        this.isLoading = true;
                        list.forEach((amount) => {
                            this.benefitAmounts.push(amount.benefitAmount);
                            if (
                                amount.benefitAmount === this.data.enrollData.benefitAmount &&
                                amount.coverageLevelId === this.data.enrollData.coverageLevel.id
                            ) {
                                this.benefitAmount = amount.benefitAmount;
                            }
                        });
                    }
                    if (this.benefitAmount !== undefined) {
                        this.showBenefitDetailsTable(benefitDetails, this.benefitAmount);
                    } else {
                        this.showBenefitDetailsTable(benefitDetails);
                    }
                }),
        );
    }

    showBenefitDetailsTable(benefitData: any, data?: any): void {
        benefitData.forEach((benefit) => {
            if (benefit.id === this.data.enrollData.id) {
                if (benefit.benefitAmount !== undefined && data !== undefined) {
                    this.coverageForm.get("benefitAmount").setValue(benefit.benefitAmount);
                    this.benefitDetailsData.push(this.languageStrings["primary.portal.editCoverage.benefitamount"]);
                }
                if (benefit.taxStatus !== undefined) {
                    this.coverageForm.get("taxStatus").setValue(benefit.taxStatus);
                    this.benefitDetailsData.push(this.languageStrings["primary.portal.editCoverage.taxStatus"]);
                }
                if (benefit.tobaccoStatus !== undefined) {
                    this.coverageForm.get("tobaccoStatus").setValue(benefit.tobaccoStatus);
                    this.benefitDetailsData.push(this.languageStrings["primary.portal.editCoverage.tobaccoStatus"]);
                }
                if (benefit.memberCostPerPayPeriod !== undefined && this.data.payFrequency !== undefined) {
                    this.coverageForm.get("payFrequencyCost").setValue(benefit.memberCostPerPayPeriod);
                    this.payrollFrequencyLabel = this.languageStrings["primary.portal.editCoverage.payrollFrequencyCost"].replace(
                        "#payFrequency",
                        this.data.payFrequency,
                    );
                    this.benefitDetailsData.push(this.payrollFrequencyLabel);
                }
                if (benefit.totalCostPerPayPeriod !== undefined) {
                    this.totalCostPerPayPeriod = benefit.totalCostPerPayPeriod;
                    const result = benefit.totalCostPerPayPeriod - benefit.memberCostPerPayPeriod;
                    this.coverageForm.get("employeeContribution").setValue(Number(result.toFixed(2)));
                    this.benefitDetailsData.push(this.languageStrings["primary.portal.editCoverage.employerContribution"]);
                }
            }
            this.benefitDetailsDataSource.data = this.benefitDetailsData;
            this.isLoading = false;
        });
    }
    onDependentFormChange(event: boolean): void {
        if (!event) {
            this.unchangedData(CoverageChangingFields.dependent);
        } else {
            this.addChangeField(CoverageChangingFields.dependent);
        }
        this.checkForChanges();
    }

    getBeneficiaryStatus(name: any): boolean {
        this.isDisable = false;
        if (this.existingBeneficiaryData && this.existingBeneficiaryData.length) {
            const index = this.existingBeneficiaryData.findIndex((y) => y.beneficiaryName === name);
            if (index > -1) {
                this.isDisable = true;
            }
        }
        if (!this.isDisable && this.beneficiaryFormsArray.length > -1) {
            this.beneficiaryFormsArray.value.forEach((element) => {
                if (element.beneficiaryName === name) {
                    this.isDisable = true;
                    return;
                }
            });
        }
        return this.isDisable;
    }

    isCancelIcon(status: any): boolean {
        if (
            status === CoverageChangingFields.declined ||
            status === CoverageChangingFields.appDenied ||
            status === CoverageChangingFields.voidField
        ) {
            return true;
        }
        return false;
    }
    /**
     * Method to search Enrollments
     */
    search(): any {
        let count = 0;
        const date = this.datepipe.transform(this.coverageForm.get("coverageDate").value, AppSettings.DATE_FORMAT);
        this.subscription.add(
            this.enrollmentsService.searchMemberEnrollments(this.data.memberId, this.data.mpGroup).subscribe((data) => {
                if (data.length > 0) {
                    data.forEach((element) => {
                        if (
                            (date >= element.validity.effectiveStarting || (this.isContinous && date < element.validity.expiresAfter)) &&
                            element.plan.product.id === this.data.enrollData.plan.product.id
                        ) {
                            this.noDataFound = false;
                            if (element.id !== this.data.enrollData.id) {
                                this.setEnrollData(element);
                            }
                        } else {
                            count = count + 1;
                        }
                    });
                    if (count === data.length && this.isDataChange === false) {
                        this.noDataFound = true;
                    }
                } else {
                    this.noDataFound = true;
                }
            }),
        );
    }

    checkIsAddingFirstBeneficiary(): void {
        this.mustBePrimaryBeneficiaryFirst = false;
        if (
            this.coverageForm.value.beneficiaryForms.length === 1 &&
            this.coverageForm.value.beneficiaryForms[0].beneficiaryType !== AppSettings.PRIMARY
        ) {
            this.mustBePrimaryBeneficiaryFirst = true;
        }
    }

    checkForAllBeneficiaryPercentages(): void {
        this.checkIsAddingFirstBeneficiary();
        this.beneficiaryFormsArray.clearValidators();
        this.beneficiaryFormsArray.setErrors(null);
        let totalPrimaryPercent = 0;
        let totalSecondaryPercent = 0;
        let isPrimaryBeneficiaryAvailable: boolean;
        let isSecondaryBeneficiaryAvailable: boolean;
        this.beneficiaryFormsArray.controls.forEach((ele) => {
            if (ele.get("beneficiaryType").value.toUpperCase() === AppSettings.PRIMARY.toUpperCase()) {
                isPrimaryBeneficiaryAvailable = true;
                totalPrimaryPercent = totalPrimaryPercent + ele.get("beneficiaryPercent").value;
            } else if (ele.get("beneficiaryType").value !== "") {
                isSecondaryBeneficiaryAvailable = true;
                totalSecondaryPercent = totalSecondaryPercent + ele.get("beneficiaryPercent").value;
            }
        });

        if (isPrimaryBeneficiaryAvailable && totalPrimaryPercent !== 100) {
            this.beneficiaryFormsArray.setErrors({
                allocationMustBeHundred: true,
            });
        }

        if (isSecondaryBeneficiaryAvailable && totalSecondaryPercent !== 100) {
            this.beneficiaryFormsArray.setErrors({
                allocationMustBeHundred: true,
            });
        }
        this.coverageForm.updateValueAndValidity();
    }

    validateAllFormFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((field) => {
            const control = formGroup.get(field);
            if (control["controls"]) {
                for (const subField in control["controls"]) {
                    if (subField) {
                        control["controls"][subField].markAsTouched({ onlySelf: true });
                    }
                }
            } else {
                control.markAsTouched({ onlySelf: true });
            }
        });
    }

    checkForCoverageEndDate(): void {
        if (
            this.datepipe.transform(this.coverageForm.value.coverageEndDate, AppSettings.DATE_FORMAT_YYYY_MM_DD) >=
            this.datepipe.transform(this.todayDate, AppSettings.DATE_FORMAT_YYYY_MM_DD)
        ) {
            this.addChangeField(CoverageChangingFields.coverageEndDate);
        } else {
            this.unchangedData(CoverageChangingFields.coverageEndDate);
        }
        this.checkForChanges();
    }

    gotoPendingEnrollment(): void {
        const url = `${this.portal}/${this.data.mpGroup}/member/${this.data.memberId}/pending-applications/view-enrollments/manage`;
        this.router.navigate([url]);
        this.onCancelClick();
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
