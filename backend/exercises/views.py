from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q, Prefetch
from .models import ClassLevel, Subject, Chapter, Exercise, Solution, Comment, Vote
from .serializers import ClassLevelSerializer, SubjectSerializer, ChapterSerializer, ExerciseSerializer, SolutionSerializer, CommentSerializer, ExerciseCreateSerializer
from rest_framework.exceptions import PermissionDenied
import logging
from django.contrib.contenttypes.models import ContentType


logger = logging.getLogger('django')

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

class VoteMixin:
    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        obj = self.get_object()
        vote_value = request.data.get('value')

        if vote_value not in [Vote.UP, Vote.DOWN, Vote.UNVOTE]:
            return Response({'error': 'Invalid vote value'}, status=status.HTTP_400_BAD_REQUEST)

        vote, created = Vote.objects.get_or_create(
            user=request.user,
            content_type=ContentType.objects.get_for_model(obj),
            object_id=obj.id,
            defaults={'value': vote_value}
        )
        logger.info(f"test {vote_value}")

        if not created:
            if vote_value == Vote.UNVOTE:
                vote.delete()
            elif vote.value != vote_value:
                vote.value = vote_value
                vote.save()

        return Response(self.get_serializer(obj).data)

class ExerciseViewSet(VoteMixin, viewsets.ModelViewSet):
    queryset = Exercise.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ExerciseCreateSerializer
        return ExerciseSerializer

    def get_queryset(self):
        queryset = Exercise.objects.all().select_related(
            'author', 'solution', 'subject'
        ).prefetch_related(
            'chapters',
            'class_levels',
            'comments',
            'votes'
        ).annotate(
            vote_count_annotation=Count('votes', filter=Q(votes__value=Vote.UP)) - 
                                  Count('votes', filter=Q(votes__value=Vote.DOWN))
        )

        

        logger.info(f"Filtered Exercises - Params: {self.request.query_params}")

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
            queryset = queryset.order_by('-vote_count_annotation')
        else:
            queryset = queryset.order_by(sort_by)

        return queryset.distinct()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        logger.info(f"POST request to create exercise with following data : {self.request.data}")
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        logger.info(f"PUT request to update exercise with following data : {self.request.data}")
        print(serializer.is_valid(raise_exception=True))
        self.perform_update(serializer)
        return Response(serializer.data)

    def perform_create(self, serializer):
        if not self.request.user.is_authenticated:
            logger.warning("Unauthorized attempt to create an exercise.")

            raise PermissionDenied("You must be logged in to create an exercise.")
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.is_authenticated:
            logger.warning("Unauthorized attempt to update an exercise.")

            raise PermissionDenied("You must be logged in to create an exercise.")
        serializer.save()

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        exercise = self.get_object()
        vote_value = request.data.get('value')

        logger.info(f"Vote request for Exercise ID {exercise.id} with vote value: {vote_value}")
        logger.info(f"Request data: {request.data}")

        if vote_value not in [Vote.UP, Vote.DOWN, Vote.UNVOTE]:
            logger.error(f"Invalid vote value: {vote_value} for Exercise ID {exercise.id}")
            return Response(
                {'error': 'Invalid vote value'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        vote, created = Vote.objects.get_or_create(
            user=request.user,
            content_type=ContentType.objects.get_for_model(exercise),
            object_id=exercise.id,
            defaults={'value': vote_value}
        )
        logger.info(f"Vote object created: {created}")
        logger.info(f"Vote object value: {vote.value}")
        logger.info(ContentType.objects.get_for_model(exercise))

        if not created:
            if vote_value == Vote.UNVOTE:
                vote.delete()
            elif vote.value != vote_value:
                vote.value = vote_value
                vote.save()
        # Refresh the exercise object to get updated vote count
        exercise.refresh_from_db()
        return Response(self.get_serializer(exercise).data)

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        exercise = self.get_object()
        serializer = CommentSerializer(
            data=request.data,
            context={'request': request}
        )
        logger.info(f"Comment request for Exercise ID {exercise.id}")
        logger.info(f"Request data: {request.data}")
        if serializer.is_valid():
            serializer.save(
                exercise=exercise,
                author=request.user,
                parent_id=request.data.get('parent')  # Pass parent_id here
            )
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
class SolutionViewSet(VoteMixin, viewsets.ModelViewSet):
    queryset = Solution.objects.all()
    serializer_class = SolutionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class CommentViewSet(VoteMixin, viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
