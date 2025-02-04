# Generated by Django 5.1.5 on 2025-02-04 00:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('exercises', '0002_remove_exercise_solution'),
    ]

    operations = [
        migrations.RenameField(
            model_name='chapter',
            old_name='class_levels',
            new_name='class_level',
        ),
        migrations.AddField(
            model_name='subject',
            name='class_level',
            field=models.ManyToManyField(related_name='subjects', to='exercises.classlevel'),
        ),
    ]
