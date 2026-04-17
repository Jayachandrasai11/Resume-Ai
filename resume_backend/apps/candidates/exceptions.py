
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if response is not None and response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
        return Response(
            {
                "error": "This endpoint only accepts POST requests",
                "allowed_methods": response.data.get('detail', 'POST'),
                "message": "Please use POST method for this API"
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    return response

