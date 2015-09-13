/// <reference path="Component.ts" />

class Application extends Component {
    public static instance;

    public createdCallback() {
        super.createdCallback();
        Application.instance = this;
        this._dataContext.value = { poop: new Observable<string>("Yay poop"), poops: null };
        this._dataContext.value.poops = new Observable<ObservableArray<string>>(new ObservableArray<string>());
        this._dataContext.value.poops.value.push("Hey!");
        this._dataContext.value.poops.value.push("Hello!");
    }
}

Component.register("ui-application", Application);