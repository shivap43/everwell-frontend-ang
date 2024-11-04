import { Admin } from "@empowered/constants";
import { PendedBusinessState, filterNullValues } from "@empowered/ngxs-store";
import { ComponentType } from "@angular/cdk/overlay";
import { LanguageService } from "@empowered/language";
import { ResolvedAppsComponent } from "./resolved-apps/resolved-apps.component";
import { PendedAppsComponent } from "./pended-apps/pended-apps.component";
import { PBROverviewComponent } from "./pbr-overview/pbr-overview.component";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { NewlyTransmittedAppsComponent } from "./newly-transmitted-apps/newly-transmitted-apps.component";
import { MatDialog } from "@angular/material/dialog";
import { ResolveApplicationModalComponent } from "./resolve-application-modal/resolve-application-modal.component";
import { PendedApplicationsModalComponent } from "./pended-applications-modal/pended-applications-modal.component";
import { Store, Select } from "@ngxs/store";
import { SetAdmin, SetProducer } from "@empowered/ngxs-store";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { SearchProducerComponent } from "@empowered/ui";

@Component({
    selector: "empowered-pended-business",
    templateUrl: "./pended-business.component.html",
    styleUrls: ["./pended-business.component.scss"],
})
export class PendedBusinessComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string>;
    tabs: { name: string; component: ComponentType<any> }[];
    private readonly unsub$: Subject<void> = new Subject<void>();
    @Select(PendedBusinessState.getAdmin) admin$: Observable<Admin>;

    constructor(private readonly dialog: MatDialog, private readonly langService: LanguageService, private readonly store: Store) {
        // Placing this in the constructor because executing it in a lifecycle hook throws ExpressionChangedAfterItHasBeenCheckedError
        this.fetchLanguageData();
    }

    /**
     * Function invoked on component load
     * used to set store data and initialize tabs
     */
    ngOnInit(): void {
        this.store.dispatch(new SetAdmin());
        this.store.dispatch(new SetProducer(null));
        this.tabs = [
            {
                name: this.languageStrings["primary.portal.pendedBusiness.overview"],
                component: PBROverviewComponent,
            },
            {
                name: this.languageStrings["primary.portal.pendedBusiness.pendedApplications"],
                component: PendedAppsComponent,
            },
            {
                name: this.languageStrings["primary.portal.pendedBusiness.resolvedApplications"],
                component: ResolvedAppsComponent,
            },
            {
                name: this.languageStrings["primary.portal.pendedBusiness.newlyTransmittedApplications"],
                component: NewlyTransmittedAppsComponent,
            },
        ];
    }
    // TODO: remove below functions, This is only for testing pur[ose to open modal
    openResolvePopup(): void {
        this.dialog.open(ResolveApplicationModalComponent, {
            width: "700px",
        });
    }

    openPendedPopup(): void {
        this.dialog.open(PendedApplicationsModalComponent, {
            width: "700px",
        });
    }

    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.pendedBusiness.overview",
            "primary.portal.pendedBusiness.pendedApplications",
            "primary.portal.pendedBusiness.resolvedApplications",
            "primary.portal.pendedBusiness.newlyTransmittedApplications",
            "primary.portal.pbr.overview.pendedBusiness",
            "primary.portal.pendedBusiness.findOtherProducersBusiness",
        ]);
    }

    /**
     * opens popup to search other producers' pended business ans set data based on search
     */
    findOtherProducersPendedBusiness(): void {
        const dialogRef = this.dialog.open(SearchProducerComponent, {
            data: {
                roleTwentyDirectPermission: true,
                dialogTitle: this.languageStrings["primary.portal.pbr.overview.pendedBusiness"],
                dialogSubtitle: this.languageStrings["primary.portal.pendedBusiness.findOtherProducersBusiness"],
            },
            width: "700px",
            height: "auto",
        });
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsub$), filterNullValues())
            .subscribe((producer) => {
                if (producer.searchType === "byProducer") {
                    this.store.dispatch(new SetProducer(producer.producerData));
                }
            });
    }

    ngOnDestroy(): void {
        this.unsub$.next();
    }
}
