/**
 * ClearSign | arthur@24b6.net
 *
 * Released under the GPL3, see LICENSE file.
 */


var domain = "https://clearsign.me/";

/**
 * Test to make sure that jQuery is loaded on the page. If it isn't load the
 * local version.
 */
if (typeof jQuery=='undefined') {
  var headTag = document.getElementsByTagName("head")[0];
  var jqTag = document.createElement('script');
  jqTag.type = 'text/javascript';
  jqTag.src = domain + 'jquery-1.10.1.min.js';
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


  /* ******************************************************** */
  /* ClearSign Plugin                                         */
  /* ******************************************************** */

  // Defign the plugin.
  var ClearSign = function(elem, options) {
    this.elem = elem;
    this.$elem = $(elem);
    this.options = options;
  };

  ClearSign.prototype = {
    defaults: {
      domain: domain,
      css : {
        path : domain + 'clearsign.css',
        displayedText : 'gpg-displayed-text',
        signatureInfo : 'gpg-signature-info'
      },
      gpgValidatorPath : domain + 'clearsign.php'
    },

    /**
     * Main functionality.
     */
    init: function() {
      // Build the settings.
      var settings = $.extend({}, this.defaults, this.options);

      // Load necessary CSS.
      ClearSign.prototype.loadCSS(settings);

      // Text can come from an text element on the page or form. If this is a
      // form do not transform the the text until the submit button is pressed.
      var type = this.$elem.get(0).tagName.toLowerCase();
      if (type == 'form') {
        var form = this.$elem;
        // Run on submit of this element.
        $(form).submit(function() {
          var signed_text = $('textarea', form).val().replace(/^ +| +$/gm, "");
          // Build the markup.
          ClearSign.prototype.createMarkup(signed_text, form, settings);
          // Validate the text
          ClearSign.prototype.verify(signed_text, form, settings);
          return false;
        });
      }
      else if (type == 'div') {
        var div = this.$elem;
        var signed_text = $(div).html().replace(/^ +| +$/gm, "");
        // Build the markup.
        ClearSign.prototype.createMarkup(signed_text, div, settings);
        // Validate the text
        ClearSign.prototype.verify(signed_text, div, settings);
      }

    },

    /**
     * Ensure that the CSS file is present on the page.
     */
    loadCSS: function (settings) {
      // Only need to do this once.
      if (! $('body').hasClass('clearsign')) {
        var url = settings.css.path;
        if (document.createStyleSheet) {
          try { document.createStyleSheet(url) } catch (e) { }
        }
        else {
          var css;
          css = document.createElement('link');
          css.rel = 'stylesheet';
          css.type = 'text/css';
          css.media = "all";
          css.href = settings.css.path;
          document.getElementsByTagName("head")[0].appendChild(css);
        }
        $('body').addClass('clearsign');
      }
    },

    /**
     * Add the HTML for displaying the signature information.
     */
    createMarkup: function (signed_text, element, settings) {
      // Remove existing markup from the container.
      element.html('');

      // Store the text that was signed here.
      element.append('<div class="' + settings.css.displayedText + '" />');
      // Full signed text stored here.
      element.append('<div class="' + settings.css.signatureInfo + '" />');

      $('.' + settings.css.signatureInfo, element).wrapInner('<pre />');
      $('.'+ settings.css.signatureInfo, element).prepend('<div class="info" />');

      // Build the badge attached to the signed text.
      element.append('<div class="clearsign-badge"><div class="interior"><div class="brand">ClearSign</div><div class="status">Checking</div></div></div>');

      $('.clearsign-badge', element).click(function () {
        if ($(this).hasClass('open')) {
          $(this).removeClass('open');
          $('.' + settings.css.signatureInfo, element).hide(300);
        }
        else {
          $(this).addClass('open');
          $('.' + settings.css.signatureInfo, element).show(300);
        }
      });

      // Populate the HTML with the signature parts.
      $('.' + settings.css.displayedText, element).html(this.parseSignedText(signed_text));
      $('.' + settings.css.signatureInfo + ' pre', element).html(signed_text);
      element.addClass('validating');
    },

    /**
     * Verify the signed text.
     */
    verify: function (signed_text, element, settings) {
      // Post the signed text to the verifier.
      var post = $.post(settings.gpgValidatorPath, {signed_text : signed_text }, function(data) {
        var signature = '';
        if (ClearSign.prototype.isset(data.error)) {
          signature += '<strong>' + ClearSign.prototype.htmlEntityEncode(data.error.message) + '</strong><br /> ';
        }
        if (ClearSign.prototype.isset(data.name)) {
          signature += 'This text was signed by: ' + ClearSign.prototype.htmlEntityEncode(data.name) + ' ';
        }
        if (ClearSign.prototype.isset(data.email)) {
          signature += '<' + data.email + '> ';
        }
        if (ClearSign.prototype.isset(data.date)) {
          signature += 'on ' + ClearSign.prototype.htmlEntityEncode(data.date) + ' ';
        }
        if (ClearSign.prototype.isset(data.key)) {
          signature += 'with key ID: ' + data.id;
        }

        // Verification failed with a non-catchable error.
        if (data === false) {
          $(element).addClass('error');
          $('.clearsign-badge .status', element).html('ERROR');
        }

        // Signature error condition.
        else if (ClearSign.prototype.isset(data.error)) {
          $(element).addClass(data.error.severity);
          $('.clearsign-badge .status', element).html(data.error.severity.toUpperCase());
        }

        // Signature should be valid.
        else {
          $(element).addClass('valid');
          $('.clearsign-badge .status', element).html('VALID');
        }
        
        var title = '<strong>Signature information:</strong><br />';
        $('.' + settings.css.signatureInfo + ' .info', element).html(title + signature);

        $(element).removeClass('validating');
       }, 'json');

    },

    /**
     * Utility function to encode strings.
     */
    htmlEntityEncode: function (string) {
      return $("<div/>").text(string).html();
    },

    /**
     * Parse the signature out from the raw text.
     */
    parseSignature: function (text) {
      var pattern = /SIGNATURE[-]*([\s\S]*?)[-]*END*/;
      var matched = text.match(pattern);
      return matched[1];
    },

    /**
     * Parse the text out from the signed text.
     */
    parseSignedText: function(text) {
      var pattern = /BEGIN[-]*[\s\S]*Hash.*([\s\S]*?)[-]*BEGIN/;
      var matched = text.match(pattern);
      return matched[1];
    },
    
    isset: function(variable) {
      if (typeof(variable) != "undefined" && variable !== null) {
        return true;
      }
      return false;
    }

  };


  $.fn.clearsign = function (options) {
    return this.each(function() {
      new ClearSign(this, options).init();
    });
  }
}
