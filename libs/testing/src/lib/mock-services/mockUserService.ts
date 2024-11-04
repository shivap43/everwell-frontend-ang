import { AdminCredential, Credential, MemberCredential, ProducerCredential } from "@empowered/constants";
import { of } from "rxjs";

export const mockUserService = {
    credential$: of({
        groupId: 222,
        name: {
            firstName: "Steve",
        },
        producerId: 111,
        adminId: 333,
        memberId: 444,
    } as unknown as Credential | AdminCredential | MemberCredential | ProducerCredential),
    portal$: of("producer"),
    isAuthenticated$: of(true),
    setUserCredential: (data: Credential) => of({}),
};
