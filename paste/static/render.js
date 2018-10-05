(function(){

var plaintext = '';

function scale_image(image) {
    var scale = Math.min(1, $(window).width() / (image.prop('naturalWidth') + 50).toFixed(2));
    if (scale < 1) {
        image.css('transform', 'scale(' + scale + ')');
        image.css('cursor', 'zoom-in');
        image.on('click', function() {
            image.css({'left': 0, 'top': 0, 'transform': 'inherit', 'cursor': 'zoom-out', 'left': $(window).width() / 2 - image.prop('naturalWidth') / 2, 'top': $(window).height() / 2 - image.prop('naturalHeight') / 2});
            image.on('click', function() {
                scale_image(image);
            });
        });
    } else {
        image.css('cursor', 'inherit');
        image.off('click');
    }

    image.css('left', $(window).width() / 2 - image.prop('naturalWidth') / 2 * scale);
    image.css('top', $(window).height() / 2 - image.prop('naturalHeight') / 2 * scale);
}

function decrypt() {
    var highlighting;
    var key;
   
    var ciphertext = $('code');
    window.ciphertext = ciphertext;

    var mime = sjcl.json.decode(ciphertext.html()).mime;
    var image = $('img');

    // split up URL to get key and highlighting options
    if (decodeURIComponent(window.location.hash).indexOf('$') != -1) {
        key = decodeURIComponent(window.location.hash).split('$')[0].slice(1);
        highlighting = decodeURIComponent(window.location.hash).split('$')[1];
    } else {
        key = decodeURIComponent(window.location.hash).slice(1);
        highlighting = '1';
    }

    // decrypt if not already done
    if (plaintext == '') {
        plaintext = sjcl.decrypt(sjcl.codec.base64.toBits(key), ciphertext.html());
        $('.loader').hide();
    }

    // check supposed mime type to see if it's an image or something else
    if (mime.startsWith('image/')) {
        image.on('load', function() {
            scale_image(image);
            image.css('display', 'block');
        });

        image.attr('src', plaintext);
    } else {
        ciphertext.text(plaintext);
        if (highlighting == '1') {
            hljs.highlightBlock(ciphertext[0]);
        }
        $('pre').css('display', 'block');
    }

}

$(window).on('resize', function(e) {
    scale_image($('img'));
});

$(window).bind('hashchange', function(e) {
    decrypt();
});

$(window).ready(function() {
    decrypt();
});

}());
