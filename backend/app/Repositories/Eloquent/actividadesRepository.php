<?php

namespace App\Repositories\Eloquent;
use App\Models\actividades;
use App\Repositories\Interfaces\actividadesInterface;

class actividadesRepository implements actividadesInterface
{
    public function getAllactividades()
    {
        return actividades::all();
    }

    public function getactividadesById($id)
    {
        $actividades = actividades::find($id);

        return !$actividades ? null : $actividades;
    }

    public function createactividades(array $data)
    {
        return actividades::create($data);
    }

    public function updateactividades($id, array $data)
    {
        $actividades = actividades::find($id);

        if (!$actividades) {
            return null;
        }

        $actividades->update($data);
        return $actividades;
    }

    public function deleteactividades($id)
    {
        $actividades = actividades::find($id);

        if (!$actividades) {
            return null;
        }

        $actividades ->delete();
        return true;
    }
}