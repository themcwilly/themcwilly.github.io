var Graph_API = function () {
    var scope = this;
    this.Graph = null;
    this.json = null;
    this.refined = null;
    this._url = {
        import: null,
        export: null
    };
    this._div = null;
    this.Process = {};
    this.Process.Create = function (xml) {
        if (scope.Graph != null) return 'Graph already created';
        if (typeof scope._div !== 'string' || scope._div == '') return 'Please specificy embeddable element.';
        if ($('#' + scope._div).length == 0) return '"' + scope._div + '" is not a recognized element.';
        var data = jQuery.parseXML(xml);
        var json = xmlToJson(data);
        scope.json = json;
        //        console.log('Parsed XML to JSON:');
        //        console.log(json);
        //Refining incoming data
        var refined = sensorMLhandler(json);
        scope.refined = refined;
        //        console.log('Refined for SensorML:');
        //        console.log(refined);
        //Creating a Process Flow Diagram
        var graph = new Graph(scope._div, refined);
        scope.Graph = graph;
        graph.Models.Create();
        graph.Models.Connect();
        graph.Models.PortAttachments();
        graph.Models.DirectedGraph();
        graph.Models.Organize_Groups();
        graph.Models.Style();
        graph.Models.HTML();
        graph.Models.Eventing(scope.Inputs.Update);
        return 'Graph created from link: ';
    }
    this.Process.Destroy = function () {

    }
    //Deals with input fields - brought to surface from graph class
    this.Inputs = {};
    this.Inputs.Update = function (changed, new_value, parent, changing) {
        if (scope._url.export == null) return alert('Please supply export URL.');
        var data = {
            source: 'SensorML_Graph',
            request: {
                parent: parent,
                parameter: changed,
                value: new_value,
                will_modify: changing
            }
        }
        $.ajax({
            type: "POST",
            url: scope._url.export,
            data: JSON.stringify(data),
            success: function (msg) {
                var data = JSON.parse(msg);
                console.log(data);
            },
            error: function (msg) {
                alert('An error occured server side.');
                console.log(msg);
            }
        });
        console.log('Value of "' + changed + '" belongs to "' + parent + '" changed to: ' + new_value + '... which will affect: ' + changing);
    }

    //sets required information
    this.Set = {};
    this.Set.Element = function (el) {
        scope._div = el;
    }
    this.Set.Export_URL = function (url) {
        scope._url.export = url;
    }

    //Well be removed upon initialization
    this._init = (function () {
        $(document).ready(function () {
            $('#import_link_button').on('click', function () {
                var link = $('#import_link').val();
                jQuery.get(link, function (XML) {
                    var result = scope.Process.Create(XML);
                    console.log(result + '"' + link + '".');
                    scope._url.import = link;
                }).fail(function () {
                    cosnole.log('The link: "' + link + '", was not available.');
                });
            });
            $('#export_link_button').on('click', function () {
                var link = $('#export_link').val();
                scope._url.export = link;
            });
            $('#btnOpenFileDialog').hide();
            document.getElementById('fileLoader').addEventListener('change', function readSingleFile(evt) {
                var f = evt.target.files[0];
                if (f) {
                    var r = new FileReader();
                    r.onload = function (e) {
                        var contents = e.target.result;
                        scope.Process.Create(contents);
                    }
                    r.readAsText(f);
                } else {
                    alert("Failed to load file");
                }
            }, false);
        });
        delete scope._init;
    })();

}