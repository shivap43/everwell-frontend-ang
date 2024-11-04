import { State, Action, StateContext, Selector } from "@ngxs/store";
import {
    SetMemeberInfo,
    SetAddressChangeRequest,
    SetNameChangeRequest,
    SetOccupationalClassChangeRequest,
    SetGenderChangeRequest,
    SetDowngradeCancerRequest,
    SetDowngradeDisabilityRequest,
    SetDowngradeAccidentRequest,
    SetPlanId,
    SetEnrollmentId,
    SetRequestPolicyChanges,
    SetAffectedPoliciesDetails,
    SetFindPolicyHolderDetails,
    SetTransferToPayrollRequest,
    SetRemoveDependantRequest,
    SetTransferToDirectRequest,
    SetChangeBeneficiaryRequest,
    SetRemoveRiderRequest,
    SetTransactionRequestData,
    SetTransactionArray,
    SetEnrolledRider,
    SetBeneficiary,
} from "./request.action";
import {
    MemberInfoDetails,
    AddressChangeRequest,
    NameChangeRequest,
    GenderChangeRequest,
    OccupationalClassChangeRequest,
    MemberEnrollmentModel,
    PolicyHolderModel,
    FindPolicyHolderRequestModel,
    AffectedPoliciesModel,
    TransferToPayrollRequest,
    RemoveDependantRequest,
    TransferToDirectRequest,
    ChangeBeneficiaryRequest,
    AccidentDowngradeChangeRequest,
    DowngradeDisabilityRequest,
    DowngradeCancerRequest,
    RemoveRiderRequest,
    ChangeTransactionRequestData,
    EnrolledRiderRequestData,
    Beneficiary,
} from "./request.model";
import {
    FindPolicyholderModel,
    ChangeAddressRequestModel,
    ChangeNameRequestModel,
    ChangeOccupationClassRequestModel,
    ChangeGenderRequestModel,
    TransferToPayrollModel,
    TransferToDirectModel,
    RemoveDependantModel,
    DowngradeCancerRequestModel,
    DowngradeAccidentRequestModel,
    ChangeBeneficiaryModel,
    RemoveRiderRequestModel,
} from "@empowered/api";
import { patch } from "@ngxs/store/operators";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";

const defaultState: Beneficiary = {
    primaryBeneficiary: null,
    contingentBeneficiary: null,
};

@State<Beneficiary>({
    name: "beneficiary",
    defaults: defaultState,
})
@State<MemberInfoDetails>({
    name: "memberInfo",
    defaults: {
        memberInfo: null,
        requestPolicyChanges: null,
    },
})
@State<AddressChangeRequest>({
    name: "changeRequest",
    defaults: {
        addressChangeRequest: null,
        addressChangeRequestInitialData: null,
    },
})
@State<NameChangeRequest>({
    name: "changeRequest",
    defaults: {
        nameChangeRequest: null,
        nameChangeRequestInitialData: null,
    },
})
@State<OccupationalClassChangeRequest>({
    name: "changeRequest",
    defaults: {
        occupationalClassChangeRequest: null,
        occupationalClassChangeRequestInitialData: null,
    },
})
@State<GenderChangeRequest>({
    name: "changeRequest",
    defaults: {
        genderChangeRequest: null,
        genderChangeRequestInitialData: null,
    },
})
@State<TransferToPayrollRequest>({
    name: "changeRequest",
    defaults: {
        transferToPayrollRequest: null,
        transferToPayrollRequestInitialData: null,
    },
})
@State<RemoveDependantRequest>({
    name: "changeRequest",
    defaults: {
        removeDependantRequest: null,
        removeDependantRequestInitialData: null,
    },
})
@State<TransferToDirectRequest>({
    name: "changeRequest",
    defaults: {
        transferToDirectRequest: null,
        transferToDirectRequestInitialData: null,
    },
})
@State<ChangeBeneficiaryRequest>({
    name: "changeRequest",
    defaults: {
        changeBeneficiaryRequest: null,
        changeBeneficiaryRequestInitialData: null,
    },
})
@State<AccidentDowngradeChangeRequest>({
    name: "changeRequest",
    defaults: {
        accidentDowngradeChangeRequest: null,
        downgradeAccidentRequestInitialData: null,
    },
})
@State<DowngradeDisabilityRequest>({
    name: "changeRequest",
    defaults: {
        downgradeDisabilityRequest: null,
        downgradeDisabilityRequestInitialData: null,
    },
})
@State<DowngradeCancerRequest>({
    name: "changeRequest",
    defaults: {
        downgradeCancerRequest: null,
        downgradeCancerRequestInitialData: null,
    },
})
@State<RemoveRiderRequest>({
    name: "removeRiderRequest",
    defaults: {
        removeRiderRequest: null,
        removeRiderRequestInitialData: null,
    },
})
@State<ChangeTransactionRequestData>({
    name: "changeTransactionRequestData",
    defaults: {
        transactionRequestData: null,
    },
})
@Injectable()
export class PolicyChangeRequestState {
    @Selector()
    static GetmemberInfo(state: MemberInfoDetails): FindPolicyholderModel {
        return state.memberInfo;
    }

    @Selector()
    static GetTransactionArray(state: any[]): any[] {
        return state;
    }

    @Selector()
    static GetEnrolledRider(state: EnrolledRiderRequestData): any[] {
        return state.enrolledRider;
    }

    @Selector()
    static GetRequestPolicyChanges(state: MemberInfoDetails): string[] {
        return state.requestPolicyChanges;
    }

    @Selector()
    static GetPlanId(state: MemberEnrollmentModel): string {
        return state.planId;
    }

    @Selector()
    static GetFindPolicyHolderDetails(state: PolicyHolderModel): FindPolicyHolderRequestModel {
        return state.findPolicyHolderDetail;
    }
    @Selector()
    static GetChangeAddressRequest(state: AddressChangeRequest): ChangeAddressRequestModel {
        return state.addressChangeRequest;
    }
    @Selector()
    static GetInitialAddressData(state: AddressChangeRequest): any {
        return state.addressChangeRequestInitialData;
    }

    @Selector()
    static GetChangeNameRequest(state: NameChangeRequest): ChangeNameRequestModel {
        return state.nameChangeRequest;
    }
    @Selector()
    static GetChangeNameInitialData(state: NameChangeRequest): any {
        return state.nameChangeRequestInitialData;
    }

    @Selector()
    static GetChangeGenderRequest(state: GenderChangeRequest): ChangeGenderRequestModel {
        return state.genderChangeRequest;
    }
    @Selector()
    static GetChangeGenderInitialData(state: GenderChangeRequest): ChangeGenderRequestModel {
        return state.genderChangeRequestInitialData;
    }
    @Selector()
    static GetChangeOccupationalClassRequest(state: OccupationalClassChangeRequest): ChangeOccupationClassRequestModel {
        return state.occupationalClassChangeRequest;
    }

    @Selector()
    static GetChangeOccupationalClassInitialData(state: OccupationalClassChangeRequest): ChangeOccupationClassRequestModel {
        return state.occupationalClassChangeRequestInitialData;
    }
    @Selector()
    static GetTransferToPayrollRequest(state: TransferToPayrollRequest): TransferToPayrollModel {
        return state.transferToPayrollRequest;
    }
    @Selector()
    static GetTransferToPayrollInitialData(state: TransferToPayrollRequest): TransferToPayrollModel {
        return state.transferToPayrollRequestInitialData;
    }
    @Selector()
    static GetTransferToDirectRequest(state: TransferToDirectRequest): TransferToDirectModel {
        return state.transferToDirectRequest;
    }
    @Selector()
    static GetTransferToDirectInitialData(state: TransferToDirectRequest): TransferToDirectModel {
        return state.transferToDirectRequestInitialData;
    }
    @Selector()
    static GetRemoveDependantRequest(state: RemoveDependantRequest): RemoveDependantModel {
        return state.removeDependantRequest;
    }

    @Selector()
    static GetRemoveDependantInitialData(state: RemoveDependantRequest): RemoveDependantModel {
        return state.removeDependantRequestInitialData;
    }

    @Selector()
    static GetDowngradeCancerRequest(state: DowngradeCancerRequest): DowngradeCancerRequestModel {
        return state.downgradeCancerRequest;
    }
    @Selector()
    static GetDowngradeCancerInitialData(state: DowngradeCancerRequest): DowngradeCancerRequestModel {
        return state.downgradeCancerRequestInitialData;
    }

    @Selector()
    static GetDowngradeAccidentRequest(state: AccidentDowngradeChangeRequest): DowngradeAccidentRequestModel {
        return state.accidentDowngradeChangeRequest;
    }

    @Selector()
    static GetDowngradeAccidentInitialData(state: AccidentDowngradeChangeRequest): DowngradeAccidentRequestModel {
        return state.downgradeAccidentRequestInitialData;
    }

    @Selector()
    static GetDowngradeDisabilityRequest(state: DowngradeDisabilityRequest): DowngradeAccidentRequestModel {
        return state.downgradeDisabilityRequest;
    }

    @Selector()
    static GetDowngradeDisabilityInitialData(state: DowngradeDisabilityRequest): DowngradeAccidentRequestModel {
        return state.downgradeDisabilityRequestInitialData;
    }

    @Selector()
    static GetChangeBebeficiaryRequest(state: ChangeBeneficiaryRequest): ChangeBeneficiaryModel {
        return state.changeBeneficiaryRequest;
    }
    @Selector()
    static GetChangeBebeficiaryInitialData(state: ChangeBeneficiaryRequest): ChangeBeneficiaryModel {
        return state.changeBeneficiaryRequestInitialData;
    }

    @Selector()
    static GetAffectedPoliciesDetails(state: PolicyHolderModel): AffectedPoliciesModel {
        return state.affectedPolicies;
    }

    @Selector()
    static GetRemoveRiderRequest(state: RemoveRiderRequest): RemoveRiderRequestModel {
        return state.removeRiderRequest;
    }
    @Selector()
    static GetRemoveRiderInitialData(state: RemoveRiderRequest): RemoveRiderRequestModel {
        return state.removeRiderRequestInitialData;
    }

    @Selector()
    static GetChangeRequestData(state: ChangeTransactionRequestData): any {
        return state.transactionRequestData;
    }

    @Selector()
    static GetPrimaryBeneficiary(state: Beneficiary): any[] {
        return state.primaryBeneficiary;
    }

    @Selector()
    static GetContingentBeneficiary(state: Beneficiary): any[] {
        return state.contingentBeneficiary;
    }

    @Action(ResetState)
    resetState(context: StateContext<Beneficiary>): void {
        context.setState(defaultState);
    }

    @Action(SetFindPolicyHolderDetails)
    setFindPolicyHolderDetails(
        context: StateContext<PolicyHolderModel>,
        action: { findPolicyHolderDetail: FindPolicyHolderRequestModel },
    ): void {
        context.setState(
            patch({
                findPolicyHolderDetail: action.findPolicyHolderDetail,
            }),
        );
    }

    @Action(SetAffectedPoliciesDetails)
    setAffectedPoliciesDetails(context: StateContext<PolicyHolderModel>, action: { affectedPolicies: AffectedPoliciesModel }): void {
        context.setState(
            patch({
                affectedPolicies: action.affectedPolicies,
            }),
        );
    }

    @Action(SetAddressChangeRequest)
    setChangeAddressRequest(
        context: StateContext<AddressChangeRequest>,
        action: { addressChangeRequest: any; addressChangeRequestInitialData: any },
    ): void {
        if (action.addressChangeRequestInitialData) {
            context.setState(
                patch({
                    addressChangeRequest: action.addressChangeRequest,
                    addressChangeRequestInitialData: action.addressChangeRequestInitialData,
                }),
            );
        } else {
            context.setState(
                patch({
                    addressChangeRequest: action.addressChangeRequest,
                }),
            );
        }
    }

    @Action(SetNameChangeRequest)
    setChangeNameRequest(
        context: StateContext<NameChangeRequest>,
        action: { nameChangeRequest: any; nameChangeRequestInitialData: any },
    ): void {
        if (action.nameChangeRequestInitialData) {
            context.setState(
                patch({
                    nameChangeRequest: action.nameChangeRequest,
                    nameChangeRequestInitialData: action.nameChangeRequestInitialData,
                }),
            );
        } else {
            context.setState(
                patch({
                    nameChangeRequest: action.nameChangeRequest,
                }),
            );
        }
    }

    @Action(SetGenderChangeRequest)
    setGenderChangeRequest(
        context: StateContext<GenderChangeRequest>,
        action: { genderChangeRequest: any; genderChangeRequestInitialData: any },
    ): void {
        if (action.genderChangeRequestInitialData) {
            context.setState(
                patch({
                    genderChangeRequest: action.genderChangeRequest,
                    genderChangeRequestInitialData: action.genderChangeRequestInitialData,
                }),
            );
        } else {
            context.setState(
                patch({
                    genderChangeRequest: action.genderChangeRequest,
                }),
            );
        }
    }

    @Action(SetOccupationalClassChangeRequest)
    SetOccupationalClassChangeRequest(
        context: StateContext<OccupationalClassChangeRequest>,
        action: { occupationalClassChangeRequest: any; occupationalClassChangeRequestInitialData: any },
    ): void {
        if (action.occupationalClassChangeRequestInitialData) {
            context.setState(
                patch({
                    occupationalClassChangeRequest: action.occupationalClassChangeRequest,
                    occupationalClassChangeRequestInitialData: action.occupationalClassChangeRequestInitialData,
                }),
            );
        } else {
            context.setState(
                patch({
                    occupationalClassChangeRequest: action.occupationalClassChangeRequest,
                }),
            );
        }
    }

    @Action(SetMemeberInfo)
    setMemeberInfo(context: StateContext<MemberInfoDetails>, action: { memeberInfo: any }): void {
        context.setState(
            patch({
                memberInfo: action.memeberInfo,
            }),
        );
    }

    @Action(SetRequestPolicyChanges)
    setRequestPolicyChanges(context: StateContext<MemberInfoDetails>, action: { requestPolicyChanges: string[] }): void {
        context.setState(
            patch({
                requestPolicyChanges: action.requestPolicyChanges,
            }),
        );
    }
    @Action(SetPlanId)
    setPlanId({ patchState }: StateContext<MemberEnrollmentModel>, { planId }: SetPlanId): void {
        patchState({
            planId: planId,
        });
    }

    @Action(SetEnrollmentId)
    setEnrollmentId({ patchState }: StateContext<MemberEnrollmentModel>, { enrollmentId }: SetEnrollmentId): void {
        patchState({
            enrollmentId: enrollmentId,
        });
    }

    @Action(SetTransferToPayrollRequest)
    setTransferToPayrollRequest(
        context: StateContext<TransferToPayrollRequest>,
        action: { transferToPayrollRequest: any; transferToPayrollRequestInitialData: any },
    ): void {
        if (action.transferToPayrollRequestInitialData) {
            context.setState(
                patch({
                    transferToPayrollRequest: action.transferToPayrollRequest,
                    transferToPayrollRequestInitialData: action.transferToPayrollRequestInitialData,
                }),
            );
        } else {
            context.setState(
                patch({
                    transferToPayrollRequest: action.transferToPayrollRequest,
                }),
            );
        }
    }

    @Action(SetRemoveDependantRequest)
    setRemoveDependantRequest(
        context: StateContext<RemoveDependantRequest>,
        action: { removeDependantRequest: any; removeDependantRequestInitialData: any },
    ): void {
        if (action.removeDependantRequestInitialData) {
            context.setState(
                patch({
                    removeDependantRequest: action.removeDependantRequest,
                    removeDependantRequestInitialData: action.removeDependantRequestInitialData,
                }),
            );
        } else {
            context.setState(
                patch({
                    removeDependantRequest: action.removeDependantRequest,
                }),
            );
        }
    }

    @Action(SetTransferToDirectRequest)
    setTransferToDirectRequest(
        context: StateContext<TransferToDirectRequest>,
        action: { transferToDirectRequest: any; transferToDirectRequestInitialData: any },
    ): void {
        if (action.transferToDirectRequestInitialData) {
            context.setState(
                patch({
                    transferToDirectRequest: action.transferToDirectRequest,
                    transferToDirectRequestInitialData: action.transferToDirectRequestInitialData,
                }),
            );
        } else {
            context.setState(
                patch({
                    transferToDirectRequest: action.transferToDirectRequest,
                }),
            );
        }
    }

    @Action(SetChangeBeneficiaryRequest)
    setChangeBeneficiaryRequest(
        context: StateContext<ChangeBeneficiaryRequest>,
        action: { changeBeneficiaryRequest: any; changeBeneficiaryRequestInitialData: any },
    ): void {
        if (action.changeBeneficiaryRequestInitialData) {
            context.setState(
                patch({
                    changeBeneficiaryRequest: action.changeBeneficiaryRequest,
                    changeBeneficiaryRequestInitialData: action.changeBeneficiaryRequestInitialData,
                }),
            );
        } else {
            context.setState(
                patch({
                    changeBeneficiaryRequest: action.changeBeneficiaryRequest,
                }),
            );
        }
    }

    @Action(SetDowngradeDisabilityRequest)
    setDowngradeDisabilityRequest(
        context: StateContext<DowngradeDisabilityRequest>,
        action: { downgradeDisabilityRequest: any; downgradeDisabilityRequestInitialData: any },
    ): void {
        if (action.downgradeDisabilityRequestInitialData) {
            context.setState(
                patch({
                    downgradeDisabilityRequest: action.downgradeDisabilityRequest,
                    downgradeDisabilityRequestInitialData: action.downgradeDisabilityRequestInitialData,
                }),
            );
        } else {
            context.setState(
                patch({
                    downgradeDisabilityRequest: action.downgradeDisabilityRequest,
                }),
            );
        }
    }

    @Action(SetDowngradeCancerRequest)
    setDowngradeCancerRequest(
        context: StateContext<DowngradeCancerRequest>,
        action: { downgradeCancerRequest: any; downgradeCancerRequestInitialData: any },
    ): void {
        if (action.downgradeCancerRequestInitialData) {
            context.setState(
                patch({
                    downgradeCancerRequest: action.downgradeCancerRequest,
                    downgradeCancerRequestInitialData: action.downgradeCancerRequestInitialData,
                }),
            );
        } else {
            context.setState(
                patch({
                    downgradeCancerRequest: action.downgradeCancerRequest,
                }),
            );
        }
    }

    @Action(SetDowngradeAccidentRequest)
    setDowngradeAccidentRequest(
        context: StateContext<AccidentDowngradeChangeRequest>,
        action: { downgradeAccidentRequest: any; downgradeAccidentRequestInitialData: any },
    ): void {
        if (action.downgradeAccidentRequestInitialData) {
            context.setState(
                patch({
                    accidentDowngradeChangeRequest: action.downgradeAccidentRequest,
                    downgradeAccidentRequestInitialData: action.downgradeAccidentRequestInitialData,
                }),
            );
        } else {
            context.setState(
                patch({
                    accidentDowngradeChangeRequest: action.downgradeAccidentRequest,
                }),
            );
        }
    }

    @Action(SetRemoveRiderRequest)
    setRemoveRiderRequest(
        context: StateContext<RemoveRiderRequest>,
        action: { removeRiderRequest: any; removeRiderRequestInitialData: any },
    ): void {
        if (action.removeRiderRequestInitialData) {
            context.setState(
                patch({
                    removeRiderRequest: action.removeRiderRequest,
                    removeRiderRequestInitialData: action.removeRiderRequestInitialData,
                }),
            );
        } else {
            context.setState(
                patch({
                    removeRiderRequest: action.removeRiderRequest,
                }),
            );
        }
    }

    @Action(SetTransactionRequestData)
    setTransactionRequestData(context: StateContext<ChangeTransactionRequestData>, action: { transactionRequestData: any }): void {
        context.setState(
            patch({
                transactionRequestData: action.transactionRequestData,
            }),
        );
    }

    @Action(SetTransactionArray)
    setArray(context: StateContext<any>, action: { transactionArray: any }): void {
        context.setState(
            patch({
                transactionArray: action.transactionArray,
            }),
        );
    }

    @Action(SetEnrolledRider)
    setEnrolledRider(context: StateContext<any>, action: { enrolledRider: any }): void {
        context.setState(
            patch({
                enrolledRider: action.enrolledRider,
            }),
        );
    }

    /**
     * Function is to patch the values into the state
     * @param context State context
     * @param action Beneficiary details
     */
    @Action(SetBeneficiary)
    setBenefiary(context: StateContext<any>, action: Beneficiary): void {
        context.setState(
            patch({
                primaryBeneficiary: action.primaryBeneficiary ? action.primaryBeneficiary : null,
            }),
        );
        context.setState(
            patch({
                contingentBeneficiary: action.contingentBeneficiary ? action.contingentBeneficiary : null,
            }),
        );
    }
}
