var Graph = function (process_object) {
    //INITIALIZE VARIABLES
    var scope = this;
    this.process = null;
    this.process_object = process_object;
    this.graph = new joint.dia.Graph;
    this.paper = new joint.dia.Paper({
        el: $('#paper-create'),
        width: window.innerWidth * 0.99,
        height: window.innerHeight * 0.99,
        gridSize: 1,
        model: scope.graph
    });

    //DEFINE CLASS FUNCTIONS
    this.Models = {};
    this.Models.Create = function () {
        if (typeof scope.process_object === 'undefined') return console.log('"process_object" undefiend');
        //Main outer loop - this will be some sort of process that contains all the subsequent components
        var cnt1 = 0;
        for (var proc in scope.process_object) {
            if (cnt1 == 1) break; //There should only be one Process - future implementations will store graphs in outer nodes so we can visualize the entire network.
            scope.process = proc;
            var process_group = Models.Process(proc);
            scope.graph.addCell(process_group);
            //Besides the parent process, components and the parent's inputs/outputs, are the only "Models" being used with JointJS
            //inputs/outputs are stand-alone models w/o inputs and outputs of their own
            if (typeof scope.process_object[proc].components === 'object') scope._create_component_models(process_group, scope.process_object[proc].components);
            if (typeof scope.process_object[proc].inputs === 'object') scope._create_IO_models(process_group, scope.process_object[proc].inputs, 'In');
            if (typeof scope.process_object[proc].outputs === 'object') scope._create_IO_models(process_group, scope.process_object[proc].outputs, 'Out');

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
            for (var srcORdst in connections[connection]) {
                var link_target = 'source';
                if (srcORdst == 'destination') link_target = 'target';
                var string_list = connections[connection][srcORdst].split('/');
                var mod = scope.process_object[scope.process][string_list[0]][string_list[1]]._model;
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
            }
            var link = new joint.shapes.devs.Link(link_object);
            scope.graph.addCell(link);
        }
    }
    this.Models.Connect_PortAttachments = function () {
        var components = scope.process_object[scope.process].components;
        if (typeof components !== 'object' || components.length == 0) return console.log('WARNING: No components found.');
        for (var component in components) {

            var parent_model = components[component]._model; //portSelectors
            var parent_group = components[component]._group;
            var src_type_keys = Object.keys(components[component]);
            src_type_keys = _.without(src_type_keys, '_model');
            src_type_keys = _.without(src_type_keys, '_group');
            for (var src_type_idx in src_type_keys) {
                var src_type = src_type_keys[src_type_idx];
                for (var src_obj in components[component][src_type]) {
                    //console.log(component + '/' + src_type + '/' + src_obj);
                    var connected = components[component][src_type][src_obj]._connected;
                    if (typeof connected === 'undefined') connected = false;
                    if (!connected) {
                        //model hasn't been created yet
                        var mdl = Models['component.' + src_type](src_obj);
                        components[component][src_type][src_obj]._model = mdl;
                        scope.graph.addCell(mdl);
                        parent_group.embed(mdl);
                        var child_model = components[component][src_type][src_obj]._model //no portSelectors
                        var child_value = components[component][src_type][src_obj].value;
                        if (typeof child_value === 'undefined') child_value = null;
                        var link_object = {
                            source: {
                                id: parent_model.id,
                                selector: parent_model.getPortSelector(src_obj)
                            },
                            target: child_model
                        }
                        var link = new joint.shapes.devs.Link(link_object);
                        scope.graph.addCell(link);
                    }

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
        scope._constraints();
        scope.Models.Style();
        scope.Models.Text_Nodes();
    }
    this.Models.Style = function () {
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
                            fill: parameter_color
                        };
                        mod.attr(attr);
                    }
                }
            }
            //            var inputs = components[component].inputs;
            //            for(var input in inputs){
            //                if(!inputs[input]._connected){
            //                    var attr = {};
            //                    attr['[port="'+parameter+'"]'] = {fill: nonValue_color}
            //                    mod.attr(attr);
            //                }
            //            }
            var outputs = components[component].outputs;
            for (var output in outputs) {
                if (!outputs[output]._connected) {
                    console.log(output);
                    var attr = {};
                    attr['[port="' + output + '"]'] = {
                        fill: nonValue_color
                    }
                    mod.attr(attr);

                }
            }
        }
    }
    this.Models.Text_Nodes = function () {
        var components = scope.process_object[scope.process].components;
        for (var component in scope.process_object[scope.process].components) {
            var parameters = components[component].parameters;
            if (typeof parameters !== 'undefined') {
                for (var parameter in parameters) {
                    if (typeof parameters[parameter].value !== 'undefined') {
                        //var input_box = '<input id="parameter_input_'+parameter+'" type="text" value="'+parameters[parameter].value+'"></input>';

                        //will have to change from port to a custom html element and create a new group surrounding it

                        var input_box = '<foreignObject x="50" y="50" width="200" height="150"><body xmlns="http://www.w3.org/1999/xhtml"><form><input type="text" value="hello world"/></form></body></foreignObject>';
                        $('.rotatable')
                            .filter(':contains("' + component + '")')
                            .find('.inPorts')
                            .find('.port')
                            .filter(':contains("' + parameter + '")')
                            .find('circle')
                            .html(input_box);
                    }
                }
            }
        }
    }

    //HELPER FUNCTIONS - NOT MEANT TO BE PART OF MAIN CLASS
    this._create_IO_models = function (grp, io_object, io) {
        for (var variable in io_object) {
            io_object[variable]._model = Models[io](variable);
            scope.graph.addCell(io_object[variable]._model);
            if (typeof grp !== 'undefined') grp.embed(io_object[variable]._model);
        }
    }
    this._create_component_models = function (grp, comps) {

        for (var comp in comps) {
            var comp_group = Models.Process(comp);
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

            //            //TEST - see if we can add box to each port requiring a value
            //            var port_types = Object.keys(comps[comp]);
            //            port_types = _.without(port_types,'_model');
            //            //console.log(port_types);
            //            for(var port_type_idx in port_types){
            //                var port_type = port_types[port_type_idx];
            //                //console.log(port_type);
            //                var src_type_keys = Object.keys(comps[comp][port_type]);
            //                src_type_keys = _.without(src_type_keys,'_model');
            //                //console.log(src_type_keys);
            //                for(var src_type_idx in src_type_keys){
            //                    //console.log(comps[comp]);
            //                    //console.log(src_type_keys[src_type_idx]);
            //                    var mdl = Models['component.'+port_type](src_type_keys[src_type_idx]);
            //                    var obj = comps[comp][port_type][src_type_keys[src_type_idx]];
            //                    console.log(obj);
            //                    //if(typeof obj.value !== 'undefined'){
            //                        obj._model = mdl;
            //                        scope.graph.addCell(mdl);
            //                        if (typeof grp !== 'undefined') grp.embed(mdl);
            //                    //}
            //                    
            //                }
            //            }


        }
    }
    this._locate_port = function (name) {
        var list = $('circle');
        for (var port in list) {
            if ($(list[port]).attr('port') == name)
                return $(list[port]);
        }
    }
    //This function constrains each element inside their own parent object
    this._constraints = function () {
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
    }
}