import { Component, OnInit } from "@angular/core";
import { AbstractPanel } from "../AbstractPanel";
import { Observable, BehaviorSubject } from "rxjs";
import { FilterModel, FilterOption, CLONE_FILTER_MODEL } from "../../FilterModel";
import { shareReplay, map } from "rxjs/operators";
import { MatRadioChange } from "@angular/material/radio";

@Component({
    selector: "empowered-single-filter-panel",
    templateUrl: "./single-filter-panel.component.html",
    styleUrls: ["./single-filter-panel.component.scss"],
    providers: [{ provide: AbstractPanel, useExisting: SingleFilterPanelComponent }],
})
export class SingleFilterPanelComponent extends AbstractPanel implements OnInit {
    selectionModelSubject$: BehaviorSubject<FilterModel>;
    selectionModel$: Observable<FilterModel>;
    filterModelSubject$: BehaviorSubject<FilterModel>;
    filterModel$: Observable<FilterModel>;
    selectedOption$: Observable<string>;

    constructor() {
        super();
    }

    ngOnInit(): void {
        // If there is not an option selected, select the default
        if (!this.filterModel.single.options.reduce((accumulator, option) => accumulator || option.selected, false)) {
            this.filterModel.single.options.forEach((option) => (option.selected = option.value === this.filterModel.single.default));
        }

        this.selections = CLONE_FILTER_MODEL(this.filterModel);
        this.selectionModelSubject$ = new BehaviorSubject(this.selections);
        this.selectionModel$ = this.selectionModelSubject$.asObservable();

        this.filterModelSubject$ = new BehaviorSubject(this.filterModel);
        this.filterModel$ = this.filterModelSubject$.asObservable().pipe(shareReplay(1));
        this.selectedOption$ = this.selectionModel$.pipe(
            map((filterModel) => {
                const selectedOption: FilterOption = filterModel.single.options.find((option) => option.selected);
                return selectedOption ? selectedOption.value : filterModel.single.default;
            }),
        );
    }

    clearSelections(): void {
        this.selections.single.options.forEach((option) => (option.selected = option.value === this.filterModel.single.default));
        this.selectionModelSubject$.next(this.selections);
        this.applySelections();
    }

    resetSelections(): void {
        this.selections = CLONE_FILTER_MODEL(this.filterModel);
        this.selectionModelSubject$.next(this.selections);
    }

    applySelections(): void {
        this.filterModel = CLONE_FILTER_MODEL(this.selections);
        this.filterModelSubject$.next(this.filterModel);
    }

    getSelectionChanges$(): Observable<FilterModel> {
        return this.filterModel$;
    }

    onSelectOption({ value }: MatRadioChange): void {
        this.selections.single.options.forEach((option) => (option.selected = option.value === value));
        this.selectionModelSubject$.next(this.selections);
    }
}
