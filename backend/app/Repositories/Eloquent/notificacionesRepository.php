<?php

namespace App\Repositories\Eloquent;

use App\Models\notificacionesSistema;
use App\Repositories\Interfaces\notificacionesInterface;
use Illuminate\Support\Collection;

class notificacionesRepository implements notificacionesInterface
{
    public function createMany(array $rows): void
    {
        if ($rows === []) {
            return;
        }

        notificacionesSistema::query()->insert($rows);
    }

    public function getForRecipient(int $recipientDocId, ?int $limit = null): Collection
    {
        $query = notificacionesSistema::query()
            ->where('recipient_doc_id', $recipientDocId)
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($limit !== null && $limit > 0) {
            $query->limit($limit);
        }

        return $query->get();
    }

    public function countUnreadForRecipient(int $recipientDocId): int
    {
        return notificacionesSistema::query()
            ->where('recipient_doc_id', $recipientDocId)
            ->whereNull('read_at')
            ->count();
    }

    public function markAsReadForRecipient(int $id, int $recipientDocId): ?notificacionesSistema
    {
        $notification = notificacionesSistema::query()
            ->where('id', $id)
            ->where('recipient_doc_id', $recipientDocId)
            ->first();

        if (!$notification) {
            return null;
        }

        if ($notification->read_at === null) {
            $notification->forceFill([
                'read_at' => now(),
            ])->save();
        }

        return $notification->fresh();
    }

    public function markAllAsReadForRecipient(int $recipientDocId): int
    {
        return notificacionesSistema::query()
            ->where('recipient_doc_id', $recipientDocId)
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
                'updated_at' => now(),
            ]);
    }
}
