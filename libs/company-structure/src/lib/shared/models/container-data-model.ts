import { ClassNames, ClassTypeDisplay, RegionNames, RegionTypeDisplay, Region } from "@empowered/api";
import { MatExpansionPanel } from "@angular/material/expansion";
export enum ActionType {
    class_update = "CLASS.UPDATE",
    class_create = "CLASS.CREATE",
    class_create_peo = "CLASS.CREATE_PEO",
    class_first = "CLASS.FIRST",
    class_remove = "CLASS.REMOVE",
    class_remove_default = "CLASS.REMOVE_DEFAULT",
    class_type_update = "CLASS_TYPE.UPDATE",
    class_type_create = "CLASS_TYPE.CREATE",
    class_type_remove = "CLASS_TYPE.REMOVE",
    region_update = "REGION.UPDATE",
    region_create = "REGION.CREATE",
    region_remove = "REGION.REMOVE",
    region_type_update = "REGION_TYPE.UPDATE",
    region_type_create = "REGION_TYPE.CREATE",
    region_type_remove = "REGION_TYPE.REMOVE",
}
export interface ContainerDataModel {
    actionType: ActionType;
    className?: ClassNames;
    classes?: ClassNames[];
    classTypeId?: number;
    classType?: ClassTypeDisplay;
    defaultPayFreq?: number;
    regionName?: RegionNames;
    regionTypeId?: number;
    regionType?: RegionTypeDisplay;
    regionsList?: Region[];
    panel?: MatExpansionPanel;
    regionTypesList?: any;
    classTypesList?: string[];
    classesList?: string[];
}
