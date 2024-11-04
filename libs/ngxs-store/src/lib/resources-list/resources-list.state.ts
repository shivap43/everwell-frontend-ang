import { AccountService, Resource, CoreService, DocumentApiService, ShoppingService, BenefitsOfferingService } from "@empowered/api";
import { Action, Selector, State, StateContext, Store } from "@ngxs/store";
import { Observable, forkJoin } from "rxjs";
import { tap, take } from "rxjs/operators";
import { ResourcesListModel } from "./resources-list.model";
import { LoadResources, RemoveResource } from "./resources-list.actions";
import { patch } from "@ngxs/store/operators";
import { ResetState } from "@empowered/user/state/actions";
import { UserService } from "@empowered/user";
import { Injectable } from "@angular/core";

const defaultState: ResourcesListModel = {
    allResources: [],
    allCarriers: [],
    allProducts: [],
    allDocuments: [],
    allAudiences: [],
    allCategories: [],
    errorMessage: null,
};
@State<ResourcesListModel>({
    name: "resources",
    defaults: defaultState,
})
@Injectable()
export class ResourceListState {
    constructor(
        private accountService: AccountService,
        private coreService: CoreService,
        private documentService: DocumentApiService,
        private store: Store,
        private userService: UserService,
        private shoppingService: ShoppingService,
        private benefitOfferingService: BenefitsOfferingService,
    ) {}

    @Selector()
    static getResourceList(state: ResourcesListModel): Resource[] {
        return [...state.allResources];
    }

    @Selector()
    static getCarriersList(state: ResourcesListModel): any[] {
        return [...state.allCarriers];
    }

    @Selector()
    static getProductsList(state: ResourcesListModel): any[] {
        return [...state.allProducts];
    }

    @Selector()
    static getDocumentsList(state: ResourcesListModel): any[] {
        return [...state.allDocuments];
    }

    @Selector()
    static getAudienceGroupingsList(state: ResourcesListModel): any[] {
        return [...state.allAudiences];
    }

    @Selector()
    static getCategoriesList(state: ResourcesListModel): any[] {
        return [...state.allCategories];
    }

    @Action(ResetState)
    resetState(context: StateContext<ResourcesListModel>): void {
        context.setState(defaultState);
    }

    @Action(LoadResources)
    loadResources(context: StateContext<ResourcesListModel>, action: LoadResources): Observable<any | void> {
        const resourcesAPI = this.accountService.getResources().pipe(take(1));
        const productsAPI = this.shoppingService.getProductOfferings().pipe(take(1));
        const carriersAPI = this.benefitOfferingService.getBenefitOfferingCarriers(false).pipe(take(1));
        const documentAPI = this.documentService.getDocuments().pipe(take(1));
        const resourceCategoriesAPI = this.accountService.getResourceCategories().pipe(take(1));
        const audienceGroupingAPI = this.accountService.getAudienceGroupings().pipe(take(1));
        const mpp = [resourcesAPI, productsAPI, carriersAPI, documentAPI, resourceCategoriesAPI, audienceGroupingAPI];
        const mmp = [resourcesAPI, productsAPI, carriersAPI, documentAPI, resourceCategoriesAPI];
        let memberId = false;
        this.userService.credential$.subscribe((credential: any) => {
            if (credential.memberId) {
                memberId = true;
            }
        });
        return forkJoin(memberId ? mmp : mpp).pipe(
            tap((results) => {
                const [resources, products, carriers, documents, resourceCategories, audienceGroupings] = results;

                resources.forEach((resource: any) => {
                    const product = products.filter((p: any) => p.product.id === resource.productId);
                    if (product && product.length) {
                        resource.productName = product[0].product.name;
                    }
                    const carrier = carriers.filter((c: any) => c.id === resource.carrierId);
                    if (carrier && carrier.length) {
                        resource.carrierName = carrier[0].name;
                    }
                    const document = documents.filter((c: any) => c.id === resource.documentId);
                    if (document && document.length) {
                        resource.documentName = document[0].fileName;
                    }

                    resourceCategories.filter((c: any) => c.name === resource.category);

                    if (!memberId) {
                        audienceGroupings.filter((c: any) => c.id === resource.audienceGroupingId);
                    }
                });
                context.setState(
                    patch({
                        allResources: resources,
                        allCarriers: carriers,
                        allProducts: products,
                        allDocuments: documents,
                        allCategories: resourceCategories,
                        allAudiences: !memberId ? audienceGroupings : [],
                    }),
                );
            }),
        );
    }

    @Action(RemoveResource)
    removeResource(ctx: StateContext<Resource[]>, action: RemoveResource): Observable<Resource> {
        return this.accountService.removeResource(action.resourceId).pipe(
            tap(() => {
                this.store.dispatch(new LoadResources());
            }),
        );
    }
}
