import { HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ReportCriteria, DocumentApiService } from "@empowered/api";
import { Document } from "@empowered/constants";
import { Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { map, tap } from "rxjs/operators";
import { DocumentsState, GetDocuments, RequestStatusType } from "@empowered/ngxs-store";

@Injectable({ providedIn: "root" })
export class DocumentsService {
    private reports$ = this.getData().pipe(map((documents) => documents.filter((doc) => doc.type === "REPORT")));

    constructor(private readonly store: Store, private readonly documentApiService: DocumentApiService) {}

    /**
     * load documents
     * @param isDirect indicates whether it's a direct group
     */
    loadDocuments(isDirect: boolean): void {
        this.store.dispatch(new GetDocuments(isDirect));
    }

    /**
     * delete document
     * @param documentId indicates the document to delete
     * @param isDirect indicates whether it's a direct group
     * @returns result from delete document api
     */
    removeDocument(documentId: number, isDirect: boolean): Observable<HttpResponse<unknown>> {
        return this.documentApiService.deleteDocument(documentId).pipe(
            tap(() => {
                this.store.dispatch(new GetDocuments(isDirect));
            }),
        );
    }

    downloadDocument(doc: Document): Observable<HttpResponse<unknown>> {
        return this.documentApiService.downloadDocument(doc.id).pipe(
            tap((response) => {
                const blob = new Blob([response], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });

                /*
                source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                Typescript won't know this is a thing, so we have to use Type Assertion
                */
                if ((window.navigator as any).msSaveOrOpenBlob) {
                    (window.navigator as any).msSaveOrOpenBlob(blob);
                } else {
                    const anchor = document.createElement("a");
                    anchor.download = doc.fileName;
                    const fileURLBlob = URL.createObjectURL(blob);
                    anchor.href = fileURLBlob;
                    document.body.appendChild(anchor);
                    anchor.click();
                }
            }),
        );
    }

    /**
     * create report
     * @param reportCriteria report criteria to create the report
     * @param isDirect indicates whether it's a direct group
     * @returns result from create report api
     */
    createReport(reportCriteria: ReportCriteria, isDirect: boolean): Observable<string> {
        return this.documentApiService.createReport(reportCriteria).pipe(
            tap(() => {
                this.store.dispatch(new GetDocuments(isDirect));
            }),
        );
    }

    getData(): Observable<Document[]> {
        return this.store.select(DocumentsState.documents);
    }

    getRequestStatus(): RequestStatusType {
        return this.store.selectSnapshot(DocumentsState.requestStatus);
    }

    getReports(): Observable<Document[]> {
        return this.reports$;
    }
}
