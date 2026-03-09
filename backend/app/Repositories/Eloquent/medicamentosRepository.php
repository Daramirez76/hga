<?php

namespace App\Repositories\Eloquent;

use App\Models\medicamentos;
use App\Repositories\Interfaces\medicamentosInterface;


class medicamentosRepository implements medicamentosInterface
{
   public function getAllmedicamentos()
    {
        return medicamentos::all();
    }

    public function getmedicamentosById($id)
    {
        $medicamentos = medicamentos::find($id);

        return !$medicamentos ? null : $medicamentos;
    }

    public function createmedicamentos(array $data)
    {
        return medicamentos::create($data);
    }

    public function updatemedicamentos($id, array $data)
    {
        $medicamentos = medicamentos::find($id);

        if (!$medicamentos) {
            return null;
        }

        $medicamentos->update($data);
        return $medicamentos;
    }

    public function deletemedicamentos($id)
    {
        $medicamentos = medicamentos::find($id);

        if (!$medicamentos) {
            return null;
        }

        $medicamentos ->delete();
        return true;
    }
}