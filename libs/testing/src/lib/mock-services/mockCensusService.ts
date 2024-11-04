import { CensusMapping, CensusTemplate } from "@empowered/api";
import { Document } from "@empowered/constants";
import { CensusStatus } from "libs/api/src/lib/services/census/models/census-status.model";
import { of } from "rxjs";

export const mockCensusService = {
    saveCensusMapping: (censusMapping: CensusMapping, mpGroup: number) => of({}),
    getCensusTemplate: (mpGroup: number) => of({} as CensusTemplate),
    uploadCensus: (fileName: string, mpGroup: number, changeFile: boolean, mappingId?: number) => of({}),
    getSavedCensusMappings: (mpGroup: number) => of([] as CensusMapping[]),
    checkUploadStatus: (documentId: Document["id"], mpGroup: number) => of({} as CensusStatus),
};
