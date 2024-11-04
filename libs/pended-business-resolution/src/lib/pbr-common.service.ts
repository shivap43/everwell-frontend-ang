import { Injectable } from "@angular/core";
import { Company } from "@empowered/api";
import { CompanyCode } from "@empowered/constants";
import { MatTableDataSource } from "@angular/material/table";
import { Subject } from "rxjs";
import { AppSettings } from "@empowered/constants";
import { DateService } from "@empowered/date";

@Injectable({
    providedIn: "root",
})
export class PbrCommonService {
    private uploadModalClosed$: Subject<boolean> = new Subject<boolean>();
    isUploadModalBack$ = this.uploadModalClosed$.asObservable();
    constructor(private readonly dateService: DateService) {}
    filterPredicate(data: any, filter: string): boolean | undefined {
        switch (filter) {
            case CompanyCode.ALL:
                return true;
            case CompanyCode.US:
                return data["company"] ? data["company"] === Company.US : data["state"] !== CompanyCode.NY;
            case CompanyCode.NY:
                return data["company"] ? data["company"] === Company.NY : data["state"] === CompanyCode.NY;
        }
        return undefined;
    }
    updatePageSizeOptions(globalPageSizeOptions: number[], dataSource: MatTableDataSource<any>): number[] {
        const dataLength = dataSource.data.length;
        const pageSizeOptionsLength = globalPageSizeOptions.length;

        for (let i = 0; i < pageSizeOptionsLength; i++) {
            const nextIndex = i + 1;
            if (dataLength < globalPageSizeOptions[0]) {
                return [];
            }
            if (dataLength >= globalPageSizeOptions[i] && dataLength < globalPageSizeOptions[nextIndex]) {
                return globalPageSizeOptions.slice(0, nextIndex);
            }
        }
        return globalPageSizeOptions;
    }
    setStatusUploadApplicationModal(isClosed: boolean): void {
        this.uploadModalClosed$.next(isClosed);
    }
    showWarningHexagon(penDate: Date): boolean | undefined {
        const pendedDate = this.dateService.toDate(penDate);
        const currentDate = new Date();
        const differenceDays = this.dateService.getDifferenceInDays(currentDate, pendedDate);
        if (differenceDays > AppSettings.PEND_DATE_MAX_OFFSET) {
            return true;
        }
        return undefined;
    }
}
