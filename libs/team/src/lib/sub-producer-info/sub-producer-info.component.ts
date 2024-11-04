import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { Subscription } from "rxjs";
import { AppSettings, Validity } from "@empowered/constants";
import { DateService } from "@empowered/date";

interface CarrierAppointments {
    name: string;
    validity: Validity;
}

@Component({
    selector: "empowered-sub-producer-info",
    templateUrl: "./sub-producer-info.component.html",
    styleUrls: ["./sub-producer-info.component.scss"],
})
export class SubProducerInfoComponent implements OnInit, OnDestroy {
    subscription: Subscription[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.close",
        "primary.portals.subproducerInfo.producerInformation",
        "primary.portals.subproducerInfo.nationalNumber",
        "primary.portals.subproducerInfo.writingNumber",
        "primary.portals.subproducerInfo.carrierAppointments",
        "primary.portals.subproducerInfo.licensedStates",
        "primary.portals.subproducerInfo.state",
        "primary.portals.subproducerInfo.licenseNumber",
        "primary.portals.subproducerInfo.licenseeffectiveDate",
        "primary.portals.subproducerInfo.licenseExpiration",
        "primary.portals.subproducerInfo.licenseAuthority",
        "primary.portal.common.done",
        "primary.portal.subproducerInfo.sitCodes",
    ]);
    initState;
    licenseNumber;
    effectiveDate;
    expiration;
    linesOfAuthority;
    ongoing = "ongoing";
    carrierAppointments: CarrierAppointments[] = [];

    constructor(
        private readonly dialogRef: MatDialogRef<SubProducerInfoComponent>,
        private readonly language: LanguageService,
        private readonly datepipe: DatePipe,
        private readonly dateService: DateService,
        @Inject(MAT_DIALOG_DATA) readonly data: any,
    ) {}

    /**
     * set the subordinate producer's information
     */
    ngOnInit(): void {
        this.removeDuplicateCarrierAppointments();
        if (this.data.producerInfo.licenses.length !== 0) {
            this.initState = this.data.producerInfo.licenses[0].state.abbreviation;
            this.licenseNumber = this.data.producerInfo.licenses[0].number;
            this.effectiveDate = this.datepipe.transform(
                this.dateService.toDate(this.data.producerInfo.licenses[0].validity.effectiveStarting),
                AppSettings.DATE_FORMAT_MM_DD_YYYY,
            );
            if (this.data.producerInfo.licenses[0].validity.expiresAfter) {
                this.expiration = this.datepipe.transform(
                    this.dateService.toDate(this.data.producerInfo.licenses[0].validity.expiresAfter),
                    AppSettings.DATE_FORMAT_MM_DD_YYYY,
                );
            }
            if (this.data.producerInfo.licenses[0].linesOfAuthority) {
                this.linesOfAuthority = this.data.producerInfo.licenses[0].linesOfAuthority;
            }
        }
    }

    /**
     * remove duplicate carrier appointments and set the validity
     */
    removeDuplicateCarrierAppointments(): void {
        this.carrierAppointments = Array.from(
            new Set(this.data.producerInfo.carrierAppointments.map((appointment) => appointment.carrier.name)),
        ).map((uniqueAppointments) => {
            const carrierAppointment = this.data.producerInfo.carrierAppointments.find(
                (appointment) => appointment && appointment.carrier.name === uniqueAppointments,
            );
            if (carrierAppointment) {
                return {
                    name: uniqueAppointments.toString(),
                    validity: {
                        effectiveStarting: carrierAppointment.validity.effectiveStarting,
                        expiresAfter: carrierAppointment.validity.expiresAfter ? carrierAppointment.validity.expiresAfter : this.ongoing,
                    },
                };
            }
            return null;
        });
    }
    getLicenseData($event: any): void {
        this.licenseNumber = $event.value.number;
        this.effectiveDate = this.datepipe.transform(
            this.dateService.toDate($event.value.validity.effectiveStarting),
            AppSettings.DATE_FORMAT_MM_DD_YYYY,
        );
        if ($event.value.validity.expiresAfter) {
            this.expiration = this.datepipe.transform(
                this.dateService.toDate($event.value.validity.expiresAfter),
                AppSettings.DATE_FORMAT_MM_DD_YYYY,
            );
        }
        if ($event.value.linesOfAuthority) {
            this.linesOfAuthority = $event.value.linesOfAuthority;
        } else {
            this.linesOfAuthority = "";
        }
    }

    closePopup(): void {
        this.dialogRef.close();
    }

    ngOnDestroy(): void {
        this.subscription.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
