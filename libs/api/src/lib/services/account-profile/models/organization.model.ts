export interface Organization {
    id?: number;
    parentId?: number;
    name: string;
    code?: string;
    default?: boolean;
}

/**
 * @deprecated This class isn't currently being used, we should remove it since its code is a little questionable
 */
export class OrganizationHelper implements Organization {
    id?: number;
    parentId?: number;
    name: string;
    code?: string;
    default?: boolean;

    constructor(org: Organization) {
        if (org) {
            this.id = org.id;
            this.parentId = org.parentId;
            this.name = org.name;
            this.code = org.code;
            this.default = org.default;
        }
        this.name = org?.name ?? "";
    }

    listOfChildren(childOrgs: Organization[], allOrgs: Organization[]): (number | undefined)[] {
        const childIds: (number | undefined)[] = [];

        for (const child of childOrgs) {
            childIds.push(child.id);

            const childrenOfChild = allOrgs.filter((organization: Organization) => organization.parentId === child.id);
            childIds.push(...this.listOfChildren(childrenOfChild, allOrgs));
        }

        return childIds;
    }
}
