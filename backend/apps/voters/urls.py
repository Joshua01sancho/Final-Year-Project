from django.urls import path
from . import auth, admin_views

urlpatterns = [
    # Face authentication
    path('auth/face-login/', auth.face_login, name='face_login'),
    path('auth/face-login-local/', auth.face_login_local, name='face_login_local'),
    path('auth/face-signup/', auth.face_signup, name='face_signup'),
    path('auth/face-signup-local/', auth.face_signup_local, name='face_signup_local'),
    
    # Traditional authentication
    path('auth/login/', auth.traditional_login, name='traditional_login'),
    path('auth/signup/', auth.traditional_signup, name='traditional_signup'),
    path('auth/add-face-auth/', auth.add_face_auth_to_user, name='add_face_auth_to_user'),
    
    # Admin views
    path('admin/registration-stats/', admin_views.registration_statistics, name='registration_statistics'),
    path('admin/test-face-recognition/', admin_views.test_face_recognition, name='test_face_recognition'),
] 