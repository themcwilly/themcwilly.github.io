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
    this.process = null;
    this.process_object = null;
    this.div = 'paper-create';
    this.graph = null;
    this.component_graph = null;
    this.mousedown = false;
    this.linkJustAdded = false;
    this.linkJustRemoved = false;

    this.components = {};

    this.maps = {
        links: {}
    }
    
    

    this.Component = {};
    this.Component.New = function (name,ports) {
        if (typeof name === 'undefined' || name == '') return 'Please supply a valid name.';
        if (typeof scope.components[name] !== 'undefined') return name + ' has already been used.';
        var properties = {
            x: (window.innerWidth-500)*Math.random()+250,
            y: (window.innerHeight-500)*Math.random()+250,
            name: name
        };
        var component = new Component(scope, properties)
        scope.components[name] = component;
        
        setTimeout(function(){
            if(typeof ports === 'object'){
                for(var port_type in ports){
                    for(var i=0; i<ports[port_type].length; i++){
                        scope.components[name].Add.Port(port_type,ports[port_type][i]);
                    }
                }
            }
            scope.components[name].Beautify();
        },100)
        
        
        
        return 9999;
    }
    this.Component.Add_Port = function(component,type,name){
        if(typeof scope.components[component] === 'undefined') return;
        scope.components[component].Add.Port(type,name);
    }
    this.Component.Add_Link = function(from, to){
        var from_comp = from.split('.')[0];
        var from_port = from.split('.')[1];
        var to_comp = to.split('.')[0];
        var to_port = to.split('.')[1];
        if(typeof scope.components[from_comp] === 'undefined' || typeof scope.components[to_comp] === 'undefined') return;
        scope.components[from_comp].Add.Link(from_port,to);
    }
    this.Component.Select = function (name) {
        //console.log('"' + name + '" was clicked');
        scope._GLOBAL.Menu.Component(name);
    }
    
    this.InOut = {};
    this.InOut.New = function(name,type){
        if (typeof name === 'undefined' || name == '') return 'Please supply a valid name.';
        if (typeof scope.components[name] !== 'undefined') return name + ' has already been used.';
        var x = 100;
        if(type=='outputs') x = window.innerWidth-200;
        var properties = {
            x: x,
            y: (window.innerHeight-500)*Math.random()+250,
            name: name,
            io:true,
            io_type: type
        };
        var component = new Component(scope, properties)
        scope.components[name] = component;
        
        var port_type = 'inputs';
        if(type == 'inputs') port_type = 'outputs';
        setTimeout(function(){
            scope.components[name].Add.Port(port_type,name);
        },100);
        
        
        
        return 9999;
    }
    
    
    
    this.Directed_Graph = function(){
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
        //console.log(result);
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
        scope.component_graph = new joint.dia.Graph;
        scope.paper = new joint.dia.Paper({
            el: $('#paper-create'),
            width: window.innerWidth * 0.99,
            height: window.innerHeight * 0.99,
            gridSize: 1,
            model: scope.graph
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
                if(scope.linkJustRemoved) return;
                
                //NOTE: when the pointer creates a link, it cannot access the node below it... this will only ever fire components and links
                var base = cellView;
                if (typeof cellView.sourceView !== 'undefined') { //link
                    var source_component = cellView.sourceView.model.attributes.attrs['.label'].text;
                    if (cellView.targetView == null) {
                        cellView.remove();
                        return;
                    }
                    var target_component = cellView.targetView.model.attributes.attrs['.label'].text;
                    var source_port = cellView.model.get('source').port;
                    var target_port = cellView.model.get('target').port;
                    if (!scope._goodConnectionQ(source_component, target_component, source_port, target_port)) {
                        if (scope.linkJustAdded) cellView.remove();
                        return;
                    }
                    //console.log('Link: ' + source_component + '.' + source_port + ' ---> ' + target_component + '.' + target_port);
                    var link_name = source_component + '.' + source_port + ':' + target_component + '.' + target_port;
                    var new_link = new Link(cellView.model);
                    scope.components[source_component].links[link_name] = new_link;
                    scope.components[target_component].links[link_name] = new_link;
                    scope._GLOBAL.Menu.selected = null;
                    scope._GLOBAL.Menu.Component(source_component);
                    scope.maps.links[cellView.model.id] = link_name;
                    scope.Directed_Graph();
                } else {
                    var component = cellView.model.attributes.attrs['.label'].text;
                    //console.log('Selected Component: ' + component);
                    scope.Component.Select(component);
                }


            }
        );
//        scope.graph.on('add', function (cellView, collection, opt){
//            //add only the NON-input/outputs so we can easily organize them
//            var isLink = cellView.isLink();
//            if(!isLink){
//                scope.component_graph.addCell(cellView);
//            }
//        });
        scope.graph.on('remove', function (cellView, collection, opt) {
            if (cellView.isLink()) {
                // a link was removed  (cell.id contains the ID of the removed link)
                scope.linkJustRemoved = true;
                setTimeout(function () {
                    scope.linkJustRemoved = false;
                }, 200);
                var link_name  = scope.maps.links[cellView.id];
                if(typeof link_name === 'undefined') return;
                var from = link_name.split(':')[0].split('.')[0];
                var to   = link_name.split(':')[1].split('.')[0];
                delete scope.components[from].links[link_name];
                delete scope.components[to].links[link_name];
                scope._GLOBAL.Menu.selected = null;
                scope._GLOBAL.Menu.Component(from);
                scope.Directed_Graph();
            }else{
                scope.component_graph.removeCells([cellView]);
            }
        })
        document.body.onmousedown = function () {
            scope.mousedown = true;
        }
        document.body.onmouseup = function () {
            scope.mousedown = false;
        }
    });
}




//var Graph = function (_GLOBAL) {
//    //INITIALIZE VARIABLES
//    var scope = this;
//    this.process = null;
//    this.process_object = null;
//    this.div = 'paper-create';
//    this.group = null;
//    //DEFINE CLASS FUNCTIONS
//    this.Models = {};
//    this.Models.Create = function (process_object) {
//        if (typeof process_object === 'undefined') return console.log('"process_object" undefined');
//        scope.process_object = process_object;
//        //Main outer loop - this will be some sort of process that contains all the subsequent components
//        var cnt1 = 0;
//        for (var proc in scope.process_object) {
//            if (cnt1 == 1) break; //There should only be one Process - future implementations will store graphs in outer nodes so we can visualize the entire network.
//            scope.process = proc;
//            var process_group = Models.Group(proc,true);
//            scope.group = process_group;
//            process_group._SensorML = {
//                name: proc,
//                graph_type: 'Group',
//                process_type: 'Process'
//            }
//            scope.graph.addCell(process_group);
//            //Besides the parent process, components and the parent's inputs/outputs, are the only "Models" being used with JointJS
//            //inputs/outputs are stand-alone models w/o inputs and outputs of their own
//            if (typeof scope.process_object[proc].components === 'object') scope._create_component_models(process_group, scope.process_object[proc].components);
//            if (typeof scope.process_object[proc].inputs === 'object') scope._create_IO_models(process_group, scope.process_object[proc].inputs, 'inputs');
//            if (typeof scope.process_object[proc].outputs === 'object') scope._create_IO_models(process_group, scope.process_object[proc].outputs, 'outputs');
//
//            cnt1++;
//        }
//    }
//    this.Models.Connect = function () {
//        /*
//        This section is greatly subjective... it's hard-coded to the current SensorML 2.0 configuration
//        Any tweak of the schema could throw this off. As the structure becomes more understood, I'd like to
//        automate the tree traversal.
//        */
//        var connections = scope.process_object[scope.process].connections;
//        if (typeof connections !== 'object' || connections.length == 0) return console.log('WARNING: No connections found.');
//        for (var connection in connections) {
//            var link_object = {};
//            var pass_thru = {};
//            var changed_by=null;
//            var changes = null;
//            for (var srcORdst in connections[connection]) {
//                var link_target = 'source';
//                if (srcORdst == 'destination') link_target = 'target';
//                var string_list = connections[connection][srcORdst].split('/');
//                var parent = scope.process_object[scope.process][string_list[0]][string_list[1]];
//                var mod = parent._model;
//                if (typeof mod._portSelectors === 'object') {
//                    //TODO: this implies the strin_list.length = 4... not the best method of determining the model type
//                    link_object[link_target] = {
//                        id: mod.id,
//                        selector: mod.getPortSelector(string_list[3])
//                    }
//                    
//                    
//                    //to make finding this later, easier, we'll add an attribute saying it's connected
//                    scope.process_object[scope.process][string_list[0]][string_list[1]][string_list[2]][string_list[3]]._connected = true;
//                } else {
//                    link_object[link_target] = mod;
//                }
//                
//                //add to organizational object & add the pass-thru linkage
//                if(typeof scope.Models._requires_organization.parent === 'undefined') scope.Models._requires_organization.parent = {elements:[]};
//                scope.Models._requires_organization.parent.elements.push(mod);
//                pass_thru[link_target] = mod;
//                
//                if(link_target=='source') changed_by = string_list;
//                if(link_target=='target') changes = string_list;
//                
////                console.log(string_list);
////                console.log(mod);
//            }
//            var link = new joint.shapes.devs.Link(link_object);
//            link.set('router', scope.link_style);
//            scope.graph.addCell(link);
//            if(typeof pass_thru.source._SensorML.pass_thru === 'undefined') pass_thru.source._SensorML.pass_thru = [];
//            pass_thru.source._SensorML.pass_thru.push(pass_thru.target);
//            
//            if(changes!=null && changed_by!=null){
//                //Initialize changed_by
//                var dig = scope.process_object[scope.process];
//                for(var i=0; i<changed_by.length; i++){
//                    dig = dig[changed_by[i]];
//                }
//                dig._changed_by = 'User';
//                dig._changes = 'Result';
//                dig._parent = 'this.'+changed_by[0];
//                
//                //Initialize changes
//                var dig = scope.process_object[scope.process];
//                for(var i=0; i<changes.length; i++){
//                    dig = dig[changes[i]];
//                }
//                dig._changed_by = 'User';
//                dig._changes = 'Result';
//                dig._parent = 'this.'+changed_by[0];
//                
//                
//                //find root
//                var dig = scope.process_object[scope.process];
//                for(var i=0; i<changes.length; i++){
//                    dig = dig[changes[i]];
//                }
//                dig._changed_by = changed_by.join('.');
//                if(changed_by.length==2){
//                    dig._parent = [changed_by[0],changed_by[1]].join('.');
//                }else{
////                    dig._parent = ['this',changed_by[0],changed_by[1]].join('.');
////                    dig._parent = ['this','outputs'].join('.');
//                    dig._parent = 'outputs';
//                }
//                var dig = scope.process_object[scope.process];
//                for(var i=0; i<changed_by.length; i++){
//                    dig = dig[changed_by[i]];
//                }
//                dig._changes = changes.join('.');
//                console.log(changed_by);
//                console.log(changes);
//                if(changed_by.length!=2){
//                    dig._parent = [changed_by[0],changed_by[1]].join('.');
//                }else{
////                    dig._parent = ['this',changed_by[0],changed_by[1]].join('.');
////                    console.log(changes);
////                    console.log(changed_by);
////                    dig._parent = ['this',changed_by[0]].join('.');
//                    dig._parent = changed_by[0];
//                }
//                
//            }
//            
//            
//        }
//    }
//    this.Models._requires_organization = {};
//    this.Models.PortAttachments = function () {
//        var components = scope.process_object[scope.process].components;
//        if (typeof components !== 'object' || components.length == 0) return console.log('WARNING: No components found.');
//        for (var component in components) {
//
//            var parent_model = components[component]._model;
//            scope.Models._requires_organization[component] = {  //organize
//                elements: [parent_model],
//                edges: [],
//                links: []
//            }
//            var parent_group = components[component]._group;
//            var src_type_keys = Object.keys(components[component]);
//            src_type_keys = _.without(src_type_keys, '_model');
//            src_type_keys = _.without(src_type_keys, '_parent_group');
//            src_type_keys = _.without(src_type_keys, '_group');
//            src_type_keys = _.without(src_type_keys, '_changes');
//            src_type_keys = _.without(src_type_keys, '_changed_by');
//            for (var src_type_idx in src_type_keys) {
//                var src_type = src_type_keys[src_type_idx];
//                for (var src_obj in components[component][src_type]) {
////                    console.log(component + '/' + src_type + '/' + src_obj);
//                    var connected = components[component][src_type][src_obj]._connected;
//                    if (typeof connected === 'undefined') connected = false;
//                    if (!connected) {
////                        console.log(component + '/' + src_type + '/' + src_obj);
//                        //model hasn't been created yet
//                        var mdl = Models['component.' + src_type](src_obj);
//                        components[component][src_type][src_obj]._model = mdl;
//                        components[component][src_type][src_obj]._parent_group = parent_group;
//                        scope.graph.addCell(mdl);
//                        parent_group.embed(mdl);
//                        var child_model = components[component][src_type][src_obj]._model;
//                        scope.Models._requires_organization[component].elements.push(child_model); //organize
//                        var child_value = components[component][src_type][src_obj].value;
//                        if (typeof child_value === 'undefined') child_value = null;
//                        if( !isNaN(parseFloat(child_value)) ) child_value = parseFloat(child_value);
//                        child_model._SensorML.value = child_value;
//                        var link_object = {
//                            source: {
//                                id: parent_model.id,
//                                selector: parent_model.getPortSelector(src_obj)
//                            },
//                            target: child_model
//                        }
//                        //console.log(link_object);
//                        scope.Models._requires_organization[component].edges.push(link_object); //organize
//                        var link = new joint.shapes.devs.Link(link_object);
//                        link.set('router', scope.link_style);
//                        link.attr({
//                            '.connection': { stroke: Models._colors[src_type] },
//                            '.marker-source': { fill: 'black'},
//                            '.marker-target': { fill: 'black'}
//                        });
//                        scope.Models._requires_organization[component].links.push(child_model); //organize
//                        scope.graph.addCell(link);
//                        if(src_type=='outputs'){
//                            if(typeof parent_model._SensorML.pass_thru === 'undefined') parent_model._SensorML.pass_thru = [];
//                            parent_model._SensorML.pass_thru.push(child_model);
//                            components[component][src_type][src_obj]._changed_by = src_type + '.' + src_obj;
//                            components[component][src_type][src_obj]._parent = 'components.'+component;
//                        }else{
//                            if(typeof child_model._SensorML.pass_thru === 'undefined') child_model._SensorML.pass_thru = [];
//                            child_model._SensorML.pass_thru.push(parent_model);
//                            components[component][src_type][src_obj]._changes =src_type + '.' + src_obj;
//                            components[component][src_type][src_obj]._parent = 'components.'+component;
//                        }
//                    }
//
//                }
//
//            }
//        }
//    }
//    this.Models.Organize_Groups = function(){
//        var organize = Object.keys(scope.Models._requires_organization);
//        organize = _.without(organize,'parent');
//        for(var i in organize){
//            var group_name = organize[i];
//            var organizational_inspiration = new joint.dia.Graph;
//            var mdls = scope.Models._requires_organization[group_name].elements;
//            var positions = {};
//            var parent;
//            for(var i=0; i<mdls.length; i++){
//                if( mdls[i]._SensorML.parent ) parent = mdls[i];
//                positions[ mdls[i]._SensorML.name ] = jQuery.extend(true,{},mdls[i].attributes.position);
//            }
//            if(typeof parent === 'undefined') return;
//            var parent_width = parent.attributes.size.width;
//            var inPorts = _.intersection(parent.attributes.inPorts,Object.keys(positions) );
//            var outPorts = _.intersection(parent.attributes.outPorts,Object.keys(positions) );
////            console.log('*****');
////            console.log(positions);
////            console.log(inPorts);
////            console.log(outPorts);
//            var inPortAvg = 0;
//            var outPortAvg = 0;
//            for(var i=0; i<inPorts.length; i++){
//                inPortAvg = inPortAvg + positions[inPorts[i]].x;
//            }
//            inPortAvg = inPortAvg/inPorts.length;
//            for(var i=0; i<outPorts.length; i++){
//                outPortAvg = outPortAvg + positions[outPorts[i]].x;
//            }
//            outPortAvg = outPortAvg/outPorts.length;
//            if(inPorts.length > 0 && outPorts.length == 0){ //direct swap
//                parent.position( inPortAvg-parent_width*(2/3),positions[group_name].y  );
//                for(var mdl in mdls){
//                    if( inPorts.indexOf( mdls[mdl]._SensorML.name ) > -1 ) mdls[mdl].position(positions[group_name].x,positions[mdls[mdl]._SensorML.name].y);
//                }
//            }else if(inPorts.length == 0 && outPorts.length > 0){ //direct swap
//                parent.position( outPortAvg-parent_width*(2/3),positions[group_name].y  );
//                for(var mdl in mdls){
//                    if( outPorts.indexOf( mdls[mdl]._SensorML.name ) > -1 ) mdls[mdl].position(positions[group_name].x,positions[mdls[mdl]._SensorML.name].y);
//                }
//            }else{ //in the middle
//                //this assumes the inPorts and outPorts are always on the same side... has been the case so far
//                parent.position( (positions[group_name].x+outPortAvg)/2,positions[group_name].y  );
//                for(var mdl in mdls){
//                    if( inPorts.indexOf( mdls[mdl]._SensorML.name ) > -1 ) mdls[mdl].position(positions[group_name].x,positions[mdls[mdl]._SensorML.name].y);
//                }
//            }
//        }
//    }
//    this.Models.DirectedGraph = function () {
//        
//        joint.layout.DirectedGraph.layout(scope.graph, {
//            setLinkVertices: false,
//            rankDir: 'LR',
//            rankSep: 150,
//            marginX: 50,
//            marginY: 50,
//            clusterPadding: {
//                top: 30,
//                left: 10,
//                right: 10,
//                bottom: 10
//            }
//        });
//    }
//    this.Models.Style = function () {
//        //this retroactively colors the nodes based on whether or not they're connected or not
//        //we don't search for inputs because they're already red
//        var parameter_color = '#66ff33';
//        var nonValue_color = '#ffffff';
//        var components = scope.process_object[scope.process].components;
//        for (var component in scope.process_object[scope.process].components) {
//            var parameters = components[component].parameters;
//            if (typeof parameters !== 'undefined') {
//                for (var parameter in parameters) {
//                    if (typeof parameters[parameter].value !== 'undefined') {
//                        //it has a value - must change the port to take values and add event handler
//                        var mod = components[component]._model;
//                        var attr = {};
//                        attr['[port="' + parameter + '"]'] = {
//                            fill: Models._colors.parameters
//                        };
//                        mod.attr(attr);
//                        console.log(attr);
//                    }
//                }
//            }
//            var inputs = components[component].inputs;
//            for (var input in inputs) {
//                if (!inputs[input]._connected) {
//                    var attr = {};
//                    attr['[port="' + input + '"]'] = {
//                        fill: Models._colors.inputs
//                    }
//                    mod.attr(attr);
//
//                }
//            }
//            var outputs = components[component].outputs;
//            for (var output in outputs) {
//                if (!outputs[output]._connected) {
//                    var attr = {};
//                    attr['[port="' + output + '"]'] = {
//                        fill: Models._colors.outputs
//                    }
//                    mod.attr(attr);
//
//                }
//            }
//        }
//    }
//    this.Models.HTML = function () {
//        var offset = $('#'+scope.div).offset();
//        var top = offset.top;
//        var left = offset.left;
//        for(var component in scope.Models._requires_organization){
//            var models = scope.Models._requires_organization[component].elements;
//            for(var model in models){
//                if(!models[model]._SensorML.parent){
//                    
//                    var name = models[model]._SensorML.name;
////                    console.log(name);
////                    console.log(models[model]);
//                    //This may present an issue when we have elements named the same thing
//                    //However, I could add a reference to the parent after the model has been created
//                    var value = models[model]._SensorML.value;
//                    if(value == null) value = 'N/A';
//                    var id = models[model].id;
//                    
//                    var html = '<div id="'+name+'">';
//                    html = html + '<input id="'+name+'_input" value="'+value+'"></input>';
//                    html = html + '<button id="'+name+'_input_button">Update</button>';
//                    html = html + '</div>'
//                    $('body').append(html);
//                    var xPos = models[model].attributes.position.x;
//                    var yPos = models[model].attributes.position.y;
//                    var width = models[model].attributes.size.width;
//                    $('#'+name).css('position','absolute');
//                    $('#'+name).css('left',xPos+'px');
//                    $('#'+name).css('top',(top+yPos)+'px');
//                    $('#'+name).css('width',width+'px');
//                    $('#'+name+'_input').css('position','relative');
//                    $('#'+name+'_input').css('left','15px');
//                    $('#'+name+'_input').css('top','25px');
//                    $('#'+name+'_input').css('width',(width-20)+'px');
//                    $('#'+name+'_input_button').css('position','relative');
//                    $('#'+name+'_input_button').css('left','15px');
//                    $('#'+name+'_input_button').css('top','25px');
//                    $('#'+name+'_input_button').css('width',(width-20)+'px');
//                    models[model].on('change:position', function(element) {
//                        var name = element._SensorML.name;
//                        var position = element.get('position');
//                        $('#'+name).css('left',position.x+'px');
//                        $('#'+name).css('top',(top+position.y)+'px');
//                    });
//                }
//            }
//        }
//    }
//    this.Models.Eventing = function(parent_function_object){
//        var define_passthrus = function(inputs,remove, server){
//            //remove is set to true for certain elements to remove the previously created button. 
//            //server is a bool that says whether or not the parent function needs to alert the server of changes
//            if(typeof remove === 'undefined') remove = false;
//            for(var input in inputs){
//                var model = inputs[input]._model
//                var triggers = {};
//                
//                if(typeof model !== 'undefined'){
//                    var parent = inputs[input]._parent;
//                    if(typeof parent === 'undefined') return console.log('ERROR: Please alert dev team.');
////                    console.log(input);
////                    console.log(changes);
////                    console.log(parent);
//                    if(remove){
//                        if(remove) $('#'+input+'_input_button').remove();
//                        (function(inp,changes,parent,server){
//                            $('#'+inp+'_input').on('change',function(){
//                                var name = this.id.split('_')[0];
//                                var value = $('#'+name+'_input').val();
//                                parent_function_object.every(name,value,parent,changes);
//                                if(server) parent_function_object.server(name,value,parent,changes);
//                                //console.log('Value of "'+name+'" belongs to "'+parent+'" changed to: '+value+'... which will affect: '+changes);
//                            });
//                        })(input,changes,parent,server)
//                    }else{
//                        var changes = inputs[input]._changes;
//                        if(typeof changes === 'undefined') return console.log('ERROR: Changes undefined');
//                        (function(inp,changes,parent,server){
//                            $('#'+inp+'_input_button').on('click',function(){
//                                var name = this.id.split('_')[0];
//                                var value = $('#'+name+'_input').val();
//                                parent_function_object.every(name,value,parent,changes);
//                                if(server) parent_function_object.server(name,value,parent,changes);
//                                //console.log('Value of "'+name+'" belongs to "'+parent+'" changed to: '+value+'... which will affect: '+changes);
//                            });
//                        })(input,changes,parent,server)
//                    }
//                    
//                }
//                
//            }
//        }
//        var inputs = scope.process_object[scope.process].inputs;
//        define_passthrus(inputs,true,false);
//        var outputs = scope.process_object[scope.process].outputs;
//        define_passthrus(outputs,true,false);
//        for(var component in scope.process_object[scope.process].components ){
//            var inputs = scope.process_object[scope.process].components[component].inputs;
//            var outputs = scope.process_object[scope.process].components[component].outputs;
//            var parameters = scope.process_object[scope.process].components[component].parameters;
//            if(typeof inputs !== 'undefined') define_passthrus(inputs,true,false);
//            if(typeof outputs !== 'undefined') define_passthrus(outputs,true,false);
//            if(typeof parameters !== 'undefined') define_passthrus(parameters,false,true);
//            
//        }
//    }
//
//    //HELPER FUNCTIONS - NOT MEANT TO BE PART OF MAIN CLASS
//    this._create_IO_models = function (grp, io_object, io) {
//        for (var variable in io_object) {
//            io_object[variable]._parent_group = grp;
//            io_object[variable]._model = Models['parent.'+io](variable);
//            io_object[variable]._model._SensorML.process_type = io;
//            io_object[variable]._model._SensorML.graph_type = 'Single';
//            
//            scope.graph.addCell(io_object[variable]._model);
//            if (typeof grp !== 'undefined') grp.embed(io_object[variable]._model);
//        }
//    }
//    this._create_component_models = function (grp, comps) {
//        var junk = 0;
//        for (var comp in comps) {
//            var comp_group = Models.Group(comp);
//            comp_group._SensorML = {
//                name: comp,
//                graph_type: 'Group',
//                process_type: 'Component'
//            }
////            console.log(comp_group.get('size'));
////            setTimeout(function(){
////                var size = comp_group.get('size');
////                console.log(size);
////                size.width = size.width*1.2;
////                console.log(size);
////                comp_group.set('originalSize', size);
////            },3000)
//            //comp_group.set('originalSize', cell.get('size')*1.2);
//            if (junk == 0) scope._junk = comp_group;
//            junk++;
//            grp.embed(comp_group);
//            scope.graph.addCell(comp_group);
//            //function (name, inputs, outputs, x, y, width, height)
//            //For now, we are making parameters a part of inputs... They may be isolated models similar to the parent's inputs/outputs - undecided at this point
//            var inputs = [];
//            var outputs = [];
//            var parameters = [];
//            //scope._create_IO_models(process_group, scope.process_object[proc].inputs, 'In');
//            if (typeof comps[comp].inputs !== 'undefined') inputs = Object.keys(comps[comp].inputs);
//            if (typeof comps[comp].outputs !== 'undefined') outputs = Object.keys(comps[comp].outputs);
//            if (typeof comps[comp].parameters !== 'undefined') inputs = _.flatten([inputs, Object.keys(comps[comp].parameters)]);
//            comps[comp]._model = Models.Component(comp, inputs, outputs, 100, 100);
//            comps[comp]._model._SensorML.graph_type = 'Multi';
//            comps[comp]._model._SensorML.process_type = 'Component';
//            
//            comps[comp]._parent_group = comp_group;
//            scope.graph.addCell(comps[comp]._model);
//            if (typeof grp !== 'undefined') {
//                comp_group.embed(comps[comp]._model);
//                comps[comp]._group = comp_group;
//            }
//
//
//        }
//    }
//    this._init = (function () {
//        scope.graph = new joint.dia.Graph;
//        scope.paper = new joint.dia.Paper({
//            el: $('#paper-create'),
//            width: window.innerWidth * 0.99,
//            height: window.innerHeight * 0.99,
//            gridSize: 1,
//            model: scope.graph
//        });
//        scope.paper.on('cell:pointerdown', 
//            function(cellView, evt, x, y) { 
//                console.log('cell view ' + cellView.model.id + ' was clicked'); 
//            }
//        );
//        scope.link_style = {
//            name: 'metro',
//            args: {
//    //            startDirections: ['top'],
//    //            endDirections: ['bottom'],
//    //            excludeTypes: ['myNamespace.MyCommentElement']
//            }
//        };
//        scope.graph.on('change:size', function (cell, newPosition, opt) {
//            if (opt.skipParentHandler) return;
//            if (cell.get('embeds') && cell.get('embeds').length) {
//                cell.set('originalSize', cell.get('size'));
//            }
//        });
//        scope.graph.on('change:position', function (cell, newPosition, opt) {
//            if (opt.skipParentHandler) return;
//            if (cell.get('embeds') && cell.get('embeds').length) cell.set('originalPosition', cell.get('position'));
//            var parentId = cell.get('parent');
//            if (!parentId) return;
//            var parent = scope.graph.getCell(parentId);
//            var parentBbox = parent.getBBox();
//            if (!parent.get('originalPosition')) parent.set('originalPosition', parent.get('position'));
//            if (!parent.get('originalSize')) parent.set('originalSize', parent.get('size'));
//            var originalPosition = parent.get('originalPosition');
//            var originalSize = parent.get('originalSize');
//            var newX = originalPosition.x;
//            var newY = originalPosition.y;
//            var newCornerX = originalPosition.x + originalSize.width;
//            var newCornerY = originalPosition.y + originalSize.height;
//            _.each(parent.getEmbeddedCells(), function (child) {
//                var childBbox = child.getBBox();
//                if (childBbox.x < newX) newX = childBbox.x;
//                if (childBbox.y < newY) newY = childBbox.y;
//                if (childBbox.corner().x > newCornerX) newCornerX = childBbox.corner().x;
//                if (childBbox.corner().y > newCornerY) newCornerY = childBbox.corner().y;
//            });
//            parent.set({
//                position: {
//                    x: newX,
//                    y: newY
//                },
//                size: {
//                    width: newCornerX - newX,
//                    height: newCornerY - newY
//                }
//            }, {
//                skipParentHandler: true
//            });
//            if(typeof cell._SensorML !== 'undefined'){
////                console.log('*****');
////                console.log(cell);
////                console.log(parent);
//            }
//        });
//    })();
//}