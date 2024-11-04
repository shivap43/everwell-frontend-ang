import { AfterViewInit, Component, ElementRef, Inject, Optional, Renderer2, ViewChild } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PaymentErrorDataModel } from "@empowered/constants";

@Component({
    selector: "empowered-attention-modal",
    template: `
        <empowered-modal type="POPUP" [showCancel]="false" size="LG">
            <empowered-modal-header class="modal-header">
                <span mat-dialog-title>
                    <mon-icon [iconSize]="24" iconName="Filled-error" class="icon-danger"></mon-icon>&nbsp;
                    {{ dialogData.title }}
                </span>
            </empowered-modal-header>
            <p #errorMessage class="message-content" [language]="dialogData.message"></p>
            <empowered-modal-footer>
                <button mat-raised-button class="mon-btn-primary modal-btn" (click)="dialogRef.close('')">
                    <span>{{ dialogData.buttonText }}</span>
                </button>
            </empowered-modal-footer>
        </empowered-modal>
    `,
    styles: [
        `
            .message-content {
                font-size: 16px;
            }
            .modal-btn {
                border: none;
                border-radius: 4px;
                width: 82px;
            }
            :host ::ng-deep .mat-dialog-content {
                padding-top: 0px;
            }
            :host ::ng-deep .modal-header {
                padding-bottom: 0px;
            }
            .icon-danger {
                position: relative;
                top: 2px;
            }
        `,
    ],
})
export class EmpoweredAttentionModalComponent implements AfterViewInit {
    @ViewChild("errorMessage") errorMessage: ElementRef;

    constructor(
        readonly dialogRef: MatDialogRef<EmpoweredAttentionModalComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) readonly dialogData: PaymentErrorDataModel,
    ) {}

    ngAfterViewInit() {
        if (this.dialogData.defaultRoutingNumber) {
            this.errorMessage.nativeElement.innerHTML = this.errorMessage.nativeElement.innerHTML.replace(
                "#defaultRoutingNumber",
                this.dialogData.defaultRoutingNumber,
            );
        }
    }
}
