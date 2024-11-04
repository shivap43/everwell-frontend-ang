import { ClassNames, Region, RegionType, SearchMembers } from "@empowered/api";
import { ProductOffering } from "@empowered/constants";
import { ClassType } from "@empowered/api";

export interface AudienceGroupBuilderStateModel {
    classTypesRequested: boolean;
    classTypes: ClassType[];
    classNames: ClassTypeName[];
    regionTypesRequested: boolean;
    regionTypes: RegionType[];
    regions: RegionTypeRegion[];
    productsRequested: boolean;
    productOfferings: ProductOffering[];
    employeeIdsRequested: boolean;
    employeeIds: SearchMembers;
}

export interface ClassTypeName {
    classTypeId: number;
    classNames?: ClassNames[];
}

export interface RegionTypeRegion {
    regionTypeId: number;
    regions?: Region[];
}
