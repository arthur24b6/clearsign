/**
 * ClearSign
 *
 */

/**
 * Test to make sure that jQuery is loaded on the page. If it isn't load the
 * local version.
 */
if (typeof jQuery=='undefined') {
  var headTag = document.getElementsByTagName("head")[0];
  var jqTag = document.createElement('script');
  jqTag.type = 'text/javascript';
  jqTag.src = 'jquery-1.10.1.min.js';
  jqTag.onload = main;
  headTag.appendChild(jqTag);
}
else {
  main();
}


// Code to be run after it is clear that jQuery is enabled
function main() {

// Enable on all signed text containers.
$(document).ready(function() {
  $('.gpg-signed-text').clearsign();
});


// jQuery plugin.
$.fn.clearsign = function(options) {
  return this.each(function () {

    // Default options.
    var settings = $.extend({
      path : '/',
      cssPath : 'clearsign.css',
      css : {
        displayedText : 'gpg-displayed-text',
        displayedStatus : 'gpg-displayed-status',
        displayedRawText : 'gpg-raw-text'
      },
      gpgValidatorPath : 'clearsign.php'
    }, options );

    var element = this;

    /**
     * Load the CSS files from javascript to keep implementation simple.
     */
    function loadCSS(settings) {
      // Only need to do this once.
      if (! $('body').hasClass('clearsign')) {
        var url = settings.path + settings.cssPath;
        if (document.createStyleSheet) {
          try { document.createStyleSheet(options.cssPath); } catch (e) { }
        }
        else {
          var css;
          css = document.createElement('link');
          css.rel = 'stylesheet';
          css.type = 'text/css';
          css.media = "all";
          css.href = url;
          document.getElementsByTagName("head")[0].appendChild(css);
        }
        $('body').addClass('clearsign');
      }
    }


    /**
     * Parse the signature out from the raw text.
     */
    function getSignature(text) {
      var pattern = /SIGNATURE[-]*([\s\S]*?)[-]*END*/;
      var matched = text.match(pattern);
      return matched[1];
    }


    /**
     * Parse the text out from the signed text.
     */
    function getSignedText(text) {
      var pattern = /BEGIN[-]*[\s\S]*Hash.*([\s\S]*?)[-]*BEGIN/;
      var matched = text.match(pattern);
      return matched[1];
    }


    /**)
     * Add the HTML for displaying the signature information.
     */
    function buildHTML() {
      $(element).append('<div class="' + settings.css.displayedText + '" />');

      $(element).append('<div class="' + settings.css.displayedRawText + '" />');
      $('.' + settings.css.displayedRawText, element).wrapInner('<pre />');

      $(element).append('<div class="' + settings.css.displayedStatus + '" />');
      $('.' + settings.css.displayedStatus, element).append('<div class="data"></div><div class="status"><ul><li class="status">Status</li><li class="raw">Raw</li><li class="help">Help</li></ul></div>');

      $('.' + settings.css.displayedStatus + ' li.raw', element).click(function () {
        if ($(this).hasClass('open')) {
          $(this).removeClass('open');
          $('.' + settings.css.displayedRawText, element).hide(300);
        }
        else {
          $(this).addClass('open');
          $('.' + settings.css.displayedRawText, element).show(300);
        }
      });
    }


    /**
     * Utility function to encode HTML entities.
     */
    function htmlEntityEncode(string) {
      return $("<div/>").text(string).html();
    }


    // -----------------------------------------------------------



    // Load the css.
    loadCSS(settings)

    // Get the input text.
    var signed_text = $(this).text();

    // Remove existing markup.
    $(this).html('');

    // Build the clearsign markup.
    buildHTML();

    // Populate the HTML with the signature parts.
    $('.' + settings.css.displayedText, this).html(getSignedText(signed_text));
    $('.' + settings.css.displayedRawText + ' pre', this).html(signed_text);

    // Post the signed text to the verifier.
    var post = $.post(settings.path + settings.gpgValidatorPath, {signed_text : signed_text }, function(data) {
      console.log(data);
      // Signature error condition.
      if (typeof data.error !== 'undefined' && data.error) {
        var string = data.error;
        $(element).addClass('verification-failed');
      }
      else {
        var string = htmlEntityEncode(data.name) + ' | ' + htmlEntityEncode(data.date) + ' | ' + data.id;
        $(element).addClass('verified');
      }
      $('.' + settings.css.displayedStatus + ' .data', element).html(string);
     }, 'json');


    });
  };

} // main()
