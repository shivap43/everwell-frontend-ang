import { UserState } from "@empowered/user";
import { PendedBusinessLevel, AdminService } from "@empowered/api";
import { ProducerDetails, Credential, HighestLevel, Admin } from "@empowered/constants";
import { MatTabGroup } from "@angular/material/tabs";
import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { Observable, Subject, combineLatest, of, defer, iif } from "rxjs";
import { takeUntil, filter, map, switchMap } from "rxjs/operators";
import { Select } from "@ngxs/store";
import { PendedBusinessState } from "@empowered/ngxs-store";

enum PendedBusinessTabs {
    ALL,
    ACCOUNT,
    PRODUCER,
    DSC,
    RSC,
}

@Component({
    selector: "empowered-pended-apps",
    templateUrl: "./pended-apps.component.html",
    styleUrls: ["./pended-apps.component.scss"],
})
export class PendedAppsComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string>;
    data: any[];
    isSpinnerLoading: boolean;
    @ViewChild(MatTabGroup) tabs: MatTabGroup;
    @Select(UserState) credential$: Observable<Credential>;
    SearchLevel = PendedBusinessLevel;
    visibleTabs = [];
    private readonly unsub$: Subject<void> = new Subject<void>();
    PendedBusinessTabsCopy = PendedBusinessTabs;
    @Select(PendedBusinessState.getAdmin) admin$: Observable<Admin>;
    @Select(PendedBusinessState.getProducer) producer$: Observable<ProducerDetails>;

    constructor(private readonly langService: LanguageService, private readonly adminService: AdminService) {
        this.fetchLanguageData();
    }

    ngOnInit(): void {
        combineLatest(this.admin$, this.producer$)
            .pipe(
                takeUntil(this.unsub$),
                filter(([admin, producer]) => Boolean(admin || producer)), // At least one of [admin, producer] should be defined
                switchMap(([admin, producer]) =>
                    iif(
                        () => Boolean(producer && producer.id),
                        defer(() => this.adminService.getAdmin(producer.id).pipe(map((producerInfo) => [admin, producerInfo]))),
                        of([admin, producer]),
                    ),
                ),
            )
            .subscribe(([admin, producer]) => {
                const user: Admin | ProducerDetails = producer || admin;
                this.setTabsVisibility((user && user["highestLevel"]) || HighestLevel.PRODUCER);
            });
    }
    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.pendedBusiness.pendedApps",
            "primary.portal.pendedBusiness.allPendedApplications",
            "primary.portal.pendedBusiness.account",
            "primary.portal.pendedBusiness.producer",
            "primary.portal.pendedBusiness.dsc",
            "primary.portal.pendedBusiness.rsc",
            "primary.portal.pendedBusiness.accountApps.header",
        ]);
    }
    setTabsVisibility(highestLevel: HighestLevel): void {
        const allTabs = [
            PendedBusinessTabs.ALL,
            PendedBusinessTabs.PRODUCER,
            PendedBusinessTabs.ACCOUNT,
            PendedBusinessTabs.DSC,
            PendedBusinessTabs.RSC,
        ];
        switch (highestLevel) {
            case HighestLevel.PRODUCER:
                this.visibleTabs = allTabs.filter((tab) => tab === PendedBusinessTabs.ALL || tab === PendedBusinessTabs.ACCOUNT);
                break;
            case HighestLevel.DSC:
                this.visibleTabs = allTabs.filter((tab) => tab !== PendedBusinessTabs.RSC && tab !== PendedBusinessTabs.DSC);
                break;
            case HighestLevel.RSC:
                this.visibleTabs = allTabs.filter((tab) => tab !== PendedBusinessTabs.RSC);
                break;
            case HighestLevel.MKT45:
            case HighestLevel.MKT46:
            case HighestLevel.MKD:
                this.visibleTabs = allTabs;
        }
    }
    ngOnDestroy(): void {
        this.unsub$.next();
    }
}
