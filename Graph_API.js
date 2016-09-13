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
var Graph_API = function () {
    var scope = this;
    this.Graph = new Graph(this);
    this.Menu = new Menu(this);


    
    
    
    
    
}