from django.urls import path

from .views import ResidenteViewSet

urlpatterns = [
    path("", ResidenteViewSet.as_view({"get": "list", "post": "create"}), name="residente-list"),
    path("<int:pk>/", ResidenteViewSet.as_view({"get": "retrieve", "put": "update", "delete": "destroy"}), name="residente-detail"),
]
