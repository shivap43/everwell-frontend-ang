import {
    Component,
    ViewChild,
    ViewChildren,
    QueryList,
    AfterViewInit,
    Input,
    ElementRef,
    EventEmitter,
    Output,
    HostListener,
} from "@angular/core";
import { ActiveDescendantKeyManager } from "@angular/cdk/a11y";
import { ENTER, SPACE, UP_ARROW, DOWN_ARROW } from "@angular/cdk/keycodes";
import { ListItemComponent } from "./list-item/list-item.component";
import { State } from "@empowered/api";
import { MatChipInputEvent } from "@angular/material/chips";
import { LanguageService } from "@empowered/language";
import { UtilService } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-state-filter",
    templateUrl: "./state-filter.component.html",
    styleUrls: ["./state-filter.component.scss"],
})
export class StateFilterComponent implements AfterViewInit {
    @Input() stateList: State[] = [];
    @Input() preSelectedStateList: string[] = [];
    @Output() stateSelectionChange = new EventEmitter<State[]>();

    renderStateList: State[] = [];
    stateChipList: string[] = [];
    readonly stateFilterSeparatorKeysCodes: number[] = [ENTER, SPACE];
    stateFilterAddOnBlur = false;
    stateFilterChipRemovable = true;
    SELECTALL_THRESHOLD = 7;
    stateSearchTerm = "";

    @ViewChildren(ListItemComponent) items: QueryList<ListItemComponent>;
    @ViewChild("stateFilterAutoCompleteInput", { static: true }) stateFilterAutoCompleteInput: ElementRef;
    @ViewChild("stateFilterChipList", { static: true }) stateFilterChipList: ElementRef;

    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.clear",
        "primary.portal.common.apply",
        "primary.portal.common.selectAll",
    ]);
    keyCodeMap = {
        ArrowDown: DOWN_ARROW,
        ArrowUp: UP_ARROW,
        Enter: ENTER,
        Space: SPACE,
    };
    private keyManager: ActiveDescendantKeyManager<ListItemComponent>;
    model = "";

    constructor(readonly language: LanguageService, readonly utilService: UtilService) {}

    @HostListener("keydown", ["$event"])
    manage(event: KeyboardEvent): void {
        this.keyManager.onKeydown(event);
    }

    ngAfterViewInit(): void {
        this.keyManager = new ActiveDescendantKeyManager(this.items).withWrap().withTypeAhead();
    }

    /**
     * Called when the focus event happened on the input of the filter.
     * Shows the state list of states when focussed on the input
     * @param event event object for the focus event
     * @returns nothing
     */
    onFocusHandler(event: FocusEvent): void {
        const elem = event.target as HTMLInputElement;
        const value = elem.value;

        this.renderStateList = value === "" ? [...this.stateList] : this.generateRenderStateList(value, this.stateList);
        this.keyManager.setFirstItemActive();
    }

    /**
     * Called when any key is pressed on the input of the filter
     * @param event event object of the keyboard event type
     * @returns nothing
     */

    /**
     * Performs certain operations after creation of the chip
     * @param event MatChipInput event occurs when one of the keys from the list - stateFilterSeparatorKeysCodes is pressed
     * @returns nothing
     */
    stateFilterAdd(event?: MatChipInputEvent): void {
        const value = this.keyManager.activeItem.item.abbreviation;

        if (value && !this.isStateSelectedDuplicate(value, this.stateChipList) && this.isStateSelectedValid(value, this.stateList)) {
            this.createStateChip(value.toUpperCase());
            this.renderStateList = [...this.stateList];
            this.keyManager.setFirstItemActive();
            this.focusAutoCompleteInput();
            this.stateSearchTerm = "";
        }
    }

    /**
     * Creates the chip for the selected value.
     * @param value value to be used to create & display on the chip
     * @returns nothing
     */
    createStateChip(value: string): void {
        if (value && this.isStateSelectedValid(value, this.stateList) && !this.isStateSelectedDuplicate(value, this.stateChipList)) {
            this.stateChipList.push(value.toUpperCase());
            this.stateFilterAutoCompleteInput.nativeElement.value = "";
            this.stateFilterAutoCompleteInput.nativeElement.focus();
        }
    }

    /**
     * Creates an array of items after filtering the source list with the term
     * @param filterTerm list gets filtered based on this value
     * @param stateList source list to be filtered
     * @returns the array of filtered items based on the filterTerm
     */
    generateRenderStateList(filterTerm: string, stateList: State[]): State[] {
        return stateList.filter((state) => state.abbreviation.toLowerCase().indexOf(filterTerm.toLowerCase()) === 0);
    }

    /**
     * Checks if the entered value exists in the statelist
     * @param state selected state from the list
     * @param stateList the list of states
     * @returns true/false based on the existence of the chosen value.
     */
    isStateSelectedValid(state: string, stateList: State[]): boolean {
        return stateList.filter((each) => each.abbreviation.toLowerCase() === state.toLowerCase()).length > 0;
    }

    /**
     * Checks if the selected state is already present in the previously selected states
     * @param state selected state
     * @param stateChipList the array containing the previously selected states which have the chips created
     * @returns true/false
     */
    isStateSelectedDuplicate(state: string, stateChipList: string[]): boolean {
        return stateChipList.includes(state.toUpperCase());
    }

    /**
     * Handles the select all operation for the state selected. Toggles the selection of all states
     * @returns nothing
     */
    selectAllHandler(): void {
        if (this.stateChipList.length === this.stateList.length) {
            this.stateChipList = [];
        } else {
            this.renderStateList.forEach((state) => {
                if (!this.isStateSelectedDuplicate(state.abbreviation, this.stateChipList)) {
                    this.stateChipList.push(state.abbreviation);
                }
            });
        }
        this.stateFilterAutoCompleteInput.nativeElement.focus();
        this.stateSearchTerm = "";
    }

    /**
     * Called when any data in entered in the input
     * @param event object for the input event that occurs on the input field
     * @returns nothing
     */
    onInputHandler(event: KeyboardEvent): void {
        const value = (event.target as HTMLInputElement).value;

        if (!value || value.length === 0) {
            this.renderStateList = [...this.stateList];
        } else {
            this.renderStateList = this.generateRenderStateList(value, this.stateList);
        }
        this.keyManager.setFirstItemActive();
    }

    /**
     * This removes the state from the selection list. It also removes the chip for the state
     * @param state selected state value
     * @returns nothing
     */
    chipRemoveHandler(state: string): void {
        this.stateChipList = this.stateChipList.filter((each) => state.toLowerCase() !== each.toLowerCase());
    }

    /**
     * Called when the "apply" is clicked. This emits the stateSelectionChage event.
     * It will call the filter function written in the account list component to apply the filter
     */
    applyHandler(): void {
        const appliedStates = this.stateList.filter((state) => this.stateChipList.includes(state.abbreviation));

        this.stateSelectionChange.emit(appliedStates);
    }

    /**
     * Called when the "clear" is clicked. This emits the stateSelectionChange event.
     * It will call the filter function written in the account list component to clear the applied filter
     */
    clearHandler(): void {
        this.stateChipList = [];
        const appliedStates = [];

        this.stateSelectionChange.emit(appliedStates);
    }

    /**
     * Called when the click event happens on the wrapper of the chip list.
     * Passes the focus to the input field.
     */
    chipListWrapperClickHandler(): void {
        this.focusAutoCompleteInput();
    }

    /**
     * Resets the chip selection on click of the close icon.
     */
    resetChips(): void {
        this.stateChipList = [];
        this.renderStateList = [...this.stateList];
        this.focusAutoCompleteInput();
    }

    /**
     * Manages the focus on the input field of the state filter.
     */
    focusAutoCompleteInput(): void {
        this.stateFilterAutoCompleteInput.nativeElement.focus();
    }
}
