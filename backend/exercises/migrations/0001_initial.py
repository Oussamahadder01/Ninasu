"""
Initial migration for exercises app

1. New Models
   - ClassLevel: Educational levels (e.g., Tronc Commun, Bac SM)
   - Subject: Subject areas (e.g., Mathematics, Physics)
   - Chapter: Chapters within subjects with multiple class levels
   - Exercise: Main content model
   - Solution: Exercise solutions
   - Comment: User comments on exercises

2. Initial Data
   - Creates default class levels
   - Sets up basic subjects and chapters
"""

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

def create_initial_data(apps, schema_editor):
    ClassLevel = apps.get_model('exercises', 'ClassLevel')
    Subject = apps.get_model('exercises', 'Subject')
    Chapter = apps.get_model('exercises', 'Chapter')
    
    # Create class levels
    class_levels = {
        'tronc_commun': ClassLevel.objects.create(
            name='Tronc Commun',
            order=1
        ),
        'bac_sm': ClassLevel.objects.create(
            name='Bac Sciences Maths',
            order=2
        ),
        'bac_sp': ClassLevel.objects.create(
            name='Bac Sciences Physiques',
            order=3
        ),
        'mp': ClassLevel.objects.create(
            name='MP',
            order=4
        ),
        'mpsi': ClassLevel.objects.create(
            name='MPSI',
            order=5
        ),
        'psi': ClassLevel.objects.create(
            name='PSI',
            order=6
        ),
        'pc': ClassLevel.objects.create(
            name='PC',
            order=7
        ),
    }
    
    # Create subjects
    math = Subject.objects.create(name='Mathématiques')
    physics = Subject.objects.create(name='Physiques')
    
    # Create chapters for mathematics
    math_chapters = {
        'tronc_commun': [
            ('Fonctions et relations', 1),
            ( 'Équations et inéquations', 2),
            ( 'Géométrie (plan et espace)', 3),
            ( 'Probabilités et statistiques', 4),
        ],
        'bac_sm': [
            ( 'Limites et continuité', 1),
            ( 'Suites numériques', 2),
            ( 'Dérivation et étude des fonctions', 3),
            ( 'Fonctions logarithmiques', 4),
            ( 'Fonctions exponentielles', 5),
            ( 'Nombres complexes', 6),
            ( 'Calcul intégral', 7),
            ( 'Équations différentielles', 8),
            ( r"Arithmétique dans $\mathbb{ℤ}$", 9),
            ( 'Structures algébriques', 10),
            ( 'Espaces vectoriels', 11),
            ( 'Calcul de probabilités', 12),
        ],
        'bac_sp': [
            ( 'Limites et continuité', 1),
            ( 'Suites numériques', 2),
            ( 'Dérivation et étude des fonctions', 3),
            ( 'Fonctions logarithmiques', 4),
            ( 'Fonctions primitives', 5),
            ( 'Nombres complexes', 6),
            ( 'Calcul intégral', 7),
            ( 'Équations différentielles', 8),
            ( 'Fonctions exponentielles',9),
            ('Géométrie dans l’espace', 10),
            ( 'Espaces vectoriels', 11),
            ("Probabilités" ,12),
            ('Dénombrement', 13),
        ],
    }
    
    physics_chapters = {
        'bac_sp': [
            ('Mécanique', 1),
            ('Thermodynamique', 2),
            ( 'Optique', 3),
            ('Électricité', 4),
            ('Magnétisme', 5),
        ],
        'mp': [
            ('Mécanique avancée', 1),
            ( 'Physique moderne', 2),
        ],
    }
    
    # Create math chapters and associate with class levels
    for level_code, chapters in math_chapters.items():
        for name, order in chapters:
            chapter = Chapter.objects.create(
                name=name,
                subject=math,
                order=order,

            )
            chapter.class_levels.add(class_levels[level_code])

    
    # Create physics chapters and associate with class levels
    for level_code, chapters in physics_chapters.items():
        for name, order in chapters:
            chapter = Chapter.objects.create(
                name=name,
                subject=physics,
                order=order,
            )
            chapter.class_levels.add(class_levels[level_code])

            

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ClassLevel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('order', models.PositiveIntegerField(help_text='Order in which this class appears (e.g., 1 for Tronc Commun)')),
            ],
            options={
                'ordering': ['order'],
            },
        ),
        migrations.CreateModel(
            name='Subject',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='Chapter',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('order', models.PositiveIntegerField(help_text='Order in which this chapter appears in the subject')),
                ('subject', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chapters', to='exercises.subject')),
                ('class_levels', models.ManyToManyField(related_name='chapters', to='exercises.classlevel')),
            ],
            options={
                'ordering': ['order'],
            },
        ),
        migrations.CreateModel(
            name='Exercise',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('content', models.TextField()),
                ('type', models.CharField(choices=[('exercise', 'Exercise'), ('course', 'Course')], default='exercise', max_length=20)),
                ('difficulty', models.CharField(choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')], default='medium', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('view_count', models.PositiveIntegerField(default=0)),
                ('solution', models.TextField(blank=True, null=True)),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='exercises', to=settings.AUTH_USER_MODEL)),
                ('class_level', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='exercises', to='exercises.classlevel')),
                ('subject', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='exercises', to='exercises.subject')),
                ('tags', models.ManyToManyField(related_name='tagged_exercises', to='exercises.chapter')),
                ('upvotes', models.ManyToManyField(blank=True, related_name='upvoted_exercises', to=settings.AUTH_USER_MODEL)),
                ('downvotes', models.ManyToManyField(blank=True, related_name='downvoted_exercises', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Solution',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('exercise', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='solutions', to='exercises.exercise')),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='solutions', to=settings.AUTH_USER_MODEL)),
                ('upvotes', models.ManyToManyField(blank=True, related_name='upvoted_solutions', to=settings.AUTH_USER_MODEL)),
                ('downvotes', models.ManyToManyField(blank=True, related_name='downvoted_solutions', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Comment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('exercise', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='exercises.exercise')),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='replies', to='exercises.comment')),
                ('upvotes', models.ManyToManyField(blank=True, related_name='upvoted_comments', to=settings.AUTH_USER_MODEL)),
                ('downvotes', models.ManyToManyField(blank=True, related_name='downvoted_comments', to=settings.AUTH_USER_MODEL)),
                ('mentioned_users', models.ManyToManyField(blank=True, related_name='mentioned_in_comments', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.RunPython(create_initial_data),
    ]