from typing import Any

from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpRequest, HttpResponseRedirect, HttpResponse, JsonResponse
from django.views.generic import TemplateView


class IndexTempleteView(LoginRequiredMixin, TemplateView):
    template_name = '_blank.html'

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponseRedirect | HttpResponse:
        return super().dispatch(request, *args, **kwargs)

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> JsonResponse:
        pass

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context