<?php

require_once "../php/constantes.php";
require_once BDD_CONFIG;

try
{
    $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // users
    // FK vers classes en attente
    $pdo->prepare("CREATE TABLE IF NOT EXISTS `".PREFIX_BDD."users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT 'nom de l''utilisateur',
  `prenom` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT 'prénom de l''utilisateur',
  `email` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT 'email et identifiant',
  `rank` TINYINT NOT NULL DEFAULT '0' COMMENT 'rang',
  `idClasse` int DEFAULT NULL COMMENT 'identifiant de la classe, null si pas élève',
  `date` datetime NOT NULL COMMENT 'date de la dernière connexion',
  `pref` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT 'préférences',
  `hash` char(60) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT 'hash du mot de passe',
  PRIMARY KEY (`id`),
  KEY `FK_users_classes` (`idClasse`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COMMENT='Liste des utilisateurs';
    ")->execute();

    // classes
    // FK vers users
    $pdo->prepare("CREATE TABLE IF NOT EXISTS `".PREFIX_BDD."classes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT 'nom de la classe',
  `description` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT 'description de la classe',
  `idOwner` int NOT NULL COMMENT 'id du prof propriétaire',
  `pwd` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT 'mot de passe non chiffré pour entrer dans la classe',
  `date` date NOT NULL COMMENT 'date de création',
  `expiration` date DEFAULT NULL COMMENT 'date d''expiration',
  `ouverte` tinyint(1) NOT NULL COMMENT 'si classe ouverte, publie la classe et permet l''inscription via mot de passe',
  PRIMARY KEY (`id`),
  KEY `FK_classes_users` (`idOwner`),
  CONSTRAINT `FK_classes_users` FOREIGN KEY (`idOwner`) REFERENCES `".PREFIX_BDD."users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COMMENT='Liste des classes';"
    )->execute();

    // FK circulaires entre classes et users
    $pdo->prepare("ALTER TABLE `".PREFIX_BDD."users`
    ADD CONSTRAINT `FK_users_classes` FOREIGN KEY (`idClasse`) REFERENCES `".PREFIX_BDD."classes` (`id`) ON DELETE SET NULL
    ")->execute();

    // devoirs
    // FK vers classes et users
    $pdo->prepare("CREATE TABLE IF NOT EXISTS `".PREFIX_BDD."devoirs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idOwner` int NOT NULL COMMENT 'id du propriétaire',
  `idClasse` int NOT NULL COMMENT 'id de la classe',
  `nom` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT 'nom de la fiche',
  `description` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT 'description de la fiche',
  `dateDebut` date NOT NULL COMMENT 'date de début',
  `dateFin` date NOT NULL COMMENT 'date de fin',
  PRIMARY KEY (`id`),
  KEY `FK_devoirs_classes` (`idClasse`),
  KEY `FK_devoirs_users` (`idOwner`),
  CONSTRAINT `FK_devoirs_classes` FOREIGN KEY (`idClasse`) REFERENCES `".PREFIX_BDD."classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_devoirs_users` FOREIGN KEY (`idOwner`) REFERENCES `".PREFIX_BDD."users` (`id`) ON DELETE CASCADE)
  ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COMMENT='Les fiches permettent aux profs d''organiser un ensemble d''exercices avec choix de pondération et d''options. Ce sont des devoirs.';
    ")->execute();

    // exercices
    // FK vers users
    $pdo->prepare("CREATE TABLE IF NOT EXISTS `".PREFIX_BDD."exercices` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'identifiant',
  `idOwner` int DEFAULT NULL COMMENT 'identifiant du propriétaire',
  `title` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL COMMENT 'nom de l''exercice',
  `keywords` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci COMMENT 'mots clés',
  `description` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci COMMENT 'description du contenu',
  `options` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci COMMENT 'options disponibles',
  `init` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci COMMENT 'code d''initialisation',
  `code` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci COMMENT 'code permettant de générer l''exercice',
  `published` tinyint(1) DEFAULT NULL COMMENT 'exercice publié',
  PRIMARY KEY (`id`),
  KEY `FK_exercices_users` (`idOwner`),
  CONSTRAINT `FK_exercices_users` FOREIGN KEY (`idOwner`) REFERENCES `".PREFIX_BDD."users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COMMENT='contient les sujets d''exercices disponibles';
    ")->execute();

    // exodevoirs
    // FK vers exercices et devoirs
    $pdo->prepare("CREATE TABLE IF NOT EXISTS `".PREFIX_BDD."exodevoirs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idExo` int NOT NULL COMMENT 'identifiant de l''exercice',
  `options` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT 'options de l''exercice',
  `idDevoir` int NOT NULL COMMENT 'identifiant du devoir',
  `num` int DEFAULT NULL COMMENT 'numéro d''ordre',
  PRIMARY KEY (`id`),
  KEY `FK_exodevoir_exercices` (`idExo`),
  KEY `FK_exodevoir_devoirs` (`idDevoir`),
  CONSTRAINT `FK_exodevoir_devoirs` FOREIGN KEY (`idDevoir`) REFERENCES `".PREFIX_BDD."devoirs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_exodevoir_exercices` FOREIGN KEY (`idExo`) REFERENCES `".PREFIX_BDD."exercices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COMMENT='Associations entre exercice et devoir\r\nQuand le prof crée son devoir, il y insère des exercices.\r\nChaque exercice inséré crée une association';
    ")->execute();

    // noteexos
    // FK vers exodevoirs et users
    $pdo->prepare("CREATE TABLE IF NOT EXISTS `".PREFIX_BDD."noteexos` (
  `idExoDevoir` int NOT NULL,
  `idUser` int NOT NULL,
  `note` int DEFAULT NULL,
  `trials` int DEFAULT NULL,
  PRIMARY KEY (`idExoDevoir`,`idUser`),
  KEY `FK_noteexos_users` (`idUser`),
  CONSTRAINT `FK_noteexos_exodevoirs` FOREIGN KEY (`idExoDevoir`) REFERENCES `".PREFIX_BDD."exodevoirs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_noteexos_users` FOREIGN KEY (`idUser`) REFERENCES `".PREFIX_BDD."users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='Garde le résutlat du max des notes des essais pour une paire (idExoDevoir, idUser)';
    ")->execute();

    // trials
    // FK vers exodevoirs et users
    $pdo->prepare("CREATE TABLE IF NOT EXISTS `".PREFIX_BDD."trials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idExoDevoir` int NOT NULL COMMENT 'assoc Exo/Devoir',
  `idUser` int DEFAULT NULL COMMENT 'identifiant de l''utilisateur auteur de l''essai',
  `date` datetime NOT NULL COMMENT 'date de l''essai',
  `score` int NOT NULL COMMENT 'note obtenue',
  `init` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT 'entrée d''initialisation',
  `answers` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT 'réponses utilisateur',
  `finished` tinyint(1) NOT NULL COMMENT 'exercice terminé.',
  PRIMARY KEY (`id`),
  KEY `FK_trials_exodevoirs` (`idExoDevoir`),
  KEY `FK_trials_users` (`idUser`),
  CONSTRAINT `FK_trials_exodevoirs` FOREIGN KEY (`idExoDevoir`) REFERENCES `".PREFIX_BDD."exodevoirs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_trials_users` FOREIGN KEY (`idUser`) REFERENCES `".PREFIX_BDD."users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COMMENT='essais exercice\r\nchaque fois qu''un utilisateur fait un exercice dans le cadre d''un devoir, il crée un essai\r\nL''essai retient l''ensemble des données aléatoires qui ont initié l''exercice, l''ensemble de ses réponses, un marqueur pour savoir s''il est allé au bout, une note.';
    ")->execute();

    // init keys
    // FK vers users
    $pdo->prepare("CREATE TABLE IF NOT EXISTS `".PREFIX_BDD."initkeys` (
  `id` int NOT NULL AUTO_INCREMENT,
  `initKey` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT 'clé temporaire pour la connexion',
  `idUser` int NOT NULL COMMENT 'identifiant de l''utilisateur',
  PRIMARY KEY (`id`),
  KEY `FK_initkeys_users` (`idUser`),
  CONSTRAINT `FK_initkeys_users` FOREIGN KEY (`idUser`) REFERENCES `".PREFIX_BDD."users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=689 DEFAULT CHARSET=utf8mb3 COMMENT='clé pour les demandes de réinitialisations de mot de passe par mail';
    ")->execute();

    // messages
    // FK vers users et trials
    $pdo->prepare("CREATE TABLE IF NOT EXISTS `".PREFIX_BDD."messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idOwner` int NOT NULL COMMENT 'id du propriétaire du message',
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'contenu du message',
  `idTrial` int NOT NULL DEFAULT '0' COMMENT 'réalisation d''exercice concernée. Si null, pas lié à un exo.',
  `date` datetime NOT NULL COMMENT 'date du message',
  `idDest` int NOT NULL COMMENT 'id du destinataire.',
  `lu` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'flag pour message lu',
  PRIMARY KEY (`id`),
  KEY `FK_messages_users` (`idDest`),
  KEY `FK_messages_users_2` (`idOwner`),
  KEY `FK_messages_trials` (`idTrial`),
  CONSTRAINT `FK_messages_trials` FOREIGN KEY (`idTrial`) REFERENCES `".PREFIX_BDD."trials` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_messages_users` FOREIGN KEY (`idDest`) REFERENCES `".PREFIX_BDD."users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_messages_users_2` FOREIGN KEY (`idOwner`) REFERENCES `".PREFIX_BDD."users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb3 COMMENT='messages entre prof et élèves';
    ")->execute();


    echo "Toutes les tables ont été créées avec succès.<br>";

    // création de l'utilisateur root
    require_once ROOT_CONFIG;
    $hashRoot=password_hash(ROOT_PASSWORD,PASSWORD_BCRYPT);

    // vérif que root n'existe pas déjà
    $stmt=$pdo->prepare("SELECT COUNT(*) AS nb FROM `".PREFIX_BDD."users` WHERE email=:email");
    $stmt->bindValue('email', ROOT_LOGIN, PDO::PARAM_STR);
    $stmt->execute();
    $row=$stmt->fetch(PDO::FETCH_ASSOC);
    if ($row['nb']>0)
    {
        echo "L'utilisateur root existe déjà. Installation interrompue.";
        // update du mot de passe root
        $stmt=$pdo->prepare("UPDATE `".PREFIX_BDD."users` SET hash=:hash WHERE email=:email");
        $stmt->bindValue('email', ROOT_LOGIN, PDO::PARAM_STR);
        $stmt->bindValue('hash', $hashRoot, PDO::PARAM_STR);
        $stmt->execute();
    }
    else
    {
        echo "Création de l'utilisateur root...<br>";
        $stmt=$pdo->prepare("INSERT INTO `".PREFIX_BDD."users` (nom,prenom,email,rank,hash,date,pref) VALUES ('root','',:email,3,:hash,NOW(),'{}')");
        $stmt->bindValue('email', ROOT_LOGIN, PDO::PARAM_STR);
        $stmt->bindValue('hash', $hashRoot, PDO::PARAM_STR);
        $stmt->execute();
    }

    echo "Installation terminée avec succès.";

} catch (PDOException $e) {
    echo "Erreur de connexion : " . $e->getMessage();
    die();
}
?>