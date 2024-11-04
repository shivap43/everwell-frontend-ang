# Empowered Sheet

### Author: Tim Nowaczewski

The Empowered Sheet abstracts all of the Quasimodal styling and behavior into a single component. Implementors need to only specify the header, footer content, and modal content, without worrying about styling.

There are two places that code will need to be added to in order to display the modal:

-   Container: the component with the action to trigger the modal to display
-   Implementing Component: the sheet to display, contains all of the content to project into the opened sheet

## Container Implementation

The container will need to initialize the sheet, and if needed, subscribe to any MatBottomSheet events.

#### Example:

```typescript
  constructor(
      private bottomSheet: EmpoweredSheetService
    ) { }

  ...

  openModal(): void {
    this.empoweredModalService.openSheet(
        TestSheetComponent
      );
  }
```

## Sheet Component Initialization

The implementing sheet component will use the generic `EmpoweredSheetComponent` in order to project its content onto the template. There are four parts that will need to be implemented:

-   `EmpoweredSheetComponent`: The wrapper component for the individual parts of the Sheet Component.
-   `EmpoweredSheetHeaderComponent`: Header specific data, including the title and an optional header
-   `EmpoweredSheetFooterComponent`: Footer buttons to project into the footer controls.
-   Content: any content that is specific to the implementing modal. Any content that is not wrapped by an `EmpoweredSheetHeaderComponent` or an `EmpoweredSheetFooterComponent` will be projected into the body of the modal.

Implementing sheet components can import the MatBottomSheetRef and MAT_BOTTOM_SHEET_DATA as normal, and can be used to pass data to and from the Sheet. If close functionality is needed by the implementing sheet component, then the `EmpoweredSheetService` can be imported.

#### Example:

```typescript
export class TestSheetComponent implements OnInit {
    constructor(@Optional() @Inject(MAT_BOTTOM_SHEET_DATA) data: any) {}

    ngOnInit(): void {}
}
```

```html
<empowered-sheet>
    <empowered-sheet-header optionalLabel="Mandatory"
        >Quasi-modal Sheet</empowered-sheet-header
    >

    <empowered-sheet-footer>
        <button matButton>Button</button>
        <button matButton>Button</button>
        <button matButton>Button</button>
    </empowered-sheet-footer>

    <div>So MUCH room for activities</div>
</empowered-sheet>
```
