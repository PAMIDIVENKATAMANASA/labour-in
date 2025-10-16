from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/notifications/', consumers.NotificationConsumer.as_asgi()),
    path('ws/job-updates/', consumers.JobUpdatesConsumer.as_asgi()),
    path('ws/admin-updates/', consumers.AdminUpdatesConsumer.as_asgi()),
]






