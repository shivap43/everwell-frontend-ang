import { Component, Input } from "@angular/core";
import { EmpoweredSheetService } from "@empowered/common-services";

@Component({
    selector: "empowered-sheet-header",
    templateUrl: "./empowered-sheet-header.component.html",
    styleUrls: ["./empowered-sheet-header.component.scss"],
})
export class EmpoweredSheetHeaderComponent {
    @Input() optionalLabel: string;

    constructor(private sheetService: EmpoweredSheetService) {}

    close(): void {
        this.sheetService.dismissSheet();
    }
}
