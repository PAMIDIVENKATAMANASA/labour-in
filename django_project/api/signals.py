from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.db.models import Q
import math
import logging

from .models import JobPosting, Notification, SkilledLaborer, LaborerSkills
# from .tasks import send_push_notification  # Commented for demo without Celery

User = get_user_model()
logger = logging.getLogger(__name__)


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the distance between two points using Haversine formula
    Returns distance in kilometers
    """
    if not all([lat1, lon1, lat2, lon2]):
        return float('inf')
    
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371  # Radius of earth in kilometers
    
    return c * r


@receiver(post_save, sender=JobPosting)
def notify_matched_laborers(sender, instance, created, **kwargs):
    """
    Signal receiver that triggers when a new JobPosting is created with status 'OPEN'
    Finds matching laborers and creates notifications
    """
    if not created or instance.job_status != 'OPEN':
        return
    
    logger.info(f"New job posting created: {instance.job_title}")
    
    # Get required skills for the job
    required_skill_ids = [skill.id for skill in instance.required_skills.all()]
    
    if not required_skill_ids:
        logger.warning(f"Job posting {instance.id} has no required skills defined")
        return
    
    # Start with all available laborers
    available_laborers = SkilledLaborer.objects.filter(is_available=True)
    
    # Find laborers who have the required skills
    matching_laborers = []
    
    for laborer in available_laborers:
        # Check if laborer has any of the required skills
        laborer_skills = LaborerSkills.objects.filter(
            laborer=laborer,
            skill_id__in=required_skill_ids
        ).values_list('skill_id', flat=True)
        
        if laborer_skills:
            # Laborer has at least one required skill
            matching_laborers.append({
                'laborer': laborer,
                'matching_skills': list(laborer_skills),
                'has_location_match': False
            })
    
    logger.info(f"Found {len(matching_laborers)} laborers with required skills")
    
    # Filter by location if job has coordinates
    location_filtered_laborers = []
    if instance.latitude and instance.longitude:
        for match_data in matching_laborers:
            laborer = match_data['laborer']
            
            if laborer.preferred_latitude and laborer.preferred_longitude:
                # Adjust for laborer's max travel distance and job's max search distance
                max_distance = min(
                    instance.max_distance_km,
                    laborer.max_travel_distance_km
                )
                
                distance = calculate_distance(
                    instance.latitude, instance.longitude,
                    laborer.preferred_latitude, laborer.preferred_longitude
                )
                
                if distance <= max_distance:
                    match_data['has_location_match'] = True
                    match_data['distance_km'] = round(distance, 2)
                    location_filtered_laborers.append(match_data)
            else:
                # Laborer has no location preference - include them
                location_filtered_laborers.append(match_data)
    else:
        # No location filtering - use all skill-matched laborers
        location_filtered_laborers = matching_laborers
    
    logger.info(f"After location filtering: {len(location_filtered_laborers)} laborers")
    
    # Create notifications for matched laborers
    notifications_created = 0
    for match_data in location_filtered_laborers:
        laborer = match_data['laborer']
        matching_skills = match_data['matching_skills']
        has_location_match = match_data.get('has_location_match', False)
        
        # Get skill names for the message
        matching_skill_names = instance.required_skills.filter(
            id__in=matching_skills
        ).values_list('skill_name', flat=True)
        
        # Generate notification message
        if has_location_match:
            distance = match_data.get('distance_km', 'unknown')
            location_text = f" in your area ({distance}km away)"
        else:
            location_text = f" in {instance.location}" if instance.location else ""
        
        skill_text = ", ".join(matching_skill_names)
        budget_text = f"Budget: ${instance.budget_min}-${instance.budget_max}"
        
        message = f"New Job Alert: A '{skill_text}' job is available{location_text}. {budget_text}."
        
        # Create notification
        notification = Notification.objects.create(
            recipient=laborer.user,
            notification_type='NEW_JOB_POSTING',
            message=message,
            status='SENT'
        )
        
        notifications_created += 1
        
        # In production, send real-time notification:
        # send_push_notification.delay(notification.id, laborer.user.id, instance.id)
        # For demo, notifications are created directly
        
        logger.info(f"Created notification for laborer {laborer.user.username}")
    
    logger.info(f"Total notifications created: {notifications_created}")
    
    # Optional: Create a summary notification for job poster
    if notifications_created > 0:
        summary_message = f"Your job posting '{instance.job_title}' has been matched with {notifications_created} qualified laborers."
        
        Notification.objects.create(
            recipient=instance.employer.user,
            notification_type='APPLICATION_STATUS',
            message=summary_message,
            status='SENT'
        )


@receiver(post_save, sender=Notification)
def send_real_time_notification(sender, instance, created, **kwargs):
    """
    Signal to trigger real-time notification via WebSocket or push notification
    """
    if not created:
        return
    
    logger.info(f"New notification created for {instance.recipient.username}: {instance.notification_type}")
    
    # This will be handled by the Celery task or WebSocket consumer
