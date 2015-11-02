/// <reference path="Component.ts" />
/// <reference path="Frame.ts" />

/**
 * A Page is a collection of content that is rendered inside of a Frame.
 */
class Page extends Component {
    /**
     * List of nodes on the DOM that represent page content.
     */
    private contentNodes: Array<Node>;

	/**
     * Called by the browser when an instance of this element/component is created.
     */
    public createdCallback() {
        super.createdCallback();
        this.contentNodes = new Array<Node>();
    }

    /**
     * Called by the browser when an instance of this component is attached to the DOM.
     */
    public attachedCallback() {
        super.attachedCallback();
        // Notify our parent frame that we've loaded.
        var pageIdAttr = this.attributes.getNamedItem("data-page-id");
        var pageId = "";
        if (pageIdAttr) {
            pageId = pageIdAttr.value;
        }
        var frame = this.parentElement;
        if (frame instanceof Frame) {
            (<Frame> frame).notifyPageLoaded(pageId);
        }
    }

    /**
     * Called to show the page in the parent Frame.
     */
    public show() {
        // Get reference to parent frame
        var frame = <Frame> this.parentNode;
        var template: any = this.querySelector("template");
        if (template) {
            var clone = document.importNode(template.content, true);
            for (var i = 0; i < clone.childNodes.length; i++) {
                this.contentNodes.push(clone.childNodes[i]);
                this.setParentComponent(clone.childNodes[i]);
            }
            this.appendChild(clone);
            for (var i = 0; i < clone.childNodes.length; i++) {
                this.dataBinder.bindNodes(clone.childNodes[i]);
            }
        } else {
            console.error("Page defined without template.");
        }
    }

    /**
     * Called to hide this page's content
     */
    public hide() {
        return;
    }
}
Component.register("ui-page", Page);
