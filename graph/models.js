var Models = {};
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
            width: name.width() + 20,
            height: 30
        },
        attrs: attributes
    });
    return el;
}
Models['component.inputs'] = function(name){
    return Models._template(name, '', {
        rect: {
            rx: 2,
            ry: 2,
            fill: '#66FF66',
            stroke: '#4B4A67',
            'stroke-width': 2
        }
    });
}
Models['component.outputs'] = function(name){
    return Models._template(name, '', {
        rect: {
            rx: 2,
            ry: 2,
            fill: '#E74C3C',
            stroke: '#4B4A67',
            'stroke-width': 2
        }
    });
}
Models['component.parameters'] = function(name){
    return Models._template(name, '', {
        rect: {
            rx: 2,
            ry: 2,
            fill: '#0066ff',
            stroke: '#4B4A67',
            'stroke-width': 2
        }
    });
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
                'ref-y': 0.5
            },
            //rect: { fill: '#2ECC71' },
            rect: {
                fill: color
            },
            '.inPorts circle': {
                fill: '#66ff33'
            },
            '.outPorts circle': {
                fill: '#E74C3C'
            },
            //'.inPorts': {transform: 'rotate(90)', 'ref-x':0.99,'ref-y':-0.3}
        }
    });
    //m1.attr({ '[port="intercept"]': { fill: 'blue' } })
    return m1;
}
Models.Parameter = function (name, value, attrs) {
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
            width: name.width() + 20,
            height: 30
        },
        attrs: attributes
    });
    return el;
}
Models.In = function (name) {
    return Models.Parameter(name, '', {
        rect: {
            rx: 2,
            ry: 2,
            fill: '#66FF66',
            stroke: '#4B4A67',
            'stroke-width': 2
        }
    });

}
Models.Out = function (name) {
    return Models.Parameter(name, '', {
        rect: {
            rx: 2,
            ry: 2,
            fill: '#FF3300',
            stroke: '#4B4A67',
            'stroke-width': 2
        }
    });

}
Models.Process = function (name) {
    return Models.Parameter(name, '', {
        rect: {
            rx: 2,
            ry: 2,
            fill: '#FFCC00',
            stroke: '#4B4A67',
            'stroke-width': 2
        }
    });

}