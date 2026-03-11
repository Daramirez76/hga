<?php

namespace App\Services;

use App\Http\Requests\actividadesRequest;
use App\repositories\Interfaces\actividadesRepository;

class actividadesService
{
    protected $actividadesRepository;

    public function __construct(actividadesInterface $actividadesRepository)
    {
        $this->actividadesRepository = $actividadesRepository;
    }

    public function getAllactividades()
    {
        return $this->actividadesRepository->getAllactividades();
    }

    public function getactividadesById($id)
    {
        return $this->actividadesRepository->getactividadesById($id);
    }

    public function createactividades(actividadesRequest $request)
    {
        return $this->actividadesRepository->createactividades($request->validated());
    }

    public function updateactividades($id, actividadesRequest $request)
    {
        return $this->actividadesRepository->update($id, $request->validated());
    }

    public function deleteactividades($id)
    {
        return $this->actividadesRepository->delete($id);
    }
}