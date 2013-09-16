/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


$(document).ready(function() {
  $('.gpg-signed-text').clearsign();
});



$.fn.clearsign = function(options) {
  return this.each(function () {

  // Default options.
  var settings = $.extend({
    path : 'http://clearsign.me/',
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
   * Load the CSS files to keep things simple.
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
  var text = $(this).text();

  // Remove existing markup.
  $(this).html('');

  // Build the clearsign markup.
  buildHTML();


  $('.' + settings.css.displayedText, this).html(getSignedText(text));
  $('.' + settings.css.displayedRawText + ' pre', this).html(text);


  var post = $.post(settings.path + settings.gpgValidatorPath, {signed_text : text }, function(data) {
    console.dir(data);
     $('.' + settings.css.displayedStatus + ' .data', element).html(htmlEntityEncode(data[0].name) + ' | ' + htmlEntityEncode(data[0].sign));
   }, 'json');



  });
};
