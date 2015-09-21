class TodoAddItem extends Component {
    public addClicked(args: any) {
        var todoName = (<HTMLInputElement>this.shadowRoot.querySelector("input")).value;
        var todoItem = new TodoItem(todoName);
        (<ObservableArray<TodoItem>>this.dataContext.value).push(todoItem);
    }
}

Component.register("todo-add-item", TodoAddItem);
