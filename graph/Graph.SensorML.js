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
        jQuery.get(link, function (XML) {
            //console.log(XML)
            var json = xml2json(XML);
            scope.json = json;
            //console.log(json);
            for(var type in json){
                if(typeof scope._JSONparser[type] !== 'undefined') {
                    scope._JSONparser[type](json[type]);
                }
            }
        }).fail(function () {
            alert('The link: "' + link + '", was not available.');
        });
        
    }
    this.XML.Export = function () {
        if (scope.json == null) return console.log('No json to export');
        var xml = json2xml(JSON.stringify(scope.json));
        console.log(xml);
        return xml;
    }
    
    this._JSONparser = {
        AggregateProcess: function(json){
            if(json.inputs) scope._JSONparser.inputs(json.inputs);
            if(json.outputs) scope._JSONparser.outputs(json.outputs);
            if(json.components) scope._JSONparser.components(json.components);
            if(json.connections) scope._JSONparser.connections(json.connections);
        },
        SimpleProcess: function(json,component){
            if(typeof component === 'undefined') return console.log('A "SimpleProcess" was requested without a name.');
            scope._GLOBAL.Graph.Component.New(component);
            setTimeout(function(){
                if(json.inputs) scope._JSONparser.inputs(json.inputs,component);
                if(json.outputs) scope._JSONparser.outputs(json.outputs,component);
                if(json.parameters) scope._JSONparser.parameters(json.parameters,component);
            },500)
            
        },
        inputs: function(json,component){
            if(json.InputList) scope._JSONparser.InputList(json.InputList,component);
        },
        InputList: function(json,component){
            if(json.input) scope._JSONparser.input(json.input,component);
        },
        input: function(json,component){
            if(typeof json.push === 'undefined'){
                //if(json.Quantity) ;
                if(json._name && typeof component !== 'string') scope._GLOBAL.Graph.InOut.New(json._name,'inputs');
                if(json._name && typeof component === 'string') scope._GLOBAL.Graph.Component.Add_Port(component,'inputs',json._name);
            }else{
                for(var i=0; i<json.length; i++){
                    //if(json[i].Quantity) ;//nothing
                    if(json[i]._name && typeof component !== 'string') scope._GLOBAL.Graph.InOut.New(json[i]._name,'inputs');
                    if(json._name && typeof component === 'string') scope._GLOBAL.Graph.Component.Add_Port(component,'inputs',json[i]._name);
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
                if(json._name && json.SimpleProcess) scope._JSONparser.SimpleProcess(json.SimpleProcess,json._name);
            }else{
                for(var i=0; i<json.length; i++){
                    if(json[i]._name && json[i].SimpleProcess) scope._JSONparser.SimpleProcess(json[i].SimpleProcess,json[i]._name);
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
            if(src_list.length == 2){
                var from_comp = src_list[1];
                var from_type = 'inputs';
                if(from_type==src_list[0]) from_type='outputs';
                var from_port = src_list[1];
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
            }else{
                var to_comp = dst_list[1];
                var to_type = dst_list[2];
                var to_port = dst_list[3];
            }
//            console.log('From: '+from_comp+' - '+from_type+' - '+from_port);
//            console.log('To  : '+to_comp+' - '+to_type+' - '+to_port);
            var from = from_comp+'.'+from_port;
            var to = to_comp+'.'+to_port;
            setTimeout(function(){
                scope._GLOBAL.Graph.Component.Add_Link(from,to);
            },1000)
            
        }
    }
}














