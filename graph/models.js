var Models = {};
Models._colors = {
    parameters: '#FFFFFF',
    inputs: '#66FF33',
    outputs: '#E74C3C'
}
Models._template = function (name, value, attrs) {
    var val = '';
    if (typeof value !== 'undefined' && value != '') val = value;
    var attributes = {
        rect: {
            rx: 2,
            ry: 2,
            fill: '#31D0C6',
            stroke: '#4B4A67',
            'stroke-width': 2
        },
        text: {
            text: name + val,
            fill: 'black',
            'ref-y': 15
        }
    };
    for (var attr in attrs) {
        attributes[attr] = attrs[attr];
    }
    var el = new joint.shapes.basic.Rect({
        size: {
            width: 120,
            height: 60
        },
        attrs: attributes
    });
    return el;
}
Models['component.inputs'] = function(name){
    var mdl = Models._template(name, '', {
        rect: {
            rx: 2,
            ry: 2,
            fill: Models._colors.inputs,
            stroke: '#4B4A67',
            'stroke-width': 2
        }
    });
    mdl._SensorML = {};
    mdl._SensorML.name = name;
    mdl._SensorML.parent = false;
    return mdl;
}
Models['component.outputs'] = function(name){
    var mdl = Models._template(name, '', {
        rect: {
            rx: 2,
            ry: 2,
            fill: Models._colors.outputs,
            stroke: '#4B4A67',
            'stroke-width': 2
        }
    });
    mdl._SensorML = {};
    mdl._SensorML.name = name;
    mdl._SensorML.parent = false;
    return mdl;
}
Models['component.parameters'] = function(name){
    //return Models.Test(name,100);
    
    var mdl = Models._template(name, '', {
        rect: {
            rx: 2,
            ry: 2,
            fill: Models._colors.parameters,
            stroke: '#4B4A67',
            'stroke-width': 2
        }
    });
    mdl._SensorML = {};
    mdl._SensorML.name = name;
    mdl._SensorML.parent = false;
    return mdl;
}
Models['parent.inputs'] = function(name){
    return Models['component.inputs'](name);
}
Models['parent.outputs'] = function(name){
    return Models['component.outputs'](name);
}

Models.Component = function (name, inputs, outputs, x, y, width, height) {
    var color = '#2ECC71';
    if (name == 'this') color = '#FFFFFF'
    if (typeof width === 'undefined') width = name.width();
    if (typeof height === 'undefined') height = Math.max(inputs.length, outputs.length) * 50;
    var m1 = new joint.shapes.devs.Model({
        position: {
            x: x,
            y: y
        },
        size: {
            width: width*5,
            height: height
        },
        inPorts: inputs,
        outPorts: outputs,
        attrs: {
            '.label': {
                text: name,
                'ref-x': 0.5,
                'ref-y': 0.45
            },
            //rect: { fill: '#2ECC71' },
            rect: {
                fill: color
            },
            '.inPorts circle': {
                fill: Models._colors.inputs
            },
            '.outPorts circle': {
                fill: Models._colors.outputs
            },
            //'.inPorts': {transform: 'rotate(90)', 'ref-x':0.99,'ref-y':-0.3}
        }
    });
    //m1.attr({ '[port="intercept"]': { fill: 'blue' } })
    m1._SensorML = {};
    m1._SensorML.name = name;
    m1._SensorML.parent = true;
    return m1;
}
Models.Group = function (name,parent) {
    var color = '#99CCFF';
    if(parent) color = '#ffb84d';
    var attributes = {
        rect: {
            rx: 2,
            ry: 2,
            fill: color,
            stroke: '#4B4A67',
            'stroke-width': 2
        },
        text: {
            text: name,
            fill: 'black',
            'ref-y': 15
        }
    };
    var el = new joint.shapes.basic.Rect({
        size: {
            width: name.width() + 20,
            height: 30
        },
        attrs: attributes
    });
    return el;

}
