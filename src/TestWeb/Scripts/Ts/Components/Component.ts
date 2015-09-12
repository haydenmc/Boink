/**
 * This is the base class for every Component (element).
 */
class Component extends HTMLElement {
    /**
     * The regular expression used to detect bindings in templates.
     */
    public static bindingRegex: RegExp = /{{[a-zA-Z._0-9]+}}/g;

    /**
     * The shadow DOM root for this element.
     */
    protected shadowRoot;

    /**
     * The data-context that all data-binding occurs against.
     */
    protected _dataContext: Observable<any>;
    public get dataContext(): Observable<any> {
        return this._dataContext;
    }

    /**
     * An array to store all of the text node bindings maintained in this component.
     */
    protected textNodeBindings: Array<TextNodeBindingInformation>;

    /**
     * Constructor - redirects to createdCallback as required by web components.
     * NOTE: Things you put in the Constructor may be ignored. Put in createdCallback method instead.
     */
    constructor() {
        super();
        this.createdCallback();
    }

    /**
     * Method to register specified class as a web component, and bind it to an element tag.
     *
     * @param {string} elementName The tag of this element in HTML
     * @param {class} theClass The component class to bind this element to
     */ 
    public static register(elementName: string, theClass: any): void {
        (<any>document).registerElement(elementName, {
            prototype: theClass.prototype
        });
    }

    /**
     * Called by the browser when an instance of this element/component is created.
     */
    public createdCallback() {
        console.log("Component created: " + this.tagName);
        this._dataContext = new Observable<any>();
        this.textNodeBindings = new Array<TextNodeBindingInformation>();
    }

    /**
     * Called by the browser when this instance is added to the DOM.
     * This is where any 'constructor' processing needs to happen.
     */
    public attachedCallback() {
        console.log("Component attached.");
        // Bind to the data-context of the parent element (if it exists). 
        var parentElement: HTMLElement = this;
        while (typeof (<any>parentElement).dataContext === 'undefined' || (<any> parentElement).dataContext.value == null) {
            parentElement = parentElement.parentElement;
            if (parentElement == null) {
                throw new Error("No data context could be found in parents for element '" + this.tagName + "'");
            }
        }
        this._dataContext = (<any>parentElement).dataContext;

        // Bind using data-context attribute if any.
        this.processDataContextAttributeBinding();
        
        // Find and apply template.
        this.applyShadowTemplate();
    }

    /**
     * This method checks the data-context attribute for a binding expression
     * and performs the binding of dataContext if necessary.
     */
    protected processDataContextAttributeBinding() {
        var dataContextAttr = this.attributes.getNamedItem("data-context");
        if (dataContextAttr != null && dataContextAttr.value != "") {
            var dataContextAttrBindingMatches = dataContextAttr.value.match(Component.bindingRegex);
            if (dataContextAttrBindingMatches != null && dataContextAttrBindingMatches.length > 0) {
                // Only process the first match. We can only data-bind to one property.
                var dataContextAttrBindingName = dataContextAttrBindingMatches[0].substr(2, dataContextAttrBindingMatches[0].length - 4);
                if (typeof this.dataContext.value[dataContextAttrBindingName] !== 'undefined') {
                    this._dataContext = this.dataContext.value[dataContextAttrBindingName];
                } else {
                    throw new Error("Couldn't bind data context to non-existing property '"
                        + dataContextAttrBindingName + "' in " + this.tagName + ".");
                }
            } else {
                throw new Error("Couldn't parse data context binding expression '"
                    + dataContextAttr.value + "' of " + this.tagName
                    + ". Bindings should be of format {{bindingPropertyName}}.");
            }
        }
    }

    /**
     * Applies shadow DOM template if it is defined.
     * TODO: copy content from child elements into shadow, indicated by some kind of binding markup...
     */
    protected applyShadowTemplate() {
        var template: any = document.querySelector("template#" + this.tagName.toLowerCase());
        if (typeof template !== 'undefined' && template != null) {
            var clone = document.importNode(template.content, true);
            this.shadowRoot = (<any>this).createShadowRoot();
            this.shadowRoot.appendChild(clone);
            // Process text node bindings on the shadow template.
            this.processTextBindings(this.shadowRoot);
            this.resolveAllTextBindings();
        }
    }

    /**
     * Processes any text bindings that occur inside of a node tree.
     * @param {Node} node The root node
     */
    protected processTextBindings(node: Node) {
        if (node.nodeType == 1 || node.nodeType == 11) { // this is an element node (or document fragment)
            for (var i = 0; i < node.childNodes.length; i++) {
                this.processTextBindings(node.childNodes[i]);
            }
        }
        else if (node.nodeType == 3) { // this is a text node (base case).
            var bindingMatches = node.nodeValue.match(Component.bindingRegex);
            if (bindingMatches != null && bindingMatches.length > 0) {
                for (var i = 0; i < bindingMatches.length; i++) {
                    var path = bindingMatches[i].substr(2, bindingMatches[i].length - 4);
                    if (typeof this.dataContext.value[path] !== 'undefined') {
                        var bindingInfo: TextNodeBindingInformation = {
                            textNode: node,
                            bindingPath: path,
                            originalText: node.nodeValue,
                            updateCallback: null
                        };
                        bindingInfo.updateCallback = (args: ValueChangedEvent<any>) => {
                            this.resolveTextNodeBindings(bindingInfo);
                        }
                        (<Observable<any>>this.dataContext.value[path]).onValueChanged.subscribe(bindingInfo.updateCallback);
                        this.textNodeBindings.push(bindingInfo);
                    } else {
                        throw new Error("Text node data-binding in " + this.tagName
                            + " failed on non- existing property '" + path + "'.");
                    }
                }
            }
        }
    }

    /**
     * Resolves all known text node bindings for this component.
     */
    public resolveAllTextBindings(): void {
        for (var i = 0; i < this.textNodeBindings.length; i++) {
            this.resolveTextNodeBindings(this.textNodeBindings[i]);
        }
    }

    /**
     * Called to resolve bindings on a specific text node.
     * @param {TextNodeBindingInformation} bindingInfo An object containing
     * the information gathered on the binding when it was parsed.
     */
    public resolveTextNodeBindings(bindingInfo: TextNodeBindingInformation) {
        var text = bindingInfo.originalText;
        var matches = text.match(Component.bindingRegex);
        for (var i = 0; i < matches.length; i++) {
            var path = matches[i].substr(2, matches[i].length - 4);
            // TODO: Resolve path with dots...
            text = text.replace(matches[i], this.dataContext.value[path].value);
        }
        bindingInfo.textNode.nodeValue = text;
    }

    /**
     * Called by the browser when this instance is removed from the DOM.
     */
    public detachedCallback() {
        console.log("Component detached.");
    }

    /**
     * Called by the browser when an attribute is updated on the DOM.
     * Serves to keep member variables in-sync with attributes on the element.
     *
     * @param {string} attrName Name of the attribute or member variable
     * @param {string} oldVal Old value of the specified attribute
     * @param {string} newVal New value of the specified attribute
     */
    public attributeChangedCallback(attrName: string, oldVal: string, newVal: string): void {
        console.log("Attribute '" + attrName + "' changed.");
        if (typeof this[attrName] !== 'undefined') {
            if (this[attrName] instanceof Observable) {
                (<Observable<any>>this[attrName]).value = newVal;
            } else {
                this[attrName] = newVal;
            }
        }
    }
}

/**
 * A class to store text node binding information.
 */
class TextNodeBindingInformation {
    public bindingPath: string;
    public textNode: Node;
    public originalText: string;
    public updateCallback: (args: ValueChangedEvent<any>) => void;
}