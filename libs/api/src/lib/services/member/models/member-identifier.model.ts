export interface MemberIdentifier {
    id: number;
    memberIdentifierTypeId: MemberIdentifierTypeIDs;
    value: string;
    version?: string;
    ssnConfirmed?: boolean;
}

export enum MemberIdentifierTypeIDs {
    ID = 1,
    TYPE = 2,
    // TODO: add remaining acceptable values
}
