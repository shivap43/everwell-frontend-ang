import { Component } from "@angular/core";
import { ComposeMessageComponent } from "../compose-message/compose-message.component";
import { Observable, combineLatest } from "rxjs";
import { map, withLatestFrom } from "rxjs/operators";
import { Router } from "@angular/router";
import { Permission, ConfigName, MessageCenterLanguage } from "@empowered/constants";
import { CancelComposeModalComponent } from "../modals/cancel-compose-modal/cancel-compose-modal.component";
import { SharedService, EmpoweredSheetService, EmpoweredModalService } from "@empowered/common-services";
import { StaticUtilService } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-compose-message-button",
    templateUrl: "./compose-message-button.component.html",
    styleUrls: ["./compose-message-button.component.scss"],
})
export class ComposeMessageButtonComponent {
    MessageCenterLanguage = MessageCenterLanguage;

    // Determines whether or not the button should be visible
    doShow$: Observable<boolean> = combineLatest([
        this.staticUtil.cacheConfigEnabled(ConfigName.MESSAGE_CENTER_TOGGLE),
        this.staticUtil.hasPermission(Permission.MESSAGE_CENTER_CREATE),
    ]).pipe(
        withLatestFrom(this.sharedService.userPortal$.pipe(map((portalState) => portalState.type))),
        map(([, portalState]) => this.router.url.indexOf(portalState === "member" ? "/messages" : "/messageCenter") !== -1),
    );

    constructor(
        private readonly empoweredSheet: EmpoweredSheetService,
        private readonly empoweredModal: EmpoweredModalService,
        private readonly sharedService: SharedService,
        private readonly staticUtil: StaticUtilService,
        private readonly router: Router,
    ) {}

    /**
     * Open up the compose sheet
     */
    onClickCompose(): void {
        this.empoweredSheet.openSheet(ComposeMessageComponent, undefined, () =>
            this.empoweredModal.openDialog(CancelComposeModalComponent).afterClosed(),
        );
    }
}
