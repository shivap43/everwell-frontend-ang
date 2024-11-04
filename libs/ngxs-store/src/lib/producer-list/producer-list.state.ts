import { Action, State, StateContext, Selector } from "@ngxs/store";
import { ProducerList } from "./producer-list.model";
import { AddProducerList } from "./producer-list.action";
import { patch } from "@ngxs/store/operators";
import { SearchProducer } from "@empowered/api";
import { UtilService } from "../state-services/util.service";
import { Injectable } from "@angular/core";

const defaultState: ProducerList = {
    producerList: null,
};

@State<ProducerList>({
    name: "producers",
    defaults: defaultState,
})
@Injectable()
export class ProducerListState {
    constructor(private readonly utilService: UtilService) {}
    @Selector()
    static getProducerList(state: ProducerList): SearchProducer[] {
        return state.producerList;
    }

    @Action(AddProducerList)
    add(ctx: StateContext<ProducerList>, action: { payload: SearchProducer }): void {
        const state = ctx.getState();
        let producerList = state.producerList ? this.utilService.copy(state.producerList) : [];
        if (producerList && producerList.length > 0) {
            producerList = producerList.filter((prod) => prod.id !== action.payload.id);
        }
        producerList.push(action.payload);
        ctx.setState(
            patch({
                producerList: producerList,
            }),
        );
    }
}
