# Generated by Django 5.1.5 on 2025-02-06 23:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('exercises', '0002_rename_class_level_subject_class_levels_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='chapter',
            name='class_levels',
            field=models.ManyToManyField(related_name='chapters', to='exercises.classlevel'),
        ),
    ]
