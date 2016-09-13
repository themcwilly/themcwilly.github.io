var Port = function (_parent, name, type, css_link) {
    var scope = this;
    this._parent = _parent;
    this._GLOBAL = _parent._GLOBAL;
    var colors = {
        inputs: '#00FF00',
        outputs: '#FF0000',
        parameters: '#FFFFFF'
    }
    this.name = name;
    this.id = 'port:'+type+'.'+name;
    this.css_link = css_link;
    this.type = type;
    this.color = colors[type];
    
    
    
    this.Color = function(color){
        scope._parent.component.attr(scope.css_link + ' circle/fill', color);
        scope.color = color;
    }
    this.MoveTo = function(x,y){
        scope._parent.component.attr(scope.css_link + '/ref-x', refx);
        scope._parent.component.attr(scope.css_link + '/ref-y', refy);
    }
    
    scope._parent.component.attr(css_link + ' circle/fill', colors[type]);
    if(type=='parameters') scope._parent.component.attr(css_link + ' text/transform', 'rotate(-90)');
    
}