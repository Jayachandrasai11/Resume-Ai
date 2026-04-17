from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CandidatePipelineViewSet, UpdateCandidateStageAPIView

router = DefaultRouter()
router.register(r'', CandidatePipelineViewSet, basename='pipeline')

urlpatterns = [
    path('', include(router.urls)),
    path('update-stage/', UpdateCandidateStageAPIView.as_view(), name='update-candidate-stage'),
]