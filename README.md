# Client Portals

## Quick Start

Start by installing all dependencies…

```
npm install
```

Start a local development server:

```shell
# Option 1 = Vanilla Dev Server
npm run start

# Option 3 = Hot Module Replacement (optimized for seamless live-reload)
npm run start -- -c hmr

# Option 4 = Ahead-of-Time (ideal for testing module dependencies)
npm run start -- --aot
```

## Code scaffolding

TODO - Insert list of common commands and link to Angular Console

## Build

Run `nx build client` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

Angular 13 build cache is customized to store in node_modules to make pipelines pick it up without additional configuration. This can be updated in `nx.json`.

`.angular/cache` -> `node_modules/.cache/angular`

## Running unit tests

Run `npm run test` to execute the unit tests via [Jest](https://karma-runner.github.io).

jest cache is customized to store in node_modules to make pipelines pick it up without additional configuration. This can be updated in `jest.preset.js`.

`tmp/..` -> `node_modules/.cache/jest`

Run `npx nx test <lib name>` to test a specific lib

To test a specific spec file, download the Jest Runner vscode plugin to test local file

It is recommende to also install the Live Server vscode plugin to serve the coverage reports found in the `coverage` directory of the root of the project

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Cypress](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## NGRX

Project uses NGXS and NGRX. Overtime we would be migrating over to NGRX fully, but a large majority of the project uses NGXS still.

### Generate new feature using custom schematic

```bash
$ npx nx workspace-schematic ngrx-feature <feature>
```

Creates new NGRX feature for ngrx-store lib

1. Create feature boilerplate files (skip using `--skipFeatureFiles`)
2. Update ngrx-store lib to include new feature in NGRX State (skip using `--skipAppState`) and StoreModule (skip using `--skipStoreModule`)
3. Update client app to include new feature in NGRX reducers and hydration (skip using `--skipClient`)
