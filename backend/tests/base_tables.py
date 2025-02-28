import os
import sys
import django

# Add backend directory to sys.path so Python can find it
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

# Set Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")  # Update with your project name

# Setup Django
django.setup()

# Now import models
from things.models import ClassLevel, Subject, Chapter

import logging

logger = logging.getLogger('django')


bac_math = ClassLevel.objects.get_or_create(name="2ème Bac SM", order=1)[0]
bac_phys = ClassLevel.objects.get_or_create(name="2ème Bac PC", order=2)[0]


maths = Subject.objects.get_or_create(name="Mathématiques")[0]
physics_chemistry = Subject.objects.get_or_create(name="Physique-Chimie")[0]

for class_level in [bac_math,bac_phys]:
    maths.class_levels.add(class_level)
    physics_chemistry.class_levels.add(class_level)

math_chapters_bac_math = [
    "Limites et continuité",
    "Dérivation et étude des fonctions",
    "Théorème des accroissements finis (TAF)",
    "Suites numériques",
    "Fonctions logarithmiques",
    "Fonctions exponentielles",
    "Équations différentielles",
    "Fonctions primitives",
    "Calcul intégral",
    "Nombres complexes",
    "Arithmétique",
    "Structures algébriques",
    "Probabilités",
    "Espaces vectoriels",
]

math_chapters_bac_phys = [
    "Limites et continuité",
    "Dérivation et étude des fonctions",
    "Suites numériques",
    "Fonctions primitives",
    "Fonctions logarithmiques",
    "Nombres complexes",
    "Fonctions exponentielles",
    "Calcul intégral",
    "Équations différentielles",
    "Produit scalaire",
    "Produit vectoriel",
    "Dénombrement",
    "Probabilités",
]

physics_chapters = [
    "Ondes mécaniques progressives",
    "Ondes mécaniques progressives périodiques",
    "Propagation des ondes lumineuses",
    "Décroissance radioactive",
    "Noyaux, masse et énergie",
    "Dipôle RC",
    "Dipôle RL",
    "Oscillations libres d'un circuit RLC série",
    "Circuit RLC série en régime sinusoïdal forcé",
    "Ondes électromagnétiques",
    "Modulation d'amplitude",
    "Transformations lentes et rapides",
    "Suivi temporel d'une transformation chimique - Vitesse de réaction",
    "Transformations chimiques s'effectuant dans les deux sens",
    "État d'équilibre d'un système chimique",
    "Transformations liées à des réactions acide-base",
    "Dosage acido-basique",
    "Lois de Newton",
    "Chute libre verticale d’un solide",
    "Mouvements plans",
    "Mouvement des satellites et des planètes",
    "Mouvement de rotation d’un solide autour d’un axe fixe",
    "Systèmes mécaniques oscillants",
    "Aspects énergétiques des oscillations mécaniques",
    "Atome et mécanique de Newton",
    "Évolution spontanée d'un système chimique",
    "Transformations spontanées dans les piles et production d'énergie",
    "Transformations forcées (électrolyse)",
    "Réactions d'estérification et d'hydrolyse",
    "Contrôle de l'évolution d'un système chimique",
]

order = 1

for _,chapter_name in enumerate(math_chapters_bac_math, start=1):
    chapter, created = Chapter.objects.get_or_create(
        name=chapter_name,
        subject=maths,
        order=order
    )
    chapter.class_levels.add(bac_math)
    order += 1

for _,chapter_name in enumerate(math_chapters_bac_phys, start=1):
    logger.info(chapter_name)


    if Chapter.objects.all().filter(name = chapter_name) :
        logger.info(Chapter.objects.all().filter(name = chapter_name))
        
        chapter, created = Chapter.objects.get_or_create(name = chapter_name, subject = maths)

    else : 
        chapter, created = Chapter.objects.get_or_create(
            name=chapter_name,
            subject=maths,
            order=order
        )
    chapter.class_levels.add(bac_phys)
    order += 1

# Insert Physics-Chemistry Chapters
for _, chapter_name in enumerate(physics_chapters, start=1):
    chapter, created = Chapter.objects.get_or_create(
        name=chapter_name,
        subject=physics_chemistry,
        order=order
    )
    chapter.class_levels.add(bac_math, bac_phys)

    order += 1