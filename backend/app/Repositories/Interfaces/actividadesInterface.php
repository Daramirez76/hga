<?php
namespace App\Repositories\Interfaces;

use Illuminate\Foundation\Http\FormRequest;

interface actividadesInterface
{
    public function getAllactividades();
    public function getactividadesById($id);
    public function createactividades(array $data);
    public function updateactividades($id, array $data);
    public function deleteactividades($id);
}