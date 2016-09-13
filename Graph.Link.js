var Link = function (link_model) {
    var scope = this;
    this.link = link_model;
    this.color = '#0000FF';
    
    
    this.Color = function(color){
        scope.link.attr('.connection/stroke', color);
        scope.color = color;
    }
    
    
    setTimeout(function(){
        link_model.set('router', {
            name: 'metro'
        });
        link_model.attr({
            '.connection': { stroke: '#0000FF'},
            '.marker-source': { fill: 'black'},
            '.marker-target': { fill: 'black'}
        });
    },5);
}