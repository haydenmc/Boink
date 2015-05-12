class Application {
    public start(): void {
        var test = new TestComponent();
        test.show();
    }
}

window.addEventListener("load",() => {
    new Application().start();
});