from rest_framework.pagination import PageNumberPagination
from django.core.cache import cache

class SessionPageNumberPagination(PageNumberPagination):
    page_query_param = 'page'
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_page_number(self, request, paginator):
        # Try to get page from session first, then from query param
        page_number = request.session.get('current_page', None)
        if page_number is None:
            page_number = request.query_params.get(self.page_query_param, 1)
        try:
            page_number = paginator.validate_number(page_number)
        except (TypeError, ValueError):
            page_number = 1
        # Store the page in session
        request.session['current_page'] = page_number
        return page_number

    def get_paginated_response(self, data):
        response = super().get_paginated_response(data)
        # Optionally store current page in response or session
        return response