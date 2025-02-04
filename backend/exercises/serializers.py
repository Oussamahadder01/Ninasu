from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Exercise, Comment, ClassLevel, Subject, Chapter, Solution


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'date_joined')
        read_only_fields = ('date_joined',)


class SolutionSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    upvotes_count = serializers.SerializerMethodField()
    downvotes_count = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Solution
        fields = (
            'id', 'content', 'author', 'created_at', 'updated_at',
            'upvotes_count', 'downvotes_count', 'user_vote',
        )

    def get_upvotes_count(self, obj):
        return obj.upvotes.count()

    def get_downvotes_count(self, obj):
        return obj.downvotes.count()

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 'none'
        if obj.upvotes.filter(id=request.user.id).exists():
            return 'up'
        if obj.downvotes.filter(id=request.user.id).exists():
            return 'down'
        return 'none'


class RecursiveCommentSerializer(serializers.Serializer):
    def to_representation(self, instance):
        serializer = self.parent.parent.__class__(instance, context=self.context)
        return serializer.data


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    upvotes_count = serializers.SerializerMethodField()
    downvotes_count = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    replies = RecursiveCommentSerializer(many=True, read_only=True)
    mentioned_users = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = Comment
        fields = (
            'id', 'content', 'author', 'created_at', 
            'upvotes_count', 'downvotes_count', 'user_vote', 
            'parent', 'replies', 'mentioned_users'
        )
        read_only_fields = ('author', 'created_at', 'mentioned_users')

    def get_upvotes_count(self, obj):
        return obj.upvotes.count()

    def get_downvotes_count(self, obj):
        return obj.downvotes.count()

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 'none'
        if obj.upvotes.filter(id=request.user.id).exists():
            return 'up'
        if obj.downvotes.filter(id=request.user.id).exists():
            return 'down'
        return 'none'


class ClassLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassLevel
        fields = ('id', 'name','order')


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ('id', 'name','class_level')


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ('id', 'name','subject','class_level','order')


class ExerciseSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    upvotes_count = serializers.SerializerMethodField()
    downvotes_count = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    class_level = ClassLevelSerializer()
    subject = SubjectSerializer()
    tags = ChapterSerializer(many=True)
    solutions = SolutionSerializer(many=True, read_only=True)  # Champ 'solutions' et non 'solution'

    class Meta:
        model = Exercise
        fields = (
            'id', 'title', 'content', 'type', 'class_level', 'subject',
            'tags', 'difficulty', 'author', 'created_at', 'updated_at',
            'upvotes_count', 'downvotes_count', 'user_vote', 'view_count', 
            'comments', 'solutions'  # Changer ici de 'solution' à 'solutions'
        )
        read_only_fields = ('author', 'created_at', 'updated_at', 'view_count')

    def get_upvotes_count(self, obj):
        return obj.upvotes.count()

    def get_downvotes_count(self, obj):
        return obj.downvotes.count()

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 'none'
        if obj.upvotes.filter(id=request.user.id).exists():
            return 'up'
        if obj.downvotes.filter(id=request.user.id).exists():
            return 'down'
        return 'none'


class ExerciseCreateSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField(), write_only=True)
    solution_content = serializers.CharField(required=False, write_only=True, allow_blank=True)

    class Meta:
        model = Exercise
        fields = (
            'title', 'content', 'type', 'class_level', 'subject',
            'tags', 'difficulty', 'solution_content'
        )

    def create(self, validated_data):
        tags = validated_data.pop('tags', [])
        solution_content = validated_data.pop('solution_content', None)
        
        # Create exercise
        exercise = Exercise.objects.create(
            author=validated_data.pop('author'),
            **validated_data
        )
        exercise.tags.set(tags)
        
        # Create solution if provided
        if solution_content:
            Solution.objects.create(
                exercise=exercise,
                content=solution_content,
                author=exercise.author
            )
        
        return exercise

    def update(self, instance, validated_data):
        tags = validated_data.pop('tags', [])
        solution_content = validated_data.pop('solution_content', None)
        
        # Update exercise fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update tags
        instance.tags.set(tags)
        
        # Update or create solution
        if solution_content is not None:
            try:
                # Essaie de récupérer la première solution existante
                solution = instance.solutions.first()
                if solution:
                    # Met à jour la solution existante
                    solution.content = solution_content
                    solution.save()
                else:
                    # Crée une nouvelle solution si aucune n'existe
                    Solution.objects.create(
                        exercise=instance,
                        content=solution_content,
                        author=instance.author
                    )
            except Solution.DoesNotExist:
                # Crée une nouvelle solution si aucune n'existe
                Solution.objects.create(
                    exercise=instance,
                    content=solution_content,
                    author=instance.author
                )
        
        return instance