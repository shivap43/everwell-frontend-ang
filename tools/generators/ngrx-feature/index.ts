// source: https://angular.io/guide/schematics-authoring
import { chain, Rule, SchematicContext, apply, Tree, url, mergeWith, applyTemplates, move } from "@angular-devkit/schematics";
import { formatFiles } from "@nrwl/workspace";
import { strings, normalize } from "@angular-devkit/core";

import { updateNGRXAppState } from "./update-ngrx-app-state";
import { updateNGRXStoreModule } from "./update-ngrx-store-module";
import { updateClientAppModule } from "./update-client-app-module";
import { Schema } from "./schema.type";

// source: https://nx.dev/latest/angular/guides/nx-devkit-angular-devkit
const createNGRXStoreFeatureFiles =
    (schema: Schema): Rule =>
    async (host: Tree, context: SchematicContext) => {
        const templateSource = apply(url("./files/feature"), [
            applyTemplates({
                ...schema,
                ...strings,
            }),
            move(normalize("libs/ngrx-store/src/lib")),
        ]);

        context.logger.info("Creating feature boilerplate files for ngrx-store lib");

        return chain([mergeWith(templateSource)]);
    };

export default (schema: Schema): Rule => {
    const rules: Rule[] = [];

    // Skip Rules using schema arguments
    if (!schema.skipFeatureFiles) {
        rules.push(createNGRXStoreFeatureFiles(schema));
    }
    if (!schema.skipAppState) {
        rules.push(updateNGRXAppState(schema));
    }
    if (!schema.skipStoreModule) {
        rules.push(updateNGRXStoreModule(schema));
    }
    if (!schema.skipClient) {
        rules.push(updateClientAppModule(schema));
    }

    return chain([
        // Apply Rule changes
        ...rules,
        // Format any changed files
        formatFiles(schema),
    ]);
};
