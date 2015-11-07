/// <reference path="DataBinder.ts" />

/**
 * A class to maintain information on a data-bound property.
 * Used to construct a dependency tree of bindings.
 * TODO: Release old events and re-bind when data context changes.
 */
class DataBinding {
    /**
     * Data binder to process bindings against
     */
    public dataBinder: DataBinder;

    /**
     * Full path relative to data context to the property
     */
    public path: string;

    /**
     * Property name
     */
    public property: string;

    /**
     * Child bindings that are dependent on this binding
     * (e.g. if this binding is 'property1', a child binding would be 'property1.property2')
     */
    public childBindings: { [property: string]: DataBinding };

    /**
     * Method that is bound to the property to track updates.
     */
    private updateCallback: (args: ValueChangedEvent<any>) => void;

    /**
     * Public event handler that fires whenever the value behind this binding changes.
     */
    public onValueChanged: EventHandler<DataBindingValueChangedEvent>;

    /**
     * The value of the property itself.
     */
    public get value(): any {
        return DataBinder.resolvePropertyPath(this.path, this.dataBinder.dataContext).value;
    }

    /**
     * The Observable instance encapsulating the target property.
     */
    public get observableValue(): IObservable<any> {
        return DataBinder.resolvePropertyPath(this.path, this.dataBinder.dataContext);
    }

    /**
     * Initializes the DataBinding class given a path to the property and a matching data context.
     * @param {string} path The property path to bind
     * @param {Observable<any>} The data context to bind against 
     */
    constructor(path: string, dataBinder: DataBinder) {
        this.dataBinder = dataBinder;
        this.path = path;
        this.childBindings = {};
        if (path.indexOf(".") >= 0) {
            this.property = path.substr(path.lastIndexOf(".") + 1);
        } else {
            this.property = path;
        }
        this.onValueChanged = new EventHandler<DataBindingValueChangedEvent>();
        this.updateCallback = (args) => {
            this.onValueChanged.fire({ path: this.path, binding: this, valueChangedEvent: args });
            this.reattachChildren();
        };
        this.attachBinding();
    }

    /**
     * Forces child (dependent) bindings to re-attach their bindings.
     * @param {DataBinding?} binding Optionally specify a starting Binding to traverse from
     * @param {IObservable?} detachFrom Optionally specify a data context to detach from
     */
    public reattachChildren(binding?: DataBinding, detachFrom?: IObservable<any>) {
        if (!binding) {
            binding = this;
        }
        for (var c in binding.childBindings) {
            if (binding.childBindings.hasOwnProperty(c)) {
                binding.childBindings[c].reattachBinding(detachFrom);
                this.reattachChildren(binding.childBindings[c], detachFrom);
            }
        }
    }

    /**
     * Detaches and re-attaches to target property.
     * Useful if parent properties or data context changes.
     * @param {IObservable} Optionally specify a data context to detach from
     */
    public reattachBinding(detachFrom?: IObservable<any>): void {
        this.detachBinding(detachFrom);
        this.attachBinding();
    }

    /**
     * Attaches binding to the target property.
     */
    public attachBinding(): void {
        var prop = DataBinder.resolvePropertyPath(this.path, this.dataBinder.dataContext);
        if (prop) {
            prop.onValueChanged.subscribe(this.updateCallback);
            this.onValueChanged.fire({ path: this.path, binding: this, valueChangedEvent: { oldValue: null, newValue: prop.value } });
        }
    }

    /**
     * Detaches binding from the target property.
     * @param {Observable<any>?} dataContext Optionally specify a data context to detach from
     */
    public detachBinding(detachFrom?: IObservable<any>): void {
        var prop: IObservable<any>;
        if (detachFrom) {
            prop = DataBinder.resolvePropertyPath(this.path, detachFrom);
        } else {
            prop = DataBinder.resolvePropertyPath(this.path, this.dataBinder.dataContext);
        }
        if (prop) {
            prop.onValueChanged.unSubscribe(this.updateCallback);
        }
    }

    /**
     * Unsubscribes all listeners from onChanged event handler.
     */
    public releaseListeners(): void {
        this.onValueChanged.unSubscribeAll();
    }
}

/**
 * Event class to communicate when data bindings have updated.
 */
class DataBindingValueChangedEvent {
    public path: string;
    public binding: DataBinding;
    public valueChangedEvent: ValueChangedEvent<any>;
}
