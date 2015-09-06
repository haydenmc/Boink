/// <reference path="Component.ts" />

class Application extends Component {
    public static instance;

    constructor() {
        super();
        Application.instance = this;
    }
}

Component.register("ui-application", Application);