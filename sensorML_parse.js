//A SIMPLE XML TO JSON CONVERTER, TAILORED TO SensorML 2.0
var xmlToJson = function(xml) {
    // Create the return object
    var obj = {};
    if (xml.nodeType == 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) { // text
        obj = xml.nodeValue;
    }
    // do children
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof (obj[nodeName]) == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof (obj[nodeName].push) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
};
var sensorMLhandler = function (json) {
    var object = {};
    for (var key in json) {
        //if(key=='sml:AggregateProcess') object[json[key]['gml:name']['#text']] = sensorMLhandler(json[key],{});
        if (key == 'sml:AggregateProcess') {
            object[json[key]['gml:name']['#text']] = {
                components: componentHandler(json[key]),
                connections: connectionHandler(json[key]),
                inputs: getOutputsAndInputs(json[key]['sml:inputs']['sml:InputList'], 'input'),
                outputs: getOutputsAndInputs(json[key]['sml:outputs']['sml:OutputList'], 'output')
            }
        }
    }
    return object;
}
var getOutputsAndInputs = function (inputs, type) {
    var list = {};
    var sml = 'sml:' + type;
    for (var input in inputs) {
        if (input == sml) {
            //console.log('Input found: '+input+ ': '+inputs[input]['@attributes']['name']);
            //console.log(inputs[input]);
            if (typeof inputs[input].push !== 'undefined') {
                //console.log('Input is an array.');
                for (var j = 0; j < inputs[input].length; j++) {
                    list[ inputs[input][j]['@attributes']['name'] ] = {};
                }
            } else {
                //console.log('Input is an object');
                list[ inputs[input]['@attributes']['name'] ] = {};
            }

        }
    }
    return list;
}
var getParameters = function (params) {
    var list = {};
    for (var param in params) {
        if (param == 'sml:parameter') {
            if (typeof params[param]['swe:DataRecord'] !== 'undefined') {
                var field = params[param]['swe:DataRecord']['swe:field'];
                if (typeof field.push === 'undefined') {
                    list[field['@attributes']['name']] = field['swe:Quantity']['swe:value']['#text'];
                } else {
                    for (var k = 0; k < field.length; k++) {
                        list[field[k]['@attributes']['name']] = field[k]['swe:Quantity']['swe:value']['#text'];
                    }
                }
            } else if (typeof params[param]['swe:Quantity'] !== 'undefined') {
                list[params[param]['@attributes']['name']] ={
                    value: params[param]['swe:Quantity']['swe:value']['#text']
                }
            }
        }
    }
    return list;
}
var componentHandler = function (obj) {
    var components = {};
    var componentsList = obj['sml:components']['sml:ComponentList']['sml:component'];
    for (var i = 0; i < componentsList.length; i++) {
        var componentObj = jQuery.extend(true, {}, componentsList[i]);
        var component = {
            inputs: [],
            outputs: []
        };
        var inputs = componentObj['sml:SimpleProcess']['sml:inputs']['sml:InputList'];
        var outputs = componentObj['sml:SimpleProcess']['sml:outputs']['sml:OutputList'];
        var params = componentObj['sml:SimpleProcess']['sml:parameters']['sml:ParameterList'];
        var name = componentObj['@attributes']['name'];
        components[name] = {
            inputs: getOutputsAndInputs(inputs, 'input'),
            outputs: getOutputsAndInputs(outputs, 'output'),
            parameters: getParameters(params)
        }
    }
    return components;
}
var connectionHandler = function (obj) {
    var connections = [];
    var connectionsList = obj['sml:connections']['sml:ConnectionList']['sml:connection'];
    for (var i = 0; i < connectionsList.length; i++) {
        //connectionsList[i]['sml:Link']['sml:source']['ref'];
//        <sml:Link>
//          <sml:source ref="PressureObservableProcess/outputs/waveHeightFromPressure"/>
//          <sml:destination ref="this/outputs/PressureObsProcessOutputs/waveHeightFromPressure"/>
//        </sml:Link>
        
        var source_link  =connectionsList[i]['sml:Link']['sml:source']['@attributes']['ref'];
        var destination_link = connectionsList[i]['sml:Link']['sml:destination']['@attributes']['ref'];
        
//        var source_split = source_link.split('/');
//        var destination_split = destination_link.split('/');
//        if(source_split.length==4) source_link = source_split[1]+'/'+source_split[2]+'/'+source_split[3];
//        if(destination_split.length==4) destination_link = destination_split[1]+'/'+destination_split[2]+'/'+destination_split[3];
//        var source_split = source_link.split('/');
//        var destination_split = destination_link.split('/');
//        if(source_split.length==2 && destination_link.length!=2){
//            source_link = 'this/'+source_split[0]+'/'+destination_split[0]+'/'+destination_split[2];
//        }
//        if(destination_split.length==2 && source_link.length!=2){
//            destination_link = 'this/'+destination_split[0]+'/'+source_split[0]+'/'+source_split[2];
//        }
        
//        if(source_link.split('/').length==2) source_link = 'this/'+source_link;
//        if(destination_link.split('/').length==2) destination_link = 'this/'+destination_link;
        connections.push({
            source: source_link,
            destination: destination_link
        });
    }
    return connections;
}