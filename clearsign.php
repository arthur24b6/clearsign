<?php

/**
 * @file
 * Provides the PHP wrapper around GPG.
 */

// Set the headers to allow cross domain posts from javascript.
header('Access-Control-Allow-Origin: *');
// Get the posted signed text
$signed_text = $_POST['signed_text'];

// Verify.
$verify = new clearSign($signed_text);

// Output.
print json_encode($verify->key);

/* ***************************************** */

class clearSign {

  /**
   * Run the full verification process.
   *
   * @param string $signed_text
   */
  function __construct($signed_text) {
    $this->signed_text = escapeshellarg($signed_text);
    $this->get_gpg_path();
    $this->get_keychain_path();
    $this->get_key_id();
    $this->key_lookup();
  }


  /**
   * Shutdown cleanup.
   */
  function __destruct() {
    unlink($this->tmp_keychain);
  }


  /**
   * Get the path to the GPG binary.
   *
   * @TODO need to do error checking if binary is not found.
   * @TODO should check for gpg2 as well.
   */
  private function get_gpg_path() {
    $this->gpg_path = exec('export PATH=/usr/local/bin:/usr/bin:$PATH; which gpg');
  }


  /**
   * Create a path for the temporary keychain.
   *
   * @param string $signed_text
   */
  private function get_keychain_path() {
    $name = '/tmp/' . md5($this->signed_text . microtime()) . '.gpg';
    $this->tmp_keychain = $name;
  }


  /**
   * Fetches the key by running the clearsigned text through gpg.
   *
   * @TODO regexs need to be thought through.
   * @TODO this should do some caching of keys in a database for performance.
   *
   * @param string $signed_text
   *   Clear signed text to verify
   * @return string
   *   Key ID
   */
  private function get_key_id() {
    // Verify the signature to find the ID.
    exec("echo {$this->signed_text} | {$this->gpg_path} -n --verify 2>&1", $output, $ret);

    // Make returned data easily matchable.
    $output = implode(' ', $output);

    // Find the key ID.
    $pattern = "/.*key ID ([a-zA-z0-9]*)/";
    if (preg_match($pattern, $output, $matches)) {
      $this->key['id'] = $matches[1];
    }
  }


  /**
   * Looks up the key from a keyserver.
   *
   * @TODO handle error condition where key "XXXXXX" not found on keyserver
   *
   * @param string $key_id
   *   Id of the key to look up
   * @return array
   *   Key information.
   */
  private function key_lookup() {
    // Fetch the key and place it in the temporary key chain.
    exec("{$this->gpg_path} --no-default-keyring --keyring {$this->tmp_keychain} --recv-keys {$this->key['id']} --keyserver=http://pgp.mit.edu 2>&1", $output, $ret);

    $output = implode(' ', $output);
           
    // Get the key name and email address. 
    $pattern = "/public key \"(.*)<(.*)>\"/";
    if (preg_match($pattern, $output, $matches)) {
      $this->key['name'] = $matches[1];
      $this->key['email'] = $matches[2]; 
    }

    // Use the imported key to check the signed text.
    exec("echo {$this->signed_text} | {$this->gpg_path} --no-default-keyring --keyring {$this->tmp_keychain} --verify 2>&1", $output, $ret);

    // Collapse the output.
    $output = implode(';', $output);

    // Get signature data.
    $pattern = '/.*Signature made (.*) using.*key ID (.*?);/';
    if (preg_match($pattern, $output, $matches)) {
      $this->key['date'] = $matches[1];
      $this->key['id'] = $matches[2];
    }

    // Check for a bad signature.
    $pattern = '/BAD signature/';
    if (preg_match($pattern, $output)) {
      $this->key['error'] = 'Bad signature';
      $this->key['error'] = array(
        "severity" => "failed",
        "message" => "Bad signature for the signed text."
      );
    }
    
    $pattern = "/Can't check signature: public key not found/";
    if (preg_match($pattern, $output, $matches)) {
      $this->key['error'] = array(
        "severity" => "error",
        "message" => "Can't check signature: public key not found"
      );
    }
  }

}


