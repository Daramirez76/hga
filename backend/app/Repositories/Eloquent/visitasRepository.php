<?php

namespace App\Repositories\Eloquent;
use App\Models\residentes;
use App\Repositories\Interfaces\visitasInterface;

class visitasRepository implements visitasInterface
{
    public function getAllvisitas()
    {
        return visitas::all();
    }

    public function getvisitasById($id)
    {
        $visitas = visitas::find($id);

        return !$visitas ? null : $visitas;
    }

    public function createvisitas(array $data)
    {
        return visitas::create($data);
    }

    public function updatevisitas($id, array $data)
    {
        $visitas = visitas::find($id);

        if (!$visitas) {
            return null;
        }

        $visitas->update($data);
        return $visitas;
    }

    public function deletevisitas($id)
    {
        $visitas = visitas::find($id);

        if (!$visitas) {
            return null;
        }

        $visitas ->delete();
        return true;
    }
}

