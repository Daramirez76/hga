from django.urls import path

from .views.register_controller import RegisterController
from .views.login_controller import LoginController
from .views.forgot_password_controller import ForgotPasswordController, ResetPasswordController

urlpatterns = [
    path("register/", RegisterController.as_view(), name="register"),
    path("login/", LoginController.as_view(), name="login"),
    path("forgot_password/", ForgotPasswordController.as_view(), name="forgot_password"),
    path("forgot_password/reset/", ResetPasswordController.as_view(), name="reset_password"),
]




