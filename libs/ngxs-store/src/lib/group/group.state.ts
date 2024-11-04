import { GroupData } from "./group.models";
import { State, Action, StateContext, createSelector, Store, Selector } from "@ngxs/store";
import { UpdateGroupState } from "./group.actions";
import { ResetState } from "@empowered/user/state/actions";
import { Observable } from "rxjs";
import { ExpireActions, BaseAction } from "../requests";
import { Injectable } from "@angular/core";
import { DateService } from "@empowered/date";

// Number of groups that the application will concurrently cache
const CONCURRENT_GROUPS = 2;
const FIELD_GROUP_ID = "groupId";
@State<GroupData[]>({
    name: "GroupState",
    defaults: [],
})
@Injectable()
export class GroupState {
    constructor(private readonly store: Store, private readonly dateService: DateService) {}

    /**
     * Pull group data from the store based on the group id and field
     *
     * @param group Group id to be selected
     * @param actionType The type of action to pull the value from
     * @param defaultValue default value to be provided in the event of an undefined being returned
     * @returns Selector to pull the desired field, cast-able to a specific type
     */
    static getSliceField<T>(group: number, actionType: BaseAction, defaultValue?: T): (state: GroupData[]) => T {
        return createSelector([GroupState], (state: GroupData[]) => {
            const groupData: GroupData = state.find((groupSliceData) => groupSliceData.groupId === group);
            if (groupData && groupData[actionType.type]) {
                return groupData[actionType.type];
            }

            return defaultValue ? defaultValue : undefined;
        });
    }

    /**
     * Selector to get the current groups with data stored in memory
     *
     * @param state the current state
     * @returns The list of group ids currently in memory
     */
    @Selector()
    static getCurrentGroups(state: GroupData[]): number[] {
        return state.map((sliceData) => sliceData.group);
    }

    /**
     * Resets this slice, removing all data for all groups
     *
     * @param context The context for the current state
     */
    @Action(ResetState)
    resetState(context: StateContext<GroupData[]>): void {
        context.setState([]);
    }

    /**
     * Add a field to the store under a specific slice for a group
     *
     * @param context The context for the current state
     * @param param1 The action with the value and details on where to put it
     */
    @Action(UpdateGroupState)
    updateGroupState(context: StateContext<GroupData[]>, { groupId, actionType, fieldValue }: UpdateGroupState): Observable<void> | void {
        const groupData: GroupData = context.getState().find((groupSlice) => groupSlice.groupId === groupId);

        // Group exists
        if (groupData) {
            // Spread the object to remove the readonly, and update the lastUpdated and the target data
            const updatedGroup: GroupData = { ...groupData };
            updatedGroup.lastUpdated = new Date();
            updatedGroup[actionType.type] = fieldValue;

            context.setState([...context.getState().filter((groupSliceData) => groupSliceData.groupId !== groupId), updatedGroup]);
        } else {
            // Group is new, add the new group and field
            const currentValues: any[] = [...context.getState()]
                .sort((first, second) =>
                    this.dateService.toDate(first.lastUpdated) > this.dateService.toDate(second.lastUpdated) ? -1 : 1,
                )
                .slice(0, CONCURRENT_GROUPS <= context.getState().length ? CONCURRENT_GROUPS : context.getState().length);
            context.setState([
                ...currentValues,
                {
                    groupId: groupId,
                    lastUpdated: new Date(),
                    [actionType.type]: fieldValue,
                } as GroupData,
            ]);
            const activeGroups: number[] = context.getState().map((activeGroup) => activeGroup.groupId);
            return context.dispatch(
                new ExpireActions(
                    (storedAction) => !(FIELD_GROUP_ID in storedAction) || activeGroups.indexOf(storedAction[FIELD_GROUP_ID]) !== -1,
                ),
            );
        }
    }
}
