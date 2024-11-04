import { Resource } from "@empowered/api";

export interface ResourcesListModel {
    allResources: Resource[];
    allCarriers: [];
    allProducts: [];
    allDocuments: [];
    allAudiences: [];
    allCategories: [];
    errorMessage: string;
}
