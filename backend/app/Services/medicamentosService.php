<?php

namespace App\Services;

use App\Repositories\Interfaces\medicamentosInterface;
use App\Http\Requests\medicamentosRequest;
use Illuminate\Support\Str;

class medicamentosService
{
    protected $medicamentosRepository;

    public function __construct(medicamentosInterface $medicamentosRepository)
    {
        $this->medicamentosRepository = $medicamentosRepository;
    }

    public function getAllmedicamentos()
    {
        return $this->medicamentosRepository->getAllmedicamentos();
    }

    public function getmedicamentosById($id)
    {
        return $this->medicamentosRepository->getmedicamentosById($id);
    }

    public function create(medicamentosRequest $request)
    {
        $data = $request->validated();
        
        // Auto-generar cod_medicamento si no viene
        if (empty($data['cod_medicamento'])) {
            $data['cod_medicamento'] = (int)(date('Ymd') . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT));
        }
        
        // Asignar cod_usuario del usuario autenticado
        if (!isset($data['cod_usuario']) || empty($data['cod_usuario'])) {
            $user = auth()->user();
            $data['cod_usuario'] = $user ? $user->id : 1;
        }
        
        // Asignar valores por defecto
        if (!isset($data['cod_residente']) || empty($data['cod_residente'])) {
            $data['cod_residente'] = 1;
        }
        
        if (!isset($data['descrip_novedad']) || empty($data['descrip_novedad'])) {
            $data['descrip_novedad'] = 'Ingreso de medicamento';
        }
        
        if (!isset($data['fecha_novedad']) || empty($data['fecha_novedad'])) {
            $data['fecha_novedad'] = now()->toDateString();
        }
        
        return $this->medicamentosRepository->createmedicamentos($data);
    }

    public function update($id, medicamentosRequest $request)
    {
        $data = $request->validated();
        return $this->medicamentosRepository->updatemedicamentos($id, $data);
    }

    public function delete($id)
    {
        return $this->medicamentosRepository->deletemedicamentos($id);
    }
}