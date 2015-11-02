/// <reference path="DataBinding.ts" />

/**
 * A class to store information on node bindings in the DOM.
 */
class NodeBinding {
    /**
     * The Node.
     */
    public node: Node;

    /**
     * Properties this node is bound to
     */
    public bindings: DataBinding[];

    /**
     * The original (pre-binding) value stored in this node
     */
    private originalValue: string;

    /**
     * Callback used to update the node when a change is triggered
     */
    public updateCallback: (args) => void;

    /**
     * @param {Node} node The node
     * @param {DataBinding[]} bindings Data Bindings associated with this node
     */
    constructor(node: Node, bindings: DataBinding[]) {
        this.node = node;
        this.originalValue = this.node.nodeValue;
        this.bindings = bindings;
        this.updateCallback = (args) => {
            this.updateNode();
        };
        for (var i = 0; i < this.bindings.length; i++) {
            this.bindings[i].onValueChanged.subscribe(this.updateCallback);
        }
    }

    /**
     * Updates node with values from data bindings.
     */
    public updateNode(): void {
        var newValue = this.originalValue;
        for (var i = 0; i < this.bindings.length; i++) {
            newValue = newValue.replace("{{" + this.bindings[i].path + "}}", this.bindings[i].value);
        }
        this.node.nodeValue = newValue;
    }
}
