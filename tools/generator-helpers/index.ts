import { Tree, SchematicsException, SchematicContext } from "@angular-devkit/schematics";
import { virtualFs } from "@angular-devkit/core";

export const getFileAsString = (host: Tree, context: SchematicContext, pathFromRoot: string): string => {
    const buffer = host.read(pathFromRoot);

    if (!buffer) {
        context.logger.error(`File was not found at ${pathFromRoot}`);
        throw new SchematicsException("File not found.");
    }

    return virtualFs.fileBufferToString(buffer);
};
