import { Rule, SchematicContext, Tree, SchematicsException } from "@angular-devkit/schematics";
import { strings } from "@angular-devkit/core";
import { getFileAsString } from "../../generator-helpers";

const CLIENT_APP_MODULE_PATH = `apps/client/src/app/app.module.ts`;

const getFileForUpdatedImports = (featureName: string, file: string): string => {
    // Find reducer imports
    const importsRegex = /(import\s+\*\s+as\s+from\S+\s+from[\S\s]+@empowered\/ngrx-store\S+\.reducer\S+\r?\n)/;

    if (!importsRegex.test(file)) {
        throw new SchematicsException(`${CLIENT_APP_MODULE_PATH} is missing reducer imports`);
    }

    // Add new feature store module import
    return file.replace(
        importsRegex,
        `$1import * as from${strings.classify(featureName)} from "@empowered/ngrx-store/${strings.dasherize(
            featureName,
        )}/${strings.dasherize(featureName)}.reducer";\n`,
    );
};

const getFileForUpdatedActionReducerMap = (featureName: string, file: string): string => {
    // Find ActionReducerMap
    const actionReducerMapRegex = /(ActionReducerMap(<\S*>)?\s=\s{[\s\S]+from\S+\.reducer\s*?,?)([\s\S]+?})/;

    if (!actionReducerMapRegex.test(file)) {
        throw new SchematicsException(`${CLIENT_APP_MODULE_PATH} is missing ActionReducerMap`);
    }

    // Add new feature reducer placeholder to ActionReducerMap
    let temp = file.replace(actionReducerMapRegex, `$1__insert_reducer_property__$3`);

    // Check for trailing comma and add it if it is missing
    if (!/,\s*__insert_reducer_property__/.test(temp)) {
        temp = temp.replace(/(\S)(\s*__insert_reducer_property__)/, "$1,$2");
    }

    // Add new feature reducer to ActionReducerMap
    return temp.replace(
        "__insert_reducer_property__",
        `    ${strings.camelize(featureName)}: from${strings.classify(featureName)}.reducer,\n`,
    );
};

const getFileForUpdatedLocalStorageSync = (featureName: string, file: string): string => {
    // Find ActionReducerMap
    const keysPropertyRegex = /(localStorageSync\([\S\s]*keys:\s\[[\S\s]*?)(\][\S\s]*?\))/;

    if (!keysPropertyRegex.test(file)) {
        throw new SchematicsException(`${CLIENT_APP_MODULE_PATH} localStorageSync options argument is missing keys property`);
    }

    // Add new feature reducer placeholder to ActionReducerMap
    let temp = file.replace(keysPropertyRegex, `$1__insert_feature_name__$2`);

    // Check for trailing comma and add it if it is missing
    if (!/,\s*__insert_feature_name__/.test(temp)) {
        temp = temp.replace(/(\S)(\s*__insert_feature_name__)/, "$1,$2");
    }

    // Add new feature reducer to ActionReducerMap
    return temp.replace("__insert_feature_name__", `"${strings.camelize(featureName)}",\n`);
};

// source: https://nx.dev/latest/angular/generators/modifying-files
export const updateClientAppModule =
    (options: any): Rule =>
    async (host: Tree, context: SchematicContext) => {
        let file = getFileAsString(host, context, CLIENT_APP_MODULE_PATH);

        file = getFileForUpdatedImports(options.name, file);
        file = getFileForUpdatedActionReducerMap(options.name, file);
        file = getFileForUpdatedLocalStorageSync(options.name, file);

        host.overwrite(CLIENT_APP_MODULE_PATH, file);

        context.logger.info(`Updating ${CLIENT_APP_MODULE_PATH} to import new feature reducer to localStorageSync`);
    };
