# Montoya Shared Styles

This directory serves as a shared location for all globally shared stylesheets with the repository.

## Architecture Overview – Montoya's "5-1 Pattern"

<img src="https://d33wubrfki0l68.cloudfront.net/83050df0f35e960a4fc2bb0b0f8df68ee25ab80a/d4b00/assets/images/sass-wallpaper_small.jpg" alt="One file to rule them all, one file to bind them. One file to bring them all, and in the Sass way merge them."/>

This project uses a modified version of the common ["7-1 Pattern"](https://sass-guidelin.es/#the-7-1-pattern), which separates Sass partial files into **seven** categories that are merged using a **one** main entry file. However, the default "7-1 Pattern" includes three categories – components, layout, and pages – that should **NOT** be shared within the Angular framework.

For the sake of scalability and easy maintenance, the Angular Style Guide encourages us to apply the [single responsibility principle (SRP)](https://angular.io/guide/styleguide#single-responsibility) to all parts of our application. Following this rule, our _component-specific_ Sass files reside next to their corresponding TypeScript class definitions and their HTML templates.

```shell
# EXAMPLE: The folder structure below could be applied to *both* NX libs and app-specific submodules…
sample-feature/
|– sample-feature.module.ts
|– sample-feature.routes.ts
|
|– some-page/
|    |– some-page.component.ts
|    |– some-page.component.html
|    |– some-page.component.scss    # No need for "page" or "layout" shared partials. SRP has us narrowly apply those styles here…
|
|– some-widget/
|    |– some-widget.component.ts
|    |– some-widget.component.html
|    |– some-widget.component.scss  # Similarly, "component" styles should *never* be shared. Instead, we use Angular ViewEncapsulation…
|…
```

The sections below will define our **"5-1 Principal"** in greater detail…

### MAIN ENTRY FILE

Every Angular application generated via schematics + NG CLI (i.e. `ng g app sample-application`) comes with a default entry point for application global styles. This file – `styles.scss` – is found within the project root directory…

```shell
apps/
|
|– sample-application/
|    |– src/
|        |– app/
|        |– assets/
|        |– environments/
|        |– index.html      # Default page that loads the <app-root> tag…
|        |– main.ts         # Application bootstrapping begins here…
|        |– styles.scss     # Entry point for all global styling within the application…
|
|…
```

We use the root `styles.scss` file to govern exactly which styles should be applied to a given application. For more information on how Angular applies CSS styling, please refer to their [official docs](https://angular.io/guide/component-styles#component-styles).

> NOTE: This file should **not** contain anything but `@import` statements and comments.

Sass partials imported into this file should be organized according to the folder they live in, one after the other in the following order:

1. `utilities/`
2. `vendors/`
3. `base/`
4. `apps/`
5. `themes/`

Finally, the main file should respect the following rules in order to preserve readability:

-   Use only `@import` statement per **folder**.
-   Each`@import` should be on its own line.
-   Imports from the same folder should be grouped _without_ any empty line-breaks in between.
-   Add a new line after the last import from a folder group.
-   Omit file extensions and leading underscores.

### UTILITIES FOLDER

The `utilities/` folder gathers all Sass tools and helpers used across the project. Every global variable, function, mixin and placeholder should be put in here.

The rule of thumb for this folder is that it should not output a single line of CSS when compiled on its own. These are nothing but Sass helpers.

-   `_functions.scss`
-   `_variables.scss`
-   `_mixins.scss`
-   `_placeholders.scss`

> NOTE: When working on a very large project with a lot of abstract utilities, it might be interesting to group them by topic rather than type, for instance typography (`_typography.scss`), theming (`_theming.scss`), etc. Each file contains all the related helpers: variables, functions, mixins and placeholders. Doing so can make the code easier to browse and maintain, especially when files are getting very long.

### BASE FOLDER

The `base/` folder holds what we might call the boilerplate code for the project. In there, you might find the reset file, some typographic rules, and probably a stylesheet defining some standard styles for commonly used HTML elements.

-   `_base.scss`
-   `_reset.scss`
-   `_typography.scss`

> NOTE: If your project uses a lot of CSS animations, you might consider adding a `_animations.scss` file in there containing the `@keyframes` definitions of all your animations. If you only use a them sporadically, let them live along the selectors that use them.

### VENDORS FOLDER

The `vendors/` folder contains all the CSS files from external libraries and frameworks – Bootstrap, Angular Material, and so on. Putting those aside in the same folder is a good way to say _“Hey, this is not from me, not my code, not my responsibility”_.

-   `_bootstrap.scss`
-   `_material.scss`

These files will all contain the imports to their respective NPM packages at the top of each file. Any overrides will then be added below. If these files become large and unwieldy, they can be refactored into sub-directories with partials that are all referenced via the primary `_vendor.scss` file.

### APPS FOLDER

The `apps/` folder contains app-specific styles that can amend or override any of the global styles above. These styles will be applied by default to any component loaded by a given application.

### THEMES FOLDER

> **NOTE: Architectural decisions for theming have NOT been finalized.**

Project Montoya will support minimal theming across different parts of each application. While much of this will be dynamically handled via services, directives, and so on, we might need a central location to share these style rules. For now, this directory exists for shared theming rules until a final solution has been approved…

-   `_theme.scss` – Default theming rules
-   `_aflac.scss` – Client specific styling

## Importing Shared Styles

Now that we have defined the structure of our shared styling, we need to be able to easily import those rules in our components, regardless of their location. To do this, we use the Angular Workspace Configuration found in `/angular.json`.

Regardless of which component we style, or its location in our codebase, we want to keep our Sass imports as short as possible…

```sass
// BAD - We want to prevent imports like…
@import "../../../../../../../libs/shared/src/lib/scss/abstracts/variables"

// GOOD – Short, sweet, and clear…
@import "abstracts/variables"
```

To do this, we need to tell Angular (more specifically, the Webpack bundle used by NG cli) where our shared Sass files live. Therefore, we include the path `libs/shared/src/lib/scss` within the `"stylePreprocessorOptions"` property of each application's "project configuration". Now any time NG cli bundles our application via `ng serve` or `ng build`, the shared files get treated as if they exist in our application root directory. This allows us to keep import statements for any given component as short and sweet as possible (i.e. `@import "utilities/_variables";`).

```json5
// angular.json
{
    $schema: "./node_modules/@angular/cli/lib/config/schema.json",
    version: 1,
    newProjectRoot: "",
    projects: {
        "some-application": {
            root: "apps/some-application/",
            sourceRoot: "apps/some-application/src",
            projectType: "application",
            prefix: "empowered",
            // Some configuration settings have been elided for clarity…
            schematics: {
                // …
            },
            architect: {
                build: {
                    builder: "@angular-devkit/build-angular:browser",
                    options: {
                        // "styles" = Path to our *main entry* file within the application.
                        styles: ["apps/admin-portal/src/styles.scss"],
                        // "stylePreprocessorOptions" = Options passed to Webpack bundler
                        // "includePaths" = Array of directory paths **outside** of the application root that we want "sass-loader" to include when our app is compiled…
                        stylePreprocessorOptions: {
                            includePaths: ["libs/shared/src/lib/scss"],
                        },
                        // …
                    },
                    // …
                },
                serve: {
                    // …
                },
                "extract-i18n": {
                    // …
                },
                lint: {
                    // …
                },
                test: {
                    // …
                },
            },
        },
    },
}
```
