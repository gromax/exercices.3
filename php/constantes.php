<?php
	define("PATH_TO_CLASS", "../php/class");

	// Chemin du dossier de config
	if (file_exists("../php/config/bddConfig.php"))
	{
		define("BDD_CONFIG","../php/config/bddConfig.php");
	}
	else
	{
		define("BDD_CONFIG","../php/default.config/bddConfig.php");
	}

	if (file_exists("../php/config/mailConfig.php"))
	{
		define("MAIL_CONFIG","../php/config/mailConfig.php");
	}
	else
	{
		define("MAIL_CONFIG","../php/default.config/mailConfig.php");
	}

	if (file_exists("../php/config/rootConfig.php"))
	{
		require_once("../php/config/rootConfig.php");
	}
	else
	{
		require_once("../php/default.config/rootConfig.php");
	}

	// Utilisateurs
	define("PSEUDO_MIN_SIZE", 6);
	define("PSEUDO_MAX_SIZE", 20);

	// Classes
	define("NOMCLASSE_MIN_SIZE", 3);
	define("NOMCLASSE_MAX_SIZE", 20);

	// Calcul de notes
	//define("POIDS_GEO", 0.8);
	define("N_EXO_SUP", 5); // Nombre d'exercices encore pris en compte au-delà de la quantité à faire

?>
