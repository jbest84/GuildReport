from django import newforms as forms
from report.models import Report

class ReportForm(forms.Form):
    reason = forms.CharField(max_length=500)
    guild = forms.ChoiceField()