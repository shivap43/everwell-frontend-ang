import { of } from "rxjs";
import { Accounts } from "@empowered/constants";

export const mockMpGroupAccountService = {
    mpGroupAccount$: of({} as Accounts),
};
