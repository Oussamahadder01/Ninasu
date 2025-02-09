from rest_framework import status, views, generics
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Count, Q
from .models import ViewHistory, UserProfile
from .serializers import (
    UserSerializer, 
    UserStatsSerializer, 
    UserHistorySerializer,
)
from exercises.models import Exercise, ExerciseVote

class LoginView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get('identifier')
        password = request.data.get('password')

        if not all([identifier, password]):
            return Response(
                {'error': 'Please provide email/username and password'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Try to find user by email or username
        try:
            if '@' in identifier:
                user = User.objects.get(email=identifier)
            else:
                user = User.objects.get(username=identifier)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Authenticate with username
        user = authenticate(username=user.username, password=password)
        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        login(request, user)
        return Response(UserSerializer(user).data)

class RegisterView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not all([username, email, password]):
            return Response(
                {'error': 'Please provide all required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        login(request, user)
        return Response(UserSerializer(user).data)

class LogoutView(views.APIView):
    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_200_OK)

@api_view(['GET'])
def get_current_user(request):
    if request.user.is_authenticated:
        return Response(UserSerializer(request.user).data)
    return Response(status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_stats(request):
    user = request.user
    stats = {
        'exercisesCompleted': ViewHistory.objects.filter(
            user=user, 
            completed=True, 
            content__type='exercise'
        ).count(),
        'lessonsCompleted': ViewHistory.objects.filter(
            user=user, 
            completed=True, 
            content__type='course'
        ).count(),
        'totalUpvotes': Exercise.objects.filter(author=user).aggregate(
            total=Count('votes')
        )['total'] or 0,
    }
    return Response(UserStatsSerializer(user, context={'stats': stats}).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_history(request):
    user = request.user
    history = {
        'recentlyViewed': Exercise.objects.filter(
            viewhistory__user=user
        ).order_by('-viewhistory__viewed_at')[:5],
        'upvoted': ExerciseVote.objects.filter(user_id=user, vote = 'up')[:5],
    }
    return Response(UserHistorySerializer(history).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_content_viewed(request, content_id):
    try:
        content = Exercise.objects.get(id=content_id)
        ViewHistory.objects.get_or_create(
            user=request.user,
            content=content
        )
        content.view_count += 1
        content.save()
        return Response(status=status.HTTP_200_OK)
    except Exercise.DoesNotExist:
        return Response(
            {'error': 'Content not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_content_completed(request, content_id):
    try:
        content = Exercise.objects.get(id=content_id)
        history, _ = ViewHistory.objects.get_or_create(
            user=request.user,
            content=content
        )
        history.completed = True
        history.save()
        return Response(status=status.HTTP_200_OK)
    except Exercise.DoesNotExist:
        return Response(
            {'error': 'Content not found'},
            status=status.HTTP_404_NOT_FOUND
        )