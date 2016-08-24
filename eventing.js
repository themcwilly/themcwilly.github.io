var eventing = function(_parent,scope){
    var funcs = {};
    funcs.onmousedown = function(e){
        if(e.target.id.indexOf('port')==-1){
            _parent.properties.focused_on = e.target.id;
        }else{
            _parent.properties.focused_on = null;
            var start = e.target.id.split('__')[1];
            _parent.properties.link_focus_start = start;
//            var material = new THREE.LineBasicMaterial({
//                color: 0x0000ff,
//                linewidth: 5
//            });
//            var geometry = new THREE.Geometry();
//            var l0 = _parent.properties.world_mouse.clone()
//            l0.z = 2;
//            var l1 = _parent.properties.world_mouse.clone()
//            l1.z = 2;
//            geometry.vertices.push(l0);
//            geometry.vertices.push(l1);
//            var line = new THREE.Line(geometry, material);
            var line = _parent._link_line();
            _parent.properties.scene.add(line);
            _parent.properties.drawing_line = line;
            _parent.render();
        }
    }
    funcs.onmouseover = function(e){
        if(e.target.id.indexOf('port')==-1) {
            _parent.properties.link_focus_end = null;
            return;
        }
        if(_parent.properties.link_focus_start==null){
    //                console.log('Starting link is null... changing it to: '+e.target.id.split('__')[1]);
            _parent.properties.link_focus_start = e.target.id.split('__')[1];
        }else{
    //                console.log('Starting link is NOT null... changing the end of the link to: '+e.target.id.split('__')[1]);
            _parent.properties.link_focus_end = e.target.id.split('__')[1];
        }
    //            console.log('Hovering over link: '+e.target.id.split('__')[1]);

    }
    funcs.onmouseup = function(e){
        if(e.target.id.indexOf('port')>-1){
            var onTopOf = _parent.properties.link_focus_end;
            var start = _parent.properties.link_focus_start;
            if(onTopOf==start) return; //kill the line
            if(onTopOf==null) return;
            _parent.properties.link_focus_start = e.target.id.split('__')[1];
            _parent.properties.link_focus_end = null;
            _parent.Add.Link(start,onTopOf);
            _parent.properties.drawing_line = null;
        }else{
            if(_parent.properties.drawing_line != null) _parent.properties.scene.remove(_parent.properties.drawing_line);
            _parent.properties.drawing_line = null;
            if(typeof _parent.properties.table_objects[e.target.id] === 'undefined') return;
            var object = _parent.properties.table_objects[e.target.id];
            var target = new THREE.Object3D();
    //                target.position.x = Math.random() * 300 - 150;
    //                target.position.y = Math.random() * 200 - 100;
    //                target.position.z = Math.random();
            target.position.copy(object.position);

            target.rotation.y = Math.PI*1.999
            _parent.transform(object,target);
        }
        _parent.render();
    }
    funcs.onmousemove = function(e){
        if(_parent.properties.focused_on==null) return;
        if(typeof _parent.properties.table_objects[e.target.id] === 'undefined') return;
        _parent.properties.table_objects[e.target.id].position.copy(_parent.properties.world_mouse);
        //travel through the links
        scope.Link_Moved()
//        for(var i=0; i<scope.links.length; i++){
//            var type = scope.links[i].split('.')[0];
//            var port = scope.links[i].split('.')[2];
//            //this better exist.. if not, there's an issue
//            var node_position = scope.nodes[type][port].object.position.clone();
//            scope.object.localToWorld(node_position);
//            //more than one link can occur on a node
//            var links = scope.nodes[type][port].links;
//            for(var l=0; l<links.length; l++){
//                links[l].link_end.set(node_position.x,node_position.y,node_position.z);
//                links[l].link_line.geometry.verticesNeedUpdate = true;
//            }
//            
//        }
//        _parent.render();
    }
    return funcs;
}














