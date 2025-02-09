from rest_framework import viewsets, status, permissions, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q, Prefetch
from django.contrib.auth.models import User
from .models import ClassLevel, Subject, Chapter, Exercise, Solution, Comment, ExerciseVote, CommentVote, SolutionVote
from .serializers import ClassLevelSerializer, SubjectSerializer, ChapterSerializer, ExerciseSerializer, SolutionSerializer, CommentSerializer, ExerciseCreateSerializer
from rest_framework.exceptions import PermissionDenied

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
        if class_level_id or class_level_id != '':
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

        # Filter out empty strings and convert to integers
        subject_ids = [int(id) for id in subject_id if id.isdigit()]
        class_level_ids = [int(id) for id in class_level_id if id.isdigit()]

        filters_subject = Q()
        filters_class_level = Q()

        if subject_ids:
            filters_subject |= Q(subject__id__in=subject_ids)
        if class_level_ids:
            filters_class_level |= Q(class_levels__id__in=class_level_ids)

        filters = filters_subject & filters_class_level
        queryset = queryset.filter(filters)
        return queryset

class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ExerciseCreateSerializer
        return ExerciseSerializer

    def get_queryset(self):
        queryset = Exercise.objects.all().select_related(
            'author', 'solution','subject'
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

        if class_levels:
            queryset = queryset.filter(class_levels__id__in=class_levels)
        if subjects:
            queryset = queryset.filter(subject__id__in=subjects)
        if chapters:
            queryset = queryset.filter(chapters__id__in=chapters)
        if difficulties:
            queryset = queryset.filter(difficulty__in=difficulties)

        # Sorting
        sort_by = self.request.query_params.get('sort', '-created_at')
        if sort_by == 'votes':
            queryset = queryset.annotate(
                vote_count=Count('votes', filter=Q(votes__vote='up')) - 
                          Count('votes', filter=Q(votes__vote='down'))
            ).order_by('-vote_count')
        else:
            queryset = queryset.order_by(sort_by)

        return queryset.distinct()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        print(request.data)
        print(serializer.is_valid(raise_exception=True))
        self.perform_update(serializer)
        return Response(serializer.data)

    def perform_create(self, serializer):
        if not self.request.user.is_authenticated:
            raise PermissionDenied("You must be logged in to create an exercise.")
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.is_authenticated:
            raise PermissionDenied("You must be logged in to create an exercise.")
        serializer.save()

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        exercise = self.get_object()
        vote_type = request.data.get('vote')

        if vote_type not in ['up', 'down', None]:
            return Response(
                {'error': 'Invalid vote type'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

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
        serializer = CommentSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save(
                exercise=exercise,
                author=request.user
            )
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
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
    
