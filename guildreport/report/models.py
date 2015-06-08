from django.db import models
from decimal import Decimal
from math import sqrt, exp, pi
from django.contrib.auth.models import User, UserManager
from django.core.cache import cache
from django.conf import settings
from django.db import connection

#There are no plans for a user type of model, as people should be anonymous

class Realm(models.Model):
    '''
    Realm model will hold the realm information (guilds, reports)
    '''
    REALM_LOC = (
                 ('US', 'US'),
                 ('EU', 'EU'),
                  )
    name = models.CharField(maxlength=100)
    location = models.CharField(maxlength=2, choices=REALM_LOC)
    
    def __str__(self):
        return self.name + " - " + self.location
    
    def get_absolute_url(self):
        return "/report/viewrealm/%i/" % self.id
    
    class Admin:
        list_filter = ['location']
        list_display = ['name', 'location']
    
    class Meta:
        ordering = ['name']

class Guild(models.Model):
    '''
    Holds the guild name, faction, and realm
    '''
    FACTIONS_LIST = (
                ('H', 'Horde'), 
                ('A', 'Alliance'),
                )
    name = models.CharField(maxlength=100)
    faction = models.CharField(maxlength=1, choices=FACTIONS_LIST)
    realm = models.ForeignKey(Realm, related_name="guilds")
    ip = models.IPAddressField("Added by IP")
    added_on = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name + " - " + self.realm.name
    
    class Admin:
        list_display = ['name', 'realm', 'faction', 'added_on']
        list_filter = ['added_on', 'faction', 'realm']

class Report(models.Model):
    '''This model will store all reports people file on a guild. Information about why they are reporting and when should be captured.
    '''
    RATING_LIST = (
                   (1, '1 - Poor'),
                   (2, '2 - Below Average'),
                   (3, '3 - Average'),
                   (4, '4 - Above Average'),
                   (5, '5 - Excellent'),
                   )
    guild = models.ForeignKey(Guild, related_name="reports")
    reported_on = models.DateTimeField(auto_now_add=True)
    reason = models.TextField()
    karma = models.IntegerField()
    
    #rating info
    member_rating = models.IntegerField("How does this guild treat its own members?", choices=RATING_LIST)
    group_rating = models.IntegerField("How does this guild treat other non-guild members in groups?", choices=RATING_LIST)
    loot_rating = models.IntegerField("How is this guild's loot system?", choices=RATING_LIST)
    overall_rating = models.IntegerField("Overall guild rating?", choices=RATING_LIST)
    ip = models.IPAddressField("Reported By IP")
    
    def __str__(self):
        return "Guild: %s, reported on %s" % ( self.guild.name, self.reported_on)
    
    def insightful_count(self):
        return self.opinions.filter(opinion=1).count()
    
    def funny_count(self):
        return self.opinions.filter(opinion=2).count()
    
    def troll_count(self):
        return self.opinions.filter(opinion=3).count()
    
    def rating(self):
        total = Decimal(16)
        sum = Decimal(0)
        sum += self.member_rating - 1
        sum += self.group_rating - 1
        sum += self.loot_rating - 1
        sum += self.overall_rating - 1
        
        if sum > 0:
            average = Decimal((sum / total) * 100)
            return average.to_integral()
        else:
            return 0
        
    class Admin:
        list_filter = ['reported_on']
        list_display = ['guild', 'rating', 'karma', 'reason', 'reported_on']
        
    class Meta:
        ordering = ['-karma', '-reported_on']
        
class Opinion(models.Model):
    '''This model will store opinions on ratings, 1)Insightful, 2) Funny, 3)Troll'''
    OPINION_LIST = (
                    (1, 'Insightful'),
                    (2, 'Funny'),
                    (3, 'Troll'),
                    )
    opinion = models.IntegerField("I thought this report was..", choices=OPINION_LIST)
    ip = models.IPAddressField("Reported By IP")
    report = models.ForeignKey(Report, related_name='opinions')
    reported_on = models.DateTimeField(auto_now_add=True)
    
    class Admin:
        list_filter = ['reported_on']
        list_display = ['opinion', 'ip','report', 'reported_on']
        
class Article(models.Model):
    '''This will hold news articles'''
    title = models.CharField("Title", maxlength=100)
    content = models.TextField("Article body")
    posted_on = models.DateTimeField("Posted on", auto_now=True)
    user = models.ForeignKey(User, related_name='articles')
    
    class Admin:
        list_display = ['content', 'posted_on', 'user']
        
#class Stats:
#    def mean(self):
#        '''This will return the mean rating'''
#        reports = Report.objects.all()
#        sum = Decimal(0)
#        count = Decimal(reports.count())
#        for r in reports:
#            sum += r.member_rating
#            sum += r.group_rating
#            sum += r.loot_rating
#            sum += r.overall_rating
#            
#        return sum / count
#    
#    def stddev(self):
#        '''Get the standard deviation of our mean'''
#        reports = Report.objects.all()
#        dev = Decimal(0)
#        count = Decimal(reports.count())
#        mean = self.mean()
#        for r in reports:
#            dev += pow((r.member_rating) - mean, 2)
#            dev += pow((r.group_rating) - mean, 2)
#            dev += pow((r.loot_rating) - mean, 2)
#            dev += pow((r.overall_rating) - mean, 2)
#            
#        return Decimal(str(sqrt(dev / count)))