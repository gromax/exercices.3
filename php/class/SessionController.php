<?php


use Firebase\JWT\JWT;
use Firebase\JWT\Key;


final class SessionController
{

    ##################################### METHODES STATIQUES #####################################

    public static function make_token($data)
    {
        $payload = array(
            "iat" => time(),                   // Heure d'émission
            "exp" => time() + 3600,           // Expiration (1 heure)
            "data" => $data                    // Données associées au token
        );
        require_once JWT_CONFIG;
        return JWT::encode($payload, SECRET_KEY, 'HS256');
    }

    public static function readToken()
    {
        require_once JWT_CONFIG;
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            $token = str_replace('Bearer ', '', $headers['Authorization']);
        } elseif (isset($headers['authorization'])) {
            $token = str_replace('Bearer ', '', $headers['authorization']);
        } else {
            return null;
        }
        try {
            $decoded = JWT::decode($token, new Key(SECRET_KEY, 'HS256'));
            return $decoded->data;
        } catch (Exception $e) {
            return null;
        }
    }
}

?>