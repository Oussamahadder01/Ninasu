from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q, Prefetch
from django.contrib.auth.models import User
from .models import ClassLevel, Subject, Chapter, Exercise, Solution, Comment, ExerciseVote, CommentVote, SolutionVote
from .serializers import ClassLevelSerializer, SubjectSerializer, ChapterSerializer, ExerciseSerializer, SolutionSerializer, CommentSerializer

class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

class ClassLevelViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ClassLevel.objects.all()
    serializer_class = ClassLevelSerializer

class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer

    def get_queryset(self):
        queryset = Subject.objects.all()
        class_level_id = self.request.query_params.getlist('class_level[]')

        filters = Q()
        if class_level_id:
            filters |= Q(class_levels__id__in=class_level_id)
        queryset = queryset.filter(filters)

        return queryset

class ChapterViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer

    def get_queryset(self):
        queryset = Chapter.objects.all()
        subject_id = self.request.query_params.getlist('subject[]')
        class_level_id = self.request.query_params.getlist('class_level[]')

        filters_subject = Q()
        filters_class_level = Q()

        if subject_id:
            filters_subject |= Q(subject__id__in=subject_id)
        if class_level_id:
            filters_class_level |= Q(class_levels__id__in=class_level_id)
        filters = (filters_subject) & (filters_class_level)
        queryset = queryset.filter(filters)
        return queryset

class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


    def get_queryset(self):
        queryset = Exercise.objects.all().select_related(
            'author', 'solution'
        ).prefetch_related(
            'chapters',
            'class_levels',
            'comments',
            'votes'
        )

        # Filtering
        class_levels = self.request.query_params.getlist('class_levels[]')
        subjects = self.request.query_params.getlist('subjects[]')
        chapters = self.request.query_params.getlist('chapters[]')
        difficulties = self.request.query_params.getlist('difficulties[]')

        filters_difficulty = Q()
        filters_class_levels = Q()
        filters_subjects = Q()
        filters_chapters = Q()

        if class_levels :
            filters_class_levels |= Q(class_levels__id__in=class_levels)
        if subjects :
            filters_subjects |= Q(chapters__subject__id__in=subjects)
        if chapters:
            filters_chapters |= Q(chapters__id__in=chapters)
        if difficulties:
            filters_difficulty |= Q(difficulty__in=difficulties)
        filters = (filters_class_levels) & (filters_subjects) & (filters_chapters) & (filters_difficulty)

        queryset = queryset.filter(filters)

        # Sorting
        sort_by = self.request.query_params.get('sort', 'created_at')
        sort_order = '-' if self.request.query_params.get('sort_order', 'desc') == 'desc' else ''

        if sort_by == 'votes':
            queryset = queryset.annotate(
                vote_count=Count('votes', filter=Q(votes__vote='up')) - Count('votes', filter=Q(votes__vote='down'))
            ).order_by(f"{sort_order}vote_count")
        elif sort_by in ['created_at', 'updated_at', 'view_count']:
            queryset = queryset.order_by(f"{sort_order}{sort_by}")

        return queryset.distinct()

    def save(self, serializer):
        serializer.save(author=self.request.user)
    

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        exercise = self.get_object()
        vote_type = request.data.get('vote')

        if vote_type not in ['up', 'down', None]:
            return Response({'error': 'Invalid vote type'}, status=status.HTTP_400_BAD_REQUEST)

        vote, created = ExerciseVote.objects.get_or_create(
            user=request.user,
            exercise=exercise,
            defaults={'vote': vote_type}
        )

        if not created:
            if vote_type is None:
                vote.delete()
            elif vote.vote != vote_type:
                vote.vote = vote_type
                vote.save()

        return Response(self.get_serializer(exercise).data)

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        exercise = self.get_object()
        serializer = CommentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(exercise=exercise, author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def interact(self, request, pk=None):
        exercise = self.get_object()
        interaction_type = request.data.get('type')
        value = request.data.get('value', True)

        if interaction_type not in ['completed', 'favorite', 'watch_later']:
            return Response({'error': 'Invalid interaction type'}, status=status.HTTP_400_BAD_REQUEST)

        interaction, created = UserExerciseInteraction.objects.get_or_create(
            user=request.user,
            exercise=exercise,
            defaults={interaction_type: value}
        )

        if not created:
            setattr(interaction, interaction_type, value)
            interaction.save()

        return Response(self.get_serializer(exercise).data)

class SolutionViewSet(viewsets.ModelViewSet):
    queryset = Solution.objects.all()
    serializer_class = SolutionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        solution = self.get_object()
        vote_type = request.data.get('vote')

        if vote_type not in ['up', 'down', None]:
            return Response({'error': 'Invalid vote type'}, status=status.HTTP_400_BAD_REQUEST)

        vote, created = SolutionVote.objects.get_or_create(
            user=request.user,
            solution=solution,
            defaults={'vote': vote_type}
        )

        if not created:
            if vote_type is None:
                vote.delete()
            elif vote.vote != vote_type:
                vote.vote = vote_type
                vote.save()

        return Response(self.get_serializer(solution).data)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        comment = self.get_object()
        vote_type = request.data.get('vote')

        if vote_type not in ['up', 'down', None]:
            return Response({'error': 'Invalid vote type'}, status=status.HTTP_400_BAD_REQUEST)

        vote, created = CommentVote.objects.get_or_create(
            user=request.user,
            comment=comment,
            defaults={'vote': vote_type}
        )

        if not created:
            if vote_type is None:
                vote.delete()
            elif vote.vote != vote_type:
                vote.vote = vote_type
                vote.save()

        return Response(self.get_serializer(comment).data)
