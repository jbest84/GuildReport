from django.conf.urls.defaults import *

urlpatterns = patterns('guildreport.report.views',
     (r'^$', 'index'),
     (r'^viewrealm/(?P<realm_id>\d+)/$', 'viewrealm'),
     (r'^newreport/$', 'newreport'),
     (r'^newguild/$', 'newguild'),#popup
     (r'^addguild/$', 'addguild'),
     (r'^submitreport/$', 'submitreport'),
     (r'^viewguild/(?P<guild_id>\d+)/$', 'viewguild'),
     (r'^reportguild/(?P<guild_id>\d+)/$', 'reportguild'),
     (r'^reportguild_submit/(?P<guild_id>\d+)/$', 'reportguild_submit'),
     (r'^search/$', 'search'),
     (r'^news/$', 'news'),
)