<?php
namespace App\Repositories\Interfaces;

use Illuminate\Foundation\Http\FormRequest;

interface citasInterface
{
    public function getAllcitas();
    public function getcitasById($id);
    public function createcitas(array $data);
    public function updatecitas($id, array $data);
    public function deletecitas($id);
}