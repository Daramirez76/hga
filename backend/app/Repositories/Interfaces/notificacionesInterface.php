<?php

namespace App\Repositories\Interfaces;

use Illuminate\Support\Collection;

interface notificacionesInterface
{
    public function createMany(array $rows): void;

    public function getForRecipient(int $recipientDocId, ?int $limit = null): Collection;

    public function countUnreadForRecipient(int $recipientDocId): int;

    public function markAsReadForRecipient(int $id, int $recipientDocId);

    public function markAllAsReadForRecipient(int $recipientDocId): int;
}
