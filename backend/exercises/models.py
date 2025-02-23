from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType

class ClassLevel(models.Model):
    name = models.CharField(max_length=100)
    order = models.PositiveIntegerField(unique=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class Subject(models.Model):
    name = models.CharField(max_length=100)
    class_levels = models.ManyToManyField(ClassLevel, related_name='subjects')

    def __str__(self):
        return self.name

class Chapter(models.Model):
    name = models.CharField(max_length=100)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='chapters')
    class_levels = models.ManyToManyField(ClassLevel, related_name = 'chapters')
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ['order']
        unique_together = ['subject', 'order']

    def __str__(self):
        return f"{self.name}_{self.class_levels.name}"
    
class Vote(models.Model):
    UP = 1
    DOWN = -1
    UNVOTE = 0

    VOTE_CHOICES = [
        (UP, 'Upvote'),
        (DOWN, 'Downvote'),
        (UNVOTE, 'Unvote'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    value = models.SmallIntegerField(choices=VOTE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        unique_together = ('user', 'content_type', 'object_id')
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
        ]

class VotableMixin(models.Model):
    votes = GenericRelation(Vote)

    class Meta:
        abstract = True

    @property
    def vote_count(self):
        return self.votes.filter(value=Vote.UP).count() - self.votes.filter(value=Vote.DOWN).count()


class Exercise(VotableMixin, models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'easy'),
        ('medium', 'medium'),
        ('hard', 'hard'),
    ]
    
    title = models.CharField(max_length=200)
    content = models.TextField()
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    chapters = models.ManyToManyField(Chapter, related_name='exercises')
    class_levels = models.ManyToManyField(ClassLevel, related_name='exercises')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exercises')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    view_count = models.PositiveIntegerField(default=0)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='exercises', null=True)

    def __str__(self):
        return self.title

class Solution(VotableMixin, models.Model):
    exercise = models.OneToOneField(Exercise, on_delete=models.CASCADE, related_name='solution')
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='solutions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Solution for {self.exercise.title}"

class Comment(VotableMixin, models.Model):
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')

    def __str__(self):
        return f"Comment by {self.author.username} on {self.exercise.title}"



