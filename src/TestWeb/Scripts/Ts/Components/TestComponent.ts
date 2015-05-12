class TestComponent extends Component {
    public test: Observable<string> = new Observable<string>("hello world!");

    constructor() {
        super("Test");
    }
}