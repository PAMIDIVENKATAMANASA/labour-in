import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope["user"]
        
        if self.user.is_anonymous:
            await self.close()
            return
        
        self.user_group_name = f"user_{self.user.id}"
        
        # Join user group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send any unread notifications
        unread_notifications = await self.get_unread_notifications()
        await self.send(text_data=json.dumps({
            'type': 'initial_notifications',
            'notifications': unread_notifications
        }))
        
        logger.info(f"User {self.user.username} connected to notifications")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if not self.user.is_anonymous:
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
            logger.info(f"User {self.user.username} disconnected")
    
    async def receive(self, text_data):
        """Handle messages received from WebSocket"""
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'mark_notification_read':
                notification_id = text_data_json.get('notification_id')
                await self.mark_notification_read(notification_id)
                
            elif message_type == 'get_notifications':
                notifications = await self.get_notifications()
                await self.send(text_data=json.dumps({
                    'type': 'notifications_list',
                    'notifications': notifications
                }))
                
        except json.JSONDecodeError:
            logger.error("Received invalid JSON from WebSocket")
        except Exception as e:
            logger.error(f"Error processing WebSocket message: {str(e)}")
    
    async def notification_message(self, event):
        """Handle notification messages from the group"""
        message = event['message']
        
        # Format the message for the client
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'notification': {
                'id': message['id'],
                'type': message['type'],
                'message': message['message'],
                'is_read': message['is_read'],
                'created_at': message['created_at'],
            }
        }))
    
    @database_sync_to_async
    def get_unread_notifications(self):
        """Get unread notifications for the user"""
        notifications = Notification.objects.filter(
            recipient=self.user,
            is_read=False
        ).order_by('-created_at')[:10]
        
        return [
            {
                'id': n.id,
                'type': n.notification_type,
                'message': n.message,
                'is_read': n.is_read,
                'created_at': n.created_at.isoformat(),
            }
            for n in notifications
        ]
    
    @database_sync_to_async
    def get_notifications(self):
        """Get all notifications for the user"""
        notifications = Notification.objects.filter(
            recipient=self.user
        ).order_by('-created_at')[:20]
        
        return [
            {
                'id': n.id,
                'type': n.notification_type,
                'message': n.message,
                'is_read': n.is_read,
                'created_at': n.created_at.isoformat(),
                'status': n.status,
            }
            for n in notifications
        ]
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark a notification as read"""
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=self.user
            )
            notification.is_read = True
            notification.save()
            return True
        except Notification.DoesNotExist:
            return False


class JobUpdatesConsumer(AsyncWebsocketConsumer):
    """Consumer for job-related updates"""
    
    async def connect(self):
        """Handle connection to job updates"""
        self.user = self.scope["user"]
        
        if self.user.is_anonymous or self.user.user_type not in ['EMPLOYER', 'LABORER']:
            await self.close()
            return
        
        self.job_group_name = f"jobs_{self.user.id}"
        
        await self.channel_layer.group_add(
            self.job_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"User {self.user.username} connected to job updates")
    
    async def disconnect(self, close_code):
        """Handle disconnection"""
        if not self.user.is_anonymous:
            await self.channel_layer.group_discard(
                self.job_group_name,
                self.channel_name
            )
    
    async def job_application_update(self, event):
        """Handle job application updates"""
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'job_application_update',
            'message': message
        }))
    
    async def job_status_change(self, event):
        """Handle job status changes"""
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'job_status_change',
            'message': message
        }))


class AdminUpdatesConsumer(AsyncWebsocketConsumer):
    """Consumer for admin-only updates"""
    
    async def connect(self):
        """Handle admin connection"""
        self.user = self.scope["user"]
        
        if self.user.is_anonymous or self.user.user_type not in ['ADMIN', 'COORDINATOR']:
            await self.close()
            return
        
        self.admin_group_name = "admin_updates"
        
        await self.channel_layer.group_add(
            self.admin_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"Admin {self.user.username} connected to admin updates")
    
    async def disconnect(self, close_code):
        """Handle admin disconnection"""
        if not self.user.is_anonymous:
            await self.channel_layer.group_discard(
                self.admin_group_name,
                self.channel_name
            )
    
    async def system_stats_update(self, event):
        """Handle system statistics updates"""
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'system_stats_update',
            'message': message
        }))
