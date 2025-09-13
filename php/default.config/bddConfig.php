<?php
  define("PREFIX_BDD", "exo_"); // Prefixe de la BDD
  define("BDD_USER", "root"); // Utilisateur de la BDD
  define("BDD_PASSWORD", ""); // Mot de passe de la BDD
  define("BDD_HOST", "localhost"); // Hote de la BDD
  define("BDD_NAME", "exercices"); // Nom de la BDD
  $dsn="mysql:dbname=".BDD_NAME.";host=".BDD_HOST;
  define("BDD_DSN", $dsn); // DSN de la BDD
?>
