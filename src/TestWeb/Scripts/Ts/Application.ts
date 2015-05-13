class Application {
    public static test;
    public start(): void {
        Application.test = new TestComponent();
        Application.test.show();
    }
}

window.addEventListener("load",() => {
    new Application().start();
});