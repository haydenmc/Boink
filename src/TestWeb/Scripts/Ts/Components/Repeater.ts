/// <reference path="Component.ts" />

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
     * Used to store a reference to the DOM nodes of each list item.
     */
    private itemNodes: Array<Array<Node>>;

    /**
     * Called by the browser when an instance of this element/component is created.
     */
    public createdCallback() {
        super.createdCallback();
        this.itemNodes = new Array<Array<Node>>();
    }

    /**
     * Meant to be called if the data context is ever changed, requiring a refresh of the list.
     * TODO: Release data bindings
     */
    public dataContextUpdated() {
        for (var i = 0; i < this.itemNodes.length; i++) {
            for (var j = 0; j < this.itemNodes[i].length; j++) {
                this.itemNodes[i][j].parentNode.removeChild(this.itemNodes[i][j]);
            }
        }
        this.itemNodes.splice(0, this.itemNodes.length);
        this.populateAllItems();
        (<ObservableArray<any>>this.dataContext.value).itemAdded.subscribe((arg) => this.itemAdded(arg));
    }

    /**
     * Called when an item has been added to the backing observable array.
     * @param {ObservableArrayEventArgs} arg Arguments detailing what was added and where
     */
    public itemAdded(arg: ObservableArrayEventArgs<any>): void {
        var clone = document.importNode(this.template.content, true);
        var cloneNodes = new Array<Node>();
        for (var j = 0; j < clone.childNodes.length; j++) {
            cloneNodes.push(clone.childNodes[j]);
        }
        this.itemNodes.push(cloneNodes);
        this.appendChild(clone);
        for (var j = 0; j < cloneNodes.length; j++) {
            this.processTextBindings(cloneNodes[j], new Observable<any>(arg.item));
        }
        this.resolveAllTextBindings();
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

        this.dataContext.onValueChanged.subscribe(() => {
            this.dataContextUpdated();
        });
        this.dataContextUpdated();
    }

    /**
     * Reads every item from the observable array, processes data binding for it,
     * and adds it to the DOM.
     */
    private populateAllItems(): void {
        var array = <ObservableArray<any>>this.dataContext.value;
        for (var i = 0; i < array.size; i++) {
            var clone = document.importNode(this.template.content, true);
            var cloneNodes = new Array<Node>();
            for (var j = 0; j < clone.childNodes.length; j++) {
                cloneNodes.push(clone.childNodes[j]);
            }
            this.itemNodes.push(cloneNodes);
            this.appendChild(clone);
            for (var j = 0; j < cloneNodes.length; j++) {
                this.processTextBindings(cloneNodes[j], new Observable<any>(array.get(i)));
            }
        }
        this.resolveAllTextBindings();
    }
}

Component.register("ui-repeater", Repeater);