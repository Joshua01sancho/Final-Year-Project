from django.urls import path
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({'status': 'ok', 'message': 'E-Voting backend is healthy'})

urlpatterns = [
    path('', health_check, name='health-check'),
] 