<?php
	final class ErrorController
	{
		/* Classe statique */

		const BDD_DEBUG = true;
		const DEBUG = true;
		private static $_messages = null;
		private static $_error_code = 200;

		##################################### METHODES STATIQUES #####################################

		public static function add($message,  $success = true)
		{
			if (self::$_messages === null) self::$_messages = array();
			self::$_messages[] = array('success'=>$success, 'message'=>$message);
		}

		public static function addError($message)
		{
			self::add($message, false);
		}

		public static function addBDDError($message, $code = null)
		{
			if ($code !== null) $strCode = " (".$code.")"; else $strCode="";
			if (self::BDD_DEBUG) self::add('Erreur BDD'.$strCode.' : '.$message, false);
			else self::add('Erreur BDD', false);
		}

		public static function addDebugError($message, $code = null)
		{
			if ($code !== null) $strCode = " (".$code.")"; else $strCode="";
			if (self::DEBUG) self::add('Erreur '.$strCode.' : '.$message, false);
		}

		public static function messages()
		{
			if (self::$_messages === null) return array();
			else return self::$_messages;
		}

		public static function set_error_code($code)
		{
			if ($code == null)
				self::$_error_code = 501;
			else
				self::$_error_code = $code;
		}

		public static function header($redirect='')
		{
			if ($redirect === '') {
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
