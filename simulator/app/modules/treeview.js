"use strict";

class TreeView {
    /**
     *
     * @param root
     * @param internalTree
     * @param editable
     * @param data
     */
    constructor(root, data) {
        this._root = root;
        this._data = data;
        if(!root.hasClass('tree-root'))
            root.addClass('tree-root');
        if(!root.hasClass('tree-node'))
            root.addClass('tree-node');

        root.on('click', '.expander', function () {
            var span = $(this);
            span.toggleClass('glyphicon-triangle-right on glyphicon-triangle-bottom');
            span.nextAll('.tree-node').first().toggle();
            return false;
        });
        if(data !== undefined) {
            root.empty();
            this.createNode(data, root)
        }
    }

    createSpan(sClass, value) {
        return '<span class="' + sClass + '">' + value + '</span>';
    }

    createNode(data, node) {
        for(var key of Object.keys(data)) {
            var div = $('<div></div>');
            if(typeof data[key] === 'object') {
                div.append('<span class="glyphicon glyphicon-triangle-right expander"></span>'+this.createSpan('tree-key',key));
                var nodeDiv = $('<div></div>');
                nodeDiv.addClass('tree-node');
                nodeDiv.hide();
                div.append(nodeDiv);
                node.append(div);
                this.createNode(data[key], nodeDiv);
            } if(typeof data[key] === 'number' || typeof data[key] === 'string') {
                div.addClass('tree-node-value');
                div.append(this.createSpan('tree-key',key)+ ':' + this.createSpan('tree-value',data[key]));
                node.append(div);
            }
        }
    }
}

module.exports = TreeView;