/// <reference path="Component.ts" />

/**
 * The repeater control takes a template, and populates it with the observable 
 * array of items provided via data context.
 */
class Repeater extends Component {
    private template: any;
    private pitchItems: Array<Node>;

    public createdCallback() {
        super.createdCallback();
        this.pitchItems = new Array<Node>();
    }

    public attachedCallback() {
        super.attachedCallback();
        this.template = this.querySelector("template");
        if (this.template == null) {
            throw new Error("Template undefined for repeater component. \
                A repeater element should always contain a template element.");
        }
        
        if (!(this.dataContext.value instanceof ObservableArray)) {
            throw new Error("Invalid data context for repeater component. \
                A repeater element should have an observable array set as the data context.");
        }

        this.populateAllItems();
    }

    private populateAllItems(): void {
        var array = <ObservableArray<any>>this.dataContext.value;
        for (var i = 0; i < array.size; i++) {
            var clone = document.importNode(this.template.content, true);
            this.pitchItems.push(clone);
            this.appendChild(clone);
        }
    }
}

Component.register("ui-repeater", Repeater);