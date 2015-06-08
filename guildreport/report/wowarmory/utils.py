import urllib
from django.core.cache import cache

class Player:
    '''
    Player structure based on the "character" XML node.
    '''
    def __init__(self):
        self.playerClass = None
        self.playerClassId = None
        self.gender = None
        self.genderId = None
        self.level = None
        self.name = None
        self.race = None
        self.raceId = None
        self.rank = None
        self.url = None
        
def getGuildInfo(realm, guild, location="US"):
    '''
    Returns the XML content from the armory for a given guild/realm. Raise Http404 for any armory related problems.
    '''
    print 'getting guild info'
    key = "armory_" + guild + "_" + realm
    content = cache.get(key)
    if content == None:
        url = ''
        params = urllib.urlencode({'r' : realm, 'p' : '1', 'n' : guild})
        if location == 'US':
            url = 'http://www.wowarmory.com/guild-info.xml?%s'
        else:
            url = 'http://eu.wowarmory.com/guild-info.xml?%s'
        url = url % params
        print url
        opener = urllib.FancyURLopener({})
        opener.addheader("User-Agent", "FireFox/2.0")
        try:
            f = opener.open(url)
            content = f.read()
            cache.set(key, content)
        except:
            from django.http import Http404
            raise Http404
    else:
        print "armory cache set already"
    return content