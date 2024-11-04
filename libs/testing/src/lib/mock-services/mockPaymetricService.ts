import { TempusSessionObjectModel, PayMetricData } from "@empowered/constants";
import { of } from "rxjs";

export const mockPaymetricService = {
    isValidCard: (value: string, token: string, id: string) => of({} as PayMetricData),
    getSession: (memberId: number, mpGroupId: number) => of({} as TempusSessionObjectModel),
};
