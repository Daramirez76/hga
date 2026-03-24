<?php

namespace App\Repositories\Eloquent;
use App\Models\informes;
use App\Repositories\Interfaces\informesInterface;

class informesRepository implements informesInterface
{
    public function getAllinformes()
    {
        return informes::all();
    }

    public function getinformesById($id)
    {
        $informes = informes::find($id);

        return !$informes ? null : $informes;
    }

    public function createinformes(array $data)
    {
        return informes::create($data);
    }

    // Alias estándar para create
    public function create(array $data)
    {
        return $this->createinformes($data);
    }

    public function updateinformes($id, array $data)
    {
        $informes = informes::find($id);

        if (!$informes) {
            return null;
        }

        $informes->update($data);
        return $informes;
    }

    // Alias estándar para update
    public function update($id, array $data)
    {
        return $this->updateinformes($id, $data);
    }

    public function deleteinformes($id)
    {
        $informes = informes::find($id);

        if (!$informes) {
            return null;
        }

        $informes->delete();
        return true;
    }

    // Alias estándar para delete
    public function delete($id)
    {
        return $this->deleteinformes($id);
    }
}