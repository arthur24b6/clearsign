<?php

// For now hand back some dummy text untill JS issues are worked out. 
print json_encode(array(
  array('name' => 'Jane Doe <jane@doe.com>',
   'sign' => 'Jane Doe <thisisjane@doe.com>'

 )));

exit;

// $signed_text = escapeshellarg($_POST['signed_text']);
print "<pre>";

$signed_text =
"-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA1

this is some test text
-----BEGIN PGP SIGNATURE-----
Version: GnuPG v1.4.1 (GNU/Linux)

iD8DBQFDDA1eN5XoxaHnMrsRAsOPAKCBrt/YQuI8/rSD3rfQpYxJZowFPACdEYS5
VoXLQNhyvirGLwvIZjuJLHY=
=xGk+
-----END PGP SIGNATURE-----";
$signed_text = escapeshellarg($signed_text);

$gpg_path = '/usr/local/bin/gpg';

// Verify the signature.
exec("echo $signed_text | $gpg_path -n --verify 2>&1", $output, $ret);

print_r($output); print_r($ret);

// Implode with an easily identifiable character.
$output = implode('; ', $output);
// Find the key ID.
$pattern = "/.*key ID ([a-zA-z0-9]*)\;/";
if (preg_match($pattern, $output, $matches)) {
  $keys = array();

  // Fetch the key from the key server.
  exec($gpg_path . ' --search-keys ' . $matches[1] . ' 2>&1', $results, $ret);

  foreach ($results as $count => $result) {

    // Error lines start with "gpg:" and key lines start with "(X)".
    if (strstr($result, 'gpg:') === FALSE) {

      // Get the name associated with the key.
      if (preg_match('/.*[0-9]*\)\s(.*)/', $result, $key_name)) {
        // Get the key signing data from
        preg_match('/\s*(.*)/', $results[$count + 1], $signature);
        $keys[] = array('name' => $key_name[1], 'sign' => $signature[1]);
      }
    }
  }

  print json_encode($keys);
}
else {
  print json_encode(array('error' => 'bad data'));
}














