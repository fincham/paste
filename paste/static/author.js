'use strict';

/*
paste -> author.js

Handles the various encryption tasks, UI management etc for the paste application when authoring a paste.

Michael Fincham <michael@hotplate.co.nz> 2017-0831
*/

(() => {
/* page elements */
var text_only_options = document.getElementById('text_only_options');
var plaintext = document.getElementById('plaintext');
var ciphertext = document.getElementById('ciphertext');
var to_be_sealed = document.getElementById('sealed');
var presigned = document.getElementById('presigned');
var loader = document.getElementById('image_loader');
var canvas = document.getElementById('image_canvas');
var encrypt_top_button = document.getElementById('encrypt-top');
var seal_top_button = document.getElementById('seal-top');
var encrypt_bottom_button = document.getElementById('encrypt-bottom');
var seal_bottom_button = document.getElementById('seal-bottom');

/* application state */
var canvas_height = 0;
var canvas_width = 0;
var key_length = document.querySelector('#key_length').value / 4;
var context = canvas.getContext('2d');
var mime = 'text/plain';

function disable_buttons() {
    seal_top_button.disabled = true;
    seal_bottom_button.disabled = true;
    encrypt_top_button.disabled = true;
    encrypt_bottom_button.disabled = true;        
}

function enable_buttons() {
    seal_top_button.disabled = false;
    seal_bottom_button.disabled = false;
    encrypt_top_button.disabled = false;
    encrypt_bottom_button.disabled = false;        
}

function get_presigned_url(cb) {
    fetch("/generate-upload-url", { "method": 'POST'}).then((response) => {
        response.text().then((url) => {
            cb(url);
        });
    }).catch((e) => {
        console.error(e);
    });
}

function load_image(e) {
    disable_buttons();
    var reader = new FileReader();
    reader.onload = function(event){
        var image = new Image();
        image.onload = function(){
            /* try and draw the image in the middle of the screen
            XXX doesn't resize with the window like it should */
            var scale = Math.min(1, Math.min(canvas_width / image.width, canvas_height / image.height));
            context.drawImage(image, Math.max(0, canvas_width / 2 - image.width * scale / 2), Math.max(0, canvas_height / 2 - image.height * scale / 2), image.width * scale, image.height * scale);
        }
        image.src = event.target.result;
        plaintext.value = event.target.result;
        console.log(`Debug: ${plaintext.value.length}`);
        
        if (plaintext.value.length > 1048576 * 10) {
            alert("Sorry, only pastes up to 10MiB in size are permitted.");
            plaintext.value = "";
            plaintext.style = 'display: block;';
            text_only_options.style = 'display: inline;';
            canvas.style = 'display: none;';
            loader.value = null;
        }
        enable_buttons();
    }
    mime = e.target.files[0].type;
    if (mime.startsWith('image/') || mime.startsWith('video/')) {
        canvas.width = canvas_width;
        canvas.height = canvas_height;
        plaintext.style = 'display: none;';
        text_only_options.style = 'display: none;';
        canvas.style = 'display: block;';
        reader.readAsDataURL(e.target.files[0]);
    } else {
        loader.value = '';
        text_only_options.style = 'display: inline;';
        enable_buttons();
    }
}

function encrypt(sealed) {
    disable_buttons();
    
    var key = sjcl.random.randomWords(key_length);
    var encrypted = sjcl.json.decode(sjcl.encrypt(key, plaintext.value));
    encrypted.mime = mime;
    ciphertext.value = sjcl.json.encode(encrypted);

    if (sealed == true) {
        to_be_sealed.value = 'true';
    }

    window.location.hash = sjcl.codec.base64.fromBits(key, true);
    if (document.getElementById('syntax').value == 'none') {
        window.location.hash += '$0';
    } else if (document.getElementById('syntax').value != '') {
        window.location.hash += '$' + document.getElementById('syntax').value;
    }
   

    if (true && ciphertext.value.length > 1024*1024*3) {
	alert("Sorry, this paste is too big! Only pastes up to 3MiB are accepted.");
	enable_buttons();
	return;
    }

    if (false && ciphertext.value.length > 1024*1024) { /* files > 1MiB get sent through S3, disabled if not using AWS backend */
        get_presigned_url((url) => {
            fetch(url, {
                method: 'PUT',
                body: ciphertext.value
            }).then(() => {
                url = url.split("?")[0];
                let path_parts = url.split('/');
                presigned.value = path_parts[path_parts.length - 1];
                ciphertext.value = '';
                document.getElementById('form').submit();
            }).catch((e) => {
                console.error(e);
            });
        });
    } else {
        document.getElementById('form').submit();
    }
}

document.onpaste = function (event) {
    var items = (event.clipboardData  || event.originalEvent.clipboardData).items;
    var blob = null;
    for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image/") === 0) {
            blob = items[i].getAsFile();
        }
    }
    if (blob !== null) {
            var e = {'target': {'files': [blob]}};
            load_image(e);
    }
}

var seeded = function () {
    sjcl.random.removeEventListener('seeded', seeded);
    seal_top_button.addEventListener('click', () => { encrypt(true); });
    encrypt_top_button.addEventListener('click', () => { encrypt(false); });
    seal_bottom_button.addEventListener('click', () => { encrypt(true); });
    encrypt_bottom_button.addEventListener('click', () => { encrypt(false); });
    enable_buttons();
}

if (sjcl.random.isReady()) {
    seeded();
} else {
    sjcl.random.addEventListener('seeded', seeded);
    sjcl.random.startCollectors();
}

function resize() {
    canvas_width = plaintext.offsetWidth - 10;
    canvas_height = plaintext.offsetHeight - 10;
}

window.addEventListener('resize', resize, false);
loader.addEventListener('change', load_image, false);
plaintext.value = '';
loader.value = '';
history.pushState("", document.title, window.location.pathname + window.location.search);
resize();
})();
