import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import { SearchProducer } from "@empowered/api";
import { ProdData, OverlayOpen, Admin } from "@empowered/constants";

@Injectable({
    providedIn: "root",
})
export class AccountsService {
    private prodNameSource$ = new BehaviorSubject<ProdData>({
        producerName: "",
        filterByProducer: "",
        producerIdFilter: [],
    });
    private closeExpandedOverlay$ = new BehaviorSubject<OverlayOpen>({
        isOpen: false,
    });

    /**
     * Behavior Subject to check if any producer is searched or not
     */
    private readonly isAnyAccountViewed$ = new BehaviorSubject<boolean>(false);
    isAnyAccViewed = this.isAnyAccountViewed$.asObservable();
    /**
     * Behavior Subject to show/ hide the producer filter based on the subordinates of the searched producer
     */
    private readonly showProducerFilter$ = new BehaviorSubject<boolean>(true);
    isProducerFilter = this.showProducerFilter$.asObservable();
    /**
     * Behavior Subject to change prospect list on change of searched producer
     */
    private readonly searchedProducerForProspect$ = new BehaviorSubject<SearchProducer>(null);
    producerForProspect$ = this.searchedProducerForProspect$.asObservable();

    currentProducer = this.prodNameSource$.asObservable();
    expandedOverlay = this.closeExpandedOverlay$.asObservable();
    /**
     * Behavior Subject to change prospect list on removing prospect
     */
    private readonly resetProspect$ = new BehaviorSubject<boolean>(false);
    private readonly resetProspectAccounts$ = this.resetProspect$.asObservable();
    producerSearchList: any;
    wnOfProducer: any;

    constructor() {}
    /**
     * fetch employee status
     * @returns observable of boolean if prospect is removed or not
     */
    getProspectAccountResetStatus(): Observable<boolean> {
        return this.resetProspectAccounts$;
    }
    /**
     * change the selected filter for producer
     * * @param prod producer filter data
     */
    changeSelectedProducer(prod: ProdData): void {
        this.prodNameSource$.next(prod);
    }
    /**
     * close the overlay for producer filter
     * @param isExpanded represents the open/ closed status of producer filter
     */
    closeExpandedOverlayProducer(isExpanded: OverlayOpen): void {
        this.closeExpandedOverlay$.next(isExpanded);
    }
    /**
     * set the search list based on the the response of producerSearch API
     * @param producerSearchList the response of producerSearch API
     */
    setProductSearchList(producerSearchList: any): void {
        this.producerSearchList = producerSearchList;
    }
    /**
     * get the accounts list based on the search
     * @returns the searched producer list
     */
    getproducerSearchList(): any {
        return this.producerSearchList;
    }
    /**
     * setter for writing numbers
     * @param writingNumber the data of the producer
     */
    setWritingNumberOfProducer(writingNumber: Admin): void {
        this.wnOfProducer = writingNumber;
    }
    /**
     * getter for writing numbers
     * @return Returns data of the producer
     */
    getWritingNumberOfProducer(): Admin {
        return this.wnOfProducer;
    }
    /**
     * set to true when any producer is searched
     * @param isViewed the boolean value for any producer searched or not
     */
    setAnyProducerViewed(isViewed: boolean): void {
        this.isAnyAccountViewed$.next(isViewed);
    }
    /**
     * set to show/ hide the  producer filter based on the subordinates
     * @param show the boolean value to show/ hide the producer filter
     */
    viewProducerFilter(show: boolean): void {
        this.showProducerFilter$.next(show);
    }

    /**
     * Set the changed producer to get prospect list
     * @param producer the producer to be set as current producer
     */
    setProducerForProspectList(producer: SearchProducer): void {
        return this.searchedProducerForProspect$.next(producer);
    }
    /**
     * Set the status to reset prospects tab
     * @param isRefreshed boolean value to check if prospect list is refreshed
     */
    updateResetProspect$(isRefreshed: boolean): void {
        this.resetProspect$.next(isRefreshed);
    }
}
