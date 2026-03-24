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

    // Alias estándar para create
    public function create(array $data)
    {
        return $this->createmedicamentos($data);
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

    // Alias estándar para update
    public function update($id, array $data)
    {
        return $this->updatemedicamentos($id, $data);
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

    // Alias estándar para delete
    public function delete($id)
    {
        return $this->deletemedicamentos($id);
    }
}