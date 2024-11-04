import { Component, OnInit, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { Observable, Subject, combineLatest } from "rxjs";
import { ProducerService, AdminService, ProducerInformation, License, CarrierAppointment } from "@empowered/api";
import { AppSettings, ProducerCredential, Credential, Admin } from "@empowered/constants";
import { Select } from "@ngxs/store";
import { UserState } from "@empowered/user";
import { takeUntil, switchMap, tap } from "rxjs/operators";
import { HttpErrorResponse } from "@angular/common/http";
import { DateService } from "@empowered/date";

@Component({
    selector: "empowered-producer-info",
    templateUrl: "./producer-info.component.html",
    styleUrls: ["./producer-info.component.scss"],
})
export class ProducerInfoComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portals.subproducerInfo.producerInformation",
        "primary.portals.subproducerInfo.nationalNumber",
        "primary.portals.subproducerInfo.writingNumber",
        "primary.portals.subproducerInfo.carrierAppointments",
        "primary.portals.subproducerInfo.licensedStates",
        "primary.portals.subproducerInfo.state",
        "primary.portals.subproducerInfo.licenseNumber",
        "primary.portals.producerInfo.licenseEffectiveDate",
        "primary.portals.subproducerInfo.licenseExpiration",
        "primary.portals.subproducerInfo.licenseAuthority",
        "primary.portal.subproducerInfo.sitCodes",
        "primary.portal.members.workLabel.ongoing",
    ]);
    initState: string;
    licenseNumber: string;
    effectiveDate: string;
    expiration: string;
    linesOfAuthority: string;
    ongoing = this.languageStrings["primary.portal.members.workLabel.ongoing"];
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    userInfo: ProducerCredential;
    adminData: Admin;
    producerInformation: ProducerInformation;
    loadSpinner: boolean;
    @Select(UserState) credential$: Observable<Credential>;
    errorMessage: string;
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    uniqueCarrierAppointments: CarrierAppointment[] = [];
    licenses: License[] = [];

    constructor(
        private readonly language: LanguageService,
        private readonly producerService: ProducerService,
        private readonly adminService: AdminService,
        private readonly datePipe: DatePipe,
        private readonly dateService: DateService,
    ) {}

    /**
     * Initial method that fetches the data required to display through service calls
     */
    ngOnInit(): void {
        this.loadSpinner = true;
        this.credential$
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((cred) => {
                    this.userInfo = cred as ProducerCredential;
                }),
                switchMap(() =>
                    combineLatest([
                        this.adminService.getAdmin(this.userInfo.producerId),
                        this.producerService.getProducerInformation(this.userInfo.producerId.toString()),
                    ]),
                ),
            )
            .subscribe(
                (resp) => {
                    this.adminData = resp[0];
                    this.producerInformation = resp[1];
                    if (this.producerInformation.carrierAppointments && this.producerInformation.carrierAppointments.length) {
                        this.uniqueCarrierAppointments = this.producerInformation.carrierAppointments.filter(
                            (carrierApp, index, array) =>
                                array.findIndex((carrier) => carrier.carrier.id === carrierApp.carrier.id) === index,
                        );
                    }
                    if (this.producerInformation.licenses.length !== 0) {
                        this.licenses = [...this.producerInformation.licenses].sort((a, b) =>
                            a.state.abbreviation > b.state.abbreviation ? 1 : -1,
                        );
                        this.initState = this.producerInformation.licenses[0].state.abbreviation;
                        this.licenseNumber = this.producerInformation.licenses[0].number;
                        this.effectiveDate = this.datePipe.transform(
                            this.dateService.toDate(this.producerInformation.licenses[0].validity.effectiveStarting),
                            AppSettings.DATE_FORMAT_MM_DD_YYYY,
                        );
                        if (this.producerInformation.licenses[0].validity.expiresAfter) {
                            this.expiration = this.datePipe.transform(
                                this.dateService.toDate(this.producerInformation.licenses[0].validity.expiresAfter),
                                AppSettings.DATE_FORMAT_MM_DD_YYYY,
                            );
                        }
                        if (this.producerInformation.licenses[0].linesOfAuthority) {
                            this.linesOfAuthority = this.producerInformation.licenses[0].linesOfAuthority;
                        }
                    }
                    this.loadSpinner = false;
                },
                (error) => {
                    this.handleApiError(error);
                },
            );
    }
    /**
     * Gets the license data based on the state selected by the user.
     * @param $event contains event triggered with source element
     */
    getLicenseData($event: License): void {
        this.licenseNumber = $event.number;
        this.effectiveDate = this.datePipe.transform(
            this.dateService.toDate($event.validity.effectiveStarting),
            AppSettings.DATE_FORMAT_MM_DD_YYYY,
        );
        if ($event.validity.expiresAfter) {
            this.expiration = this.datePipe.transform(
                this.dateService.toDate($event.validity.expiresAfter),
                AppSettings.DATE_FORMAT_MM_DD_YYYY,
            );
        }
        this.linesOfAuthority = $event.linesOfAuthority || "";
    }
    /**
     * Handles Http error and displays error message.
     * @param error type of Http error occurred
     */
    handleApiError(error: HttpErrorResponse): void {
        this.loadSpinner = false;
        if (error && error.error) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
        }
    }
    /**
     * ng life cycle hook
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
