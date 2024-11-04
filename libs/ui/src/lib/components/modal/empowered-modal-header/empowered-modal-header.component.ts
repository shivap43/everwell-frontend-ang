import { Component, Input } from "@angular/core";
/**
 * empowered-modal-header is used to display header to a modal dialog
 * @Example usage:
 * <empowered-modal-header header="<languageHeader>" optionalLabel="<optionalLabel>">
 * <---Other Optional Content----->
 * </empowered-modal-header>
 */
@Component({
    selector: "empowered-modal-header",
    templateUrl: "./empowered-modal-header.component.html",
    styleUrls: ["./empowered-modal-header.component.scss"],
})
export class EmpoweredModalHeaderComponent {
    // Optional label to the modal header
    @Input() optionalLabel: string;
    // Optional header language variable to the modal header
    @Input() header: string;
    constructor() {}
}
