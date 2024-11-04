export class MemberWorkModel {
    addressCheck = false;
    address1 = "";
    address2 = "";
    city = "";
    state = "";
    zipCode = "";
    county = "";
    country = "";
    hireDate: Date = null;
    terminationDate: Date = null;
    terminationCode = "";
    terminationComments = "";
    orgCode = "";
    jobTitle = "";
    jobDuty = "";
    empID = "";
    customID = "";
    cifNumber = 0;
    payrollFrequency = "";
}

export interface SaveMemberResponseModel {
    partnerServiceResult: string;
}

export interface SaveTerminationData {
    terminationCodeId?: string;
    terminationDate?: string;
    comment?: string;
    terminationProductCoverageEnd?: string;
}

export interface TerminationModalResponse {
    editMode?: boolean;
    currentReason?: string;
    partnerServiceResult?: string;
    terminationDate?: string;
    comments?: string;
    futureDate?: string;
    nothingChanged?: boolean;
}
