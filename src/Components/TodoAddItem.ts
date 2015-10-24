class TodoAddItem extends Component {
    public addClicked(args: any) {
        var dataModel = (<TodoDataModel>this.dataContext.value);
        var todoName = (<HTMLInputElement>this.shadowRoot.querySelector("input")).value;
        var todoItem = new TodoItemViewModel(dataModel, todoName);
        dataModel.todoItems.value.push(todoItem);
        (<HTMLInputElement>this.shadowRoot.querySelector("input")).value = "";
    }
}

Component.register("todo-add-item", TodoAddItem);
