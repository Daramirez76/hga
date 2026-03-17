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

    // Alias estándar para create
    public function create(array $data)
    {
        return $this->createactividades($data);
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

    // Alias estándar para update
    public function update($id, array $data)
    {
        return $this->updateactividades($id, $data);
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

    // Alias estándar para delete
    public function delete($id)
    {
        return $this->deleteactividades($id);
    }
}