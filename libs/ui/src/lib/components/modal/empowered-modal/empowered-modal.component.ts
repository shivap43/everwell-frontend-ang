import { Component, Input } from "@angular/core";
import { EmpoweredModalService } from "@empowered/common-services";

export type ModalType = "INFORMATIONAL" | "POPUP";
export type ModalSize = "XS" | "SM" | "MD" | "LG" | "XL" | "XXL";
/**
 * empowered-model used to display custom model
 */
@Component({
    selector: "empowered-modal",
    templateUrl: "./empowered-modal.component.html",
    styleUrls: ["./empowered-modal.component.scss"],
})
export class EmpoweredModalComponent {
    @Input() type: ModalType;
    @Input() size: ModalSize = "MD";
    @Input() closeIcon = true;
    @Input() showCancel = true;

    constructor(private readonly empoweredModalService: EmpoweredModalService) {}

    /**
     * Used to close the modal on closeIcon click as well as Cancel Button click
     */
    close(): void {
        this.empoweredModalService.closeDialog();
    }
}
