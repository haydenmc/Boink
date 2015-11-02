/// <reference path="../Data/Observable.ts" />
/// <reference path="../Data/Binding/DataBinder.ts" />

/**
 * This is the base class for every Component (element).
 */
class Component extends HTMLElement {
    /**
     * The shadow DOM root for this element.
     */
    protected shadowRoot;

    /**
     * The data-context that all data-binding occurs against.
     */
    /* tslint:disable:variable-name */
    protected _dataContext: Observable<any>;
    /* tslint:enable:variable-name */
    public get dataContext(): Observable<any> {
        return this._dataContext;
    }
    public set dataContext(newContext: Observable<any>) {
        this._dataContext = newContext;
        if (this.dataBinder) {
            this.dataBinder.dataContext = newContext;
        }
    }

    /**
     * Maintains a reference to the parent Component
     */
    public parentComponent: Component;

    /**
     * The data binder that will handle all data binding that occurs for this component.
     */
    protected dataBinder: DataBinder;

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
    }

    /**
     * Called by the browser when this instance is added to the DOM.
     * This is where any 'constructor' processing needs to happen.
     */
    public attachedCallback() {
        console.log("Component attached.");
        if (this.dataContext.value == null) {
            // Bind to the data-context of the parent element (if it exists). 
            var parentElement: HTMLElement = this;
            while (typeof (<any>parentElement).dataContext === "undefined" || (<any>parentElement).dataContext.value == null) {
                parentElement = parentElement.parentElement;
                if (parentElement == null) {
                    throw new Error("No data context could be found in parents for element '" + this.tagName + "'");
                }
            }
            this.dataContext = (<any>parentElement).dataContext;
        }

        // Bind using data-context attribute if any.
        this.processDataContextAttributeBinding();

        // Apply data binding
        this.dataBinder = new DataBinder(this.dataContext);

        // Respond to data context changes
        // TODO

        // Find and apply template.
        this.applyShadowTemplate();
    }

    /**
     * This method checks the data-context attribute for a binding expression
     * and performs the binding of dataContext if necessary.
     * TODO: This should probably be DataBinder's job.
     * TODO: And also this looks really gross.
     */
    protected processDataContextAttributeBinding(): void {
        var dataContextAttr = this.attributes.getNamedItem("data-context");
        if (dataContextAttr != null && dataContextAttr.value !== "") {
            var dataContextAttrBindingMatches = dataContextAttr.value.match(DataBinder.bindingRegex);
            if (dataContextAttrBindingMatches != null && dataContextAttrBindingMatches.length > 0) {
                // Only process the first match. We can only data-bind to one property.
                var dataContextAttrBindingName = dataContextAttrBindingMatches[0].substr(2, dataContextAttrBindingMatches[0].length - 4);
                var bindingContext = this.dataContext;
                // Follow paths with dots
                while (dataContextAttrBindingName.indexOf(".") >= 0) {
                    var pathSection = dataContextAttrBindingName.substr(0, dataContextAttrBindingName.indexOf("."));
                    dataContextAttrBindingName = dataContextAttrBindingName.substr(dataContextAttrBindingName.indexOf(".") + 1);
                    if (typeof bindingContext.value[pathSection] !== "undefined") {
                        bindingContext = bindingContext.value[pathSection];
                    } else {
                        throw new Error("Couldn't bind data context to non-existing property '"
                            + pathSection + "' in " + this.tagName + ".");
                    }
                }
                if (typeof bindingContext.value[dataContextAttrBindingName] !== "undefined") {
                    this.dataContext = bindingContext.value[dataContextAttrBindingName];
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
    protected applyShadowTemplate(): void {
        var template: any = document.querySelector("template#" + this.tagName.toLowerCase());
        if (typeof template !== "undefined" && template != null) {
            var clone = document.importNode(template.content, true);
            this.shadowRoot = (<any>this).createShadowRoot();
            // Apply data-context to all shadow components (they can't break through to parent components)
            for (var i = 0; i < clone.childNodes.length; i++) {
                this.applyMyDataContext(clone.childNodes[i]);
                this.setParentComponent(clone.childNodes[i]);
            }
            this.shadowRoot.appendChild(clone);
            // HACK: Work with webcomponents.js to maintain style encapsulation
            if ((<any>window).ShadowDOMPolyfill) {
                var style = this.shadowRoot.querySelector("style");
                if (style) {
                    style.innerHTML = (<any>window).WebComponents.ShadowCSS.shimStyle(style, this.tagName.toLowerCase());
                }
            }
            // Process text node bindings on the shadow template.
            this.dataBinder.bindNodes(this.shadowRoot);

            // Process event bindings
            this.processEventBindings(this.shadowRoot);
        }
    }

    /**
     * Searches for event attributes on nodes and binds them to specified functions.
     * @param {Node} node The root node
     */
    protected processEventBindings(node: Node): void {
        if (node.nodeType === 1) {
            for (var i = 0; i < node.attributes.length; i++) {
                var attrName = node.attributes[i].name.toLowerCase();
                var attrValue = node.attributes[i].value;
                if (attrName.substr(0, 11) === "data-event-") {
                    var eventName = attrName.substr(11, attrName.length - 11);
                    if (typeof this[attrValue] !== "undefined") {
                        node.addEventListener(eventName, (arg) => this[attrValue](arg));
                    }
                }
            }
        }
        for (var i = 0; i < node.childNodes.length; i++) {
            this.processEventBindings(node.childNodes[i]);
        }
    }

    /**
     * Applies the data context of this component to any component contained
     * within the specified node.
     * @param {Node} node The root node
     * @param {Observable?} dataContext Optionally the data context to apply, if not the object's
     */
    protected applyMyDataContext(node: Node, dataContext?: Observable<any>): void {
        if (typeof dataContext === "undefined" || dataContext == null) {
            dataContext = this.dataContext;
        }
        if (node instanceof Component) {
            (<Component>node)._dataContext.value = dataContext.value;
        } else {
            for (var i = 0; i < node.childNodes.length; i++) {
                this.applyMyDataContext(node.childNodes[i], dataContext);
            }
        }
    }

    /**
     * Sets the parentComponent property of any child Components to specified Component.
     * @param {Node} node The root node
     * @param {Component} component The component to set as parent
     */
    protected setParentComponent(node: Node, component?: Component) {
        var newParent = this;
        if (component) {
            newParent = component;
        }
        if (node instanceof Component) {
            (<Component> node).parentComponent = newParent;
        } else {
            for (var i = 0; i < node.childNodes.length; i++) {
                this.setParentComponent(node.childNodes[i], component);
            }
        }
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
        if (typeof this[attrName] !== "undefined") {
            if (this[attrName] instanceof Observable) {
                (<Observable<any>>this[attrName]).value = newVal;
            } else {
                this[attrName] = newVal;
            }
        }
    }
}
