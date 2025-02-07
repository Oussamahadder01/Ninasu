from django.db import models
from django.contrib.auth.models import User

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

class Exercise(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
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

    def __str__(self):
        return self.title

class Solution(models.Model):
    exercise = models.OneToOneField(Exercise, on_delete=models.CASCADE, related_name='solution')
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='solutions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Solution for {self.exercise.title}"

class Comment(models.Model):
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')

    def __str__(self):
        return f"Comment by {self.author.username} on {self.exercise.title}"

class Vote(models.Model): 

    VOTE_CHOICES = [
        ('up', 'Upvote'),
        ('down', 'Downvote'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    vote = models.CharField(max_length=4, choices=VOTE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True

class ExerciseVote(Vote):
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='votes')

    class Meta:
        unique_together = ['user', 'exercise']

class CommentVote(Vote):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='votes')

    class Meta:
        unique_together = ['user', 'comment']

class SolutionVote(Vote):
    solution = models.ForeignKey(Solution, on_delete=models.CASCADE, related_name='votes')

    class Meta:
        unique_together = ['user', 'solution']
