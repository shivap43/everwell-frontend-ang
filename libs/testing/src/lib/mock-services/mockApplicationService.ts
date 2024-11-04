import { Enrollments } from "@empowered/constants";
import { of } from "rxjs";

export const mockApplicationService = {
    getPaymetricAccessToken: (carrierId: number) => of({}),
    convert: (enrollment: Enrollments, isAudit: boolean = false) => of(""),
};
