<?php

namespace App\Repositories\Eloquent;
use App\Models\residentes;
use App\Repositories\Interfaces\residentesInterfaces;

class residentesRepository implements residentesInterfaces
{
    public function getAllresidentes()
    {
        return residentes::all();
    }

    public function getresidentesById($id)
    {
        $residentes = residentes::find($id);

        return !$residentes ? null : $residentes;
    }

    public function createresidentes(array $data)
    {
        return residentes::create($data);
    }

    public function updateresidentes($id, array $data)
    {
        $residentes = residentes::find($id);

        if (!$residentes) {
            return null;
        }

        $residentes->update($data);
        return $residentes;
    }

    public function deleteresidentes($id)
    {
        $residentes = residentes::find($id);

        if (!$residentes) {
            return null;
        }

        $residentes ->delete();
        return true;
    }
}