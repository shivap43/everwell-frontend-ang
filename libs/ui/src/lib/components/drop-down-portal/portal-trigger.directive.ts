import { Directive, Input, ElementRef, OnDestroy, AfterViewInit, Renderer2 } from "@angular/core";
import { DropDownPortalComponent } from "./drop-down-portal/drop-down-portal.component";
import { fromEvent, Subject } from "rxjs";
import { tap, takeUntil, filter } from "rxjs/operators";

@Directive({
    selector: "[empoweredPortalTrigger]",
})
export class PortalTriggerDirective implements AfterViewInit, OnDestroy {
    // Portal that trigger is connected to
    @Input("empoweredPortalTrigger") portalRef: DropDownPortalComponent;
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(private readonly elementRef: ElementRef, private readonly renderer: Renderer2) {}

    /**
     * Ensure trigger ADA compliance and create portal and its state observables.
     */
    ngAfterViewInit(): void {
        this.renderer.setAttribute(this.elementRef.nativeElement, "role", "button");
        this.portalRef.createPortal(this.elementRef);
        // dont trigger the observables if click is disable on drop downs
        if (!this.portalRef.disableClick) {
            this.setTriggerObservables();
        }
    }

    /**
     * Complete subscriptions when trigger is destroyed.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Set observables for trigger state events.
     */
    setTriggerObservables(): void {
        // Open portal on trigger click.
        fromEvent(this.elementRef.nativeElement, "click")
            .pipe(
                filter(() => this.portalRef.isHidden),
                tap(() => this.portalRef.show()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Open portal on space/enter keydown when focused.
        fromEvent(this.elementRef.nativeElement, "keydown")
            .pipe(
                filter((keydown: KeyboardEvent) => "Space, Enter".includes(keydown.code) && this.portalRef.isHidden),
                tap((keydown) => {
                    keydown.preventDefault();
                    this.portalRef.show();
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Refocus on trigger when portal closes.
        this.portalRef.hidden.pipe(tap(() => this.elementRef.nativeElement.focus())).subscribe();

        fromEvent(this.portalRef.portalWrapper.nativeElement, "keydown")
            .pipe(
                filter((keydown: KeyboardEvent) => keydown.code === "Escape"),
                tap(() => this.portalRef.hide()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
}
