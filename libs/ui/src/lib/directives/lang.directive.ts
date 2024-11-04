import { Directive, Input, ElementRef, Renderer2, OnDestroy } from "@angular/core";
import { StaticUtilService } from "@empowered/ngxs-store";
import { tap, switchMap, takeUntil, filter } from "rxjs/operators";
import { Subject, Observable } from "rxjs";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[empLanguage], [empAria], [empAlt]",
})
export class LangDirective implements OnDestroy {
    // Observable emitting once upon end of life cycle to unsubscribe each selector's observer
    private readonly unsubscribe$ = new Subject<void>();

    // Declare behavior subjects for each selector.
    private readonly empLanguageSubject$: Subject<string> = new Subject<string>();
    private readonly empAriaSubject$: Subject<string> = new Subject<string>();
    private readonly empAltSubject$: Subject<string> = new Subject<string>();

    // Set the observables for each selector and subscribe. No variable references are needed for them in this class.
    constructor(
        private readonly renderer: Renderer2,
        private readonly el: ElementRef,
        private readonly staticUtilService: StaticUtilService,
    ) {
        this.createEventDetectionObservable(this.empLanguageSubject$, "innerHTML").subscribe();
        this.createEventDetectionObservable(this.empAriaSubject$, "aria-label").subscribe();
        this.createEventDetectionObservable(this.empAltSubject$, "alt").subscribe();
    }

    /**
     * Setter function that triggers when an initial/new value is set for its selector. Emits the value to the observer.
     * @param empLanguage initial/new value being set
     */
    @Input()
    set empLanguage(empLanguage: string) {
        this.empLanguageSubject$.next(empLanguage);
    }

    /**
     * Setter function that triggers when an initial/new value is set for its selector. Emits the value to the observer.
     * @param empAria initial/new value being set
     */
    @Input()
    set empAria(empAria: string) {
        this.empAriaSubject$.next(empAria);
    }

    /**
     * Setter function that triggers when an initial/new value is set for its selector. Emits the value to the observer.
     * @param empAlt initial/new value being set
     */
    @Input()
    set empAlt(empAlt: string) {
        this.empAltSubject$.next(empAlt);
    }

    /**
     * Creates an observable (from the given behavior subject) that applies a nonempty value to the HTML element's passed in
     * property. Terminates any previous execution upon a new emission. Unsubscribes at end of life cycle.
     *
     * @param behaviorSubject$ used to emit values and implement switchMap
     * @param property HTML element property whose value is being set
     * @returns Observable<unknown> created observable to handle emissions
     */
    private createEventDetectionObservable(behaviorSubject$: Subject<string>, property: string): Observable<unknown> {
        return behaviorSubject$.asObservable().pipe(
            filter((selectorValue) => Boolean(selectorValue)),
            switchMap((selectorValue) => this.setValueFromTagName(selectorValue, property)),
            takeUntil(this.unsubscribe$),
        );
    }

    /**
     * Asynchronous call to static-util.service.ts getLanguage() to get a tagName's value depending on breakpointSize then
     * sets the value of the HTML element's property to the emitted value. Sets value to "" if nothing is returned.
     *
     * @param tagName the value set to the selector
     * @param property the property of the HTML element to which the emission is assigned
     * @returns Observable<string> stream of emissions from getLanguage()
     */
    private setValueFromTagName(tagName: string, property: string): Observable<string> {
        return this.staticUtilService.getLanguage(tagName).pipe(
            tap((language) => this.renderer.setProperty(this.el.nativeElement, property, language ? language : "")),
            takeUntil(this.unsubscribe$),
        );
    }

    /**
     * Unsubscribe each selector's observer and the unsubscribe subject.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
