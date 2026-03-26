<?php

namespace App\Services;

use App\Models\residentes;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class AccessScopeService
{
    public const ROLE_ADMIN = 1;
    public const ROLE_NURSE = 2;
    public const ROLE_DOCTOR = 3;
    public const ROLE_TUTOR = 4;

    public function currentUser(): ?object
    {
        $user = Auth::guard('api')->user();

        return is_object($user) ? $user : null;
    }

    public function getRoleCode(?object $user = null): int
    {
        $user ??= $this->currentUser();

        return (int) ($user->cod_rol ?? 0);
    }

    public function getUserDocId(?object $user = null): int
    {
        $user ??= $this->currentUser();
        $docId = (int) ($user->doc_id ?? 0);

        if ($docId > 0) {
            return $docId;
        }

        return (int) ($user->id ?? 0);
    }

    public function isStaff(?object $user = null): bool
    {
        return in_array($this->getRoleCode($user), [self::ROLE_ADMIN, self::ROLE_NURSE], true);
    }

    public function isTutor(?object $user = null): bool
    {
        return $this->getRoleCode($user) === self::ROLE_TUTOR;
    }

    /**
     * @return list<int>
     */
    public function associatedResidentIds(?object $user = null): array
    {
        $user ??= $this->currentUser();

        if (!$this->isTutor($user)) {
            return [];
        }

        $docId = $this->getUserDocId($user);

        if ($docId <= 0) {
            return [];
        }

        return residentes::query()
            ->where('cod_usuario', $docId)
            ->pluck('cod_residente')
            ->map(static fn ($residentId): int => (int) $residentId)
            ->filter(static fn (int $residentId): bool => $residentId > 0)
            ->unique()
            ->values()
            ->all();
    }

    public function canAccessResidentId(int $residentId, ?object $user = null): bool
    {
        if ($residentId <= 0) {
            return false;
        }

        if ($this->isStaff($user)) {
            return true;
        }

        return in_array($residentId, $this->associatedResidentIds($user), true);
    }

    public function canAccessResidentRecord(object $resident, ?object $user = null): bool
    {
        return $this->canAccessResidentId((int) ($resident->cod_residente ?? 0), $user);
    }

    /**
     * @param Collection<int, mixed> $items
     * @return Collection<int, mixed>
     */
    public function filterResidents(Collection $items, ?object $user = null): Collection
    {
        if ($this->isStaff($user)) {
            return $items->values();
        }

        if (!$this->isTutor($user)) {
            return collect();
        }

        $residentIds = $this->associatedResidentIds($user);

        if ($residentIds === []) {
            return collect();
        }

        return $items->filter(
            static fn ($item): bool => in_array((int) ($item->cod_residente ?? 0), $residentIds, true)
        )->values();
    }

    /**
     * @param Collection<int, mixed> $items
     * @param list<string> $residentFields
     * @return Collection<int, mixed>
     */
    public function filterByResidentFields(Collection $items, array $residentFields, ?object $user = null): Collection
    {
        if ($this->isStaff($user)) {
            return $items->values();
        }

        if (!$this->isTutor($user)) {
            return collect();
        }

        $residentIds = $this->associatedResidentIds($user);

        if ($residentIds === []) {
            return collect();
        }

        return $items->filter(function ($item) use ($residentFields, $residentIds): bool {
            foreach ($residentFields as $field) {
                if (in_array((int) ($item->{$field} ?? 0), $residentIds, true)) {
                    return true;
                }
            }

            return false;
        })->values();
    }
}
