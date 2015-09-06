/**
 * This is the base class for every element.
 */
class Component extends HTMLElement {
    /**
     * The shadow DOM root for this element.
     */
    protected shadowRoot;

    /**
     * Method to register this component as a web component, and bind it to an element.
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
        var template: any = document.querySelector("#" + this.tagName.toLowerCase());
        if (typeof template !== 'undefined') {
            var clone = document.importNode(template.content, true);
            this.shadowRoot = (<any>this).createShadowRoot();
            this.shadowRoot.appendChild(clone);
        }
    }

    /**
     * Called by the browser when this instance is added to the DOM.
     */
    public attachedCallback() {
        console.log("Component attached.");
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