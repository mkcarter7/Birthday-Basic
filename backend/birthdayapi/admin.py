from django.contrib import admin
from .models import (
    Party,
    PartyPhoto,
    PhotoLike,
    RSVP,
    GuestBookEntry,
    GiftRegistryItem,
    Badge,
    UserBadge,
    GameScore,
    PartyTimelineEvent,
    TriviaQuestion,
    SiteConfig,
    Subscription,
)

@admin.register(SiteConfig)
class SiteConfigAdmin(admin.ModelAdmin):
    list_display = ['party', 'template_id', 'primary_color', 'enable_rsvp', 'enable_photos', 'updated_at']
    list_filter = ['template_id', 'enable_rsvp', 'enable_photos']
    search_fields = ['party__name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['party', 'tier', 'status', 'price_paid', 'paid_at', 'created_at']
    list_filter = ['tier', 'status']
    search_fields = ['party__name', 'stripe_session_id', 'stripe_payment_intent_id']
    readonly_fields = ['created_at', 'updated_at']


# Register Party model
class PartyTimelineEventInline(admin.TabularInline):
    model = PartyTimelineEvent
    extra = 1
    fields = ('time', 'activity', 'description', 'icon', 'duration_minutes', 'is_active')
    ordering = ('time',)


@admin.register(Party)
class PartyAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'host', 'date', 'subdomain', 'site_status', 'expires_at', 'is_active']
    list_filter = ['is_active', 'is_public', 'site_status', 'date']
    search_fields = ['name', 'location', 'host__username', 'subdomain']
    date_hierarchy = 'date'
    inlines = [PartyTimelineEventInline]

# Register PartyPhoto model
@admin.register(PartyPhoto)
class PartyPhotoAdmin(admin.ModelAdmin):
    list_display = ['id', 'party', 'uploaded_by', 'uploaded_at', 'is_featured', 'caption']
    list_filter = ['is_featured', 'uploaded_at', 'party']
    search_fields = ['caption', 'party__name', 'uploaded_by__username']
    date_hierarchy = 'uploaded_at'
    readonly_fields = ['uploaded_at']
    
    def delete_model(self, request, obj):
        """Delete the file when deleting the photo"""
        if obj.image:
            obj.image.delete(save=False)
        super().delete_model(request, obj)

# Register PhotoLike model
@admin.register(PhotoLike)
class PhotoLikeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'photo', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'photo__caption']

# Register RSVP model
@admin.register(RSVP)
class RSVPAdmin(admin.ModelAdmin):
    list_display = ['party', 'user', 'status', 'guest_count', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__username', 'party__name']

# Register GuestBookEntry model
@admin.register(GuestBookEntry)
class GuestBookEntryAdmin(admin.ModelAdmin):
    list_display = ['party', 'name', 'author', 'created_at', 'updated_at']
    list_filter = ['created_at', 'party']
    search_fields = ['name', 'message', 'author__username', 'party__name']
    readonly_fields = ['created_at', 'updated_at']

# Register GiftRegistryItem model
@admin.register(GiftRegistryItem)
class GiftRegistryItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'party', 'price', 'priority', 'is_purchased']
    list_filter = ['priority', 'is_purchased']
    search_fields = ['name', 'description']

# Register Badge model
@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['name', 'points_required', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'description']

# Register UserBadge model
@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ['user', 'badge', 'party', 'earned_at']
    list_filter = ['earned_at']
    search_fields = ['user__username']

# Register GameScore model
@admin.register(GameScore)
class GameScoreAdmin(admin.ModelAdmin):
    list_display = ['user', 'party', 'total_points', 'level']
    list_filter = ['party', 'level']
    search_fields = ['user__username']


@admin.register(PartyTimelineEvent)
class PartyTimelineEventAdmin(admin.ModelAdmin):
    list_display = ['party', 'time', 'activity', 'is_active']
    list_filter = ['party', 'is_active']
    search_fields = ['activity', 'description', 'party__name']
    ordering = ['party', 'time']

# Register TriviaQuestion model
@admin.register(TriviaQuestion)
class TriviaQuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'party', 'category', 'question', 'points', 'is_active']
    list_filter = ['category', 'is_active', 'party']
    search_fields = ['question', 'category', 'party__name']
    fieldsets = (
        ('Question Details', {
            'fields': ('party', 'category', 'question', 'is_active')
        }),
        ('Answer Options', {
            'fields': ('option_1', 'option_2', 'option_3', 'option_4', 'correct_answer')
        }),
        ('Scoring', {
            'fields': ('points',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['category', 'question']
