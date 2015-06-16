function showOriFancybox(status, content) {
    jQuery.fancybox({
        'type': 'inline',
        'content': content,
        'autoScale': false,
        'autoDimensions': false,
        'width': '800',
        'height': '700',
        'onClosed': function () {
            onClosedOriFancybox(status);
        },
        'onComplete': function() {
            onCompleteOriFancybox(status);
        }
    });
}
