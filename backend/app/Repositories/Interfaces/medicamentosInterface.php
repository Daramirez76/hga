<?php

namespace App\Repositories\Interfaces;

interface medicamentosInterface
{
    public function getAllmedicamentos();

    public function getmedicamentosById($id);

    public function createmedicamentos(array $data);

    public function updatemedicamentos($id, array $data);

    public function deletemedicamentos($id);
}