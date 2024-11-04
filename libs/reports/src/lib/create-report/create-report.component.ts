/* eslint-disable no-underscore-dangle */
import { LanguageService } from "@empowered/language";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { CreateReportFormComponent } from "../create-report-form/create-report-form.component";
import { Observable, Subscription } from "rxjs";
import { StaticService, BenefitsOfferingService, AccountProfileService } from "@empowered/api";
import { map, switchMap, take, shareReplay, filter } from "rxjs/operators";
import { Router } from "@angular/router";
import { PortalType, ChipData } from "@empowered/constants";
import { UserService } from "@empowered/user";

const VSP_INDIVIDUAL_VISION = "VSP Individual Vision";

@Component({
    selector: "empowered-create-report",
    templateUrl: "./create-report.component.html",
    styleUrls: ["./create-report.component.scss"],
})
export class CreateReportComponent implements OnInit, OnDestroy {
    allClasses$: Observable<ChipData[]> = this.accountProfileService.getClassTypeClassMap("NAME", true).pipe(
        take(1),
        map((classTypes) => {
            const classChipDataList: ChipData[] = [];
            Object.keys(classTypes).forEach((classType) => {
                classChipDataList.push({
                    name: classType,
                    value: classType,
                });
                classTypes[classType].map((clazz) => {
                    classChipDataList.push({
                        name: clazz.name,
                        value: clazz.id.toString(),
                        parentValue: classType,
                    });
                });
            });
            return classChipDataList;
        }),
        shareReplay(1),
    );
    allCarriers$: Observable<ChipData[]> = this.benefitOfferingService.getBenefitOfferingCarriers(false, "", true).pipe(
        map((carriers) =>
            carriers.map((carrier) => {
                if (this.router.url.indexOf("direct") >= 0 && carrier.name === VSP_INDIVIDUAL_VISION) {
                    carrier.name = this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.VSP");
                }
                return {
                    name: carrier.name,
                    value: carrier.id.toString(),
                };
            }),
        ),
    );
    allStates$: Observable<ChipData[]> = this.staticService.getStates().pipe(
        map((states) =>
            states.map((state) => ({
                name: state.name,
                value: state.abbreviation,
            })),
        ),
    );

    subscriptions: Subscription[] = [];
    isAdminPortal$: Observable<boolean> = this.user.portal$.pipe(map((portal) => portal.toUpperCase() === PortalType.ADMIN));
    constructor(
        private readonly _bottomSheet: MatBottomSheet,
        private readonly accountProfileService: AccountProfileService,
        private readonly staticService: StaticService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly router: Router,
        private readonly language: LanguageService,
        private readonly user: UserService,
    ) {}

    /**
     * getting group data to populate in the different create report forms
     */
    ngOnInit(): void {
        this.subscriptions.push(this.allClasses$.subscribe());
    }

    /**
     * open the form based on the report type
     * @param type is used for type of report
     * @param source is used to differentiate between direct and payroll
     */
    openCreateReportForm(type: "demographics" | "enrollment" | "deductions" | "PDA" | "commissions", source?: string): void {
        const bottomSheetRef = this._bottomSheet.open(CreateReportFormComponent, {
            data: {
                reportType: type,
                allCarriers$: this.allCarriers$,
                allClasses$: this.allClasses$,
                allStates$: this.allStates$,
                source: source,
            },
        });
        this.subscriptions.push(
            bottomSheetRef
                .afterDismissed()
                .pipe(
                    filter((createReportObs: Observable<string> | undefined) => createReportObs !== undefined),
                    switchMap((createReportObs) => createReportObs),
                )
                .subscribe(),
        );
    }

    /**
     * unsubscribing
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}
