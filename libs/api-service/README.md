# ApiService

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.2.0.

The `ApiServiceModule` contains code that will be used across all Montoya application portals _and_ Feature Modules related to Account profile. You **SHOULD NOT** import the `ApiServiceModule` into any of the main `AppModule`s or the `CoreModule`.

The `ApiServiceModule`should only use as a service layer for the `ApiModule` and no other services

In `ApiServiceModule`, We should have one business service file for each service. It depends on common function to be used between Two or more components, If it's not then no need to create business service file for all services.

> Note: Please be very careful about editing any dependencies within this library, since this `ApiServiceModule` module will be shared across multiple feature modules. Any PR that edits this library should include a screenshot of affected libraries by running `yarn affected:dep-graph --base=origin/develop`

## Using services from other components

The most common way to get a hold of ApiService services is through Angular dependency injection, rather than through the module system (importing a module will result in a new service instance, which is not a typical usage).

## Code scaffolding

Run `ng generate component component-name --project api-service` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project api-service`.

> Note: Don't forget to add `--project api-service` or else it will be added to the default project in your `angular.json` file.

## Build

Run `ng build api-service` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build api-service`, go to the dist folder `cd dist/api-service` and run `npm publish`.

## Running unit tests

Run `ng test api-service` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
