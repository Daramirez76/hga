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
        $limit = $request->query('limit');
        $limit = is_numeric($limit) ? max(1, (int) $limit) : null;
        $notifications = $this->notificacionesService->getNotificationsForCurrentUser($limit);

        return response()->json([
            'message' => 'notificaciones retrieved successfully',
            'data' => $notifications['items'],
            'meta' => [
                'unread_count' => $notifications['unread_count'],
            ],
        ]);
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
