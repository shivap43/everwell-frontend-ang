import { CensusMappingField } from "./census-mapping-field.model";

interface MappingFields {
    name: string;
    value: string;
    required: boolean;
}

export interface MappingFieldGroup {
    name: string;
    mappingFields: CensusMappingField[];
}
