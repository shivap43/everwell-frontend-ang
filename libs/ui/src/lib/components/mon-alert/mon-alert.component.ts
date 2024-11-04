import { Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output } from "@angular/core";

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "mon-alert",
    templateUrl: "./mon-alert.component.html",
    styleUrls: ["./mon-alert.component.scss"],
})
export class MonAlertComponent implements OnInit, OnDestroy {
    @HostBinding("class") classes = "mon-alert";
    @HostBinding("class.closed") get closed(): boolean {
        return !this.alertOpen;
    }
    @Input() alertType = "info";
    @Input() closeButton = false;
    @Input() autoClose = false;
    @Input() autoCloseAfter = 5000;
    @Output() emitCloseEvent = new EventEmitter();
    @Input() iconAltText = "";
    alertOpen = true;

    readonly iconMap = {
        danger: "Filled-error",
        warning: "Filled-warning",
        success: "check",
        info: "information",
    };

    // TODO: These need language strings
    readonly iconNote = {
        danger: "Error message",
        warning: "Warning message",
        success: "Success message",
        info: "Informational message",
    };

    alertIcon = this.iconMap.info;
    alertNote = this.iconNote.info;

    // Used to clean up timer after timeout or when Component is destroyed
    timer?: number | null;

    /**
     * Set Icon and aria-label using Note.
     * Set timer to auto close if Input bind is set
     */
    ngOnInit(): void {
        this.alertIcon = this.iconMap[this.alertType];
        this.alertNote = this.iconNote[this.alertType];
        if (this.autoClose) {
            this.timer = window.setTimeout(() => {
                this.alertClose();
                clearTimeout(this.timer);
                this.timer = null;
            }, this.autoCloseAfter);
        }
    }

    /**
     * Remove .mon-alert from DOM. mom-alert Component will still be rendered
     */
    alertClose(): void {
        this.alertOpen = false;
        this.emitCloseEvent.emit();
    }

    /**
     * Clean up timer if Component is destroyed before timeout.
     * This is done to prevent an error if timer goes off and Component is already cleaned up
     */
    ngOnDestroy(): void {
        if (this.timer) {
            clearTimeout(this.timer);
        }
    }
}
