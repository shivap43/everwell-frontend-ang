# Paginator UI Component

# Author: Rahul Sanap

# empowered-paginator is used to provide material pagination in the application,

# where it is capable of providing paginator for table and other data. Example is mentioned below.

`@Example`

1.Usage of Pagination in source component

```html
1.Usage of Observable data
<empowered-paginator [data$]="<SourceDataObservable$>"></empowered-paginator>
2.Usage of Static data
<empowered-paginator [data]="<data>"></empowered-paginator>
3.Usage of Observable data with custom item per page label
<empowered-paginator
    [data$]="<SourceDataObservable$>"
    [itemPerPageLabel]="<CustomText>"
></empowered-paginator>
4.Usage of Observable data with custom rangeLabel
<empowered-paginator
    [data$]="<SourceDataObservable$>"
    [itemPerPageLabel]="<CustomText>"
    [item]="<itemText>"
></empowered-paginator>
```

```ts
  `declare`
  @ViewChild(EmpoweredPaginatorComponent) matPaginator: EmpoweredPaginatorComponent;

  `define in ngAfterViewInit()`
  if(matPaginator)
  {
    this.dataSource.paginator = this.matPaginator;
    ...
  }
```

<empowered-paginator> is used to define paginator

`this.dataSource.paginator = event;`

> apply output emitted event to table's dataSource paginator in order to work with thr global Paginator component.

> `NOTE`: In above example replace all angle bracket `<` text with your observable.

> `@param`
> data\$ Input Data observable from source component and type is unknown[]
> `@param`
> totalItems\$ observable of type number used to calculate total number of item in the data.
> `@param`
> pageNumberControl reference of form controller.
> `@param`
> totalPages\$ observable of type number used to calculate the number of pages
> `@param`
> pageSizeOption mat-paginator page size option e.g 15,25,50
> `@param`
> eventSubject\$ BehaviorSubject is used to set initial Subject value
> `@param`
> pageIndexSubject\$ BehaviorSubject is used to set PageIndex
> `@param`
> pageIndex\$ Observable used to provide MatPaginator
> `@param`
> destroy\$ to unsubscribe the subscriber, it is a subject of type boolean
> `@param`
> dataSubject\$ BehaviorSubject is used to set staticD
> `@param`
> itemPerPageLabel used to set custom item per page label
> `@param`
> item used to set custom range label Ex: 1-15 of 60 customers

# @see Example https://zeroheight.com/0ydh214/p/757917-pagination/b/892be4
