<?php
    final class ErrorController
    {
        /* Classe statique */

        const BDD_DEBUG = true;
        const DEBUG = true;
        /**
         * @var array|null $_messages Tableau des messages d'erreur et de succès
         */
        private static $_messages = null;
        private static $_error_code = 200;

        ##################################### METHODES STATIQUES #####################################

        /**
         * Ajoute un message d'erreur ou de succès.
         * @param string $message Le message à ajouter
         * @param bool $success Indique si le message est un succès (true) ou une erreur (false)
         */
        public static function add($message,  $success = true)
        {
            if (self::$_messages === null) self::$_messages = array();
            self::$_messages[] = array('success'=>$success, 'message'=>$message);
        }

        /**
         * Ajoute un message d'erreur.
         * @param string $message Le message d'erreur à ajouter
         */
        public static function addError($message)
        {
            self::add($message, false);
        }

        /**
         * Ajoute un message d'erreur lié à la base de données.
         * @param string $message Le message d'erreur à ajouter
         * @param mixed $code Le code d'erreur optionnel
         */
        public static function addBDDError($message, $code = null)
        {
            if ($code !== null) $strCode = " (".$code.")"; else $strCode="";
            if (self::BDD_DEBUG) self::add('Erreur BDD'.$strCode.' : '.$message, false);
            else self::add('Erreur BDD', false);
        }

        /**
         * Ajoute un message d'erreur de débogage.
         * @param string $message Le message d'erreur à ajouter
         * @param mixed $code Le code d'erreur optionnel
         */
        public static function addDebugError($message, $code = null)
        {
            if ($code !== null) $strCode = " (".$code.")"; else $strCode="";
            if (self::DEBUG) self::add('Erreur '.$strCode.' : '.$message, false);
        }

        /**
         * Renvoie tous les messages d'erreur et de succès.
         * @return array Tableau des messages
         */
        public static function messages()
        {
            if (self::$_messages === null) return array();
            else return self::$_messages;
        }

        /**
         * Renvoie uniquement les messages d'erreur.
         * @return array Tableau des messages d'erreur
         */
        public static function errorMessages()
        {
            $errors = array();
            if (self::$_messages !== null) {
                foreach(self::$_messages as $m) {
                    if ($m['success'] === false) $errors[] = $m['message'];
                }
            }
            return $errors;
        }

        /**
         * Définit le code d'erreur HTTP.
         * @param string|null $code Le code d'erreur à définir, ou null pour utiliser le code par défaut (501)
         */
        public static function set_error_code($code)
        {
            if ($code == null)
                self::$_error_code = 501;
            else
                self::$_error_code = $code;
        }

        /**
         * Envoie les en-têtes HTTP appropriés en fonction du code d'erreur ou redirige si nécessaire.
         * @param string $redirect URL de redirection optionnelle
         */
        public static function header($redirect='')
        {
            if ($redirect === '') {
                header('Content-Type: application/json; charset=utf-8');
                switch (self::$_error_code) {
                    case 401:
                        header('HTTP/1.0 401 Unauthorized');
                        break;
                    case 403:
                        header('HTTP/1.0 403 Forbidden');
                        break;
                    case 404:
                        header('HTTP/1.0 404 Not Found');
                        break;
                    case 422:
                        header('HTTP/1.0 422 Unprocessable entity');
                        break;
                    case 501:
                        header('HTTP/1.0 501 Not Implemented');
                        break;
                    default:
                        header('HTTP/1.0 200 OK');
                }
            } else {
                header('HTTP/1.0 302 Found');
                header("Location: $redirect");
                exit();
            }
        }


    }


?>
