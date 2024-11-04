# Constants

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.2.0.

This library is used for storing constants and enums that are being used across different modules. The legacy AppSettings file should no longer be used moving forward. If you need to add to something that has already existed in the constants folder (not in the AppSettings file), duplicate that into the constants library and add what you need in there. The idea is to eventually phase out the constants folder under shared. But remember, do not create constants/enums here if they are component-specific.

Before describing when to create constants and enums, one thing to note here is, if the value can change based on some configurable application setting/situation, please use a config from the database.

Ok, now comes to the fun part - when to create a constant file (under the consts folder) and when to create an enum file (under the enums folder):

1. If a group of constants loosely fit together, but this group does not have a stable finite set (for example, a group of strings that are commonly used across a few components, but there's no defined set that says which are the only strings in this group), then create a file under consts (see example file there).

2. If a group of constants belong to a stable finite set (for example, product ids, or carrier ids - things that can be listed out logically in a database table that lists out each item belonging to the schema - like the product table, or the role table; the list hardly changes over time), create a file under enums (see example file there).

Some general principles in naming constants:

1. Do not include the value of the constant in the name of the constant (or the key in the key/value pair within a collection.

2. Give the name (or key in key/value pair) a meaningful name per context. For example, instead of naming a constant FIRST_STEP, name it REVIEW_STEP, if that's what the step actually is. (Later, if the step ever move places, you won't have to change both the name/key and the value.)

## Code scaffolding

Run `ng generate component component-name --project constants` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project constants`.

> Note: Don't forget to add `--project constants` or else it will be added to the default project in your `angular.json` file.

## Build

Run `ng build constants` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build constants`, go to the dist folder `cd dist/constants` and run `npm publish`.

## Running unit tests

Run `ng test constants` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
