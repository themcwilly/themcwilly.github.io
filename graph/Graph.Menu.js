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
var Menu = function(_GLOBAL){
    var scope = this;
    this._GLOBAL = _GLOBAL;
    
    this.selected = null;
    
    this.Component = function(name){
        if(scope.selected == name) return;
        scope.selected = name;
        var component = scope._GLOBAL.Graph.components[name];
        var links = component.links;
        var ports = component.ports;
        
        var gui = scope._newMenu();
        
        var func = function(){
            this.name = name;
            this.color = component.color;
            
            this.addPortType = 'inputs';
            this.addPortName = '';
            this.addPort = function(){
                if(this.addPortName == '') return alert('Please create a unique name.');
                var ports = component.Get_Ports(this.addPortType);
                if(ports.indexOf(this.addPortName) > -1 ) return alert(this.addPortName+' is already a defined port for '+this.addPortType);
                component.Add.Port(this.addPortType,this.addPortName);
                component.Beautify();
                scope.selected=null;
                scope.Component(name);
            }
            
            this.remove_port_value = '';
            this.remove_port = function(){
                if(this.remove_port_value=='') return alert('Select port from dropdown.');
                component.Remove.Port(this.remove_port_value);
                scope.selected = null;
                scope.Component(name);
            }
            
        }
        var menu = new func();
        //add the link colors
        var links_available = false;
        var ports_available = false;
        for(var link in links){
            menu[link] = links[link].color;
            links_available = true;
        }
        //add the port colors
        for(var port_type in ports){
            for(var port in ports[port_type]){
                menu[port] = ports[port_type][port].color;
                ports_available=true;
            }
        }
        
        gui.add(menu,'name').name('Name').onChange(function(new_name){
            component.Modify.Component_Label(new_name);
        });
        
        
        //PORTS
        if(typeof component.io === 'undefined' || !component.io){ //no inputs or outputs allow to add or remove ports
            var port_folder = gui.addFolder('Add Port');
            port_folder.add(menu,'addPortName').name('Port Name');
            port_folder.add(menu,'addPortType',['inputs','outputs','parameters']).name('Port Type');
            port_folder.add(menu,'addPort').name('Add Port');
            port_folder.open();

            if(ports_available){
                var remove_port_folder = gui.addFolder('Remove Port');
                var removable_ports = [''];
                for(var port_type in ports){
                    for(var port in ports[port_type]){
                        removable_ports.push(port_type+':'+port);
                    }
                }
                remove_port_folder.add(menu,'remove_port_value',removable_ports).name('Selection');
                remove_port_folder.add(menu,'remove_port').name('Remove');
            }
        }
        
        //STYLE
        var style_folder = gui.addFolder('Style');
        style_folder.addColor(menu,'color').name('Component Color').onChange(function(color){
            component.Modify.Component_Color(color);
        });
        if(ports_available){
            var port_style_folder = style_folder.addFolder('Port Style');
            for(var port_type in ports){
                for(var port in ports[port_type]){
                    var temp_func = function(the_type,the_port){
                        port_style_folder.addColor(menu,the_port).name(the_port).onChange(function(color){
                            ports[the_type][the_port].Color(color);
                        });
                    }
                    temp_func(port_type,port);
                }
            }
            port_style_folder.open();
        }
        if(links_available){
            var link_style_folder = style_folder.addFolder('Link Style');
            for(var link in links){
                var link_list = link.split(':');
                var link_here = link_list[0];
                var link_there = link_list[1];
                if(link_here.indexOf(name)==-1){
                    link_here = link_list[1];
                    link_there = link_list[0];
                }
                var port_here = link_here.split('.')[1];
                var temp_func = function(the_link){
                    link_style_folder.addColor(menu,the_link).name(port_here+' --> '+link_there).onChange(function(color){
                        links[the_link].Color(color);
                    });
                }
                temp_func(link);
            }
            link_style_folder.open();
        }
        
        style_folder.open();
        scope._back(gui);
        
    }
    this.Init = function(){
        var gui = scope._newMenu();
        
        
        //Component Folder
        var new_comp_folder = gui.addFolder('Add Component');
        var func = function(){
            this.newComponent = function(){
                var result = scope._GLOBAL.Graph.Component.New(this.name);
                if(typeof result === 'string') return alert(result);
                scope.Init();
                scope.Component(this.name);
            }
            this.name = '';
            
            this.organize = function(){
                scope._GLOBAL.Graph.Directed_Graph();
            }
            
            //this.import_link = 'https://themcwilly.github.io/data_files/AggregateProcess.txt';
            this.import_link = 'https://themcwilly.github.io/data_files/test.txt';
            this.import_from_link = function(){
                if(this.import_link=='') return alert('Please supply a link.');
                scope._GLOBAL.SensorML.XML.Import_Link(this.import_link);
            }
            
            this.import_from_file = function(){
                scope._GLOBAL.SensorML._read_file(function(file){
                    scope._GLOBAL.SensorML.XML.Read(file);
                });
            }
            
            this.demo = function(){
                DEMO();
            }
        }
        var menu = new func();
        new_comp_folder.add(menu,'name').name('Component Name');
        new_comp_folder.add(menu,'newComponent').name('Add Component');
        new_comp_folder.open();
        
        gui.add(menu,'organize').name('Organize Graph');
        
        var io_folder = gui.addFolder('Data IO');
        io_folder.add(menu,'import_link').name('Import Link');
        io_folder.add(menu,'import_from_link').name('Import');
        io_folder.add(menu,'import_from_file').name('Import File');
        
        
        gui.add(menu,'demo').name('Demonstration');
        
        
    }
    
    this._newMenu = function(){
        if(scope._gui != null) scope._gui.destroy();
        var gui = new dat.GUI({width: 350});
        gui.domElement.id = scope.div;
        scope._gui = gui;
        return gui;
    }
    this._back = function(gui){
        var func = function(){
            this.back = function(){
                scope.Init();
                scope.selected = null;
            }
        }
        var back = new func();
        gui.add(back,'back').name('<<< Main Menu')
    }
    
    $(document).ready(function () {
        scope.Init();
    });
}