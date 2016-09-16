var Group = function(_parent,name){
    var scope = this;
    this._parent = _parent;
    this.group = null;
    
    this.Add_Component = function(name){
        if(scope._parent.components[name]) return console.log('Component already exists');
        console.log('Adding component to group');
        scope.group.embed(scope._parent.components[name]);
    }
    var rect = new joint.shapes.basic.Rect();
    scope.group = rect;
    this._parent.graph.addCells([rect])
}