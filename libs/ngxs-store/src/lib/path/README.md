# Path Variable Dereferencer

### Author: Tim Nowaczewski

To start dereferencing a path parameter ID and storing the object into the store, add the variable name and how to get the associated object to the map `valueProducers` in `PathState` (`path.state.ts`)

Example:

```
valueProducers: Map<string, (id: string) => Observable<any>> = new Map()
        .set("mpGroupId", id => this.accountService.getAccount(id));
```

To get a value for a path variable, use the following selector:

```
@Select(PathState.getPathParameter("VARIABLE_NAME")) variable$: Observable<any>;
```

Where `VARIABLE_NAME` is as the variable appears in the route definition.

##### NOTE: The return type `any` can match the predicate in the `valueProducers` map.

Example:

```
@Select(PathState.getPathParameter("mpGroupId")) mpGroupIds$: Observable<Accounts>;
```
