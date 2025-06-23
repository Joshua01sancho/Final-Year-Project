from django.urls import path
from . import auth, admin_views

urlpatterns = [
    # Face authentication
    path('auth/face-login/', auth.face_login, name='face_login'),
    path('auth/face-signup/', auth.face_signup, name='face_signup'),
    
    # Traditional authentication
    path('auth/login/', auth.traditional_login, name='traditional_login'),
    path('auth/signup/', auth.traditional_signup, name='traditional_signup'),
    
    # Admin views
    path('admin/registration-stats/', admin_views.registration_statistics, name='registration_statistics'),
    path('admin/test-face-recognition/', admin_views.test_face_recognition, name='test_face_recognition'),
] 