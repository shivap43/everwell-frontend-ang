/**
 * Meta data model to keep track of groups slices stored in the state
 */
export interface GroupMetaData {
    // The ID of the group
    groupId: number;
    // The date time when any group field was last updated
    lastUpdated: Date;
}

/**
 * Slice data that is stored in the state
 */
export interface GroupActionData {
    [actionType: string]: any;
}

/**
 * Union the two different types, combining the meta data with the slices in the object.
 * This is a hack to get around anonymous fields not being allowed to be declared along
 * non-anonymous fields.
 */
export type GroupData = GroupMetaData & GroupActionData;
