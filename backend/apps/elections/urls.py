from django.urls import path
from . import views

urlpatterns = [
    path('vote/', views.cast_vote, name='cast_vote'),
    path('verify-vote/<str:vote_hash>/', views.verify_vote, name='verify_vote'),
] 