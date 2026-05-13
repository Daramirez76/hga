<?php

namespace App\Repositories\Eloquent;

use App\Models\informes;
use App\Repositories\Interfaces\informesInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class informesRepository implements informesInterface
{
    public function getAllVisibleForUser(?object $user)
    {
        return $this->visibilityQuery($user)
            ->orderByDesc('cod_Informes')
            ->get();
    }

    public function findVisibleById(int $id, ?object $user)
    {
        return $this->visibilityQuery($user)
            ->where('cod_Informes', $id)
            ->first();
    }

    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {
            $payload = $data;

            if (empty($payload['cod_Informes'])) {
                $payload['cod_Informes'] = $this->getNextCodeForTransaction();
            }

            return informes::create($payload)->fresh();
        });
    }

    public function update(int $id, array $data, ?object $user)
    {
        $informe = $this->findVisibleById($id, $user);

        if (!$informe) {
            return null;
        }

        unset($data['cod_Informes'], $data['doc_id'], $data['cod_rol']);

        $informe->update($data);

        return $informe->fresh();
    }

    public function delete(int $id, ?object $user)
    {
        $informe = $this->findVisibleById($id, $user);

        if (!$informe) {
            return null;
        }

        $informe->delete();

        return true;
    }

    public function getNextCode(): int
    {
        $lastCode = informes::query()->max('cod_Informes');

        return $lastCode ? ((int) $lastCode + 1) : 1;
    }

    protected function getNextCodeForTransaction(): int
    {
        $lastCode = informes::query()
            ->select('cod_Informes')
            ->orderByDesc('cod_Informes')
            ->lockForUpdate()
            ->value('cod_Informes');

        return $lastCode ? ((int) $lastCode + 1) : 1;
    }

    protected function visibilityQuery(?object $user): Builder
    {
        $query = informes::query();

        if (!$user) {
            return $query->whereRaw('1 = 0');
        }

        if (in_array((int) ($user->cod_rol ?? 0), [1, 2], true)) {
            return $query;
        }

        return $query->where('doc_id', $this->resolveAuthorDocument($user));
    }

    protected function resolveAuthorDocument(object $user): int
    {
        $docId = (int) ($user->doc_id ?? 0);

        if ($docId > 0) {
            return $docId;
        }

        return (int) ($user->id ?? 0);
    }
}
