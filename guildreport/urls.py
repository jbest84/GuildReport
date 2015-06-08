from django.conf.urls.defaults import *
from django.conf import settings
from report.sitemap import ReportSiteMap
from report.ArticleFeed import LatestEntries

feeds = {
         'latest' : LatestEntries,
         }

sitemaps = {'reports' : ReportSiteMap}

urlpatterns = patterns('',
    # Example:
    # (r'^guildreport/', include('guildreport.foo.urls')),
     (r'^accounts/login/$', 'django.contrib.auth.views.login'),
     (r'^accounts/profile/$', 'guildreport.report.views.profile'),
     (r'^accounts/logout/$', 'django.contrib.auth.views.logout_then_login'),
     (r'^accounts/', include('guildreport.accounts.urls')),
     (r'^site_admin/', include('django.contrib.admin.urls')),
     (r'^report/', include('guildreport.report.urls')),
     (r'^$', 'guildreport.report.views.index'),
     (r'^sitemap.xml$', 'django.contrib.sitemaps.views.sitemap', {'sitemaps': sitemaps}),
     (r'^rss/(?P<url>.*)/$', 'django.contrib.syndication.views.feed',{'feed_dict': feeds}),
)

if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': 'C:/code/guildreport/media'})
                            )
