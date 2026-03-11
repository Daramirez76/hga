<?php
namespace App\Repositories\Interfaces;

use Illuminate\Foundation\Http\FormRequest;

interface informesInterface
{
    public function getAllinformes();
    public function getinformesById($id);
    public function createinformes(array $data);
    public function updateinformes($id, array $data);
    public function deleteinformes($id);
}