from models import Realm
from django.contrib.sitemaps import Sitemap
from datetime import date, datetime

class ReportSiteMap(Sitemap):
    changefreq = "hourly"
    priority = 0.5
    
    def items(self):
        return Realm.objects.all()
    
    def lastmod(self, obj):
        return date.today()