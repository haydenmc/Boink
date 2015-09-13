/// <reference path="Component.ts" />

class Application extends Component {
    public static instance;

    public createdCallback() {
        super.createdCallback();
        Application.instance = this;
        this._dataContext.value = new MyTestDataModel();
    }
}

Component.register("ui-application", Application);