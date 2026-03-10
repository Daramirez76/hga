<?php

namespace App\Repositories\Eloquent;
use App\Models\informes;
use App\Repositories\Interfaces\informesInterfaces;

class informesRepository implements informesInterfaces
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

    public function updateinformes($id, array $data)
    {
        $informes = informes::find($id);

        if (!$informes) {
            return null;
        }

        $informes->update($data);
        return $informes;
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
}