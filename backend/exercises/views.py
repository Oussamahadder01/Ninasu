from rest_framework import viewsets, status, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.contrib.auth.models import User
from .models import Exercise, Comment, ClassLevel, Subject, Chapter, Solution
from .serializers import (
    ExerciseSerializer, ExerciseCreateSerializer, CommentSerializer,
    ClassLevelSerializer, SubjectSerializer, ChapterSerializer, SolutionSerializer
)

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.contrib.auth.models import User
from .models import Exercise, Comment, ClassLevel, Subject, Chapter
from .serializers import (
    ExerciseSerializer, ExerciseCreateSerializer, CommentSerializer,
    ClassLevelSerializer, SubjectSerializer, ChapterSerializer
)

class IsAuthenticatedForWriting(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

class ExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticatedForWriting]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ExerciseCreateSerializer
        return ExerciseSerializer

    def get_queryset(self):
        queryset = Exercise.objects.all().prefetch_related(
            'solutions', 'solutions__author', 'solutions__upvotes', 'solutions__downvotes'
        )
        
        # Filtering
        type = self.request.query_params.get('type')
        class_level = self.request.query_params.get('class_level')
        subject = self.request.query_params.get('subject')
        tags = self.request.query_params.getlist('tags')
        difficulty = self.request.query_params.get('difficulty')

        if type:
            queryset = queryset.filter(type=type)
        if class_level:
            queryset = queryset.filter(class_level_id=class_level)
        if subject:
            queryset = queryset.filter(subject_id=subject)
        if tags:
            queryset = queryset.filter(tags__id__in=tags).distinct()
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)

        # Sorting
        sort = self.request.query_params.get('sort', 'newest')
        if sort == 'newest':
            queryset = queryset.order_by('-created_at')
        elif sort == 'oldest':
            queryset = queryset.order_by('created_at')
        elif sort == 'most_upvoted':
            queryset = queryset.annotate(
                vote_count=Count('upvotes')
            ).order_by('-vote_count')
        elif sort == 'most_commented':
            queryset = queryset.annotate(
                comment_count=Count('comments')
            ).order_by('-comment_count')

        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)



    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        exercise = self.get_object()
        
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        content = request.data.get('content')
        parent_id = request.data.get('parent')
        
        if not content or not content.strip():
            return Response(
                {'error': 'Comment content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            parent = Comment.objects.get(id=parent_id) if parent_id else None
            if parent and parent.exercise != exercise:
                return Response(
                    {'error': 'Parent comment does not belong to this exercise'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Comment.DoesNotExist:
            return Response(
                {'error': 'Parent comment not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        comment = Comment.objects.create(
            exercise=exercise,
            author=request.user,
            content=content,
            parent=parent
        )
        
        serializer = CommentSerializer(comment, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        exercise = self.get_object()
        vote_type = request.data.get('type')
        target = request.data.get('target', 'exercise')

        if vote_type not in ['up', 'down', 'none']:
            return Response(
                {'error': 'Invalid vote type'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if target == 'solution':
            solution = exercise.solutions.first()
            if not solution:
                return Response(
                    {'error': 'No solution found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            target_obj = solution
        else:
            target_obj = exercise

        # Vérifie le vote actuel
        has_upvoted = target_obj.upvotes.filter(id=request.user.id).exists()
        has_downvoted = target_obj.downvotes.filter(id=request.user.id).exists()

        # Supprime les votes existants
        target_obj.upvotes.remove(request.user)
        target_obj.downvotes.remove(request.user)

        # Ajoute le nouveau vote
        if vote_type == 'up' and not has_upvoted:
            target_obj.upvotes.add(request.user)
        elif vote_type == 'down' and not has_downvoted:
            target_obj.downvotes.add(request.user)

        return Response(self.get_serializer(exercise).data)

class SolutionViewSet(viewsets.ModelViewSet):
    serializer_class = SolutionSerializer
    permission_classes = [IsAuthenticatedForWriting]

    def get_queryset(self):
        return Solution.objects.all()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        solution = self.get_object()
        vote_type = request.data.get('type')

        if vote_type not in ['up', 'down', 'none']:
            return Response(
                {'error': 'Invalid vote type'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check current vote status
        has_upvoted = solution.upvotes.filter(id=request.user.id).exists()
        has_downvoted = solution.downvotes.filter(id=request.user.id).exists()

        # Remove existing votes
        solution.upvotes.remove(request.user)
        solution.downvotes.remove(request.user)

        # Add new vote if it's different from the current vote
        if vote_type == 'up' and not has_upvoted:
            solution.upvotes.add(request.user)
        elif vote_type == 'down' and not has_downvoted:
            solution.downvotes.add(request.user)

        serializer = self.get_serializer(solution)
        return Response(serializer.data)

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedForWriting]

    def get_queryset(self):
        return Comment.objects.all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        comment = self.get_object()
        vote_type = request.data.get('type')

        if vote_type not in ['up', 'down', 'none']:
            return Response(
                {'error': 'Invalid vote type'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check current vote status
        has_upvoted = comment.upvotes.filter(id=request.user.id).exists()
        has_downvoted = comment.downvotes.filter(id=request.user.id).exists()

        # Remove existing votes
        comment.upvotes.remove(request.user)
        comment.downvotes.remove(request.user)

        # Add new vote if it's different from the current vote
        if vote_type == 'up' and not has_upvoted:
            comment.upvotes.add(request.user)
        elif vote_type == 'down' and not has_downvoted:
            comment.downvotes.add(request.user)

        serializer = self.get_serializer(comment)
        return Response(serializer.data)
    
class ClassLevelViewSet(viewsets.ModelViewSet):
    queryset = ClassLevel.objects.all()
    serializer_class = ClassLevelSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['id', 'name']

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['id', 'name', 'class_level']

class ChapterViewSet(viewsets.ModelViewSet):
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['id', 'name', 'subject', 'class_level']

