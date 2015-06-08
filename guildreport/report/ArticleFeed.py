from django.contrib.syndication.feeds import Feed
from models import Article

class LatestEntries(Feed):
    title = "guildreport.com site news"
    link = "/report/news/"
    description = "Updates and announcements on guildreport.com"

    title_template = 'rss/latest_title.html'
    description_template = 'rss/latest_description.html'
    
    def items(self):
        return Article.objects.order_by('-posted_on')[:5]
    
    def item_link(self):
        return "/report/news/"