#!/usr/bin/python3

"""
Server application for "paste" project. Stores pastes to disk.

Expects these environment variables to be set:

PASTE_PATH = location where paste files will be stored, defaults to 'paste'
PASTE_ID_LENGTH = number of characters in the paste ID, defaults to '16', which is around 95 bits of entropy
PASTE_KEY_LENGTH = number of octets in the paste encryption key, defaults to '32', which produces 256 bits of entropy

For most applications PASTE_ID_LENGTH and PASTE_KEY_LENGTH could be shortened, though PASTE_KEY_LENGTH cannot
be shortened below 16.

Michael Fincham <michael@hotplate.co.nz>
"""

import os
import random
import re

from flask import (
    Flask,
    request,
    render_template,
    abort,
    redirect,
    url_for,
    send_from_directory,
)

app = Flask(__name__)
paste_whitelist = re.compile("[\W]+", flags=re.ASCII)


def generate_paste_id():
    picker = random.SystemRandom()
    return "".join(
        [
            picker.choice(
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
            )
            for m in range(0, int(os.environ.get("PASTE_ID_LENGTH", 16)))
        ]
    )


@app.route("/", methods=["GET", "POST"])
def author():
    """
    Shows a "submit paste" form, and then stores submitted pastes in to the filesystem.
    """

    if request.method == "GET":  # show the "submit paste" form
        return render_template(
            "author.html",
            key_length=max(int(os.environ.get("PASTE_KEY_LENGTH", 32)), 16),
        )
    elif request.method == "POST":  # store the paste at a random ID
        if len(request.form["text"]) > 1048576 * 10:  # reject pastes > 10MiB
            abort(413)
        p = None
        retries = 0
        try:
            while p == None:
                try:
                    paste = generate_paste_id()
                    p = open(
                        "%s/%s" % (os.environ.get("PASTE_PATH", "paste"), paste), "x"
                    )
                except FileExistsError:  # retry if somehow the ID collides
                    retries = retries + 1
                    if retries > 100:
                        raise
                    else:
                        pass
                except:
                    raise

            p.write(request.form["text"])
            p.close()
        except:
            abort(500)
        else:
            return redirect(url_for("render", paste=paste))


@app.route("/static/<path:path>")
def send_static(path):
    return send_from_directory("static", path)


@app.route("/<paste>")
def render(paste):
    """
    Return the encrypted text of a paste along with the Javascript that decrypts it.
    """

    paste = paste_whitelist.sub(
        "", paste
    )  # remove all but alphanumeric characters from the paste ID
    try:
        with open("%s/%s" % (os.environ.get("PASTE_PATH", "paste"), paste)) as p:
            ciphertext = p.read()
        return render_template(
            "render.html", ciphertext=ciphertext, ciphertext_length=len(ciphertext)
        )
    except FileNotFoundError:
        abort(404)
    except:
        abort(500)
