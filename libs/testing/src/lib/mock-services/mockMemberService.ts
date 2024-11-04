import { MemberContact, AddPayment, MemberDependent, EbsPaymentRecord, MemberProfile, RiskClass } from "@empowered/constants";
import { DependentContact, MemberFullProfile, MemberQualifier, PdaForm } from "@empowered/api";
import { BehaviorSubject, of } from "rxjs";

interface createMemberNotePayload {
    formInfo: { id: number; type: string };
}

export const mockMemberService = {
    getPaymentMethods: (memberId: string, mpGroup: number) => of({}),
    updatePaymentMethod: () => (memberId: number, mpGroup: number, paymentBody: AddPayment, paymentMethodId: number) => of({}),
    deletePaymentMethod: (memberId: number, paymentMethodId: number, mpGroup: number) => of({}),
    getMemberContact: (memberId: number | undefined, contactType: string, mpGroup: string) => of({}),
    getMember: (memberId: number | undefined, fullProfilr: boolean, mpGroup: string) => of({}),
    saveMemberContact: (
        memberId: number | undefined,
        contactType: string,
        saveMemberContact: MemberContact,
        mpGroup: string,
        contactId?: number,
    ) => of(),
    saveDependentContact: (
        dependentContact: DependentContact,
        memberId: string,
        dependentId: string,
        mpGroup: string,
        contactId?: number,
    ) => of(),
    getMemberDependents: (memberId: MemberDependent["id"], fullProfile: boolean = true, mpGroup?: number) => of({}),
    deleteMember: (mpGroup: number, memberId: number) => of({}),
    getEbsPaymentCallbackStatus: (mpGroup: number, memberId: number) => of({}),
    updateEbsPaymentCallbackStatus: (mpGroup: number, memberId: number, ebsPaymentCallbackStatus: string) => of({}),
    getMemberContacts: (memberId: MemberProfile["id"], mpGroup?: string) => of({}),
    addPaymentMethod: (memberId: number, mpGroup: number, paymentBody: AddPayment, overrideDuplicate?: boolean) => of({}),
    getEbsPaymentOnFile: (memberId: number, mpGroup: number) => of({}),
    updateQLEList: (value: boolean) => {},
    getMemberFormsByType: (memberId: number, formType: string, mpGroup: string, formStatus: string) => of({}),
    updateMemberForm: (groupId: string, memberId: number, formType: string, formId: number, pdaFormValues: PdaForm) => of({}),
    createMemberNote: (memberId: string, mpGroup: string, payload: createMemberNotePayload) => of(null),
    downloadActiveMemberCensus: () => of({}),
    getMemberQualifierTypes: () => of({}),
    getMemberQualifiers: (memberId: number, mpGroup: string) => of({}),
    getMemberQualifier: (memberId: number, mpGroup: string, qualifierTypeId: number) => of({}),
    saveMemberQualifier: (memberId: number, mpGroup: string, qualifierTypeId: number, req: MemberQualifier) => of({}),
    refactorGenders: (gender: string[]) => [
        {
            for: "",
            value: "",
        },
    ],
    getMemberQualifyingEvents: (memberId: number, mpGroup: string) => of({}),
    updateFullMemberProfile: (memberData: MemberFullProfile, mpGroup: string) => of({}),
    getDependentContact: (memberId: number, dependentId: string, mpGroup: number) => of({}),
    getMemberDependent: (memberId: number, dependentId: number, fullProfile: boolean, mpGroup: number) => of({}),
    getMemberCarrierRiskClasses: (memberId: number, carrierId?: number, mpGroup?: string) => of([] as RiskClass[]),
    currentFirstName: of("Test"),
    currentLastName: of("User"),
    getMemberDependentContact: (memberId: number, dependentId: string, mpGroup: number) => of({}),
    getPaymentMethodsForAflacAlways: (memberId: number, mpGroup: number) => of([{}]),
};
