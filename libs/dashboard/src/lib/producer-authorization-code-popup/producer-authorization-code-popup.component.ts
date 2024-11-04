import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { UserService } from "@empowered/user";
import { AppTakerService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { AppSettings } from "@empowered/constants";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({
    selector: "empowered-producer-authorization-code-popup",
    templateUrl: "./producer-authorization-code-popup.component.html",
    styleUrls: ["./producer-authorization-code-popup.component.scss"],
})
export class ProducerAuthorizationCodePopupComponent implements OnInit, OnDestroy {
    producerInfo;
    producerList;
    selectedProducer;
    AuthorizationCodeToDisplay = "";
    producerCheckOutstatusResp;
    producersToDisplay = [];
    error;
    errorMsg = "";
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.close",
        "primary.portal.producerAuthorizationCode.title",
        "primary.portal.producerAuthorizationCode.unpluggedAgent",
        "primary.portal.producerAuthorizationCode.authorizationCode",
    ]);
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        private readonly userService: UserService,
        private readonly language: LanguageService,
        @Inject(MAT_DIALOG_DATA) private readonly data: any,
        private readonly appTakerService: AppTakerService,
        private readonly matDialogref: MatDialogRef<ProducerAuthorizationCodePopupComponent>,
    ) {}

    ngOnInit(): void {
        this.setProducerInfo();
        this.setProducersToDisplay();

        this.getPassCodeToDisplay(this.data.mpGroup, this.producersToDisplay[0].id);
    }
    setProducerInfo(): void {
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((response) => {
            this.producerInfo = response;
        });
    }
    onSelectionChange(event: any): void {
        this.getPassCodeToDisplay(this.data.mpGroup, event.value);
    }
    getPassCodeToDisplay(mpGroup: string, producerId: number): void {
        this.appTakerService
            .getPasscode(mpGroup, producerId === this.producerInfo.producerId ? null : producerId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.AuthorizationCodeToDisplay = resp.body;
                    this.error = false;
                },
                (error) => {
                    this.error = true;
                    this.AuthorizationCodeToDisplay = "";
                    if (error.status === AppSettings.API_RESP_403) {
                        this.errorMsg = JSON.parse(error.error).message;
                    }
                },
            );
    }
    close(): void {
        this.matDialogref.close();
    }
    setProducersToDisplay(): void {
        const producers = this.data.producerCheckoutData.filter((producer) => producer.checkedOutDate);
        if (producers.length > 0) {
            this.producersToDisplay = producers;
        } else {
            this.close();
        }
    }

    /**
     * This method destroys all subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
