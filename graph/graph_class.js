var Graph = function (div,process_object) {
    //INITIALIZE VARIABLES
    var scope = this;
    this.process = null;
    this.process_object = process_object;
    this.div = div;

    //DEFINE CLASS FUNCTIONS
    this.Models = {};
    this.Models.Create = function () {
        if (typeof scope.process_object === 'undefined') return console.log('"process_object" undefined');
        //Main outer loop - this will be some sort of process that contains all the subsequent components
        var cnt1 = 0;
        for (var proc in scope.process_object) {
            if (cnt1 == 1) break; //There should only be one Process - future implementations will store graphs in outer nodes so we can visualize the entire network.
            scope.process = proc;
            var process_group = Models.Group(proc,true);
            scope.graph.addCell(process_group);
            //Besides the parent process, components and the parent's inputs/outputs, are the only "Models" being used with JointJS
            //inputs/outputs are stand-alone models w/o inputs and outputs of their own
            if (typeof scope.process_object[proc].components === 'object') scope._create_component_models(process_group, scope.process_object[proc].components);
            if (typeof scope.process_object[proc].inputs === 'object') scope._create_IO_models(process_group, scope.process_object[proc].inputs, 'inputs');
            if (typeof scope.process_object[proc].outputs === 'object') scope._create_IO_models(process_group, scope.process_object[proc].outputs, 'outputs');

            cnt1++;
        }
    }
    this.Models.Connect = function () {
        /*
        This section is greatly subjective... it's hard-coded to the current SensorML 2.0 configuration
        Any tweak of the schema could throw this off. As the structure becomes more understood, I'd like to
        automate the tree traversal.
        */
        var connections = scope.process_object[scope.process].connections;
        if (typeof connections !== 'object' || connections.length == 0) return console.log('WARNING: No connections found.');
        for (var connection in connections) {
            var link_object = {};
            var pass_thru = {};
            var parents = {};
            var changed_by=null;
            var changes = null;
            for (var srcORdst in connections[connection]) {
                var link_target = 'source';
                if (srcORdst == 'destination') link_target = 'target';
                var string_list = connections[connection][srcORdst].split('/');
                var parent = scope.process_object[scope.process][string_list[0]][string_list[1]];
                parents[link_target] = parent;
                var mod = parent._model;
                if (typeof mod._portSelectors === 'object') {
                    //TODO: this implies the strin_list.length = 4... not the best method of determining the model type
                    link_object[link_target] = {
                        id: mod.id,
                        selector: mod.getPortSelector(string_list[3])
                    }
                    
                    
                    //to make finding this later, easier, we'll add an attribute saying it's connected
                    scope.process_object[scope.process][string_list[0]][string_list[1]][string_list[2]][string_list[3]]._connected = true;
                } else {
                    link_object[link_target] = mod;
                }
                
                //add to organizational object & add the pass-thru linkage
                if(typeof scope.Models._requires_organization.parent === 'undefined') scope.Models._requires_organization.parent = {elements:[]};
                scope.Models._requires_organization.parent.elements.push(mod);
                pass_thru[link_target] = mod;
                
                if(link_target=='source') changed_by = string_list;
                if(link_target=='target') changes = string_list;
                
//                console.log(string_list);
//                console.log(mod);
            }
            var link = new joint.shapes.devs.Link(link_object);
            link.set('router', scope.link_style);
            scope.graph.addCell(link);
            if(typeof pass_thru.source._SensorML.pass_thru === 'undefined') pass_thru.source._SensorML.pass_thru = [];
            pass_thru.source._SensorML.pass_thru.push(pass_thru.target);
            
            if(changes!=null && changed_by!=null){
                //find root
                var dig = scope.process_object[scope.process];
                for(var i=0; i<changes.length; i++){
                    dig = dig[changes[i]];
                }
                dig._changed_by = changed_by.join('.');
                dig._parent = [changes[0],changes[1]].join('.');
                var dig = scope.process_object[scope.process];
                for(var i=0; i<changed_by.length; i++){
                    dig = dig[changed_by[i]];
                }
                dig._changes = changes.join('.');
                dig._parent = [changed_by[0],changed_by[1]].join('.');
            }
            
            
        }
    }
    this.Models._requires_organization = {};
    this.Models.PortAttachments = function () {
        var components = scope.process_object[scope.process].components;
        if (typeof components !== 'object' || components.length == 0) return console.log('WARNING: No components found.');
        for (var component in components) {

            var parent_model = components[component]._model;
            scope.Models._requires_organization[component] = {  //organize
                elements: [parent_model],
                edges: [],
                links: []
            }
            var parent_group = components[component]._group;
            var src_type_keys = Object.keys(components[component]);
            src_type_keys = _.without(src_type_keys, '_model');
            src_type_keys = _.without(src_type_keys, '_group');
            src_type_keys = _.without(src_type_keys, '_changes');
            src_type_keys = _.without(src_type_keys, '_changed_by');
            for (var src_type_idx in src_type_keys) {
                var src_type = src_type_keys[src_type_idx];
                for (var src_obj in components[component][src_type]) {
                    //console.log(component + '/' + src_type + '/' + src_obj);
                    var connected = components[component][src_type][src_obj]._connected;
                    if (typeof connected === 'undefined') connected = false;
                    if (!connected) {
//                        console.log(component + '/' + src_type + '/' + src_obj);
                        //model hasn't been created yet
                        var mdl = Models['component.' + src_type](src_obj);
                        components[component][src_type][src_obj]._model = mdl;
                        scope.graph.addCell(mdl);
                        parent_group.embed(mdl);
                        var child_model = components[component][src_type][src_obj]._model;
                        scope.Models._requires_organization[component].elements.push(child_model); //organize
                        var child_value = components[component][src_type][src_obj].value;
                        if (typeof child_value === 'undefined') child_value = null;
                        if( !isNaN(parseFloat(child_value)) ) child_value = parseFloat(child_value);
                        child_model._SensorML.value = child_value;
                        var link_object = {
                            source: {
                                id: parent_model.id,
                                selector: parent_model.getPortSelector(src_obj)
                            },
                            target: child_model
                        }
                        //console.log(link_object);
                        scope.Models._requires_organization[component].edges.push(link_object); //organize
                        var link = new joint.shapes.devs.Link(link_object);
                        link.set('router', scope.link_style);
                        link.attr({
                            '.connection': { stroke: Models._colors[src_type] },
                            '.marker-source': { fill: 'black'},
                            '.marker-target': { fill: 'black'}
                        });
                        scope.Models._requires_organization[component].links.push(child_model); //organize
                        scope.graph.addCell(link);
                        if(src_type=='outputs'){
                            if(typeof parent_model._SensorML.pass_thru === 'undefined') parent_model._SensorML.pass_thru = [];
                            parent_model._SensorML.pass_thru.push(child_model);
                            components[component][src_type][src_obj]._changed_by = component + '.' + src_type + '.' + src_obj;
                            components[component][src_type][src_obj]._parent = component;
                        }else{
                            if(typeof child_model._SensorML.pass_thru === 'undefined') child_model._SensorML.pass_thru = [];
                            child_model._SensorML.pass_thru.push(parent_model);
                            components[component][src_type][src_obj]._changes = component + '.' + src_type + '.' + src_obj;
                            components[component][src_type][src_obj]._parent = component;
                        }
                    }

                }

            }
        }
    }
    this.Models.Organize_Groups = function(){
        var organize = Object.keys(scope.Models._requires_organization);
        organize = _.without(organize,'parent');
        for(var i in organize){
            var group_name = organize[i];
            var organizational_inspiration = new joint.dia.Graph;
            var mdls = scope.Models._requires_organization[group_name].elements;
            var positions = {};
            var parent;
            for(var i=0; i<mdls.length; i++){
                if( mdls[i]._SensorML.parent ) parent = mdls[i];
                positions[ mdls[i]._SensorML.name ] = jQuery.extend(true,{},mdls[i].attributes.position);
            }
            if(typeof parent === 'undefined') return;
            var parent_width = parent.attributes.size.width;
            var inPorts = _.intersection(parent.attributes.inPorts,Object.keys(positions) );
            var outPorts = _.intersection(parent.attributes.outPorts,Object.keys(positions) );
//            console.log('*****');
//            console.log(positions);
//            console.log(inPorts);
//            console.log(outPorts);
            var inPortAvg = 0;
            var outPortAvg = 0;
            for(var i=0; i<inPorts.length; i++){
                inPortAvg = inPortAvg + positions[inPorts[i]].x;
            }
            inPortAvg = inPortAvg/inPorts.length;
            for(var i=0; i<outPorts.length; i++){
                outPortAvg = outPortAvg + positions[outPorts[i]].x;
            }
            outPortAvg = outPortAvg/outPorts.length;
            if(inPorts.length > 0 && outPorts.length == 0){ //direct swap
                parent.position( inPortAvg-parent_width*(2/3),positions[group_name].y  );
                for(var mdl in mdls){
                    if( inPorts.indexOf( mdls[mdl]._SensorML.name ) > -1 ) mdls[mdl].position(positions[group_name].x,positions[mdls[mdl]._SensorML.name].y);
                }
            }else if(inPorts.length == 0 && outPorts.length > 0){ //direct swap
                parent.position( outPortAvg-parent_width*(2/3),positions[group_name].y  );
                for(var mdl in mdls){
                    if( outPorts.indexOf( mdls[mdl]._SensorML.name ) > -1 ) mdls[mdl].position(positions[group_name].x,positions[mdls[mdl]._SensorML.name].y);
                }
            }else{ //in the middle
                //this assumes the inPorts and outPorts are always on the same side... has been the case so far
                parent.position( (positions[group_name].x+outPortAvg)/2,positions[group_name].y  );
                for(var mdl in mdls){
                    if( inPorts.indexOf( mdls[mdl]._SensorML.name ) > -1 ) mdls[mdl].position(positions[group_name].x,positions[mdls[mdl]._SensorML.name].y);
                }
            }
        }
    }
    this.Models.DirectedGraph = function () {
        
        joint.layout.DirectedGraph.layout(scope.graph, {
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
    }
    this.Models.Style = function () {
        //this retroactively colors the nodes based on whether or not they're connected or not
        //we don't search for inputs because they're already red
        var parameter_color = '#66ff33';
        var nonValue_color = '#ffffff';
        var components = scope.process_object[scope.process].components;
        for (var component in scope.process_object[scope.process].components) {
            var parameters = components[component].parameters;
            if (typeof parameters !== 'undefined') {
                for (var parameter in parameters) {
                    if (typeof parameters[parameter].value !== 'undefined') {
                        //it has a value - must change the port to take values and add event handler
                        var mod = components[component]._model;
                        var attr = {};
                        attr['[port="' + parameter + '"]'] = {
                            fill: Models._colors.parameters
                        };
                        mod.attr(attr);
                    }
                }
            }
            var inputs = components[component].inputs;
            for (var input in inputs) {
                if (!inputs[input]._connected) {
                    var attr = {};
                    attr['[port="' + input + '"]'] = {
                        fill: Models._colors.inputs
                    }
                    mod.attr(attr);

                }
            }
            var outputs = components[component].outputs;
            for (var output in outputs) {
                if (!outputs[output]._connected) {
                    var attr = {};
                    attr['[port="' + output + '"]'] = {
                        fill: Models._colors.outputs
                    }
                    mod.attr(attr);

                }
            }
        }
    }
    this.Models.HTML = function () {
        var offset = $('#'+scope.div).offset();
        var top = offset.top;
        var left = offset.left;
        for(var component in scope.Models._requires_organization){
            var models = scope.Models._requires_organization[component].elements;
            for(var model in models){
                if(!models[model]._SensorML.parent){
                    
                    var name = models[model]._SensorML.name;
//                    console.log(name);
//                    console.log(models[model]);
                    //This may present an issue when we have elements named the same thing
                    //However, I could add a reference to the parent after the model has been created
                    var value = models[model]._SensorML.value;
                    if(value == null) value = 'N/A';
                    var id = models[model].id;
                    
                    var html = '<div id="'+name+'">';
                    html = html + '<input id="'+name+'_input" value="'+value+'"></input>'
                    html = html + '</div>'
                    $('body').append(html);
                    var xPos = models[model].attributes.position.x;
                    var yPos = models[model].attributes.position.y;
                    var width = models[model].attributes.size.width;
                    $('#'+name).css('position','absolute');
                    $('#'+name).css('left',xPos+'px');
                    $('#'+name).css('top',(top+yPos)+'px');
                    $('#'+name).css('width',width+'px');
                    $('#'+name+'_input').css('position','relative');
                    $('#'+name+'_input').css('left','15px');
                    $('#'+name+'_input').css('top','35px');
                    $('#'+name+'_input').css('width',(width-20)+'px');
                    models[model].on('change:position', function(element) {
                        var name = element._SensorML.name;
                        var position = element.get('position');
                        $('#'+name).css('left',position.x+'px');
                        $('#'+name).css('top',position.y+'px');
                    });
                }
            }
        }
    }
    this.Models.Eventing = function(parent_function){
        var define_passthrus = function(inputs){
            for(var input in inputs){
                var model = inputs[input]._model
                var triggers = {};
                if(typeof model !== 'undefined'){
                    var pass_thru = model._SensorML.pass_thru[0];
//                    console.log(pass_thru);
                    var source_component_name = pass_thru._SensorML.name;
                    var target_component_name = pass_thru._SensorML.pass_thru[0]._SensorML.name;
                    var target_nodes = pass_thru._SensorML.pass_thru[0]._SensorML.pass_thru;
                    triggers[input] = [];
                    for(var target_node in target_nodes){
                        var target_node_name = target_nodes[target_node]._SensorML.name;
//                        console.log('Input: '+input+' passes through it\'s parent '+source_component_name+', then '+target_component_name+', and ends up at '+target_node_name);
                        triggers[input].push(target_node_name);
                    }
                    model._SensorML.triggers = triggers[input];
                    //event handling
                    //var name = model._SensorML.name;
                    var changes = inputs[input]._changes;
                    var parent = inputs[input]._parent;
                    if(typeof changes === 'undefined' || typeof parent === 'undefined') return console.log('ERROR: Please alert dev team.');
                    (function(inp,changes,parent){
                        $('#'+inp+'_input').on('change',function(){
                            var name = this.id.split('_')[0];
                            var value = $(this).val();
                            parent_function(name,value,parent,changes);
//                            console.log('Value of "'+name+'" belongs to "'+parent+'" changed to: '+value+'... which will affect: '+changes);
                        });
                    })(input,changes,parent)
                    
                }
                //The following section has been removed since we're not interested in a "waterfall" effect
//                if(typeof model !== 'undefined' && typeof model._SensorML.pass_thru !== 'undefined'){
//                    var pass_thru = model._SensorML.pass_thru[0];
//                    var source_component_name = pass_thru._SensorML.name;
//                    var target_component_name = pass_thru._SensorML.pass_thru[0]._SensorML.name;
//                    var target_nodes = pass_thru._SensorML.pass_thru[0]._SensorML.pass_thru;
//                    triggers[input] = [];
//                    for(var target_node in target_nodes){
//                        var target_node_name = target_nodes[target_node]._SensorML.name;
//                        console.log('Input: '+input+' passes through it\'s parent '+source_component_name+', then '+target_component_name+', and ends up at '+target_node_name);
//                        triggers[input].push(target_node_name);
//                    }
//                    model._SensorML.triggers = triggers[input];
//                    //event handling
//                    //var name = model._SensorML.name;
//                    
//                    $('#'+input+'_input').on('change',function(){
//                        var name = this.id.split('_')[0];
//                        var value = $(this).val();
//                        console.log('Value of "'+name+'" changed to: '+value);
//                        for(var trig in triggers[name]){
//                            console.log('Element "'+name+'" is triggering Element "'+triggers[name][trig]+'" with a value of '+value);
//                            $('#'+triggers[name][trig]+'_input').val(value).trigger('change');
//                        }
//                    });
//                }
                
            }
        }
        var inputs = scope.process_object[scope.process].inputs;
        define_passthrus(inputs);
        for(var component in scope.process_object[scope.process].components ){
            var inputs = scope.process_object[scope.process].components[component].inputs;
            //var outputs = scope.process_object[scope.process].components[component].outputs;
            var parameters = scope.process_object[scope.process].components[component].parameters;
            if(typeof inputs !== 'undefined') define_passthrus(inputs);
            //if(typeof outputs !== 'undefined') define_passthrus(outputs);
            if(typeof parameters !== 'undefined') define_passthrus(parameters);
            
        }
    }

    //HELPER FUNCTIONS - NOT MEANT TO BE PART OF MAIN CLASS
    this._create_IO_models = function (grp, io_object, io) {
        for (var variable in io_object) {
            io_object[variable]._model = Models['parent.'+io](variable);
            scope.graph.addCell(io_object[variable]._model);
            if (typeof grp !== 'undefined') grp.embed(io_object[variable]._model);
        }
    }
    this._create_component_models = function (grp, comps) {
        var junk = 0;
        for (var comp in comps) {
            var comp_group = Models.Group(comp);
            if (junk == 0) scope._junk = comp_group;
            junk++;
            grp.embed(comp_group);
            scope.graph.addCell(comp_group);
            //function (name, inputs, outputs, x, y, width, height)
            //For now, we are making parameters a part of inputs... They may be isolated models similar to the parent's inputs/outputs - undecided at this point
            var inputs = [];
            var outputs = [];
            var parameters = [];
            //scope._create_IO_models(process_group, scope.process_object[proc].inputs, 'In');
            if (typeof comps[comp].inputs !== 'undefined') inputs = Object.keys(comps[comp].inputs);
            if (typeof comps[comp].outputs !== 'undefined') outputs = Object.keys(comps[comp].outputs);
            if (typeof comps[comp].parameters !== 'undefined') inputs = _.flatten([inputs, Object.keys(comps[comp].parameters)]);
            comps[comp]._model = Models.Component(comp, inputs, outputs, 100, 100);
            scope.graph.addCell(comps[comp]._model);
            if (typeof grp !== 'undefined') {
                comp_group.embed(comps[comp]._model);
                comps[comp]._group = comp_group;
            }


        }
    }
    this._init = (function () {
        scope.graph = new joint.dia.Graph;
        scope.paper = new joint.dia.Paper({
            el: $('#'+div),
            width: window.innerWidth * 0.99,
            height: window.innerHeight * 0.99,
            gridSize: 1,
            model: scope.graph
        });
        scope.link_style = {
            name: 'metro',
            args: {
    //            startDirections: ['top'],
    //            endDirections: ['bottom'],
    //            excludeTypes: ['myNamespace.MyCommentElement']
            }
        };
        scope.graph.on('change:size', function (cell, newPosition, opt) {
            if (opt.skipParentHandler) return;
            if (cell.get('embeds') && cell.get('embeds').length) {
                cell.set('originalSize', cell.get('size'));
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
    })();
}