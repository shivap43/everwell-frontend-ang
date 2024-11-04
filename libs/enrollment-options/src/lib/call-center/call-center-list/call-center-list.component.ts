import { DatePipe } from "@angular/common";
import { AccountCallCenter } from "@empowered/api";
import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { Permission, Portals } from "@empowered/constants";
import { DateService } from "@empowered/date";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";

@Component({
    selector: "empowered-call-center-list",
    templateUrl: "./call-center-list.component.html",
    styleUrls: ["./call-center-list.component.scss"],
})
export class CallCenterListComponent implements OnInit {
    @Input() accountCallCenters: AccountCallCenter[];
    @Output() callCenterEditEvent = new EventEmitter<AccountCallCenter>();
    @Output() callCenterRemoveEvent = new EventEmitter<AccountCallCenter>();

    currentDate = new Date();
    displayedColumns: string[] = [];
    dataSource: AccountCallCenter[];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.callCenter.callcenter",
        "primary.portal.callCenter.startdate",
        "primary.portal.callCenter.enddate",
        "primary.portal.callCenter.tollfreenumber",
        "primary.portal.callCenter.approvalpending",
        "primary.portal.callCenter.manage",
        "primary.portal.common.edit",
        "primary.portal.common.remove",
        "primary.portal.callCenter.onGoing",
        "primary.portal.callCenter.associatedcallCenter",
        "primary.portal.common.moreFilter",
    ]);
    isAdmin = false;
    country = "US";

    constructor(
        private readonly date: DatePipe,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly dateService: DateService,
        private readonly staticUtilService: StaticUtilService,
    ) {}

    ngOnInit(): void {
        if (this.store.selectSnapshot(SharedState.portal) === Portals.ADMIN) {
            this.isAdmin = true;
        }
        if (this.isAdmin) {
            this.displayedColumns = ["callcenter", "startDate", "endDate", "tollFreeNumber"];
            this.accountCallCenters = this.accountCallCenters.filter(
                (callCenter) =>
                    callCenter.tollFreeNumber &&
                    ((callCenter.validity.expiresAfter && this.currentDate < this.dateTransform(callCenter.validity.expiresAfter)) ||
                        !callCenter.validity.expiresAfter),
            );
        }
        if (!this.isAdmin) {
            this.displayedColumns = ["callcenter", "startDate", "endDate", "tollFreeNumber", "manage"];
        }
    }

    dateTransform(dateValue: any): Date {
        return this.dateService.toDate(this.date.transform(dateValue, "MM/dd/yyyy"));
    }

    onEdit(currentAccountCallCenter: AccountCallCenter): void {
        this.callCenterEditEvent.emit(currentAccountCallCenter);
    }

    onRemove(currentAccountCallCenter: AccountCallCenter): void {
        this.callCenterRemoveEvent.emit(currentAccountCallCenter);
    }
    rowDisabled(row: any): boolean {
        return row.validity.expiresAfter && this.dateTransform(row.validity.expiresAfter) < this.currentDate;
    }

    /**
     * @description checks the ability to edit a call center and for BB for the edit link
     * @param row each call center data row
     * @returns an observable boolean from the BB role permission
     */
    allowEdit(row: any): Observable<boolean> {
        return this.staticUtilService.hasPermission(Permission.ALLOW_BUILDING_BLOCKS).pipe(
            map(allowBuildingBlocksPermission => {
                if (
                    this.currentDate > this.dateTransform(row.validity.effectiveStarting) &&
                    (this.currentDate <= this.dateTransform(row.validity.expiresAfter) || !row.validity.expiresAfter)
                ) {
                    if (row.callCenter.name === "Building Blocks" && !allowBuildingBlocksPermission) {
                        return false;
                    }
                    return true;
                }
                return false;
            })
        );
    }
    
    /**
     * @description checks the ability to edit a call center and for BB for the quote button list of edit/remove
     * @param row each call center data row
     * @returns an observable boolean from the BB role permission
     */
    allowEditQuoteList(row: any): Observable<boolean> {
        return this.staticUtilService.hasPermission(Permission.ALLOW_BUILDING_BLOCKS).pipe(
            map(allowBuildingBlocksPermission => {
                if (
                    this.currentDate < this.dateTransform(row.validity.effectiveStarting) &&
                    (this.currentDate < this.dateTransform(row.validity.expiresAfter) || !row.validity.expiresAfter)
                ) {
                    if (row.callCenter.name === "Building Blocks" && !allowBuildingBlocksPermission) {
                        return false;
                    }
                    return true;
                }
                return false;
            })
        );
    }
}


