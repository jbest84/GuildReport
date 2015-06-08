# -*- coding: utf-8 -*-
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404
from django.views.decorators.cache import cache_page
from django.template import RequestContext

def create(request):
    return render_to_response('registration/create.html', {},context_instance=RequestContext(request))