export interface CensusMappingField {
    name: string;
    value?: string;
    position: number;
    validation?: RegExp | string;
    required?: boolean;
}
