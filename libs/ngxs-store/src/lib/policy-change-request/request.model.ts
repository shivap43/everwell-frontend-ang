import {
    PolicyChangeRequestListModel,
    ChangeAddressRequestModel,
    ChangeNameRequestModel,
    ChangeGenderRequestModel,
    ChangeOccupationClassRequestModel,
    DowngradeCancerRequestModel,
    DowngradeAccidentRequestModel,
    DowngradeDisabilityRequestModel,
    FindPolicyholderModel,
    TransferToPayrollModel,
    RemoveDependantModel,
    TransferToDirectModel,
    ChangeBeneficiaryModel,
    RemoveRiderRequestModel,
} from "@empowered/api";

export interface PolicyChangeRequestDetails {
    policyChangeRequestInfo: PolicyChangeRequestListModel;
}

export interface MemberEnrollmentModel {
    memberId: number;
    groupId: number;
    planId: string;
    enrollmentId: number;
}
export interface PolicyHolderModel {
    findPolicyHolderDetail: FindPolicyHolderRequestModel;
    affectedPolicies: AffectedPoliciesModel;
}
export interface FindPolicyHolderRequestModel {
    firstName: string;
    lastName: string;
    birthDate: string;
    zip?: number;
    policyNumber?: number;
}
export interface AffectedPoliciesModel {
    policyNumber: number | string;
    policies: string[];
}

export interface PolicyModel {
    policyNumber: string;
    policyName: string;
    rider: boolean;
}

export interface MemberInfoDetails {
    memberInfo: FindPolicyholderModel;
    requestPolicyChanges: string[];
}

export interface AddressChangeRequest {
    addressChangeRequest: ChangeAddressRequestModel;
    addressChangeRequestInitialData: ChangeAddressRequestModel;
}

export interface NameChangeRequest {
    nameChangeRequest: ChangeNameRequestModel;
    nameChangeRequestInitialData: ChangeNameRequestModel;
}

export interface GenderChangeRequest {
    genderChangeRequest: ChangeGenderRequestModel;
    genderChangeRequestInitialData: ChangeGenderRequestModel;
}

export interface OccupationalClassChangeRequest {
    occupationalClassChangeRequest: ChangeOccupationClassRequestModel;
    occupationalClassChangeRequestInitialData: ChangeOccupationClassRequestModel;
}

export interface DowngradeCancerRequest {
    downgradeCancerRequest: DowngradeCancerRequestModel;
    downgradeCancerRequestInitialData: DowngradeCancerRequestModel;
}

export interface AccidentDowngradeChangeRequest {
    accidentDowngradeChangeRequest: DowngradeAccidentRequestModel;
    downgradeAccidentRequestInitialData: DowngradeAccidentRequestModel;
}

export interface TransferToPayrollRequest {
    transferToPayrollRequest: TransferToPayrollModel;
    transferToPayrollRequestInitialData: TransferToPayrollModel;
}

export interface RemoveDependantRequest {
    removeDependantRequest: RemoveDependantModel;
    removeDependantRequestInitialData: RemoveDependantModel;
}
export interface TransferToDirectRequest {
    transferToDirectRequest: TransferToDirectModel;
    transferToDirectRequestInitialData: TransferToDirectModel;
}
export interface ChangeBeneficiaryRequest {
    changeBeneficiaryRequest: ChangeBeneficiaryModel;
    changeBeneficiaryRequestInitialData: ChangeBeneficiaryModel;
}

export interface TransactionFormModel {
    transactionFormRequest: any;
}

export interface DowngradeDisabilityRequest {
    downgradeDisabilityRequest: DowngradeDisabilityRequestModel;
    downgradeDisabilityRequestInitialData: DowngradeDisabilityRequestModel;
}

export interface RemoveRiderRequest {
    removeRiderRequest: RemoveRiderRequestModel;
    removeRiderRequestInitialData: RemoveRiderRequestModel;
}

export interface ChangeTransactionRequestData {
    transactionRequestData: any[];
}

export interface EnrolledRiderRequestData {
    enrolledRider: any[];
}

export interface Beneficiary {
    primaryBeneficiary?: any[];
    contingentBeneficiary?: any[];
}
