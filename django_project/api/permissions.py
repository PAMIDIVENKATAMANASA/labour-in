from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions for any request, so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object.
        if hasattr(obj, 'employer') and hasattr(obj.employer, 'user'):
            return obj.employer.user == request.user
        elif hasattr(obj, 'laborer') and hasattr(obj.laborer, 'user'):
            return obj.laborer.user == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'recipient'):
            return obj.recipient == request.user
        
        return False


class IsEmployerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow employers to create/edit job postings.
    """
    def has_permission(self, request, view):
        # Read permissions for any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Write permissions are only allowed for employers
        return request.user.is_authenticated and request.user.user_type == 'EMPLOYER'
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated

        # Write permissions only for the owner employer
        return obj.employer.user == request.user


class IsLaborerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow laborers to apply for jobs.
    """
    def has_permission(self, request, view):
        # Read permissions for any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Write permissions are only allowed for laborers
        return request.user.is_authenticated and request.user.user_type == 'LABORER'

    def has_object_permission(self, request, view, obj):
        # Read permissions for any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated

        # Write permissions only for the laborer who applied
        return obj.laborer.user == request.user


class IsEmployerApplicantOwner(permissions.BasePermission):
    """
    Custom permission to allow employers to manage applications for their jobs.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions for any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated

        # Update permissions for employers on their job applications
        if request.method in ['PATCH', 'PUT']:
            return (request.user.user_type == 'EMPLOYER' and 
                   obj.job_posting.employer.user == request.user)

        # Delete permissions for the applicant or job owner
        if request.method == 'DELETE':
            return (obj.laborer.user == request.user or 
                   obj.job_posting.employer.user == request.user)

        return False


class IsAdminOrOwner(permissions.BasePermission):
    """
    Custom permission to allow admins or owners to access objects.
    """
    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user.user_type == 'ADMIN':
            return True
        
        # Object owners have access
        if hasattr(obj, 'employer') and hasattr(obj.employer, 'user'):
            return obj.employer.user == request.user
        elif hasattr(obj, 'laborer') and hasattr(obj.laborer, 'user'):
            return obj.laborer.user == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'recipient'):
            return obj.recipient == request.user
        
        return False


class IsEmployeeType(permissions.BasePermission):
    """
    Custom permission to check if user is of a specific type.
    """
    employee_types = ['EMPLOYER', 'LABORER', 'COORDINATOR', 'ADMIN']
    
    def __init__(self, *types):
        self.permitted_types = types if types else self.employee_types
    
    def has_permission(self, request, view):
        return (request.user.is_authenticated and 
               request.user.user_type in self.permitted_types)


def IsEmployer():
    """Factory function for employer-only permission"""
    return IsEmployeeType('EMPLOYER')


def IsLaborer():
    """Factory function for laborer-only permission"""
    return IsEmployeeType('LABORER')

def IsCoordinator():
    """Factory function for coordinator-only permission"""
    return IsEmployeeType('COORDINATOR')


def IsAdmin():
    """Factory function for admin-only permission"""
    return IsEmployeeType('ADMIN')






