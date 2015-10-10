class TodoDataModel {
    public todoItems: Observable<ObservableArray<TodoItemViewModel>>;
    constructor() {
        this.todoItems = new Observable<ObservableArray<TodoItemViewModel>>();
        this.todoItems.value = new ObservableArray<TodoItemViewModel>();
        this.todoItems.value.push(new TodoItemViewModel(this, "Item 1"));
        this.todoItems.value.push(new TodoItemViewModel(this, "Item 2"));
        this.todoItems.value.push(new TodoItemViewModel(this, "Item 3"));
        this.todoItems.value.push(new TodoItemViewModel(this, "Item 4"));
    }
}

class TodoItemViewModel {
    public name: Observable<string>;
    public list: Observable<TodoDataModel>;
    constructor(list: TodoDataModel, name: string) {
        this.list = new Observable<TodoDataModel>(list);
        this.name = new Observable<string>(name);
    }
}
