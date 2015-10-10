class TodoItem extends Component {
    public removeClicked(): void {
        var itemVm = (this.dataContext.value as TodoItemViewModel);
        itemVm.list.value.todoItems.value.remove(itemVm);
    }
}

Component.register("todo-item", TodoItem);
