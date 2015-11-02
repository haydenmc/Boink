/// <reference path="DataBinder.ts" />

/**
 * A class to maintain information on a data-bound property.
 * Used to construct a dependency tree of bindings.
 * TODO: Release old events and re-bind when data context changes.
 */
class DataBinding {
    /**
     * Data context to process bindings against
     */
    public dataContext: Observable<any>;

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
        return DataBinder.resolvePropertyPath(this.path, this.dataContext).value;
    }

    /**
     * Initializes the DataBinding class given a path to the property and a matching data context.
     * @param {string} path The property path to bind
     * @param {Observable<any>} The data context to bind against 
     */
    constructor(path: string, dataContext: Observable<any>) {
        this.dataContext = dataContext;
        this.path = path;
        this.childBindings = {};
        if (path.indexOf(".") >= 0) {
            this.property = path.substr(path.lastIndexOf(".") + 1);
        } else {
            this.property = path;
        }
        this.onValueChanged = new EventHandler<DataBindingValueChangedEvent>();
        this.updateCallback = (args) => {
            this.onValueChanged.fire({ path: this.path, valueChangedEvent: args });
            this.reattachChildren(this);
        };
        this.attachBinding();
    }

    /**
     * Forces child (dependent) bindings to re-attach their bindings.
     */
    public reattachChildren(binding?: DataBinding) {
        if (!binding) {
            return;
        }
        for (var c in binding.childBindings) {
            if (binding.childBindings.hasOwnProperty(c)) {
                binding.childBindings[c].reattachBinding();
                this.reattachChildren(binding.childBindings[c]);
            }
        }
    }

    /**
     * Detaches and re-attaches to target property.
     * Useful if parent properties or data context changes.
     */
    public reattachBinding(): void {
        this.detachBinding();
        this.attachBinding();
    }

    /**
     * Attaches binding to the target property.
     */
    public attachBinding(): void {
        var prop = DataBinder.resolvePropertyPath(this.path, this.dataContext);
        if (prop) {
            prop.onValueChanged.subscribe(this.updateCallback);
            this.onValueChanged.fire({ path: this.path, valueChangedEvent: { oldValue: null, newValue: prop.value } });
        }
    }

    /**
     * Detaches binding from the target property.
     * @param {Observable<any>?} dataContext Optionally specify a data context to detach from
     */
    public detachBinding(dataContext?: Observable<any>): void {
        var prop: Observable<any>;
        if (dataContext) {
            prop = DataBinder.resolvePropertyPath(this.path, dataContext);
        } else {
            prop = DataBinder.resolvePropertyPath(this.path, this.dataContext);
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
    public valueChangedEvent: ValueChangedEvent<any>;
}
