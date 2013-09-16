<?php

/**
 * @file
 * Provides the PHP wrapper around GPG. Not implementing the pear version of
 * gpg because it doesn't offer a verify option that can be used to look up
 * the key id's identity.
 *
 */


/**
 * Get the path to the GPG binary.
 *
 * @TODO need to do error checking if binary is not found.
 * @TODO should check for gpg2 as well.
 *
 * @return string
 */
function get_gpg_path() {
  static $path = FALSE;
  if (! $path) {
    $path = exec('export PATH=/usr/local/bin:/usr/bin:$PATH; which gpg');
  }
  return $path;
}


/**
 * Fetches the key by running the clearsigned text through gpg.
 *
 * If this returns FALSE the signed text is not valid.
 *
 * @TODO these regexs need to be thought through.
 * @TODO this should do some caching of keys in a database for performance.
 *
 * @param string $signed_text
 *   Clear signed text to verify
 * @return string
 *   Key ID
 */
function get_key($signed_text) {
  $gpg_path = get_gpg_path();

  // Verify the signature.
  exec("echo $signed_text | $gpg_path -n --verify 2>&1", $output, $ret);

  // Make returned data easily matchable.
  $output = implode(';', $output);

  // Check for a bad signature.
  $pattern = '/BAD signature/';
  if (preg_match($pattern, $output)) {
    $key['error'] = 'Bad signature';
    return $key;
  }

  // Check for any valid key data that is achived on --verify.
  $pattern = '/.*Signature made (.*) using.*key ID (.*?);.*Good signature from "(.*?)";/';
  if (preg_match($pattern, $output, $matches)) {
    $key['date'] = $matches[1];
    $key['id'] = $matches[2];
    $key['name'] = $matches[3];
    return $key;
  }

  // No data, just find the key ID.
  $pattern = "/.*key ID ([a-zA-z0-9]*)\;/";
  if (preg_match($pattern, $output, $matches)) {
    $key['id'] = $matches[1];
    return $key;
  }

  // @TODO error handling.

  // No valid data found.
  return FALSE;
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
function key_lookup($key) {
  $gpg_path = get_gpg_path();

  // The key has to have the 0x prepended to it to search on
  $key_id = '0x' . $key['id'];

  $command = get_gpg_path() . " --keyserver pgp.mit.edu  --search-keys $key_id";

  $descriptorspec = array(
    0 => array("pipe", "r"),
    1 => array("pipe", "w")
  );

  $process = proc_open($command, $descriptorspec, $pipes);
  if (is_resource($process)) {
    list ($out, $in) = $pipes;
    fwrite($out, "1\n");
    $output = stream_get_contents($in);
  }

  // Output should be in the format of:
  // (1)	name <email@email.net>
	//  1024 bit DSA key KEYID, created: YYYY-MM-DD
  $pattern = "/.*\).(.*)/";
  if (preg_match($pattern, $output, $matches)) {
    $key['name'] = $matches[1];
    return $key;
  }

  return FALSE;
}


if (empty($_POST['signed_text'])) {
// Dummy text to try.
$signed_text =
"-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA1

this is some test text which will fail the verification.
-----BEGIN PGP SIGNATURE-----
Version: GnuPG v1.4.1 (GNU/Linux)

iD8DBQFDDA1eN5XoxaHnMrsRAsOPAKCBrt/YQuI8/rSD3rfQpYxJZowFPACdEYS5
VoXLQNhyvirGLwvIZjuJLHY=
=xGk+
-----END PGP SIGNATURE-----";
}
else {
  $signed_text = $_POST['signed_text'];
}
$signed_text = escapeshellarg($signed_text);


if ($key = get_key($signed_text)) {
  if (!empty($key['error']) || (!empty($key['name']) && !empty($key['date']))) {
    print json_encode($key);
  }
  // Key was not found, look it up with the keyserver.
  else if ($key = key_lookup($key)) {
    print json_encode($key);
  }
}
else {
  // @TODO error condition
  print json_encode($key);
}
















