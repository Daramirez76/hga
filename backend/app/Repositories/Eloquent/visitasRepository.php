<?php

namespace App\Repositories\Eloquent;

use App\Models\visitas;
use App\Repositories\Interfaces\visitasInterface;
use Illuminate\Support\Facades\DB;

class visitasRepository implements visitasInterface
{
    public function getAllVisitas()
    {
        return visitas::query()->orderBy('id')->get();
    }

    public function getVisitaById(int $id)
    {
        return visitas::query()->find($id);
    }

    public function createVisita(array $data)
    {
        return DB::transaction(function () use ($data) {
            if (empty($data['cod_Visitas'])) {
                $data['cod_Visitas'] = $this->nextVisitaCode();
            }

            return visitas::create($data);
        });
    }

    public function updateVisita(int $id, array $data)
    {
        $visita = visitas::query()->find($id);

        if (!$visita) {
            return null;
        }

        $visita->update($data);

        return $visita->refresh();
    }

    public function deleteVisita(int $id)
    {
        $visita = visitas::query()->find($id);

        if (!$visita) {
            return null;
        }

        $visita->delete();

        return true;
    }

    protected function nextVisitaCode(): int
    {
        $currentMax = (int) visitas::query()->lockForUpdate()->max('cod_Visitas');

        return $currentMax + 1;
    }
}
