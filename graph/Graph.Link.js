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
var Link = function (link_model,_GLOBAL,json) {
    var scope = this;
    this._GLOBAL = _GLOBAL;
    this.link = link_model;
    this.color = '#0000FF';
    this.menu_id;
    this.json = json;
    
    this.Color = function(color){
        scope.link.attr('.connection/stroke', color);
        scope.color = color;
    }
    
    this.Menu = {};
    this.Menu.Open = function(){
        $(".ui-dialog-content").dialog("close");
        var xml = '';
        if(scope.json){
            xml = json2xml(JSON.stringify(jQuery.extend(true,{},scope.json)));
            xml = formatXml(xml);
            xml = xml.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/ /g, '&nbsp;').replace(/\n/g,'<br />');
        }
        
        var html = '<div id="link-editor" title="Link Properties">';
        html = html + '<b>Color:</b>&nbsp;&nbsp;';
        html = html + '<input type="text" id="link-color"></input>';
        html = html + '<br>';
        html = html + '<br>';
        html = html + '<b>Formatted XML:</b><br>';
        html = html + '<div id="link-XML" style="height:200px;overflow:auto;border-style: solid;">'+xml+'</div>';
        html = html + '</div>';
        $('body').append(html);
        $('#link-color').spectrum({
            color: scope.color,
            move: function(col) {
                var color=col.toHexString();
                scope.Color(color);
            },
            change: function(col){
                //console.log('Cancel')
            },
            hide: function(col) {
                if($(this).data('changed')) {
                    // changed
                } else {
                    var color=col.toHexString();
                    scope.Color(color);
                }
            }
        });
        $('#link-editor').dialog();
        $('#link-editor').dialog( "option", "height", 400 );
        $('#link-editor').dialog( "option", "width", 800 );
        $('.ui-dialog :button').blur();
        $('#link-editor').on('dialogclose', function(event) {
            $('#link-editor').remove();
        });
        $('#link-XML').resizable();
    }
    this.Menu.Close = function(){
        $('#link-editor').hide();
        $('#link-editor').remove();
        
    }
    
//    link_model.set('router', {
//        name: 'manhattan'
//    });
//    link_model.attr({
//        '.connection': { stroke: '#0000FF'},
//        '.marker-source': { fill: 'black'},
//        '.marker-target': { fill: 'black'}
//    });
}