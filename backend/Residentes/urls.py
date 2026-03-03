from django.urls import path, include
from rest_framework.routers import SimpleRouter

from .views import ResidenteViewSet

router = SimpleRouter()
router.register(r"", ResidenteViewSet, basename="residente")

urlpatterns = router.urls
