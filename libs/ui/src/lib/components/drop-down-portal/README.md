# Empowered Dropdown Portal

### Author: Stephen Stroud

# Overview:

The Dropdown Portal abstracts the logic and styling of a cdk-overlay-panel and backdrop. The contents of the portal are populated through content projection. A directive (`PortalTriggerDirective`) is applied to the button (or element that acts as one) that shows the portal when clicked.

# Portal:

The portal shows by clicking the trigger set by the `PortalTriggerDirective`, hides by clicking outside the portal while it's being shown, and emits the shown/hidden events accordingly. The portal is displayed relative to the trigger. It can either directly under or over it depending on location in window, and it's lateral position relative to the trigger can be set with `portalPosition`. When the portal is shown, it focuses on a hidden label to announce entering the portal and it's title (set by `ariaTitle`). Tabbing will cycle through each focusable item excluding the hidden label.

-   Portal inputs:

    -   `portalClass`?: string
        -   Styles must be added to `_portal.scss`
    -   `portalPosition`?: "left" (default) | "right"
        -   Determines if portal lines up at beginning or end of trigger's lateral position
    -   `ariaTitle`?: string (language_specification)
        -   Message to be announced by screen readers upon showing portal.

-   Portal outputs:
    -   `shown`: EventEmitter
        -   Emits whenever portal is shown
    -   `hidden`: EventEmitter
        -   Emits whenever portal is hidden

# Backdrop:

The backdrop fully overlays the backdropAnchor, and its style can be specified. If no inputs are provided, it does not exist.

-   Backdrop inputs:
    -   `backdropAnchor`?: ElementRef
    -   `backdropStyle`?: "none" (default) | "blur" | "dark" | "light"

# Example (with custom component that contains all logic):

```typescript
// selector: "empowered-options"
export class OptionsComponent implements PortalContentInterface {
    @Input() portalRef: PortalDropDownComponent;
    // other fields and constructor

    ngOnInit(): void {
        // Plug into portal state observables.
        this.portalRef.hidden.pipe(tap(() => this.onHide())).subscribe();
        this.portalRef.shown.pipe(tap(() => this.onShow())).subscribe();
    }

    // method(s) called to apply, reset, etc. whenever the portal is meant to be closed
    complete(): void {
        // logic for component

        // keep in mind this function call will set off the onHide() callback
        this.portalRef.hide();
    }

    // both of these are optional, used to set state similarly to onDestroy and onInit
    onShow(): void {
        // set appropriate state or call methods for opening portal
    }

    onHide(): void {
        // set appropriate state or call methods for closing portal
    }
}
```

```html
<div class="options-bar">
    <mat-button [empoweredPortalTrigger]="optionsPortal">Options</mat-button>
    <empowered-drop-down-portal
        #optionsPortal
        ariaTitle="language.spec.to.announce"
        [backdropAnchor]="results"
        backdropStyle="blur"
    >
        <empowered-options [portalRef]="optionsPortal"></empowered-options>
    </empowered-drop-down-portal>
</div>
<div class="results" #results>...</div>
```

# Example (with custom/standard components that do not handle logic):

```typescript
export class ContainerComponent {
  @ViewChild("examplePortal", { read: DropDownPortalComponent })
  examplePortal: DropDownPortalComponent;
  // flag to determine reset or apply
  exampleOptionApplied = false;

  // template shows another way to handle shown/hidden output
  private readonly examplePortalShown$: Observable<
    void
  > = this.examplePortal.shown.pipe(
    tap(() => {
          this.exampleOptionApplied = false;
          // any appropriate logic similar to what goes in ngOnInit
      }),
    takeUntil(this.unsubscribe$)
  );
  private readonly examplePortalHidden$: Observable<
    void
  > = this.examplePortal.hidden.pipe(
    tap(() => {
      // if portal closed by clicking out or reset
      if (!this.exampleOptionApplied) {
          this.resetExamplePortalData();
      } else {
          this.applyExamplePortalData();
      }
      // any appropriate logic similar to what goes in ngOnDestroy
    }),
    takeUntil(this.unsubscribe$)
  );
  ...
  setAppliedState(isApplied: boolean): void {
    this.exampleOptionApplied = isApplied;
    // any other appropriate logic
    this.examplePortal.hide();
  }

  applyExamplePortalData(): void {
      // form submission logic
  }

  resetExamplePortalData(): void {
      // form reset logic
  }
}
```

```html
<div class="options-bar">
    <mat-button [empoweredPortalTrigger]="examplePortal">Options</mat-button>
    <empowered-drop-down-portal
        #examplePortal
        [backdropAnchor]="results"
        backdropClass="dark"
        ariaTitle="language.spec.to.announce"
        (portalShown)="anotherWayToHandleEvent()"
    >
        <!-- Form content -->
        <button (click)="setAppliedState(false)">Reset</button>
        <button (click)="setAppliedState(true)">Apply</button>
    </empowered-drop-down-portal>
</div>
<div class="results" #results>...</div>
```

# Example (simplest use case):

```typescript
// Nothing needed!
```

```html
<button [empoweredPortalTrigger]="simplePortal">Open Portal</button>
<empowered-drop-down-portal #simplePortal ariaTitle="language.spec.to.announce"
    >The portal is open!</empowered-drop-down-portal
>
```
