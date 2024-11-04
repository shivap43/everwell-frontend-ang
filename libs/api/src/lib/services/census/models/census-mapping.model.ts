import { CensusMappingField } from "./census-mapping-field.model";

export interface CensusMapping {
    readonly id?: number;
    name: string;
    containsHeaderRow: boolean;
    fields: CensusMappingField[];
}
