function showOriFancybox(status) {
    unsafeWindow.jQuery.fancybox({
        'type': 'inline',
        'content': '#update',
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