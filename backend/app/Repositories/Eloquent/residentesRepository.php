<?php

namespace App\Repositories\Eloquent;
use App\Models\residentes;
use App\Repositories\Interfaces\residentesInterface;

class residentesRepository implements residentesInterface
{
    public function getAllresidentes()
    {
        return residentes::all();
    }

    public function getresidentesById(int $id)
    {
        $residentes = residentes::find($id);

        return !$residentes ? null : $residentes;
    }

    public function create(array $data)
    {
        return residentes::create($data);
    }

    public function update(int $id, array $data)
    {
        $residentes = residentes::find($id);

        if (!$residentes) {
            return null;
        }

        $residentes->update($data);
        return $residentes;
    }

    public function delete(int $id)
    {
        $residentes = residentes::find($id);

        if (!$residentes) {
            return null;
        }

        $residentes->delete();
        return true;
    }

    public function getNextCodResidente(): int
    {
        $lastCode = (int) residentes::max('cod_residente');

        return $lastCode > 0 ? $lastCode + 1 : 1;
    }
}
