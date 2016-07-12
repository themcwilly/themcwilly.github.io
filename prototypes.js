//PROTOTYPES
String.prototype.isUpper = function () {
    var char = this[0];
    var rtn = false;
    if (char == char.toUpperCase()) rtn = true;
    return rtn;
}
String.prototype.width = function (font) {
    var f = font || '12px arial',
        o = $('<div>' + this + '</div>')
        .css({
            'position': 'absolute',
            'float': 'left',
            'white-space': 'nowrap',
            'visibility': 'hidden',
            'font': f
        })
        .appendTo($('body')),
        w = o.width();
    o.remove();
    return w + 100;
}
String.prototype.width = function(font) {
  var f = font || '12px arial',
      o = $('<div>' + this + '</div>')
            .css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': f})
            .appendTo($('body')),
      w = o.width();

  o.remove();

  return w;
}