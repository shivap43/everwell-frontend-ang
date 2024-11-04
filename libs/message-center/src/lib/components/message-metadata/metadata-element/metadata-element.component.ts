import { EventEmitter } from "@angular/core";
import { Component, Input, Output } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MessageCenterLanguage } from "@empowered/constants";

@Component({
    selector: "empowered-metadata-element",
    templateUrl: "./metadata-element.component.html",
    styleUrls: ["./metadata-element.component.scss"],
})
export class MetadataElementComponent {
    @Input() label: string;
    @Input() value: string;
    @Input() showChange = false;
    @Input() changeLabel = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.META_LABEL_CHANGE);

    @Output() changeRequest: EventEmitter<string> = new EventEmitter();

    constructor(private readonly languageService: LanguageService) {}

    /**
     * Echo out the change request to the parent
     */
    emitChangeRequest(): void {
        this.changeRequest.emit(this.label);
    }
}
