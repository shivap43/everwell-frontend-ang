import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { LanguageService } from "@empowered/language";

// Component level constant
const ACCOUNT = "account";

@Component({
    selector: "empowered-search",
    templateUrl: "./search.component.html",
    styleUrls: ["./search.component.scss"],
})
export class SearchComponent implements OnInit {
    form: FormGroup;
    @Input()
    dropdownStatus: boolean;
    @Input()
    searchTerm: string;
    @Input()
    languageName: string;
    @Input()
    languageId: string;
    @Input()
    languageSearch: string;
    @Input()
    languageSearchHint: string;
    @Input()
    filterName: string;
    @Input()
    filterId: string;
    @Input()
    nameCount: number;
    @Input()
    groupNumberCount: number;
    @Input()
    altGroupNumberCount: number;
    @Input()
    entryPoint: string;
    @Output()
    searchInputEvent: EventEmitter<any> = new EventEmitter<any>();
    @Output()
    filterByIdName: EventEmitter<string> = new EventEmitter<string>();
    @Output()
    clickOutsideElement: EventEmitter<any> = new EventEmitter<any>();
    @Output()
    applySearchFilter: EventEmitter<any> = new EventEmitter<any>();
    @Output()
    keyPressEvent: EventEmitter<any> = new EventEmitter<any>();
    @Output()
    keyDown: EventEmitter<any> = new EventEmitter<any>();

    isAccountList = false;
    aflacGroupMessage: string = this.language.fetchPrimaryLanguageValue("primary.portal.search.aflacGroupNumber");

    constructor(private readonly fb: FormBuilder, private readonly language: LanguageService) {}

    ngOnInit(): void {
        this.form = this.fb.group({
            searchInput: ["", Validators.pattern(/^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]+$/)],
        });
        this.fetchLanguage();
        if (this.entryPoint === ACCOUNT) {
            this.isAccountList = true;
        }
    }

    fetchLanguage(): void {
        this.languageSearch = this.language.fetchPrimaryLanguageValue(this.languageSearch);
        this.languageSearchHint = this.language.fetchPrimaryLanguageValue(this.languageSearchHint);
        this.languageName = this.language.fetchPrimaryLanguageValue(this.languageName);
        this.languageId = this.language.fetchPrimaryLanguageValue(this.languageId);
    }
    /**
     * Emits a search event
     * @returns void
     */
    searchEvent(event: any): void {
        if (this.form.valid) {
            this.searchInputEvent.emit(event);
        }
    }

    filterByIdOrName(data: string): void {
        this.filterByIdName.emit(data);
    }

    /**
     * Emits an event on blur
     * @returns void
     */
    clickOutsideOfElement(event: any): void {
        if (this.form.valid) {
            this.clickOutsideElement.emit(event);
        }
    }

    /**
     * Emits an event on keyup
     * @returns void
     */
    applySearch(event: any): void {
        if (this.form.valid) {
            this.applySearchFilter.emit(event);
        }
    }

    /**
     * Emits an event on keyup
     * @returns void
     */
    keyPressHandler(event: any): void {
        if (this.form.valid) {
            this.keyPressEvent.emit(event);
        }
    }

    /**
     * Emits an event on key down
     * @returns void
     */
    onKeyDown(event: any): void {
        if (this.form.valid) {
            this.keyDown.emit(event);
        }
    }
}
