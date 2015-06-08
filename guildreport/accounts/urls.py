from django.conf.urls.defaults import *
from django.conf import settings

urlpatterns = patterns('guildreport.accounts.views',
     (r'^create/$', 'create'),
)