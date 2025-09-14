<?php


use Firebase\JWT\JWT;
use Firebase\JWT\Key;


final class SessionController
{

    ##################################### METHODES STATIQUES #####################################

    public static function make_token($id, $email, $rank)
    {
        $payload = array(
            "iat" => time(),                   // Heure d'émission
            "exp" => time() + 3600,           // Expiration (1 heure)
            "data" => array(               // Données associées au token
                "id" => $id,
                "email" => $email,
                "rank" => $rank
            )
        );
        require_once BDD_CONFIG;
        return JWT::encode($payload, SECRET_KEY, 'HS256');
    }

    public static function verify_token()
    {
        $headers = getallheaders();
        if (!isset($headers['Authorization'])) {
            return null;
        }
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        try {
            $decoded = JWT::decode($token, new Key(SECRET_KEY, 'HS256'));
            return $decoded->data;
        } catch (Exception $e) {
            return null;
        }
    }
}

?>