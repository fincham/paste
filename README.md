# paste

A basic encrypted pastebin.

Expects these environment variables to be set:

    PASTE_PATH = location where paste files will be stored, defaults to 'paste'
    PASTE_ID_LENGTH = number of characters in the paste ID, defaults to '16', which is around 95 bits of entropy
    PASTE_KEY_LENGTH = number of octets in the paste encryption key, defaults to '32', which produces 256 bits of entropy

For most applications PASTE_ID_LENGTH and PASTE_KEY_LENGTH could be shortened, though PASTE_KEY_LENGTH cannot
be shortened below 16.
