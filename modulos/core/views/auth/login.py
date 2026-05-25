from typing import Any
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from django.contrib.auth import authenticate, login
from django.http import HttpRequest, JsonResponse, HttpResponseRedirect, HttpResponse
from django.urls import reverse_lazy
from django.views.generic import TemplateView




@method_decorator(csrf_exempt, name='dispatch')
class LoginView(TemplateView):
    template_name: str = 'modulos/core/auth/login.html'
    success_url = reverse_lazy('home')

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponseRedirect | HttpResponse:
        if request.user.is_authenticated:
            return HttpResponseRedirect(self.success_url)
        return super().dispatch(request, *args, **kwargs)

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> JsonResponse:
        login_input = (request.POST.get('login') or '').strip()
        password = request.POST.get('password', '')


        if not login_input or not password:
            return JsonResponse({'message': 'Usuario y contraseña requeridos'}, status=400)



        user = authenticate(request, username=login_input, password=password)

        if user is None:
            return JsonResponse({'message': 'Credenciales inválidas'}, status=401)

        login(request, user)

        next_url = request.POST.get('next') or str(self.success_url)
        return JsonResponse({'status': 'success', 'next': next_url})

    def get_context_data(self, **kwargs: Any) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        context['next'] = self.request.GET.get('next', str(self.success_url))
        return context
