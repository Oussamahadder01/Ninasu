from django.db import models
from django.contrib.auth.models import User
import re

class ClassLevel(models.Model):
    name = models.CharField(max_length=100)
    order = models.PositiveIntegerField(help_text="Order in which this class appears (e.g., 1 for Tronc Commun)")

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class Subject(models.Model):
    name = models.CharField(max_length=100)
    class_level = models.ManyToManyField(ClassLevel, related_name ="subjects")

    def __str__(self):
        return self.name

class Chapter(models.Model):
    name = models.CharField(max_length=100)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='chapters')
    class_level = models.ManyToManyField(ClassLevel, related_name='chapters')
    order = models.PositiveIntegerField(help_text="Order in which this chapter appears in the subject")

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.subject.name} - {self.name}"

class Exercise(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    TYPE_CHOICES = [
        ('exercise', 'Exercise'),
        ('course', 'Course'),
    ]
    
    title = models.CharField(max_length=200)
    content = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='exercise')
    class_level = models.ForeignKey(ClassLevel, on_delete=models.CASCADE, related_name='exercises')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='exercises')
    tags = models.ManyToManyField(Chapter, related_name='tagged_exercises')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exercises')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    upvotes = models.ManyToManyField(User, related_name='upvoted_exercises', blank=True)
    downvotes = models.ManyToManyField(User, related_name='downvoted_exercises', blank=True)
    view_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.title

    @property
    def upvotes_count(self):
        return self.upvotes.count()

    @property
    def downvotes_count(self):
        return self.downvotes.count()

class Solution(models.Model):
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='solutions')
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='solutions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    upvotes = models.ManyToManyField(User, related_name='upvoted_solutions', blank=True)
    downvotes = models.ManyToManyField(User, related_name='downvoted_solutions', blank=True)

    def __str__(self):
        return f"Solution for {self.exercise.title}"

    @property
    def upvotes_count(self):
        return self.upvotes.count()

    @property
    def downvotes_count(self):
        return self.downvotes.count()

class Comment(models.Model):
    exercise = models.ForeignKey('Exercise', on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    upvotes = models.ManyToManyField(User, related_name='upvoted_comments', blank=True)
    downvotes = models.ManyToManyField(User, related_name='downvoted_comments', blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    mentioned_users = models.ManyToManyField(User, related_name='mentioned_in_comments', blank=True)

    def __str__(self):
        return f'Comment by {self.author.username} on {self.exercise.title}'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        mentions = re.findall(r'@(\w+)', self.content)
        self.mentioned_users.clear()
        if mentions:
            mentioned_users = User.objects.filter(username__in=mentions)
            self.mentioned_users.add(*mentioned_users)