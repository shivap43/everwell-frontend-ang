import { Component, HostBinding } from "@angular/core";

@Component({
    selector: "empowered-tpi-pda",
    templateUrl: "./tpi-pda.component.html",
    styleUrls: ["./tpi-pda.component.scss"],
})
export class TpiPdaComponent {
    @HostBinding("class") classes = "tpi-content-wrapper";
    constructor() {}
}
