<?php

namespace App\Http\Controllers;

use App\Services\notificacionesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class notificacionesController extends Controller
{
    public function __construct(
        protected notificacionesService $notificacionesService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $pagination = $this->resolvePaginationQuery($request, true);
        $notifications = $this->notificacionesService->getNotificationsForCurrentUser(
            $pagination['page'],
            $pagination['per_page'],
            $pagination['search'],
            $pagination['paginate']
        );

        return $this->paginatedJsonResponse('notificaciones retrieved successfully', $notifications);
    }

    public function markAsRead(int $id): JsonResponse
    {
        $notification = $this->notificacionesService->markAsReadForCurrentUser($id);

        if (!$notification) {
            return response()->json([
                'message' => 'notificacion not found',
            ], 404);
        }

        return response()->json([
            'message' => 'notificacion marked as read',
            'data' => $notification,
        ]);
    }

    public function markAllAsRead(): JsonResponse
    {
        $updatedCount = $this->notificacionesService->markAllAsReadForCurrentUser();

        return response()->json([
            'message' => 'notificaciones marked as read',
            'data' => [
                'updated_count' => $updatedCount,
            ],
        ]);
    }
}
