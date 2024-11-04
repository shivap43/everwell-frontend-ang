# UI components

### Author: Rupesh Jain

The `UiComponentsModule` module wraps few of the static components which are/will be used across the Montoya application portals to implement the UI specific features. All the components defined in this module should be available where we have the `SharedModule` imported.

> The `UiComponentsModule` is imported in the `SharedModule` and doesn't need an exclusive import in any component, unless the `SharedModule` is not imported.

The components available in this module are listed below

1. **Alert**
1. **Dialog**
1. **Icon**
1. **Navlist**
1. **Spinner**
1. **Upload**
1. **Rich Tooltip**
1. **Bottom Sheet**
1. **Date Range picker**
1. **Modal**
1. **Generic Sidenav**
1. **Pill filter**
1. **Toast(SnackBar)**

### **How to use?** - explaining the usage of the components -

## **Alert**

`Alert` component should be used to notify the users of four types of messages, given below

- Danger/Error message
- Warning message
- Sucess message
- Informational message

The alert will also load the corresponding icon based on the type of the alert.

> All the associated styles are placed in the .scss file of the component: `mon-alert.component.scss`

#### Usage - HTML

```html
<mon-alert class="<any-class-name>" alertType="<danger/warning/success/info>">
  <span>{{ ... the message here ... }}</span>
</mon-alert>
```

---

## **Dialog**

`Dialog` component can be used to render small dialogs which are meant to display some information, get a confirmation, etc from the user.

> This `dialog` cannot be used for dialogs which have forms or which display large content.

#### Usage - typescript

```typescript
let dialogData: MonDialogData;
dialogData = {
  title: "Confirmation modal", //Header of the modal
  content: "Are you sure you want to delete this item?", //Content to be loaded in the content section
  primaryButton: {
    buttonTitle: "OK",
    buttonAction: "<function to be called when this button is clicked>",
    buttonClass: "btn-primary"
  },
  secondaryButton: {
    buttonTitle: "Cancel",
    buttonAction: "<function to be called when this button is clicked>"
  }
};

const dialogRef = this.dialog.open(MonDialogComponent, {
  width: "667px",
  data: dialogData
});
```

---

## **Icon**

`Icon` component provides the ability to load an icon based on the need by accepting few parameters. It implements the `MatIconRegistry` registry to add the icon to the material registry and load it using the `mat-icon` component provided by angular-material.

It loads the icons from the base folder - `"libs\shared\src\lib\assets\svgs\"`

### Parmaters

- **iconName** to spcifiy the name of the icon to be picked from the base folder. This has to match the name of the icon file in the base folder, leaving the extension, .svg in our case.
- **iconSize** to load the icon of a particular size - height & width (20px is the default, if not provided)
- **altText** to provide the value of the `alt` attribute, if required, for the icon

#### Usage - HTML

```html
<mon-icon iconName="<icon-name>" [iconSize]="20/or the needed size"></mon-icon>
```

---

## **Spinner**

`Spinner` components provides a way to render a loader to be shown as needed to indicate the user of the background operation which is in progress.

### Parameters

- **enableSpinner** to toggle the spinner based on the initiation & completion of async operation.
- **backdrop** to toggle blocking of the whole screen while showing the loaded. This will block the complete screen and the user will not be able to perform any operations with the mouse.
- **wait** to start the spinner with a delay of some milliseconds (default: 0). In case of very short durations of the operation, the loader would not be shown if it completes within some millisecons, 400ms for example.

#### Usage - HTML

```html
<empowered-mon-spinner
  [enableSpinner]="true"
  backdrop="true"
></empowered-mon-spinner>
```

---

## **Upload**

`Upload` provides the ability for file upload. It includes the features like

- drag-drop file upload
- status of file upload
- uploaded files list
- remove file
- progress indicator of the upload process
  - determinate - the progress bar moves in steps
  - indeterminate - an animating progress bar with an infinite loop of animation

Use this component to implement the file upload functionality as needed.

#### Usage - HTML

```html
<empowered-mon-upload
  accept="<.png,.jpeg,.jpg,.pdf,.doc,.xls,.xlsx,.docx,.txt>"
  uploadFile="<provide the function which will HANDLE the file upload>"
  cancelUpload="<provide the function which will CANCEL the file upload>"
  modeProgress="<to determine whether progress-bar is determinate/indeterminate>"
  files="<file array to display file details(e.g., name)>"
  hasError="<array of errored files with the information of the error for the file which is being uploaded>"
  isSucess="<array of files uploaded successfully with the information of the status for the file which is being uploaded>"
  uploadSucessStatus="<array of strings to display file-specific success meta-data like, date-time, status.>"
  isProgressBarEnabled="to toggle (show/hide) the progress bar"
  isFileSelected="<to indicate if any file has been selected for upload, else mark the upload component as `red` on click of upload button>"
  lastUploadFileName="<to display last uploaded file-details>"
  fileUploadPercentage="<for displaying upload-percentage of file-upload process>"
  isUploadingStarted="<to toggle (show/hide) of file-upload percentage & cancel upload>"
></empowered-mon-upload>
```

---

## **Rich Tooltip**

`Rich tooltip` is a directive with an ability to render HTML content in a tooltip. Angular-material tooltip code has been used to create this directive and all the options supported by [angular-material tooltip](https://material.angular.io/components/tooltip/overview) are also supported by this directive.

#### Usage - HTML

```html
<button
  mat-icon-button
  [richTooltip]="<HTML/text content here - can be loaded from a variable which gets populated in .ts file>"
  matTooltipPosition="above"
  matTooltipClass="pos-above"
  [attr.aria-label]="languageStrings['primary.portal.accountEnrollments.sentUnsentBusiness.columnNote']"
>
  <mon-icon iconName="note" class="note-icon" [iconSize]="24"></mon-icon>
</button>
```

---

## **Bottom Sheet**

Refer the documentation under the Bottom sheet component for details. Path to the readme - `libs\shared\src\lib\ui-components\bottom-sheet\README.md`

---

## **Date Range picker**

`Date range picker` component can be used for forms where we have range of dates to be selected and both are mandatory - start date & end date. Two fields will be tied to a single datepicker.

> Note: This will not be suitable where either of the dates are needed and the other one is optional.

#### Usage - HTML

```html
<empowered-date-range-picker
  [startDateControl]="createPlanYearForm.get('enrollmentPeriod').get('effectiveStarting')"
  [endDateControl]="createPlanYearForm.get('enrollmentPeriod').get('expiresAfter')"
  [labelKey]="languageStringsArray['primary.portal.benefitsOffering.enrollmentDates']"
></empowered-date-range-picker>
```

---

## **Modal**

Refer the documentation under the Modal component for details. Path to the readme - `libs\shared\src\lib\ui-components\modal\README.md`

---

## **Generic Sidenav**

`Generic sidenav` can be used to implement a side-nav to any module by using the following options.

### Options

- **navigationOptions** array of the navigation items
  - **menuItem** - the wrapper navigation item hosting the sub-items which will actually hold the route for a page
  - **subMenuItem** - array of actual navigation items which contain the route for different pages.
- **previousListName** - previous listing screen (Account list, Employee list, etc)
- **enableBackToPreviousListing** - used to toggle the back to previous listing
- **optionSelectedOutput** - accepts a function which will hold the logic for routing

```html
<empowered-generic-sidenav
  #genSideNav
  [navigationOptions]=""
  [enableBackToPreviousListing]="true/false"
  [previousListName]=""
  (optionSelectedOutput)=""
>
  <router-outlet></router-outlet>
</empowered-generic-sidenav>
```

The `Navlist` component will be internally used by this component to construct the navigation items.

---

## **Pill filter**

Refer the documentation under the Modal component for details. Path to the readme - `libs\shared\src\lib\ui-components\pill-filter\Readme.md`

---

## **Toast(SnackBar)**

Refer the documentation under the Modal component for details. Path to the readme - `libs\shared\src\lib\ui-components\toast\README.md`

---
