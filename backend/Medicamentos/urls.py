from django.urls import path

from .views.medicamentos_controller import MedicamentoController

urlpatterns = [
    path("Medicamentos/", MedicamentoController.as_view(), name="medicamento-list"),
    path("Medicamentos/<int:cod>/", MedicamentoController.as_view(), name="medicamento-detail"), 

    
]
