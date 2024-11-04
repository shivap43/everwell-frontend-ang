# Core

The `CoreModule` contains code that will be used to instantiate **every** Montoya application portal and load some core functionality. The `CoreModule`, by convention, is only included only once for any given application and should **only** be imported in the `AppModule`.

> Note: Please be very careful about editing any dependencies within this library, since this module will be eagerly loaded into **all** Montoya portals. Any PR that edits this library should include a screenshot of affected libraries by running `yarn affected:dep-graph --base=origin/develop`

## What to include / exclude

- ✅ **Global Services** that need to be singletons in _every_ application portal (e.g. an HTTP service).
- ✅ **Third-Party Modules** that need to be available to _every_ application portal.
- ✅ **Important single use components/classes** that go in _every_ `AppComponent` (e.g. `HeaderComponent`).
- ⛔️ **Feature Module dependencies** should NOT be placed in this component. Instead, use the `SharedModule`.

> Note: Don't forget to add core components & third-party modules to the `exports` property of `CoreModule`'s `@NgModule()` decorator so that each `AppModule` can use it.

## Code scaffolding

Run `ng generate <YOUR_SCHEMATIC> --project core` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project core`.

> Note: Don't forget to add `--project core` or else it will be added to the default project in your `angular.json` file.

## Build

Run `ng build core` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build core`, go to the dist folder `cd dist/core` and run `npm publish`.

## Running unit tests

Run `ng test core` to execute the unit tests via [Jest](https://jestjs.io/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
