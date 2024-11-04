/* eslint-disable max-classes-per-file, no-underscore-dangle */

import { AnimationEvent } from "@angular/animations";
import { AriaDescriber, FocusMonitor } from "@angular/cdk/a11y";
import { Directionality } from "@angular/cdk/bidi";
import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { ESCAPE, hasModifierKey } from "@angular/cdk/keycodes";
import { BreakpointObserver, Breakpoints, BreakpointState } from "@angular/cdk/layout";
import {
    FlexibleConnectedPositionStrategy,
    HorizontalConnectionPos,
    OriginConnectionPosition,
    Overlay,
    OverlayConnectionPosition,
    OverlayRef,
    ScrollStrategy,
    VerticalConnectionPos,
    ConnectedOverlayPositionChange,
} from "@angular/cdk/overlay";
import { Platform, normalizePassiveListenerOptions } from "@angular/cdk/platform";
// TODO: PortalInjector is deprecated
// Switch to Injector.create or use the following resources to refactor:
// https://github.com/angular/material.angular.io/issues/701
// https://github.com/angular/angular/issues/35548#issuecomment-588551120
import { ComponentPortal, PortalInjector } from "@angular/cdk/portal";
import { ScrollDispatcher } from "@angular/cdk/scrolling";
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Directive,
    ElementRef,
    Inject,
    InjectionToken,
    Input,
    NgZone,
    OnDestroy,
    OnInit,
    Optional,
    ViewContainerRef,
    ViewChild,
    Injector,
} from "@angular/core";
import { Observable, Subject } from "rxjs";
import { take, takeUntil } from "rxjs/operators";

import { matTooltipAnimations } from "./tooltip-animations";

/** Possible positions for a tooltip. */
export type TooltipPosition = "left" | "right" | "above" | "below" | "before" | "after";

export const CONTAINER_DATA = new InjectionToken<unknown>("CONTAINER_DATA");

/**
 * Options for how the tooltip trigger should handle touch gestures.
 * See `MatTooltip.touchGestures` for more information.
 */
export type TooltipTouchGestures = "auto" | "on" | "off";

/** Possible visibility states of a tooltip. */
export type TooltipVisibility = "initial" | "visible" | "hidden";

/** Time in ms to throttle repositioning after scroll events. */
export const SCROLL_THROTTLE_MS = 20;

/** CSS class that will be attached to the overlay panel. */
export const TOOLTIP_PANEL_CLASS = "mat-tooltip-panel";

/** Options used to bind passive event listeners. */
const passiveListenerOptions = normalizePassiveListenerOptions({ passive: true });

/**
 * Time between the user putting the pointer on a tooltip
 * trigger and the long press event being fired.
 */
const LONGPRESS_DELAY = 500;

/**
 * Creates an error to be thrown if the user supplied an invalid tooltip position.
 */
export function getMatTooltipInvalidPositionError(position: string): any {
    return Error(`Tooltip position "${position}" is invalid.`);
}

/** Default `matTooltip` options that can be overridden. */
export interface MatTooltipDefaultOptions {
    showDelay: number;
    hideDelay: number;
    touchendHideDelay: number;
    touchGestures?: TooltipTouchGestures;
    position?: TooltipPosition;
}

export function MAT_TOOLTIP_DEFAULT_OPTIONS_FACTORY(): MatTooltipDefaultOptions {
    return {
        showDelay: 0,
        hideDelay: 0,
        touchendHideDelay: 1500,
    };
}

/** Injection token to be used to override the default options for `matTooltip`. */
export const MAT_TOOLTIP_DEFAULT_OPTIONS = new InjectionToken<MatTooltipDefaultOptions>("mat-tooltip-default-options", {
    providedIn: "root",
    factory: MAT_TOOLTIP_DEFAULT_OPTIONS_FACTORY,
});

/**
 * Rich Tooltip which gives the ability to render HTML content.
 * This uses the matTooltip from angular material completely with some modifications.
 */
@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[richTooltip]",
    exportAs: "richTooltip",
    // eslint-disable-next-line @angular-eslint/no-host-metadata-property
    host: {
        "(keydown)": "_handleKeydown($event)",
    },
})
export class RichTooltipDirective implements OnInit, OnDestroy {
    _overlayRef: OverlayRef | null;
    _tooltipInstance: TooltipComponent | null;

    private _portal: ComponentPortal<TooltipComponent>;
    private _position: TooltipPosition = "below";
    private _disabled = false;
    private _tooltipClass: string | string[] | Set<string> | { [key: string]: any };
    private _scrollStrategy: () => ScrollStrategy;
    originPosition;
    tooltipRenderPosition: ConnectedOverlayPositionChange;

    /** Allows the user to define the position of the tooltip relative to the parent element */
    @Input("matTooltipPosition")
    get position(): TooltipPosition {
        return this._position;
    }
    set position(value: TooltipPosition) {
        if (value !== this._position) {
            this._position = value;

            if (this._overlayRef) {
                this._updatePosition();

                if (this._tooltipInstance) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    this._tooltipInstance!.show(0);
                }

                this._overlayRef.updatePosition();
            }
        }
    }

    /** Disables the display of the tooltip. */
    @Input("matTooltipDisabled")
    get disabled(): boolean {
        return this._disabled;
    }

    // Should handle coverting strings to booleans as well
    set disabled(value: boolean) {
        this._disabled = coerceBooleanProperty(value);

        // If tooltip is disabled, hide immediately.
        if (this._disabled) {
            this.hide(0);
        }
    }

    /** The default delay in ms before showing the tooltip after show is called */
    // eslint-disable-next-line @angular-eslint/no-input-rename
    @Input("matTooltipShowDelay") showDelay = this._defaultOptions.showDelay;

    /** The default delay in ms before hiding the tooltip after hide is called */
    // eslint-disable-next-line @angular-eslint/no-input-rename
    @Input("matTooltipHideDelay") hideDelay = this._defaultOptions.hideDelay;

    /**
     * How touch gestures should be handled by the tooltip. On touch devices the tooltip directive
     * uses a long press gesture to show and hide, however it can conflict with the native browser
     * gestures. To work around the conflict, it disables native gestures on the
     * trigger, but that might not be desirable on particular elements (e.g. inputs and draggable
     * elements). The different values for this option configure the touch event handling as follows:
     * - `auto` - Enables touch gestures for all elements, but tries to avoid conflicts with native
     *   browser gestures on particular elements. In particular, it allows text selection on inputs
     *   and textareas, and preserves the native browser dragging on elements marked as `draggable`.
     * - `on` - Enables touch gestures for all elements and disables native
     *   browser gestures with no exceptions.
     * - `off` - Disables touch gestures. Note that this will prevent the tooltip from
     *   showing on touch devices.
     */
    // eslint-disable-next-line @angular-eslint/no-input-rename
    @Input("matTooltipTouchGestures") touchGestures: TooltipTouchGestures = "auto";

    /** The message to be displayed in the tooltip */
    @Input("richTooltip")
    private _message = "";
    get message(): string {
        return this._message;
    }
    set message(value: string) {
        this._ariaDescriber.removeDescription(this._elementRef.nativeElement, this._message);

        // If the message is not a string (e.g. number), convert it to a string and trim it.
        this._message = value;

        if (!this._message && this._isTooltipVisible()) {
            this.hide(0);
        } else {
            this._updateTooltipMessage();
            this._ngZone.runOutsideAngular(() => {
                // The `AriaDescriber` has some functionality that avoids adding a description if it's the
                // same as the `aria-label` of an element, however we can't know whether the tooltip trigger
                // has a data-bound `aria-label` or when it'll be set for the first time. We can avoid the
                // issue by deferring the description by a tick so Angular has time to set the `aria-label`.
                Promise.resolve().then(() => {
                    this._ariaDescriber.describe(this._elementRef.nativeElement, this.message);
                });
            });
        }
    }

    /** Classes to be passed to the tooltip. Supports the same syntax as `ngClass`. */
    @Input("matTooltipClass")
    get tooltipClass(): string | string[] | Set<string> | { [key: string]: any } {
        return this._tooltipClass;
    }
    set tooltipClass(value: string | string[] | Set<string> | { [key: string]: any }) {
        this._tooltipClass = value;
        if (this._tooltipInstance) {
            this._setTooltipClass(this._tooltipClass);
        }
    }

    /** Manually-bound passive event listeners. */
    private _passiveListeners = new Map<string, EventListenerOrEventListenerObject>();

    /** Timer started at the last `touchstart` event. */
    private _touchstartTimeout: any;

    /** Emits when the component is destroyed. */
    private readonly _destroyed = new Subject<void>();

    constructor(
        private _overlay: Overlay,
        private _elementRef: ElementRef<HTMLElement>,
        private _scrollDispatcher: ScrollDispatcher,
        private _viewContainerRef: ViewContainerRef,
        private _ngZone: NgZone,
        private _platform: Platform,
        private _ariaDescriber: AriaDescriber,
        private _focusMonitor: FocusMonitor,
        private _injector: Injector,
        @Optional() private _dir: Directionality,
        @Optional()
        @Inject(MAT_TOOLTIP_DEFAULT_OPTIONS)
        private _defaultOptions: MatTooltipDefaultOptions,
        /**
         * @deprecated _hammerLoader parameter to be removed.
         * @breaking-change 9.0.0
         */
        // Note that we need to give Angular something to inject here so it doesn't throw.
        @Inject(ElementRef) _hammerLoader?: any,
    ) {
        if (_defaultOptions) {
            if (_defaultOptions.position) {
                this.position = _defaultOptions.position;
            }

            if (_defaultOptions.touchGestures) {
                this.touchGestures = _defaultOptions.touchGestures;
            }
        }

        _focusMonitor
            .monitor(_elementRef)
            .pipe(takeUntil(this._destroyed))
            .subscribe((origin) => {
                // Note that the focus monitor runs outside the Angular zone.
                if (!origin) {
                    _ngZone.run(() => this.hide(0));
                } else if (origin === "keyboard") {
                    _ngZone.run(() => this.show());
                }
            });
    }

    /**
     * Setup styling-specific things
     */
    ngOnInit(): void {
        // This needs to happen in `ngOnInit` so the initial values for all inputs have been set.
        this._setupPointerEvents();
    }

    /**
     * Dispose the tooltip when destroyed.
     */
    ngOnDestroy(): void {
        clearTimeout(this._touchstartTimeout);

        if (this._overlayRef) {
            this._overlayRef.dispose();
            this._tooltipInstance = null;
        }

        // Clean up the event listeners set in the constructor
        this._passiveListeners.forEach((listener, event) => {
            this._elementRef.nativeElement.removeEventListener(event, listener, passiveListenerOptions);
        });
        this._passiveListeners.clear();

        this._destroyed.next();
        this._destroyed.complete();

        this._ariaDescriber.removeDescription(this._elementRef.nativeElement, this.message);
        this._focusMonitor.stopMonitoring(this._elementRef);
    }

    createInjector(dataToPass: any): PortalInjector {
        const injectorTokens = new WeakMap();
        injectorTokens.set(CONTAINER_DATA, dataToPass);
        return new PortalInjector(this._injector, injectorTokens);
    }

    /** Shows the tooltip after the delay in ms, defaults to tooltip-delay-show or 0ms if no input */
    show(delay: number = this.showDelay): void {
        if (
            this.disabled ||
            !this.message ||
            (this._isTooltipVisible() &&
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                !this._tooltipInstance!._showTimeoutId &&
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                !this._tooltipInstance!._hideTimeoutId)
        ) {
            return;
        }

        const originPosition = this._getOriginPosition();

        this._portal = new ComponentPortal(
            // eslint-disable-next-line no-use-before-define,@typescript-eslint/no-use-before-define
            TooltipComponent,
            this._viewContainerRef,
            this.createInjector({
                originPosition: originPosition,
                elementReference: this._elementRef,
                tooltipRenderPosition: this.tooltipRenderPosition,
            }),
        );

        const overlayRef = this._createOverlay();

        this._detach();
        // eslint-disable-next-line no-use-before-define, @typescript-eslint/no-use-before-define

        this._tooltipInstance = overlayRef.attach(this._portal).instance;
        this._tooltipInstance
            .afterHidden()
            .pipe(takeUntil(this._destroyed))
            .subscribe(() => this._detach());
        this._setTooltipClass(this._tooltipClass);
        this._updateTooltipMessage();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this._tooltipInstance!.show(delay);
    }

    /** Hides the tooltip after the delay in ms, defaults to tooltip-delay-hide or 0ms if no input */
    hide(delay: number = this.hideDelay): void {
        if (this._tooltipInstance) {
            this._tooltipInstance.hide(delay);
        }
    }

    /** Shows/hides the tooltip */
    toggle(): void {
        if (this._isTooltipVisible()) {
            this.hide();
        } else {
            this.show();
        }
    }

    /** Returns true if the tooltip is currently visible to the user */
    _isTooltipVisible(): boolean {
        return !!this._tooltipInstance && this._tooltipInstance.isVisible();
    }

    /** Handles the keydown events on the host element. */
    _handleKeydown(e: KeyboardEvent): any {
        // eslint-disable-next-line import/no-deprecated
        if (this._isTooltipVisible() && e.keyCode === ESCAPE && !hasModifierKey(e)) {
            e.preventDefault();
            e.stopPropagation();
            this.hide(0);
        }
    }

    /** Create the overlay config and position strategy */
    private _createOverlay(): OverlayRef {
        if (this._overlayRef) {
            return this._overlayRef;
        }

        const scrollableAncestors = this._scrollDispatcher.getAncestorScrollContainers(this._elementRef);

        // Create connected position strategy that listens for scroll events to reposition.
        const strategy = this._overlay
            .position()
            .flexibleConnectedTo(this._elementRef)
            .withTransformOriginOn(".mat-tooltip")
            .withFlexibleDimensions(false)
            .withViewportMargin(8)
            .withScrollableContainers(scrollableAncestors);

        strategy.positionChanges.pipe(takeUntil(this._destroyed)).subscribe((change) => {
            this.tooltipRenderPosition = change;
            this._tooltipInstance.addPositionClasses(change);

            // eslint-disable-next-line sonarjs/no-collapsible-if
            if (this._tooltipInstance) {
                if (change.scrollableViewProperties.isOverlayClipped && this._tooltipInstance.isVisible()) {
                    // After position changes occur and the overlay is clipped by
                    // a parent scrollable then close the tooltip.
                    this._ngZone.run(() => this.hide(0));
                }
            }
        });

        this._overlayRef = this._overlay.create({
            direction: this._dir,
            positionStrategy: strategy,
            panelClass: TOOLTIP_PANEL_CLASS,
            scrollStrategy: this._overlay.scrollStrategies.close(),
        });

        this._updatePosition();

        this._overlayRef
            .detachments()
            .pipe(takeUntil(this._destroyed))
            .subscribe(() => this._detach());

        return this._overlayRef;
    }

    /** Detaches the currently-attached tooltip. */
    private _detach(): void {
        if (this._overlayRef && this._overlayRef.hasAttached()) {
            this._overlayRef.detach();
        }

        this._tooltipInstance = null;
    }

    /** Updates the position of the current tooltip. */
    private _updatePosition(): void {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const position = this._overlayRef!.getConfig().positionStrategy as FlexibleConnectedPositionStrategy;
        const origin = this._getOrigin();
        const overlay = this._getOverlayPosition();
        const offset = {
            main: {
                offsetX: 15,
                offsetY: -12,
            },
            fallback: {
                offsetX: 15,
                offsetY: 12,
            },
        };

        this.tooltipRenderPosition = {
            connectionPair: {
                ...origin.main,
                ...overlay.main,
                ...offset.main,
            },
            scrollableViewProperties: {
                isOriginClipped: false,
                isOriginOutsideView: false,
                isOverlayClipped: false,
                isOverlayOutsideView: false,
            },
        };

        position.withPositions([
            { ...origin.main, ...overlay.main, ...offset.main },
            { ...origin.fallback, ...overlay.fallback, ...offset.fallback },
        ]);
    }

    /** Set the pointer arrow position based on the origin position */
    private _getOriginPosition(): any {
        return this._elementRef.nativeElement.getBoundingClientRect();
    }

    /**
     * Returns the origin position and a fallback position based on the user's position preference.
     * The fallback position is the inverse of the origin (e.g. `'below' -> 'above'`).
     */
    _getOrigin(): { main: OriginConnectionPosition; fallback: OriginConnectionPosition } {
        const isLtr = !this._dir || this._dir.value === "ltr";
        const position = this.position;
        let originPosition: OriginConnectionPosition;

        if (position === "above" || position === "below") {
            originPosition = { originX: "end", originY: position === "above" ? "top" : "bottom" };
        } else if (position === "before" || (position === "left" && isLtr) || (position === "right" && !isLtr)) {
            originPosition = { originX: "start", originY: "center" };
        } else if (position === "after" || (position === "right" && isLtr) || (position === "left" && !isLtr)) {
            originPosition = { originX: "end", originY: "center" };
        } else {
            throw getMatTooltipInvalidPositionError(position);
        }

        const { x, y } = this._invertPosition(originPosition.originX, originPosition.originY);

        return {
            main: originPosition,
            fallback: { originX: x, originY: y },
        };
    }

    /** Returns the overlay position and a fallback position based on the user's preference */
    _getOverlayPosition(): { main: OverlayConnectionPosition; fallback: OverlayConnectionPosition } {
        const isLtr = !this._dir || this._dir.value === "ltr";
        const position = this.position;
        let overlayPosition: OverlayConnectionPosition;

        if (position === "above") {
            overlayPosition = { overlayX: "end", overlayY: "bottom" };
        } else if (position === "below") {
            overlayPosition = { overlayX: "center", overlayY: "top" };
        } else if (position === "before" || (position === "left" && isLtr) || (position === "right" && !isLtr)) {
            overlayPosition = { overlayX: "end", overlayY: "center" };
        } else if (position === "after" || (position === "right" && isLtr) || (position === "left" && !isLtr)) {
            overlayPosition = { overlayX: "start", overlayY: "center" };
        } else {
            throw getMatTooltipInvalidPositionError(position);
        }

        const { x, y } = this._invertPosition(overlayPosition.overlayX, overlayPosition.overlayY);

        return {
            main: overlayPosition,
            fallback: { overlayX: x, overlayY: y },
        };
    }

    /** Updates the tooltip message and repositions the overlay according to the new message length */
    private _updateTooltipMessage(): void {
        // Must wait for the message to be painted to the tooltip so that the overlay can properly
        if (this._tooltipInstance) {
            this._tooltipInstance.message = this.message;
            this._tooltipInstance._markForCheck();

            this._ngZone.onMicrotaskEmpty
                .asObservable()
                .pipe(take(1), takeUntil(this._destroyed))
                .subscribe(() => {
                    if (this._tooltipInstance) {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        this._overlayRef!.updatePosition();
                    }
                });
        }
    }

    /** Updates the tooltip class */
    private _setTooltipClass(tooltipClass: string | string[] | Set<string> | { [key: string]: any }): void {
        if (this._tooltipInstance) {
            this._tooltipInstance.tooltipClass = tooltipClass;
            this._tooltipInstance._markForCheck();
        }
    }

    /** Inverts an overlay position. */
    private _invertPosition(x: HorizontalConnectionPos, y: VerticalConnectionPos): any {
        if (this.position === "above" || this.position === "below") {
            if (y === "top") {
                y = "bottom";
            } else if (y === "bottom") {
                y = "top";
            }
            // eslint-disable-next-line sonarjs/no-collapsible-if
        } else {
            if (x === "end") {
                x = "start";
            } else if (x === "start") {
                x = "end";
            }
        }

        return { x, y };
    }

    /** Binds the pointer events to the tooltip trigger. */
    private _setupPointerEvents(): any {
        // The mouse events shouldn't be bound on mobile devices, because they can prevent the
        // first tap from firing its click event or can cause the tooltip to open for clicks.
        if (!this._platform.IOS && !this._platform.ANDROID) {
            this._passiveListeners
                .set("mouseenter", () => {
                    this.show();
                })
                .set("mouseleave", () => {
                    this.hide();
                });
        } else if (this.touchGestures !== "off") {
            this._disableNativeGesturesIfNecessary();
            const touchendListener = () => {
                clearTimeout(this._touchstartTimeout);
                this.hide(this._defaultOptions.touchendHideDelay);
            };

            this._passiveListeners
                .set("touchend", touchendListener)
                .set("touchcancel", touchendListener)
                .set("touchstart", () => {
                    // Note that it's important that we don't `preventDefault` here,
                    // because it can prevent click events from firing on the element.
                    clearTimeout(this._touchstartTimeout);
                    this._touchstartTimeout = setTimeout(() => this.show(), LONGPRESS_DELAY);
                });
        }

        this._passiveListeners.forEach((listener, event) => {
            this._elementRef.nativeElement.addEventListener(event, listener, passiveListenerOptions);
        });
    }

    /** Disables the native browser gestures, based on how the tooltip has been configured. */
    private _disableNativeGesturesIfNecessary(): void {
        const element = this._elementRef.nativeElement;
        const style = element.style;
        const gestures = this.touchGestures;

        if (gestures !== "off") {
            // If gestures are set to `auto`, we don't disable text selection on inputs and
            // textareas, because it prevents the user from typing into them on iOS Safari.
            if (gestures === "on" || (element.nodeName !== "INPUT" && element.nodeName !== "TEXTAREA")) {
                style.userSelect = (style as any).msUserSelect = style.webkitUserSelect = (style as any).MozUserSelect = "none";
            }

            // If we have `auto` gestures and the element uses native HTML dragging,
            // we don't set `-webkit-user-drag` because it prevents the native behavior.
            if (gestures === "on" || !element.draggable) {
                (style as any).webkitUserDrag = "none";
            }

            style.touchAction = "none";
            (style as any).webkitTapHighlightColor = "transparent";
        }
    }
}

/**
 * Internal component that wraps the tooltip's content.
 * @docs-private
 */
// eslint-disable-next-line max-classes-per-file
@Component({
    selector: "empowered-rich-tooltip",
    templateUrl: "tooltip.html",
    styleUrls: ["tooltip.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [matTooltipAnimations.tooltipState],
    // eslint-disable-next-line @angular-eslint/no-host-metadata-property
    host: {
        // Forces the element to have a layout in IE and Edge. This fixes issues where the element
        // won't be rendered if the animations are disabled or there is no web animations polyfill.
        // eslint-disable-next-line quotes, @typescript-eslint/quotes
        "[style.zoom]": '_visibility === "visible" ? 1 : null',
        "(body:click)": "this._handleBodyInteraction()",
        "aria-hidden": "true",
    },
})
export class TooltipComponent implements OnDestroy {
    /** Message to display in the tooltip */
    message: string;

    /** Classes to be added to the tooltip. Supports the same syntax as `ngClass`. */
    tooltipClass: string | string[] | Set<string> | { [key: string]: any };

    /** The timeout ID of any current timer set to show the tooltip */
    _showTimeoutId: any | null;

    /** The timeout ID of any current timer set to hide the tooltip */
    _hideTimeoutId: any | null;

    /** Property watched by the animation framework to show or hide the tooltip */
    _visibility: TooltipVisibility = "initial";

    /** Whether interactions on the page should close the tooltip */
    private _closeOnInteraction = false;

    /** Subject for notifying that the tooltip has been hidden from the view */
    private readonly _onHide: Subject<void> = new Subject();

    /** Stream that emits whether the user has a handset-sized display.  */
    _isHandset: Observable<BreakpointState> = this._breakpointObserver.observe(Breakpoints.Handset);

    /** Storing the injected data into an object */
    originPosition = this.componentData.originPosition;
    elementReference = this.componentData.elementReference;
    tooltipRenderPosition = this.componentData.tooltipRenderPosition;

    /** To store the position to be applied to the arrow */
    arrowPosition: any;
    positionClass: string;
    POINTER_ARROW = {
        WIDTH: 16,
        HEIGHT: 4,
    };
    isArrowVisible = false;

    /** Getting the reference of the tooltip box */
    @ViewChild("tooltipContentBox", { static: true }) tooltipContentBox: ElementRef;

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _breakpointObserver: BreakpointObserver,
        @Inject(CONTAINER_DATA) public componentData: any,
    ) {}

    /**
     * Shows the tooltip with an animation originating from the provided origin
     * @param delay Amount of milliseconds to the delay showing the tooltip.
     */
    show(delay: number): void {
        // Cancel the delayed hide if it is scheduled
        if (this._hideTimeoutId) {
            clearTimeout(this._hideTimeoutId);
            this._hideTimeoutId = null;
        }

        // Body interactions should cancel the tooltip if there is a delay in showing.
        this._closeOnInteraction = true;
        this._showTimeoutId = setTimeout(() => {
            this._visibility = "visible";
            this.addPositionClasses(this.tooltipRenderPosition);
            this._showTimeoutId = null;

            // Mark for check so if any parent component has set the
            // ChangeDetectionStrategy to OnPush it will be checked anyways
            this._markForCheck();
            // this._getOriginOffset();
        }, delay);
    }

    /**
     * Begins the animation to hide the tooltip after the provided delay in ms.
     * @param delay Amount of milliseconds to delay showing the tooltip.
     */
    hide(delay: number): void {
        // Cancel the delayed show if it is scheduled
        if (this._showTimeoutId) {
            clearTimeout(this._showTimeoutId);
            this._showTimeoutId = null;
        }

        this._hideTimeoutId = setTimeout(() => {
            this._visibility = "hidden";
            this._hideTimeoutId = null;

            // Mark for check so if any parent component has set the
            // ChangeDetectionStrategy to OnPush it will be checked anyways
            this._markForCheck();
        }, delay);
    }

    /** Returns an observable that notifies when the tooltip has been hidden from view. */
    afterHidden(): Observable<void> {
        return this._onHide.asObservable();
    }

    /** Whether the tooltip is being displayed. */
    isVisible(): boolean {
        return this._visibility === "visible";
    }

    ngOnDestroy(): void {
        this._onHide.complete();
    }

    _animationStart(): void {
        this.isArrowVisible = false;
        this._closeOnInteraction = false;
    }

    _animationDone(event: AnimationEvent): void {
        const toState = event.toState as TooltipVisibility;
        this.arrowPosition = this._computeArrowPosition();
        this.isArrowVisible = true;

        if (toState === "hidden" && !this.isVisible()) {
            this._onHide.next();
        }

        if (toState === "visible" || toState === "hidden") {
            this._closeOnInteraction = true;
        }
    }

    /**
     * Interactions on the HTML body should close the tooltip immediately
     */
    _handleBodyInteraction(): void {
        if (this._closeOnInteraction) {
            this.hide(0);
        }
    }

    /**
     * Marks that the tooltip needs to be checked in the next change detection run.
     * Mainly used for rendering the initial text before positioning a tooltip, which
     * can be problematic in components with OnPush change detection.
     */
    _markForCheck(): void {
        this._changeDetectorRef.markForCheck();
    }

    /** Calculate & set position of the arrow based on the originPosition object from the directive */
    _computeArrowPosition(): any {
        const tooltipContentBoxRect = this.tooltipContentBox.nativeElement.getBoundingClientRect();

        const left = this.originPosition.left - tooltipContentBoxRect.left + this.originPosition.width / 2 - this.POINTER_ARROW.WIDTH / 2;

        const right = tooltipContentBoxRect.right - left + 16;

        return {
            left: left,
            right: right,
        };
    }

    /** Add classes based on the position of rendering */
    addPositionClasses(tooltipRenderPosition: any): void {
        this.tooltipRenderPosition = tooltipRenderPosition;

        let positionClass = "placed-top-right";

        if (this.tooltipRenderPosition) {
            const connectionPair = this.tooltipRenderPosition.connectionPair;

            if (connectionPair.originY === "top" && connectionPair.overlayY === "bottom") {
                positionClass = "placed-top-right";
            }
            if (connectionPair.originY === "bottom" && connectionPair.overlayY === "top") {
                positionClass = "placed-bottom-right";
            }
        } else {
            positionClass = "placed-top-right";
        }

        this.positionClass = positionClass;
    }
}
