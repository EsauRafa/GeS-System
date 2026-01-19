<?php
// jwt.php - minimal JWT HS256 implementation (no external deps)
function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    $pad_len = 4 - (strlen($data) % 4);
    if ($pad_len < 4) $data .= str_repeat('=', $pad_len);
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_encode($payload, $secret, $exp_seconds = 8*3600) {
    $header = ['alg'=>'HS256','typ'=>'JWT'];
    $payload['iat'] = time();
    $payload['exp'] = time() + $exp_seconds;
    $segments = [];
    $segments[] = base64url_encode(json_encode($header));
    $segments[] = base64url_encode(json_encode($payload));
    $signing_input = implode('.', $segments);
    $signature = hash_hmac('sha256', $signing_input, $secret, true);
    $segments[] = base64url_encode($signature);
    return implode('.', $segments);
}

function jwt_decode($jwt, $secret) {
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) return null;
    [$h, $p, $s] = $parts;
    $payload = json_decode(base64url_decode($p), true);
    if (!$payload) return null;
    $signing_input = $h . '.' . $p;
    $signature = base64url_decode($s);
    $valid = hash_hmac('sha256', $signing_input, $secret, true) === $signature;
    if (!$valid) return null;
    if (isset($payload['exp']) && time() > $payload['exp']) return null;
    return $payload;
}
