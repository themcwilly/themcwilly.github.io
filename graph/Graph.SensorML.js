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
var x2js = new X2JS();
var xml2json = function (xml_string) {
    return x2js.xml_str2json(xml_string);
}
var json2xml = function (json_string) {
    return x2js.json2xml_str($.parseJSON(json_string));
}

function xmlToString(xmlData) {

    var xmlString;
    //IE
    if (window.ActiveXObject) {
        xmlString = xmlData.xml;
    }
    // code for Mozilla, Firefox, Opera, etc.
    else {
        xmlString = (new XMLSerializer()).serializeToString(xmlData);
    }
    return xmlString;
}




var SensorML = function(_GLOBAL){
    var scope = this;
    this._GLOBAL = _GLOBAL;
    this.json = null;
    this.refined = null;
    
    
    this.XML = {};
    this.XML.Import_Link = function (link) {
        jQuery.get(link, scope.XML.Read).fail(function () {
            alert('The link: "' + link + '", was not available.');
        });
        
    }
    this.XML.Read = function (XML) {
        //console.log(XML)
        var json = xml2json(XML);
        scope.json = json;
        console.log(json);
        for(var type in json){
            scope._JSONparser.GeneralProcess(json[type]);
            //if(typeof scope._JSONparser[type] !== 'undefined') scope._JSONparser[type](json[type]);
        }
        setTimeout(function(){
            console.log('CHECKING FOR LEFTOVERS...');
            scope._GLOBAL.Graph.Component.LeftOvers();
        },4000)
    }
    this.XML.Export = function () {
        if (scope.json == null) return console.log('No json to export');
        var xml = json2xml(JSON.stringify(scope.json));
        console.log(xml);
        return xml;
    }
    
    this._read_file = function(callback){
        var file_reader = function(evt) {
            var files = evt.target.files; // FileList object
            for (var i = 0, f; f = files[i]; i++) {
                var reader = new FileReader();
                reader.onload = (function (theFile) {
                    return function (e) {
                        var file = e.target.result;
                        document.getElementById('file_browser').removeEventListener('change',file_reader);
                        callback(file);
                    };
                })(f);
                reader.readAsText(f)
            }
        }
        document.getElementById('file_browser').addEventListener('change',file_reader);
        document.getElementById('file_browser').click()
    }
    this._get_link = function(link,component){
        jQuery.get(link,function(contents){
            //scope.STUFF.push(contents.documentElement);
            var XML = contents.documentElement.outerHTML;
            var json = xml2json(XML);
            console.log('*************');
            console.log(link);
            console.log(json);
//            if(json.PhysicalSystem) scope._JSONparser.PhysicalSystem(json.PhysicalSystem,component);
//            if(json.AggregateProcess) scope._JSONparser.AggregateProcess(json.AggregateProcess,component);
            if(json.PhysicalSystem) scope._JSONparser.GeneralProcess(json.PhysicalSystem,component);
            if(json.AggregateProcess) scope._JSONparser.GeneralProcess(json.AggregateProcess,component);
        }).fail(function () {
            console.log('The link "'+link+'" was not available.');
        });
    }
    //this.STUFF = [];
    this._JSONparser = {
        GeneralProcess: function(json,component){
            if(component) console.log(component)
            if(json.typeOf) return scope._get_link(json.typeOf['_xlink:href'],component);
            if(component) scope._GLOBAL.Graph.Component.New(component);
            setTimeout(function(){
                if(json.inputs) scope._JSONparser.inputs(json.inputs,component);
                if(json.outputs) scope._JSONparser.outputs(json.outputs,component);
                if(json.parameters) scope._JSONparser.parameters(json.parameters,component);
                if(json.connections) scope._JSONparser.connections(json.connections,component);
                //In the event that a "component-like" object is calling for another component, it's being embedded... MUST WORK OUT THE FUNCTIONALITY HERE
                if(component && json.components){
                    console.log('**** THE FOLLOWING WILL BE EMBEDDED ****   ');
                    console.log(json.components);
                }else{
                    if(json.components) scope._JSONparser.components(json.components);
                }
            },500);
        },
//        AggregateProcess: function(json,component){
//            if(json.typeOf) return scope._get_link(json.typeOf['_xlink:href'],component);
//            if(component) scope._GLOBAL.Graph.Component.New(component);
//            if(json.inputs) scope._JSONparser.inputs(json.inputs,component);
//            if(json.outputs) scope._JSONparser.outputs(json.outputs,component);
//            if(json.parameters) scope._JSONparser.parameters(json.parameters,component);
//            if(json.connections) scope._JSONparser.connections(json.connections,component);
//            if(json.components) scope._JSONparser.components(json.components,component);
//            if(component && json.components){
//                console.log('**** THE FOLLOWING WILL BE EMBEDDED ****   ');
//                console.log(json.components);
//            }else{
//                if(json.components) scope._JSONparser.components(json.components);
//            }
//        },
//        SimpleProcess: function(json,component){
//            if(typeof component === 'undefined') return console.log('A "SimpleProcess" was requested without a name.');
//            scope._GLOBAL.Graph.Component.New(component);
//            setTimeout(function(){
//                if(json.inputs) scope._JSONparser.inputs(json.inputs,component);
//                if(json.outputs) scope._JSONparser.outputs(json.outputs,component);
//                if(json.parameters) scope._JSONparser.parameters(json.parameters,component);
//            },500)
//            
//        },
//        PhysicalSystem: function(json,component){ //THIS IS A GROUP
//            //do we fetch the __name here? it's not consisten with the other _name(s)
////            console.log('PhysicalSystem:'+component);
////            console.log(json);
//            if(json.typeOf) return scope._get_link(json.typeOf['_xlink:href'],component);
//            if(component) scope._GLOBAL.Graph.Component.New(component);
//            setTimeout(function(){
//                if(json.inputs) scope._JSONparser.inputs(json.inputs,component);
//                if(json.outputs) scope._JSONparser.outputs(json.outputs,component);
//                if(json.parameters) scope._JSONparser.parameters(json.parameters,component);
//                //In the event that a "component-like" object is calling for another component, it's being embedded... MUST WORK OUT THE FUNCTIONALITY HERE
//                if(component && json.components){
//                    console.log('**** THE FOLLOWING WILL BE EMBEDDED ****   ');
//                    console.log(json.components);
//                }else{
//                    if(json.components) scope._JSONparser.components(json.components);
//                }
//            },500);
//        },
//        PhysicalComponent: function(json,component){ //What do these turn into?  Just floating components embedded inside a physical system?
//            console.log(component);
//            scope._GLOBAL.Graph.Component.New(component);
//        },
        inputs: function(json,component){
            if(json.InputList) scope._JSONparser.InputList(json.InputList,component);
        },
        InputList: function(json,component){
            if(json.input) scope._JSONparser.input(json.input,component);
        },
        input: function(json,component){
            if(typeof json.push === 'undefined'){
                if(json._name && typeof component !== 'string') scope._GLOBAL.Graph.InOut.New(json._name,'inputs');
                if(json._name && typeof component === 'string') scope._GLOBAL.Graph.Component.Add_Port(component,'inputs',json._name);
            }else{
                for(var i=0; i<json.length; i++){
                    if(json[i]._name && typeof component !== 'string') scope._GLOBAL.Graph.InOut.New(json[i]._name,'inputs');
//                    if(json[i]._name && typeof component !== 'string') console.log('No Component for: '+json[i]._name);
//                    if(json[i]._name && typeof component === 'string') console.log('Adding input to component ('+component+'): '+json[i]._name);
                    if(json[i]._name && typeof component === 'string') scope._GLOBAL.Graph.Component.Add_Port(component,'inputs',json[i]._name);
                }
            }
        },
        outputs: function(json,component){
            if(json.OutputList) scope._JSONparser.OutputList(json.OutputList,component);
        },
        OutputList: function(json,component){
            if(json.output) scope._JSONparser.output(json.output,component);
        },
        output: function(json,component){
            if(typeof json.push === 'undefined'){
                if(json._name && typeof component !== 'string') scope._GLOBAL.Graph.InOut.New(json._name,'outputs');
                if(json._name && typeof component === 'string') scope._GLOBAL.Graph.Component.Add_Port(component,'outputs',json._name);
            }else{
                for(var i=0; i<json.length; i++){
                    if(json[i]._name && typeof component !== 'string') scope._GLOBAL.Graph.InOut.New(json[i]._name,'outputs');
                    if(json[i]._name && typeof component === 'string') scope._GLOBAL.Graph.Component.Add_Port(component,'outputs',json[i]._name);
                }
            }
        },
        parameters: function(json,component){
            if(json.ParameterList) scope._JSONparser.ParameterList(json.ParameterList,component);
        },
        ParameterList: function(json,component){
            if(json.parameter) scope._JSONparser.parameter(json.parameter,component);
        },
        parameter: function(json,component){
            if(typeof json.push === 'undefined'){
                if(json._name && typeof component !== 'string') scope._GLOBAL.Graph.InOut.New(json._name,'parameters');
                if(json._name && typeof component === 'string') scope._GLOBAL.Graph.Component.Add_Port(component,'parameters',json._name);
            }else{
                for(var i=0; i<json.length; i++){
                    if(json[i]._name && typeof component !== 'string') scope._GLOBAL.Graph.InOut.New(json[i]._name,'parameters');
                    if(json[i]._name && typeof component === 'string') scope._GLOBAL.Graph.Component.Add_Port(component,'parameters',json[i]._name);
                }
            }
        },
        components: function(json){
            if(json.ComponentList) scope._JSONparser.ComponentList(json.ComponentList);
        },
        ComponentList: function(json){
            if(json.component) scope._JSONparser.component(json.component);
        },
        component: function(json){
            if(typeof json.push === 'undefined'){
                if(json._name && json['_xlink:href']) scope._get_link(json['_xlink:href'],json._name); //another page
//                if(json._name && json.SimpleProcess && !json['_xlink:href']) scope._JSONparser.SimpleProcess(json.SimpleProcess,json._name);
//                if(json._name && json.PhysicalComponent && !json['_xlink:href']) scope._JSONparser.PhysicalComponent(json.PhysicalComponent,json._name);
                if(json._name && json.SimpleProcess && !json['_xlink:href']) scope._JSONparser.GeneralProcess(json.SimpleProcess,json._name);
                if(json._name && json.PhysicalComponent && !json['_xlink:href']) scope._JSONparser.GeneralProcess(json.PhysicalComponent,json._name);
            }else{
                for(var i=0; i<json.length; i++){
//                    if(json[i]._name && json[i].SimpleProcess && !json[i]['_xlink:href']) scope._JSONparser.SimpleProcess(json[i].SimpleProcess,json[i]._name);
//                    if(json[i]._name && json[i].PhysicalComponent && !json[i]['_xlink:href']) scope._JSONparser.PhysicalComponent(json[i].PhysicalComponent,json[i]._name);
                    if(json[i]._name && json[i].SimpleProcess && !json[i]['_xlink:href']) scope._JSONparser.GeneralProcess(json[i].SimpleProcess,json[i]._name);
                    if(json[i]._name && json[i].PhysicalComponent && !json[i]['_xlink:href']) scope._JSONparser.GeneralProcess(json[i].PhysicalComponent,json[i]._name);
                    if(json[i]._name && json[i]['_xlink:href']) scope._get_link(json[i]['_xlink:href'],json[i]._name); //another page
                }
            }
        },
        connections: function(json){
            if(json.ConnectionList) scope._JSONparser.ConnectionList(json.ConnectionList);
        },
        ConnectionList: function(json){
            if(json.connection) scope._JSONparser.connection(json.connection);
        },
        connection: function(json){
            console.log('LINK:')
            console.log(json)
            if(typeof json.push === 'undefined'){
                if(json.Link) scope._JSONparser.Link(json.Link);
            }else{
                for(var i=0; i<json.length; i++){
                    if(json[i].Link) scope._JSONparser.Link(json[i].Link);
                }
            }
        },
        Link: function(json){
            if(typeof json.destination === 'undefined' || typeof json.source === 'undefined') return console.log('Requires a source and distination to create a link.');
            var src_list = json.source._ref.split('/');
            var dst_list = json.destination._ref.split('/');
            if(src_list.length == 2){ //This is an input or output on the outer edge
                var from_comp = src_list[1];
                var from_type = 'inputs';
                if(from_type==src_list[0]) from_type='outputs';
                var from_port = src_list[1];
            }else if(src_list.length == 3){
                var from_comp = src_list[1];
                var from_type = 'inputs';
                if(from_type==src_list[0]) from_type='outputs';
                var from_port = src_list[2];
            }else{
                var from_comp = src_list[1];
                var from_type = src_list[2];
                var from_port = src_list[3];
            }
            if(dst_list.length == 2){
                var to_comp = dst_list[1];
                var to_type = 'inputs';
                if(to_type==dst_list[0]) to_type='outputs';
                var to_port = dst_list[1];
            }else if(dst_list.length == 3){
                var to_comp = dst_list[1];
                var to_type = 'inputs';
                if(to_type==dst_list[0]) to_type='outputs';
                var to_port = dst_list[2];
            }else{
                var to_comp = dst_list[1];
                var to_type = dst_list[2];
                var to_port = dst_list[3];
            }
//            console.log('From: '+from_comp+' - '+from_type+' - '+from_port);
//            console.log('To  : '+to_comp+' - '+to_type+' - '+to_port);
            if(!from_port) console.log('!!!! WARNING !!!! "From" Port undefined: '+json.source._ref);
            if(!to_port) console.log('!!!! WARNING !!!! "To" Port undefined: '+json.destination._ref);
            var from = from_comp+'.'+from_port;
            var to = to_comp+'.'+to_port;
            setTimeout(function(){
                //console.log('LINK: '+from+' --> '+to);
                scope._GLOBAL.Graph.Component.Add_Link(from,from_type,to,to_type);
            },2000)
            
        }
    }
}














