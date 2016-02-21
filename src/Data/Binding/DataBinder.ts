/**
 * This class serves as the foundation for data binding in Components,
 * and maybe eventually beyond.
 */
class DataBinder {
    /**
     * The regular expression used to detect bindings in templates.
     */
    public static bindingRegex: RegExp = /{{[a-zA-Z._0-9]+}}/g;

    /**
     * A tree to store all of the data bindings maintained in this DataBinder.
     */
    protected bindingTree: DataBinding;

    /**
     * List of registered node bindings.
     */
    protected nodeBindings: NodeBinding[];

    /**
     * The default data-context that data-binding occurs against.
     */
    /* tslint:disable:variable-name */
    private _dataContext: IObservable<any>;
    /* tslint:enable:variable-name */
    public get dataContext(): IObservable<any> {
        return this._dataContext;
    }
    public set dataContext(newContext: IObservable<any>) {
        if (this._dataContext !== newContext) {
            var oldContext = this._dataContext;
            this._dataContext = newContext;
            this.bindingTree.reattachBinding(oldContext);
            this.bindingTree.reattachChildren(null, oldContext);
        }
    }

    /**
     * Initializes a new DataBinder
     * @param {Observable<any>} dataContext The data context to use for bindings
     */
    constructor(dataContext?: IObservable<any>) {
        this._dataContext = dataContext;
        this.bindingTree = new DataBinding("", this);
        this.nodeBindings = [];
    }

    /**
     * Searches for bindings in the given string.
     * @param {string} str The string to search for bindings inside of
     * @returns {string[]} An array of bindings found
     */
    public static parseBindings(str: string): string[] {
        var bindingProperties: string[] = [];
        var bindingMatches = str.match(DataBinder.bindingRegex);
        if (bindingMatches != null && bindingMatches.length > 0) {
            for (var i = 0; i < bindingMatches.length; i++) {
                var path = bindingMatches[i].substr(2, bindingMatches[i].length - 4);
                bindingProperties.push(path);
            }
        }
        return bindingProperties;
    }

    /**
     * Registers any node bindings that occur under the specified node and creates NodeBindings for them.
     * Currently supported: Text nodes.
     * @param {Node} node The root node
     */
    public bindNodes(node: Node): void {
        if (node instanceof Component) {
            return; // Don't attempt to data-bind inside of a Component.
        }
        if (node.nodeType === 1 || node.nodeType === 11) { // this is an element node (or document fragment)
            // TODO: scan for attribute bindings, etc. in element nodes
            for (var i = 0; i < node.childNodes.length; i++) {
                this.bindNodes(node.childNodes[i]);
            }
        } else if (node.nodeType === 3) { // this is a text node (base case).
            var bindingMatches = DataBinder.parseBindings(node.nodeValue);
            var bindings: DataBinding[] = [];
            for (var i = 0; i < bindingMatches.length; i++) {
                bindings.push(this.registerBinding(bindingMatches[i]));
            }
            if (bindings.length > 0) {
                this.nodeBindings.push(new NodeBinding(node, bindings));
            }
        }
    }

    /**
     * Registers a binding for the given path relative to data context and returns the information. 
     * If binding exists, the existing binding information is returned.
     * @param {string} path the path to the property being bound relative to data context
     */
    public registerBinding(path: string) {
        if (path === "") {
            return this.bindingTree;
        }
        var properties = path.split(".");
        var parentBinding = this.bindingTree;
        var traversedPath = "";
        for (var i = 0; i < properties.length; i++) {
            if (i > 0) {
                traversedPath += ".";
            }
            traversedPath += properties[i];
            if (parentBinding.childBindings[properties[i]]) {
                parentBinding = parentBinding.childBindings[properties[i]];
            } else {
                var bindingInfo = new DataBinding(traversedPath, this);
                parentBinding.childBindings[properties[i]] = bindingInfo;
                parentBinding = bindingInfo;
            }
        }
        return parentBinding;
    }

    /**
     * Unsubscribes update callbacks for all bindings and removes them from the binding catalog.
     */
    public removeAllBindings(binding?: DataBinding) {
        var currentBinding: DataBinding;
        if (binding) {
            currentBinding = binding;
        } else {
            currentBinding = this.bindingTree;
        }

        for (var childBinding in currentBinding.childBindings) {
            if (currentBinding.childBindings.hasOwnProperty(childBinding)) {
                this.removeAllBindings(currentBinding.childBindings[childBinding]);
                delete currentBinding.childBindings[childBinding];
            }
        }
        currentBinding.detachBinding();
        currentBinding.releaseListeners();
    }

    /**
     * Resolves a property path string to the actual Observable property.
     * @param {string} path The property path to resolve
     * @returns {Observable<any>} The Observable Property
     */
    public static resolvePropertyPath(path: string, dataContext: IObservable<any>): IObservable<any> {
        var currentDataContext = dataContext;
        if (path === "") {
            return currentDataContext;
        }
        var properties = path.split(".");
        for (var i = 0; i < properties.length; i++) {
            if (currentDataContext.value[properties[i]]) {
                currentDataContext = currentDataContext.value[properties[i]];
            } else {
                console.warn("Attempted to resolve non-existent property path: '" + path + "'.");
                return null;
            }
        }
        return currentDataContext;
    }
}
