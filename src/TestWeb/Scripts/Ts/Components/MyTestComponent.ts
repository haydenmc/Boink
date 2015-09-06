/// <reference path="Component.ts" />

class MyTestComponent extends Component {
    constructor() {
        super();
    }
}

Component.register("ui-my-test-component", MyTestComponent);