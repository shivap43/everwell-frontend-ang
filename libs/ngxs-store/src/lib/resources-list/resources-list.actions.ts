/* eslint-disable max-classes-per-file */
export class LoadResources {
    static readonly type = "[ResourceList] Load Resources";
}

export class RemoveResource {
    static readonly type = "[ResourceList] removeResource";
    constructor(public resourceId: number) {}
}
