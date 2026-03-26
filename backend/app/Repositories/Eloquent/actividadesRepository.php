<?php

namespace App\Repositories\Eloquent;

use App\Models\actividades;
use App\Repositories\Interfaces\actividadesInterface;
use RuntimeException;

class actividadesRepository implements actividadesInterface
{
    public function all()
    {
        return actividades::query()->orderBy('Cod_acti_ludi')->get();
    }

    public function find(int $id)
    {
        return actividades::find($id);
    }

    public function create(array $data)
    {
        return actividades::create($data);
    }

    public function update(int $id, array $data)
    {
        $actividades = $this->find($id);

        if (!$actividades) {
            return null;
        }

        $actividades->update($data);
        return $actividades;
    }

    public function delete(int $id)
    {
        $actividades = $this->find($id);

        if (!$actividades) {
            return null;
        }

        $actividades->delete();
        return true;
    }

    public function getNextCodActiLudi(): int
    {
        $lastCode = actividades::query()->max('Cod_acti_ludi');
        $nextCode = $lastCode ? ((int) $lastCode + 1) : 1;

        if ($nextCode > 2147483647) {
            throw new RuntimeException('No hay más códigos disponibles para actividades_ludicas.');
        }

        return $nextCode;
    }
}
