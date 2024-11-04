import { Component, OnInit } from "@angular/core";
import { TpiServices } from "@empowered/common-services";

@Component({
    selector: "empowered-exit-placeholder",
    templateUrl: "./exit-placeholder.component.html",
    styleUrls: ["./exit-placeholder.component.scss"],
})
export class ExitPlaceholderComponent implements OnInit {
    constructor(private readonly tpiService: TpiServices) {}

    /**
     * Implements Angular's OnInit Life Cycle hook
     * Closes the modal window of Modal Mode
     */
    ngOnInit(): void {
        this.tpiService.closeTPIModal();
    }
}
