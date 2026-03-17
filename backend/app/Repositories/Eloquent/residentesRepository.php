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

    public function getresidentesById($id)
    {
        $residentes = residentes::find($id);

        return !$residentes ? null : $residentes;
    }

    public function createresidentes(array $data)
    {
        return residentes::create($data);
    }

    // Alias estándar para create
    public function create(array $data)
    {
        return $this->createresidentes($data);
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

    // Alias estándar para update
    public function update($id, array $data)
    {
        return $this->updateresidentes($id, $data);
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

    // Alias estándar para delete
    public function delete($id)
    {
        return $this->deleteresidentes($id);
    }
}