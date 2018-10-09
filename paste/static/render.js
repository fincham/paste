(function(){

var plaintext = '';
var mime;

function scale_image(image) {
    var scale = Math.min(1, $(window).width() / (image.prop('naturalWidth') + 50).toFixed(2));
    image.off('click');
    if (scale < 1) {
        image.css('transform', 'scale(' + scale + ')');
        image.css('cursor', 'zoom-in');
        image.on('click', function(event) {
            var clicked_left = (event.pageX - image.offset().left) / image[0].getBoundingClientRect().width;
            var clicked_top = (event.pageY - image.offset().top) / image[0].getBoundingClientRect().height;
            image.css({'left': 0, 'top': 0, 'transform': 'inherit', 'cursor': 'zoom-out', 'left': Math.max(0, $(window).width() / 2 - image.prop('naturalWidth') / 2), 'top': Math.max(0, $(window).height() / 2 - image.prop('naturalHeight') / 2)});
            image.off('click');
            image.on('click', function() {
                scale_image(image);
            });
            window.scrollTo(image.offset().left + image.width() * clicked_left - $(window).width()/2, image.offset().top + image.height() * clicked_top - $(window).height()/2);
        });
    } else {
        image.css('cursor', 'inherit');
    }

    image.css('left', Math.max(0, $(window).width() / 2 - image.prop('naturalWidth') / 2 * scale));
    image.css('top', Math.max(0, $(window).height() / 2 - image.prop('naturalHeight') / 2 * scale));
}

function decrypt() {
    var highlighting;
    var key;
   
    var ciphertext = $('code');
    window.ciphertext = ciphertext;

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
        mime = sjcl.json.decode(ciphertext.html()).mime;
        plaintext = sjcl.decrypt(sjcl.codec.base64.toBits(key), ciphertext.html());
        $('.loader').hide();
    }

    // check supposed mime type to see if it's an image or something else
    if (mime.startsWith('image/')) {
        if (!image.attr('src')) {
            image.on('load', function() {
                scale_image(image);
                image.css('display', 'block');
            });
            image.attr('src', plaintext);
        }
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
