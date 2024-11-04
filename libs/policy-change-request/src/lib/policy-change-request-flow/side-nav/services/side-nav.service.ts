import { Injectable } from "@angular/core";
import { Observable, Subject, BehaviorSubject } from "rxjs";
import { Location } from "@angular/common";
import { Select, Store } from "@ngxs/store";
import {
    PolicyChangeRequestState,
    SetRequestPolicyChanges,
    SetFindPolicyHolderDetails,
    SetMemeberInfo,
    SetAffectedPoliciesDetails,
    SetAddressChangeRequest,
    SetNameChangeRequest,
    SetTransferToDirectRequest,
    SetRemoveDependantRequest,
    SetChangeBeneficiaryRequest,
    SetOccupationalClassChangeRequest,
    SetDowngradeAccidentRequest,
    SetDowngradeDisabilityRequest,
    SetDowngradeCancerRequest,
    SetRemoveRiderRequest,
    SetGenderChangeRequest,
    SetTransferToPayrollRequest,
    SetBeneficiary,
    SetEnrolledRider,
} from "@empowered/ngxs-store";
import { PolicyTransactionForms } from "@empowered/api";

@Injectable({
    providedIn: "root",
})
export class SideNavService {
    stepClicked$ = new Subject<number>();
    policyChanged$ = new Subject<number>();
    defaultStepPositionChanged$ = new Subject<number>();
    policyChoiceMade$ = new Subject<any>();
    backClick$ = new BehaviorSubject<string>("");
    nextClick$ = new BehaviorSubject<string>("");
    policyIndex = 0;
    transactionFormList = [];
    transactionScreen: string;
    policyFlow$ = new Subject<number>();
    transactionFlow$ = new BehaviorSubject<string>("");
    @Select(PolicyChangeRequestState.GetRequestPolicyChanges) transactionScreenList$: Observable<any>;
    editFlag: boolean;
    removeFlag: boolean;
    flag: boolean;
    policyHolderName: any;
    enableReviewSubmitFlag: boolean;

    constructor(public location: Location, private store: Store) {
        this.transactionScreenList$.subscribe((data) => {
            if (data) {
                this.transactionFormList = data.requestPolicyChanges;
            }
        });
    }

    /**
     * Emit policy changed event on click on continue button
     */
    emitContinueEvent(): void {
        this.policyChanged$.next(1);
    }

    onBackClick(): void {
        this.removeFlag = false;
        this.editFlag = false;
        this.policyIndex = this.policyIndex - 1;
        if (this.policyIndex < 0) {
            this.defaultStepPositionChanged$.next(2);
        } else {
            this.transactionScreen = this.getTransactionScreen();
            this.transactionFlow$.next(this.transactionScreen);
        }
    }

    onEditClick(screenName: string): void {
        this.editFlag = true;
        this.transactionFlow$.next(screenName);
    }

    getEditFlag(): boolean {
        return this.editFlag;
    }

    onRemoveClick(value: number): void {
        if (value === 2 && !this.flag) {
            this.flag = true;
            this.policyIndex = this.policyIndex - 2;
        } else {
            this.policyIndex = this.policyIndex - 1;
        }
        this.removeFlag = true;
    }

    onSubmitClick(): void {
        this.editFlag = false;
        this.removeFlag = false;
        this.policyIndex = 0;
    }

    removeTransactionForm(form: string): void {
        const requestPolicyChanges = JSON.parse(
            JSON.stringify(this.store.selectSnapshot(PolicyChangeRequestState.GetRequestPolicyChanges)),
        );
        const requestArray = requestPolicyChanges["requestPolicyChanges"];
        if (requestArray) {
            const index = requestArray.indexOf(form);
            if (index !== -1) {
                requestArray.splice(index, 1);
            }
            this.store.dispatch(
                new SetRequestPolicyChanges({
                    requestPolicyChanges: requestArray,
                }),
            );
        }
    }

    removeTransactionScreenFromStore(submitFlag: boolean, specificFormReset?: any): void {
        if (submitFlag) {
            this.store.dispatch(new SetFindPolicyHolderDetails(null));
            this.store.dispatch(new SetRequestPolicyChanges(null));
            this.store.dispatch(new SetMemeberInfo(null));
            this.store.dispatch(new SetAffectedPoliciesDetails(null));
            this.transactionFormList.forEach((transactionForm) => {
                this.clearTransactionFormStoreData(transactionForm);
            });
        } else {
            this.clearTransactionFormStoreData(specificFormReset);
        }

        this.onSubmitClick();
    }

    clearTransactionFormStoreData(formName: string): void {
        switch (formName) {
            case PolicyTransactionForms.ADDRESS:
                this.store.dispatch(new SetAddressChangeRequest(null, null));
                break;
            case PolicyTransactionForms.NAME:
                this.store.dispatch(new SetNameChangeRequest(null, null));
                break;
            case PolicyTransactionForms.BILLING_MODE_CHANGE:
                this.store.dispatch(new SetTransferToPayrollRequest(null, null));
                break;
            case PolicyTransactionForms.TRANSFER_TO_DIRECT:
                this.store.dispatch(new SetTransferToDirectRequest(null, null));
                break;
            case PolicyTransactionForms.DELETION:
                this.store.dispatch(new SetRemoveDependantRequest(null, null));
                break;
            case PolicyTransactionForms.BENEFICIARY_INFORMATION:
                this.store.dispatch(new SetChangeBeneficiaryRequest(null, null));
                this.store.dispatch(new SetBeneficiary(null, null));
                break;
            case PolicyTransactionForms.OCCUPATION_CLASS_CHANGE:
                this.store.dispatch(new SetOccupationalClassChangeRequest(null, null));
                break;
            case PolicyTransactionForms.ACCIDENTAL_DOWNGRADE:
                this.store.dispatch(new SetDowngradeAccidentRequest(null, null));
                break;
            case PolicyTransactionForms.DISABILITY_DOWNGRADE:
                this.store.dispatch(new SetDowngradeDisabilityRequest(null, null));
                break;
            case PolicyTransactionForms.CANCER_RIDER_DOWNGRADE:
                this.store.dispatch(new SetDowngradeCancerRequest(null, null));
                break;
            case PolicyTransactionForms.REMOVE_RIDER:
                this.store.dispatch(new SetRemoveRiderRequest(null, null));
                this.store.dispatch(new SetEnrolledRider(null));
                break;
            case PolicyTransactionForms.GENDER_CHANGE:
                this.store.dispatch(new SetGenderChangeRequest(null, null));
                break;
            default:
                break;
        }
    }
    setPolicyHolderName(policyHolderName: string): void {
        this.policyHolderName = policyHolderName;
    }
    getPolicyHolderName(): string {
        return this.policyHolderName;
    }

    onNextClick(transactionIndex: number): void {
        if (!this.editFlag && !this.removeFlag) {
            this.policyIndex = this.policyIndex + 1;
        }
        if (transactionIndex === 0) {
            this.policyIndex = this.policyIndex - 1;
        }
        if (this.policyIndex >= this.transactionFormList.length) {
            this.enableReviewSubmitFlag = true;
            this.defaultStepPositionChanged$.next(4);
        } else {
            this.transactionScreen = this.getTransactionScreen();
            if (this.transactionScreen) {
                this.transactionFlow$.next(this.transactionScreen);
            }
        }
    }

    getEnableNextScreen(): boolean {
        return this.enableReviewSubmitFlag;
    }

    setEnableNextScreen(): void {
        this.enableReviewSubmitFlag = false;
    }

    getNextPolicyEvent(): Observable<any> {
        return this.policyChanged$.asObservable();
    }

    getTransactionScreen(): string {
        if (this.policyIndex < 0) {
            this.policyIndex = 0;
        }
        return this.transactionFormList[this.policyIndex];
    }
}
