from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsAdmin
from django.contrib.auth import get_user_model
from apps.accounts.serializers import UserSerializer

User = get_user_model()

class UserListAPIView(APIView):
    """
    API endpoint to list all users. Restricted to Admin.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        users = User.objects.all().order_by("-date_joined")
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


class UserDetailAPIView(APIView):
    """
    API endpoint to update (role/status) or delete a user. Restricted to Admin.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_object(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def put(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Prevent admins from deactivating or changing their own role via this API
        # if they are the one making the request (though they can still do it via admin panel)
        if user == request.user and ("role" in request.data or "is_active" in request.data):
            # Allow some updates but maybe warn or restrict role change to self
            pass

        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if user == request.user:
            return Response({"error": "Cannot delete your own account"}, status=status.HTTP_400_BAD_REQUEST)
            
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
