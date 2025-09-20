// Ce catalogue est appelé à disparaître au profit d'une base de données

const catalog = {
  list: [
    {
      id: 1,
      filename: "exo0001",
      title: "Équation de droite",
      description: "Déterminer l'équation d'une droite passant par deux points.",
      keyWords: "geometrie;droite;equation;seconde"
    },
    {
      id: 2,
      filename: "exo0002",
      title: "Milieu d'un segment",
      description: "Calculer les coordonnées du milieu d'un segment.",
      keyWords: "geometrie;repere;seconde"
    },
    {
      id: 3,
      filename: "exo0003",
      title: "Symétrique d'un point",
      description: "Calculer les coordonnées du symétrique d'un point par rapport à un autre point.",
      keyWords: "geometrie;repere;seconde"
    },
    {
      id: 4,
      filename: "exo0004",
      title: "Quatrième point d'un parallélogramme.",
      description: "Connaissant trois points, calculer les coordonnées d'un quatrième point pour former un parallélogramme.",
      keyWords: "geometrie;repere;seconde",
      fixedSettings: {
        complexe: false
      }
    },
    {
      id: 5,
      filename: "exo0005",
      title: "Distance entre deux points.",
      description: "Dans un repère orthonormé, calculer la distance entre deux points dont on connait les coordonnées.",
      keyWords: "geometrie;repere;seconde;distance",
      fixedSettings: {
        complexe: false
      }
    },
    {
      id: 6,
      filename: "exo0006",
      title: "Placer des points dans un repère",
      description: "Connaissant leurs coordonnées, placer des points dans un repère.",
      keyWords: "geometrie;repere;seconde",
      fixedSettings: {
        complexe: true
      }
    },
    {
      id: 7,
      filename: "exo0007",
      title: "Image et antécédent avec un tableau de valeurs",
      description: "Un tableau de valeur d'une fonction est donné. Il faut déterminer une image et un antécédent.",
      keyWords: "fonction;antecedent;image;seconde"
    },
    {
      id: 8,
      filename: "exo0008",
      title: "Image et antécédent avec une courbe",
      description: "La courbe d'une fonction étant donnée, il faut déterminer un antécédent et une image.",
      keyWords: "fonction;antecedent;image;seconde"
    },
    {
      id: 9,
      filename: "exo0009",
      title: "Expression d'une fonction affine",
      description: "On connaît deux valeurs d'une fonction affine. Il faut en déduire l'expression de la fonction.",
      keyWords: "analyse;fonction;expression;affine;seconde"
    },
    {
      id: 10,
      filename: "exo0010",
      title: "Équation du second degré",
      description: "Résoudre une équation du second degré.",
      keyWords: "analyse;trinome;equation;racines;1stl",
      options: {
        d: {
          tag: "Résoudre dans",
          options: ["Réels", "complexes"]
        }
      }
    },
    {
      id: 11,
      filename: "exo0011",
      title: "Équation somme et produit",
      description: "On connaît la somme et le produit de deux nombres, il faut calculer ces nombres.",
      keyWords: "analyse;trinome;equation;racines;1stl"
    },
    {
      id: 12,
      filename: "exo0013",
      title: "Tracer la courbe d'une fonction affine",
      description: "L'expression d'une fonction affine étant donnée, il faut tracer sa courbe dans un repère.",
      keyWords: "analyse;fonction;courbe;affine;seconde",
      fixedSettings: { affine: true }
    },
    {
      id: 13,
      filename: "exo0013",
      title: "Tracer une droite dont on connaît l'équation réduite",
      description: "On donne l'équation réduite d'une droite. Il faut tracer cette droite.",
      keyWords: "geometrie;droite;equation;seconde",
      fixedSettings: { affine: false, point: false }
    },
    {
      id: 14,
      filename: "exo0015",
      title: "Associer droites et fonctions affines",
      description: "On donne cinq fonctions affines et cinq droites. Il faut associer chaque fonction affine avec la droite qui la représente.",
      keyWords: "analyse;fonction;courbe;affine;seconde", 
      options: {
        n: { tag: "Nombre de courbes", options: ["3", "4", "5", "6", "7"] }
      },
      fixedSettings: { affine: true, point: false }
    },
    {
      id: 15,
      filename: "exo0015",
      title: "Associer droites et équations réduites",
      description: "On donne des équations réduites et des droites. Il faut associer chaque équation avec la droite qui la représente.",
      keyWords: "analyse;fonction;courbe;affine;seconde",
      options: {
        n: { tag: "Nombre de courbes", options: ["3", "4", "5", "6", "7"] }
      },
      fixedSettings: { affine: false }
    },
    {
      id: 16,
      filename: "exo0016",
      title: "Associer courbes et fonctions du second degré",
      description: "Cinq paraboles et cinq fonctions du second degré sont données. À chaque fonction, il faut attribuer la parabole qui la représente.",
      keyWords: "analyse;fonction;courbe;Second degré;seconde"
    },
    {
      id: 17,
      filename: "exo0017",
      title: "Associer courbes et fonctions du second degré",
      description: "Cinq paraboles sont données. On propose cinq fonctions du second degré dont on ne connait que le discriminant et le coefficient du terme de second degré. À chaque fonction, il faut attribuer la parabole qui la représente.",
      keyWords: "analyse;fonction;courbe;affine;seconde"
    },
    {
      id: 18,
      filename: "exo0018",
      title: "Tracer la courbe d'une fonction $x\\mapsto |ax+b|$",
      description: "On donne l'expression d'une fonction affine avec une valeur absolue. Il faut tracer sa courbe représentative.",
      keyWords: "analyse;fonction;courbe;affine;seconde"
    },
    {
      id: 19,
      filename: "exo0019",
      title: "Inéquation du second degré",
      description: "Il faut résoudre une inéquation du second degré.",
      keyWords: "analyse;trinome;equation;racines;1stl",
      options: {}
    },
    {
      id: 20,
      filename: "exo0020",
      title: "Moyenne et écart-type",
      description: "Une série statistique est donnée. Il faut calculer sa moyenne et son écart-type.",
      keyWords: "statistiques;moyenne;ecart-type;1stl",
      options: {},
      fixedSettings: { moyenne: true }
    },
    {
      id: 21,
      filename: "exo0021",
      title: "Médiane et quartiles",
      description: "Une série statistique est donnée. Il faut calculer le premier quartile, la médiane et le troisième quartile.",
      keyWords: "statistiques;mediane;quartile;seconde",
      options: {},
      fixedSettings: { moyenne: false }
    },
    {
      id: 22,
      filename: "exo0022",
      title: "Développer une expression",
      description: "Une expression est donnée, il faut la développer.",
      keyWords: "algebre;fonction",
      options: {
        a: {
          tag: "Difficulté",
          options: ["Alea", "Facile", "Facile avec fraction", "Moyen", "Moyen avec fraction"]
        }
      }
    },
    {
      id: 23,
      filename: "exo0023",
      title: "Équation de la tangente à une courbe",
      description: "Pour $x$ donné, on donne $f(x)$ et $f'(x)$. Il faut en déduire l'équation de la tangente à la courbe à l'abscisse $x$.",
      keyWords: "derivation;derivee;Tangente;equation;1stl"
    },
    {
      id: 24,
      filename: "exo0024",
      title: "Loi binomiale",
      description: "Calculer des probabilités avec la loi binomiale.",
      keyWords: "probabilite;binomiale;1stl"
    },
    {
      id: 25,
      filename: "exo0025",
      title: "Loi binomiale : Intervalle de fluctuation",
      description: "Calculer un intervalle de fluctuation.",
      keyWords: "probabilite;binomiale;intervalle de fluctuation;1stl"
    },
    {
      id: 26,
      filename: "exo0026",
      title: "Coordonnées d'un vecteur",
      description: "Calculer les coordonnées du vecteur entre deux points.",
      keyWords: "geometrie;repere;vecteur;seconde",
      fixedSettings: {
        c: false
      }
    },
    {
      id: 27,
      filename: "exo0027",
      title: "Calculs avec les complexes",
      description: "Faire les calculs de base avec les complexes.",
      keyWords: "geometrie;complexe;1stl"
    },
    {
      id: 28,
      filename: "exo0028",
      title: "Dériver une fonction",
      description: "Une fonction polynome est donnée, il faut la dériver.",
      keyWords: "analyse;fonction;derivation;derivee;1stl",
      options: {
        a: {
          tag: "Avec ln ou exp",
          options: ["Sans", "ln(x)", "ln(ax+b)", "exp(x)", "exp(ax)"]
        },
        d: {
          tag: "Degré max du polynôme",
          options: [0, 1, 2, 3, 4, 5]
        },
        e: {
          tag: "Tangente",
          options: ["non", "oui"]
        }
      }
    },
    {
      id: 29,
      filename: "exo0029",
      title: "Équation du premier degré",
      description: "Résoudre une équation du premier degré.",
      keyWords: "affine;algebre;equation;seconde",
      options: {},
      fixedSettings: {
        c: false
      }
    },
    {
      id: 30,
      filename: "exo0030",
      title: "Suites et termes général et récurrence",
      description: "On donne l'expression de suites et il faut l'associer à la forme donnée par récurence.",
      keyWords: "analyse;suite;1stl",
      options: {}
    },
    {
      id: 31,
      filename: "exo0031",
      title: "Conversion entre degré et radians",
      description: "Transformer une mesure en degrés en une mesure en radians et réciproquement.",
      keyWords: "geometrie;trigonometrie;seconde"
    },
    {
      id: 32,
      filename: "exo0032",
      title: "Mesure principale d'un angle",
      description: "La mesure d'un angle est donnée en radians. Il faut donner sa mesure principale.",
      keyWords: "geometrie;trigonometrie;seconde"
    },
    {
      id: 33,
      filename: "exo0033",
      title: "Équation modulo $2\\pi$",
      description: "Résoudre une équation portant sur des mesures angulaires en radians, avec un terme $2k\\pi$.",
      keyWords: "trigonometrie;algebre;equation;1stl"
    },
    {
      id: 34,
      filename: "exo0034",
      title: "Équation de type $\\cos x = \\cos \\alpha$",
      description: "Résoudre une équation de la forme $\\cos x = \\cos \\alpha$ $\\sin x = \\sin \\alpha$.",
      keyWords: "trigonometrie;algebre;equation;1stl"
    },
    {
      id: 35,
      filename: "exo0035",
      title: "Équation de type $\\cos (a\\cdot x+b) = \\cos \\alpha$",
      description: "Résoudre une équation de la forme $\\cos (a\\cdot x+b) = \\cos \\alpha$.",
      keyWords: "trigonometrie;algebre;equation;1stl"
    },
    {
      id: 36,
      filename: "exo0036",
      title: "Placer des points sur le cercle trigonométrique",
      description: "Placer sur le cercle trigonométrique le point correspondant à une mesure donnée en radians.",
      keyWords: "trigonometrie;1stl;radians;seconde"
    },
    {
      id: 37,
      filename: "exo0037",
      title: "Dérivée d'une fonction trigonométrique",
      description: "Dériver une fonction de la forme $f(t)=A\\sin(\\omega t+\\varphi)$.",
      keyWords: "derivation;derivee;trigonometrie;1stl"
    },
    {
      id: 38,
      filename: "exo0038",
      title: "Choix de la meilleure forme",
      description: "Une fonction du second degré est donnée sous différentes formes. Vous devez utiliser la plus appropriée meilleure pour répondre à différentes questions.",
      keyWords: "analyse;second degre;seconde"
    },
    {
      id: 39,
      filename: "exo0039",
      title: "Associer tableaux de variations et fonctions du second degré",
      description: "Cinq paraboles et cinq fonctions du second degré sont données. À chaque fonction, il faut attribuer le tableau qui lui correspond.",
      keyWords: "analyse;fonction;tableau de variation;forme canonique;second degre;seconde"
    },
    {
      id: 40,
      filename: "exo0040",
      title: "Somme de fractions",
      description: "Ajouter des fractions et simplifier le résultat.",
      keyWords: "calcul;college;fraction"
    },
    {
      id: 41,
      filename: "exo0041",
      title: "Termes d'une suite explicite",
      description: "Calculer les termes d'une suite donnée explicitement.",
      keyWords: "analyse;suite;1stl"
    },
    {
      id: 42,
      filename: "exo0042",
      title: "Termes d'une suite récurrente",
      description: "Calculer les termes d'une suite donnée par récurence.",
      keyWords: "analyse;suite;1stl"
    },
    {
      id: 43,
      filename: "exo0043",
      title: "Suites et intérêts composés",
      description: "On donne le rendement annuel d'un placement. On cherche à savoir au bout de combien de temps on aura doublé le capital initial.",
      keyWords: "analyse;suite;1stl"
    },
    {
      id: 44,
      filename: "exo0044",
      title: "De la forme algébrique à la forme trigonométrique",
      description: "On vous donne un nombre complexe sous sa forme algébrique. vous devez trouver sa forme trigonométrique, c'est à dire son module et son argument.",
      keyWords: "geometrie;complexe;1stl"
    },
    {
      id: 45,
      filename: "exo0045",
      title: "De la forme trigonométrique à la forme algébrique",
      description: "On vous donne un nombre complexe sous sa forme trigonométrique. vous devez trouver sa forme algébrique.",
      keyWords: "geometrie;complexe;1stl"
    },
    {
      id: 46,
      filename: "exo0046",
      title: "Calcul d'un angle avec les complexes",
      description: "Trois points A,B et C sont donnés. Il faut trouver l'angle $\\widehat{BAC}$.",
      keyWords: "geometrie;complexe;1stl"
    },
    {
      id: 47,
      filename: "exo0047",
      title: "Calcul de l'aire d'un parallélogramme avec les complexes",
      description: "Quatre points A, B, D sont donnés. On sait que $ABCD$ est un parallélogramme. Il faut trouver l'aire de $ABCD$.",
      keyWords: "geometrie;complexe;1stl"
    },
    {
      id: 48,
      filename: "exo0048",
      title: "Reconnaître les courbes fonction / dérivée",
      description: "On donne la courbe d'une fonction $f$ et la courbe de sa dérivée $f'$, il faut reconnaître quelle courbe correspond à $f$ et quelle courbe correspond à $f'$.",
      keyWords: "analyse;derivation;derivee;1stl",
      fixedSettings: {
        derivee:true
      }
    },
    {
      id: 49,
      filename: "exo0049",
      title: "Donnez la primitive d'une fonction",
      description: "Une fonction polynome est donnée, il faut donner sa primitive.",
      keyWords: "analyse;fonction;primitive;tstl"
    },
    {
      id: 50,
      filename: "exo0050",
      title: "Ajustement par la méthode des moindres carrés",
      description: "On vous donne une série statistique à deux variables $(x;y)$. Vous devez déterminer un ajustement de $y$ en $x$ par la méthode des moindres carrés.",
      keyWords: "statistiques;ajustement;carre;moindre;affine;tstl;bts",
      options: {
        a: { tag: "Coordonnées du point moyen", options: ["Non", "Oui"] },
        b: { tag: "Changement de variable", options: ["Non", "Oui"] },
        c: { tag: "Calcul d'interpolation", options: ["Non", "Oui"] }
      }
    },
    {
      id: 51,
      filename: "exo0051",
      title: "Loi uniforme",
      description: "Calculer des probabilités avec la loi uniforme.",
      keyWords: "probabilite;uniforme;tstl",
      options: {
        a: { tag: "Calcul $E(X)$", options: ["Oui", "Non"] },
        b: { tag: "Calcul $\\sigma(X)$", options: ["Oui", "Non"] }
      }
    },
    {
      id: 52,
      filename: "exo0052",
      title: "Loi normale",
      description: "Calculer des probabilités avec la loi normale.",
      keyWords: "probabilite;normale;tstl",
      options: {}
    },
    {
      id: 53,
      filename: "exo0053",
      title: "Équations avec logarithme et exponentielle",
      description: "Résoudre des équations contenant des logarithmes et des exponentielles.",
      keyWords: "logarithme;exponentielle;equation;tstl",
      options: {
        a: { tag: "ln ou exp", options: ["ln()", "exp()", "e^()"] },
        b: { tag: "équation", options: ["f(ax+b)=f(cx+d)", "a.f(x)+b = c.f(x)+d", "a.f²(x)+...=0,", "c.f(ax+b)+d=...", "a.f²(ax+b)+...=0"] }
      }
    },
    {
      id: 54,
      filename: "exo0054",
      title: "Équations différentielles du premier ordre",
      description: "Résoudre des équations différentielles du premier ordre, avec coefficients constant et second membre.",
      keyWords: "exponentielle;equation;tstl;bts",
      options: {
        a: { tag: "second membre", options: ["u' exp(-b/a.t)+Y", "u' exp(-b/a.t)", "Y", "u' exp(-b/a.t) OU Y"] }
      }
    },
    {
      id: 55,
      filename: "exo0055",
      title: "Calculer une intégrale",
      description: "Calculer l'intégrale d'une fonction polynôme.",
      keyWords: "analyse;fonction;primitive;integrale;tstl"
    },
    {
      id: 56,
      filename: "exo0056",
      title: "Intervalle de fluctuation asymptotique",
      description: "Dans le cadre de l'approximation d'une loi Binomiale par une loi Normale, calculer un intervalle de fluctuation asymptotique et prendre une décision.",
      keyWords: "probabilite;binomiale;normale;intervalle de fluctuation;tstl"
    },
    {
      id: 57,
      filename: "exo0057",
      title: "Aire sous une courbe",
      description: "La courbe d'une fonction est donnée. Il faut déterminer l'aire sous la courbe.",
      keyWords: "integrale;analyse;primitive;tstl"
    },
    {
      id: 58,
      filename: "exo0048",
      title: "Reconnaître les courbes fonction / primitive",
      description: "On donne la courbe d'une fonction $f$ et la courbe de sa primitive $F$, il faut reconnaître quelle courbe correspond à $f$ et quelle courbe correspond à $F$.",
      keyWords: "analyse;primitive;tstl",
      options: {},
      fixedSettings: {
        derivee: false
      }
    },
    {
      id: 59,
      filename: "exo0059",
      title: "Loi Exponentielle", 
      description: "Calculer des probabilités avec la loi exponentielle.",
      keyWords: "probabilite;exponentielle;tstl"
    },
    {
      id: 60,
      filename: "exo0060",
      title: "Recherche de seuil",
      description: "Calculer la valeur de l'entier pour laquelle un seuil est franchi.",
      keyWords: "suites;logarithme;limites;1stl;tstl"
    },
    {
      id: 61,
      filename: "exo0061",
      title: "Produit scalaire",
      description: "Calculer le produit scalaire de deux vecteurs.",
      keyWords: "geometrie;vecteur;1stl",
      options: {
        a: { tag: "Format", options: ["Coordonnées", "Combinaison linéaire", "Coordonnées et combi linéaire"] }
      }
    },
    {
      id: 62,
      filename: "exo0004",
      title: "Quatrième point d'un parallélogramme.",
      description: "Connaissant l'affixe de trois points dans le plan complexe, calculer l'affixe d'un quatrième point pour former un parallélogramme.",
      keyWords: "geometrie;repere;complexes;1stl",
      fixedSettings: {
        complexe: true
      }
    },
    {
      id: 63,
      filename: "exo0005",
      title: "Distance entre deux points.",
      description: "Dans le plan complexe, calculer la distance entre deux points d'affixes connues.",
      keyWords: "geometrie;repere;distance;complexes;1stl",
      fixedSettings: {
        complexe: true
      }
    },
    {
      id: 64,
      filename: "exo0006",
      title: "Placer des points dans le plan complexe",
      description: "Connaissant leurs affixes, placer des points dans le plan complexe.",
      keyWords: "geometrie;complexes;1stl",
      fixedSettings: {
        complexe: true
      }
    },
    {
      id: 65,
      filename: "exo0065",
      title: "Limite d'une suite",
      description: "Déterminer la limite d'une suite.",
      keyWords: "suites;limites;1stl;tstl"
    },
    {
      id: 66,
      filename: "exo0066",
      title: "Produit scalaire dans une figure",
      description: "On donne une figure géométrique et on demande de calculer quelques produits scalaires.",
      keyWords: "geometrie;scalaire;1stl",
      options: {
        a:{ tag:"Nombres de questions" , options:[3,1,2,4,5] }
      }
    },
    {
      id: 67,
      filename: "exo0067",
      title: "Produit scalaire et points",
      description: "On donne des points dans un repère. Vous devez caculer des vecteurs, leur produit scalaire et éventuellement un angle.",
      keyWords: "geometrie;scalaire;1stl",
      options: {
        a: { tag: "Calculer l'angle", options: ["Non", "Oui"] }
      }
    },
    {
      id: 68,
      filename: "exo0068",
      title: "Équation et produit scalaire",
      description: "On donne deux vecteurs dont une coordonnée est inconnue. Il faut trouver la valeur de l'inconnue pour que le produit scalaire soit nul.",
      keyWords: "geometrie;scalaire;1stl"
    },
    {
      id: 69,
      filename: "exo0069",
      title: "Droite perpendiculaire",
      description: "On donne trois poins A, B et C. On cherche l'équation de la droite passant par C et perpendiculaire à (AB).",
      keyWords: "geometrie;equation;droite;scalaire;1stl"
    },
    {
      id: 70,
      filename: "exo0070",
      title: "Calcul d'angle",
      description: "On donne les coordonnées de trois poins A, B et C. Via le calcul de produit scalaire ou le théorème de Pythagore généralisé, on cherche à déterminer l'angle $\\widehat{BAC}$.",
      keyWords: "geometrie;trigonometrie;scalaire;1stl"
    },
    {
      id: 71,
      filename: "exo0071",
      title: "Somme d'une suite géométrique",
      description: "Déterminez la somme des termes d'une suite géométrique.",
      keyWords: "suites;série;tstl"
    },
    {
      id: 72,
      filename: "exo0072",
      title: "Taux d'accroissement",
      description: "Déterminez le taux d'accroissement d'une fonction entre deux points.",
      keyWords: "analyse;derivation;derivee;1stl",
      options: {
        d: {
          tag: "Calcul avec h quelconque",
          options: ["non", "oui"]
        }
      }
    },
    {
      id: 73,
      filename: "exo0013",
      title: "Tracer une droite avec point et m",
      description: "On donne le coefficient d'une droite et un de ses points. Il faut tracer cette droite.",
      keyWords: "geometrie;droite;equation;seconde",
      fixedSettings: { affine: false, point: true }
    },
    {
      id: 74,
      filename: "exo0074",
      title: "Calcul de la limite d'une fonction",
      description: "Vous devez calculer la limites d'une fonction et éventuellement proposer l'équation d'une asymptote.",
      keyWords: "analyse;fonction;limite;tstl;asymptote",
      options: {
        a: {
          tag: "Avec ln ou exp",
          options: ["Avec", "Sans"]
        }
      }
    },
    {
      id: 75,
      filename: "exo0075",
      title: "Dérivée et tableau de variation",
      description: "Une fonction de degré 3 étant donnée, vous devez déterminer sa dérivée, étudier le signe de celle-ci et en déduire les variations de la fonction.",
      keyWords: "analyse;fonction;derivee;derivation;1stl"
    },
    {
      id: 76,
      filename: "exo0076",
      title: "Loi de Poisson",
      description: "Calculer des probabilités avec la loi de Poisson.",
      keyWords: "probabilite;poisson;bts;loi"
    },
    {
      id: 77,
      filename: "exo0029",
      title: "Équation du premier degré, dans $\\mathbb{C}$",
      description: "Résoudre une équation du premier degré dans l'ensemble des complexes.",
      keyWords: "affine;algebre;equation;1stl;complexes",
      fixedSettings: {
        c: true
      }
    },
    {
      id: 78,
      filename: "exo0026",
      title: "Affixe d'un vecteur",
      description: "Calculer l'affixe d'un vecteur entre deux points.",
      keyWords: "vecteur;affixe;1stl;complexes",
      fixedSettings: {
        c: true
      }
    },
    {
      id: 9999,
      filename: "exoTest",
      title: "Exercice de test",
      description: "Exercice utilisé pour développer de nouvelles fonctionalités",
      keyWords: "",
      options: {}
    }
  ],
  get: (id) => {
    idExo = Number(id)
    return this.list.find(exo => exo.id === idExo);
  },
  all: () => {
    return this.list;
  }
};

export { catalog };
