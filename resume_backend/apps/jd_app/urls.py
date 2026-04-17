from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    JobDescriptionCreateView,
    JobDescriptionDetailView,
    JobDescriptionListView,
    JobDescriptionUpdateView,
    jd_match_view,
    JDMatchAPIView,
    JobSessionViewSet
)

router = DefaultRouter()
router.register(r"job-sessions", JobSessionViewSet, basename="job-session")

urlpatterns = [
    path("create/", JobDescriptionCreateView.as_view(), name="job-create"),
    path("<int:pk>/", JobDescriptionDetailView.as_view(), name="job-detail"),
    path("", JobDescriptionListView.as_view(), name="job-list"),
    path("update/<int:pk>/", JobDescriptionUpdateView.as_view(), name="job-update"),
    path("match/", JDMatchAPIView.as_view(), name="job-match-api"),
    path("legacy-match/", jd_match_view, name="jd_match"),
    path("", include(router.urls)),
]
