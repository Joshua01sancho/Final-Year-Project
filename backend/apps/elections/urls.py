from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_elections, name='list_elections'),
    path('vote/', views.cast_vote, name='cast_vote'),
    path('verify-vote/<str:vote_hash>/', views.verify_vote, name='verify_vote'),
    path('results/<int:election_id>/', views.get_election_results, name='get_election_results'),
] 