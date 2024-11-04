import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { AbstractPanel } from "../AbstractPanel";
import { FilterModel, CLONE_FILTER_MODEL } from "../../FilterModel";
import { Observable, BehaviorSubject } from "rxjs";
import { map, tap } from "rxjs/operators";
import { MatCheckboxChange } from "@angular/material/checkbox";

@Component({
    selector: "empowered-multi-filter-panel",
    templateUrl: "./multi-filter-panel.component.html",
    styleUrls: ["./multi-filter-panel.component.scss"],
    providers: [{ provide: AbstractPanel, useExisting: MultiFilterPanelComponent }],
})
export class MultiFilterPanelComponent extends AbstractPanel implements OnInit {
    selectionSubject$: BehaviorSubject<FilterModel>;
    selectionModel$: Observable<FilterModel>;
    filterModelSubject$: BehaviorSubject<FilterModel>;
    filterModel$: Observable<FilterModel>;
    allSelected$: Observable<boolean>;
    allSelected: boolean;

    @Output() selectionEvent = new EventEmitter<boolean>();

    constructor() {
        super();
    }

    ngOnInit(): void {
        this.selections = CLONE_FILTER_MODEL(this.filterModel);
        this.selectionSubject$ = new BehaviorSubject(this.selections);
        this.selectionModel$ = this.selectionSubject$.asObservable().pipe(
            // If there is any value selected emit a selectionEvent
            tap((selectionModel) =>
                this.selectionEvent.emit(selectionModel.multi.options.reduce((accumulator, value) => accumulator || value.selected, false)),
            ),
        );

        this.filterModelSubject$ = new BehaviorSubject(this.filterModel);
        this.filterModel$ = this.filterModelSubject$.asObservable();
        this.allSelected$ = this.selectionModel$.pipe(
            // Map to if all are selected
            map((model) => model.multi.options.reduce((accumulator, option) => accumulator && option.selected, true)),
            tap((allSelected) => (this.allSelected = allSelected)),
        );
    }

    clearSelections(): void {
        this.selections.multi.options.forEach((option) => (option.selected = false));
        this.selectionSubject$.next(this.selections);
        this.applySelections();
    }

    resetSelections(): void {
        this.selections = CLONE_FILTER_MODEL(this.filterModel);
        this.selectionSubject$.next(this.selections);
    }

    applySelections(): void {
        this.filterModel = CLONE_FILTER_MODEL(this.selections);
        this.filterModelSubject$.next(this.filterModel);
    }

    getSelectionChanges$(): Observable<FilterModel> {
        return this.filterModel$;
    }

    toggle(value: string, { checked }: MatCheckboxChange): void {
        this.selections.multi.options.filter((option) => option.value === value).forEach((option) => (option.selected = checked));
        const selectedCount = this.selections.multi.options.filter((x) => x.selected === true);
        const isValueSelected = selectedCount.length > 0 ? true : false;
        this.selectionEvent.emit(isValueSelected);
        this.selectionSubject$.next(this.selections);
    }

    toggleAll({ checked }: MatCheckboxChange): void {
        if (checked !== this.allSelected) {
            this.selections.multi.options.forEach((option) => (option.selected = checked));
            this.selectionSubject$.next(this.selections);
        }
    }
}
