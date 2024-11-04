import { Document } from "@empowered/constants";
import { CensusUploadError } from "./census-upload-error.model";

export interface CensusStatus {
    document: Document;
    errors?: CensusUploadError[];
}
