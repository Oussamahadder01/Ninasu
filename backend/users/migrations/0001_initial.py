# Generated by Django 5.1.6 on 2025-02-27 22:14

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('things', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AppearanceSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('theme', models.CharField(choices=[('light', 'Light'), ('dark', 'Dark')], default='light', max_length=10)),
                ('language', models.CharField(choices=[('fr', 'French'), ('en', 'English'), ('ar', 'Arabic')], default='fr', max_length=5)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='appearance_settings', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='NotificationSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email_notifications', models.BooleanField(default=True)),
                ('exercise_replies', models.BooleanField(default=True)),
                ('lesson_updates', models.BooleanField(default=True)),
                ('new_features', models.BooleanField(default=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='notification_settings', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='PrivacySettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('profile_visibility', models.CharField(choices=[('public', 'Public'), ('registered', 'Registered Users'), ('private', 'Private')], default='public', max_length=10)),
                ('activity_visibility', models.CharField(choices=[('public', 'Public'), ('registered', 'Registered Users'), ('private', 'Private')], default='public', max_length=10)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='privacy_settings', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('bio', models.TextField(blank=True, max_length=500)),
                ('avatar', models.URLField(blank=True)),
                ('favorite_subjects', models.JSONField(blank=True, default=list)),
                ('reputation', models.IntegerField(default=0)),
                ('github_username', models.CharField(blank=True, max_length=39)),
                ('website', models.URLField(blank=True)),
                ('location', models.CharField(blank=True, max_length=100)),
                ('streak_days', models.IntegerField(default=0)),
                ('last_activity_date', models.DateField(blank=True, null=True)),
                ('level', models.IntegerField(default=1)),
                ('experience_points', models.IntegerField(default=0)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='ViewHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('viewed_at', models.DateTimeField(auto_now=True)),
                ('completed', models.BooleanField(default=False)),
                ('content', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='things.exercise')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='view_history', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-viewed_at'],
                'unique_together': {('user', 'content')},
            },
        ),
    ]
