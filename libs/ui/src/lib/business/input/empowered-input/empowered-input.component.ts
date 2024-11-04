/* eslint-disable no-underscore-dangle */
import {
    Component,
    ContentChild,
    AfterContentInit,
    ElementRef,
    Renderer2,
    ContentChildren,
    QueryList,
    Input,
    OnDestroy,
} from "@angular/core";
import { MatLabel, MatError } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MatSelect } from "@angular/material/select";
import { tap, takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { InputService } from "../services/input.service";
import { AbstractControl } from "@angular/forms";
import { LanguageService } from "@empowered/language";

interface CustomElement extends ElementRef, HTMLElement {
    parentElement: CustomElement;
    length: number;
}

@Component({
    selector: "empowered-input",
    templateUrl: "./empowered-input.component.html",
    styleUrls: ["./empowered-input.component.scss"],
})
export class EmpoweredInputComponent implements AfterContentInit, OnDestroy {
    @ContentChild(MatInput) input: MatInput;
    @ContentChild(MatSelect) select: MatSelect;
    @ContentChild(MatLabel, { read: ElementRef }) label: ElementRef;
    @ContentChild(MatInput, { read: ElementRef }) inputEl: ElementRef;
    @ContentChild(MatSelect, { read: ElementRef }) selectEl: ElementRef;
    @ContentChildren(MatError, { descendants: true, read: ElementRef }) errorChildren: QueryList<ElementRef>;

    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    private _domOrder: string;
    private _formName: string;
    private readonly UNIQUE_ID_VARIANT = 1000000;
    private readonly spanTag: Element = document.createElement("span");
    private readonly labelId: string = Math.floor(Math.random() * this.UNIQUE_ID_VARIANT).toString();
    private readonly languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.error",
        "primary.portal.common.colon",
    ]);

    constructor(
        private readonly renderer: Renderer2,
        private readonly language: LanguageService,
        private readonly inputService: InputService,
    ) {}

    /**
     * Passes a value to the component to track what order the input or select field is in the form
     * @param order the order that the input or select is in the form
     */
    @Input()
    set displayOrder(order: string) {
        this._domOrder = order;
    }

    /**
     * Passes a value to the component to connect the field to a specific form
     * @param name the name of the form that the input/select field is associated with
     */
    @Input()
    set formName(name: string) {
        this._formName = name;
    }

    /**
     * Uses renderer2's setAttribute property to apply a new attribute to the intercepted element
     * @param el an element for renderer to intercept
     * @param attribute the attribute to be appended to the element
     * @param value the value of the attribute
     */
    private readonly setAttribute = (el: ElementRef, attribute: string, value: string): void => {
        this.renderer.setAttribute(el.nativeElement, attribute, value);
    };

    /**
     * Sets ada compliant attributes to the error element and connects it to the input/select field
     * @param el an error element reference
     * @param field either an ElementRef of the material select or input field
     */
    private readonly setErrorAttributes = (el: ElementRef, field: ElementRef): void => {
        // eslint-disable-next-line max-len
        this.spanTag.innerHTML = `${this.languageStrings["primary.portal.common.error"]}${this.languageStrings["primary.portal.common.colon"]} `;
        el.nativeElement.prepend(this.spanTag);
        this.setAttribute(field, "aria-describedby", el.nativeElement.id);
    };

    /**
     * Iterates through a form's fields to set a DOM order for each
     * @param customElement a DOM node
     */
    private readonly getDomOrder = (customElement: CustomElement): void => {
        for (let i = 0; i < customElement.length; i++) {
            if (
                customElement[i].nodeName === ("INPUT" || "SELECT") &&
                customElement[i].getAttribute("formcontrolname") === this.input.ngControl.name
            ) {
                this.input.ngControl["domOrder"] = i;
            }
        }
    };

    /**
     * Recursive function that continuously bubbles up the DOM tree until it finds it's parent form
     * @param customElement a DOM node
     */
    private readonly findForm = (customElement: CustomElement): ElementRef | void => {
        if (customElement.nodeName && customElement.nodeName === "FORM") {
            this.getDomOrder(customElement);
            return customElement;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
        customElement.nativeElement ? this.findForm(customElement.nativeElement.parentElement) : this.findForm(customElement.parentElement);
    };

    /**
     * Creates three observables. One that tracks changes in errors returned from form fields. One checks the
     * validity of the form field's input/select. The last fires off every time the trigger is submitted.
     * It also sets ada compliant attributes to form field.
     */
    ngAfterContentInit(): void {
        // Checks to see if the MatLabel already has an id and if not, assigns a new one
        const elementId: string = this.label.nativeElement.id ? this.label.nativeElement.id : this.labelId;
        // Checks to see if the component contains an input or select field
        const field: AbstractControl = this.input ? this.input.ngControl.control : this.select.ngControl.control;
        // Checks to see if the component contains an input or select ElementRef
        const fieldEl: ElementRef = this.inputEl ? this.inputEl : this.selectEl;
        // If statement to make sure the domOrder and formName is defined
        if (this._formName && this._domOrder) {
            this.inputService.updateInputStore$(field, elementId, this._formName, this._domOrder);
            field.valueChanges
                .pipe(
                    tap(() => {
                        this.inputService.updateInputStore$(field, elementId, this._formName, this._domOrder);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }

        this.errorChildren.changes
            .pipe(
                tap((errChildren) => errChildren.toArray().forEach((errChild) => this.setErrorAttributes(errChild, fieldEl))),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.inputService.applyFocus$(this._domOrder, fieldEl).subscribe();

        this.setAttribute(this.label, "id", elementId);
        this.setAttribute(fieldEl, "aria-labelledby", elementId);
    }

    /**
     * Unsubscribes the input and error observable
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
