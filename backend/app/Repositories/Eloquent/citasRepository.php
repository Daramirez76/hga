<?php

namespace App\Repositories\Eloquent;

use App\Models\citas;
use App\Repositories\Interfaces\citasInterface;
use Illuminate\Support\Facades\DB;

class citasRepository implements citasInterface
{
    public function getAllcitas()
    {
        return citas::query()->orderBy('cod_cita')->get();
    }

    public function getcitasById(int $id)
    {
        $citas = citas::find($id);

        return !$citas ? null : $citas;
    }

    public function createcitas(array $data)
    {
        return DB::transaction(function () use ($data) {
            $payload = $data;

            if (empty($payload['cod_cita'])) {
                $payload['cod_cita'] = $this->getNextCodCitaForTransaction();
            }

            return citas::create($payload);
        });
    }

    public function updatecitas(int $id, array $data)
    {
        $citas = citas::find($id);

        if (!$citas) {
            return null;
        }

        $citas->update($data);
        return $citas;
    }

    public function deletecitas(int $id)
    {
        $citas = citas::find($id);

        if (!$citas) {
            return null;
        }

        $citas ->delete();
        return true;
    }

    public function getNextCodCita(): int
    {
        $lastCode = citas::query()->max('cod_cita');

        return $lastCode ? ((int) $lastCode + 1) : 1;
    }

    protected function getNextCodCitaForTransaction(): int
    {
        $lastCode = citas::query()
            ->select('cod_cita')
            ->orderByDesc('cod_cita')
            ->lockForUpdate()
            ->value('cod_cita');

        return $lastCode ? ((int) $lastCode + 1) : 1;
    }
}
