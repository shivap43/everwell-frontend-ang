import { CensusMapping } from "./census-mapping.model";

export interface CensusTemplate {
    templateURL: string;
    censusMappingResource: CensusMapping;
}
