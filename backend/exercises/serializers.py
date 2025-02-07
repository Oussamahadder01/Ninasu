from rest_framework import serializers
from .models import ClassLevel, Subject, Chapter, Exercise, Solution, Comment, ExerciseVote, CommentVote, SolutionVote
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class ClassLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassLevel
        fields = ['id', 'name', 'order']

class SubjectSerializer(serializers.ModelSerializer):
    class_levels = ClassLevelSerializer(many=True, read_only=True)

    class Meta:
        model = Subject
        fields = ['id', 'name', 'class_levels']

class ChapterSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    class_levels = ClassLevelSerializer(many=True, read_only=True)

    class Meta:
        model = Chapter
        fields = ['id', 'name', 'order', 'subject', 'class_levels']

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    vote_count = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'content', 'author', 'created_at', 'replies', 'vote_count', 'user_vote']

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True, context=self.context).data
        return []

    def get_vote_count(self, obj):
        return obj.votes.filter(vote='up').count() - obj.votes.filter(vote='down').count()

    def get_user_vote(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            vote = obj.votes.filter(user=user).first()
            return vote.vote if vote else None
        return None

class SolutionSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    vote_count = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Solution
        fields = ['id', 'content', 'author', 'created_at', 'updated_at', 'vote_count', 'user_vote']

    def get_vote_count(self, obj):
        return obj.votes.filter(vote='up').count() - obj.votes.filter(vote='down').count()

    def get_user_vote(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            vote = obj.votes.filter(user=user).first()
            return vote.vote if vote else None
        return None

class ExerciseSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    chapters = ChapterSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    solution = SolutionSerializer(read_only=True)
    vote_count = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    user_interaction = serializers.SerializerMethodField()

    class Meta:
        model = Exercise
        fields = ['id', 'title', 'content', 'difficulty', 'chapters', 'author', 'created_at', 'updated_at', 'view_count', 'comments', 'solution', 'vote_count', 'user_vote', 'user_interaction']

    def get_vote_count(self, obj):
        return obj.votes.filter(vote='up').count() - obj.votes.filter(vote='down').count()

    def get_user_vote(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            vote = obj.votes.filter(user=user).first()
            return vote.vote if vote else None
        return None

    def get_user_interaction(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            interaction = obj.user_interactions.filter(user=user).first()
            if interaction:
                return {
                    'completed': interaction.completed,
                    'favorite': interaction.favorite,
                    'watch_later': interaction.watch_later
                }
        return None
    def create(self, validated_data):
        chapters = validated_data.pop('chapters')
        class_levels = validated_data.pop('class_levels')
        exercise = Exercise.objects.create(**validated_data)
        exercise.chapters.set(chapters)
        exercise.class_levels.set(class_levels)
        return exercise

    def update(self, instance, validated_data):
        chapters = validated_data.pop('chapters', None)
        class_levels = validated_data.pop('class_levels', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if chapters is not None:
            instance.chapters.set(chapters)
        if class_levels is not None:
            instance.class_levels.set(class_levels)
        instance.save()
        return instance