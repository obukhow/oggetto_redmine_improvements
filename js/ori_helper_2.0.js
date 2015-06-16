function showOriFancybox(status, options) {
    var defaults = {
        'type': 'inline',
        'content': '#update',
        'autoScale': false,
        'autoDimensions': false,
        'width': 800,
        'height':700,
        'onComplete': function(){},
        'onClosed': function(){}
    };
    var opts = $.extend( {}, defaults, options );
    jQuery.fancybox({
        'type': opts.type,
        'content': opts.content,
        'autoScale': opts.autoScale,
        'autoDimensions': opts.autoDimension,
        'width': opts.width,
        'height': opts.height,
        'onClosed': opts.onClosed,
        'onComplete': opts.onComplete
    });
}

function closeOriFancybox() {
    jQuery.fancybox.close();
}
