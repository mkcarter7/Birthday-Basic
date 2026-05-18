from rest_framework import viewsets, serializers
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from ..models import SiteConfig, Party


class SiteConfigSerializer(serializers.ModelSerializer):
    """Full serializer — used by the host dashboard for reading and editing."""

    # Read-only party fields pulled in alongside the config
    party_id = serializers.IntegerField(source='party.id', read_only=True)
    party_name = serializers.CharField(source='party.name', read_only=True)
    party_date = serializers.DateTimeField(source='party.date', read_only=True)
    party_location = serializers.CharField(source='party.location', read_only=True)
    host_email = serializers.EmailField(source='party.host.email', read_only=True)
    subdomain = serializers.SlugField(source='party.subdomain', read_only=True)
    custom_domain = serializers.CharField(source='party.custom_domain', read_only=True)
    site_status = serializers.CharField(source='party.site_status', read_only=True)
    expires_at = serializers.DateTimeField(source='party.expires_at', read_only=True)
    is_active = serializers.BooleanField(source='party.is_active', read_only=True)
    is_expired = serializers.BooleanField(source='party.is_expired', read_only=True)

    class Meta:
        model = SiteConfig
        fields = '__all__'
        read_only_fields = ['id', 'party', 'created_at', 'updated_at']


class SiteConfigViewSet(viewsets.ModelViewSet):
    """
    CRUD for SiteConfig. The host can read and update their own config.
    The by_subdomain action is public so Next.js can fetch config to render event pages.
    """
    serializer_class = SiteConfigSerializer

    def get_permissions(self):
        if self.action == 'by_subdomain':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return SiteConfig.objects.select_related('party', 'party__host').all()
        # Regular users only see config for parties they host
        return SiteConfig.objects.select_related('party', 'party__host').filter(
            party__host=user
        )

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def by_subdomain(self, request):
        """
        Public endpoint used by Next.js event layout to load a party's config.

        GET /api/site-config/by_subdomain/?subdomain=sarah-party
        GET /api/site-config/by_subdomain/?domain=mykidsbday.com

        Returns the full SiteConfig for an active party.
        Returns 404 if the subdomain doesn't exist or the party is inactive/expired.

        Why public? Because guests land on the subdomain before they're logged in.
        The server needs to fetch the config to render the page, so this endpoint
        must work without authentication.
        """
        subdomain = request.query_params.get('subdomain')
        domain = request.query_params.get('domain')

        if subdomain:
            config = get_object_or_404(
                SiteConfig,
                party__subdomain=subdomain,
                party__is_active=True,
            )
        elif domain:
            config = get_object_or_404(
                SiteConfig,
                party__custom_domain=domain,
                party__is_active=True,
            )
        else:
            return Response(
                {'error': 'Provide either ?subdomain= or ?domain= query parameter.'},
                status=400,
            )

        serializer = SiteConfigSerializer(config)
        return Response(serializer.data)
