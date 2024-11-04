import { Admin } from "@empowered/constants";
import { of } from "rxjs";

export const mockAdminService = {
    getAdmin: (adminId: number, expand?: string) => of({ id: 1 } as Admin),

    getAdminContact: (adminId: number) =>
        of({
            address: {
                state: "CA",
            },
        }),

    getAccountAdmins: () => of({}),
};
