
/*
*******************
TODO
*******************
need to make a component, node and link class
they'll handle the graphing events, as well as the JSON shallow copies

move events to appropriate class


*/



String.prototype.visualLength = function()  
{
    var ruler = document.getElementById('ruler');
    ruler.innerHTML = this;
    return ruler.offsetWidth;
}

var Process_Graph = function(){
    var scope = this;
    this.properties = {
        scene: null,
        camera: null,
        renderer: null,
        table_objects: {},
        target_objects: [],
        
        focused_on: null,
        link_focus_start: null,
        link_focus_end: null,
        drawing_line: null,
        mousedown: false,
        world_mouse: null,
        screen_bounds: [244,186],
        grid_compartments: [8,6],
        
        animate: false,
        tween_diration: 1000
    }
    this.graph = new Graph();
    this.components = {};
    this.nodes = {};
    this.links = [];
    
    
    this.Add = {};
    this.Add.Component = function(info){
        /*
            {
                id: 'test', 
                topR: 'topR',
                center:'center',
                details:'details'
            }
        */
        if(!info) return;
        if(!info.id) return;
        if(info.id == '') return;
        var component = new Graph_Component(scope,info);
        if(typeof component !== 'undefined') scope.components[info.id] = component;
        //*************************************************
        //*************************************************
        scope.graph.addNode(info.id,{});
        //*************************************************
        //*************************************************
    }
    
    
    this.Add.Link = function(from_port, this_port){
        //ex: parameters.this_port.p1  /  inputs.that_port.i1
        if(typeof from_port !== 'string' || typeof this_port !== 'string') return;
        if(from_port.split('.').length !=3 || this_port.split('.').length!=3) return;
        var start_type = from_port.split('.')[0];
        var start_comp = from_port.split('.')[1];
        var start_node = from_port.split('.')[2];
        var end_type = this_port.split('.')[0];
        var end_comp = this_port.split('.')[1];
        var end_node = this_port.split('.')[2];
        
        if(start_comp!=end_comp){
            if(typeof scope.components[start_comp] === 'undefined' || typeof scope.components[end_comp] === 'undefined') return;
            if(typeof scope.components[start_comp].nodes[start_type][start_node] === 'undefined') return;
            if(typeof scope.components[end_comp].nodes[end_type][end_node] === 'undefined') return;
            //create the reference to the links, and the geometry for simple moving
            scope.components[start_comp].links.push(from_port);
            
            //if line is null, we're adding it manually
            if(scope.properties.drawing_line==null){
                //get the node's current positions
                var start_pos = scope.components[start_comp].nodes[start_type][start_node].object.position.clone();
                scope.components[start_comp].object.localToWorld(start_pos);
                var end_pos = scope.components[end_comp].nodes[end_type][end_node].object.position.clone();
                scope.components[end_comp].object.localToWorld(end_pos);
                var line = scope._link_line(start_pos,end_pos);
                scope.properties.drawing_line = line;
                scope.properties.scene.add(line);
            }
            
            var start_link = {
                link_line: scope.properties.drawing_line,
                link_end: scope.properties.drawing_line.geometry.vertices[0]
            }
            scope.components[start_comp].nodes[start_type][start_node].links.push(start_link);
            
            scope.components[end_comp].links.push(this_port);
            var end_link = {
                link_line: scope.properties.drawing_line,
                link_end: scope.properties.drawing_line.geometry.vertices[1]
            }
            scope.components[end_comp].nodes[end_type][end_node].links.push(end_link);
            console.log('Making a connection from "'+from_port+'" to "'+this_port+'"');
            //*************************************************
            //*************************************************
            scope.graph.addEdge(start_comp,end_comp);
            //*************************************************
            //*************************************************
        }else{
            if(scope.properties.drawing_line!=null) scope.properties.scene.remove(scope.properties.drawing_line);
        }
        scope.properties.drawing_line = null;
        scope.render();
    }
    
    
    
    
    this.Organize_Graph = function(){
        var TL = {x:0,y:0};
        var TR = {x:$('body').width(),y:0};
        var BL = {x:0,y:$('body').height()};
        var BR = {x:$('body').width(),y:$('body').height()};
        var vector = new THREE.Vector3( TL.x, TL.y, -1 ).unproject( scope.properties.camera );
        var layouter = new Graph.Layout.Spring(scope.graph);
        var nodes = scope.graph.nodes;
        var x_bound = scope.properties.screen_bounds[0];
        var y_bound = scope.properties.screen_bounds[1];
        var minX = 10000;
        var maxX = -minX;
        var minY = 10000;
        var maxY = -minY;
        for(var node in nodes){
            var x = nodes[node].layoutPosX;
            var y = nodes[node].layoutPosY;
            minX = Math.min(minX,x);
            minY = Math.min(minY,y);
            maxX = Math.max(maxX,x);
            maxY = Math.max(maxY,y);
        }
        var xRatio = (x_bound)/(maxX-minX);
        var yRatio = (y_bound)/(maxY-minY);
        scope.properties.animate = true;
        setTimeout(function(){
            scope.properties.animate = false;
        },scope.properties.tween_diration+1000);
        scope.animate();
        for(var node in nodes){
            var objX = nodes[node].layoutPosX*xRatio;
            var objY = nodes[node].layoutPosY*yRatio;
            
            var grid_pos = scope.get_grid_position(objX,objY);
            objX = grid_pos.x;
            objY = grid_pos.y;
            
            var obj = scope.components[node].object;
            
            var target = new THREE.Object3D();
            target.position.set(objX,objY,obj.position.z);
            scope.transform(obj,target,scope.components[node].Link_Moved);
            
            
            //obj.position.set(objX,objY,obj.position.z);
            //scope.render();
            //scope.components[node].Link_Moved();
        }
        //scope.render();
    }
    this.get_grid_position = function(x,y){
        var xPoss = [];
        var yPoss = [];
        var dX = 2*scope.properties.screen_bounds[0]/scope.properties.grid_compartments[0];
        var dY = 2*scope.properties.screen_bounds[1]/scope.properties.grid_compartments[1];
        for(var i=-scope.properties.screen_bounds[0]; i<scope.properties.screen_bounds[0]-dX; i+=dX){
            if(Math.abs(x-i) > Math.abs(x-i+dX)) break;
        }
        var rtnX = i;
        for(var i=-scope.properties.screen_bounds[1]; i<scope.properties.screen_bounds[1]-dY; i+=dY){
            if(Math.abs(y-i) > Math.abs(y-i+dY)) break;
        }
        var rtnY = i;
        return {x:rtnX,y:rtnY};
    }
    this.transform = function( object,target,callback ) {
        var duration = 1000;
        new TWEEN.Tween( object.position )
            .to( { x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
        new TWEEN.Tween( object.rotation )
            .to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
        new TWEEN.Tween( this )
            .to( {}, duration * 2 )
            .onUpdate( function(){
                scope.render();
                if(typeof callback=== 'function'){
                    callback();
                }
            })
            .onComplete(function(){object.rotation.set(0,0,0)})
            .start();
    }
    this.transform_all = function( duration ) {
        TWEEN.removeAll();
        var keys = Object.keys(scope.properties.table_objects);
        for ( var i = 0; i < keys.length; i ++ ) {
            var object = scope.properties.table_objects[ keys[i] ];
            var target = scope.properties.target_objects[ i ];
            new TWEEN.Tween( object.position )
                .to( { x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration )
                .easing( TWEEN.Easing.Exponential.InOut )
                .start();
            new TWEEN.Tween( object.rotation )
                .to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration )
                .easing( TWEEN.Easing.Exponential.InOut )
                .start();
        }
        new TWEEN.Tween( this )
            .to( {}, duration * 2 )
            .onUpdate( scope.render )
            .start();
    }
    this.animate = function() {
        if(!scope.properties.animate) return;
        requestAnimationFrame( scope.animate );
        TWEEN.update();
        scope.properties.controls.update();
    }
    this.render = function() {
        scope.properties.renderer.render( scope.properties.scene, scope.properties.camera );
        scope.properties.GLrenderer.render( scope.properties.scene, scope.properties.camera );
    }
    this._link_line = function(start_pos,end_pos){
        var material = new THREE.LineBasicMaterial({
            color: 0x0000ff,
            linewidth: 5
        });
        var geometry = new THREE.Geometry();
        if(typeof start_pos === 'undefined' || typeof end_pos === 'undefined'){
            start_pos = scope.properties.world_mouse.clone()
            start_pos.z = 2;
            end_pos = scope.properties.world_mouse.clone()
            end_pos.z = 2;
        }
        
        geometry.vertices.push(start_pos);
        geometry.vertices.push(end_pos);
        var line = new THREE.Line(geometry, material);
        return line;
    }
    
    setTimeout(function(){
        scope.properties.camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
        scope.properties.camera.position.z = 500;
        scope.properties.scene = new THREE.Scene();
        //CSS Renderer
        scope.properties.renderer = new THREE.CSS3DRenderer();
        scope.properties.renderer.setSize( window.innerWidth, window.innerHeight );
        scope.properties.renderer.domElement.style.position = 'absolute';
        //GL Renderer
        scope.properties.GLrenderer = new THREE.WebGLRenderer();
        scope.properties.GLrenderer.setSize( window.innerWidth, window.innerHeight );
        scope.properties.GLrenderer.domElement.style.position = 'absolute';
        document.getElementById( 'container' ).appendChild( scope.properties.GLrenderer.domElement );
        document.getElementById( 'container' ).appendChild( scope.properties.renderer.domElement );
        
        
        scope.properties.controls = new THREE.TrackballControls( scope.properties.camera, scope.properties.renderer.domElement );
        scope.properties.controls.rotateSpeed = 0.5;
        scope.properties.controls.minDistance = 100;
        scope.properties.controls.maxDistance = 1000;
        scope.properties.controls.noRotate = true;
        scope.properties.controls.noZoom = true;
        window.addEventListener( 'resize', function () {
            scope.properties.camera.aspect = window.innerWidth / window.innerHeight;
            scope.properties.camera.updateProjectionMatrix();
            scope.properties.renderer.setSize( window.innerWidth, window.innerHeight );
            scope.properties.GLrenderer.setSize( window.innerWidth, window.innerHeight );
            scope.render();
        }, false );
        
        scope.Add.Component({id: 'test', top: 'topR',center:'center',details:'details',ports:{inputs:['i1','i2','i3','i4','i5','i6','i7'],outputs:['o1','o2','o3'],parameters:['p1','p2','p3','p4']}})
        scope.Add.Component({id: 'test2',top: 'topR',center:'center',details:'details',ports:{inputs:['theinput1'],outputs:['o1'],parameters:['p1','p2','p3','p4']}})
        scope.Add.Component({id: 'test3',top: 'topR',center:'center',details:'details',ports:{inputs:['i1'],outputs:['o1'],parameters:['p1']}})
        scope.Add.Component({id: 'test4',top: 'topR',center:'center',details:'details',ports:{inputs:['i1'],outputs:['o1'],parameters:['p1']}})
        scope.Add.Component({id: 'test5',top: 'topR',center:'center',details:'details',ports:{inputs:['i1'],outputs:['o1','o2','o3'],parameters:['p1']}});
        
        scope.Add.Link('outputs.test.o1','inputs.test2.theinput1');
        
        document.onmousedown = function(){
            scope.properties.mousedown = true;
        }
        document.onmouseup = function(e){
            scope.properties.mousedown = false;
            scope.properties.focused_on = null;
            if(scope.properties.drawing_line!=null){
                scope.properties.scene.remove(scope.properties.drawing_line);
                scope.properties.drawing_line = null;
            }
            scope.render();
        }
        document.onmouseover = function(e){
            if(e.target.id.indexOf('link_trigger')==-1){
                if(scope.properties.link_focus_start==null) scope.properties.link_focus_end=null;
            }
            if(e.target.id.indexOf('port')==-1){
                if(scope.properties.link_focus_start==null) scope.properties.link_focus_end=null;
            }
        }
        document.onmousemove = function(e){
            var vector = new THREE.Vector3();
            vector.set(
                ( e.x / window.innerWidth ) * 2 - 1,
                - ( e.y / window.innerHeight ) * 2 + 1,
                0.5 );
            vector.unproject( scope.properties.camera );
            var dir = vector.sub( scope.properties.camera.position ).normalize();
            var distance = - scope.properties.camera.position.z / dir.z;
            var pos = scope.properties.camera.position.clone().add( dir.multiplyScalar( distance ) );
            pos.y += 5;
            scope.properties.world_mouse = pos;
            
            //This needs to be moved - maybe not... will decide later
            if(scope.properties.drawing_line!=null){
                var new_end = scope.properties.world_mouse.clone();
                new_end.z = 2;
                scope.properties.drawing_line.geometry.vertices[1].copy(new_end);
                scope.properties.drawing_line.geometry.verticesNeedUpdate = true;
                var end_verts = scope.properties.drawing_line.geometry.vertices[1];
                scope.render();
                return;
            }
        }
    },1);
    
}

var Graph_Component = function(_parent,info){
    var scope = this;
    var element = document.createElement( 'div' );
    var object = new THREE.CSS3DObject( element );
    this.element = element;
    this.object = object;
    this.stacks = {
        inputs: 0,
        outputs: 0,
        parameters: 0
    }
    
    this.nodes = {
        inputs: {},
        outputs: {},
        parameters: {}
    }
    this.links = [];
    
    
    this.Add_Port = function(name,type){
        var port_diam = 20;
        var port_radius = port_diam/2;
        var port_element = document.createElement( 'div' );
        port_element.id = 'port__'+type+'.'+info.id+'.'+name;
        port_element.className = 'port';
        port_element.className += ' port_'+type;
        var portlabel_element = document.createElement( 'div' );
//        var label_offset = port_radius+15;
        var label_offset = name.visualLength()+15;
        portlabel_element.className = 'port';
        portlabel_element.className += ' port_label';
        portlabel_element.innerHTML = name;
        port_element.appendChild(portlabel_element);
        if(type!='inputs') portlabel_element.style.left = label_offset+'px';
        if(type=='inputs') portlabel_element.style.right = label_offset+'px';
        var port_object = new THREE.CSS3DObject( port_element );
        
        //must restructure all the ports - this may conflict with the order - may have to be a seperate list controlling order
        if(type=='parameters'){
            var element_wt = parseFloat(scope.element.style.width.slice(0,scope.element.style.width.length-2));
            var wt = (scope.stacks[type]+1)*port_radius;
            if((wt*2)>element_wt) scope.element.style.width = (2*wt)+'px';
            for(var node in scope.nodes[type]){
                scope.nodes[type][node].object.position.x = wt-port_radius;
                wt -= port_diam;
            }
            port_object.position.y = -parseFloat(scope.element.style.height.slice(0,scope.element.style.height.length-2))/2
            port_object.position.x = wt-port_radius;
        }else{
            var element_ht = parseFloat(scope.element.style.height.slice(0,scope.element.style.height.length-2));
            var ht = (scope.stacks[type]+1)*port_radius;
            if((ht*2)>element_ht) scope.element.style.height = (2*ht)+'px';
            for(var node in scope.nodes[type]){
                scope.nodes[type][node].object.position.y = ht-port_radius;
                ht -= port_diam;
            }

            if(type=='inputs') port_object.position.x = -parseFloat(scope.element.style.width.slice(0,scope.element.style.width.length-2))/2;
            if(type=='outputs') port_object.position.x = parseFloat(scope.element.style.width.slice(0,scope.element.style.width.length-2))/2;
            port_object.position.y = ht-port_radius;
        }
        
        
        
        if(type=='parameters') port_object.rotation.z = -Math.PI/2;
        object.add(port_object);
        scope.nodes[type][name] = {
            object: port_object,
            element: port_element,
            links: []
        }
        scope.stacks[type]++;
        
        
        
        
        var port_events = eventing(_parent,scope);
        port_element.onmousedown = port_events.onmousedown;
        port_element.onmouseover = port_events.onmouseover;
        port_element.onmouseup = port_events.onmouseup;
        port_element.onmousemove = port_events.onmousemove; 
        _parent.render();
        
    }
    this.Link_Moved = function(){
        for(var i=0; i<scope.links.length; i++){
            var type = scope.links[i].split('.')[0];
            var port = scope.links[i].split('.')[2];
            //this better exist.. if not, there's an issue
            var node_position = scope.nodes[type][port].object.position.clone();
            scope.object.localToWorld(node_position);
            //more than one link can occur on a node
            var links = scope.nodes[type][port].links;
            for(var l=0; l<links.length; l++){
                links[l].link_end.set(node_position.x,node_position.y,node_position.z);
                links[l].link_line.geometry.verticesNeedUpdate = true;
            }
            
        }
        _parent.render();
    }
    this.Flip = function(){
        _parent.properties.animate = true;
        setTimeout(function(){
            _parent.properties.animate = false;
        },_parent.properties.tween_diration+1000);
        _parent.animate();
        var obj = scope.object;
        var target = new THREE.Object3D();
        target.position.copy(obj.position.clone());
        target.rotation.y = Math.PI;
        _parent.transform(obj,target,scope.Link_Moved);
    }
    
    element.id = info.id;
    element.className = 'element';
    element.style.backgroundColor = 'rgba(0,127,127,' + ( Math.random() * 0.5 + 0.25 ) + ')';
    
    var width = 0;
    if(info.top){
        var number = document.createElement( 'div' );
        number.id = info.id;
        number.className = 'top';
        width = Math.max(width,number.className.visualLength());
        number.textContent = info.top;
        number.innerHTML = info.id;
        element.appendChild( number );
    }
//    if(info.topR){
//        var number = document.createElement( 'div' );
//        number.id = info.id;
//        number.className = 'number';
//        width = Math.max(width,number.className.visualLength());
//        number.textContent = info.top;
//        number.innerHTML = info.id;
//        element.appendChild( number );
//    }

    info.topL = 'TOP_LEFT'
    if(info.topL){
        var number = document.createElement( 'div' );
        number.id = 'link_trigger__'+info.id;
        number.className = 'flip';
        width = Math.max(width,number.className.visualLength());
        number.innerHTML = 'INFO<br>PNG';
        element.appendChild( number );
        number.onmouseup = scope.Flip;
    }

//    if(info.center){
//        var symbol = document.createElement( 'div' );
//        symbol.id = info.id;
//        symbol.className = 'symbol';
//        width = Math.max(width,symbol.className.visualLength() * 54/12);
//        symbol.textContent = info.id;
//        element.appendChild( symbol );
//    }

    if(info.details){
        var details = document.createElement( 'div' );
        details.id = info.id;
        details.className = 'details';
        width = Math.max(width,details.className.visualLength());
        details.innerHTML = info.details + '<br>' + 'more stuff';
        element.appendChild( details );
    }
    
    width = Math.max(width,200);
    
    object.scale.set(0.3,0.3,0.3);
    object.position.x = Math.random() * 300 - 150;
    object.position.y = Math.random() * 200 - 100;
    object.position.z = Math.random();
    _parent.properties.scene.add( object );
    _parent.render();
    _parent.properties.table_objects[info.id] = object ;
    $('#'+info.id).css('height','160px');
    $('#'+info.id).css('width',width+'px');
    
    
    if(info.ports){
        for(var port_type in info.ports){
            for(var i=0; i<info.ports[port_type].length; i++){
                scope.Add_Port(info.ports[port_type][i],port_type);
            }
        }
    }

    var events = eventing(_parent,scope);
    element.onmousedown = events.onmousedown;
    element.onmouseover = events.onmouseover;
    element.onmouseup = events.onmouseup;
    element.onmousemove = events.onmousemove;
    
}



















