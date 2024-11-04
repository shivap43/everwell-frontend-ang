# Shared

The `SharedModule` contains code that will be used across all Montoya application portals _and_ Feature Modules. You **SHOULD NOT** import the `SharedModule` into any of the main `AppModule`s or the `CoreModule`.

> Note: Please be very careful about editing any dependencies within this library, since this module will be shared across multiple feature modules. Any PR that edits this library should include a screenshot of affected libraries by running `yarn affected:dep-graph --base=origin/develop`

## What to include / exclude

- ✅ **Common Angular modules** that can be easily used across your app, without importing them in every Feature Module. (e.g. CommonModule).
- ✅ **Pipes & Directives** (e.g custom string/date filters).
- ✅ **Shared DUMB components** (e.g. a global button component).

## Re-Exporting Modules

Note that `CommonModule` and `ReactiveFormsModule` are listed in the "exports" array of our `SharedModule`. This allows any other module that imports this `SharedModule` to access directives like `NgIf` and `NgFor` from `CommonModule` and can bind to component properties like `[formControl]`, a directive in the `ReactiveFormsModule`.

Even though the components declared by `SharedModule` might not bind with `[formControl]` and there may be no need for `SharedModule` to import `ReactiveFormsModule`, `SharedModule` can still export `ReactiveFormsModule` without listing it among its imports. This way, you can give other modules access to FormsModule without having to import it directly into the @NgModule decorator.

## Using components vs services from other modules.

There is an important distinction between using another module's component and using a service from another module. Import modules when you want to use directives, pipes, and components. Importing a module with services means that you will have a new instance of that service, which typically is not what you need (typically one wants to reuse an existing service). Use module imports to control service instantiation.

The most common way to get a hold of shared services is through Angular dependency injection, rather than through the module system (importing a module will result in a new service instance, which is not a typical usage).

## Code scaffolding

Run `ng generate <YOUR_SCHEMATIC> --project shared` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project shared`.

> Note: Don't forget to add `--project shared` or else it will be added to the default project in your `angular.json` file.

## Build

Run `ng build shared` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build shared`, go to the dist folder `cd dist/shared` and run `npm publish`.

## Running unit tests

Run `ng test shared` to execute the unit tests via [Jest](https://jestjs.io/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
