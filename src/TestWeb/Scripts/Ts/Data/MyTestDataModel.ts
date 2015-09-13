class MyTestDataModel {
    public poop: Observable<string>;
    public poops: Observable<ObservableArray<MyTestDataModelListItem>>;
    constructor() {
        this.poop = new Observable<string>("It works!");
        this.poops = new Observable<ObservableArray<MyTestDataModelListItem>>();
        this.poops.value = new ObservableArray<MyTestDataModelListItem>();
        this.poops.value.push(new MyTestDataModelListItem("This"));
        this.poops.value.push(new MyTestDataModelListItem("List"));
        this.poops.value.push(new MyTestDataModelListItem("Is"));
        this.poops.value.push(new MyTestDataModelListItem("Working"));
    }
}

class MyTestDataModelListItem {
    public name: Observable<string>;
    constructor(name: string) {
        this.name = new Observable<string>(name);
    }
}