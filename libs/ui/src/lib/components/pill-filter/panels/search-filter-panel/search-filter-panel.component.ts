import { Component, OnInit } from "@angular/core";
import { AbstractPanel } from "../AbstractPanel";
import { Observable } from "rxjs";
import { FilterModel } from "../../FilterModel";
import { FormBuilder, FormGroup } from "@angular/forms";
import { debounceTime, map, startWith } from "rxjs/operators";

@Component({
    selector: "empowered-search-filter-panel",
    templateUrl: "./search-filter-panel.component.html",
    styleUrls: ["./search-filter-panel.component.scss"],
    providers: [{ provide: AbstractPanel, useExisting: SearchFilterPanelComponent }],
})
export class SearchFilterPanelComponent extends AbstractPanel implements OnInit {
    lastValidValue = "";
    searchForm: FormGroup = this.builder.group({
        search: [""],
    });

    constructor(private builder: FormBuilder) {
        super();
    }

    ngOnInit(): void {
        if (this.filterModel.search.value) {
            this.searchForm.controls["search"].setValue(this.filterModel.search.value);
            this.lastValidValue = this.filterModel.search.value;
        }
        if (this.filterModel.search.validator) {
            this.searchForm.controls["search"].setValidators([this.filterModel.search.validator]);
        }
    }

    clearSelections(): void {
        this.searchForm.controls["search"].setValue("");
    }

    resetSelections(): void {
        this.searchForm.controls["search"].setValue(this.lastValidValue);
    }

    applySelections(): void {
        this.lastValidValue = this.searchForm.controls["search"].value;
    }

    getSelectionChanges$(): Observable<FilterModel> {
        return this.searchForm.controls["search"].valueChanges.pipe(
            startWith(this.filterModel.search.value),
            debounceTime(250),
            map((value) => {
                this.filterModel.search.value = value;
                return this.filterModel;
            }),
        );
    }
}
