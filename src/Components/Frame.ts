/// <reference path="Component.ts" />
/// <reference path="Page.ts" />

/**
 * A Frame serves as a way to render and navigate between pages contained within.
 */
class Frame extends Component {
    /**
     * The current page being rendered.
     */
    private currentPage: Page;

	/**
     * Called by the browser when an instance of this element/component is created.
     */
    public createdCallback() {
        super.createdCallback();
    }

    /**
     * Called by the browser when an instance of this component is attached to the DOM.
     */
    public attachedCallback() {
        super.attachedCallback();
    }

    /**
     * Navigate to a specific Page instance.
     * @param {Page} page The page to navigate to
     */
    public navigateTo(page: Page) {
        if (this.currentPage !== page) {
            if (this.currentPage) {
                this.currentPage.hide();
            }
            this.currentPage = page;
            page.show();
        }
    }

    /**
     * Navigate to a specific Page specified by ID.
     * @param {string} pageId The page ID of the page to navigate to
     */
    public navigateToId(pageId: string) {
        // Find this page
        var page: Page;
        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i] instanceof Page
                && this.children[i].attributes.getNamedItem("data-page-id")
                && this.children[i].attributes.getNamedItem("data-page-id").value === pageId) {
                page = <Page> this.children[i];
            }
        }
        if (page) {
            this.navigateTo(page);
        } else {
            console.error("Attempted to navigate to non-existent page ID '" + pageId + "'.");
        }
    }

    /**
     * Used by Pages to notify the frame that they've loaded.
     * If the page is our intended default, we navigate to it.
     * @param {string} pageId The ID of the page that has loaded
     */
    public notifyPageLoaded(pageId: string) {
        if (this.currentPage) {
            return;
        }
        var defaultPageAttr = this.attributes.getNamedItem("data-default-page");
        if (defaultPageAttr) {
            if (pageId === defaultPageAttr.value) {
                this.navigateToId(pageId);
            }
        } else {
            this.navigateToId(pageId);
        }
    }
}
Component.register("ui-frame", Frame);
