import { DocumentQuery } from "@empowered/api";
import { Documents } from "@empowered/constants";
import { of } from "rxjs";

export const mockDocumentApiService = {
    searchDocuments: (mpGroup: number, query?: DocumentQuery, expand?: string) => of({} as Documents),
    deleteDocument: (documentId: number, mpGroup?: number) => of({}),
};
