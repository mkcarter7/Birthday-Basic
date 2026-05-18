import re
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework import permissions
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from ..models import Party
from rest_framework import serializers

class IsPartyHostOrAdmin(permissions.BasePermission):
    """
    Allow update/delete if the user is a staff/admin or the host of the party.
    """
    def has_object_permission(self, request, view, obj):
        # Allow if user is staff/admin
        if request.user and request.user.is_staff:
            return True
        # Allow if user is the party host
        return obj.host == request.user

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

class PartySerializer(serializers.ModelSerializer):
    host = UserSerializer(read_only=True)
    total_rsvps = serializers.ReadOnlyField()
    attending_count = serializers.ReadOnlyField()
    is_past = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()

    class Meta:
        model = Party
        fields = [
            'id', 'name', 'description', 'date', 'end_time', 'location',
            'host', 'facebook_live_url', 'venmo_username', 'latitude',
            'longitude', 'is_active', 'is_public', 'max_guests',
            'created_at', 'updated_at', 'total_rsvps', 'attending_count',
            'is_past', 'is_expired',
            # New SaaS fields
            'subdomain', 'custom_domain', 'expires_at', 'site_status',
        ]
        read_only_fields = ['id', 'host', 'created_at', 'updated_at', 'is_expired']

class PartyViewSet(viewsets.ModelViewSet):
    serializer_class = PartySerializer
    permission_classes = [AllowAny]  # Default to public access
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            # Allow admins or party hosts to update/delete
            return [IsAuthenticated(), IsPartyHostOrAdmin()]
        elif self.action == 'create':
            # Any authenticated user can create a party
            return [IsAuthenticated()]
        else:
            # Anyone can view parties
            return [AllowAny()]
    
    def get_queryset(self):
        queryset = Party.objects.all()

        # Filter by active parties
        active = self.request.query_params.get('active')
        if active and active.lower() == 'true':
            queryset = queryset.filter(is_active=True)

        # Filter by public parties
        public = self.request.query_params.get('public')
        if public and public.lower() == 'true':
            queryset = queryset.filter(is_public=True)

        # Filter to only parties hosted by the current user
        # Used by the host dashboard: GET /api/parties/?hosted_by=me
        hosted_by = self.request.query_params.get('hosted_by')
        if hosted_by == 'me' and self.request.user.is_authenticated:
            queryset = queryset.filter(host=self.request.user)

        return queryset.select_related('host')
    
    def perform_create(self, serializer):
        serializer.save(host=self.request.user)
    
    @action(detail=True, methods=['get'])
    def rsvps(self, request, pk=None):
        party = self.get_object()
        rsvps = party.rsvps.all()
        # You can add RSVP serialization here if needed
        return Response({'rsvps': []})  # Placeholder

    @action(detail=True, methods=['get'])
    def photos(self, request, pk=None):
        party = self.get_object()
        photos = party.photos.all()
        # You can add photo serialization here if needed
        return Response({'photos': []})  # Placeholder

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def check_subdomain(self, request):
        """
        Public endpoint to check if a subdomain is available before purchase.
        Called by the onboarding wizard as the customer types their desired subdomain.

        GET /api/parties/check_subdomain/?subdomain=sarah-party
        Returns: { "available": true } or { "available": false, "reason": "..." }

        Subdomain rules:
        - Only lowercase letters, numbers, and hyphens
        - Must start and end with a letter or number (not a hyphen)
        - 3-100 characters long
        """
        subdomain = request.query_params.get('subdomain', '').lower().strip()
        if not subdomain:
            return Response({'available': False, 'reason': 'Subdomain is required.'})

        # Validate format
        if not re.match(r'^[a-z0-9][a-z0-9-]{1,98}[a-z0-9]$', subdomain):
            return Response({
                'available': False,
                'reason': 'Use only lowercase letters, numbers, and hyphens. Must be 3–100 characters.',
            })

        # Reserved words that should not be used as subdomains
        reserved = {'www', 'api', 'admin', 'dashboard', 'signup', 'login', 'pricing', 'app', 'mail', 'static'}
        if subdomain in reserved:
            return Response({'available': False, 'reason': 'That subdomain is reserved.'})

        exists = Party.objects.filter(subdomain=subdomain).exists()
        return Response({'available': not exists})
