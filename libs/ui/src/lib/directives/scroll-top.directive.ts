import { Directive, Input, ElementRef, Renderer2, OnDestroy, OnInit } from "@angular/core";
import { defer, Observable, Subscription } from "rxjs";
import { distinctUntilChanged, tap } from "rxjs/operators";

/**
 * This directive scrolls to the top of the element that it is applied on
 * based on the values emitted by the input observable / subject.
 *
 * @example
 * HTML:
 * ```html
 * <div class="content-wrapper" empoweredScrollTop [trigger$]="apiError$">
 * ```
 *
 * TS:
 * ```typescript
 *  this.apiErrorSubject$.next(true); // triggers scroll to top
 * ```
 */
@Directive({
    selector: "[empoweredScrollTop]",
    exportAs: "empoweredScrollTop",
})
export class ScrollTopDirective implements OnInit, OnDestroy {
    @Input() trigger$: Observable<boolean>;
    triggerSubscription: Subscription;
    constructor(private readonly _el: ElementRef, private readonly renderer: Renderer2) {}

    /**
     * Initializes subscription to a subject that emits
     * every time we need to scroll to the top of the element the directive is applied on.
     */
    ngOnInit(): void {
        if (this.trigger$) {
            this.triggerSubscription = defer(() =>
                this.trigger$.pipe(
                    distinctUntilChanged((curr, prev) => curr && curr !== prev),
                    tap(() => this.renderer.setProperty(this._el.nativeElement.parentElement, "scrollTop", 0)),
                ),
            ).subscribe();
        }
    }

    /**
     * Unsubscribes from active subscriptions.
     */
    ngOnDestroy(): void {
        if (this.triggerSubscription) {
            this.triggerSubscription.unsubscribe();
        }
    }
}
