# -*- coding: utf-8 -*-
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404
from django.views.decorators.cache import cache_page
from django.template import RequestContext
from django.core.cache import cache
from models import Realm, Guild, Report, Opinion, Article
from django.contrib.auth.models import User, UserManager
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse
from datetime import date, datetime
from string import lower
import urllib
import re
from django.conf import settings
from django.db import connection
from wowarmory.parsers import GuildParser
from wowarmory.utils import Player, getGuildInfo
import xml.sax

def index(request):
    us_realms = cache.get('us_realms')
    eu_realms = cache.get('eu_realms')
    if us_realms == None and eu_realms == None:
        us_realms = get_list_or_404(Realm, location='US')
        eu_realms = get_list_or_404(Realm, location='EU')
        cache.set('us_realms', us_realms)
        cache.set('eu_realms', eu_realms)
    return render_to_response('index.html', {'us_realms' : us_realms, 'eu_realms' : eu_realms},context_instance=RequestContext(request))

def search(request):
    us_realms = get_list_or_404(Realm, location='US')
    eu_realms = get_list_or_404(Realm, location='EU')
    results = None
    try:
        if len(request.POST['search_text']) > 0:
            results = Guild.objects.filter(name__icontains=request.POST['search_text']).select_related()
    except(KeyError):
        pass
    return render_to_response('search.html', {'us_realms' : us_realms, 'eu_realms' : eu_realms, 'results' : results},context_instance=RequestContext(request))

def viewrealm(request, realm_id):
    
    realm,horde,alliance = None, None, None
    try:
        realm = cache.get('realm' + realm_id)
        horde = cache.get('realm_horde' + realm_id)
        alliance = cache.get('realm_alliance' + realm_id)
        if realm == None or horde == None or alliance == None:
            print "setting cache.."
            realm = Realm.objects.select_related(depth=2).get(id=realm_id)
            horde = list(realm.guilds.filter(faction='H').order_by('name'))
            alliance = list(realm.guilds.filter(faction='A').order_by('name'))
            cache.set('realm' + realm_id, realm)
            cache.set('realm_horde' + realm_id, horde)
            cache.set('realm_alliance' + realm_id, alliance)
        else:
            print "viewrealm cache already set"
            
    except Realm.DoesNotExist:
        render_to_response('viewrealm.html')
    #print connection.queries
    return render_to_response('viewrealm.html', {'horde' : horde, 'alliance' : alliance, 'realm' : realm},context_instance=RequestContext(request))

def viewguild(request, guild_id):
    guild, realm, faction = None, None, None
    user_ip = request.META['REMOTE_ADDR']
    guild = Guild.objects.select_related().get(pk=guild_id)
    content = getGuildInfo(guild.realm.name, guild.name, guild.realm.location)
    handler = GuildParser()
    try:
        xml.sax.parseString(content, handler)
    except:
        handler = None
    has_sub = Opinion.objects.filter(ip=user_ip, reported_on__gte=date.today())
    
    if request.method == 'GET':
        submitted = None
        try:
           reports = Report.objects.filter(guild=guild).select_related()
           #SAVE THIS FOR THE NEW TEMPLATE SYSTEM, THE CURRENT DOESN'T SUPPORT DICT
           #insightful = {}
           #funny = {}
           #troll = {}
           #for r in reports:
           #    insightful.update({r.id : r.opinions.filter(opinion=1).count()})
           #    funny.update({r.id : r.opinions.filter(opinion=2).count()})
           #    troll.update({r.id : r.opinions.filter(opinion=3).count()})
                
           if has_sub.count() > 0:
                submitted = True
        except Guild.DoesNotExist:
            return render_to_response('viewguild.html', {'message' : 'No such guild exists!'},context_instance=RequestContext(request))
        
        return render_to_response('viewguild.html', {'guild' : guild, 'reports' : reports, 'gave_opinion' : submitted, 'user_ip' : user_ip, 'armory' : handler},context_instance=RequestContext(request))
    else:
        #POST
        if has_sub.count() == 0:
            report, k = None, None
            try:  
                report = Report.objects.get(pk=request.POST['report_id'])
                k = int(request.POST['report_rating'])
            except(KeyError):
                return HttpResponseRedirect(reverse('guildreport.report.views.viewguild', args=(guild.id,)))
            print k
            if k == 1:
                report.karma = report.karma + 2
            elif k == 2:
                report.karma = report.karma + 1
            elif k == 3:
                report.karma = report.karma - 2
            opinion = Opinion(opinion=request.POST['report_rating'], ip=user_ip, report=report)
            opinion.save()
            report.save()
            return HttpResponseRedirect(reverse('guildreport.report.views.viewguild', args=(guild.id,)))
        else:
            return render_to_response('viewguild.html', {'message' : 'You have already gave your opinion on a report today!'},context_instance=RequestContext(request))
    

def newreport(request):
    guilds = Guild.objects.all().select_related().order_by('realm', 'faction', 'name')
    #realms = Realm.objects.all()
    return render_to_response('newreport.html', {'guilds' : guilds},context_instance=RequestContext(request))

#TODO: Merg addguild and newguild to the same function (they are identical, except newguild is a popup. These two functions will be a pain to maintain otherwise
def addguild(request):
    if request.method == "GET":
        realms = Realm.objects.all().order_by('name')
        return render_to_response('addguild.html', {'realms' : realms},context_instance=RequestContext(request))
    else:
        #POST
        name, f, r = None, None, None
        try:
            name = request.POST['guild_name']
            f = request.POST['guild_faction']
            r = request.POST['guild_realm']
        except(KeyError):
            return render_to_response('addguild.html', {'message' : 'Make sure the form is completed'},context_instance=RequestContext(request))
        #if name is empty, they selected a guild to report
        if name != "":
            user_ip = request.META['REMOTE_ADDR']
            #make sure the guild does exist on this realm
            exist = Guild.objects.filter(name=name, realm=r)
            
            if exist.count() > 0:
                return render_to_response('addguild.html', {'message' : 'That guild already exists!'},context_instance=RequestContext(request))
            
            armory = check_armory(r, f, name)
            #only create a new guild if it really doesn't exist
            if armory == True:
                r = Realm.objects.get(pk=request.POST['guild_realm'])
                g = Guild(name=name, faction=request.POST['guild_faction'],realm=r)
                g.ip = user_ip
                g.save()
                return render_to_response('addguild.html', {'message' : 'Guild saved', 'guild' : g},context_instance=RequestContext(request))
            else:
                return render_to_response('addguild.html', {'message' : 'That guild was not found in the armory or was of the wrong faction'},context_instance=RequestContext(request))

#HELPER METHOD TO CHECK ARMORY
def check_armory(realm_id, faction, name):
    try:
        r = Realm.objects.get(pk=realm_id)
        content = getGuildInfo(r.name, name, r.location)
        handler = GuildParser()
        try:
            xml.sax.parseString(content, handler)
        except:
            print "Exception thrown in parsing XML"
            return False
        if handler.memberCount > 0:
            #GUILD FOUND
            if handler.faction == "A":
                #ALLIANCE, MAKE SURE THEY SELECTED IT!
                if faction == 'A':
                    return True
                else:
                    return False
            else:
                #HORDE, MAKE SURE THEY SELECTED IT!
                if faction == 'H':
                    return True
                else:
                    return False
        else:
            #GUILD NOT FOUND
            return False
    except:
        print 'exception'
        return False
    
def newguild(request):
    if request.method == "POST":
        name = request.POST['guild_name']
        f = request.POST['guild_faction']
        r = request.POST['guild_realm']
        #if name is empty, they selected a guild to report
        if name != "":
            user_ip = request.META['REMOTE_ADDR']
            #make sure the guild does exist on this realm
            exist = Guild.objects.filter(name=name, realm=r)
            
            if exist.count() > 0:
                return render_to_response('newguild.html', {'message' : 'That guild already exists'},context_instance=RequestContext(request))
            
            armory = check_armory(r, f, name)
            if armory == True:
                r = Realm.objects.get(pk=request.POST['guild_realm'])
                g = Guild(name=name, faction=request.POST['guild_faction'],realm=r)
                g.ip = user_ip
                g.save()
                return render_to_response('newguild.html', {'message' : 'Guild saved'},context_instance=RequestContext(request))
            else:
                return render_to_response('newguild.html', {'message' : 'That guild was not found in the armory or was of the wrong faction'},context_instance=RequestContext(request))
    realms = Realm.objects.all().order_by('name')
    return render_to_response('newguild.html', {'realms' : realms},context_instance=RequestContext(request))

def reportguild(request, guild_id):
    guild = Guild.objects.get(pk=guild_id)
    realms = Realm.objects.all()
    return render_to_response('reportguild.html', {'guild' : guild, 'realms' : realms},context_instance=RequestContext(request))

def reportguild_submit(request, guild_id):
    if request.method == 'POST':
        ##POST
        try:
            member_r = int(request.POST['member_rating'])
            group_r = int(request.POST['group_rating'])
            loot_r = int(request.POST['loot_rating'])
            overall_r = int(request.POST['overall_rating'])
            reason = request.POST['reason']
            
            if member_r < 0 or group_r < 0 or loot_r < 0 or overall_r < 0:
                return render_to_response('reported.html', {'message' : 'Negative reports are not allowed, nice try though!'},context_instance=RequestContext(request))
            
            if member_r > 5 or group_r > 5 or loot_r > 5 or overall_r > 5:
                return render_to_response('reported.html', {'message' : 'Going past +5 is not allowed, nice try though!'},context_instance=RequestContext(request))
                
            user_ip = request.META['REMOTE_ADDR']
            has_sub = Report.objects.filter(ip=user_ip, reported_on__gte=date.today())
            if has_sub.count() < 1:
                #havn't submitted a report today, PROCEDE
                guild = Guild.objects.get(pk=guild_id)
                r = Report(guild=guild, reported_on=date.today(), reason=reason, member_rating=member_r, group_rating=group_r, loot_rating=loot_r, overall_rating=overall_r, karma=0)
                r.ip = user_ip
                r.save()
                return render_to_response('reported.html', {'message' : 'Thanks for the report!', 'guild' : guild})
            else:
                return render_to_response('reported.html', {'message' : 'You have already submitted a report today, you can only submit one report per 24 hours!'})
        except (KeyError):
            return render_to_response('reported.html', {'message' : 'Please make sure the form is completed!' } )
    else:
        return render_to_response('reported.html', {'message' : 'Error Occured!' } )

def submitreport(request):
    if request.method == 'POST':
        ##POST
        try:
            guild_id = request.POST['guild']
            member_r = request.POST['member_rating']
            group_r = request.POST['group_rating']
            loot_r = request.POST['loot_rating']
            overall_r = request.POST['overall_rating']
            reason = request.POST['reason']

            user_ip = request.META['REMOTE_ADDR']
            has_sub = Report.objects.filter(ip=user_ip, reported_on__gte=date.today())
            if has_sub.count() < 1:
                #Have not submitted a report today, PROCEDE!
                guild = Guild.objects.get(pk=guild_id)
                r = Report(guild=guild, reported_on=date.today(), reason=reason, member_rating=member_r, group_rating=group_r, loot_rating=loot_r, overall_rating=overall_r, karma=0)
                r.ip = user_ip
                r.save()
                return render_to_response('reported.html', {'message' : 'Thanks for the report!', 'guild' : guild})
            else:
                return render_to_response('reported.html', {'message' : 'You have already submitted a report today, you can only submit one report per 24 hours!'})
        except (KeyError):
            return render_to_response('reported.html', {'message' : 'Please make sure the form is completed!' } )
    else:
        pass

def news(request):
    news = Article.objects.all().order_by("-posted_on")[:5]
    return render_to_response('news.html', {'news' : news}, context_instance=RequestContext(request))

def profile(request):
    #django .95 doesn't allow us to set the redirect page in the login_required decorator, using this method to do that
    #STUPID HACK!
    return HttpResponseRedirect('/report/')