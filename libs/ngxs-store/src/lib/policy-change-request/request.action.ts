/* eslint-disable max-classes-per-file */

import {
    ChangeAddressRequestModel,
    ChangeNameRequestModel,
    ChangeGenderRequestModel,
    ChangeOccupationClassRequestModel,
    DowngradeAccidentRequestModel,
    DowngradeCancerRequestModel,
    DowngradeDisabilityRequestModel,
    TransferToPayrollModel,
    RemoveDependantModel,
    TransferToDirectModel,
    ChangeBeneficiaryModel,
    RemoveRiderRequestModel,
} from "@empowered/api";
import { FindPolicyHolderRequestModel, AffectedPoliciesModel, EnrolledRiderRequestData } from "./request.model";

export class SetMemeberInfo {
    static readonly type = "[MemberInfoDetails] SetMemeberInfo";
    constructor(public memeberInfo: any) {}
}

export class SetFindPolicyHolderDetails {
    static readonly type = "[FindPolicyHolder] SetFindPolicyHolderDetails";
    constructor(public findPolicyHolderDetail: FindPolicyHolderRequestModel) {}
}

export class SetAffectedPoliciesDetails {
    static readonly type = "[AffectedPolicies] SetAffectedPoliciesDetails";
    constructor(public affectedPolicies: AffectedPoliciesModel) {}
}

export class SetRequestPolicyChanges {
    static readonly type = "[RequestPolicyChanges] SetRequestPolicyChanges";
    constructor(public requestPolicyChanges: any) {}
}

export class SetAddressChangeRequest {
    static readonly type = "[SetAddressChangeRequestModel] SetAddressChangeRequest";
    constructor(
        public addressChangeRequest: ChangeAddressRequestModel,
        public addressChangeRequestInitialData: ChangeAddressRequestModel,
    ) {}
}
export class SetNameChangeRequest {
    static readonly type = "[SetNameChangeRequestModel] SetNameChangeRequest";
    constructor(public nameChangeRequest: ChangeNameRequestModel, public nameChangeRequestInitialData: ChangeNameRequestModel) {}
}
export class SetGenderChangeRequest {
    static readonly type = "[SetGenderChangeRequestModel] SetGenderChangeRequest";
    constructor(public genderChangeRequest: ChangeGenderRequestModel, public genderChangeRequestInitialData: ChangeGenderRequestModel) {}
}
export class SetOccupationalClassChangeRequest {
    static readonly type = "[SetOccupationalClassChangeRequestModel] SetOccupationalClassChangeRequest";
    constructor(
        public occupationalClassChangeRequest: ChangeOccupationClassRequestModel,
        public occupationalClassChangeRequestInitialData: ChangeOccupationClassRequestModel,
    ) {}
}
export class SetDowngradeCancerRequest {
    static readonly type = "[SetDowngradeCancerRequestModel] SetDowngradeCancerRequest";
    constructor(
        public downgradeCancerRequest: DowngradeCancerRequestModel,
        public downgradeCancerRequestInitialData: DowngradeCancerRequestModel,
    ) {}
}
export class SetDowngradeDisabilityRequest {
    static readonly type = "[SetDowngradeDisabilityRequestModel] SetDowngradeDisabilityRequest";
    constructor(
        public downgradeDisabilityRequest: DowngradeDisabilityRequestModel,
        public downgradeDisabilityRequestInitialData: DowngradeDisabilityRequestModel,
    ) {}
}

export class SetDowngradeAccidentRequest {
    static readonly type = "[SetDowngradeAccidentRequestModel] SetDowngradeAccidentRequest";
    constructor(
        public downgradeAccidentRequest: DowngradeAccidentRequestModel,
        public downgradeAccidentRequestInitialData: DowngradeAccidentRequestModel,
    ) {}
}
export class SetPlanId {
    static readonly type = "[MemberModel] SetPlanId";
    constructor(public planId: string) {}
}
export class SetEnrollmentId {
    static readonly type = "[MemberModel] SetEnrollmentId";
    constructor(public enrollmentId: number) {}
}
export class SetTransferToPayrollRequest {
    static readonly type = "[SetTransferToPayrollRequestModel] SetTransferToPayrollRequest";
    constructor(
        public transferToPayrollRequest: TransferToPayrollModel,
        public transferToPayrollRequestInitialData: TransferToPayrollModel,
    ) {}
}
export class SetRemoveDependantRequest {
    static readonly type = "[SetRemoveDependantRequestModel] SetRemoveDependantRequest";
    constructor(public removeDependantRequest: RemoveDependantModel, public removeDependantRequestInitialData: RemoveDependantModel) {}
}
export class SetTransferToDirectRequest {
    static readonly type = "[SetTransferToDirectRequestModel] SetTransferToDirectRequest";
    constructor(public transferToDirectRequest: TransferToDirectModel, public transferToDirectRequestInitialData: TransferToDirectModel) {}
}

export class SetChangeBeneficiaryRequest {
    static readonly type = "[SetChangeBeneficiaryRequestModel] SetChangeBeneficiaryRequest";
    constructor(
        public changeBeneficiaryRequest: ChangeBeneficiaryModel,
        public changeBeneficiaryRequestInitialData: ChangeBeneficiaryModel,
    ) {}
}

export class SetRemoveRiderRequest {
    static readonly type = "[SetRemoveRiderRequestModel] SetRemoveRiderRequest";
    constructor(public removeRiderRequest: RemoveRiderRequestModel, public removeRiderRequestInitialData: RemoveRiderRequestModel) {}
}

export class SetTransactionRequestData {
    static readonly type = "[SetTransactionRequestData] SetTransactionRequestData";
    constructor(public transactionRequestData: any[]) {}
}

export class SetTransactionArray {
    static readonly type = "[SetTransactionArray] SetTransactionArray";
    constructor(public setTransactionArray: any[]) {}
}

export class SetEnrolledRider {
    static readonly type = "[SetEnrolledRider] SetEnrolledRider";
    constructor(public enrolledRider: EnrolledRiderRequestData[]) {}
}

export class SetBeneficiary {
    static readonly type = "[SetBeneficiary] SetBeneficiary";
    constructor(public primaryBeneficiary: any, public contingentBeneficiary: any) {}
}
