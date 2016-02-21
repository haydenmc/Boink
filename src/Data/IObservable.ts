interface IObservable<T> {
    value: T;
    onValueChanged: EventHandler<ValueChangedEvent<T>>;
}

interface ValueChangedEvent<T> {
    oldValue: T;
    newValue: T;
}
