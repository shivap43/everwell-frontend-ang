/* eslint-disable no-underscore-dangle */
import { Component, ElementRef, Input, OnDestroy, Renderer2, AfterViewInit, Output, EventEmitter, ViewChild } from "@angular/core";
import { Overlay, OverlayRef, OverlayConfig } from "@angular/cdk/overlay";
import { DomPortal } from "@angular/cdk/portal";
import { fromEvent, Subject, Observable } from "rxjs";
import { tap, takeUntil, delay, switchMap } from "rxjs/operators";

// TODO: FocusTrapFactory is deprecated https://material.angular.io/cdk/a11y/api#FocusTrapFactory
// There are known issues with trying to use the suggested alternative: https://github.com/angular/components/issues/21703
// Once these issues within AngularMaterial are resolved and we have updated to use those fixes, switch to ConfigurableFocusTrapFactory
import { FocusTrapFactory } from "@angular/cdk/a11y";
import { BackdropStyleInput } from "@empowered/constants";

const BACKDROP_TRANSITION_DURATION = 250;
const POINTER_EVENTS = "pointer-events";

enum PortalPositionInput {
    LEFT = "left",
    RIGHT = "right",
}

@Component({
    selector: "empowered-drop-down-portal",
    templateUrl: "./drop-down-portal.component.html",
    styleUrls: ["./drop-down-portal.component.scss"],
})
export class DropDownPortalComponent implements OnDestroy, AfterViewInit {
    // Positional anchor backdrop.
    @Input() backdropAnchor: HTMLElement;

    // Message that is announced by screen readers when portal is opened.
    @Input() ariaTitle: string;

    // Portal and backdrop configurations.
    @Input() backdropStyle: BackdropStyleInput = BackdropStyleInput.NONE;
    @Input() portalClass = "";
    @Input() portalPosition: PortalPositionInput = PortalPositionInput.LEFT;

    // Portal hidden state boolean.
    isHidden = true;

    // this flag should be true if drop down needs to be disable
    disableClick = false;
    // Subjects and observable to handle portal status/lifecycle.
    private readonly _shownSubject: EventEmitter<void> = new EventEmitter();
    private readonly _hiddenSubject: EventEmitter<void> = new EventEmitter();
    @Output() shown: Observable<void> = this._shownSubject.asObservable();
    @Output() hidden: Observable<void> = this._hiddenSubject.asObservable();

    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    private readonly portalCloseUnsubscribe$: Subject<void> = new Subject<void>();
    private portalClose$: Observable<Event>;

    /* Using ViewChildren instead of ViewChild so changes can be observed.
    This is necessary because ng-template element causes delays in initialization. */
    @ViewChild("hiddenLabel", { static: true, read: ElementRef }) hiddenLabel: ElementRef<HTMLDivElement>;
    @ViewChild("portalWrapper", { static: true, read: ElementRef }) portalWrapper: ElementRef<HTMLDivElement>;

    // Overlay and backdrop elements and styling.
    overlayRef: OverlayRef;
    backdrop: HTMLElement;
    cdkOverlay: Element;
    backdropInitialClass: string[] = ["empowered-portal-backdrop", "hidden"];

    constructor(
        private readonly overlay: Overlay,
        private readonly renderer: Renderer2,
        /**
         * Deprecated: Will be deleted in Material v11.0.0.
         * Replace with ConfigurableFocusTrapFactory once Material module is >v9.0.0.
         * There shouldn't be any other changes necessary.
         *
         * ConfigurableFocusTrapFactory.create should work like FocusTrapFactory.create,
         * but the Focus Trap behavior doesn't seem to match.
         *
         * You can tab outside of the portal when using ConfigurableFocusTrapFactory
         */
        private readonly focusTrap: FocusTrapFactory,
    ) {}

    /**
     * Initialize backdrop, portal, and observables.
     */
    ngAfterViewInit(): void {
        this.backdrop = this.createBackdrop();
        this.setStateObservables();
    }

    /**
     * Detach portal and remove all persistent subscriptions and overlay.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
        this.overlayRef.detach();
        this.overlayRef.dispose();
    }

    /**
     * Set style for custom backdrop and add it as a child to the specified anchor, acting as an overlay.
     *
     * @returns backdrop for portal
     */
    createBackdrop(): HTMLElement {
        const backdrop = this.renderer.createElement("div");

        // If backdropAnchor is undefined, then backdrop is only a placeholder.
        if (this.backdropAnchor) {
            // Add class input to array and apply all to backdrop.
            this.backdropInitialClass.push(this.backdropStyle);
            this.backdropInitialClass.forEach((backdropClass) => this.renderer.addClass(backdrop, backdropClass));

            // Not added to stylesheet to allow for easy modification. This constant affects other functionality.
            this.renderer.setStyle(backdrop, "transition-duration", `${BACKDROP_TRANSITION_DURATION}ms`);

            // Ensure backdrop is correctly positioned absolutely to fill anchor.
            this.renderer.setStyle(this.backdropAnchor, "position", "relative");

            // Iterate through and apply style specs and add backdrop to anchor.
            this.renderer.appendChild(this.backdropAnchor, backdrop);
        }

        return backdrop;
    }

    /**
     * Configure and create cdk-overlay and portal and connect both.
     * @param portalAnchor: element to which portal is relatively connected
     */
    createPortal(portalAnchor: ElementRef): void {
        // Connects portal's location to trigger (portalAnchor) based on optional input.
        const xPosition = this.portalPosition.toLowerCase() === PortalPositionInput.LEFT ? "end" : "start";
        const positionStrategy = this.overlay
            .position()
            .flexibleConnectedTo(portalAnchor)
            .withPositions([
                {
                    originX: xPosition,
                    originY: "bottom",
                    overlayX: xPosition,
                    overlayY: "top",
                },
                {
                    originX: xPosition,
                    originY: "top",
                    overlayX: xPosition,
                    overlayY: "bottom",
                },
            ]);

        // Overlay configuration.
        const overlayConfig = new OverlayConfig({
            positionStrategy,
            scrollStrategy: this.overlay.scrollStrategies.reposition(),
        });

        // Add the overlay and portal to the DOM.
        this.overlayRef = this.overlay.create(overlayConfig);

        // Connect DomPortal to cdk-overlay as a child.
        const domPortal = new DomPortal(this.portalWrapper);
        this.overlayRef.attach(domPortal);

        this.focusTrap.create(domPortal.element);
        this.cdkOverlay = this.overlayRef.overlayElement;
        this.setElementPointerEvents(this.cdkOverlay, "none");
    }

    /**
     * Set observables to listen and react to portal state changes.
     */
    setStateObservables(): void {
        // Set backdrop opacity and enable portal interaction. These styles will not set if done synchronously.
        this._shownSubject
            .asObservable()
            .pipe(
                tap(() => {
                    // This line is separated from removing "hidden" class to preserve backdrop transition.
                    this.renderer.addClass(this.backdrop, "shown");
                    this.setElementPointerEvents(this.cdkOverlay, "auto");
                }),
                delay(BACKDROP_TRANSITION_DURATION),
                switchMap(() => {
                    /* Once transition is complete, focus on hidden label for screen readers
                    and subscribe to click events outside of portal to close it. */
                    this.hiddenLabel.nativeElement.focus();
                    return this.portalClose$;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Set backdrop opacity and enable portal interaction. These styles will not set if done synchronously.
        this._hiddenSubject
            .asObservable()
            .pipe(
                // Wait until backdrop transition is complete.
                delay(BACKDROP_TRANSITION_DURATION),
                tap(() => this.renderer.addClass(this.backdrop, "hidden")),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Close portal when click event occurs outside of portal and isn't a popup.
        this.portalClose$ = fromEvent(document, "click").pipe(
            tap((event) => this.handleClickEvent(event as MouseEvent)),
            takeUntil(this.portalCloseUnsubscribe$),
        );
    }

    /**
     * Show portal portal and update related properties/subjects.
     */
    show(): void {
        // This line is separated from adding "shown" class to preserve backdrop transition.
        this.renderer.removeClass(this.backdrop, "hidden");

        // Ensures portal is correctly positioned relative to trigger.
        this.overlayRef.updatePosition();

        // Emit portal shown status.
        this._shownSubject.next();
        this.isHidden = false;
    }

    /**
     * Hide portal portal and update related properties/subjects.
     */
    hide(): void {
        // Complete subscription of external click portal close.
        this.portalCloseUnsubscribe$.next();

        // Transition out backdrop and disable portal interaction.
        this.renderer.removeClass(this.backdrop, "shown");
        this.setElementPointerEvents(this.cdkOverlay, "none");

        // Emit portal hidden status.
        this._hiddenSubject.next();
        this.isHidden = true;
    }

    /**
     * Hides portal unless click event occurs within portal or some other pop up
     * and MouseEvent.target still exists in the dom
     *
     * @param click {MouseEvent} event that has target being checked
     */
    handleClickEvent(click: MouseEvent): void {
        const target = click.target;

        // Exit early if Element doesn't exists
        // This happens when element hasn't been rendered yet or has been removed
        // It's important to check this since it's impossible to check if Element
        // exists within portal or some other pop up if it's been removed
        if (!this.elementExistsInDOM(target as Element)) {
            return;
        }

        // Exit early if Element exists within current portal
        if (this.portalWrapper.nativeElement.contains(target as Node)) {
            return;
        }

        // Exit early if Element exists with some other pop up
        if (this.eventTargetIsPopup(target)) {
            return;
        }

        this.hide();
    }

    /**
     * Returns true if element exists in the dom
     *
     * @param element {Element}
     * @returns {boolean} is contained by document.body
     */
    elementExistsInDOM(element: Element): boolean {
        return document.body.contains(element as Node);
    }

    /**
     * Checks click event target's direct lineage to see if it is a popup.
     * @param target: element that has been clicked
     * @returns boolean indicating if target is a popup
     */
    eventTargetIsPopup(target: EventTarget): boolean {
        // conversion is necessary, nativeElement and initial type does not work
        let currentElement: Element = target as Element;

        // while target's remaining lineage exists
        while (currentElement) {
            /* wrapped in a try-catch block because
            currentElement.className sometimes doesn't exist */
            try {
                // is popup
                if (currentElement.className.includes("cdk-overlay-pane") || currentElement.className.includes("cdk-overlay-backdrop")) {
                    return true;
                }
                // if lineage reaches this far, it is not a popup
                if (currentElement.className.includes("empowered no-touch")) {
                    return false;
                }
                currentElement = currentElement.parentElement;
            } catch {
                // full lineage of popups will not throw error by trying to access className
                return false;
            }
        }
        // fail safe
        return true;
    }

    /**
     * Applies the specified value to the pointer-events style property to the referenced element.
     *
     * @param element: HTML element whose styling is being modified
     * @param pointerEvents: string specifying value for pointer-events property
     */
    setElementPointerEvents(element: Element, pointerEvents: string): void {
        this.renderer.setStyle(element, POINTER_EVENTS, pointerEvents);
    }
}
