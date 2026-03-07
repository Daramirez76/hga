<?php

namespace App\Services;

use App\Repositories\Interfaces\medicamentosInterface;
use App\Http\Requests\medicamentosRequest;

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

    public function createmedicamentos(array $data)
    {
        return $this->medicamentosRepository->createmedicamentos($data);
    }

    public function updatemedicamentos($id, array $data)
    {
        return $this->medicamentosRepository->updatemedicamentos($id, $data);
    }

    public function deletemedicamentos($id)
    {
        return $this->medicamentosRepository->deletemedicamentos($id);
    }
}