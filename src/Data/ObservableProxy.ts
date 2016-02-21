/**
 * An ObservableProxy routes Observable properties through conversion functions to modify the value.
 */
class ObservableProxy<T, U> implements IObservable<T> {
    /**
     * The IObservable class that this ObservableProxy acts as a proxy for.
     */
    private source: IObservable<U>;

    /**
     * The function that transforms values from the source Observable type to our own type.
     */
    private outgoing: (source: U) => T;

    /**
     * The function that transforms values from our own type to the source Observable type.
     * First parameter is the new value.
     * Second parameter is the current value of the base Observable.
     */
    private incoming: (source: T, value: U) => U;

    /**
     * Retrieves the value by running the appropriate conversion on the source Observable's value.
     */
    public get value(): T {
        return this.outgoing(this.source.value);
    }
    public set value(val: T) {
        this.source.value = this.incoming(val, this.source.value);
    }

    /**
     * Event to signal listeners when the value has changed.
     */
    public onValueChanged: EventHandler<ValueChangedEvent<T>>;

    /**
     * Construct a new ObservableProxy on top of the given Observable with specified conversion functions.
     * @param {IObservable} source The source Observable
     * @prarm {Function} outgoing The function used to convert values from the source type to own type
     * @param {Function} incoming The function used to convert values from own type to source type
     */
    constructor(source: IObservable<U>, outgoing: (source: U) => T, incoming: (source: T, value: U) => U) {
        this.source = source;
        this.outgoing = outgoing;
        this.incoming = incoming;
        this.onValueChanged = new EventHandler<ValueChangedEvent<T>>();
        // Bind value changed of source Observable
        this.source.onValueChanged.subscribe((arg) => {
            this.onValueChanged.fire({ oldValue: this.outgoing(arg.oldValue), newValue: this.outgoing(arg.newValue) });
        });
    }
}
