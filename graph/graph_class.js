var Graph = function(process_object){
    //INITIALIZE VARIABLES
    var scope = this;
    this.process = null;
    this.process_object = process_object;
    this.graph = new joint.dia.Graph;
    this.paper = new joint.dia.Paper({
        el: $('#paper-create'),
        width: window.innerWidth*0.9,
        height: window.innerHeight*0.9,
        gridSize: 1,
        model: scope.graph
    });
    
    //DEFINE CLASS FUNCTIONS
    this.Models = {};
    this.Models.Create = function(){
        if(typeof scope.process_object === 'undefined') return console.log('"process_object" undefiend');
        //Main outer loop - this will be some sort of process that contains all the subsequent components
        var cnt1 = 0;
        for(var proc in scope.process_object){
            if(cnt1==1) break; //There should only be one Process - future implementations will store graphs in outer nodes so we can visualize the entire network.
            scope.process = proc;
            var process_group = Models.Process(proc);
            scope.graph.addCell(process_group);
            //Besides the parent process, components and the parent's inputs/outputs, are the only "Models" being used with JointJS
            //inputs/outputs are stand-alone models w/o inputs and outputs of their own
            if(typeof scope.process_object[proc].inputs === 'object') scope._create_IO_models(process_group,scope.process_object[proc].inputs,'In');
            if(typeof scope.process_object[proc].outputs === 'object') scope._create_IO_models(process_group,scope.process_object[proc].outputs,'Out');
            //Components are treated differently - they'll be nodes with their own inputs/outputs
            if(typeof scope.process_object[proc].components === 'object') scope._create_component_models(process_group,scope.process_object[proc].components );
            cnt1++;
        }
    }
    this.Models.Connect = function(){
        /*
        This section is greatly subjective... it's hard-coded to the current SensorML 2.0 configuration
        Any tweak of the schema could throw this off. As the structure becomes more understood, I'd like to
        automate the tree traversal.
        */
        var connections = scope.process_object[scope.process].connections;
        if(typeof connections !== 'object' || connections.length==0 ) return console.log('WARNING: No connections found.');
        for(var connection in connections){
            var link_object = {};
            for(var srcORdst in connections[connection]){
                var link_target = 'source';
                if(srcORdst=='destination') link_target='target';
                var string_list = connections[connection][srcORdst].split('/');
                var mod = scope.process_object[scope.process][string_list[0]][string_list[1]]._model;
                if(typeof mod._portSelectors === 'object'){
                    //TODO: this implies the strin_list.length = 4... not the best method of determining the model type
                    link_object[link_target] = {id:mod.id, selector:mod.getPortSelector(string_list[3]) }
                }else{
                    link_object[link_target] = mod;
                }   
            }
            var link = new joint.shapes.devs.Link(link_object);
            scope.graph.addCell(link);
        }
    }
    this.Models.DirectedGraph = function(){
        joint.layout.DirectedGraph.layout(scope.graph, {
            setLinkVertices: false,
            rankDir: 'LR',
            rankSep: 150,
            marginX: 50,
            marginY: 50,
            clusterPadding: { top: 30, left: 10, right: 10, bottom: 10 }
        });
        
    }
    this.Models.Style = {};
    this.Models.Style.NonValues = function(){
        
    }
    
    //HELPER FUNCTIONS - NOT MEANT TO BE PART OF MAIN CLASS
    this._create_IO_models = function(grp,io_object,io){
        for(var variable in io_object){
            io_object[variable]._model = Models[io](variable);
            scope.graph.addCell( io_object[variable]._model );
            if(typeof grp!=='undefined') grp.embed( io_object[variable]._model );
        }
    }
    this._create_component_models = function(grp,comps){
        for(var comp in comps){
            //function (name, inputs, outputs, x, y, width, height)
            //For now, we are making parameters a part of inputs... They may be isolated models similar to the parent's inputs/outputs - undecided at this point
            var inputs = [];
            var outputs = [];
            var parameters = [];
            if(typeof comps[comp].inputs !== 'undefined' ) inputs = Object.keys(comps[comp].inputs);
            if(typeof comps[comp].outputs !== 'undefined' ) outputs = Object.keys(comps[comp].outputs);
            if(typeof comps[comp].parameters !== 'undefined' ) inputs.push( Object.keys(comps[comp].parameters) ); //this may change
            inputs = _.flatten(inputs);
            //TODO: make height dependent on max # of inputs/outputs
            //TODO: make width dependent on width of string
            comps[comp]._model = Models.Component(comp,inputs,outputs,0,0,100,100); //position doesn't have to be defined... we'll use a directed graph to determine it later
            scope.graph.addCell( comps[comp]._model );
            if(typeof grp!=='undefined') grp.embed( comps[comp]._model );
        }
    }
    this._locate_port = function(name){
        var list = $('circle');
        for(var port in list){
            if($(list[port]).attr('port') == name)
            return $(list[port]);
        }
    }
}

