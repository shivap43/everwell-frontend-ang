/* eslint-disable @typescript-eslint/member-ordering */
import { Directive, ElementRef, HostListener, Input, OnInit, AfterViewChecked } from "@angular/core";
import { Router } from "@angular/router";
import { AppSettings } from "@empowered/constants";
import { BreakPointUtilService } from "@empowered/ngxs-store";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[app-Overlaystepper]",
})
export class StepperDirective implements OnInit, AfterViewChecked {
    observer: any;
    ref;
    stepperRef;
    stepperOverlay = "stepper-overlay";
    stepperOverlayTrigger = "stepper-overlay-trigger";
    selectedStep = ".mat-step-label-selected";
    isTPI = false;
    constructor(
        private readonly el: ElementRef,
        private readonly breakpointObserver: BreakPointUtilService,
        private readonly router: Router,
    ) {}

    @Input("app-Overlaystepper") buttonRef: string;
    // eslint-disable-next-line @angular-eslint/no-input-rename
    @Input("stepperId") stepperId: string;
    // eslint-disable-next-line @angular-eslint/no-input-rename
    @Input("tpiLnlMode") tpiLnlMode = false;
    @HostListener("click") onClick(): void {
        this.updateStepperTriggerContent();
    }
    /**
     * ngOnInit(): Life cycle hook for angular to initialize the component
     * manipulating the component style based on the screen resolution/size.
     */
    ngOnInit(): void {
        this.isTPI = this.router.url.indexOf(AppSettings.TPI) >= 0;

        this.stepperRef = document.getElementById(this.stepperId);
        this.ref = document.getElementById(this.buttonRef);
        this.breakpointObserver.breakpointObserver$.subscribe((resp) => {
            if (
                (resp.size === "XS" && resp.orientation === "PORTRAIT") ||
                (resp.size === "SM" && resp.orientation === "PORTRAIT") ||
                (resp.size === "MD" && resp.orientation === "PORTRAIT") ||
                (this.isTPI && !this.tpiLnlMode)
            ) {
                this.el.nativeElement.classList.add(this.stepperOverlay);
                this.ref.classList.remove(this.stepperOverlayTrigger);
                this.updateStepperTriggerContent();
            } else {
                this.el.nativeElement.classList.remove(this.stepperOverlay);
                this.ref.classList.add(this.stepperOverlayTrigger);
            }
        });
    }

    /**
     * Function to update stepper label on changes in child component content
     */
    ngAfterViewChecked(): void {
        this.updateStepperTriggerContent();
    }
    /**
     * function to fetch the text content of current selected label
     * function to apply that label to the button for drop down trigger
     */
    updateStepperTriggerContent(): void {
        const selectedStepLabel = this.stepperRef.querySelector(this.selectedStep)
            ? this.stepperRef.querySelector(this.selectedStep).textContent
            : null;
        const btnLabelSelector = `#${this.buttonRef} .selected-step-label`;
        if (selectedStepLabel) {
            document.querySelector(btnLabelSelector).innerHTML = selectedStepLabel.split(":")[0];
        }
        // tab rwd for quote shop page
        const selectedTabLabel = this.stepperRef.querySelector(".mat-tab-label-active")
            ? this.stepperRef.querySelector(".mat-tab-label-active .products-nav .product-label").textContent
            : null;
        const btnTabLabelSelector = `#${this.buttonRef} .selected-tab-label`;
        if (selectedTabLabel) {
            document.querySelector(btnTabLabelSelector).innerHTML = selectedTabLabel.split(":")[0];
        }
    }
}
