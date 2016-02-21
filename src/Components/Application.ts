class Application extends Component {
    public static instance;

    public createdCallback() {
        super.createdCallback();
        Application.instance = this;
    }
}

Component.register("ui-application", Application);
