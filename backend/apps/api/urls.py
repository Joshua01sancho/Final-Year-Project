from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'elections', views.ElectionViewSet, basename='election')
router.register(r'candidates', views.CandidateViewSet, basename='candidate')
router.register(r'votes', views.VoteViewSet, basename='vote')
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'voter-profiles', views.VoterProfileViewSet, basename='voterprofile')
router.register(r'biometric', views.BiometricDataViewSet, basename='biometric')

urlpatterns = [
    path('', include(router.urls)),
    path('elections/<int:pk>/results/', views.ElectionResultView.as_view(), name='election-results'),
    path('elections/<int:pk>/decrypt/', views.ElectionDecryptView.as_view(), name='election-decrypt'),
    path('vote/', views.cast_vote, name='cast_vote'),
    path('elections/verify-vote/<str:vote_hash>/', views.verify_vote, name='verify_vote'),
    path('auth/face-login/', views.FaceLoginView.as_view(), name='face-login'),
    path('auth/fingerprint-login/', views.FingerprintLoginView.as_view(), name='fingerprint-login'),
    path('auth/2fa/', views.TwoFAVerifyView.as_view(), name='2fa-verify'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('admin/analytics/', views.AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/elections/', views.AdminElectionListView.as_view(), name='admin-election-list'),
    path('user/me/', views.user_me, name='user-me'),
] 