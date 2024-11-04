import { Directive, Input, OnInit, OnDestroy, TemplateRef, ViewContainerRef } from "@angular/core";
import { BreakPointUtilService } from "@empowered/ngxs-store";
import { Subject } from "rxjs";
import { tap, takeUntil } from "rxjs/operators";
/**
 * Sets HTML Elements to stop displaying if the screen size shrinks beyond a given breakpoint
 * it requires on of the following inputs "'XS'" "'SM'" "'MD'" "'LG'" "'XL'"
 *
 * Example:
 *
 * *empoweredBreakpointHide="'SM'"
 *
 * an element with this tag will display as long as the size of the window screen does not
 * return "XS"
 */

/**
 * array to hold and organize accepted inputs for breakpoint sizes
 */
const sizeOrder: string[] = ["XS", "SM", "MD", "LG", "XL"];

@Directive({
    selector: "[empoweredBreakpointHide]",
})
export class BreakPointHideDirective implements OnInit, OnDestroy {
    @Input("empoweredBreakpointHide") inputBreakpoint: string;
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        private readonly breakpoint: BreakPointUtilService,
        private readonly viewContainer: ViewContainerRef,
        private readonly templateReference: TemplateRef<unknown>,
    ) {}

    /**
     * On init the breakpoint observable is accessed to retrieve the window size
     * when a value is received the view container is cleared
     * if the current size of the window is later in sizeOrder array or at the same index
     * then the template is re-added
     */
    ngOnInit(): void {
        this.breakpoint.breakpointObserver$
            .pipe(takeUntil(this.unsubscribe$.asObservable()))
            .pipe(
                tap((currentWindowSize) => {
                    this.viewContainer.clear();
                    if (sizeOrder.indexOf(currentWindowSize.size) >= sizeOrder.indexOf(this.inputBreakpoint)) {
                        this.viewContainer.createEmbeddedView(this.templateReference);
                    }
                }),
            )
            .subscribe();
    }
    /**
     * unsubscribing to the breakpoint observable on destroy.
     * */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
