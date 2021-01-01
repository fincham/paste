"use strict";

/*
paste -> render.js

Attempt to decrypt and draw the paste in a pleasing way.

Michael Fincham <michael@hotplate.co.nz> 2017-08-31
*/

(() => {
    
/* page elements */
var ciphertext = document.querySelector("code");
var container = document.querySelector("label");
var image = document.querySelector("img");
var loader = document.querySelector(".loader");
var pre = document.querySelector("pre");
var zoom = document.querySelector("#zoom");

/* app state */
var plaintext = "";
var mime;
var scroll_x = 0;
var scroll_y = 0;

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

/* this logic kind of grew organically and it's a bit tortured now... but... it works */
function decrypt() {
    var highlighting;
    var key;
    var syntax = "";
    var decoded_json = JSON.parse(ciphertext.innerText);
    
    if ("redirect" in decoded_json) { /* this will happen if the server needs to send a "big" blob from S3 */
        fetch(decoded_json["redirect"], {method: "GET"}).then(
            (response) => {
                response.text().then((text) => {
                    ciphertext.innerText = text;
                    decrypt();
                });
            });
        return;
    }
    
    // split up URL to get key and highlighting options
    if (decodeURIComponent(window.location.hash).indexOf("$") != -1) {
        key = decodeURIComponent(window.location.hash).split("$")[0].slice(1);
        highlighting = decodeURIComponent(window.location.hash).split("$")[1];
        syntax = decodeURIComponent(window.location.hash).split("$").last();
	if (syntax == "0" || syntax == "1") {
	  syntax = "";
        }
        if (highlighting != "0" && highlighting != "1") {
          highlighting = "1";
        }
    } else {
        key = decodeURIComponent(window.location.hash).slice(1);
        highlighting = "1";
    }

    // decrypt if not already done
    if (plaintext == "") {
        mime = decoded_json.mime;
        plaintext = sjcl.decrypt(sjcl.codec.base64.toBits(key), ciphertext.innerHTML);
        if (loader) {
            loader.style.display = "none";
        }
    }

    // check supposed mime type to see if it's an image or something else
    if (mime.startsWith("image/")) {
        if (!image.src) {
            container.style.display = "flex";     
            image.src = plaintext;
        }
    } else {
        ciphertext.innerText = plaintext;
        if (highlighting == "1") {
            if (syntax != "") {
	            ciphertext.classList.add(syntax);
            }
            hljs.highlightBlock(ciphertext);
        } else {
	        ciphertext.classList.add("plaintext");
        }
        pre.style.display = "block";
    }
}

image.addEventListener("load", () => {
    if (image.clientHeight == image.naturalHeight && image.clientWidth == image.naturalWidth) {
        image.classList.add("fits");
    }
});

window.addEventListener("hashchange", () => {
    decrypt();
});

window.addEventListener("load", () => {
    decrypt();
});

zoom.addEventListener("change", () => {
    console.log(window.innerWidth);
    if (zoom.checked) {
        var bounding = image.getBoundingClientRect();
        window.scrollTo(bounding.left + bounding.width * scroll_x - window.innerWidth / 2, bounding.top + bounding.height * scroll_y - window.innerHeight / 2);
    }
});

image.addEventListener("mousemove", (event) => {
    if (!zoom.checked) {
        var bounding = image.getBoundingClientRect();
        scroll_x = (event.pageX - bounding.left) / bounding.width;
        scroll_y = (event.pageY - bounding.top) / bounding.height;
    }
});
})();