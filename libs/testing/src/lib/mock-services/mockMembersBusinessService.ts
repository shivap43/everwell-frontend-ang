import { MemberService } from "@empowered/api";
import { Address } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { mockEmpoweredModalService } from "./mockEmpoweredModalService";
import { of } from "rxjs";

export const mockMembersBusinessService = {
    verifyAddress: (
        providedAddress: Address,
        memberService: MemberService,
        modalService: typeof mockEmpoweredModalService,
        language: LanguageService,
        staticUtil: Record<string, unknown>,
        skipAddressValidation: boolean,
    ) => of({}),
};
