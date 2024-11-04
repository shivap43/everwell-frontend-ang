import { HeadsetSSO, MemberDetails, UserSSO } from "@empowered/api";
import { of } from "rxjs";

export const mockAuthenticationService = {
    getHeadsetSSO: (headsetSSO: HeadsetSSO) => of([] as MemberDetails[]),
    getUserSSO: (userSSO: UserSSO) => of([] as MemberDetails[]),
    keepalive: () => of({}),
    permissions$: of([""]),
    verifyHeadsetLink: (guid: string, groupId: number) => of({}),
    producerSSO: (encryptedString: string) => of({}),
};
