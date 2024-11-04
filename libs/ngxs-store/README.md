# ngxs-store

This library is responsible for dealing with all NGXS-related state.

Functions may use `NGXS` but no other state management libraries (such as `NGRX`). The goal of this lib is to remove the `NGXS` import outside of this lib so that `NGXS` can be fully isolated as its own dependency and eventually be removed from the project.

## Dealing With Import Paths

During the migration process, many import paths will have to be updated

> **IMPORTANT NOTE!!!**

**DO NOT ATTEMPT STEP 12 WITHOUT FULLY UNDERSTANDING HOW THESE TYPES OF PATH WORK AND HOW THEY AFFECT THE MIGRATION PROCESS**

If you do not follow this process carefully, you will run into a silent error which will make debugging almost impossible. This process is very long and could end up being a complete waste of time.

### There are 3 types of import paths:

1. Relative paths:
    ```typescript
    import { Thing } from `../../this/is/a/relative/path`;
    ```
2. Absolute paths:
    ```typescript
    // This is an absolute path, a path from the root of the project
    import { Thing } from `libs/enrollment/src/lib/quote-shop/services/thing.service.ts`;
    ```
3. Alias paths:
    ```typescript
    // This is an alias path, it is listed in `tsconfig.json` found at root. Commonly is prefixed by @ project name. This project's name is "empowered"
    import { Thing } from `@empowered/enrollment`;
    ```

### Nx best practices

`Nx` has a common practice for how paths should be used:

1. **Never** use absolute paths (instead use an alias path defined in `tsconfig.json` found at root)
2. When importing outside of an app or lib (from another lib), **always** use an alias path defined in `tsconfig.json` found at root
3. When importing within an app or lib, **always** use a relative path

> These are great best practices, but to **avoid running into issues with the existing circular dependencies of this project. You will have to break best practice in some situations**.

### How to choose the right import path type

When migrating `NGXS` feature state to `ngxs-store`, there will be 2 situations when updating an import path:

1. Updating the path **within the lib** that the feature state came from

2. Updating a path **outside of the lib** that the feature state came from

In the documented migration process below, we are migrating from the `enrollment` lib.

1. When updating an import path within the lib you are migrating from: Always use the alias path: `@empowered/ngxs-store`

2. When updating an import path outside of the lib you are migrating from: Always use the same kind of path.
    1. If the path used to be a relative path, use a relative path
        ```typescript
        // Old
        import { Thing } from "../../../../enrollment/src/lib/+state/enrollment.state.ts";
        // New
        import { Thing } from "../../../../ngxs-store/src/lib/enrollment/enrollment.state.ts";
        ```
    2. If the path used to be an absolute path, use an absolute path
        ```typescript
        // Old
        import { Thing } from "libs/enrollment/src/lib/+state/enrollment.state.ts";
        // New
        import { Thing } from "libs/ngxs-store/src/lib/enrollment/enrollment.state.ts";
        ```
    3. If the path used to be an alias path, use an alias path
        ```typescript
        // Old
        import { Thing } from "@empowered/enrollment";
        // New
        import { Thing } from "@empowered/ngxs-store";
        ```

This is important because the project currently has a major circular dependency issue between almost all libraries. Failing to follow these guidelines can result in build, serve, test npm scripts not working and having no error to debug. You will likely have to start over.

## Migration Process

### 1. Target NGXS state, model, action directory outside of `ngxs-store` lib:

These directories are typically named `+state`

`libs/enrollment/src/lib/+state/enrollment.action.ts`

`libs/enrollment/src/lib/+state/enrollment.model.ts`

`libs/enrollment/src/lib/+state/enrollment.state.ts`

### 2. Copy these files to `ngxs-store` lib:

`libs/ngxs-store/src/lib/enrollment/enrollment.action.ts`

`libs/ngxs-store/src/lib/enrollment/enrollment.model.ts`

`libs/ngxs-store/src/lib/enrollment/enrollment.state.ts`

### 3. Create NgModule for migrated NGXS feature state:

Since we are migrating the `enrollment` NGXS feature state, the module should be named:

`enrollment.ngxs-store.module.ts`

and it should live with the action, model, state files:

`libs/ngxs-store/src/lib/enrollment/enrollment.ngxs-store.module.ts`

its content should be:

```typescript
import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { EnrollmentState } from "./enrollment.state"; // <-- migrated state

@NgModule({
    imports: [NgxsModule.forFeature([EnrollmentState])], // <-- import feature
})
export class EnrollmentNGXSStoreModule {} // <-- named after the feature state
```

### 4. Create barrel export file (`index.ts`):

`libs/ngxs-store/src/lib/enrollment/index.ts`

It should have the follow to export everything from the action, model, state files:

```typescript
export * from "./enrollment.action";
export * from "./enrollment.model";
export * from "./enrollment.state";
export * from "./enrollment.ngxs-store.module";
```

### 5. Copy any dependencies such as `Services` that belong to the lib these `NGXS` files come from:

`enrollment.action.ts`, `enrollment.model.ts`, `enrollment.state.ts` came from the `enrollment` lib.

`enrollment.state.ts` imports `QuoteShopHelperService` found at `libs/ngxs-store/src/lib/services/quote-shop-helper/quote-shop-helper.service.ts`.

> _PRO TIP: One way to quickly identify these dependencies is to check all imports and target any imports that use a relative path. This normally implies that this import comes from the same lib in `Nx`._

To avoid a circular dependency, this `Service` must be migrated to `ngxs-store` lib:

Copy `QuoteShopHelperService` to `services` directory:

from `libs/enrollment/src/lib/quote-shop-mpp/services/quote-shop-helper.service.ts`

to `libs/ngxs-store/src/lib/services/app-flow/quote-shop-helper.service.ts`

Repeat for all dependencies for the `*.action.ts`, `*.model.ts`, `*.state.ts` files.

> _Alternative would be to remove the dependency all together if possible. This will likely not be plausible without a lot of refactor, but would be the best workaround._

### 6. Update all import paths affected with copied files:

For `enrollment.state.ts`,

`import { QuoteShopHelperService } from "../quote-shop-mpp/services/quote-shop-helper.service";`

becomes

`import { QuoteShopHelperService } from "../services/quote-shop-helper/quote-shop-helper.service";`

### 7. Repeat steps 4 and 5 for all nested dependencies:

`QuoteShopHelperService` imports `ShopCartService` which also comes from the `enrollment` lib. So this file must also be migrated to `ngxs-store` lib to avoid circular dependency.

Copy `ShopCartService` to `services` directory:

from `libs/enrollment/src/lib/quote-shop/services/shop-cart.service.ts`

to `libs/ngxs-store/src/lib/services/shop-cart/shop-cart.service.ts`

Repeat these steps for the dependencies of the nested dependencies and so on

### 8. Add NGXS Feature State to `NGXSStoreModule`:

```typescript
import { EnrollmentState } from "./enrollment";
// ...
@NgModule({
    imports: [
        CommonModule,
        NgxsModule.forFeature([
            // List of NGXS feature states
            // ...
            EnrollmentState, // <-- Add this
        ]),
    ],
})
export class NGXSStoreModule {}
```

### 9. Update previous import for NGXS feature:

This is case, the EnrollmentState gets imported at `libs/enrollment/src/lib/enrollment.module.ts` for the `enrollment` lib. These lines should be updated:

```typescript
import { NgxsModule } from "@ngxs/store"; // <-- Remove
import { EnrollmentState } from "./+state/enrollment.state"; // <-- Remove
import { EnrollmentNGXSStoreModule } from "@empowered/ngxs-store"; // <-- Add

@NgModule({
    imports: [
        CommonModule,
        NgxsModule.forFeature([EnrollmentState]), // <-- Remove
        EnrollmentNGXSStoreModule, // <-- Add
        // ...
    ],
    // ...
})
export class EnrollmentModule {}
```

### 10. Delete the original files that have been copied to the `ngxs-store` lib:

In this case, the files were:

`libs/enrollment/src/lib/+state/enrollment.action.ts`

`libs/enrollment/src/lib/+state/enrollment.model.ts`

`libs/enrollment/src/lib/+state/enrollment.state.ts`

`libs/ngxs-store/src/lib/services/app-flow/quote-shop-helper.service.ts`

`libs/enrollment/src/lib/quote-shop/services/shop-cart.service.ts`

`libs/enrollment/src/lib/application-flow-steps/services/app-flow.service.ts`

### 11. Remove previous lib barrel exports (index.ts)

Because these files are deleted, we need to also update the barrel export (`index.ts`)

In this case:

```typescript
export * from "./lib/enrollment.module";
export * from "./lib/quote-shop/quote-shop.module";
export * from "./lib/quote-shop-mpp/quote-shop-mpp.module";
export * from "./lib/shop-experience/shop-experience.module";
export * from "./lib/application-flow/application-flow.module";
export * from "./lib/benefit-summary/benefit-summary.module";
export * from "./lib/application-flow-steps/services/app-flow.service"; // <-- remove
export * from "./lib/+state/enrollment.state"; // <-- remove
export * from "./lib/+state/enrollment.action"; // <-- remove
export * from "./lib/+state/enrollment.model"; // <-- remove
export * from "./lib/application-flow-steps/confirmation/edelivery-prompt/edelivery-prompt.component";
```

### 12. Refactor the rest of the application to import from `ngxs-store` for these deleted files:

> **BE SURE TO REVIEW "How to choose the right import path type" ABOVE BEFORE CONTINUING**

Please review "How to choose the right import path type" before attempting the migration. These migrations can take up a lot of time and when the paths are altered, there is a risk of getting a **silent error** that makes building, serving, testing no longer work and debugging almost impossible.

Do perform this task, attempt to serve the application:

```bash
npm run start
```

Your terminal should have type errors, resolve each error until you can successfully serve the `client` application and interact with the application.

### 13. Once all paths are updated, make sure that build, test, serve work as expected:

This process is completed once there are no more NGXS state, model, action directories outside of `ngxs-store` lib.

Be sure that `npm run build`, `npm run start`, `npm run test` all work as expected by running them in your terminal.

### 14. Confirm that the NGXS state is functioning

To confirm that the NGXS feature state is functioning, you need to find out its state name. This can be found in the NGXS state file:

```typescript
@State<EnrollmentStateModel>({
    name: "enrollment", // <-- here
    defaults: defaultState,
})
@Injectable()
export class EnrollmentState {
    /*...*/
}
```

Knowing the `NGXS` state name, you can confirm the state is being updated properly in 2 ways:

1. Use the [Redux plugin](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd) to monitor that state is being updated properly

2. Inspect the `NGXS` store directly on the application:
    1. In your browser, inspect `empowered-root` element through the `Elements` tab of your browser debugger.
    2. Switch to the `Console` tab, and probe the `empowered-root` element for access to the `AppComponent` then subscribe to the `store` property and monitor the state:
    ```javascript
    ng.getComponent($0).store._stateStream.subscribe(console.log);
    ```

## Strict Mode

New libraries should have strict mode enabled in their `tsconfig.json` (which is the default when generating a new lib). This lib will **not have strict mode on** to make the migration easier.

Please do not attempt to turn strict mode on until unit tests become required and the migration process is complete.

## After Migration Process

Once the migration process completes. There are many paths to take. Ultimately `NGXS` will be removed as a dependency for this project. Logic where `NGXS` is used should be replated with state management coming from `ngrx-store` instead.

## Running Unit Tests

Run `nx test ngxs-store` to execute the unit tests. Note that there are no requirements to write tests for `ngxs-store` for now.
