from django.urls import path

from .views import ResidenteViewSet

urlpatterns = [
    path("Residentes/", ResidenteViewSet.as_view({"get": "list", "post": "create"}), name="residente-list"),
    path("Residentes/<int:pk>/", ResidenteViewSet.as_view({"get": "retrieve", "put": "update", "delete": "destroy"}), name="residente-detail"),
]
