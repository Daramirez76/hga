<?php

namespace App\Services;

use App\Http\Requests\citasRequest;

use App\repositories\Interfaces\citasRepository;

class citasService
{
    protected $citasRepository;

    public function __construct(citasInterface $citasRepository)
    {
        $this->citasRepository = $citasRepository;
    }

    public function getAllcitas()
    {
        return $this->citasRepository->getAllcitas();
    }

    public function getcitasById($id)
    {
        return $this->citasRepository->getcitasById($id);
    }

    public function createcitas(citasRequest $request)
    {
        return $this->citasRepository->createcitas($request->validated());
    }

    public function updatecitas($id, citasRequest $request)
    {
        return $this->citasRepository->update($id, $request->validated());
    }

    public function deletecitas($id)
    {
        return $this->citasRepository->delete($id);
    }
}