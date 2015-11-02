/// <reference path="../EventHandler.ts" />
/// <reference path="IObservable.ts" />

/**
 * A simple value store that notifies any subscribers of changes to its value.
 */
class Observable<T> implements IObservable<T> {
    /* tslint:disable:variable-name */
    private _value: T;
    /* tslint:enable:variable-name */

    public get value(): T {
        return this._value;
    }

    public set value(newVal: T) {
        if (this._value !== newVal) {
            var oldVal = this._value;
            this._value = newVal;
            this._onValueChanged.fire({ oldValue: oldVal, newValue: newVal });
        }
    }

    /* tslint:disable:variable-name */
    private _onValueChanged: EventHandler<ValueChangedEvent<T>>;
    /* tslint:enable:variable-name */

    public get onValueChanged(): EventHandler<ValueChangedEvent<T>> {
        return this._onValueChanged;
    }

    constructor(defaultValue?: T) {
        this._onValueChanged = new EventHandler<ValueChangedEvent<T>>();
        this._value = defaultValue;
    }
}
