import { TempusSessionObjectModel } from "@empowered/constants";
import { of } from "rxjs";

export const mockPaymentService = {
    getSession: (memberId: number, mpGroupId: number) => of({} as TempusSessionObjectModel),
};
