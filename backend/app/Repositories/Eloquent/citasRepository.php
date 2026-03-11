<?php

namespace App\Repositories\Eloquent;
use App\Models\citas;
use App\Repositories\Interfaces\citasInterface;

class citasRepository implements citasInterface
{
    public function getAllcitas()
    {
        return citas::all();
    }

    public function getcitasById($id)
    {
        $citas = citas::find($id);

        return !$citas ? null : $citas;
    }

    public function createcitas(array $data)
    {
        return citas::create($data);
    }

    public function updatecitas($id, array $data)
    {
        $citas = citas::find($id);

        if (!$citas) {
            return null;
        }

        $citas->update($data);
        return $citas;
    }

    public function deletecitas($id)
    {
        $citas = citas::find($id);

        if (!$citas) {
            return null;
        }

        $citas ->delete();
        return true;
    }
}