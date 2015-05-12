/**
 * A simple value store that notifies any subscribers of changes to its value.
 */
class Observable<T> {
    private _value: T;

    public get value(): T {
        return this._value;
    }

    public set value(newVal: T) {
        if (this.value != newVal) {
            this.value = newVal;
            this._onValueChanged.fire(newVal);
        }
    }

    private _onValueChanged: EventHandler<T>;

    public get onValueChanged(): EventHandler<T> {
        return this._onValueChanged;
    }

    constructor(defaultValue?: T) {
        this._onValueChanged = new EventHandler<T>();
        this._value = defaultValue;
    }
}