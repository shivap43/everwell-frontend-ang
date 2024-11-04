import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { SideNavService } from "./../../side-nav/services/side-nav.service";
import { PolicyChangeRequestList, AppSettings } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { PolicyTransactionForms } from "@empowered/api";
import { Select, Store } from "@ngxs/store";
import { PolicyChangeRequestState, SetRemoveRiderRequest, SetEnrolledRider } from "@empowered/ngxs-store";
import { Subscription, Observable } from "rxjs";
import { PolicyChangeRequestComponent } from "../../../policy-change-request.component";
import { PolicyChangeRequestCancelPopupComponent, PolicyChangeRequestConfirmationPopupComponent } from "@empowered/ui";

@Component({
    selector: "empowered-remove-rider",
    templateUrl: "./remove-rider.component.html",
    styleUrls: ["./remove-rider.component.scss"],
})
export class RemoveRiderComponent implements OnInit, OnDestroy {
    riderList: any[] = [];
    otherRider = {
        policyName: "Other",
        riderId: "Other",
    };
    riderIdList = [];
    removeRiderForm: FormGroup;
    removeRiderRequestInitialData: any;
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.policyChangeRequest.transactions.removeRider.header",
        "primary.portal.policyChangeRequest.transactions.continue",
        "primary.portal.policyChangeRequest.transactions.cancel",
        "primary.portal.dashboard.policyChangeRequestFlow.pcrFlow",
        "primary.portal.common.cancel",
        "primary.portal.common.back",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessage",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved",
        "primary.portal.policyChangeRequest.transactions.back",
        "primary.portal.common.next",
        "primary.portal.policyChangeRequest.transactions.requiredField",
        "primary.portal.policyChangeRequest.transactions.removeRider.otherRider",
        "primary.portal.policyChangeRequest.transactions.selectionRequired",
        "primary.portal.policyChangeRequest.transactions.removeRider.ridersToRemoved",
    ]);
    isRiderSelected: boolean;
    mpGroup: any;
    memberId: any;
    subscriptions: Subscription[] = [];
    policies = [];
    showSpinner: boolean;
    counter = 0;
    formArray: any;
    memberData: any;
    storeRiderList = [];
    selectedRider = [];
    selectedRiderNames = [];
    policyList = [];
    @Select(PolicyChangeRequestState.GetmemberInfo) memberInfo$: Observable<any>;
    @Select(PolicyChangeRequestState.GetRemoveRiderRequest) riderRequest$: Observable<any>;

    constructor(
        private readonly fb: FormBuilder,
        private readonly dialog: MatDialog,
        private readonly sideNavService: SideNavService,
        private readonly languageService: LanguageService,
        private readonly store: Store,
        private cancelDialogRef: MatDialogRef<PolicyChangeRequestCancelPopupComponent>,
        private readonly PCRDialogRef: MatDialogRef<PolicyChangeRequestComponent>,
    ) {}

    /**
     * Angular life-cycle hook: OnInit
     * Create remove rider form and set existing values from store
     */
    ngOnInit(): void {
        this.createForm();
        if (this.store.selectSnapshot(PolicyChangeRequestState.GetmemberInfo)) {
            this.memberData = this.store.selectSnapshot(PolicyChangeRequestState.GetmemberInfo);
            this.policyList = this.memberData["policies"];
            this.mpGroup = this.memberData["groupId"];
            this.memberId = this.memberData["memberId"];
        }

        this.subscriptions.push(
            this.riderRequest$.subscribe((riderRequest) => {
                if (riderRequest) {
                    this.getDataFromStore(riderRequest);
                } else {
                    this.riderList = [...this.memberData.riderPolicies];
                    this.createRiderControl();
                }
            }),
        );
    }

    createForm(): void {
        this.removeRiderForm = this.fb.group(
            {
                riderIds: this.fb.array([]),
                type: Object.keys(PolicyTransactionForms)[10],
            },

            { updateOn: "blur" },
        );
    }
    /**
     * @description create control for riders available for policy
     * @return void
     */
    createRiderControl(): void {
        this.formArray = this.removeRiderForm.get("riderIds") as FormArray;
        if (this.riderList.some((rider) => rider.riderId === this.otherRider.riderId)) {
            this.riderList.push(this.otherRider);
        }
        if (this.storeRiderList.length) {
            this.riderList.forEach((element) => {
                const setValue = this.storeRiderList.indexOf(element) !== -1;
                this.formArray.push(this.fb.control(setValue));
            });
        } else {
            this.riderList.forEach((element) => {
                this.formArray.push(this.fb.control(false));
            });
        }
        this.removeRiderRequestInitialData = { ...this.removeRiderForm.value, riderName: [] };
    }

    getDataFromStore(riderRequest: any): void {
        if (riderRequest.otherRider) {
            this.isOtherSelected(true, riderRequest.otherRider);
            this.storeRiderList.push(this.otherRider);
        }

        if (this.store.selectSnapshot(PolicyChangeRequestState.GetEnrolledRider)) {
            this.riderList = [...this.store.selectSnapshot(PolicyChangeRequestState.GetEnrolledRider)];
        }

        this.storeRiderList = [...riderRequest["riderIds"], ...this.storeRiderList];
        this.counter = this.storeRiderList.length ? this.storeRiderList.length : 0;
        if (riderRequest["riderIds"].indexOf("Other") >= 0) {
            this.counter = this.counter - 1;
        }
        this.convertRiderList();
        this.removeRiderForm.patchValue(riderRequest);
        this.createRiderControl();
    }

    /**
     * Set selected riders in the store rider list
     */
    convertRiderList(): void {
        if (this.storeRiderList.length) {
            this.riderList.forEach((rider) => {
                const matchedRiderIndex = this.storeRiderList.findIndex((riderId) => riderId === rider.riderId);
                if (matchedRiderIndex > -1) {
                    this.storeRiderList[matchedRiderIndex] = rider;
                }
            });
        }
    }

    /**
     * Set selected rider policy numbers in an array
     */
    setRiders(): void {
        this.selectedRider = this.riderList.filter((x, i) => !!this.removeRiderForm.value.riderIds[i]);
        this.selectedRiderNames = this.selectedRider.map((rider) => rider.policyName);
        this.selectedRider = this.selectedRider.map((rider) => rider.riderId);
    }

    cancel(): void {
        this.cancelDialogRef = this.dialog.open(PolicyChangeRequestCancelPopupComponent, {
            width: "667px",
            data: {
                cancelModalDisplayType: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.pcrFlow"],
                cancelButton: this.languageStrings["primary.portal.common.cancel"],
                backButton: this.languageStrings["primary.portal.common.back"],
                requestType: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.cancelMessage"],
                description: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved"],
            },
        });
        this.subscriptions.push(
            this.cancelDialogRef.afterClosed().subscribe((result) => {
                if (result === AppSettings.CANCEL) {
                    this.sideNavService.removeTransactionScreenFromStore(true);
                    this.store.dispatch(new SetRemoveRiderRequest(null, null));
                    this.store.dispatch(new SetEnrolledRider(null));
                    this.PCRDialogRef.close(PolicyChangeRequestList.cancel);
                }
            }),
        );
    }

    back(): void {
        this.sideNavService.onBackClick();
    }

    /**
     * On selection of other from rider list
     * @param event
     * @param rider
     */
    isOtherSelected(isOtherSelected: boolean, otherRiderName: string = ""): void {
        if (isOtherSelected) {
            this.removeRiderForm.addControl("otherRider", this.fb.control(otherRiderName, [Validators.required]));
        } else {
            this.removeRiderForm.removeControl("otherRider");
        }
        this.removeRiderRequestInitialData = { ...this.removeRiderForm.value };
    }

    /**
     * On check rider, if other option seleced add other rider control, and
     * Add riderId in riderId list array
     */
    onCheckedRider(isRiderChecked: boolean, riderId: any): void {
        this.counter = isRiderChecked ? this.counter + 1 : this.counter - 1;

        this.isRiderSelected = !isRiderChecked;
        if (riderId === "Other") {
            this.isOtherSelected(isRiderChecked);
        }
    }

    /**
     * Get form controls
     */
    get formControl(): Record<string, AbstractControl> {
        return this.removeRiderForm.controls;
    }

    /**
     * Submit remove rider request
     */
    removeRider(): void {
        this.isRiderSelected = this.riderIdList.length <= 0 ? true : false;
        if (this.isAnyRiderSelected()) {
            this.openConfirmationPopup();
        } else {
            this.setRiders();
            this.storeRemoveRider();
        }
    }
    /**
     * @description saving selected rider data in store
     * @return void
     */
    storeRemoveRider(): void {
        this.removeRiderForm.value["riderIds"] = this.selectedRider;
        this.validateAllFormFields(this.removeRiderForm);
        if (this.removeRiderForm.valid && this.counter > 0) {
            this.store.dispatch(new SetEnrolledRider(this.riderList));
            const updatedRemoveRiderRequest = { ...this.removeRiderForm.value, riderName: this.selectedRiderNames };
            this.store.dispatch(new SetRemoveRiderRequest(updatedRemoveRiderRequest, this.removeRiderRequestInitialData));
            this.sideNavService.onNextClick(1);
        }
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

    /**
     * Show request change confirmation popup
     */
    openConfirmationPopup(): void {
        const dialogRef = this.dialog.open(PolicyChangeRequestConfirmationPopupComponent, {
            width: "667px",
            data: {
                cancelButton: this.languageStrings["primary.portal.policyChangeRequest.transactions.cancel"],
                continueButton: this.languageStrings["primary.portal.policyChangeRequest.transactions.continue"],
                requestType: this.languageStrings["primary.portal.policyChangeRequest.transactions.removeRider.header"],
            },
        });
        this.subscriptions.push(
            dialogRef.afterClosed().subscribe((result) => {
                if (result === AppSettings.CONTINUE) {
                    this.store.dispatch(new SetRemoveRiderRequest(null, null));
                    this.sideNavService.onNextClick(1);
                } else {
                    dialogRef.close();
                }
            }),
        );
    }
    /**
     * @description function for checking any one rider is selected
     * @return whether any one of rider is selected
     */
    isAnyRiderSelected(): boolean {
        const isAnyRiderSelected = this.removeRiderForm.controls.riderIds.value.includes(true);
        if (isAnyRiderSelected) {
            this.removeRiderForm.markAsUntouched();
        }
        return !isAnyRiderSelected && this.removeRiderForm.valid;
    }
    /**
     * This method will unsubscribe all the api subscription.
     */
    ngOnDestroy(): void {
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
    }
}
