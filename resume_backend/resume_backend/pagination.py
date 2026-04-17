from rest_framework.pagination import PageNumberPagination
from apps.accounts.models import UserPagePreference

class DBPageNumberPagination(PageNumberPagination):
    page_query_param = 'page'
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_page_number(self, request, paginator):
        view_path = request.path
        user = getattr(request, 'user', None)
        page_number = request.query_params.get(self.page_query_param, 1)

        if user and user.is_authenticated:
            # Load from DB
            pref, created = UserPagePreference.objects.get_or_create(
                user=user, view_path=view_path, defaults={'page_number': 1}
            )
            if not created and page_number == 1:  # If no page param, use stored
                page_number = pref.page_number
            else:
                pref.page_number = page_number
                pref.save()
        else:
            # Fallback to session for anonymous
            session_key = f'page_{view_path}'
            if page_number == 1:
                page_number = request.session.get(session_key, 1)
            request.session[session_key] = page_number

        try:
            page_number = paginator.validate_number(page_number)
        except (TypeError, ValueError):
            page_number = 1
        return page_number