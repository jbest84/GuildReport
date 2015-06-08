import xml.sax
import urllib
from utils import Player

class GuildParser(xml.sax.ContentHandler):
    
    def __init__(self):
        #guild node
        self.name = None
        #self.battleGroup = None
        self.realm = None
        self.faction = None
        self.guildLeader = None
        self.statsUrl = None
        
        #members node
        self.memberCount = 0
        
        #character node
        self.players = []
        self.numSeventies = 0
        
    def startElement(self, name, attrs):
        if name == "guildKey":
            self.name = attrs.getValue("name")
            #self.battleGroup = attrs.getValue("battleGroup") #this was removed
            self.realm = attrs.getValue("realm")
            self.statsUrl = attrs.getValue("url")#2.3 changed this to 'url' instead
        elif name == "members":
            self.memberCount = attrs.getValue("memberCount")
        elif name == "character":
            p = Player()
            p.playerClass = attrs.getValue("class")
            p.playerClassId = attrs.getValue("classId")
            p.gender = attrs.getValue("gender")
            p.genderId = attrs.getValue("genderId")
            p.level = attrs.getValue("level")
            #increase level 70 count
            if p.level == "70":
                self.numSeventies +=1
            p.name = attrs.getValue("name")
            p.race = attrs.getValue("race")
            p.raceId = attrs.getValue("raceId")
            if self.faction == None:
                if p.raceId == "1" or p.raceId == "3" or p.raceId == "4" or p.raceId == "7" or p.raceId == "11":
                    self.faction = "A"
                else:
                    self.faction = "H"
            p.rank = attrs.getValue("rank")
            p.url = attrs.getValue("url")
            
            #assign guild leader
            if p.rank == "0":
                self.guildLeader = p
            #add player to list
            self.players.append(p)
    def endElement(self, name):
        pass
    
    def startDocument(self):
        pass
    
    def endDocument(self):
        pass
    
    def characters(self, content):
        pass
    
    
if __name__ == "__main__":
    opener = urllib.FancyURLopener()
    opener.addheader("User-Agent", "FireFox/2.0")
    params = urllib.urlencode({"r" : "Kilrogg", "n" : "Good With Ketchup", "p" : "1"})
    f = opener.open("http://www.wowarmory.com/guild-info.xml?%s" % params)
    xmlString = f.read()
    print xmlString
    handler = GuildParser()
    xml.sax.parseString(xmlString, handler)
    print "This guild has %s members." % handler.memberCount
    print "This guild has a faction of: %s" % handler.faction
    print "This guild has %s level 70's" % handler.numSeventies
    print "Member listing:"
    for p in handler.players:
        print "Player Name: %s, level: %s, raceId: %s" % (p.name, p.level, p.raceId)
        
    