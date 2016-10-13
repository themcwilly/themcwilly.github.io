/*
    Copyright (c) 2015-2016 OpenSensorHub

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
*/
var Graph = function (_GLOBAL) {
    //INITIALIZE VARIABLES
    var scope = this;
    this._GLOBAL = _GLOBAL;
    this.process;
    this.process_object = null;
    this.div = 'paper-create';
    this.graph = null;
    this.directed_graph = null;
    this.paper = null;
    this.component_graph = null;
    this.mousedown = false;
    this.linkJustAdded = false;
    this.linkJustRemoved = false;
    this.dragStartPosition;
    
    this.ios = {inputs: [],outputs:[]};
    this.components = {};
    this.groups = {};
    
    this.requires_embedding = [];

    this.maps = {
        links: {}
    }

    this.leftovers = {
        components: {},
        links: [],
        ios: {}
    } //these are links that defined components and ports that don't exist

    this.Group = {};
    this.Group.New = function (name) {
        if (typeof name === 'undefined' || name == '') return 'Please supply a valid name.';
        if (typeof scope.groups[name] !== 'undefined') return name + ' has already been used.';
        scope.components[name] = new Group(scope, name);
    }
    
    this.Component = {};
    this.Component.New = function (name, ports, isProcess) {
        if (typeof name === 'undefined' || name == '') return 'Please supply a valid name.';
        if (typeof scope.components[name] !== 'undefined') return name + ' has already been used.';
        var properties = {
            x: (window.innerWidth - 500) * Math.random() + 250,
            y: (window.innerHeight - 500) * Math.random() + 250,
            name: name
        };
        
        if (typeof ports === 'object') {
            for (var port_type in ports) {
                properties[port_type] = ports[port_type];
            }
        }
        
        
        //attempt to split main process into in and out - directed graph algorithm sucks.. can only handle links to cells... not ports
        if(isProcess){
            var in_props = jQuery.extend(true,{},properties);
            in_props.name = in_props.name+'-IN';
            var out_props = jQuery.extend(true,{},properties);
            out_props.name = out_props.name+'-OUT';
            delete in_props.outputs;
            delete out_props.inputs;
            scope.components[in_props.name] = new Component(scope,in_props,isProcess);
            scope.components[out_props.name] = new Component(scope,out_props,isProcess);
            return;
        }
        
        
        var component = new Component(scope, properties, isProcess);
        scope.components[name] = component;


        return component;
    }
    this.Component.Add_Port = function (component, type, name) {
        if (typeof scope.components[component] === 'undefined') return;
        scope.components[component].Add.Port(type, name);
    }
    this.Component.Add_Link = function (from, from_type, to, to_type,properties) {
        var from_comp = from.split('.')[0];
        var from_port = from.split('.')[1];
        var to_comp = to.split('.')[0];
        var to_port = to.split('.')[1];

//        console.log('~~~~~~~~~~~~~~~~~~~');
//        console.log('From: '+from_comp+' - '+from_type+' - '+from_port);
//        console.log('To  : '+to_comp+' - '+to_type+' - '+to_port);
//        console.log('~~~~~~~~~~~~~~~~~~~');
        
//        if(from_comp==scope.process){
//            if(from_type=='inputs') from_comp = from_comp+'-IN';
//            if(from_type=='outputs') from_comp = from_comp+'-OUT';
//        }
//        if(to_comp==scope.process){
//            if(to_type=='inputs') to_comp = to_comp+'-IN';
//            if(to_type=='outputs') to_comp = to_comp+'-OUT';
//        }
        
        
        if(scope.components[from_comp] && !scope.components[from_comp].ports[from_port]) scope.Component.Add_Port(from_comp,from_type,from_port);
        if(scope.components[to_comp] && !scope.components[to_comp].ports[to_port]) scope.Component.Add_Port(to_comp,to_type,to_port);
        
        
        var good = true;
        if (!scope.components[from_comp]) {
            if (!scope.leftovers.components[from_comp]) scope.leftovers.components[from_comp] = {
                inputs: [],
                outputs: [],
                parameters: []
            };
            scope.leftovers.components[from_comp][from_type].push(from_port);
            good = false;
        }
        if (!scope.components[to_comp]) {
            if (!scope.leftovers.components[to_comp]) scope.leftovers.components[to_comp] = {
                inputs: [],
                outputs: [],
                parameters: []
            };
            scope.leftovers.components[to_comp][to_type].push(to_port);
            good = false;
        }
        if (!good) {
            scope.leftovers.links.push({
                from: from,
                from_type: from_type,
                to: to,
                to_type: to_type,
            });
            return;
        }
        scope.components[from_comp].Add.Link(from_port, to,properties);
    }
    this.Component.LeftOvers = function (callback) {
        var leftovers = jQuery.extend(true, {}, scope.leftovers);
        scope.leftovers = {};
        for (var component in leftovers.components) {
            if(component == scope.process) continue;
            //console.log(leftovers.components[component]);
            scope.Component.New(component, leftovers.components[component]);
            scope.components[component].Modify.Component_Color('#FF0000');
        }
        var properties = {
            color: '#FF0000'
        }
        for (var i = 0; i < leftovers.links.length; i++) {
            var link_obj = leftovers.links[i];
            if(link_obj.from == scope.process) console.log('From is aggregate')
            if(link_obj.from == scope.process) console.log('To is aggregate')
            scope.Component.Add_Link(link_obj.from, link_obj.from_type, link_obj.to, link_obj.to_type,properties);
            
        }
        if(callback) callback();
    }
    this.Component.Select = function (name) {
        //console.log('"' + name + '" was clicked');
        scope._GLOBAL.Menu.Component(name);
    }
    this.Component.Remove = function (name) {
        //Traverse links and nodes and remove all
        scope.components[name].component.remove();
        delete scope.components[name];
    }

    this.InOut = {};
    this.InOut.New = function (name, type) {
        if (typeof name === 'undefined' || name == '') return 'Please supply a valid name.';
        if (typeof scope.components[name] !== 'undefined') return name + ' has already been used.';
        var x = 100;
        if (type == 'outputs') x = window.innerWidth - 200;
        var properties = {
            x: x,
            y: (window.innerHeight - 500) * Math.random() + 250,
            name: name,
            io: true,
            io_type: type
        };
        var component = new Component(scope, properties)
        scope.components[name] = component;

        var port_type = 'inputs';
        if (type == 'inputs') port_type = 'outputs';

        setTimeout(function () {
            scope.components[name].Add.Port(port_type, name);
        }, 100);
        scope.ios[type].push(name);


        return 9999;
    }

    this.Directed_Graph = function () {
        //return;
        var result = joint.layout.DirectedGraph.layout(scope.graph, {
            setLinkVertices: false,
            rankDir: 'LR',
            rankSep: 150,
            marginX: 50,
            marginY: 50,
            clusterPadding: {
                top: 30,
                left: 10,
                right: 10,
                bottom: 10
            }
        });
        console.log(result);
    }




    this._goodConnectionQ = function (source_component, target_component, source_port, target_port) {
        if (source_component == target_component) return false;
        var link_name = source_component + '.' + source_port + ':' + target_component + '.' + target_port;
        if (scope.components[source_component]._linkExistsQ(link_name) || scope.components[target_component]._linkExistsQ(link_name)) return false;
        return true;

    }

    //INIT
    $(document).ready(function () {
        scope.graph = new joint.dia.Graph;
        scope.directed_graph = new joint.dia.Graph;
        scope.paper = new joint.dia.Paper({
            el: $('#paper-create'),
            width: window.innerWidth * 0.99,
            height: window.innerHeight * 0.99,
            gridSize: 1,
            model: scope.graph,
            snapLinks: true,
//            embeddingMode: true,
//            validateEmbedding: function(childView, parentView) {
//
//                return parentView.model instanceof joint.shapes.devs.Coupled;
//            },
//
//            validateConnection: function(sourceView, sourceMagnet, targetView, targetMagnet) {
//
//                return sourceMagnet != targetMagnet;
//            }
        });

        var paper = scope.paper;
        paper.on('blank:pointerdown',
            function(event, x, y) {
                scope.dragStartPosition = { x: x, y: y};
            }
        );
        paper.on('cell:pointerup blank:pointerup', function(cellView, x, y) {
            delete scope.dragStartPosition;
        });
        $("#paper-create").mousemove(function(event) {
            if(scope.dragStartPosition) paper.setOrigin(event.offsetX - scope.dragStartPosition.x, event.offsetY - scope.dragStartPosition.y);
        });

        scope.graph.on('change:source change:target', function (link) {
            if (link.get('source').id && link.get('target').id) {
                // both ends of the link are connected.
                scope.linkJustAdded = true;
                setTimeout(function () {
                    scope.linkJustAdded = false;
                }, 200)
            }
        })
        scope.paper.on('cell:pointerup',
            function (cellView, evt, x, y) {
                if (scope.linkJustRemoved) return;

                //NOTE: when the pointer creates a link, it cannot access the node below it... this will only ever fire components and links
                base = cellView;
                if (typeof cellView.sourceView !== 'undefined') { //link
                    var source_component = cellView.sourceView.model.attributes.attrs['.label'].text;
                    if (cellView.targetView == null) {
                        cellView.remove();
                        return;
                    }
                    var target_component = cellView.targetView.model.attributes.attrs['.label'].text;
                    console.log(cellView.model);
                    var source_port = cellView.model.get('source').port;
                    var target_port = cellView.model.get('target').port;
                    if (!scope._goodConnectionQ(source_component, target_component, source_port, target_port)) {
                        if (scope.linkJustAdded) cellView.remove();
                        return;
                    }
                    
                    if(scope.maps.links[cellView.model.id]){ //link already mapped
                        scope._GLOBAL.Menu.Component(source_component);
                        return;
                    }
                    var link_name = source_component + '.' + source_port + ':' + target_component + '.' + target_port;
                    console.log('Link: ' + source_component + '.' + source_port + ' ---> ' + target_component + '.' + target_port);
                    //console.log('Link: ' + source_component + '.' + source_port + ' ---> ' + target_component + '.' + target_port);
                    var link_name = source_component + '.' + source_port + ':' + target_component + '.' + target_port;
                    cellView.model.set('router', {name: 'metro'});
                    cellView.model.set('connector', {name: 'rounded'});
                    var new_link = new Link(cellView.model);
                    new_link.Color('#FF0000');
                    scope.components[source_component].links[link_name] = new_link;
                    scope.components[target_component].links[link_name] = new_link;
                    scope._GLOBAL.Menu.selected = null;
                    scope._GLOBAL.Menu.Component(source_component);
                    scope.maps.links[cellView.model.id] = link_name;
                    scope.Directed_Graph();
                } else {
                    var component = cellView.model.attributes.attrs['.label'].text;
                    //scope.Component.Select(component);
                }


            }
        );

        scope.graph.on('remove', function (cellView, collection, opt) {
            if (cellView.isLink()) {
                // a link was removed  (cell.id contains the ID of the removed link)
                scope.linkJustRemoved = true;
                setTimeout(function () {
                    scope.linkJustRemoved = false;
                }, 200);
                var link_name = scope.maps.links[cellView.id];
                if (typeof link_name === 'undefined') return;
                var from = link_name.split(':')[0].split('.')[0];
                var to = link_name.split(':')[1].split('.')[0];
                console.log(from);
                console.log(to);
                delete scope.components[from].links[link_name];
                delete scope.components[to].links[link_name];
                scope._GLOBAL.Menu.selected = null;
                scope._GLOBAL.Menu.Component(from);
                scope.Directed_Graph();
            } else {
                //scope.component_graph.removeCells([cellView]);
            }
        });
        
        
        
        scope.graph.on('change:position', function (cell, newPosition, opt) {
            if (opt.skipParentHandler) return;
            if (cell.get('embeds') && cell.get('embeds').length) cell.set('originalPosition', cell.get('position'));
            var parentId = cell.get('parent');
            if (!parentId) return;
            var parent = scope.graph.getCell(parentId);
            var parentBbox = parent.getBBox();
            if (!parent.get('originalPosition')) parent.set('originalPosition', parent.get('position'));
            if (!parent.get('originalSize')) parent.set('originalSize', parent.get('size'));
            var originalPosition = parent.get('originalPosition');
            var originalSize = parent.get('originalSize');
            var newX = originalPosition.x;
            var newY = originalPosition.y;
            var newCornerX = originalPosition.x + originalSize.width;
            var newCornerY = originalPosition.y + originalSize.height;
            _.each(parent.getEmbeddedCells(), function (child) {
                var childBbox = child.getBBox();
                if (childBbox.x < newX) newX = childBbox.x;
                if (childBbox.y < newY) newY = childBbox.y;
                if (childBbox.corner().x > newCornerX) newCornerX = childBbox.corner().x;
                if (childBbox.corner().y > newCornerY) newCornerY = childBbox.corner().y;
            });
            parent.set({
                position: {
                    x: newX,
                    y: newY
                },
                size: {
                    width: newCornerX - newX,
                    height: newCornerY - newY
                }
            }, {
                skipParentHandler: true
            });
        });
        
        
        
        
        
        document.body.onmousedown = function (e) {
            scope.mousedown = true;
        }
        document.body.onmouseup = function () {
            scope.mousedown = false;
        }
        
        
    });
}

