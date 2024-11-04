# Empowered Modal

### Author: Tim Nowaczewski

The Empowered Modal abstracts all of the modal styling and behavior into a single component. Implementors need to only specify the type of modal, the size, header, footer content, and modal content, without worrying about styling.

There are two places that code will need to be added to in order to display the modal:

-   Container: the component with the action to trigger the modal to display
-   Implementing Component: the modal to display, contains all of the content to project into the modal

## Container Implementation

The container will need to initialize the modal, and if needed, subscribe to any MatDialog events.

#### Example:

```typescript
  constructor(
      private empoweredModalService: EmpoweredModalService
    ) { }

  ...

  openModal(): void {
    this.empoweredModalService.openDialog(
        TestModalComponent
      );
  }
```

## Modal Component Initialization

The implementing modal component will use the generic `EmpoweredModalComponent` in order to project its content onto the template. There are four parts that will need to be implemented:

-   `EmpoweredModalComponent`: The wrapper component for the individual parts of the ModalComponent. It also specifies the size and type of the component.
-   `EmpoweredModalHeaderComponent`: Header specific data, including the title and an optional header
-   `EmpoweredModalFooterComponent`: Footer buttons to project into the footer controls if the modal `type` is `POPUP`. Modal types of `INFORMATIONAL` will not display a footer
-   Content: any content that is specific to the implementing modal. Any content that is not wrapped by an `EmpoweredModalHeaderComponent` or an `EmpoweredModalFooterComponent` will be projected into the body of the modal.

Implementing modal components will import the MatDialogRef and MAT_DIALOG_DATA as normal, and can be used to pass data to and from the Modal. If close functionality is needed by the implementing modal component, then the `EmpoweredModalService` can be imported.

#### Example:

```typescript
export class TestModalComponent implements OnInit {
    constructor(
        public dialogRef: MatDialogRef<TestModalComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    ngOnInit(): void {}
}
```

```html
<empowered-modal type="POPUP" size="XL">
    <empowered-modal-header optionalLabel="Optional label"
        >Header Title</empowered-modal-header
    >
    <empowered-modal-footer>
        <button mat-raised-button>Button One</button>
        <button mat-raised-button>Button Two</button>
    </empowered-modal-footer>
    <div>Content To display</div>
    <p>Lots of stuff to do, click a button</p>
    <p></p
></empowered-modal>
```
