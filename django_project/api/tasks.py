from celery import shared_task
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
import logging
import requests
import json

from .models import Notification, JobPosting

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task(bind=True, retry_backoff=True, max_retries=3)
def send_push_notification(self, notification_id, user_id, job_id):
    """
    Send push notification to user via Firebase Cloud Messaging
    """
    try:
        notification = Notification.objects.get(id=notification_id)
        job = JobPosting.objects.get(id=job_id)
        
        # Check if user has FCM token stored (this would be added to User model)
        # For now, we'll just log and send email notification
        
        logger.info(f"Sending push notification to user {notification.recipient.username}")
        
        # Send email notification as fallback
        send_email_notification.delay(notification_id)
        
        # Add WebSocket notification
        send_websocket_notification.delay(notification_id)
        
        return f"Push notification sent to user {user_id}"
        
    except Notification.DoesNotExist:
        logger.error(f"Notification {notification_id} not found")
        return None
    except JobPosting.DoesNotExist:
        logger.error(f"Job posting {job_id} not found")
        return None
    except Exception as exc:
        logger.error(f"Error sending push notification: {str(exc)}")
        raise self.retry(exc=exc)


@shared_task(bind=True, retry_backoff=True, max_retries=3)
def send_email_notification(self, notification_id):
    """
    Send email notification
    """
    try:
        notification = Notification.objects.get(id=notification_id)
        recipient = notification.recipient
        
        if not recipient.email:
            logger.warning(f"No email address for user {recipient.username}")
            return
        
        subject = f"LaborLink Notification: {notification.notification_type}"
        
        send_mail(
            subject=subject,
            message=notification.message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@laborlink.com'),
            recipient_list=[recipient.email],
            fail_silently=False,
        )
        
        logger.info(f"Email notification sent to {recipient.email}")
        notification.status = 'DELIVERED'
        notification.save()
        
        return f"Email sent to {recipient.email}"
        
    except Notification.DoesNotExist:
        logger.error(f"Notification {notification_id} not found")
        return None
    except Exception as exc:
        logger.error(f"Error sending email: {str(exc)}")
        raise self.retry(exc=exc)


@shared_task
def send_websocket_notification(notification_id):
    """
    Send WebSocket notification to connected user
    """
    try:
        notification = Notification.objects.get(id=notification_id)
        
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        
        # Send notification to user's personal channel group
        user_group_name = f"user_{notification.recipient.id}"
        
        async_to_sync(channel_layer.group_send)(
            user_group_name,
            {
                'type': 'notification_message',
                'message': {
                    'id': notification.id,
                    'type': notification.notification_type,
                    'message': notification.message,
                    'is_read': notification.is_read,
                    'created_at': notification.created_at.isoformat(),
                }
            }
        )
        
        logger.info(f"WebSocket notification sent to user {notification.recipient.username}")
        
    except Notification.DoesNotExist:
        logger.error(f"Notification {notification_id} not found")
    except Exception as exc:
        logger.error(f"Error sending WebSocket notification: {str(exc)}")


# Demo task settings (replace with your own API keys)
try:
    FCM_SERVER_KEY = settings.FCM_SERVER_KEY
except:
    FCM_SERVER_KEY = ""


@shared_task(bind=True, retry_backoff=True, max_retries=3)
def send_firebase_notification(self, fcm_token, title, body, data=None):
    """
    Send notification via Firebase Cloud Messaging
    """
    if not FCM_SERVER_KEY:
        logger.warning("FCM_SERVER_KEY not configured")
        return None
    
    url = "https://fcm.googleapis.com/fcm/send"
    
    headers = {
        "Authorization": f"key={FCM_SERVER_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "to": fcm_token,
        "notification": {
            "title": title,
            "body": body,
        }
    }
    
    if data:
        payload["data"] = data
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        logger.info(f"Firebase notification sent successfully")
        return response.json()
        
    except requests.exceptions.RequestException as exc:
        logger.error(f"Firebase notification failed: {str(exc)}")
        raise self.retry(exc=exc)


@shared_task
def bulk_notify_laborers(job_id, laborer_ids):
    """
    Send bulk notifications to multiple laborers
    """
    try:
        job = JobPosting.objects.get(id=job_id)
        laborers = SkilledLaborer.objects.filter(id__in=laborer_ids)
        
        notification_data = {
            'title': f"New Job: {job.job_title}",
            'body': f"Budget: ${job.budget_min}-${job.budget_max}",
            'data': {
                'job_id': str(job.id),
                'type': 'new_job'
            }
        }
        
        for laborer in laborers:
            if laborer.user.fcm_token:  # Assuming FCM token is stored on user
                send_firebase_notification.delay(
                    laborer.user.fcm_token,
                    notification_data['title'],
                    notification_data['body'],
                    notification_data['data']
                )
        
        logger.info(f"Bulk notifications sent for job {job_id}")
        
    except JobPosting.DoesNotExist:
        logger.error(f"Job posting {job_id} not found")
    except Exception as exc:
        logger.error(f"Error sending bulk notifications: {str(exc)}")


@shared_task
def cleanup_old_notifications():
    """
    Cleanup old notifications (older than 30 days)
    """
    from datetime import datetime, timedelta
    from django.utils import timezone
    
    cutoff_date = timezone.now() - timedelta(days=30)
    
    old_notifications = Notification.objects.filter(
        created_at__lt=cutoff_date,
        is_read=True
    )
    
    count = old_notifications.count()
    old_notifications.delete()
    
    logger.info(f"Cleaned up {count} old notifications")
    return f"Cleaned up {count} old notifications"
