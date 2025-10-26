<?php
require "../php/class/Router.php";
$router = Router::getInstance();

// session
$router->addRule('api/session', 'session', 'fetch', 'GET'); // Session active
$router->addRule('api/session/:id', 'session', 'insert', 'PUT'); // reconnexion
$router->addRule('api/session', 'session', 'insert', 'POST'); // Tentative de connexion
$router->addRule('api/session/sudo/:id', 'session', 'sudo', 'POST'); // Connecter en tant que
$router->addRule('api/session/test', 'session', 'logged', 'GET'); // Vérifie l'état de connexion

// users
$router->addRule('api/users/:id', 'users', 'fetch', 'GET');
$router->addRule('api/users', 'users', 'fetchList', 'GET');
$router->addRule('api/users/:id', 'users', 'delete', 'DELETE');
$router->addRule('api/users/:id', 'users', 'update', 'PUT');
$router->addRule('api/users', 'users', 'insert', 'POST');
$router->addRule('api/users/:id/init', 'users', 'forgottenWithId', 'POST');

// classes
$router->addRule('api/classes/:id', 'classes', 'fetch', 'GET');
$router->addRule('api/classes', 'classes', 'fetch', 'GET');
$router->addRule('api/classestojoin', 'classes', 'fetchToJoin', 'GET');
$router->addRule('api/classes/:id', 'classes', 'delete', 'DELETE');
$router->addRule('api/classes/:id', 'classes', 'update', 'PUT');
$router->addRule('api/classes', 'classes', 'insert', 'POST');
$router->addRule('api/classes/:id/test', 'classes', 'testMDP', 'GET');

// devoirs
$router->addRule('api/devoirs/:id', 'devoirs', 'fetch', 'GET');
$router->addRule('api/devoirs', 'devoirs', 'fetch', 'GET');
$router->addRule('api/devoirs/:id', 'devoirs', 'delete', 'DELETE');
$router->addRule('api/devoirs/:id', 'devoirs', 'update', 'PUT');
$router->addRule('api/devoirs', 'devoirs', 'insert', 'POST');

// exercices
$router->addRule('api/exercices/:id', 'exercices', 'fetch', 'GET');
$router->addRule('api/exercices', 'exercices', 'fetchList', 'GET');
$router->addRule('api/exercices', 'exercices', 'insert', 'POST');
$router->addRule('api/exercices/:id', 'exercices', 'update', 'PUT');
$router->addRule('api/exercices/:id', 'exercices', 'delete', 'DELETE');

// exodevoirs
$router->addRule('api/exodevoirs/:id', 'exodevoirs', 'fetch', 'GET');
$router->addRule('api/exodevoirs', 'exodevoirs', 'fetch', 'GET');
$router->addRule('api/exodevoirs/:id', 'exodevoirs', 'delete', 'DELETE');
$router->addRule('api/exodevoirs/:id', 'exodevoirs', 'update', 'PUT');
$router->addRule('api/exodevoirs', 'exodevoirs', 'insert', 'POST');

// assosUF
$router->addRule('api/assosUF/:id', 'assosUF', 'delete', 'DELETE');
$router->addRule('api/assosUF/:id', 'assosUF', 'update', 'PUT');
$router->addRule('api/assosUF', 'assosUF', 'insert', 'POST');

// notes
$router->addRule('api/notes/:id', 'notes', 'delete', 'DELETE');
$router->addRule('api/notes/:id', 'notes', 'update', 'PUT');
$router->addRule('api/notes', 'notes', 'insert', 'POST');

// messages
$router->addRule('api/messages', 'messages', 'insert', 'POST');
$router->addRule('api/messages/:id', 'messages', 'delete', 'DELETE');
$router->addRule('api/messages/:id/lu', 'messages', 'setLu', 'PUT');

// data
$router->addRule('api/eleveData', 'data', 'eleveFetch', 'GET');
$router->addRule('api/customData/:asks', 'data', 'customFetch', 'GET');
$router->addRule('api/me', 'data', 'fetchMe', 'GET');

// forgotten
$router->addRule('api/forgotten', 'users', 'forgottenWithEmail', 'POST');
$router->addRule('api/forgotten/:key', 'session', 'reinitMDP', 'GET'); // Essaie de se connecter avec une clé de réinit

?>
