from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from exercises.models import Exercise

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.URLField(blank=True)
    favorite_subjects = models.JSONField(default=list, blank=True)
    reputation = models.IntegerField(default=0)
    github_username = models.CharField(max_length=39, blank=True)
    website = models.URLField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    streak_days = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    level = models.IntegerField(default=1)
    experience_points = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username}'s profile"

    @property
    def total_contributions(self):
        return self.user.exercises.count()

    @property
    def total_upvotes_received(self):
        return sum(exercise.upvotes.count() for exercise in self.user.exercises.all())

    @property
    def total_comments(self):
        return self.user.comment_set.count()

    @property
    def level_progress(self):
        xp_for_next_level = (self.level + 1) * 1000
        xp_for_current_level = self.level * 1000
        xp_in_current_level = self.experience_points - xp_for_current_level
        total_xp_needed = xp_for_next_level - xp_for_current_level
        return int((xp_in_current_level / total_xp_needed) * 100)

class ViewHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='view_history')
    content = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now=True)
    completed = models.BooleanField(default=False)

    class Meta:
        ordering = ['-viewed_at']
        unique_together = ['user', 'content']

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()