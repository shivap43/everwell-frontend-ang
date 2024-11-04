import { Component, OnInit } from "@angular/core";
import { AuthenticationService } from "@empowered/api";

@Component({
    selector: "empowered-registration",
    templateUrl: "./registration.component.html",
    styleUrls: ["./registration.component.scss"],
})
export class RegistrationComponent implements OnInit {
    constructor(private auth: AuthenticationService) {}

    ngOnInit(): void {}
}
