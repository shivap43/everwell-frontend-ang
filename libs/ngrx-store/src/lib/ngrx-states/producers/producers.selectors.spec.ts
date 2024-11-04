import { ProducerInformation } from "@empowered/api";

import { AccountsState } from "../accounts";
import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "../accounts/accounts.reducer";
import { initialState, licensedStateSetsEntityAdapter, producerInformationsEntityAdapter } from "./producers.state";
import { ProducersPartialState, PRODUCERS_FEATURE_KEY } from "./producers.reducer";
import * as ProducersSelectors from "./producers.selectors";
import { AsyncStatus } from "@empowered/constants";

describe("Producers Selectors", () => {
    let state: ProducersPartialState & AccountsPartialState;

    beforeEach(() => {
        state = {
            [PRODUCERS_FEATURE_KEY]: {
                ...initialState,
                producerInformationsEntities: producerInformationsEntityAdapter.setOne(
                    {
                        identifiers: { producerId: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: { licenses: [], carrierAppointments: [] } as ProducerInformation,
                            error: null,
                        },
                    },
                    { ...initialState.producerInformationsEntities },
                ),
                licensedStateSetsEntities: licensedStateSetsEntityAdapter.setOne(
                    {
                        identifiers: { mpGroup: 222 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ abbreviation: "some abbr", name: "some name" }],
                            error: null,
                        },
                    },
                    { ...initialState.licensedStateSetsEntities },
                ),
                selectedProducerId: 111,
            },
            [ACCOUNTS_FEATURE_KEY]: {
                ...AccountsState.initialState,
                selectedMPGroup: 222,
            },
        };
    });

    describe("getSelectedProducerId", () => {
        it("should get selectedProducerId", () => {
            const result = ProducersSelectors.getSelectedProducerId(state);

            expect(result).toBe(111);
        });
    });

    describe("getProducerInformationsEntities", () => {
        it("should get ProducerInformation EntityState", () => {
            const result = ProducersSelectors.getProducerInformationsEntities(state);

            expect(result).toStrictEqual(state[PRODUCERS_FEATURE_KEY].producerInformationsEntities);
        });
    });

    describe("getSelectedProducerInformation", () => {
        it("should get IDLE AsyncData if no selected producerId", () => {
            const result = ProducersSelectors.getSelectedProducerInformation({
                ...state,
                [PRODUCERS_FEATURE_KEY]: { ...state[PRODUCERS_FEATURE_KEY], selectedProducerId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected ProducerInformation using producerId", () => {
            const result = ProducersSelectors.getSelectedProducerInformation(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: { licenses: [], carrierAppointments: [] } as ProducerInformation,
                error: null,
            });
        });
    });

    describe("getLicensedStateSetsEntities", () => {
        it("should get LicensedStateSets EntityState", () => {
            const result = ProducersSelectors.getLicensedStateSetsEntities(state);

            expect(result).toStrictEqual(state[PRODUCERS_FEATURE_KEY].licensedStateSetsEntities);
        });
    });

    describe("getSelectedLicensedStateSet", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = ProducersSelectors.getSelectedLicensedStateSet({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected ProducerInformation using producerId", () => {
            const result = ProducersSelectors.getSelectedLicensedStateSet(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ abbreviation: "some abbr", name: "some name" }],
                error: null,
            });
        });
    });
});
