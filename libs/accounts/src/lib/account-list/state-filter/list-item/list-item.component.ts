/* eslint-disable no-underscore-dangle */
import { Component, HostBinding, Input, Output, EventEmitter, ElementRef } from "@angular/core";
import { Highlightable } from "@angular/cdk/a11y";
import { State } from "@empowered/api";

@Component({
    selector: "empowered-list-item",
    templateUrl: "./list-item.component.html",
    styleUrls: ["./list-item.component.scss"],
})
export class ListItemComponent implements Highlightable {
    @Input() item;
    @Input() disabled = false;
    @Input() itemSelected = false;
    @Input() ariaLabel = "";

    @Output() itemSelectionHandler = new EventEmitter();
    private _isActive = false;

    @HostBinding("class.active") get isActive(): boolean {
        return this._isActive;
    }

    @HostBinding("class.selected") get isSelected(): boolean {
        return this.itemSelected;
    }

    constructor(readonly element: ElementRef) {}

    setActiveStyles(): void {
        this._isActive = true;
    }

    setInactiveStyles(): void {
        this._isActive = false;
    }

    getLabel(): string {
        return this.item.abbreviation;
    }

    itemClickHandler(item: State): void {
        this.itemSelectionHandler.emit(item);
    }

    focus(): void {
        this.element.nativeElement.focus();
    }
}
