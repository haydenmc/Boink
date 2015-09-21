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
     * An array to store all of the node data bindings maintained in this DataBinder.
     */
    protected nodeDataBindings: Array<NodeDataBindingInformation>;

    /**
     * The default data-context that data-binding occurs against.
     */
    /* tslint:disable:variable-name */
    protected _dataContext: Observable<any>;
    /* tslint:enable:variable-name */
    public get dataContext(): Observable<any> {
        return this._dataContext;
    }

    constructor(dataContext?: Observable<any>) {
        this._dataContext = dataContext;
        this.nodeDataBindings = new Array<NodeDataBindingInformation>();
    }

    /**
     * Processes any text bindings that occur inside of a node tree.
     * TODO: Handle updating bindings when the data context is changed.
     * @param {Node} node The root node
     * @param {Observable} dataContext The data context this binding should use, if not the default
     */
    public processBindings(node: Node, dataContext?: Observable<any>) {
        if (typeof dataContext === "undefined" || dataContext == null) {
            dataContext = this.dataContext;
        }
        if (node.nodeType === 1 || node.nodeType === 11) { // this is an element node (or document fragment)
            // TODO: scan for attribute bindings, etc. in element nodes
            for (var i = 0; i < node.childNodes.length; i++) {
                this.processBindings(node.childNodes[i], dataContext);
            }
        } else if (node.nodeType === 3) { // this is a text node (base case).
            var bindingMatches = node.nodeValue.match(DataBinder.bindingRegex);
            if (bindingMatches != null && bindingMatches.length > 0) {
                for (var i = 0; i < bindingMatches.length; i++) {
                    var path = bindingMatches[i].substr(2, bindingMatches[i].length - 4);
                    if (typeof dataContext.value[path] !== "undefined") {
                        var bindingInfo: NodeDataBindingInformation = {
                            dataContext: dataContext,
                            node: node,
                            bindingPath: path,
                            originalText: node.nodeValue,
                            updateCallback: null
                        };
                        bindingInfo.updateCallback = (args: ValueChangedEvent<any>) => {
                            this.resolveBinding(bindingInfo);
                        };
                        (<Observable<any>>dataContext.value[path]).onValueChanged.subscribe(bindingInfo.updateCallback);
                        this.nodeDataBindings.push(bindingInfo);
                    } else {
                        throw new Error("Node data-binding failed on non- existing property '" + path + "'.");
                    }
                }
            }
        }
    }

    /**
     * Called to resolve a specific data binding.
     * TODO: Act differently depending on the type of node (not always a text node)
     * @param {NodeDataBindingInformation} bindingInfo An object containing
     * the information gathered on the binding when it was parsed.
     */
    public resolveBinding(bindingInfo: NodeDataBindingInformation) {
        var text = bindingInfo.originalText;
        var matches = text.match(DataBinder.bindingRegex);
        for (var i = 0; i < matches.length; i++) {
            var path = matches[i].substr(2, matches[i].length - 4);
            // TODO: Resolve path with dots...
            text = text.replace(matches[i], bindingInfo.dataContext.value[path].value);
        }
        bindingInfo.node.nodeValue = text;
    }

    /**
     * Resolves all known node bindings for this component.
     */
    public resolveAllBindings(): void {
        for (var i = 0; i < this.nodeDataBindings.length; i++) {
            this.resolveBinding(this.nodeDataBindings[i]);
        }
    }
}

/**
 * A class to store node binding information.
 */
class NodeDataBindingInformation {
    public dataContext: Observable<any>;
    public bindingPath: string;
    public node: Node;
    public originalText: string;
    public updateCallback: (args: ValueChangedEvent<any>) => void;
}
