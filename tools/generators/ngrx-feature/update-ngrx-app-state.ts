import { Rule, SchematicContext, Tree, SchematicsException } from "@angular-devkit/schematics";
import { strings } from "@angular-devkit/core";
import { getFileAsString } from "../../generator-helpers";

const APP_STATE_PATH = `libs/ngrx-store/src/lib/app.state.ts`;

const getFileForUpdatedImports = (featureName: string, file: string): string => {
    // Find imports
    const importsRegex = /(import[\s\S]*from.+\r?\n)/;

    if (!importsRegex.test(file)) {
        throw new SchematicsException(`${APP_STATE_PATH} is missing store module imports`);
    }

    // Add new feature import
    return file.replace(importsRegex, `$1import { ${strings.classify(featureName)}State } from "./${strings.dasherize(featureName)}";\n`);
};

const getFileForUpdatedInterface = (featureName: string, file: string): string => {
    // Find State interface
    const stateInterfaceRegex = /(export\s+interface\s+State\s+{[\s\S]*)(})/;

    if (!stateInterfaceRegex.test(file)) {
        throw new SchematicsException(`${APP_STATE_PATH} is missing State interface`);
    }

    // Add new feature to interface
    return file.replace(stateInterfaceRegex, `$1    ${strings.camelize(featureName)}: ${strings.classify(featureName)}State.State;\n$2`);
};

// source: https://nx.dev/latest/angular/generators/modifying-files
export const updateNGRXAppState =
    (options: any): Rule =>
    async (host: Tree, context: SchematicContext) => {
        let file = getFileAsString(host, context, APP_STATE_PATH);

        file = getFileForUpdatedImports(options.name, file);
        file = getFileForUpdatedInterface(options.name, file);

        host.overwrite(APP_STATE_PATH, file);

        context.logger.info(`Updating ${APP_STATE_PATH} to include new feature state`);
    };
