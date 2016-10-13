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
var Component = function (_GLOBAL, params, isProcess) {
    var scope = this;
    this.graph = _GLOBAL.graph;
    this._GLOBAL = _GLOBAL;
    this.component = null;
    this.group = null;
    this.params = params;
    this.id = 'component:'+params.name;
    this.io = false; //determines if it's an input or output
    this.io_type = null;
    this.css = {
        inputs: [],
        outputs: [],
        parameters: []
    }
    this.ports = {
        inputs: {},
        outputs: {},
        parameters: {}
    }
    this.links = {}
    this.color = '#2ECC71';





    this.Add = {};
    this.Add.Port = function (type, name) {
        if (scope.component == null) return;
        var port = 'outPorts';
        if (type == 'inputs' || type == 'parameters') port = 'inPorts';
        var existing_ports = scope.component.get(port);
        var existing_length = existing_ports.length;
        if (existing_ports.indexOf(name) > -1) return;// console.log('Port('+ type + ', ' + name + ') already exists for "'+scope.params.name+'".');
        existing_ports.push(name);
        var css_link = '.' + port + '>.port' + existing_length;
        scope.component.set(port, existing_ports);
        scope.css[type].push(css_link);
        scope.component.updatePortsAttrs();
        scope.ports[type][name] = new Port(scope, name, type, css_link);
        scope.Beautify();

    }
    this.Add.Link = function(from_port,to,properties){
        //to --> component.port
        var from_comp = scope.params.name;
        var   to_list =   to.split('.');
        if(to_list.length != 2) return console.log('!!!! WARNING !!!! Adding a link requires links of length 2.');
        var   to_comp =   to_list[0];
        var   to_port =   to_list[1];
        if(scope.params.name==to_comp) return console.log('!!!! WARNING !!!! Components cannot be the same.');
        var link_name = scope.params.name+'.'+from_port+':'+to;
        if(scope._linkExistsQ(link_name)) return console.log('Link already defined');
        var to_component = scope._GLOBAL.components[to_comp];
        if(typeof to_component === 'undefined') return console.log('!!!! WARNING !!!! That is not a defined component. Options are: '+Object.keys(scope._GLOBAL.components));
        var available_from_ports = _.flatten([Object.keys(scope.ports.inputs),Object.keys(scope.ports.outputs),Object.keys(scope.ports.parameters)]);
        var available_to_ports = _.flatten([Object.keys(to_component.ports.inputs),Object.keys(to_component.ports.outputs),Object.keys(to_component.ports.parameters)]);
        if(available_from_ports.indexOf(from_port)==-1) return console.log('!!!! WARNING !!!! "'+from_port+'" is not a defined port for "'+from_comp+'".\nOptions are: '+available_from_ports);
        if(available_to_ports.indexOf(to_port)==-1) return console.log('!!!! WARNING !!!! "'+to_port+'" is not a defined port for "'+to_comp+'".\nOptions are: '+available_to_ports);
        to_component = to_component.component;
        
        var link_object = {
            source: {
                id: scope.component.id, //model.id
                selector: scope.component.getPortSelector(from_port) //model.getPortSelector(port_name)
            },
            target: {
                id: to_component.id,
                selector: to_component.getPortSelector(to_port)
            },
            router: { name: 'metro' },
            connector: { name: 'rounded' }
        }
        var link = new joint.shapes.devs.Link(link_object);
        //console.log('About to embed link: '+from_comp+'.'+from_port+', '+to);
        
        scope.graph.addCell(link);
        //if(scope._GLOBAL.process != scope.params.name && scope._GLOBAL.process != scope._GLOBAL.components[to_comp].params.name) scope._GLOBAL.directed_graph.addCell(link);
        var new_link = new Link(link);
        var color = '#0000FF';
        if(properties){
            if(properties.color) color = '#FF0000';
        }
        new_link.Color(color);
        //console.log(link_name);
        scope.links[link_name] = new_link;
        scope._GLOBAL.components[to_comp].links[link_name] = new_link;
        scope._GLOBAL.maps.links[link.id] = link_name;
        //scope._GLOBAL.Directed_Graph();
        scope.Beautify();
    }
    
    this.Reroute_Link = function(from_port,to,new_to){
        var from_comp = scope.params.name;
        var   to_list =   to.split('.');
        if(to_list.length != 2) return console.log('!!!! WARNING !!!! Adding a link requires links of length 2.');
        var   to_comp =   to_list[0];
        var   to_port =   to_list[1];
        if(scope.params.name==to_comp) return console.log('!!!! WARNING !!!! Components cannot be the same.');
        var link_name = scope.params.name+'.'+from_port+':'+to;
        if(!scope._linkExistsQ(link_name)) return console.log('Link does not exist.');
        scope.Add.Link(from_port,new_to);
        scope.Remove.Link(from_port,to);
    }
    
    this.Remove = {};
    this.Remove.Port = function(port){
        //remove links attached in this component and any component affected --> Call Remove.Link
        //remove node and all references
        var type = port.split(':')[0];
        var name = port.split(':')[1];
        var needs_removal = scope._linksAttached(name);
        for(var i=0; i<needs_removal.length; i++){
            var from = needs_removal[i].split(':')[0];
            var   to = needs_removal[i].split(':')[1];
            var mine = from;
            var other = to;
            if(mine.split('.')[0]!=scope.params.name){
                mine = to;
                other = from;
            }
            scope.Remove.Link(mine.split('.')[1],other);
            scope._GLOBAL.components[other.split('.')[0]].Remove.Link(other.split('.')[1],mine);
        }
        var port_object = scope.ports[type][name];
        scope.css[type] = _.without(scope.css[type],port_object.css_link);
        delete scope.ports[type][name];
        var port = 'outPorts';
        if (type == 'inputs' || type == 'parameters') port = 'inPorts';
        var existing_ports = scope.component.get(port);
        existing_ports = _.without(existing_ports,name);
        scope.component.set(port, existing_ports);
        scope.component.updatePortsAttrs();
        scope.Beautify();
    }
    this.Remove.Link = function(from_port, to){
        //Remove link and all references
        var   to_list =   to.split('.');
        if(to_list.length != 2) return console.log('Adding a link requires links of length 2.');
        var   to_comp =   to_list[0];
        var   to_port =   to_list[1];
        if(scope.params.name==to_comp) return console.log('Components cannot be the same.');
        var link_name = scope.params.name+'.'+from_port+':'+to;
        var link_name_reversed = to+':'+scope.params.name+'.'+from_port;
        if(!scope._linkExistsQ(link_name) && !scope._linkExistsQ(link_name_reversed)) return console.log('Link does not exist.');
        var destroy_me = scope.links[link_name];
        if(typeof destroy_me === 'undefined') destroy_me = scope.links[link_name_reversed];
        destroy_me.link.remove();
        delete  destroy_me;
        
    }
    

    this.Modify = {};
    this.Modify.Component_Label = function (text) {
        scope.component.attr('.label/text', text);
        //scope.group.attr('text/text',text);
    }
    this.Modify.Component_Color = function (color) {
        scope.component.attr('rect/fill', color);
        //scope.group.attr('text/text',text);
    }
    this.Get_Ports = function (type) {
        var types = ['inputs', 'outputs', 'parameters'];
        if (types.indexOf(type) < 0) return 'Unknown type (' + type + ')';
        var port_type = 'inPorts';
        if (type == 'outputs') port_type = 'outPorts';
        return scope.component.get(port_type);
    }
    this.Get_PortIDs = function (type) {
        var ids = [];
        if (typeof type === 'undefined') {
            for (var type in scope.ports) {
                for (var port in scope.ports[type]) {
                    ids.push(scope.ports[type][port].id);
                }
            }
            return ids;
        }
        for (var port in scope.ports[type]) {
            ids.push(scope.ports[type][port].id);
        }
        return ids;
    }
    this.Beautify = function () {
        //This needs to be removed and placed in each port class since it overrides any color updates the user makes to the ports.
        
        var colors = {
            inputs: '#00FF00',
            outputs: '#FF0000',
            parameters: '#FFFFFF'
        }
        var width = scope.component.attributes.size.width;
        var height = scope.component.attributes.size.height;
        
        for (var port_type in scope.css) {
            var list = scope.css[port_type];
            width = Math.max(width,list.length*30);
            height = Math.max(height,list.length*30);
            var original_spacing = height / (scope.css[port_type].length + 1);
            if (port_type == 'parameters') original_spacing = width / (scope.css[port_type].length + 1);
            var refx = 0;
            var refy = 0;
            if (port_type == 'parameters') refy = height;
            if (port_type == 'inputs') refx = 0;
            if (port_type == 'outputs') refx = width;
            
            var spacing = original_spacing;
            for (var i = 0; i < list.length; i++) {
                if (port_type == 'parameters') refx = spacing;
                if (port_type != 'parameters') refy = spacing;
                if(port_type!='outputs') scope.component.attr(list[i] + '/ref-x', refx);
                scope.component.attr(list[i] + '/ref-y', refy);
                spacing += original_spacing;
            }
        }
        //alter the width and height of the component
        if(isProcess) return;
        scope.component.resize(width,height);
//        scope.component.attributes.size.width = width;
//        scope.component.attributes.size.height = height;
    }
    this._linkExistsQ = function(link_name){
        if(typeof scope.links[link_name] !== 'undefined') return true;
        var reverse = link_name.split(':').reverse();
        reverse = reverse.join(':');
        if(typeof scope.links[reverse] !== 'undefined') return true;
        return false;
    }
    this._linksAttached = function(port_name){
        //this will fail if multiple ports have the same name across port types... should not allow the addition of ports with similar names, even if they're of a different type
        var attached = [];
        for(var link in scope.links){
            var from = link.split(':')[0];
            var to   = link.split(':')[1];
            if(from.split('.')[0]==scope.params.name && from.split('.')[1]==port_name) attached.push(link);
            if(to.split('.')[0]==scope.params.name && to.split('.')[1]==port_name) attached.push(link);
        }
        return attached;
    }
    
    //INITIALIZE
    if (!params.x) return console.log('Please supply x value.');
    if (!params.y) return console.log('Please supply y value.');
    if (!params.name) return console.log('Please supply name.');
    if (!params.inputs) params.inputs = [];
    if (!params.outputs) params.outputs = [];
    var width = params.name.width(12)*1.5;
    if(width<100) width=100;
    var height = 100;
    if(params.io) height = 50;
    
    var labelY = 0.05;
    if(isProcess){
        var x = 200;
        if(params.outputs) x = window.innerWidth-200;
        //width = window.innerWidth-400;
        width = 1;
        height = window.innerHeight-200;
        //params.x = 200;
        params.x = x;
        params.y = 100;
        labelY = -0.3;
    }
    
    var component = new joint.shapes.devs.Model({
        position: {
            x: params.x,
            y: params.y
        },
        size: {
            width: width,
            height: height
        },
        inPorts: [],
        outPorts: [],
        attrs: {
            '.label': {
                text: params.name,
                'ref-x': 0.5,
                'ref-y': labelY
            },
            rect: {
                fill: '#2ECC71'
            },
            '.inPorts circle': {
                fill: '#00FF00',
            },
            '.outPorts circle': {
                fill: '#FF0000'
            }
        }
    });
    
    
    
    component.JUNK = params.name;
    
    scope.component = component;
    
    
    //add the nodes
    if (params.inputs) {
        for (var inp in params.inputs) {
            scope.Add.Port('inputs', params.inputs[inp]);
        }
    }
    if (params.outputs) {
        for (var inp in params.outputs) {
//            console.log('Adding output: '+params.outputs[inp])
            scope.Add.Port('outputs', params.outputs[inp]);
        }
    }
    if (params.parameters) {
        for (var inp in params.parameters) {
            scope.Add.Port('parameters', params.parameters[inp]);
        }
    }
    if(params.io){
        this.io = params.io;
        this.io_type = params.io_type;
    }
    
    //if(scope._GLOBAL.process != params.name) console.log('About to Embed Component: '+params.name);
    //if(scope._GLOBAL.process != params.name) scope._GLOBAL.components[scope._GLOBAL.process].component.embed(component); //if it's not the parent, embed the component
    scope.graph.addCell(component);
    //if(scope._GLOBAL.process != params.name) scope._GLOBAL.directed_graph.addCell(component);
    return this;
}