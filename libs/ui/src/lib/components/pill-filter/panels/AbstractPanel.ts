import { Observable } from "rxjs";
import { FilterModel } from "../FilterModel";
import { Input, Directive } from "@angular/core";

/**
 * Abstract class that all filter panels must implement in order to show up in a pill
 */
@Directive()
/* eslint-disable-next-line @angular-eslint/directive-class-suffix */
export abstract class AbstractPanel {
    @Input() filterModel: FilterModel;
    @Input() combined: boolean;

    selections: FilterModel;

    constructor() {}

    /**
     * Reset / clear all selections in the panel. Return to its original or clean state
     */
    abstract clearSelections(): void;

    /**
     * Resets the panel's selections to the currently applied selections (in the event that the filter is closed without clicking apply)
     */
    abstract resetSelections(): void;

    /**
     * The parent pill filter's apply was selected, update the internal model with the most recent selections
     */
    abstract applySelections(): void;

    /**
     * Return an observable that emits whenever the panel's selection changes
     */
    abstract getSelectionChanges$(): Observable<FilterModel>;
}
