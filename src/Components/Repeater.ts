/// <reference path="Component.ts" />
/// <reference path="../Data/ObservableArray.ts" />

/**
 * The repeater control takes a template, and 'repeats' it with data from
 * the observable array of items provided via data context.
 */
class Repeater extends Component {
    /**
     * The template this repeater uses for each item.
     */
    private template: any;

    /**
     * An array retaining information on each item in the repeater.
     */
    private repeaterItems: RepeaterItem[];

    /**
     * Stores the callbacks that should be triggered on item events.
     */
    private itemEventCallbacks: { [eventName: string] : (dataContext: any) => any };

    /**
     * Called by the browser when an instance of this element/component is created.
     */
    public createdCallback() {
        super.createdCallback();
        this.repeaterItems = [];
        this.itemEventCallbacks = { };
    }

    /**
     * Called by the browser when this instance is added to the DOM.
     * This is where any 'constructor' processing needs to happen.
     */
    public attachedCallback() {
        super.attachedCallback();
        this.template = this.querySelector("template");
        if (this.template == null) {
            throw new Error("Template undefined for repeater component."
                + " A repeater element should always contain a template element.");
        }

        if (!(this.dataContext.value instanceof ObservableArray)) {
            throw new Error("Invalid data context for repeater component."
                + " A repeater element should have an observable array set as the data context.");
        }

        // Check if we have any events to bind
        for (var i = 0; i < this.attributes.length; i++) {
            var attributeName = this.attributes[i].name;
            var attributeValue = this.attributes[i].value;
            if (attributeName.indexOf("data-event-item-") === 0) {
                var eventName = attributeName.replace("data-event-item-", "");
                if (this.parentComponent && this.parentComponent[attributeValue]) {
                    this.itemEventCallbacks[eventName] = this.parentComponent[attributeValue];
                } else {
                    console.error(this.tagName + " attempted to bind event to unexisting callback '"
                        + attributeValue + "' on "
                        + this.parentComponent.tagName);
                }
            }
        }

        // Populate our items (if we have any)
        if (this.dataContext && this.dataContext.value instanceof ObservableArray) {
            this.populateAllItems();
        } else {
            console.warn(this.tagName + " attached without a valid data context, expecting an ObservableArray.");
        }
    }

    /**
     * Override processing of event bindings - we take care of this ourselves.
     */
    protected processEventBindings(node: Node): void {
        return;
    }

    /**
     * Meant to be called if the data context is ever changed, requiring a refresh of the list.
     */
    public dataContextUpdated(oldContext: IObservable<any>, newContext: IObservable<any>) {
        super.dataContextUpdated(oldContext, newContext);
        this.clearItems();
        this.populateAllItems();
        (<ObservableArray<any>>this.dataContext.value).itemAdded.subscribe((arg) => this.itemAdded(arg));
        (<ObservableArray<any>>this.dataContext.value).itemRemoved.subscribe((arg) => this.itemRemoved(arg));
    }

    /**
     * Called when an item has been added to the backing observable array.
     * @param {ObservableArrayEventArgs} arg Arguments detailing what was added and where
     */
    public itemAdded(arg: ObservableArrayEventArgs<any>): void {
        // Throw the item into an observable for data context and bindings
        var itemDataContext = new Observable<any>(arg.item);
        this.addItem(itemDataContext, arg.position);
    }

    /**
     * Called when an item has been removed from the backing observable array.
     * @param {ObservableArrayEventArgs} arg Arguments detailing what was removed and where
     */
    public itemRemoved(arg: ObservableArrayEventArgs<any>): void {
        this.removeItem(arg.position);
    }

    /**
     * Reads every item from the observable array, processes data binding for it,
     * and adds it to the DOM. Assumes all processed list info / DOM is clean.
     */
    private populateAllItems(): void {
        var array = <ObservableArray<any>>this.dataContext.value;
        for (var i = 0; i < array.size; i++) {
            var itemDataContext = new Observable<any>(array.get(i));
            this.addItem(itemDataContext);
        }
    }

    /**
     * Used to add an item with the given data context at the given position.
     * @param {Observable<any>} dataContext The data context of the new item
     * @param {number?} position The position the item should be added. Added last if not specified.
     */
    private addItem(dataContext: IObservable<any>, position?: number) {
        if (typeof position === "undefined") {
            position = this.repeaterItems.length;
        }

        var newItem: RepeaterItem = {
            dataContext: dataContext,
            dataBinder: new DataBinder(dataContext),
            nodes: []
        };

        // Clone the item template, apply data context to any components, apply text node bindings
        var clone = document.importNode(this.template.content, true);
        for (var i = 0; i < clone.childNodes.length; i++) {
            newItem.nodes.push(clone.childNodes[i]);
            this.applyMyDataContext(clone.childNodes[i], dataContext);
            this.setParentComponent(clone.childNodes[i], this.parentComponent);
            this.applyRepeaterEvents(clone.childNodes[i], dataContext);
            newItem.dataBinder.bindNodes(clone.childNodes[i]);
        }

        // Capture the reference node before we shift the reference array
        var refNode = null;
        if (this.repeaterItems.length === 0) { // First item
            refNode = this.nextSibling;
        } else if (position < this.repeaterItems.length) { // Middle item
            refNode = this.repeaterItems[position].nodes[0];
        } else { // Last item
            var lastItem = this.repeaterItems[this.repeaterItems.length - 1];
            refNode = <HTMLElement> lastItem.nodes[lastItem.nodes.length - 1].nextSibling;
        }

        this.repeaterItems.splice(position, 0, newItem);

        // Append to the DOM in the proper place
        this.parentNode.insertBefore(clone, refNode);
    }

    /**
     * Used to remove an existing item at a given position.
     * @param {number} position The position of the item to be removed
     */
    private removeItem(position: number) {
        var item = this.repeaterItems[position];

        // Remove item from array
        this.repeaterItems.splice(position, 1);

        // Release all the associated data bindings
        item.dataBinder.removeAllBindings();

        // Remove nodes from the DOM
        var nodesToBeRemoved = item.nodes;
        for (var i = 0; i < nodesToBeRemoved.length; i++) {
            nodesToBeRemoved[i].parentNode.removeChild(nodesToBeRemoved[i]);
        }
    }

    /**
     * Clears all items, releases bindings, and removes their nodes from the DOM.
     */
    private clearItems(): void {
        for (var i = this.repeaterItems.length - 1; i >= 0; i--) {
            this.removeItem(i);
        }
    }

    /**
     * Applies set of events to particular node
     * @param {Node} node to apply events to
     * @param {any} dataContext Data context for this event
     */
    private applyRepeaterEvents(node: Node, dataContext: any) {
        for (var eventName in this.itemEventCallbacks) {
            if (this.itemEventCallbacks[eventName]) {
                node.addEventListener(eventName, (args) => this.itemEventCallbacks[eventName](dataContext));
            }
        }
    }
}

Component.register("ui-repeater", Repeater);

/**
 * A class to store information on each item in a Repeater component.
 */
interface RepeaterItem {
    dataContext: IObservable<any>;
    dataBinder: DataBinder;
    nodes: Node[];
}
