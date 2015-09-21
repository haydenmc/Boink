class TodoDataModel {
    public todoItems: Observable<ObservableArray<TodoItem>>;
    constructor() {
        this.todoItems = new Observable<ObservableArray<TodoItem>>();
        this.todoItems.value = new ObservableArray<TodoItem>();
        this.todoItems.value.push(new TodoItem("Item 1"));
        this.todoItems.value.push(new TodoItem("Item 2"));
        this.todoItems.value.push(new TodoItem("Item 3"));
        this.todoItems.value.push(new TodoItem("Item 4"));
    }
}

class TodoItem {
    public name: Observable<string>;
    constructor(name: string) {
        this.name = new Observable<string>(name);
    }
}
