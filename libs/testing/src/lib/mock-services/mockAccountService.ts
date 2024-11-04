import { HttpResponse } from "@angular/common/http";
import { AccountContacts } from "@empowered/api";
import {
    AccountProducer,
    Accounts,
    CaseBuilder,
    CaseBuilderAdmin,
    CaseBuilderRequest,
    PayFrequency,
    Relations,
    TpiUserDetail,
} from "@empowered/constants";
import { Observable, of } from "rxjs";

export const mockAccountService = {
    getGroupAttributesByName: (groupAttributeNames: string[], mpGroup?: number) => of([]),
    getAccountContacts: (expand?: string) => of([] as AccountContacts[]),
    getAccountProducer: (producerId: string, mpGroup?: number) => of({} as AccountProducer),
    importProducerViaTPI: (npn: string, email: string, mpGroup?: number): Observable<HttpResponse<undefined>> => of(),
    clearPendingElements: (mpGroup?: number) => of(void {}),
    getAccountProducers: (mpGroup?: number) => of([{}] as AccountProducer[]),
    getAccountCaseBuilders: (mpGroup?: string) =>
        of([
            {
                id: 1,
                caseBuilder: { id: 1, name: "EP6" },
                validity: {
                    effectiveStarting: "2024-07-01",
                    expiresAfter: "2025-07-01",
                },
            },
        ] as CaseBuilder[]),
    getAccount: (mpGroup?: string) => of({} as Accounts),
    getCaseBuilders: () => of([] as CaseBuilderAdmin[]),
    createCaseBuilder: (mpGroup: string, caseBuilderRequest: CaseBuilderRequest) => of({} as HttpResponse<void>),
    deleteAccountCaseBuilder: (mpGroup: string, accountCaseBuilderId: number) => of({} as HttpResponse<void>),
    updateAccountCaseBuilder: (mpGroup: string, accountCaseBuilderId: number, caseBuilderRequest: CaseBuilderRequest) =>
        of({} as HttpResponse<void>),
    getPayFrequencies: (mpGroup?: string) => of([] as PayFrequency[]),
    getFlexDollarsOfMember: () => of({}),
    getDependentRelations: (mpGroup?: string) => of([] as Relations[]),
    enableProducerAssistedTpiSSO: (producerId: number) => of({} as TpiUserDetail),
};
