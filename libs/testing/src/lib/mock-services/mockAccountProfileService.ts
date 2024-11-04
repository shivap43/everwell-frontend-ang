import { HttpResponse } from "@angular/common/http";
import { ClassType, Organization } from "@empowered/api";
import { RiskClass } from "@empowered/constants";
import { of } from "rxjs";

export const mockAccountProfileService = {
    getClassTypes: (mpGroup?: string) => of([] as ClassType[]),
    getOrganizations: (mpGroup: string) => of([] as Organization[]),
    createOrganization: (createMemberObj: Organization, mpGroup?: string) => of({} as HttpResponse<void>),
    getAccountCarrierRiskClasses: (carrierId: number, mpGroup: number) => of([] as RiskClass[]),
};
