interface TextBindingInfo {
    elementBindingId: number;
    textNodeIndex: number;
    bindingPath: string;
    bindingText: string;
    updateCallback: (args: ValueChangedEvent<any>) => void;
}

class Component {
    public static bindingRegex: RegExp = /{{[a-zA-Z._0-9]+}}/g; // Regular expression for bindings
    public static bindingIdCounter: number = 0; // Maintains the next 'unique id' applied to elements tracked for bindings
    public elementId: string;
    public title: Observable<string> = new Observable<string>("");
    protected parentElement: HTMLElement;
    protected htmlElements: Array<HTMLElement> = new Array<HTMLElement>(); // The HTML elements at the root of this component

    protected textBindings: { [bindingPath: string]: Array<TextBindingInfo> } = {}; 

    constructor(id: string, parent?: HTMLElement) {
        this.elementId = id;
        this.parentElement = parent;
        var template: HTMLScriptElement = <HTMLScriptElement>document.getElementById("template_" + this.elementId);
        if (template == null) {
            throw new Error("Tried to instantiate non-existing template");
        }
        var parser = new DOMParser();
        var fragment = parser.parseFromString(template.innerHTML, "text/html");

        for (var i = 0; i < fragment.body.children.length; i++) {
            this.htmlElements.push(<HTMLElement>fragment.body.children.item(i));
        }
        // Process elements for bindings
        for (var i = 0; i < this.htmlElements.length; i++) {
            this.processElements(this.htmlElements[i]);
        }
        console.log(this.textBindings);
    }

    private processElements(rootElement: HTMLElement) {
        // Look for bindings in the text nodes
        var textNodes: Array<Node> = [];
        for (var i = 0; i < rootElement.childNodes.length; i++) {
            if (rootElement.childNodes[i].nodeType == 3) { // is a text node
                textNodes.push(rootElement.childNodes[i]);
            }
        }
        
        var bindingId = -1;
        for (var i = 0; i < textNodes.length; i++) {
            var node = textNodes[i];
            var matches = node.nodeValue.match(Component.bindingRegex)
            if (matches != null && matches.length > 0) {
                if (bindingId == -1) {
                    // generate and apply element binding ID
                    bindingId = Component.bindingIdCounter;
                    Component.bindingIdCounter++;
                    rootElement.id = "BindingElement" + bindingId;
                }
                for (var j = 0; j < matches.length; j++) {
                    var path = matches[j].substr(2, matches[j].length - 4);
                    if (typeof this.textBindings[path] === 'undefined') {
                        this.textBindings[path] = new Array();
                    }
                    var bindingInfo: TextBindingInfo = {
                        elementBindingId: bindingId,
                        textNodeIndex: i,
                        bindingPath: path,
                        bindingText: node.nodeValue,
                        updateCallback: (args: ValueChangedEvent<any>) => {
                            this.triggerBindingUpdate(path);
                        }
                    };
                    (<Observable<any>>this[path]).onValueChanged.subscribe(bindingInfo.updateCallback);
                    this.textBindings[path].push(bindingInfo);
                }
                node.nodeValue = this.resolveBindingText(node.nodeValue); // resolve the binding right away
            }
        }

        if (rootElement.hasAttribute("data-component")) {
            this.processSubComponent(rootElement);
        } else {
            // Process bindings for child elements
            for (var i = 0; i < rootElement.childNodes.length; i++) {
                if (rootElement.childNodes[i].nodeType == 1) { // This is an element
                    this.processElements(<HTMLElement>rootElement.childNodes[i]);
                }
            }
        }
    }

    private processSubComponent(element: HTMLElement) {
        var componentId = element.getAttribute("data-component");
        var componentInstance = <Component>Object.create(window[componentId].prototype);
        componentInstance.constructor.apply(componentInstance, new Array(element.parentElement));
        componentInstance.show();
    }

    protected triggerBindingUpdate(path: string) {
        var bindings = this.textBindings[path];
        for (var i = 0; i < bindings.length; i++) {
            var binding = bindings[i];
            var bindingElement = document.getElementById("BindingElement" + binding.elementBindingId);

            // Look for bindings in the text nodes
            for (var i = 0, textNodeIndex = 0; i < bindingElement.childNodes.length; i++) {
                if (bindingElement.childNodes[i].nodeType == 3) { // is a text node
                    if (textNodeIndex == binding.textNodeIndex) {
                        // Process binding text
                        bindingElement.childNodes[i].nodeValue = this.resolveBindingText(binding.bindingText);
                    }
                    textNodeIndex++;
                }
            }
        }
    }

    private resolveBindingText(text: string): string {
        var matches = text.match(Component.bindingRegex);
        for (var i = 0; i < matches.length; i++) {
            var path = matches[i].substr(2, matches[i].length - 4);
            // TODO: Resolve path with dots...
            text = text.replace(matches[i], this[path].value);
        }
        return text;
    }

    public show(): void {
        var appendParent = document.body;
        if (this.parentElement != null) {
            appendParent = this.parentElement
        }
        for (var i = 0; i < this.htmlElements.length; i++) {
            this.htmlElements[i] = <HTMLElement>appendParent.appendChild(this.htmlElements[i]);
        }
    }

    public hide(): void {
        for (var i = 0; i < this.htmlElements.length; i++) {
            this.htmlElements[i] = <HTMLElement>this.htmlElements[i].parentElement.removeChild(this.htmlElements[i]);
        }
    }

    public destroy(): void {
        this.hide();
        this.htmlElements = null;
        this.parentElement = null;

        // TODO: Clear up bindings and such
    }
}