# Empowered Toast

### Author: Mrunal Patel

The Empowered Toast abstracts all of the toast(snackBar) styling and behavior into a single component.

A places that code will need to be added to in order to display the toast(snackBar):

-   Container: dispatch an action with toast object to trigger the toast(snackBar) to display

## Default: ToastType: WARNING

Implementors want to display warning toast(snackBar) with default behavior need to only specify massage to display.

## Container Implementation

The container will need to create toast object with only require field.

#### Example:

```typescript
  constructor(
      private readonly store: Store
    ) { }

  ...

  const toast: ToastModel = {
    message: "I'm Toast";
  };
  this.store.dispatch(new OpenToast(toast));
```

## With Callback Action

Implementors want to display toast(snackBar) with callBack action need to specify massage to display, action button text, action callback, type of toast and dismiss duration.

## Container Implementation

The container will need to create toast object.

#### Example:

```typescript
  constructor(
      private readonly store: Store
    ) { }

  ...

  const toast: ToastModel = {
    message: "I'm Toast";
    action?: {
      text: "Click me!!!",
      callback: () => console.log("HELLO")
    };
    // If user wants to display only warning toast no need to add toastType.
    toastType?: ToastType.SUCCESS || ToastType.WARNING || ToastType.DANGER;
    duration?: number;
  };
  this.store.dispatch(new OpenToast(toast));
```
