import { Rule, SchematicContext, Tree, SchematicsException } from "@angular-devkit/schematics";
import { strings } from "@angular-devkit/core";
import { getFileAsString } from "../../generator-helpers";

const STORE_MODULE_PATH = `libs/ngrx-store/src/lib/store.module.ts`;

const getFileForUpdatedImports = (featureName: string, file: string): string => {
    // Find store module imports
    const importsRegex = /(import[\s\S]*from.+.store.module.+\r?\n)/;

    if (!importsRegex.test(file)) {
        throw new SchematicsException(`${STORE_MODULE_PATH} is missing imports`);
    }

    // Add new feature store module import
    return file.replace(
        importsRegex,
        `$1import { ${strings.classify(featureName)}StoreModule } from "./${strings.dasherize(featureName)}/${strings.dasherize(
            featureName,
        )}.store.module";\n`,
    );
};

const getFileForUpdatedNgModuleImports = (featureName: string, file: string): string => {
    // Find AppStoreModule NgModule.imports
    const ngModuleImportsRegex =
        /(@NgModule[\s\S]*imports\s*:\s*\[[\s\S]*)(StoreModule\s*?,?\r?\n?)([\s\S]*?\][\s\S]*export\s+class\s+AppStoreModule)/;

    if (!ngModuleImportsRegex.test(file)) {
        throw new SchematicsException(`${STORE_MODULE_PATH} is missing AppStoreModule NgModule.imports`);
    }

    // Add new feature store module placeholder to AppStoreModule NgModule.imports
    let temp = file.replace(ngModuleImportsRegex, `$1$2__insert_feature_store_module__$3`);

    // Check for trailing comma and add it if it is missing
    if (!/,\s*__insert_feature_store_module__/.test(temp)) {
        temp = temp.replace(/(\S)(\s*__insert_feature_store_module__)/, "$1,$2");
    }

    // Add new feature store module to AppStoreModule NgModule.imports
    return temp.replace("__insert_feature_store_module__", `        ${strings.classify(featureName)}StoreModule,\n`);
};

// source: https://nx.dev/latest/angular/generators/modifying-files
export const updateNGRXStoreModule =
    (options: any): Rule =>
    async (host: Tree, context: SchematicContext) => {
        let file = getFileAsString(host, context, STORE_MODULE_PATH);

        file = getFileForUpdatedImports(options.name, file);
        file = getFileForUpdatedNgModuleImports(options.name, file);

        host.overwrite(STORE_MODULE_PATH, file);

        context.logger.info(`Updating ${STORE_MODULE_PATH} to include new feature store module`);
    };
