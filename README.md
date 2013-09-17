ClearSign
=======

ClearSign makes it easy to verify <a href="http://www.gnupg.org">GPG</a> signed
text blocks on webpages with a simple Javascript inclusion

ClearSign works by sending signed text from an HTML element back to a PHP wrapper
around gpg to extract the signing key id, fetching the key id from a key server
and validating the signed text against the key. Markup on the page is altered by
ClearSign to show the signature text and the validity of the signature.

In order to keep the implementation as simple as possible, ClearSign adds jQuery
(if not already present) and a CSS file in the single included Javascript.

See a demo: https://clearsign.me/